import { useEffect, useState } from "react";
import { apiDelete } from "../api/client";
import type { Expense } from "../api/types";
import { formatMoney } from "../lib/money";

type Props = {
  expense: Expense;
  currencyCode: string;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteExpenseConfirmModal({
  expense,
  currencyCode,
  onClose,
  onDeleted,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function confirm() {
    setBusy(true);
    setErr(null);
    try {
      await apiDelete(`/api/expenses/${expense.id}`);
      onDeleted();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const title = expense.name?.trim() || "Unnamed";

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-expense-title"
      >
        <h2 id="delete-expense-title" className="text-lg font-bold tracking-tight text-slate-900">
          Delete this expense?
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="text-slate-400"> · </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {formatMoney(expense.amount, currencyCode)}
          </span>
          <span className="text-slate-400"> · </span>
          <span className="uppercase tracking-wide text-slate-500">{expense.category.name}</span>
        </p>
        <p className="mt-2 text-sm text-slate-500">This cannot be undone.</p>
        {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            className="h-12 flex-1 rounded-none border border-slate-200 bg-white text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="h-12 flex-1 rounded-none border border-red-300 bg-red-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
            onClick={() => void confirm()}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
