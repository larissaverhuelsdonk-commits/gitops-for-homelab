import { useState } from "react";
import { apiPost } from "../api/client";
import type { Category } from "../api/types";
import { todayISODate } from "../lib/month";
import { useSettings } from "../context/SettingsContext";

type Props = {
  categories: Category[];
  onAdded: () => void;
};

export function QuickAddExpense({ categories, onAdded }: Props) {
  const { timeZone } = useSettings();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) {
      setErr("Enter a name");
      return;
    }
    if (!categoryId) {
      setErr("Pick a category");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Enter a valid amount");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await apiPost("/api/expenses", {
        name: name.trim(),
        categoryId,
        amount: n,
        date: todayISODate(timeZone),
        note: note.trim() || null,
      });
      setName("");
      setAmount("");
      setNote("");
      setCategoryId(null);
      setOpen(false);
      onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="h-9 rounded-none bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "+ Add"}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-none border border-slate-200 bg-white p-5 shadow-xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Quick add
          </h2>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wider text-slate-500">Name</span>
              <input
                className="h-10 rounded-none border border-slate-200 bg-slate-50 px-3 text-base transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coffee"
              />
            </label>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Category</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.filter(c => !c.isIncome).map((c) => {
                  const isIncome = c.isIncome;
                  return (
                  <button
                    key={c.id}
                    type="button"
                    className={`h-10 rounded-none border text-xs font-bold uppercase tracking-wider transition-colors ${
                      categoryId === c.id
                        ? (isIncome ? "border-green-600 bg-green-600 text-white" : "border-indigo-600 bg-indigo-600 text-white")
                        : (isIncome ? "border-slate-200 bg-slate-50 text-green-700 hover:border-green-300 hover:bg-green-50" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50")
                    }`}
                    onClick={() => setCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                )})}
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wider text-slate-500">Amount</span>
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
            <button
              type="button"
              disabled={saving}
              className="mt-2 h-12 w-full rounded-none border border-slate-200 bg-white text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
              onClick={submit}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
