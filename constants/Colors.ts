/**
 * Optimus Vintage Theme Palette
 * Based on provided design tokens.
 */

const tintColorLight = "#D0BB95";
const tintColorDark = "#D0BB95";

export const Colors = {
  light: {
    text: "#1b140d",
    textSecondary: "#9a734c",
    textMuted: "#6b5c50",
    background: "#f7f7f6",
    surface: "#ffffff",
    surfaceHighlight: "#f3ede7",
    tint: tintColorLight,
    tabIconDefault: "#9a734c",
    tabIconSelected: tintColorLight,
    border: "#e7dbcf",
    profit: "#059669", // Emerald 600
    loss: "#dc2626", // Red 600
    warning: "#d97706", // Amber 600
  },
  dark: {
    text: "#ece0d6",
    textSecondary: "#bfa084",
    textMuted: "#9c8e82",
    background: "#1d1a15",
    surface: "#2d241b",
    surfaceHighlight: "#3a2e24",
    tint: tintColorDark,
    tabIconDefault: "#b08d6b",
    tabIconSelected: tintColorDark,
    border: "#4a3b2a",
    profit: "#34d399", // Emerald 400
    loss: "#f87171", // Red 400
    warning: "#fbbf24", // Amber 400
  },
  // Global palette for non-theme specific use
  palette: {
    primary: "#D0BB95",
    primaryDark: "#a85a0b",
    gold: "#D0BB95",
    cream: "#f7f7f6",
    charcoal: "#1d1a15",
    white: "#ffffff",
  },
};
