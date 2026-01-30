/**
 * 📳 useHaptics - Cross-platform haptic feedback hook
 * Only triggers haptics on iOS devices
 */

import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/store/settings";

const isIOS = process.env.EXPO_OS === "ios";

/**
 * Hook for triggering haptic feedback
 * Automatically disabled on non-iOS platforms
 */
export function useHaptics() {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const canHaptic = isIOS && hapticsEnabled;

  /**
   * Light impact - for minor UI events (toggles, small buttons)
   */
  const impactLight = () => {
    if (canHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  /**
   * Medium impact - for standard UI events (button presses, selections)
   */
  const impactMedium = () => {
    if (canHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  /**
   * Heavy impact - for significant UI events (important actions, confirmations)
   */
  const impactHeavy = () => {
    if (canHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  /**
   * Selection feedback - for picker/list selections
   */
  const selection = () => {
    if (canHaptic) {
      Haptics.selectionAsync();
    }
  };

  /**
   * Success notification - for successful actions
   */
  const notificationSuccess = () => {
    if (canHaptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /**
   * Warning notification - for warning states
   */
  const notificationWarning = () => {
    if (canHaptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  /**
   * Error notification - for error states
   */
  const notificationError = () => {
    if (canHaptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    selection,
    notificationSuccess,
    notificationWarning,
    notificationError,
  };
}

/**
 * Standalone haptic functions for use outside of React components
 */
export const Haptic = {
  impactLight: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  impactMedium: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  impactHeavy: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  selection: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.selectionAsync();
    }
  },
  success: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (isIOS && useSettingsStore.getState().hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
