// Platform-specific localStorage polyfill
// - Native: installs expo-sqlite backed localStorage (install-storage.native.ts)
// - Web: no-op, localStorage exists natively (install-storage.ts)
import "./install-storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// � LOCALE - Supported Languages
// ═══════════════════════════════════════════════════════════════════════════════

export type SupportedLocale = "fr" | "en" | "de";

// ═══════════════════════════════════════════════════════════════════════════════
// �🎨 THEME MODE - Aether (Dark) / Ivory (Light) / System
// ═══════════════════════════════════════════════════════════════════════════════

export type ThemeMode = "system" | "light" | "dark";

export interface ThemeModeOption {
  key: ThemeMode;
  label: string;
  icon: string;
  description: string;
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  {
    key: "system",
    label: "Système",
    icon: "smartphone",
    description: "Suivre les réglages du téléphone",
  },
  {
    key: "light",
    label: "Ivory",
    icon: "light-mode",
    description: "Mode clair élégant",
  },
  {
    key: "dark",
    label: "Aether",
    icon: "dark-mode",
    description: "Mode sombre premium",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 SETTINGS STORE
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingsState {
  currency: string;
  targetMargin: number; // in currency units
  isOnboardingDone: boolean;
  themeMode: ThemeMode; // Theme preference
  locale: SupportedLocale; // Language preference
  hapticsEnabled: boolean; // Haptics preference

  setCurrency: (c: string) => void;
  setTargetMargin: (m: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // For dev/testing
  setThemeMode: (mode: ThemeMode) => void;
  setLocale: (locale: SupportedLocale) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      targetMargin: 10, // Defaut 10€ target margin/item
      isOnboardingDone: false,
      themeMode: "system", // Default: follow system
      locale: "fr", // Default: French (primary market)
      hapticsEnabled: true,

      setCurrency: (currency) => set({ currency }),
      setTargetMargin: (targetMargin) => set({ targetMargin }),
      completeOnboarding: () => set({ isOnboardingDone: true }),
      resetOnboarding: () => set({ isOnboardingDone: false }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setLocale: (locale) => set({ locale }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: "optimus-vintage-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 EFFECTIVE THEME HOOK - Respects user preference
// ═══════════════════════════════════════════════════════════════════════════════
import { useColorScheme } from "react-native";

/**
 * Hook that returns the effective color scheme based on user preference.
 * - If themeMode is "system", follows device settings
 * - If themeMode is "light" or "dark", overrides device settings
 */
export function useEffectiveColorScheme(): "light" | "dark" {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  if (themeMode === "system") {
    return systemColorScheme ?? "light";
  }
  return themeMode;
}
