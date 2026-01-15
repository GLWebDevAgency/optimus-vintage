/**
 * 🎨 Optimus Vintage - Premium Design System
 * Enterprise-grade visual language inspired by Apple, Linear, Stripe
 *
 * Design Philosophy:
 * - Warm, organic luxury with gold/champagne accents
 * - Glassmorphism & depth through layered surfaces
 * - Subtle micro-interactions and glow effects
 * - Generous whitespace and breathing room
 */

import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COLOR SYSTEM - Sophisticated warm palette with depth
// ═══════════════════════════════════════════════════════════════════════════════

export const Palette = {
  // Primary Gold - Hero color
  gold: {
    50: "#FDF8F0",
    100: "#F9EDD9",
    200: "#F3DDB3",
    300: "#E9C888",
    400: "#DDB05C",
    500: "#D0BB95", // Primary brand
    600: "#B8A47A",
    700: "#9A8A65",
    800: "#7C6F50",
    900: "#5E5540",
  },

  // Neutral Warm - Sophisticated grays with warmth
  neutral: {
    0: "#FFFFFF",
    25: "#FDFCFB",
    50: "#FAF9F7",
    100: "#F5F3F0",
    150: "#EFECE8",
    200: "#E8E4DE",
    300: "#D4CFC6",
    400: "#B8B1A5",
    500: "#9A9286",
    600: "#7D756A",
    700: "#5E574E",
    800: "#3F3A33",
    850: "#2A2620",
    900: "#1B160F",
    950: "#0F0B07",
  },

  // Accent Colors - Vibrant yet sophisticated
  emerald: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669", // Primary success
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },

  rose: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E",
    600: "#E11D48", // Primary danger
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
  },

  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706", // Primary warning
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  sky: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7", // Primary info
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },

  // Special - Glassmorphism & overlays
  glass: {
    white: "rgba(255, 255, 255, 0.85)",
    whiteSubtle: "rgba(255, 255, 255, 0.65)",
    whiteMuted: "rgba(255, 255, 255, 0.45)",
    dark: "rgba(27, 22, 15, 0.75)",
    darkSubtle: "rgba(27, 22, 15, 0.55)",
    gold: "rgba(208, 187, 149, 0.15)",
    goldIntense: "rgba(208, 187, 149, 0.25)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌓 THEME TOKENS - Light & Dark modes
// ═══════════════════════════════════════════════════════════════════════════════

export const Theme = {
  light: {
    // Backgrounds
    background: Palette.neutral[50],
    backgroundSubtle: Palette.neutral[100],
    backgroundElevated: Palette.neutral[0],
    backgroundInverse: Palette.neutral[900],

    // Surfaces
    surface: Palette.neutral[0],
    surfaceHover: Palette.neutral[100],
    surfacePressed: Palette.neutral[150],
    surfaceHighlight: Palette.gold[50],
    surfaceSecondary: Palette.neutral[100],
    surfaceCard: Palette.neutral[0],
    surfaceGlass: Palette.glass.white,
    surfaceGlassSubtle: Palette.glass.whiteSubtle,

    // Text
    text: Palette.neutral[900],
    textSecondary: Palette.neutral[600],
    textMuted: Palette.neutral[500],
    textSubtle: Palette.neutral[400],
    textInverse: Palette.neutral[0],
    textOnAccent: Palette.neutral[900],

    // Borders
    border: Palette.neutral[200],
    borderSubtle: Palette.neutral[150],
    borderMuted: Palette.neutral[100],
    borderFocus: Palette.gold[500],
    borderCard: "rgba(0, 0, 0, 0.04)",
    divider: Palette.neutral[150],

    // Primary (Gold)
    primary: Palette.gold[500],
    primaryHover: Palette.gold[600],
    primaryPressed: Palette.gold[700],
    primarySubtle: Palette.gold[100],
    primaryMuted: Palette.gold[50],
    primaryGlow: "rgba(208, 187, 149, 0.4)",

    // Semantic
    success: Palette.emerald[600],
    successSubtle: Palette.emerald[50],
    successText: Palette.emerald[700],
    danger: Palette.rose[600],
    dangerSubtle: Palette.rose[50],
    dangerText: Palette.rose[700],
    warning: Palette.amber[600],
    warningSubtle: Palette.amber[50],
    warningText: Palette.amber[700],
    info: Palette.sky[600],
    infoSubtle: Palette.sky[50],
    infoText: Palette.sky[700],

    // Gradients
    gradientGold: ["#E9C888", "#D0BB95", "#B8A47A"],
    gradientProfit: ["#34D399", "#10B981", "#059669"],
    gradientLoss: ["#FB7185", "#F43F5E", "#E11D48"],
    gradientHero: ["#F5F3F0", "#FDFCFB", "#FFFFFF"],
    gradientCard: [
      "rgba(255,255,255,0.9)",
      "rgba(255,255,255,0.95)",
      "rgba(255,255,255,1)",
    ],
    gradientOverlay: ["rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"],

    // Shadows
    shadowXs: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 2,
      elevation: 1,
    },
    shadowSm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 2,
    },
    shadowMd: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 4,
    },
    shadowLg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    shadowXl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 48,
      elevation: 12,
    },
    shadowGlow: {
      shadowColor: Palette.gold[500],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    shadowSuccess: {
      shadowColor: Palette.emerald[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  dark: {
    // Backgrounds
    background: Palette.neutral[950],
    backgroundSubtle: Palette.neutral[900],
    backgroundElevated: Palette.neutral[850],
    backgroundInverse: Palette.neutral[50],

    // Surfaces
    surface: Palette.neutral[850],
    surfaceHover: Palette.neutral[800],
    surfacePressed: Palette.neutral[700],
    surfaceHighlight: "rgba(208, 187, 149, 0.08)",
    surfaceSecondary: Palette.neutral[800],
    surfaceCard: Palette.neutral[850],
    surfaceGlass: Palette.glass.dark,
    surfaceGlassSubtle: Palette.glass.darkSubtle,

    // Text
    text: Palette.neutral[50],
    textSecondary: Palette.neutral[300],
    textMuted: Palette.neutral[400],
    textSubtle: Palette.neutral[500],
    textInverse: Palette.neutral[900],
    textOnAccent: Palette.neutral[900],

    // Borders
    border: Palette.neutral[700],
    borderSubtle: Palette.neutral[800],
    borderMuted: Palette.neutral[850],
    borderFocus: Palette.gold[500],
    borderCard: "rgba(255, 255, 255, 0.06)",
    divider: Palette.neutral[700],

    // Primary (Gold)
    primary: Palette.gold[400],
    primaryHover: Palette.gold[500],
    primaryPressed: Palette.gold[600],
    primarySubtle: "rgba(208, 187, 149, 0.15)",
    primaryMuted: "rgba(208, 187, 149, 0.08)",
    primaryGlow: "rgba(208, 187, 149, 0.3)",

    // Semantic
    success: Palette.emerald[400],
    successSubtle: "rgba(16, 185, 129, 0.12)",
    successText: Palette.emerald[300],
    danger: Palette.rose[400],
    dangerSubtle: "rgba(244, 63, 94, 0.12)",
    dangerText: Palette.rose[300],
    warning: Palette.amber[400],
    warningSubtle: "rgba(245, 158, 11, 0.12)",
    warningText: Palette.amber[300],
    info: Palette.sky[400],
    infoSubtle: "rgba(14, 165, 233, 0.12)",
    infoText: Palette.sky[300],

    // Gradients
    gradientGold: ["#DDB05C", "#D0BB95", "#B8A47A"],
    gradientProfit: ["#6EE7B7", "#34D399", "#10B981"],
    gradientLoss: ["#FDA4AF", "#FB7185", "#F43F5E"],
    gradientHero: ["#1B160F", "#2A2620", "#3F3A33"],
    gradientCard: [
      "rgba(42,38,32,0.9)",
      "rgba(42,38,32,0.95)",
      "rgba(42,38,32,1)",
    ],
    gradientOverlay: ["rgba(0,0,0,0)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"],

    // Shadows (less prominent in dark mode)
    shadowXs: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    shadowSm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
    shadowMd: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
    shadowLg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 8,
    },
    shadowXl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.7,
      shadowRadius: 48,
      elevation: 12,
    },
    shadowGlow: {
      shadowColor: Palette.gold[400],
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    shadowSuccess: {
      shadowColor: Palette.emerald[400],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 SPACING SYSTEM - 4px base unit, generous and breathing
// ═══════════════════════════════════════════════════════════════════════════════

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  "7xl": 80,
  "8xl": 96,
  "9xl": 128,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPOGRAPHY - Manrope with refined scale
// ═══════════════════════════════════════════════════════════════════════════════

export const Typography = {
  // Font families
  family: {
    regular: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semiBold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
    extraBold: "Manrope_800ExtraBold",
  },

  // Display sizes - Large hero text
  display: {
    xl: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 56,
      lineHeight: 64,
      letterSpacing: -2,
    },
    lg: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 44,
      lineHeight: 52,
      letterSpacing: -1.5,
    },
    md: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -1,
    },
    sm: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 30,
      lineHeight: 38,
      letterSpacing: -0.75,
    },
  },

  // Headings
  heading: {
    xl: {
      fontFamily: "Manrope_700Bold",
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    lg: {
      fontFamily: "Manrope_700Bold",
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    md: {
      fontFamily: "Manrope_700Bold",
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.25,
    },
    sm: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: 0,
    },
    xs: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
  },

  // Body text
  body: {
    lg: {
      fontFamily: "Manrope_400Regular",
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 0,
    },
    md: {
      fontFamily: "Manrope_400Regular",
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    sm: {
      fontFamily: "Manrope_400Regular",
      fontSize: 14,
      lineHeight: 22,
      letterSpacing: 0,
    },
    xs: {
      fontFamily: "Manrope_400Regular",
      fontSize: 13,
      lineHeight: 20,
      letterSpacing: 0,
    },
  },

  // Labels & caps
  label: {
    lg: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    md: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.25,
    },
    sm: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    xs: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
  },

  // Numbers & KPI
  number: {
    hero: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 48,
      lineHeight: 52,
      letterSpacing: -1.5,
    },
    xl: {
      fontFamily: "Manrope_800ExtraBold",
      fontSize: 36,
      lineHeight: 40,
      letterSpacing: -1,
    },
    lg: {
      fontFamily: "Manrope_700Bold",
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    md: {
      fontFamily: "Manrope_700Bold",
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.25,
    },
    sm: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: 0,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔲 BORDER RADIUS - Soft and organic
// ═══════════════════════════════════════════════════════════════════════════════

export const Radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  full: 9999,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ ANIMATION TIMINGS - Smooth and responsive
// ═══════════════════════════════════════════════════════════════════════════════

export const Animation = {
  duration: {
    instant: 50,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 LAYOUT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const Layout = {
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    maxWidth: 600,
  },
  tabBar: {
    height: Platform.OS === "ios" ? 88 : 64,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
  },
  header: {
    height: Platform.OS === "ios" ? 100 : 80,
  },
  card: {
    minHeight: 80,
  },
  fab: {
    size: 60,
    offset: 24,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const getTheme = (scheme: "light" | "dark" = "light") => Theme[scheme];

export const createShadow = (
  color: string,
  offset = { width: 0, height: 4 },
  opacity = 0.1,
  radius = 8,
  elevation = 4
) => ({
  shadowColor: color,
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});
