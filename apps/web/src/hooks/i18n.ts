"use client";

import {
  formatDate as baseFormatDate,
  formatMoney as baseFormatMoney,
  formatPercent as baseFormatPercent,
  formatRelative as baseFormatRelative,
  type DateStyle,
  type MoneyFormatOptions,
  type MoneyLike,
  type PercentOptions,
  type TFunction,
} from "@chine/i18n";
import { useMemo } from "react";
import { useI18n } from "@/components/providers/I18nProvider";

/** `t()` lié à la locale de l'interface. */
export function useT(): TFunction {
  return useI18n().t;
}

export function useLocale() {
  const { locale, intl, setLocale } = useI18n();
  return { locale, intl, setLocale };
}

export interface Formatters {
  readonly money: (m: MoneyLike, opts?: MoneyFormatOptions) => string;
  readonly date: (d: Date | string | number, style?: DateStyle) => string;
  readonly relative: (d: Date | string | number) => string;
  readonly percent: (ratio: number, opts?: PercentOptions) => string;
}

/** Formateurs Intl liés à la locale courante (argent, dates, relatif, pourcentages). */
export function useFormat(): Formatters {
  const { locale } = useI18n();
  return useMemo<Formatters>(
    () => ({
      money: (m, opts) => baseFormatMoney(m, locale, opts),
      date: (d, style) => baseFormatDate(d, locale, style),
      relative: (d) => baseFormatRelative(d, locale),
      percent: (ratio, opts) => baseFormatPercent(ratio, locale, opts),
    }),
    [locale],
  );
}
