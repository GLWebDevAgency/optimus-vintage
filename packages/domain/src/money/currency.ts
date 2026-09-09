export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Nombre de décimales de l'unité mineure (ISO 4217). */
export const MINOR_UNITS: Readonly<Record<Currency, 0 | 2>> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  CHF: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
};

export const CURRENCY_SYMBOL: Readonly<Record<Currency, string>> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
};

export function isCurrency(s: string): s is Currency {
  return (CURRENCIES as readonly string[]).includes(s);
}
