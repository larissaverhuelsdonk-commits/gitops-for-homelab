import { useState } from "react";
import type { RecurringTemplate } from "../api/types";
import { formatMoney } from "../lib/money";

type Props = {
  item: RecurringTemplate;
  currencyCode: string;
  onDelete: (id: string) => void;
  onSaveSubcategories: (
    id: string,
    subcategories: { name: string }[],
  ) => Promise<void>;
};

export function RecurringTemplateRow({
  item,
  currencyCode,
  onDelete,
  onSaveSubcategories,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(item.subcategories.map((s) => s.name).join("\n"));
    setEditing(true);
  }

  async function saveSubs() {
    const lines = draft
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    setSaving(true);
    try {
      await onSaveSubcategories(item.id, lines);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-none border border-slate-200 bg-white px-2 py-2 shadow-sm transition-colors hover:border-slate-300 sm:px-3 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
          <span className="min-w-0 truncate text-sm font-bold text-slate-900">
            {item.name}
          </span>
          {item.isCommon ? (
            <span className="shrink-0 whitespace-nowrap bg-slate-100 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-500">
              Com
            </span>
          ) : null}
          {item.category.isIncome ? (
            <span className="shrink-0 whitespace-nowrap bg-green-100 px-1 py-0.5 text-[9px] font-bold uppercase text-green-700">
              Income
            </span>
          ) : null}
          <span className="max-w-[32%] shrink truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {item.category.name}
          </span>
          {item.defaultAmount != null ? (
            <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-slate-900">
              {formatMoney(item.defaultAmount, currencyCode)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="h-8 shrink-0 rounded-none border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 sm:h-9 sm:px-2 sm:text-xs"
          onClick={() => (editing ? setEditing(false) : startEdit())}
        >
          {editing ? "Close" : "Subs"}
        </button>
        <button
          type="button"
          className="h-8 shrink-0 rounded-none border border-red-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 sm:h-9 sm:px-3 sm:text-xs"
          onClick={() => void onDelete(item.id)}
        >
          Del
        </button>
      </div>
      {!editing && item.subcategories.length > 0 ? (
        <p className="pl-0.5 text-xs text-slate-500">
          {item.subcategories.map((s) => s.name).join(" · ")}
        </p>
      ) : null}
      {editing ? (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            <span className="uppercase tracking-wider text-slate-400">
              One subcategory per line
            </span>
            <textarea
              className="min-h-[88px] w-full rounded-none border border-slate-200 bg-slate-50 px-2 py-2 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Villa (one name per line)"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            className="h-9 w-full rounded-none bg-indigo-600 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            onClick={() => void saveSubs()}
          >
            Save subcategories
          </button>
        </div>
      ) : null}
    </li>
  );
}
