/**
 * 🌍 INTERNATIONALIZATION (i18n) CONFIGURATION
 *
 * Multi-language support for global app domination
 * Supports: French, English, German (extensible)
 *
 * Usage:
 * import { t, useLocale, formatCurrency, formatDate } from '@/utils/i18n';
 *
 * function MyComponent() {
 *   const { t, locale, changeLocale } = useLocale();
 *   return <Text>{t('dashboard.revenue')}</Text>;
 * }
 */

import * as Localization from "expo-localization";
import i18n from "i18next";
import { useCallback, useEffect, useState } from "react";
import { initReactI18next, useTranslation } from "react-i18next";

// Import translations
import de from "@/locales/de.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export type SupportedLocale = "fr" | "en" | "de";

export const SUPPORTED_LOCALES: {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
];

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  de: { translation: de },
};

// Get device locale
function getDeviceLocale(): SupportedLocale {
  const deviceLocales = Localization.getLocales();
  const deviceLanguage = deviceLocales[0]?.languageCode ?? "en";

  // Check if device language is supported
  if (Object.keys(resources).includes(deviceLanguage)) {
    return deviceLanguage as SupportedLocale;
  }

  // Default to French (primary market)
  return "fr";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 INITIALIZE i18n
// ═══════════════════════════════════════════════════════════════════════════════

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: "en",
  compatibilityJSON: "v4",

  interpolation: {
    escapeValue: false, // React already escapes
  },

  react: {
    useSuspense: false, // Avoid Suspense issues in React Native
  },
});

export default i18n;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main hook for translations and locale management
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { t, locale, changeLocale, locales } = useLocale();
 *
 *   return (
 *     <>
 *       <Text>{t('dashboard.title')}</Text>
 *       <Picker value={locale} onChange={changeLocale}>
 *         {locales.map(l => (
 *           <Picker.Item key={l.code} value={l.code} label={l.nativeName} />
 *         ))}
 *       </Picker>
 *     </>
 *   );
 * }
 * ```
 */
export function useLocale() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [locale, setLocale] = useState<SupportedLocale>(
    i18nInstance.language as SupportedLocale,
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLocale(lng as SupportedLocale);
    };

    i18nInstance.on("languageChanged", handleLanguageChanged);
    return () => {
      i18nInstance.off("languageChanged", handleLanguageChanged);
    };
  }, [i18nInstance]);

  const changeLocale = useCallback(
    async (newLocale: SupportedLocale) => {
      await i18nInstance.changeLanguage(newLocale);
    },
    [i18nInstance],
  );

  return {
    t,
    locale,
    changeLocale,
    locales: SUPPORTED_LOCALES,
    isRTL: false, // Add RTL support when needed (Arabic, Hebrew)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 CURRENCY FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF" | "JPY";

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; position: "before" | "after"; separator: string }
> = {
  EUR: { symbol: "€", position: "after", separator: " " },
  USD: { symbol: "$", position: "before", separator: "" },
  GBP: { symbol: "£", position: "before", separator: "" },
  CHF: { symbol: "CHF", position: "after", separator: " " },
  JPY: { symbol: "¥", position: "before", separator: "" },
};

/**
 * Format a number as currency
 *
 * @example
 * formatCurrency(1234.56, 'EUR', 'fr') // "1 234,56 €"
 * formatCurrency(1234.56, 'USD', 'en') // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de') // "1.234,56 €"
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = "EUR",
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  // Use Intl.NumberFormat for proper locale-aware formatting
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback for unsupported locales
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;
    const formatted = value.toFixed(2);
    return config.position === "before"
      ? `${config.symbol}${config.separator}${formatted}`
      : `${formatted}${config.separator}${config.symbol}`;
  }
}

/**
 * Format currency with compact notation for large numbers
 *
 * @example
 * formatCurrencyCompact(1234567, 'EUR', 'fr') // "1,23 M€"
 */
export function formatCurrencyCompact(
  value: number,
  currency: CurrencyCode = "EUR",
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    // Fallback
    if (value >= 1_000_000) {
      return formatCurrency(value / 1_000_000, currency, locale) + "M";
    }
    if (value >= 1_000) {
      return formatCurrency(value / 1_000, currency, locale) + "k";
    }
    return formatCurrency(value, currency, locale);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 DATE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format a date according to locale
 *
 * @example
 * formatDate(new Date(), 'fr') // "25 janv. 2026"
 * formatDate(new Date(), 'en') // "Jan 25, 2026"
 * formatDate(new Date(), 'de') // "25. Jan. 2026"
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = i18n.language as SupportedLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  try {
    return new Intl.DateTimeFormat(
      getIntlLocale(locale),
      options || defaultOptions,
    ).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format a date as relative time
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000), 'fr') // "il y a 1 heure"
 */
export function formatRelativeTime(
  date: Date | string,
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  try {
    const rtf = new Intl.RelativeTimeFormat(getIntlLocale(locale), {
      numeric: "auto",
    });

    if (diffDays > 0) return rtf.format(-diffDays, "day");
    if (diffHours > 0) return rtf.format(-diffHours, "hour");
    if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");
    return rtf.format(-diffSeconds, "second");
  } catch {
    // Fallback
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return "just now";
  }
}

/**
 * Format date for display in short format
 */
export function formatDateShort(
  date: Date | string,
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  return formatDate(date, locale, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  return formatDate(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔢 NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format a number according to locale
 *
 * @example
 * formatNumber(1234567.89, 'fr') // "1 234 567,89"
 * formatNumber(1234567.89, 'en') // "1,234,567.89"
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale = i18n.language as SupportedLocale,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format a percentage
 *
 * @example
 * formatPercent(0.1234, 'fr') // "12,34 %"
 * formatPercent(0.1234, 'en') // "12.34%"
 */
export function formatPercent(
  value: number,
  locale: SupportedLocale = i18n.language as SupportedLocale,
  decimals: number = 1,
): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Format number with compact notation
 *
 * @example
 * formatCompact(1234567, 'fr') // "1,23 M"
 * formatCompact(1234567, 'en') // "1.23M"
 */
export function formatCompact(
  value: number,
  locale: SupportedLocale = i18n.language as SupportedLocale,
): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toString();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert our locale codes to Intl-compatible locale strings
 */
function getIntlLocale(locale: SupportedLocale): string {
  const localeMap: Record<SupportedLocale, string> = {
    fr: "fr-FR",
    en: "en-US",
    de: "de-DE",
  };
  return localeMap[locale] || "en-US";
}

/**
 * Get locale info by code
 */
export function getLocaleInfo(code: SupportedLocale) {
  return SUPPORTED_LOCALES.find((l) => l.code === code);
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(code: string): code is SupportedLocale {
  return Object.keys(resources).includes(code);
}

/**
 * Direct translation function (for use outside React components)
 */
export const t = i18n.t.bind(i18n);

/**
 * Get current locale
 */
export function getCurrentLocale(): SupportedLocale {
  return i18n.language as SupportedLocale;
}

/**
 * Change locale programmatically
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}
