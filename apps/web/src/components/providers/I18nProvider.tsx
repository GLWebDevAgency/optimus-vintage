"use client";

import {
  createT,
  DEFAULT_LOCALE,
  intlLocale,
  isLocale,
  type Locale,
  type TFunction,
} from "@chine/i18n";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const LOCALE_STORAGE_KEY = "chine.locale";

interface I18nContextValue {
  readonly locale: Locale;
  /** Locale BCP 47 pour `Intl` (« fr-FR »). */
  readonly intl: string;
  readonly t: TFunction;
  readonly setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  intl: intlLocale(DEFAULT_LOCALE),
  t: createT(DEFAULT_LOCALE),
  setLocale: () => {},
});

/**
 * Locale de l'interface : mémorisée localement (`chine.locale`), synchronisée avec le réglage
 * de l'espace de travail par l'écran Réglages. Le rendu serveur et le premier rendu client
 * sont en français (langue de référence) pour éviter tout décalage d'hydratation.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      // stockage indisponible : français
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, intl: intlLocale(locale), t: createT(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = (): I18nContextValue => useContext(I18nContext);
