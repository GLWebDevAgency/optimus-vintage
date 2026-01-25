import "expo-sqlite/localStorage/install";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface SettingsState {
  currency: string;
  targetMargin: number; // in currency units
  isOnboardingDone: boolean;
  themeMode: ThemeMode;

  setCurrency: (c: string) => void;
  setTargetMargin: (m: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // For dev/testing
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      targetMargin: 10, // Defaut 10€ target margin/item
      isOnboardingDone: false,
      themeMode: "dark", // Default to dark mode

      setCurrency: (currency) => set({ currency }),
      setTargetMargin: (targetMargin) => set({ targetMargin }),
      completeOnboarding: () => set({ isOnboardingDone: true }),
      resetOnboarding: () => set({ isOnboardingDone: false }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: "optimus-vintage-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
