const MONTH_RE = /^\d{4}-\d{2}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidMonth(month: string): boolean {
  if (!MONTH_RE.test(month)) return false;
  const [y, m] = month.split("-").map(Number);
  return m >= 1 && m <= 12 && y >= 1900 && y <= 2100;
}

export function isValidISODate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Inclusive start, exclusive end (UTC date boundaries). */
export function monthUtcRange(month: string): { start: Date; endExclusive: Date } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const endExclusive = new Date(Date.UTC(y, m, 1));
  return { start, endExclusive };
}

export function parseISODateUtc(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayISODate(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  
  const p = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function monthFromISODate(iso: string): string {
  return iso.slice(0, 7);
}
