/**
 * client/lib/currency.ts
 * Central NPR (Nepalese Rupee) formatter.
 * Import { fmt, fmtShort, CURRENCY_SYMBOL } from "@/lib/currency"
 */

export const CURRENCY_SYMBOL = "Rs.";
export const CURRENCY_CODE = "NPR";

/** रू 12,500.00 */
export function fmt(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return `${CURRENCY_SYMBOL} ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** रू 12,500 (no decimals) */
export function fmtShort(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return `${CURRENCY_SYMBOL} ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** रू 1.25L / रू 50K */
export function fmtCompact(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  if (n >= 10_000_000) return `${CURRENCY_SYMBOL} ${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000) return `${CURRENCY_SYMBOL} ${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000) return `${CURRENCY_SYMBOL} ${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}