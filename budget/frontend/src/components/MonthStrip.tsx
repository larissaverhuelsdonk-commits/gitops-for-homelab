import { currentMonth, formatMonthDisplay, shiftMonth } from "../lib/month";
import { useMonth } from "../context/MonthContext";
import { useSettings } from "../context/SettingsContext";

export function MonthStrip() {
  const { month, setMonth } = useMonth();
  const { timeZone } = useSettings();
  const nowMonth = currentMonth(timeZone);
  const showThisMonth = month !== nowMonth;

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-200 bg-white text-lg font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
        onClick={() => setMonth(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        ‹
      </button>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
        <span className="text-center text-sm font-bold capitalize tracking-tight text-neutral-900">
          {formatMonthDisplay(month, timeZone)}
        </span>
        {showThisMonth ? (
          <button
            type="button"
            className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 transition-colors hover:text-indigo-800 hover:decoration-indigo-800/40"
            onClick={() => setMonth(nowMonth)}
          >
            This month
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-200 bg-white text-lg font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
        onClick={() => setMonth(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
