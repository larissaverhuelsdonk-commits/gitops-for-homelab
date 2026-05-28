export function dec(d: { toString(): string } | null | undefined): string {
  if (d == null) return "0";
  return d.toString();
}
