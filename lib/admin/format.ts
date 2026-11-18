/** Pesewas (1/100 GH₵) to a display string. */
export function ghs(pesewas: number, opts: { decimals?: boolean } = {}): string {
  const value = pesewas / 100;
  const decimals = opts.decimals ?? Math.abs(value) < 1000;
  return `GH₵ ${value.toLocaleString("en-GH", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

/** GH₵ amount typed by the founder (e.g. "1,250.50") to pesewas, or null if invalid. */
export function parseGhsToPesewas(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "").replace(/^GH₵/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** Change vs the previous period, as a signed percentage. null when there was no baseline. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const longDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const monthLabel = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
