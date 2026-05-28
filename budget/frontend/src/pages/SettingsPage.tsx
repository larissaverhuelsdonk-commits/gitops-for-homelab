import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut, apiPatch } from "../api/client";
import type { Category, RecurringTemplate } from "../api/types";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { SettingsCategoriesSection } from "../settings/SettingsCategoriesSection";
import { SettingsAccountSection } from "../settings/SettingsAccountSection";
import { SettingsRecurringSection } from "../settings/SettingsRecurringSection";
import { SettingsAdminSection } from "../settings/SettingsAdminSection";
import { CURRENCY_CODES } from "../settings/currencies";

function compareNames(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function compareCategories(a: Category, b: Category) {
  if (a.isIncome !== b.isIncome) return a.isIncome ? -1 : 1;
  return compareNames(a, b);
}

export function SettingsPage() {
  const { user } = useAuth();
  const { currencyCode, timeZone, updateSettings } = useSettings();
  const [domainName, setDomainName] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurring, setRecurring] = useState<RecurringTemplate[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [recForm, setRecForm] = useState({
    name: "",
    categoryId: "",
    defaultAmount: "",
    isCommon: false,
    subcategoriesText: "",
  });

  const load = useCallback(async () => {
    setErr(null);
    try {
      const promises: Array<Promise<any>> = [
        apiGet<Category[]>("/api/categories"),
        apiGet<RecurringTemplate[]>("/api/recurring-expenses"),
        apiGet<{ domainName: string }>("/api/app-settings"),
      ];
      if (user?.role === "ADMIN") {
        promises.push(apiGet<{ signupsEnabled: boolean }>("/api/system-settings"));
      }
      const results = await Promise.all(promises);
      const c = results[0] as Category[];
      const r = results[1] as RecurringTemplate[];
      const s = results[2] as { domainName: string };
      
      setCategories(c);
      setRecurring(r);
      setDomainName(s.domainName ?? "");
      
      if (user?.role === "ADMIN" && results[3]) {
        setSignupsEnabled((results[3] as { signupsEnabled: boolean }).signupsEnabled);
      }
      
      const b: Record<string, string> = {};
      for (const x of c) {
        b[x.id] = x.budget?.monthlyAmount ?? "";
      }
      setBudgets(b);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedCategories = useMemo(
    () => [...categories].sort(compareCategories),
    [categories],
  );

  useEffect(() => {
    if (sortedCategories.length > 0) {
      setRecForm((f) =>
        f.categoryId ? f : { ...f, categoryId: sortedCategories[0].id }
      );
    }
  }, [sortedCategories]);

  async function saveDomain() {
    try {
      await apiPatch("/api/app-settings", { domainName: domainName.trim() });
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save domain");
    }
  }

  async function addCategory() {
    if (!catName.trim()) return;
    try {
      await apiPost("/api/categories", { name: catName.trim() });
      setCatName("");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function saveBudget(categoryId: string) {
    const v = Number(budgets[categoryId]);
    if (!Number.isFinite(v) || v < 0) {
      setErr("Budget must be a non-negative number");
      return;
    }
    try {
      await apiPut(`/api/categories/${categoryId}/budget`, {
        monthlyAmount: v,
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete category?")) return;
    try {
      await apiDelete(`/api/categories/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function addRecurring() {
    if (!recForm.name.trim() || !recForm.categoryId) return;
    const subcategories = recForm.subcategoriesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    const payload: Record<string, unknown> = {
      name: recForm.name.trim(),
      categoryId: recForm.categoryId,
      isCommon: recForm.isCommon,
    };
    if (recForm.defaultAmount.trim()) {
      const n = Number(recForm.defaultAmount);
      if (Number.isFinite(n) && n > 0) payload.defaultAmount = n;
    }
    if (subcategories.length > 0) payload.subcategories = subcategories;
    try {
      await apiPost("/api/recurring-expenses", payload);
      setRecForm((f) => ({
        ...f,
        name: "",
        defaultAmount: "",
        isCommon: false,
        subcategoriesText: "",
      }));
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function saveRecurringSubcategories(
    id: string,
    subcategories: { name: string }[]
  ) {
    setErr(null);
    try {
      await apiPatch(`/api/recurring-expenses/${id}`, { subcategories });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save subcategories");
      throw e;
    }
  }

  async function deleteRecurring(id: string) {
    if (!window.confirm("Delete recurring template?")) return;
    try {
      await apiDelete(`/api/recurring-expenses/${id}`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          General
        </h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Currency</span>
            <select
              className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={currencyCode}
              onChange={(e) => void updateSettings({ currencyCode: e.target.value })}
            >
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Timezone</span>
            <select
              className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={timeZone}
              onChange={(e) => void updateSettings({ timeZone: e.target.value })}
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Domain Name</span>
            <div className="flex gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
                placeholder="e.g. my-app.ngrok.io"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <button
                type="button"
                className="h-10 shrink-0 rounded-none bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                onClick={() => void saveDomain()}
              >
                {domainSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </label>
        </div>
      </section>

      {user?.role === "ADMIN" && (
        <SettingsAdminSection signupsEnabled={signupsEnabled} onRefresh={load} />
      )}

      <SettingsAccountSection />

      <SettingsCategoriesSection
        categories={sortedCategories}
        budgets={budgets}
        setBudgets={setBudgets}
        catName={catName}
        setCatName={setCatName}
        onAddCategory={addCategory}
        onSaveBudget={saveBudget}
        onDeleteCategory={deleteCategory}
      />

      <SettingsRecurringSection
        categories={sortedCategories}
        recurring={recurring}
        currencyCode={currencyCode}
        recForm={recForm}
        setRecForm={setRecForm}
        onAddRecurring={addRecurring}
        onDeleteRecurring={deleteRecurring}
        onSaveSubcategories={saveRecurringSubcategories}
      />
    </div>
  );
}
