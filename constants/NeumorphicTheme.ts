/**
 * 🎨 OPTIMUS VINTAGE - NEUMORPHIC DESIGN SYSTEM
 *
 * Thème Neumorphique Dark - Fidèle au design de référence
 * Style: Soft UI, 3D shadows, Glow accents
 * Primary: #00D084 (Mint Green)
 * Background: #1E1E24 (Dark Charcoal)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 NEUMORPHIC PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const NeuPalette = {
  // Primary - Mint Green (action color)
  primary: {
    main: "#00D084",
    dark: "#00a86b",
    light: "#33D99D",
    glow: "rgba(0, 208, 132, 0.4)",
    glowSm: "rgba(0, 208, 132, 0.3)",
    glowIntense: "rgba(0, 208, 132, 0.6)",
    subtle: "rgba(0, 208, 132, 0.15)",
  },

  // Background Dark
  background: {
    main: "#1E1E24",
    light: "#25252B",
    dark: "#121217",
    elevated: "#2D2D35",
    gradient: {
      start: "#25252B",
      end: "#1E1E24",
    },
  },

  // Text colors
  text: {
    primary: "#F1F5F9",
    secondary: "#94A3B8",
    muted: "#64748B",
    inverse: "#1E1E24",
    white: "#FFFFFF",
  },

  // Accent colors (pour indicateurs)
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

  // Semantic
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  // Gold for rankings
  gold: {
    main: "#FBBF24",
    glow: "rgba(251, 191, 36, 0.5)",
  },

  // Dividers
  divider: {
    light: "rgba(255, 255, 255, 0.1)",
    main: "#3F3F46",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌑 NEUMORPHIC SHADOWS (le cœur du style)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * DESIGN SYSTEM SHADOW REFERENCE:
 * ────────────────────────────────────────────────────────────────────────────────
 * 🔹 FLAT/CONVEX (Extruded) - Élément en relief, ombre externe
 *    → Light: 9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)
 *    → Dark:  6px 6px 12px #121217, -6px -6px 12px #2D2D35
 *
 * 🔻 PRESSED/INSET (Depressed) - Élément enfoncé, ombre interne
 *    → Light: inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)
 *    → Dark:  inset 6px 6px 12px #121217, inset -6px -6px 12px #2D2D35
 *
 * ⚡ ACTIVE - Transition avec scale(0.95) + shadow morph
 */

