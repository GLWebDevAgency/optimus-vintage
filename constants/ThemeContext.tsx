/**
 * 🎨 OPTIMUS VINTAGE - THEME CONTEXT
 *
 * Gestion du Light/Dark Mode avec palettes neumorphiques
 * Basé sur les maquettes Stitch Light Neumorphic UI Kit
 */

import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { ThemeMode, useSettingsStore } from "@/store/settings";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LIGHT MODE PALETTE (from light_neumorphic_ui_kit)
// ═══════════════════════════════════════════════════════════════════════════════

const LightPalette = {
  primary: {
    main: "#00D084",
    dark: "#00a86b",
    light: "#33D99D",
    glow: "rgba(0, 208, 132, 0.4)",
    glowSm: "rgba(0, 208, 132, 0.3)",
    glowIntense: "rgba(0, 208, 132, 0.5)",
    subtle: "rgba(0, 208, 132, 0.12)",
  },
  background: {
    main: "#EBECF0", // Maquette: background-light
    light: "#F0F1F5",
    dark: "#D8DCE2",
    elevated: "#EBECF0",
    gradient: {
      start: "#F0F1F5",
      end: "#EBECF0",
    },
  },
  text: {
    primary: "#2D3748",
    secondary: "#4A5568",
    muted: "#718096",
    inverse: "#F1F5F9",
    white: "#FFFFFF",
  },
  accent: {
    green: "#10B981",
    greenGlow: "rgba(16, 185, 129, 0.4)",
    blue: "#3B82F6",
    blueGlow: "rgba(59, 130, 246, 0.4)",
    yellow: "#F59E0B",
    yellowGlow: "rgba(245, 158, 11, 0.4)",
    red: "#EF4444",
    redGlow: "rgba(239, 68, 68, 0.35)",
    indigo: "#6366F1",
    indigoGlow: "rgba(99, 102, 241, 0.35)",
    teal: "#14B8A6",
    tealGlow: "rgba(20, 184, 166, 0.35)",
    amber: "#F59E0B",
    amberGlow: "rgba(245, 158, 11, 0.35)",
    sky: "#0EA5E9",
    skyGlow: "rgba(14, 165, 233, 0.35)",
    purple: "#8B5CF6",
    purpleGlow: "rgba(139, 92, 246, 0.35)",
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  gold: {
    main: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  divider: {
    light: "rgba(0, 0, 0, 0.06)",
    main: "#CBD5E1",
  },
};

const LightShadows = {
  flat: {
    // Maquette: 'neu-light': '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff'
    css: "6px 6px 12px #b8b9be, -6px -6px 12px #ffffff",
    cssMd: "5px 5px 10px #b8b9be, -5px -5px 10px #ffffff",
    cssSm: "3px 3px 6px #b8b9be, -3px -3px 6px #ffffff",
    cssXs: "2px 2px 4px #c5c6cc, -2px -2px 4px #ffffff",
    ios: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    iosMd: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
    },
    iosSm: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: 8,
    androidMd: 5,
    androidSm: 3,
  },
  convex: {
    css: "6px 6px 12px #b8b9be, -6px -6px 12px #ffffff",
    cssSm: "4px 4px 8px #b8b9be, -4px -4px 8px #ffffff",
    ios: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.55,
      shadowRadius: 10,
    },
    iosSm: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: 10,
    androidSm: 5,
  },
  pressed: {
    // Maquette: 'neu-light-pressed': 'inset 4px 4px 8px #b8b9be, inset -4px -4px 8px #ffffff'
    css: "inset 4px 4px 8px #b8b9be, inset -4px -4px 8px #ffffff",
    cssSm: "inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #ffffff",
    cssXs: "inset 2px 2px 4px #c5c6cc, inset -2px -2px 4px #ffffff",
    borderColor: "#c5ccd6",
    overlayColor: "rgba(184, 185, 190, 0.12)",
  },
  icon: {
    css: "3px 3px 6px #b8b9be, -3px -3px 6px #ffffff",
    ios: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
    },
    android: 3,
  },
  glow: {
    // Maquette: 'glow-primary': '0 0 15px rgba(0, 208, 132, 0.4)'
    css: "0 0 15px rgba(0, 208, 132, 0.4)",
    cssMd: "0 0 12px rgba(0, 208, 132, 0.35)",
    cssSm: "0 0 8px rgba(0, 208, 132, 0.3)",
    cssXs: "0 0 5px rgba(0, 208, 132, 0.25)",
    ios: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
    },
    iosSm: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
  },
  tabBar: {
    css: "0 -6px 20px rgba(184, 185, 190, 0.5)",
    ios: {
      shadowColor: "#b8b9be",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
  },
  hover: {
    css: "8px 8px 16px #b8b9be, -8px -8px 16px #ffffff",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 DARK MODE PALETTE (existing)
// ═══════════════════════════════════════════════════════════════════════════════

const DarkPalette = {
  primary: {
    main: "#00D084",
    dark: "#00a86b",
    light: "#33D99D",
    glow: "rgba(0, 208, 132, 0.4)",
    glowSm: "rgba(0, 208, 132, 0.3)",
    glowIntense: "rgba(0, 208, 132, 0.6)",
    subtle: "rgba(0, 208, 132, 0.15)",
  },
  background: {
    main: "#262A33", // Maquette: background-dark
    light: "#2D3140",
    dark: "#1b1e24",
    elevated: "#313642",
    gradient: {
      start: "#2D3140",
      end: "#262A33",
    },
  },
  text: {
    primary: "#F1F5F9",
    secondary: "#94A3B8",
    muted: "#64748B",
    inverse: "#1E1E24",
    white: "#FFFFFF",
  },
  accent: {
    green: "#10B981",
    greenGlow: "rgba(16, 185, 129, 0.6)",
    blue: "#3B82F6",
    blueGlow: "rgba(59, 130, 246, 0.6)",
    yellow: "#F59E0B",
    yellowGlow: "rgba(245, 158, 11, 0.6)",
    red: "#EF4444",
    redGlow: "rgba(239, 68, 68, 0.5)",
    indigo: "#818CF8",
    indigoGlow: "rgba(129, 140, 248, 0.5)",
    teal: "#2DD4BF",
    tealGlow: "rgba(45, 212, 191, 0.5)",
    amber: "#FBBF24",
    amberGlow: "rgba(251, 191, 36, 0.5)",
    sky: "#38BDF8",
    skyGlow: "rgba(56, 189, 248, 0.5)",
    purple: "#A78BFA",
    purpleGlow: "rgba(167, 139, 250, 0.5)",
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  gold: {
    main: "#FBBF24",
    glow: "rgba(251, 191, 36, 0.5)",
  },
  divider: {
    light: "rgba(255, 255, 255, 0.1)",
    main: "#3F3F46",
  },
};

const DarkShadows = {
  flat: {
    // Maquette: 'neu-dark': '6px 6px 12px #1b1e24, -6px -6px 12px #313642'
    css: "6px 6px 12px #1b1e24, -6px -6px 12px #313642",
    cssMd: "5px 5px 10px #1b1e24, -5px -5px 10px #313642",
    cssSm: "3px 3px 6px #1b1e24, -3px -3px 6px #313642",
    cssXs: "2px 2px 4px #1b1e24, -2px -2px 4px #313642",
    ios: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
    },
    iosMd: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    iosSm: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
    },
    android: 10,
    androidMd: 6,
    androidSm: 4,
  },
  convex: {
    css: "6px 6px 12px #1b1e24, -6px -6px 12px #313642",
    cssSm: "4px 4px 8px #1b1e24, -4px -4px 8px #313642",
    ios: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
    },
    iosSm: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
    },
    android: 12,
    androidSm: 6,
  },
  pressed: {
    // Maquette: 'neu-dark-pressed': 'inset 4px 4px 8px #1b1e24, inset -4px -4px 8px #313642'
    css: "inset 4px 4px 8px #1b1e24, inset -4px -4px 8px #313642",
    cssSm: "inset 3px 3px 6px #1b1e24, inset -3px -3px 6px #313642",
    cssXs: "inset 2px 2px 4px #1b1e24, inset -2px -2px 4px #313642",
    borderColor: "#1b1e24",
    overlayColor: "rgba(27, 30, 36, 0.15)",
  },
  icon: {
    css: "3px 3px 6px #1b1e24, -3px -3px 6px #313642",
    ios: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
    },
    android: 3,
  },
  glow: {
    // Maquette: 'glow-primary': '0 0 15px rgba(0, 208, 132, 0.4)'
    css: "0 0 15px rgba(0, 208, 132, 0.4)",
    cssMd: "0 0 12px rgba(0, 208, 132, 0.35)",
    cssSm: "0 0 8px rgba(0, 208, 132, 0.3)",
    cssXs: "0 0 5px rgba(0, 208, 132, 0.25)",
    ios: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
    },
    iosSm: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
    },
  },
  tabBar: {
    css: "0 -6px 20px rgba(27, 30, 36, 0.6)",
    ios: {
      shadowColor: "#1b1e24",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
    },
  },
  hover: {
    css: "12px 12px 24px #0a0a0d, -12px -12px 24px #32323c",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const NeuSpacing = {
  "3xs": 2,
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  screen: 24,
};

export const NeuRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

const isIOS = process.env.EXPO_OS === "ios";

export const NeuTypography = {
  display: {
    "2xl": {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "800" as const,
      letterSpacing: -1,
    },
    xl: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
    },
    lg: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
    md: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  },
  heading: {
    xl: { fontSize: 20, lineHeight: 28, fontWeight: "800" as const },
    lg: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
    md: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const },
    sm: { fontSize: 14, lineHeight: 20, fontWeight: "700" as const },
  },
  body: {
    lg: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    md: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
    sm: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
    xs: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  },
  label: {
    lg: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700" as const,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
    },
    md: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700" as const,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },
    sm: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
    },
    xs: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
  },
  number: {
    xl: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700" as const,
      ...(isIOS && { fontVariant: ["tabular-nums" as const] }),
    },
    lg: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "700" as const,
      ...(isIOS && { fontVariant: ["tabular-nums" as const] }),
    },
    md: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700" as const,
      ...(isIOS && { fontVariant: ["tabular-nums" as const] }),
    },
    sm: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600" as const,
      ...(isIOS && { fontVariant: ["tabular-nums" as const] }),
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 THEME TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  palette: typeof DarkPalette;
  shadows: typeof DarkShadows;
  spacing: typeof NeuSpacing;
  radius: typeof NeuRadius;
  typography: typeof NeuTypography;
  isDark: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 THEME CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface ThemeContextValue extends ThemeColors {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const defaultDarkTheme: ThemeColors = {
  palette: DarkPalette,
  shadows: DarkShadows,
  spacing: NeuSpacing,
  radius: NeuRadius,
  typography: NeuTypography,
  isDark: true,
};

const ThemeContext = createContext<ThemeContextValue>({
  ...defaultDarkTheme,
  colorScheme: "dark",
  themeMode: "dark",
  setThemeMode: () => {},
  toggleTheme: () => {},
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 THEME PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function NeuThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const { themeMode, setThemeMode } = useSettingsStore();

  const colorScheme: ColorScheme = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const theme: ThemeColors = useMemo(() => {
    const isDark = colorScheme === "dark";
    return {
      palette: isDark ? DarkPalette : LightPalette,
      shadows: isDark ? DarkShadows : LightShadows,
      spacing: NeuSpacing,
      radius: NeuRadius,
      typography: NeuTypography,
      isDark,
    };
  }, [colorScheme]);

  const toggleTheme = () => {
    setThemeMode(colorScheme === "dark" ? "light" : "dark");
  };

  const value: ThemeContextValue = useMemo(
    () => ({
      ...theme,
      colorScheme,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, colorScheme, themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🪝 HOOK: useNeuTheme
// ═══════════════════════════════════════════════════════════════════════════════

export function useNeuTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useNeuTheme must be used within a NeuThemeProvider");
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { ThemeMode } from "@/store/settings";
export { DarkPalette, DarkShadows, LightPalette, LightShadows };

