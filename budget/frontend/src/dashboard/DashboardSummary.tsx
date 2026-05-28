// -------- THIS CODE BELOW IS LOCKED AND CAN NOT BE EDITED UNLESS IT IS UNLOCKED BY THE USER -------------
import type { DashboardResponse } from "../api/types";

type Props = {
  data: DashboardResponse;
};

export function DashboardSummary({ data }: Props) {
  const { totals } = data;
  const actual = totals.actual;
  const budget = totals.budget;
  const income = totals.income;
  const saved = income - actual;
  const overBudget = actual > budget;

  const scaleMax = Math.max(budget, actual, income, 1);
  const toPercent = (value: number) => Math.max(0, (value / scaleMax) * 100);

  const topActual = Math.min(actual, budget);
  const topRemaining = Math.max(0, budget - actual);
  const topOverspend = Math.max(0, actual - budget);
  const topSeparatorPct = toPercent(actual);

  const bottomSpent = Math.min(actual, budget);
  const bottomLostSavings = Math.max(0, actual - budget);
  const bottomSaved = Math.max(0, saved);
  const bottomSeparatorPct = toPercent(actual);

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Month overview
      </h2>
      <div className="flex flex-col gap-4">
        <OverviewBar
          topLabel="Actual"
          topValue={actual}
          bottomLabel="Budget"
          bottomValue={budget}
          bottomValueClassName={overBudget ? "text-rose-600" : "text-slate-900"}
          separatorPct={topSeparatorPct}
          segments={[
            { widthPct: toPercent(topActual), colorClass: "bg-amber-400" },
            { widthPct: toPercent(topRemaining), colorClass: "bg-emerald-400" },
            { widthPct: toPercent(topOverspend), colorClass: "bg-red-500" },
          ]}
        />
        <OverviewBar
          topLabel="Income"
          topValue={income}
          bottomLabel="Saved"
          bottomValue={saved}
          separatorPct={bottomSeparatorPct}
          segments={[
            { widthPct: toPercent(bottomSpent), colorClass: "bg-slate-500" },
            { widthPct: toPercent(bottomLostSavings), colorClass: "bg-slate-900" },
            { widthPct: toPercent(bottomSaved), colorClass: "bg-blue-600" },
          ]}
        />
      </div>
    </section>
  );
}

type Segment = {
  widthPct: number;
  colorClass: string;
};

type OverviewBarProps = {
  topLabel: string;
  topValue: number;
  bottomLabel: string;
  bottomValue: number;
  separatorPct: number;
  segments: Segment[];
  bottomValueClassName?: string;
};

function OverviewBar({
  topLabel,
  topValue,
  bottomLabel,
  bottomValue,
  separatorPct,
  segments,
  bottomValueClassName,
}: OverviewBarProps) {
  const clampedSeparator = Math.max(0, Math.min(100, separatorPct));

  return (
    <div className="relative pt-6 pb-6">
      {/* Top Label Layer */}
      <div className="absolute top-0 left-0 w-full flex items-center">
        <p className="flex w-[8.5rem] shrink-0 items-baseline justify-between bg-white pr-2 z-10">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {topLabel}
          </span>
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {formatPlainNumber(topValue)}
          </span>
        </p>
      </div>

      {/* Full Width Bar Layer */}
      <div className="w-full h-5 relative z-0">
        <span className="relative block h-full w-full overflow-visible rounded-sm">
          <span className="flex h-full w-full overflow-hidden rounded-sm">
            {segments.map((segment, index) => (
              <span
                key={`${segment.colorClass}-${index}`}
                className={`h-full ${segment.colorClass}`}
                style={{ width: `${segment.widthPct}%` }}
              />
            ))}
          </span>
          <span
            className="absolute top-[-4px] h-7 w-px bg-slate-300"
            style={{ left: `${clampedSeparator}%` }}
          />
        </span>
      </div>

      {/* Bottom Label Layer */}
      <div className="absolute bottom-0 left-0 w-full flex items-center">
        <p className="flex w-[8.5rem] shrink-0 items-baseline justify-between bg-white pr-2 z-10">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {bottomLabel}
          </span>
          <span
            className={`text-sm font-semibold tabular-nums ${
              bottomValueClassName ?? "text-slate-900"
            }`}
          >
            {formatPlainNumber(bottomValue)}
          </span>
        </p>
      </div>
    </div>
  );
}

function formatPlainNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
// ----------- THE CODE ABOVE IS LOCKED AND CAN NOT BE EDITED UNLESS IT IS UNLOCKED BY THE USER ------------