export const NeuShadows = {
  // Flat (raised element) - Ombre extérieure classique
  flat: {
    // Pour boxShadow CSS - Large
    css: "9px 9px 16px #0d0d11, -9px -9px 16px #2f2f38",
    // Pour boxShadow CSS - Medium
    cssMd: "6px 6px 12px #121217, -6px -6px 12px #2D2D35",
    // Pour boxShadow CSS - Small
    cssSm: "4px 4px 8px #121217, -4px -4px 8px #2D2D35",
    // Pour boxShadow CSS - XSmall
    cssXs: "2px 2px 4px #121217, -2px -2px 4px #2D2D35",
    // Pour iOS shadow props
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 14,
    },
    iosMd: {
      shadowColor: "#000000",
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    iosSm: {
      shadowColor: "#000000",
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
    },
    // Pour elevation Android
    android: 10,
    androidMd: 6,
    androidSm: 4,
  },

  // Convex (bombé, relief accentué) - Légèrement plus prononcé que flat
  convex: {
    css: "7px 7px 14px #0d0d11, -7px -7px 14px #32323c",
    cssSm: "5px 5px 10px #121217, -5px -5px 10px #2D2D35",
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 7, height: 7 },
      shadowOpacity: 0.55,
      shadowRadius: 14,
    },
    iosSm: {
      shadowColor: "#000000",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
    },
    android: 12,
    androidSm: 6,
  },

  // Pressed (inset/concave) - Ombre intérieure
  pressed: {
    css: "inset 6px 6px 12px #121217, inset -6px -6px 12px #2D2D35",
    cssSm: "inset 4px 4px 8px #121217, inset -4px -4px 8px #2D2D35",
    cssXs: "inset 2px 2px 4px #121217, inset -2px -2px 4px #2D2D35",
    // Note: React Native ne supporte pas inset shadows nativement
    // Simulation avec border + overlay
    borderColor: "#151518",
    overlayColor: "rgba(18, 18, 23, 0.15)",
  },

  // Icon shadow (subtil)
  icon: {
    css: "3px 3px 6px #121217, -3px -3px 6px #2D2D35",
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
    },
    android: 3,
  },

  // Primary glow (pour boutons primaires et éléments actifs)
  glow: {
    css: "0 0 20px rgba(0, 208, 132, 0.5)",
    cssMd: "0 0 15px rgba(0, 208, 132, 0.4)",
    cssSm: "0 0 10px rgba(0, 208, 132, 0.35)",
    cssXs: "0 0 6px rgba(0, 208, 132, 0.3)",
    ios: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
    },
    iosSm: {
      shadowColor: "#00D084",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
    },
  },

  // Tab bar shadow (shadow top edge)
  tabBar: {
    css: "0 -8px 25px rgba(0, 0, 0, 0.6)",
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
    },
  },

  // Card lift (survol / hover effect - web uniquement)
  hover: {
    css: "12px 12px 24px #0a0a0d, -12px -12px 24px #32323c",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 NEUMORPHIC SPACING & RADIUS
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
  screen: 24, // Padding horizontal écran
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

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPOGRAPHY (Nunito-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

const isIOS = process.env.EXPO_OS === "ios";

export const NeuTypography = {
  // Display - Hero numbers
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
    lg: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700" as const,
    },
    md: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700" as const,
    },
  },

  // Headings
  heading: {
    xl: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "800" as const,
    },
    lg: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "700" as const,
    },
    md: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700" as const,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700" as const,
    },
  },

  // Body
  body: {
    lg: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
    },
    md: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500" as const,
    },
    sm: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500" as const,
    },
    xs: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500" as const,
    },
  },

  // Labels (uppercase, tracking wide)
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

  // Numbers (tabular)
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
// 🎭 THEME OBJECT COMPLET
// ═══════════════════════════════════════════════════════════════════════════════

export const NeuTheme = {
  // Colors
  primary: NeuPalette.primary.main,
  primaryDark: NeuPalette.primary.dark,
  primaryLight: NeuPalette.primary.light,
  primaryGlow: NeuPalette.primary.glow,
  primarySubtle: NeuPalette.primary.subtle,

  // Background
  background: NeuPalette.background.main,
  backgroundLight: NeuPalette.background.light,
  backgroundDark: NeuPalette.background.dark,
  backgroundElevated: NeuPalette.background.elevated,
  cardGradientStart: NeuPalette.background.gradient.start,
  cardGradientEnd: NeuPalette.background.gradient.end,

  // Text
  text: NeuPalette.text.primary,
  textSecondary: NeuPalette.text.secondary,
  textMuted: NeuPalette.text.muted,
  textWhite: NeuPalette.text.white,

  // Accents
  ...NeuPalette.accent,

  // Semantic
  success: NeuPalette.semantic.success,
  warning: NeuPalette.semantic.warning,
  danger: NeuPalette.semantic.error,
  info: NeuPalette.semantic.info,

  // Divider
  divider: NeuPalette.divider.main,
  dividerLight: NeuPalette.divider.light,

  // Gold
  gold: NeuPalette.gold.main,
  goldGlow: NeuPalette.gold.glow,

  // Shadows (exposed for direct use)
  shadows: NeuShadows,

  // Spacing
  spacing: NeuSpacing,

  // Radius
  radius: NeuRadius,

  // Typography
  typography: NeuTypography,
};

// Export default
export default NeuTheme;
