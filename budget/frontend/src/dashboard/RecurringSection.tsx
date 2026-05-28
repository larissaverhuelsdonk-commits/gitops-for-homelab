import { useState } from "react";
import { apiPost } from "../api/client";
import type { RecurringStatus } from "../api/types";
import { formatMoney } from "../lib/money";
import { todayISODate } from "../lib/month";
import { useSettings } from "../context/SettingsContext";

type Props = {
  items: RecurringStatus[];
  currencyCode: string;
  onLogged: () => void;
};

export function RecurringSection({
  items,
  currencyCode,
  onLogged,
}: Props) {
  const [showHidden, setShowHidden] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringStatus | null>(null);

  const visible = showHidden ? items : items.filter((i) => !i.completed || i.isCommon);
  const commonItems = visible.filter((i) => i.isCommon).sort((a, b) => a.name.localeCompare(b.name));
  const uncommonItems = visible.filter((i) => !i.isCommon).sort((a, b) => a.name.localeCompare(b.name));

  const renderItem = (r: RecurringStatus) => (
    <button
      key={r.id}
      type="button"
      disabled={r.completed && !r.isCommon}
      className={`relative flex min-h-16 flex-col items-start justify-center rounded-none border p-3 pt-4 text-left transition-colors disabled:opacity-50 ${r.category.isIncome ? "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100 disabled:hover:border-green-200 disabled:hover:bg-green-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 disabled:hover:border-slate-200 disabled:hover:bg-slate-50"}`}
      onClick={() => {
        if (!r.completed || r.isCommon) setSelectedRecurring(r);
      }}
    >
      {r.isCommon && (
        <span className="absolute -top-2.5 left-3 bg-[#a3e635] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          {r.category.isIncome ? "Income" : "Common"}
        </span>
      )}
      <span className="w-full truncate text-sm font-semibold text-slate-900">
        {r.name}
      </span>
      {r.defaultAmount != null && (
        <span className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {formatMoney(r.defaultAmount, currencyCode)}
        </span>
      )}
      {r.completed && !r.isCommon && (
        <span className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-600">Done</span>
      )}
    </button>
  );

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Recurring / Common
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-indigo-600">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="accent-indigo-600"
          />
          Show hidden
        </label>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-3 sm:grid-cols-3">
        {visible.length === 0 ? (
          <p className="col-span-full text-sm text-slate-500">
            {items.length === 0
              ? "Add recurring items in Settings."
              : "All recurring items logged for this month."}
          </p>
        ) : (
          <>
            {commonItems.map(renderItem)}
            {commonItems.length > 0 && uncommonItems.length > 0 && (
              <div className="col-span-full my-1 border-t border-slate-200" />
            )}
            {uncommonItems.map(renderItem)}
          </>
        )}
      </div>

      {selectedRecurring && (
        <RecurringConfirmModal
          item={selectedRecurring}
          currencyCode={currencyCode}
          onClose={() => setSelectedRecurring(null)}
          onDone={() => {
            setSelectedRecurring(null);
            onLogged();
          }}
        />
      )}
    </section>
  );
}

function RecurringConfirmModal({
  item,
  currencyCode,
  onClose,
  onDone,
}: {
  item: RecurringStatus;
  currencyCode: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { timeZone } = useSettings();
  const hasSubs = item.subcategories.length > 0;
  const [subcategoryId, setSubcategoryId] = useState(
    () => item.subcategories[0]?.id ?? ""
  );
  const [amount, setAmount] = useState(item.defaultAmount ?? "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Valid amount required");
      return;
    }
    if (hasSubs && !subcategoryId) {
      setErr("Choose a subcategory");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiPost("/api/expenses", {
        ...(hasSubs
          ? { recurringSubcategoryId: subcategoryId }
          : { name: item.name }),
        categoryId: item.categoryId,
        amount: n,
        date: todayISODate(timeZone),
        note: note.trim() || null,
        recurringExpenseId: item.id,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm transition-opacity md:items-center md:p-4">
      <div className="w-full max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {item.category?.isIncome
            ? item.isCommon
              ? "Log common income"
              : "Log recurring income"
            : item.isCommon
              ? "Log common expense"
              : "Log recurring expense"}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{item.name}</p>
        <div className="mt-6 flex flex-col gap-4">
          {hasSubs ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wider text-slate-500">Subcategory</span>
              <select
                className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                {item.subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Amount ({currencyCode})</span>
            <input
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span className="text-xs uppercase tracking-wider text-slate-500">Note (optional)</span>
            <input
              className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-none border border-slate-200 bg-white text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              className={`h-12 flex-1 rounded-none text-sm font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 ${item.category?.isIncome ? "bg-green-600 hover:bg-green-700 active:bg-green-800" : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"}`}
              onClick={() => void confirm()}
            >
              {item.category?.isIncome ? "Log Income" : "Log Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
