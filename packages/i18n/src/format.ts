/** Formatage Intl sans dépendance : argent, dates, relatif, pourcentages. */
import { intlLocale } from "./t";
import type { Locale } from "./types";

export interface MoneyLike {
  readonly minor: number;
  readonly currency: string;
}

const MINOR_UNITS: Readonly<Record<string, number>> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  CHF: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
};
const CURRENCY_SYMBOL: Readonly<Record<string, string>> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
};

export const minorUnits = (currency: string): number => MINOR_UNITS[currency] ?? 2;
export const currencySymbol = (currency: string): string => CURRENCY_SYMBOL[currency] ?? currency;
/** 2000 → 20 (EUR) ; 2000 → 2000 (JPY). */
export const toAmount = (m: MoneyLike): number => m.minor / 10 ** minorUnits(m.currency);
/** 20.5 → 2050 (EUR). */
export const toMinor = (amount: number, currency: string): number =>
  Math.round(amount * 10 ** minorUnits(currency));

const toIntl = (locale: Locale | string): string =>
  locale === "fr" || locale === "en" || locale === "de" ? intlLocale(locale) : locale;

export interface MoneyFormatOptions {
  /** Sans décimales quand le montant est rond : « 75 € » au lieu de « 75,00 € ». */
  readonly compact?: boolean;
  /** Affichage du signe : « +49,65 € » pour une marge. */
  readonly signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /** Sans symbole : « 49,65 » (reçus, colonnes alignées). */
  readonly symbol?: boolean;
}

/** `{ minor: 128450, currency: "EUR" }` → « 1 284,50 € » (fr) / « €1,284.50 » (en). */
export function formatMoney(
  m: MoneyLike,
  locale: Locale | string = "fr",
  opts: MoneyFormatOptions = {},
): string {
  const digits = minorUnits(m.currency);
  const amount = toAmount(m);
  const isRound = Number.isInteger(amount);
  const common: Intl.NumberFormatOptions = {
    minimumFractionDigits: opts.compact && isRound ? 0 : digits,
    maximumFractionDigits: digits,
    signDisplay: opts.signDisplay ?? "auto",
  };
  if (opts.symbol === false) return new Intl.NumberFormat(toIntl(locale), common).format(amount);
  try {
    return new Intl.NumberFormat(toIntl(locale), {
      ...common,
      style: "currency",
      currency: m.currency,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(toIntl(locale), common).format(amount)} ${currencySymbol(m.currency)}`;
  }
}

export interface MoneyParts {
  /** Signe éventuel : « − » ou « + ». */
  readonly sign: string;
  /** Partie entière formatée : « 1 284 ». */
  readonly integer: string;
  /** Séparateur décimal + décimales : « ,50 » (vide si compact et rond). */
  readonly fraction: string;
  /** Symbole : « € ». */
  readonly symbol: string;
  /** Texte complet, accessible. */
  readonly text: string;
}

/** Morceaux d'un montant pour la typographie « hero » (chiffres en sérif, devise en petit). */
export function formatMoneyParts(
  m: MoneyLike,
  locale: Locale | string = "fr",
  opts: MoneyFormatOptions = {},
): MoneyParts {
  const digits = minorUnits(m.currency);
  const amount = toAmount(m);
  const isRound = Number.isInteger(amount);
  const parts = new Intl.NumberFormat(toIntl(locale), {
    minimumFractionDigits: opts.compact && isRound ? 0 : digits,
    maximumFractionDigits: digits,
    signDisplay: opts.signDisplay ?? "auto",
  }).formatToParts(amount);
  let sign = "";
  let integer = "";
  let fraction = "";
  for (const p of parts) {
    if (p.type === "minusSign" || p.type === "plusSign") sign += p.value;
    else if (p.type === "integer" || p.type === "group") integer += p.value;
    else if (p.type === "decimal" || p.type === "fraction") fraction += p.value;
  }
  const symbol = currencySymbol(m.currency);
  return { sign, integer, fraction, symbol, text: formatMoney(m, locale, opts) };
}

export type DateStyle = "short" | "medium" | "long" | "weekday" | "monthYear" | "time" | "dateTime";

const toDate = (d: Date | string | number): Date => (d instanceof Date ? d : new Date(d));

/** `"2026-09-07"` → « 7 sept. 2026 » (medium) / « dim. 7 sept. » (weekday) / « septembre 2026 » (monthYear). */
export function formatDate(
  d: Date | string | number,
  locale: Locale | string = "fr",
  style: DateStyle = "medium",
): string {
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return "";
  const l = toIntl(locale);
  const opts: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "numeric", month: "numeric", year: "2-digit" }
      : style === "long"
        ? { day: "numeric", month: "long", year: "numeric" }
        : style === "weekday"
          ? { weekday: "short", day: "numeric", month: "short" }
          : style === "monthYear"
            ? { month: "long", year: "numeric" }
            : style === "time"
              ? { hour: "2-digit", minute: "2-digit" }
              : style === "dateTime"
                ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(l, opts).format(date);
}

const DIVISIONS: ReadonlyArray<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** « hier », « il y a 3 j », « dans 2 sem. » — `numeric: auto` pour « aujourd'hui / hier ». */
export function formatRelative(
  d: Date | string | number,
  locale: Locale | string = "fr",
  now: Date = new Date(),
  opts: { style?: "short" | "long"; numeric?: "auto" | "always" } = {},
): string {
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return "";
  let duration = (date.getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(toIntl(locale), {
    numeric: opts.numeric ?? "auto",
    style: opts.style ?? "short",
  });
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      if (division.unit === "second" && Math.abs(duration) < 45)
        return rtf.format(0, "second").replace(/^.*0.*$/, rtf.format(0, "second"));
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "year");
}

/** Jours calendaires entre deux dates (positif si `d` est passé). */
export function daysBetween(d: Date | string | number, now: Date = new Date()): number {
  const a = toDate(d);
  const startA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const startB = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startB - startA) / 86_400_000);
}

export interface PercentOptions {
  /** « +248 % » / « −12 % » ; zéro sans signe. */
  readonly signed?: boolean;
  readonly digits?: number;
}

/** 2.4825 → « +248 % » (signed) ; 0.64 → « 64 % ». Entrée = ratio (1 = 100 %). */
export function formatPercent(
  ratio: number,
  locale: Locale | string = "fr",
  opts: PercentOptions = {},
): string {
  if (!Number.isFinite(ratio)) return "—";
  return new Intl.NumberFormat(toIntl(locale), {
    style: "percent",
    maximumFractionDigits: opts.digits ?? 0,
    minimumFractionDigits: opts.digits ?? 0,
    signDisplay: opts.signed ? "exceptZero" : "auto",
  }).format(ratio);
}

/** 1284.5 → « 1 284,5 » (fr). */
export function formatNumber(
  n: number,
  locale: Locale | string = "fr",
  opts: { digits?: number; signed?: boolean; compact?: boolean } = {},
): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(toIntl(locale), {
    maximumFractionDigits: opts.digits ?? 2,
    minimumFractionDigits: 0,
    signDisplay: opts.signed ? "exceptZero" : "auto",
    ...(opts.compact ? { notation: "compact" as const } : {}),
  }).format(n);
}

/** « 12 kg », « 42 cm » — unités courtes avec espace insécable localisé. */
export function formatUnit(
  n: number,
  unit: "kilogram" | "centimeter" | "day",
  locale: Locale | string = "fr",
): string {
  return new Intl.NumberFormat(toIntl(locale), {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}
