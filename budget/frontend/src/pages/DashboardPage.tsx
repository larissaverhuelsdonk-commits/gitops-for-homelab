import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type {
  Category,
  DashboardResponse,
  Expense,
  RecurringStatus,
} from "../api/types";
import { useSettings } from "../context/SettingsContext";
import { useMonth } from "../context/MonthContext";
import { DailySpendChart } from "../dashboard/DailySpendChart";
import { DashboardExpenseList } from "../dashboard/DashboardExpenseList";
import { DashboardSummary } from "../dashboard/DashboardSummary";
import { QuickAddExpense } from "../dashboard/QuickAddExpense";
import { RecurringSection } from "../dashboard/RecurringSection";

export function DashboardPage() {
  const { month } = useMonth();
  const { currencyCode } = useSettings();
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [recurring, setRecurring] = useState<RecurringStatus[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [d, r, ex, cat] = await Promise.all([
        apiGet<DashboardResponse>(`/api/dashboard?month=${month}`),
        apiGet<RecurringStatus[]>(`/api/recurring-expenses/status?month=${month}`),
        apiGet<Expense[]>(`/api/expenses?month=${month}`),
        apiGet<Category[]>("/api/categories"),
      ]);
      setDash(d);
      setRecurring(r);
      setExpenses(ex);
      setCategories(cat);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  if (err && !dash) {
    return <p className="text-sm text-red-600">{err}</p>;
  }
  if (!dash) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <QuickAddExpense categories={categories} onAdded={load} />
      </div>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      
      <DashboardSummary data={dash} />
      <DailySpendChart data={dash} currencyCode={currencyCode} />
      <RecurringSection
        items={recurring}
        currencyCode={currencyCode}
        onLogged={load}
      />
      <DashboardExpenseList
        expenses={expenses.filter(e => !e.category.isIncome)}
      />
    </div>
  );
}
