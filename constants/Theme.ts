/**
 * 🎨 OPTIMUS VINTAGE - LUXE DESIGN SYSTEM
 *
 * Inspired by: High-end fashion apps, Luxury brand aesthetics
 * Philosophy: Elegant, Varied colors, Premium feel, Artistic gradients
 *
 * v4.0 - Luxe Colorful Theme
 */

import type { TextStyle } from "react-native";

type FontVariant = NonNullable<TextStyle["fontVariant"]>;
const isIOS = process.env.EXPO_OS === "ios";
const tabularNums: FontVariant = ["tabular-nums"];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LUXE PALETTE - Rich & Varied Colors
// ═══════════════════════════════════════════════════════════════════════════════

export const Palette = {
  // Navy - Deep blue tones (primary dark)
  navy: {
    950: "#050A12",
    900: "#0A1628",
    850: "#0D1C33",
    800: "#112240",
    750: "#15294D",
    700: "#1A3359",
    650: "#1F3D66",
    600: "#254873",
    500: "#2F5A8A",
    400: "#4A7DB5",
    300: "#6FA0D4",
    200: "#9FC5EB",
    100: "#CFE2F5",
    50: "#E8F1FA",
  },

  // Emerald - Sophisticated green (primary action)
  emerald: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
    glow: "rgba(16, 185, 129, 0.25)",
    glowIntense: "rgba(16, 185, 129, 0.45)",
  },

  // Gold - Luxurious accent
  gold: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#D4AF37",
    600: "#B8960C",
    700: "#92750A",
    800: "#6B5508",
    900: "#443506",
    glow: "rgba(212, 175, 55, 0.25)",
    glowIntense: "rgba(212, 175, 55, 0.45)",
  },

  // 🆕 Violet - Royal purple tones
  violet: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
    glow: "rgba(139, 92, 246, 0.25)",
  },

  // 🆕 Rose - Soft coral pink
  rose: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E",
    600: "#E11D48",
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
    glow: "rgba(244, 63, 94, 0.25)",
  },

  // 🆕 Sky - Vibrant cyan/turquoise
  sky: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
    glow: "rgba(14, 165, 233, 0.25)",
  },

  // 🆕 Amber - Warm golden orange
  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
    glow: "rgba(245, 158, 11, 0.25)",
  },

  // 🆕 Indigo - Deep rich blue
  indigo: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    glow: "rgba(99, 102, 241, 0.25)",
  },

  // 🆕 Teal - Ocean green
  teal: {
    50: "#F0FDFA",
    100: "#CCFBF1",
    200: "#99F6E4",
    300: "#5EEAD4",
    400: "#2DD4BF",
    500: "#14B8A6",
    600: "#0D9488",
    700: "#0F766E",
    800: "#115E59",
    900: "#134E4A",
    glow: "rgba(20, 184, 166, 0.25)",
  },

  // 🆕 Fuchsia - Vibrant magenta
  fuchsia: {
    50: "#FDF4FF",
    100: "#FAE8FF",
    200: "#F5D0FE",
    300: "#F0ABFC",
    400: "#E879F9",
    500: "#D946EF",
    600: "#C026D3",
    700: "#A21CAF",
    800: "#86198F",
    900: "#701A75",
    glow: "rgba(217, 70, 239, 0.25)",
  },

  // Orange (keeping for compatibility)
  orange: {
    50: "#FFF4ED",
    100: "#FFE6D5",
    200: "#FFCAA8",
    300: "#FFA770",
    400: "#FF8038",
    500: "#FF6B35",
    600: "#E85A25",
    700: "#C4441A",
    800: "#9C3515",
    900: "#7A2B12",
    glow: "rgba(255, 107, 53, 0.25)",
    glowIntense: "rgba(255, 107, 53, 0.45)",
  },

  // Neutral - Clean grays
  neutral: {
    950: "#0A0A0B",
    900: "#18181B",
    800: "#27272A",
    700: "#3F3F46",
    600: "#52525B",
    500: "#71717A",
    400: "#A1A1AA",
    300: "#D4D4D8",
    200: "#E4E4E7",
    100: "#F4F4F5",
    50: "#FAFAFA",
    white: "#FFFFFF",
  },

  // Success - Green
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    glow: "rgba(16, 185, 129, 0.2)",
  },

  // Danger - Red
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    glow: "rgba(239, 68, 68, 0.2)",
  },

  // Warning - Amber/Yellow
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    glow: "rgba(245, 158, 11, 0.2)",
  },

  // Info - Blue
  info: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    glow: "rgba(59, 130, 246, 0.2)",
  },

  // Glass effects
  glass: {
    white02: "rgba(255, 255, 255, 0.02)",
    white05: "rgba(255, 255, 255, 0.05)",
    white08: "rgba(255, 255, 255, 0.08)",
    white10: "rgba(255, 255, 255, 0.10)",
    white15: "rgba(255, 255, 255, 0.15)",
    white20: "rgba(255, 255, 255, 0.20)",
    black03: "rgba(0, 0, 0, 0.03)",
    black05: "rgba(0, 0, 0, 0.05)",
    black08: "rgba(0, 0, 0, 0.08)",
    black10: "rgba(0, 0, 0, 0.10)",
    black20: "rgba(0, 0, 0, 0.20)",
    black40: "rgba(0, 0, 0, 0.40)",
    orange05: "rgba(255, 107, 53, 0.05)",
    orange10: "rgba(255, 107, 53, 0.10)",
    accent05: "rgba(255, 107, 53, 0.05)",
    accent10: "rgba(255, 107, 53, 0.10)",
  },

  // Backward compatibility aliases
  get accent() {
    return this.emerald;
  },
  get graphite() {
    return this.neutral;
  },
  get terracotta() {
    return this.orange;
  },
  get forest() {
    return this.success;
  },
  get slate() {
    return this.neutral;
  },
  get cyan() {
    return this.info;
  },
  get cream() {
    return this.neutral;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌓 THEME COLORS - Light-First Design (MoonRow Style)
// ═══════════════════════════════════════════════════════════════════════════════

export const Theme = {
  // LIGHT MODE - Primary theme (MoonRow style: clean white background)
  light: {
    // === Backgrounds ===
    background: Palette.neutral.white,
    backgroundSubtle: Palette.neutral[50],
    backgroundElevated: Palette.neutral.white,
    backgroundModal: Palette.neutral.white,
    backgroundNavy: Palette.navy[900], // For header sections

    // === Surfaces ===
    surface: Palette.neutral.white,
    surfaceHover: Palette.neutral[50],
    surfacePressed: Palette.neutral[100],
    surfaceCard: Palette.neutral.white,
    surfaceCardHover: Palette.neutral[50],
    surfaceGlass: Palette.glass.black03,
    surfaceGlassStrong: Palette.glass.black08,
    surfaceHighlight: Palette.glass.orange05,
    surfaceSecondary: Palette.neutral[100],

    // === Text ===
    text: Palette.navy[900],
    textSecondary: Palette.neutral[500],
    textMuted: Palette.neutral[400],
    textSubtle: Palette.neutral[300],
    textInverse: Palette.neutral.white,
    textOnAccent: Palette.neutral.white,
    textAccent: Palette.emerald[500],
    textNavy: Palette.navy[900],

    // === Primary (Accent) - Emerald ===
    primary: Palette.emerald[500],
    primaryHover: Palette.emerald[600],
    primaryPressed: Palette.emerald[700],
    primarySubtle: Palette.emerald[50],
    primaryMuted: "rgba(16, 185, 129, 0.05)",
    primaryGlow: Palette.emerald.glow,

    // === Secondary (Gold) ===
    secondary: Palette.gold[500],
    secondaryHover: Palette.gold[600],
    secondarySubtle: Palette.gold[50],
    secondaryGlow: Palette.gold.glow,

    // === Semantic Colors ===
    success: Palette.success[500],
    successSubtle: Palette.success[50],
    successMuted: Palette.glass.black05,
    successGlow: Palette.success.glow,

    danger: Palette.danger[500],
    dangerSubtle: Palette.danger[50],
    dangerMuted: Palette.glass.black05,
    dangerGlow: Palette.danger.glow,

    warning: Palette.warning[500],
    warningSubtle: Palette.warning[50],
    warningMuted: Palette.glass.black05,
    warningGlow: Palette.warning.glow,

    info: Palette.info[500],
    infoSubtle: Palette.info[50],
    infoMuted: Palette.glass.black05,
    infoGlow: Palette.info.glow,

    // === Borders ===
    border: Palette.neutral[200],
    borderSubtle: Palette.neutral[100],
    borderMuted: Palette.neutral[50],
    borderCard: Palette.neutral[200],
    borderFocus: Palette.emerald[500],
    borderGlow: Palette.emerald.glow,

    // === Shadows (CSS boxShadow format) ===
    shadowSm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    shadowMd: "0 4px 6px rgba(0, 0, 0, 0.07)",
    shadowLg: "0 10px 15px rgba(0, 0, 0, 0.10)",
    shadowXl: "0 20px 25px rgba(0, 0, 0, 0.12)",
    shadowCard: "0 2px 8px rgba(0, 0, 0, 0.06)",
    shadowCardHover: "0 8px 24px rgba(0, 0, 0, 0.10)",
    shadowGlow: `0 4px 20px ${Palette.emerald.glow}`,

    // === Special ===
    overlay: "rgba(0, 0, 0, 0.4)",
    backdrop: "rgba(0, 0, 0, 0.3)",

    // Tab bar colors
    tabIconDefault: Palette.neutral[400],
    tabIconSelected: Palette.emerald[500],
  },

  // DARK MODE - Navy-based (MoonRow dark variant)
  dark: {
    // === Backgrounds ===
    background: Palette.navy[900],
    backgroundSubtle: Palette.navy[850],
    backgroundElevated: Palette.navy[800],
    backgroundModal: Palette.navy[850],
    backgroundNavy: Palette.navy[950],

    // === Surfaces ===
    surface: Palette.navy[800],
    surfaceHover: Palette.navy[750],
    surfacePressed: Palette.navy[700],
    surfaceCard: Palette.navy[800],
    surfaceCardHover: Palette.navy[750],
    surfaceGlass: Palette.glass.white10,
    surfaceGlassStrong: Palette.glass.white15,
    surfaceHighlight: "rgba(16, 185, 129, 0.10)",
    surfaceSecondary: Palette.navy[850],

    // === Text ===
    text: Palette.neutral.white,
    textSecondary: Palette.neutral[300],
    textMuted: Palette.neutral[400],
    textSubtle: Palette.neutral[500],
    textInverse: Palette.navy[900],
    textOnAccent: Palette.neutral.white,
    textAccent: Palette.emerald[400],
    textNavy: Palette.neutral.white,

    // === Primary (Accent) - Emerald ===
    primary: Palette.emerald[500],
    primaryHover: Palette.emerald[400],
    primaryPressed: Palette.emerald[600],
    primarySubtle: "rgba(16, 185, 129, 0.15)",
    primaryMuted: "rgba(16, 185, 129, 0.10)",
    primaryGlow: Palette.emerald.glowIntense,

    // === Secondary (Gold) ===
    secondary: Palette.gold[400],
    secondaryHover: Palette.gold[300],
    secondarySubtle: "rgba(212, 175, 55, 0.15)",
    secondaryGlow: Palette.gold.glowIntense,

    // === Semantic Colors ===
    success: Palette.success[400],
    successSubtle: "rgba(16, 185, 129, 0.15)",
    successMuted: "rgba(16, 185, 129, 0.08)",
    successGlow: Palette.success.glow,

    danger: Palette.danger[400],
    dangerSubtle: "rgba(239, 68, 68, 0.15)",
    dangerMuted: "rgba(239, 68, 68, 0.08)",
    dangerGlow: Palette.danger.glow,

    warning: Palette.warning[400],
    warningSubtle: "rgba(245, 158, 11, 0.15)",
    warningMuted: "rgba(245, 158, 11, 0.08)",
    warningGlow: Palette.warning.glow,

    info: Palette.info[400],
    infoSubtle: "rgba(59, 130, 246, 0.15)",
    infoMuted: "rgba(59, 130, 246, 0.08)",
    infoGlow: Palette.info.glow,

    // === Borders ===
    border: Palette.navy[700],
    borderSubtle: Palette.navy[750],
    borderMuted: Palette.navy[800],
    borderCard: Palette.glass.white10,
    borderFocus: Palette.emerald[500],
    borderGlow: Palette.emerald.glow,

    // === Shadows ===
    shadowSm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    shadowMd: "0 4px 6px rgba(0, 0, 0, 0.4)",
    shadowLg: "0 10px 15px rgba(0, 0, 0, 0.5)",
    shadowXl: "0 20px 25px rgba(0, 0, 0, 0.6)",
    shadowCard: "0 2px 8px rgba(0, 0, 0, 0.3)",
    shadowCardHover: "0 8px 24px rgba(0, 0, 0, 0.4)",
    shadowGlow: `0 4px 20px ${Palette.emerald.glow}`,

    // === Special ===
    overlay: "rgba(0, 0, 0, 0.7)",
    backdrop: "rgba(0, 0, 0, 0.5)",

    // Tab bar colors
    tabIconDefault: Palette.neutral[400],
    tabIconSelected: Palette.emerald[500],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📏 SPACING
// ═══════════════════════════════════════════════════════════════════════════════

export const Spacing = {
  "3xs": 2,
  "2xs": 4,
  xxs: 6, // Alias for backward compatibility
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔲 RADIUS - Soft, modern corners
// ═══════════════════════════════════════════════════════════════════════════════

export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPOGRAPHY - Bold, Clean, Professional (MoonRow Style)
// ═══════════════════════════════════════════════════════════════════════════════

export const Typography = {
  // Hero - Large display (for big numbers/headlines)
  hero: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    letterSpacing: -1.5,
  },

  // Display - Headlines
  display: {
    "2xl": {
      fontSize: 64,
      lineHeight: 72,
      fontWeight: "700" as const,
      letterSpacing: -2,
    },
    xl: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "700" as const,
      letterSpacing: -1.5,
    },
    lg: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: "700" as const,
      letterSpacing: -1,
    },
    md: {
      fontSize: 30,
      lineHeight: 38,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
    },
    sm: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
  },

  // Headings
  heading: {
    xl: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
    lg: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600" as const,
    },
    md: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600" as const,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600" as const,
    },
    xs: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600" as const,
    },
  },

  // Body text
  body: {
    lg: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
    },
    md: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
    },
    sm: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "400" as const,
    },
    xs: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
    },
  },

  // Labels (uppercase, tracking)
  label: {
    lg: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "600" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
    },
    md: {
      fontSize: 12,
      lineHeight: 14,
      fontWeight: "600" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    sm: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "500" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    xs: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "500" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
  },

  // Numbers (tabular)
  number: {
    "2xl": {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "700" as const,
      ...(isIOS && { fontVariant: tabularNums }),
    },
    xl: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700" as const,
      ...(isIOS && { fontVariant: tabularNums }),
    },
    lg: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600" as const,
      ...(isIOS && { fontVariant: tabularNums }),
    },
    md: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600" as const,
      ...(isIOS && { fontVariant: tabularNums }),
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500" as const,
      ...(isIOS && { fontVariant: tabularNums }),
    },
  },

  // Code
  code: {
    lg: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
      fontFamily: isIOS ? "Menlo" : "monospace",
    },
    md: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
      fontFamily: isIOS ? "Menlo" : "monospace",
    },
    sm: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "400" as const,
      fontFamily: isIOS ? "Menlo" : "monospace",
    },
  },

  // Font families
  family: {
    default: isIOS ? "System" : "Roboto",
    medium: isIOS ? "System-Medium" : "Roboto-Medium",
    semibold: isIOS ? "System-Semibold" : "Roboto-Medium",
    bold: isIOS ? "System-Bold" : "Roboto-Bold",
    mono: isIOS ? "Menlo" : "monospace",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const Animations = {
  // Durations
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },

  // Easings
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    bounce: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  },

  // Spring configs
  spring: {
    snappy: { tension: 300, friction: 20 },
    gentle: { tension: 120, friction: 14 },
    bouncy: { tension: 180, friction: 12 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

export const Layout = {
  screenPadding: Spacing.lg,
  sectionPadding: Spacing.xl,
  cardPadding: Spacing.lg,
  maxWidth: 428, // iPhone 14 Pro Max width
  headerHeight: 56,
  tabBarHeight: 80,
};
