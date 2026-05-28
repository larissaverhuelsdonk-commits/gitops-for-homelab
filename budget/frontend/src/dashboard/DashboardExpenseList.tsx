import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "../api/types";

type Props = {
  expenses: Expense[];
};

const COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#d946ef",
];

function groupByCategory(expenses: Expense[]) {
  return expenses.reduce(
    (acc, expense) => {
      const catName = expense.category.name;
      if (!acc[catName]) acc[catName] = { total: 0, items: [] as Expense[] };
      acc[catName].total += Number(expense.amount);
      acc[catName].items.push(expense);
      return acc;
    },
    {} as Record<string, { total: number; items: Expense[] }>
  );
}

function aggregateByExpenseName(items: Expense[]) {
  const m = new Map<string, number>();
  for (const e of items) {
    const label = e.name?.trim() ? e.name.trim() : "(Unnamed)";
    m.set(label, (m.get(label) ?? 0) + Number(e.amount));
  }
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatPlainNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function DashboardExpenseList({ expenses }: Props) {
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const grouped = useMemo(() => groupByCategory(expenses), [expenses]);

  const sortedCategories = useMemo(
    () => Object.entries(grouped).sort((a, b) => b[1].total - a[1].total),
    [grouped]
  );

  const pieData = useMemo(() => {
    if (drillCategory && grouped[drillCategory]) {
      return aggregateByExpenseName(grouped[drillCategory].items);
    }
    return sortedCategories.map(([name, { total }]) => ({ name, value: total }));
  }, [drillCategory, grouped, sortedCategories]);

  const parentTotal = drillCategory && grouped[drillCategory] ? grouped[drillCategory].total : null;
  const pieTotal = useMemo(
    () => pieData.reduce((acc, current) => acc + current.value, 0),
    [pieData]
  );

  function onPieClick(entry: { name?: string }) {
    if (!entry?.name) return;
    if (drillCategory === null && grouped[entry.name]) {
      setDrillCategory(entry.name);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            This month
          </h2>
          <p className="min-h-[1.25rem] text-xs text-slate-500">
            {drillCategory
              ? "Showing spend by label in the selected category."
              : "Tap a category below or a pie slice to see spend by label."}
          </p>
        </div>
        <Link
          to="/expenses"
          className="shrink-0 text-xs font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-800"
        >
          View all
        </Link>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses yet.</p>
      ) : drillCategory && pieData.length === 0 ? (
        <p className="text-sm text-slate-500">No labeled spend in this category.</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="flex flex-col gap-4">
              <div className="min-h-[3.25rem]">
                <button
                  type="button"
                  onClick={() => setDrillCategory(null)}
                  className={`text-left text-xs font-bold uppercase tracking-wide transition-colors ${
                    drillCategory
                      ? "text-indigo-600 hover:text-indigo-800"
                      : "pointer-events-none invisible"
                  }`}
                >
                  ← Back
                </button>
                <p className="mt-1 truncate text-sm font-bold uppercase tracking-wider text-slate-900">
                  {drillCategory ?? "Categories"}
                </p>
              </div>

              {drillCategory === null
                ? sortedCategories.map(([categoryName, { total }], index) => (
                    <button
                      key={categoryName}
                      type="button"
                      onClick={() => setDrillCategory(categoryName)}
                      className="w-full border-b border-slate-100 pb-3 text-left last:border-0"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="min-w-0 truncate text-sm font-bold uppercase tracking-wider text-slate-900">
                          {categoryName}
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                          {formatPlainNumber(total)}
                        </span>
                      </span>
                    </button>
                  ))
                : pieData.map((row, index) => {
                    const pctOfCategory =
                      parentTotal && parentTotal > 0
                        ? ((row.value / parentTotal) * 100).toFixed(0)
                        : null;
                    return (
                      <div
                        key={row.name}
                        className="w-full border-b border-slate-100 pb-3 text-left last:border-0"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="min-w-0 truncate text-sm font-bold text-slate-900">
                            {row.name}
                          </span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                            {formatPlainNumber(row.value)}
                          </span>
                          {pctOfCategory !== null ? (
                            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {pctOfCategory}%
                            </span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
            </div>

            <div className="h-72 w-full max-w-[22rem] justify-self-center lg:justify-self-end">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={120}
                    paddingAngle={1}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    nameKey="name"
                    stroke="#ffffff"
                    strokeWidth={2}
                    onClick={(d) => onPieClick(d as { name?: string })}
                    className={drillCategory ? "cursor-default outline-none" : "cursor-pointer outline-none"}
                    labelLine={false}
                    label={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatPlainNumber(Number(value ?? 0))}
                    labelFormatter={(label) => {
                      const point = pieData.find((row) => row.name === String(label));
                      if (!point || pieTotal <= 0) return String(label);
                      const percent = ((point.value / pieTotal) * 100).toFixed(0);
                      return `${label} (${percent}%)`;
                    }}
                    contentStyle={{
                      borderRadius: 0,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
