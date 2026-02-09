/**
 * 🌌 VANTA DESIGN SYSTEM - Aether & Ivory
 *
 * "Digital Architecture evolving in an infinite spatial void."
 * Architecture that rejects 'pages' for 'Digital Sculptures' floating in space.
 *
 * Modes:
 * - AETHER (Dark): Absolute Zero (#000000), Obsidian Polish, Pure Gold emanations
 * - IVORY (Light): Organic Ivory, Mother of Pearl, Champagne Gold refractions
 *
 * Materials:
 * - Dark: Polished Obsidian, Black Titanium, Carbon Glass
 * - Light: Mother of Pearl, Frosted Glass, Warm Silk Paper
 *
 * v6.0 - The "Vanta" Era
 */

import type { TextStyle } from "react-native";

type FontVariant = NonNullable<TextStyle["fontVariant"]>;
const tabularNums: FontVariant = ["tabular-nums"];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PALETTE - The Vanta Collection
// ═══════════════════════════════════════════════════════════════════════════════

export const Palette = {
  // ─── AETHER (Dark Mode Bases) ──────────────────────────────────────────────
  // "The interface floats in an infinite void"
  vanta: {
    black: "#1a2d2493", // Absolute Zero - The Void
    obsidian: "#0A0A0A", // Polished Obsidian
    titanium: "#111111", // Brushed Black Titanium
    carbon: "#1C1C1C", // Carbon Glass Surface
    graphite: "#1A1A1A", // Elevated Surface
    steel: "#222222", // Lighter Surface
  },

  // ─── IVORY (Light Mode Bases) ──────────────────────────────────────────────
  // "Organic warmth with spatial depth"
  ivory: {
    base: "#FAF9F6", // Organic Ivory (Silk Paper) - opaque
    cream: "#FDFCF9", // Warm Cream Highlight
    sand: "#d9caa3d0", // Warm Sand
    linen: "#E8E5DD", // Linen Texture
    pearl: "#FFFFFF", // Mother of Pearl Accent
    parchment: "#F5F2EB", // Noble Paper
  },

  // ─── METALS (Luxe Accents) ─────────────────────────────────────────────────
  // "Treated as physical phenomena - photon emanations"
  metal: {
    // Pure Gold (Aether Primary)
    // Calibrated to match Vanta visual references (warm, slightly amber)
    gold: "#F4C025",
    goldLight: "#FFD35A",
    goldDark: "#D4A017",
    goldGlow: "rgba(244, 192, 37, 0.6)",
    goldSubtle: "rgba(244, 192, 37, 0.15)",

    // Champagne Gold (Ivory Primary)
    champagne: "#C9A961",
    champagneLight: "#D9BC7A",
    champagneDark: "#B8944A",
    champagneGlow: "rgba(201, 169, 97, 0.5)",
    champagneSubtle: "rgba(201, 169, 97, 0.12)",

    // Liquid Mercury (Secondary Accent)
    mercury: "#E8E8E8",
    mercuryDark: "#C0C0C0",

    // Bronze Rose (Tertiary)
    bronze: "#CD7F32",
    bronzeRose: "#B08D57",
  },

  // ─── SEMANTIC (Functional Colors) ──────────────────────────────────────────
  semantic: {
    success: "#4ADE80", // Neon Emerald
    successDark: "#22C55E",
    danger: "#F43F5E", // Neon Rose
    dangerDark: "#E11D48",
    info: "#38BDF8", // Neon Sky
    infoDark: "#0EA5E9",
    warning: "#FACC15", // Neon Amber
    warningDark: "#EAB308",
  },

  // ─── NEUTRAL (Text Hierarchy) ──────────────────────────────────────────────
  neutral: {
    white: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0A0A0A",
    anthracite: "#1C1917", // Deep Warm Gray (Ivory text)
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 LEGACY COMPATIBILITY ALIASES
  // Mapped to Vanta semantic colors for backward compatibility
  // ═══════════════════════════════════════════════════════════════════════════

  // Emerald → Success
  emerald: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#4ADE80", // semantic.success
    600: "#22C55E", // semantic.successDark
    700: "#16A34A",
    800: "#166534",
    900: "#14532D",
  },

  // Rose → Danger
  rose: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E", // semantic.danger
    600: "#E11D48", // semantic.dangerDark
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
  },

  // Sky → Info
  sky: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8", // semantic.info
    500: "#0EA5E9", // semantic.infoDark
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },

  // Gold (legacy indexed format)
  gold: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F4C025", // metal.gold
    600: "#D4A017", // metal.goldDark
    700: "#B8860B",
    800: "#92400E",
    900: "#78350F",
    glow: "rgba(244, 192, 37, 0.6)",
  },

  // Forest → Success darker
  forest: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },

  // Navy → Dark neutrals
  navy: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  // Success, Danger, Warning, Info (indexed format for legacy)
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#4ADE80",
    600: "#22C55E",
    700: "#16A34A",
    800: "#166534",
    900: "#14532D",
  },
  danger: {
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
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#FACC15",
    600: "#EAB308",
    700: "#CA8A04",
    800: "#A16207",
    900: "#854D0E",
  },
  info: {
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
  },

  // Accent (legacy - maps to Gold)
  accent: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F4C025",
    600: "#D4A017",
    700: "#B8860B",
    800: "#92400E",
    900: "#78350F",
    glow: "rgba(244, 192, 37, 0.4)",
  },

  // Glass (legacy)
  glass: {
    white10: "rgba(255, 255, 255, 0.1)",
    white20: "rgba(255, 255, 255, 0.2)",
    white30: "rgba(255, 255, 255, 0.3)",
    white40: "rgba(255, 255, 255, 0.4)",
    white50: "rgba(255, 255, 255, 0.5)",
    black10: "rgba(0, 0, 0, 0.1)",
    black20: "rgba(0, 0, 0, 0.2)",
    black30: "rgba(0, 0, 0, 0.3)",
    black40: "rgba(0, 0, 0, 0.4)",
    black50: "rgba(0, 0, 0, 0.5)",
  },

  // Cyan (legacy - maps to Info/Sky)
  cyan: {
    50: "#ECFEFF",
    100: "#CFFAFE",
    200: "#A5F3FC",
    300: "#67E8F9",
    400: "#22D3EE",
    500: "#06B6D4",
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌓 THEME - Aether (Dark) & Ivory (Light)
// ═══════════════════════════════════════════════════════════════════════════════

export const Theme = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ☀️ IVORY MODE (Light)
  // "Sculptures of Light - diffuse shadows creating spatial depth"
  // ═══════════════════════════════════════════════════════════════════════════
  light: {
    dark: false,

    // ─── Backgrounds ─────────────────────────────────────────────────────────
    background: Palette.ivory.base, // Organic Ivory base
    backgroundSubtle: Palette.ivory.sand,
    backgroundElevated: Palette.ivory.cream,
    backgroundGradientStart: Palette.ivory.cream,
    backgroundGradientEnd: Palette.ivory.sand,

    // ─── Surfaces (Sculptures of Light) ──────────────────────────────────────
    surface: Palette.ivory.cream,
    surfaceHighlight: Palette.ivory.pearl,
    surfaceGlass: "rgba(253, 252, 249, 0.75)", // Frosted Pearl
    surfaceGlassStrong: "rgba(253, 252, 249, 0.92)",
    surfaceCard: Palette.ivory.cream,
    surfaceSlab: Palette.ivory.parchment, // For floating slabs

    // ─── Text (Anthracite - never pure black) ────────────────────────────────
    text: Palette.neutral.anthracite,
    textSecondary: Palette.neutral[600],
    textMuted: Palette.neutral[400],
    textInverse: Palette.neutral.white,
    textOnAccent: Palette.neutral[900],
    textGold: Palette.metal.champagne,

    // ─── Accents (Champagne Gold) ────────────────────────────────────────────
    primary: Palette.metal.champagne,
    primaryHover: Palette.metal.champagneDark,
    primarySubtle: Palette.metal.champagneSubtle,
    primaryMuted: "rgba(201, 169, 97, 0.08)",
    primaryGlow: Palette.metal.champagneGlow,
    primaryLight: Palette.metal.champagneLight,

    // Secondary accent (Info blue)
    secondary: Palette.semantic.infoDark,
    secondarySubtle: "rgba(14, 165, 233, 0.12)",

    // ─── Semantic ────────────────────────────────────────────────────────────
    success: Palette.semantic.successDark,
    successSubtle: "rgba(34, 197, 94, 0.12)",
    successMuted: "rgba(34, 197, 94, 0.06)",
    successGlow: "rgba(34, 197, 94, 0.4)",

    danger: Palette.semantic.dangerDark,
    dangerSubtle: "rgba(225, 29, 72, 0.12)",
    dangerMuted: "rgba(225, 29, 72, 0.06)",
    dangerGlow: "rgba(225, 29, 72, 0.4)",

    warning: Palette.semantic.warningDark,
    warningSubtle: "rgba(234, 179, 8, 0.12)",
    warningMuted: "rgba(234, 179, 8, 0.06)",

    info: Palette.semantic.infoDark,
    infoSubtle: "rgba(14, 165, 233, 0.12)",
    infoMuted: "rgba(14, 165, 233, 0.06)",

    // ─── Borders (Organic, Soft) ─────────────────────────────────────────────
    border: Palette.ivory.linen,
    borderFocus: Palette.metal.champagne,
    borderGlass: "rgba(28, 25, 23, 0.06)",
    borderCard: Palette.ivory.linen,
    borderGold: `${Palette.metal.champagne}40`,

    // ─── Shadows (Soft, Long, Extremely Diffuse - Z-axis depth) ──────────────
    shadowXs: "0 1px 2px rgba(28, 25, 23, 0.03)",
    shadowSm: "0 2px 8px rgba(28, 25, 23, 0.04)",
    shadowMd: "0 8px 24px rgba(28, 25, 23, 0.06)",
    shadowLg: "0 16px 48px rgba(28, 25, 23, 0.08)",
    shadowXl: "0 24px 64px rgba(28, 25, 23, 0.10)",
    shadowInner: "inset 0 2px 4px rgba(0, 0, 0, 0.02)",
    shadowGlow: `0 0 24px ${Palette.metal.champagne}30`,
    shadowCardFloat:
      "0 12px 40px rgba(28, 25, 23, 0.08), 0 4px 12px rgba(28, 25, 23, 0.04)",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌑 AETHER MODE (Dark)
  // "Obsidian Slabs floating in infinite void - defined by golden light lines"
  // ═══════════════════════════════════════════════════════════════════════════
  dark: {
    dark: true,

    // ─── Backgrounds ─────────────────────────────────────────────────────────
    background: Palette.vanta.black, // Absolute Zero - The Void
    backgroundSubtle: Palette.vanta.obsidian,
    backgroundElevated: Palette.vanta.titanium,
    backgroundGradientStart: Palette.vanta.black,
    backgroundGradientEnd: Palette.vanta.obsidian,

    // ─── Surfaces (Obsidian Slabs) ───────────────────────────────────────────
    surface: Palette.vanta.obsidian,
    surfaceHighlight: Palette.vanta.titanium,
    surfaceGlass: "rgba(10, 10, 10, 0.7)", // Frosted Obsidian
    surfaceGlassStrong: "rgba(10, 10, 10, 0.88)",
    surfaceCard: Palette.vanta.titanium,
    surfaceSlab: Palette.vanta.carbon, // Floating obsidian slab

    // ─── Text ────────────────────────────────────────────────────────────────
    text: Palette.neutral.white,
    textSecondary: Palette.neutral[400],
    textMuted: Palette.neutral[600],
    textInverse: Palette.vanta.black,
    textOnAccent: Palette.vanta.black,
    textGold: Palette.metal.gold,

    // ─── Accents (Pure Gold - photon emanations) ─────────────────────────────
    primary: Palette.metal.gold,
    primaryHover: Palette.metal.goldLight,
    primarySubtle: Palette.metal.goldSubtle,
    primaryMuted: "rgba(244, 192, 37, 0.08)",
    primaryGlow: Palette.metal.goldGlow,
    primaryLight: Palette.metal.goldLight,

    // Secondary accent (Info blue)
    secondary: Palette.semantic.info,
    secondarySubtle: "rgba(56, 189, 248, 0.15)",

    // ─── Semantic ────────────────────────────────────────────────────────────
    success: Palette.semantic.success,
    successSubtle: "rgba(74, 222, 128, 0.15)",
    successMuted: "rgba(74, 222, 128, 0.08)",
    successGlow: "rgba(74, 222, 128, 0.5)",

    danger: Palette.semantic.danger,
    dangerSubtle: "rgba(244, 63, 94, 0.15)",
    dangerMuted: "rgba(244, 63, 94, 0.08)",
    dangerGlow: "rgba(244, 63, 94, 0.5)",

    warning: Palette.semantic.warning,
    warningSubtle: "rgba(250, 204, 21, 0.15)",
    warningMuted: "rgba(250, 204, 21, 0.08)",

    info: Palette.semantic.info,
    infoSubtle: "rgba(56, 189, 248, 0.15)",
    infoMuted: "rgba(56, 189, 248, 0.08)",

    // ─── Borders (Metallic Edges - defined by light) ─────────────────────────
    border: Palette.vanta.graphite,
    borderFocus: Palette.metal.gold,
    borderGlass: "rgba(255, 255, 255, 0.08)",
    borderCard: Palette.vanta.steel,
    borderGold: `${Palette.metal.gold}50`,

    // ─── Shadows (Rely on borders & glows - contact shadows invisible) ───────
    shadowXs: "0 0 0 1px rgba(255, 255, 255, 0.03)",
    shadowSm: "0 2px 8px rgba(0, 0, 0, 0.6)",
    shadowMd: "0 8px 24px rgba(0, 0, 0, 0.7)",
    shadowLg: "0 16px 48px rgba(0, 0, 0, 0.85)",
    shadowXl: "0 24px 64px rgba(0, 0, 0, 0.95)",
    shadowInner: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    shadowGlow: `0 0 32px ${Palette.metal.gold}40`,
    shadowCardFloat: `0 0 1px ${Palette.metal.gold}30, 0 8px 32px rgba(0, 0, 0, 0.6)`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📏 SPACING & LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

export const Spacing = {
  "3xs": 1,
  "2xs": 2,
  xxs: 2, // Alias for legacy compatibility
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,
};

export const Radius = {
  none: 0,
  xs: 2, // Surgical precision
  sm: 4,
  md: 8,
  lg: 12, // Standard card
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 32,
  full: 9999,
};

export const Layout = {
  screenPadding: Spacing.xl,
  maxWidth: 430,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPOGRAPHY - Technical Precision & Royal Expression
// ═══════════════════════════════════════════════════════════════════════════════

const fonts = {
  // Technical Sans (Precision, Laser-etched feel)
  sans: {
    regular: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semibold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
    heavy: "Manrope_800ExtraBold",
  },
  // Royal Serif (Luxury expression) - Placeholder
  serif: {
    regular: "Manrope_400Regular",
    bold: "Manrope_700Bold",
  },
};

export const Typography = {
  // ─── Display (Hero Numbers - Fiber Optic Projection) ───────────────────────
  display: {
    xl: {
      fontSize: 64,
      lineHeight: 72,
      fontFamily: fonts.sans.heavy,
      letterSpacing: -2,
    },
    lg: {
      fontSize: 48,
      lineHeight: 56,
      fontFamily: fonts.sans.heavy,
      letterSpacing: -1.5,
    },
    md: {
      fontSize: 36,
      lineHeight: 44,
      fontFamily: fonts.sans.heavy,
      letterSpacing: -1,
    },
    sm: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: fonts.sans.heavy,
      letterSpacing: -0.5,
    },
  },

  // ─── Headings (Technical Precision) ────────────────────────────────────────
  heading: {
    xl: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: fonts.sans.bold,
      letterSpacing: -0.3,
    },
    lg: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: fonts.sans.bold,
      letterSpacing: -0.2,
    },
    md: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: fonts.sans.bold,
      letterSpacing: -0.1,
    },
    sm: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: fonts.sans.semibold,
    },
    xs: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fonts.sans.semibold,
    },
  },

  // ─── Body (Chirurgical Clarity) ────────────────────────────────────────────
  body: {
    lg: { fontSize: 16, lineHeight: 24, fontFamily: fonts.sans.regular },
    md: { fontSize: 14, lineHeight: 20, fontFamily: fonts.sans.regular },
    sm: { fontSize: 13, lineHeight: 18, fontFamily: fonts.sans.regular },
    xs: { fontSize: 12, lineHeight: 16, fontFamily: fonts.sans.regular },
  },

  // ─── Labels (System Status - Uppercase Tracking) ───────────────────────────
  label: {
    lg: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.sans.bold,
      textTransform: "uppercase" as const,
      letterSpacing: 1.5,
    },
    md: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fonts.sans.semibold,
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
    sm: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fonts.sans.semibold,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
    },
    xs: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.sans.semibold,
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
    },
  },

  // ─── Numeric (Tabular - Metrics Display) ───────────────────────────────────
  number: {
    xl: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: fonts.sans.heavy,
      fontVariant: tabularNums,
    },
    lg: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: fonts.sans.bold,
      fontVariant: tabularNums,
    },
    md: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: fonts.sans.semibold,
      fontVariant: tabularNums,
    },
    sm: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: fonts.sans.semibold,
      fontVariant: tabularNums,
    },
    xs: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fonts.sans.medium,
      fontVariant: tabularNums,
    },
  },

  // ─── Mono (Code / Technical Data) ──────────────────────────────────────────
  mono: {
    md: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.sans.medium,
      letterSpacing: 0.5,
    },
    sm: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fonts.sans.medium,
      letterSpacing: 0.3,
    },
  },

  // ─── Hero (Legacy - Large Display Numbers) ─────────────────────────────────
  hero: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fonts.sans.heavy,
    letterSpacing: -1.5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 REACT NAVIGATION ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

const navFonts = {
  regular: { fontFamily: fonts.sans.regular, fontWeight: "400" as const },
  medium: { fontFamily: fonts.sans.medium, fontWeight: "500" as const },
  bold: { fontFamily: fonts.sans.bold, fontWeight: "700" as const },
  heavy: { fontFamily: fonts.sans.heavy, fontWeight: "800" as const },
};

export const NavigationTheme = {
  light: {
    dark: false,
    colors: {
      primary: Theme.light.primary,
      background: Theme.light.background,
      card: Theme.light.surface,
      text: Theme.light.text,
      border: Theme.light.border,
      notification: Theme.light.danger,
    },
    fonts: navFonts,
  },
  dark: {
    dark: true,
    colors: {
      primary: Theme.dark.primary,
      background: Theme.dark.background,
      card: Theme.dark.surface,
      text: Theme.dark.text,
      border: Theme.dark.border,
      notification: Theme.dark.danger,
    },
    fonts: navFonts,
  },
};
