export function currentDateInZone(timeZone: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  
  const p = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
  };
}

export function currentMonth(timeZone: string): string {
  const { year, month } = currentDateInZone(timeZone);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, mo] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** `YYYY-MM` → e.g. `August - 2026` (UTC month, for UI labels). */
export function formatMonthDisplay(month: string, timeZone: string): string {
  if (!isValidMonth(month)) return month;
  const [y, mo] = month.split("-").map(Number);
  // We use the 15th to avoid timezone shift issues at the edge of the month
  const d = new Date(Date.UTC(y, mo - 1, 15));
  const name = new Intl.DateTimeFormat(undefined, {
    month: "long",
    timeZone,
  }).format(d);
  return `${name} - ${y}`;
}

export function todayISODate(timeZone: string): string {
  const { year, month, day } = currentDateInZone(timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
