/**
 * 🎨 VANTA COLOR SCHEME HOOK
 *
 * Provides the effective color scheme based on user preference:
 * - "system": Follow device settings
 * - "light": Always Ivory mode
 * - "dark": Always Aether mode
 */

import { useSettingsStore } from "@/store/settings";
import { useColorScheme as useSystemColorScheme } from "react-native";

export function useColorScheme(): "light" | "dark" {
  const systemColorScheme = useSystemColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  // If user selected light, return light
  if (themeMode === "light") return "light";
  // All custom dark themes (dark, midnight-rose, obsidian-noir, aurora, copper) → "dark"
  if (themeMode !== "system") return "dark";

  // System mode: follow device preference
  return systemColorScheme ?? "light";
}
