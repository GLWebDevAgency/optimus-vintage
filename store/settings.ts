import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  currency: string;
  targetMargin: number; // in currency units
  isOnboardingDone: boolean;

  setCurrency: (c: string) => void;
  setTargetMargin: (m: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // For dev/testing
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      targetMargin: 10, // Defaut 10€ target margin/item
      isOnboardingDone: false,

      setCurrency: (currency) => set({ currency }),
      setTargetMargin: (targetMargin) => set({ targetMargin }),
      completeOnboarding: () => set({ isOnboardingDone: true }),
      resetOnboarding: () => set({ isOnboardingDone: false }),
    }),
    {
      name: "optimus-vintage-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
