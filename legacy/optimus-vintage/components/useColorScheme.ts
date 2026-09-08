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

  // If user selected a specific mode, use it
  if (themeMode === "light") return "light";
  if (themeMode === "dark") return "dark";

  // Otherwise, follow system preference (default to light if null)
  return systemColorScheme ?? "light";
}
