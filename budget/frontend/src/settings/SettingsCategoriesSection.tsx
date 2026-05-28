import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../api/types";

type Props = {
  categories: Category[];
  budgets: Record<string, string>;
  setBudgets: Dispatch<SetStateAction<Record<string, string>>>;
  catName: string;
  setCatName: (v: string) => void;
  onAddCategory: () => void;
  onSaveBudget: (id: string) => void;
  onDeleteCategory: (id: string) => void;
};

export function SettingsCategoriesSection({
  categories,
  budgets,
  setBudgets,
  catName,
  setCatName,
  onAddCategory,
  onSaveBudget,
  onDeleteCategory,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Categories
      </h2>
      <div className="flex min-w-0 gap-2">
        <input
          className="h-11 min-w-0 flex-1 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
          placeholder="New category"
          value={catName}
          onChange={(e) => setCatName(e.target.value)}
        />
        <button
          type="button"
          className="h-11 shrink-0 rounded-none bg-indigo-600 px-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 sm:px-6"
          onClick={() => void onAddCategory()}
        >
          Add
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-slate-100">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex min-w-0 items-center gap-2 py-3 sm:gap-3"
          >
            <span className="w-[30%] max-w-[7.5rem] shrink-0 truncate whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-900 sm:max-w-[9rem] sm:text-sm flex items-center gap-1.5">
              {c.name}
              {c.isIncome ? (
                <span className="shrink-0 whitespace-nowrap bg-green-100 px-1 py-0.5 text-[9px] font-bold uppercase text-green-700">
                  Income
                </span>
              ) : null}
            </span>
            {!c.isIncome ? (
              <>
                <input
                  className="h-9 min-w-0 flex-1 rounded-none border border-slate-200 bg-slate-50 px-2 text-sm tabular-nums transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none sm:max-w-[7rem] sm:flex-none sm:px-3"
                  placeholder="Budget"
                  inputMode="decimal"
                  aria-label={`Budget for ${c.name}`}
                  value={budgets[c.id] ?? ""}
                  onChange={(e) =>
                    setBudgets((b) => ({ ...b, [c.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="h-9 shrink-0 rounded-none border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 sm:px-3 sm:text-xs"
                  onClick={() => void onSaveBudget(c.id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="h-9 shrink-0 rounded-none border border-red-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 sm:px-3 sm:text-xs"
                  onClick={() => void onDeleteCategory(c.id)}
                >
                  Del
                </button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
