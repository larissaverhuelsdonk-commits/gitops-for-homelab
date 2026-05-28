import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Category, RecurringTemplate } from "../api/types";
import { RecurringTemplateRow } from "./RecurringTemplateRow";

type RecForm = {
  name: string;
  categoryId: string;
  defaultAmount: string;
  isCommon: boolean;
  subcategoriesText: string;
};

type Props = {
  categories: Category[];
  recurring: RecurringTemplate[];
  currencyCode: string;
  recForm: RecForm;
  setRecForm: Dispatch<SetStateAction<RecForm>>;
  onAddRecurring: () => void;
  onDeleteRecurring: (id: string) => void;
  onSaveSubcategories: (id: string, subcategories: { name: string }[]) => Promise<void>;
};

export function SettingsRecurringSection({
  categories,
  recurring,
  currencyCode,
  recForm,
  setRecForm,
  onAddRecurring,
  onDeleteRecurring,
  onSaveSubcategories,
}: Props) {
  const sortedRecurring = useMemo(() => {
    const compareByName = (a: RecurringTemplate, b: RecurringTemplate) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

    const incomeTemplates = recurring
      .filter((item) => item.category.isIncome)
      .sort(compareByName);
    const expenseTemplates = recurring
      .filter((item) => !item.category.isIncome)
      .sort(compareByName);

    return [...incomeTemplates, ...expenseTemplates];
  }, [recurring]);

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Recurring / Common Spend
      </h2>
      <p className="text-xs text-slate-500">
        Optional subcategories (e.g. store names) appear when logging this template on the dashboard; the expense name becomes the subcategory you pick.
      </p>
      <div className="flex flex-col gap-3">
        <input
          className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
          placeholder="Name (e.g. Shopping)"
          value={recForm.name}
          onChange={(e) => setRecForm((f) => ({ ...f, name: e.target.value }))}
        />
        <select
          className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
          value={recForm.categoryId}
          onChange={(e) =>
            setRecForm((f) => ({ ...f, categoryId: e.target.value }))
          }
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          <span className="uppercase tracking-wider text-slate-400">Subcategories (optional, one per line)</span>
          <textarea
            className="min-h-[72px] w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
            value={recForm.subcategoriesText}
            onChange={(e) =>
              setRecForm((f) => ({ ...f, subcategoriesText: e.target.value }))
            }
            placeholder="e.g. Villa, then Tops on the next line"
          />
        </label>
        <input
          className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus:border-indigo-600 focus:bg-white focus:outline-none"
          placeholder="Default amount (optional)"
          inputMode="decimal"
          value={recForm.defaultAmount}
          onChange={(e) =>
            setRecForm((f) => ({ ...f, defaultAmount: e.target.value }))
          }
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={recForm.isCommon}
            onChange={(e) =>
              setRecForm((f) => ({ ...f, isCommon: e.target.checked }))
            }
            className="accent-indigo-600"
          />
          Common spend (doesn&apos;t hide after logging)
        </label>
        <button
          type="button"
          className="mt-1 h-11 w-full rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          onClick={() => void onAddRecurring()}
        >
          Add template
        </button>
      </div>
      <ul className="flex flex-col gap-2 pt-2">
        {sortedRecurring.map((r) => (
          <RecurringTemplateRow
            key={r.id}
            item={r}
            currencyCode={currencyCode}
            onDelete={onDeleteRecurring}
            onSaveSubcategories={onSaveSubcategories}
          />
        ))}
      </ul>
    </section>
  );
}
