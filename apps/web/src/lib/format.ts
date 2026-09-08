/** Formatage fr-FR : montants, dates, pourcentages. Chiffres tabulaires côté CSS (`.tabular`). */

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const num2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1284.5 → « 1 284,50 € » */
export const formatEur = (amount: number): string => eur.format(amount);
/** 5.99 → « 5,99 » (la devise est posée à part, en petit, en grotesque) */
export const formatAmount = (amount: number, decimals = 2): string =>
  decimals === 2
    ? num2.format(amount)
    : amount.toLocaleString("fr-FR", { maximumFractionDigits: decimals });
/** 149 → « 149 € » */
export const formatEurRound = (amount: number): string => eurCompact.format(amount);

/** « +248 % » */
export function formatPercent(ratio: number, signed = true): string {
  const pct = Math.round(ratio * 100);
  const sign = signed && pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("fr-FR")} %`;
}

/** « dim. 7 sept. » → « Dim. 7 sept. » */
export function formatDayKicker(date: Date): string {
  const s = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « septembre » */
export const formatMonth = (date: Date): string =>
  new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
