/**
 * 🎨 SEMANTIC DESIGN TOKENS
 *
 * Tokens de design sémantiques pour une UI cohérente et maintenable
 * Basés sur le Luxe Design System v4.0
 *
 * Partie de la roadmap mondiale 2026
 */

import { Palette, Radius, Spacing, Typography } from "./Theme";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokens de couleur sémantiques
 *
 * Utiliser ces tokens au lieu des couleurs brutes pour:
 * - Cohérence UI
 * - Support dark mode automatique
 * - Accessibilité (contraste vérifié)
 * - Maintenance facilitée
 */
export const ColorTokens = {
  // ─────────────────────────────────────────────────────────────────────────────
  // BACKGROUNDS
  // ─────────────────────────────────────────────────────────────────────────────
  background: {
    /** Fond principal de l'app */
    primary: {
      light: Palette.neutral[50],
      dark: Palette.neutral[950],
    },
    /** Fond secondaire (cartes, sections) */
    secondary: {
      light: Palette.neutral.white,
      dark: Palette.neutral[900],
    },
    /** Fond tertiaire (nested cards) */
    tertiary: {
      light: Palette.neutral[100],
      dark: Palette.neutral[800],
    },
    /** Fond inversé (pour boutons CTA) */
    inverse: {
      light: Palette.neutral[900],
      dark: Palette.neutral[50],
    },
    /** Fond overlay (modals, sheets) */
    overlay: {
      light: "rgba(0, 0, 0, 0.5)",
      dark: "rgba(0, 0, 0, 0.7)",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT
  // ─────────────────────────────────────────────────────────────────────────────
  text: {
    /** Texte principal - contraste maximum */
    primary: {
      light: Palette.neutral[900],
      dark: Palette.neutral[50],
    },
    /** Texte secondaire - labels, descriptions */
    secondary: {
      light: Palette.neutral[600],
      dark: Palette.neutral[400],
    },
    /** Texte tertiaire/muted - placeholders, hints */
    muted: {
      light: Palette.neutral[400],
      dark: Palette.neutral[500],
    },
    /** Texte désactivé */
    disabled: {
      light: Palette.neutral[300],
      dark: Palette.neutral[600],
    },
    /** Texte sur fond coloré */
    onAccent: {
      light: Palette.neutral.white,
      dark: Palette.neutral.white,
    },
    /** Texte inversé */
    inverse: {
      light: Palette.neutral.white,
      dark: Palette.neutral[900],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERACTIVE - PRIMARY
  // ─────────────────────────────────────────────────────────────────────────────
  interactive: {
    primary: {
      /** État par défaut */
      default: {
        light: Palette.emerald[500],
        dark: Palette.emerald[400],
      },
      /** État hover/focus */
      hover: {
        light: Palette.emerald[600],
        dark: Palette.emerald[500],
      },
      /** État pressed/active */
      pressed: {
        light: Palette.emerald[700],
        dark: Palette.emerald[600],
      },
      /** Fond subtle pour badges, chips */
      subtle: {
        light: Palette.emerald[50],
        dark: `${Palette.emerald[500]}20`,
      },
    },
    secondary: {
      default: {
        light: Palette.gold[500],
        dark: Palette.gold[400],
      },
      hover: {
        light: Palette.gold[600],
        dark: Palette.gold[500],
      },
      pressed: {
        light: Palette.gold[700],
        dark: Palette.gold[600],
      },
      subtle: {
        light: Palette.gold[50],
        dark: `${Palette.gold[500]}20`,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEMANTIC
  // ─────────────────────────────────────────────────────────────────────────────
  semantic: {
    success: {
      default: {
        light: Palette.success[500],
        dark: Palette.success[400],
      },
      subtle: {
        light: Palette.success[50],
        dark: `${Palette.success[500]}20`,
      },
      text: {
        light: Palette.success[700],
        dark: Palette.success[300],
      },
    },
    warning: {
      default: {
        light: Palette.warning[500],
        dark: Palette.warning[400],
      },
      subtle: {
        light: Palette.warning[50],
        dark: `${Palette.warning[500]}20`,
      },
      text: {
        light: Palette.warning[700],
        dark: Palette.warning[300],
      },
    },
    error: {
      default: {
        light: Palette.danger[500],
        dark: Palette.danger[400],
      },
      subtle: {
        light: Palette.danger[50],
        dark: `${Palette.danger[500]}20`,
      },
      text: {
        light: Palette.danger[700],
        dark: Palette.danger[300],
      },
    },
    info: {
      default: {
        light: Palette.info[500],
        dark: Palette.info[400],
      },
      subtle: {
        light: Palette.info[50],
        dark: `${Palette.info[500]}20`,
      },
      text: {
        light: Palette.info[700],
        dark: Palette.info[300],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BORDERS
  // ─────────────────────────────────────────────────────────────────────────────
  border: {
    /** Bordure par défaut */
    default: {
      light: Palette.neutral[200],
      dark: Palette.neutral[700],
    },
    /** Bordure subtle */
    subtle: {
      light: Palette.neutral[100],
      dark: Palette.neutral[800],
    },
    /** Bordure focus */
    focus: {
      light: Palette.emerald[500],
      dark: Palette.emerald[400],
    },
    /** Bordure erreur */
    error: {
      light: Palette.danger[500],
      dark: Palette.danger[400],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GLASS / BLUR EFFECTS
  // ─────────────────────────────────────────────────────────────────────────────
  glass: {
    /** Background glass léger */
    light: {
      light: "rgba(255, 255, 255, 0.7)",
      dark: "rgba(0, 0, 0, 0.3)",
    },
    /** Background glass medium */
    medium: {
      light: "rgba(255, 255, 255, 0.85)",
      dark: "rgba(0, 0, 0, 0.5)",
    },
    /** Background glass fort */
    strong: {
      light: "rgba(255, 255, 255, 0.95)",
      dark: "rgba(0, 0, 0, 0.7)",
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 SPACING TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokens d'espacement sémantiques
 */
export const SpacingTokens = {
  // Component internal padding
  component: {
    /** Padding minimal (badges, chips) */
    xs: Spacing.xs, // 4
    /** Padding petit (buttons) */
    sm: Spacing.sm, // 8
    /** Padding moyen (cards) */
    md: Spacing.md, // 12
    /** Padding large (sections) */
    lg: Spacing.lg, // 16
    /** Padding extra large (modals) */
    xl: Spacing.xl, // 24
  },

  // Layout gaps
  layout: {
    /** Gap entre éléments inline */
    inline: Spacing.sm, // 8
    /** Gap entre éléments de liste */
    list: Spacing.md, // 12
    /** Gap entre sections */
    section: Spacing.xl, // 24
    /** Gap entre grandes sections */
    page: Spacing["3xl"], // 40
  },

  // Margins
  margin: {
    /** Marge minimale */
    xs: Spacing.xs, // 4
    /** Marge petite */
    sm: Spacing.sm, // 8
    /** Marge moyenne */
    md: Spacing.lg, // 16
    /** Marge large */
    lg: Spacing.xl, // 24
    /** Marge page */
    page: Spacing.lg, // 16 (horizontal page padding)
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 RADIUS TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokens de border radius sémantiques
 */
export const RadiusTokens = {
  /** Pas de radius */
  none: 0,
  /** Radius minimal (badges, inline elements) */
  xs: Radius.xs, // 4
  /** Radius petit (chips, small buttons) */
  sm: Radius.sm, // 8
  /** Radius moyen (cards, buttons) */
  md: Radius.md, // 12
  /** Radius large (modals, sheets) */
  lg: Radius.lg, // 16
  /** Radius extra large (hero cards) */
  xl: Radius.xl, // 24
  /** Radius circulaire */
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🌑 SHADOW TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokens d'ombres sémantiques (CSS boxShadow)
 * Note: Utiliser boxShadow style prop, pas les legacy shadow* props
 */
export const ShadowTokens = {
  /** Aucune ombre */
  none: "none",

  /** Ombre minimale - éléments subtils */
  xs: "0 1px 2px rgba(0, 0, 0, 0.05)",

  /** Ombre petite - boutons, chips */
  sm: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",

  /** Ombre moyenne - cartes */
  md: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",

  /** Ombre large - modals, popovers */
  lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",

  /** Ombre extra large - sheets flottants */
  xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",

  /** Ombre premium avec glow */
  glow: {
    emerald: `0 0 20px ${Palette.emerald[500]}40`,
    gold: `0 0 20px ${Palette.gold[500]}40`,
    danger: `0 0 20px ${Palette.danger[500]}40`,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ ANIMATION TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokens d'animation
 */
export const AnimationTokens = {
  /** Durées */
  duration: {
    /** Ultra rapide - micro-interactions */
    instant: 100,
    /** Rapide - feedback */
    fast: 200,
    /** Normal - transitions */
    normal: 300,
    /** Lent - entrées/sorties */
    slow: 500,
    /** Très lent - animations complexes */
    slower: 800,
  },

  /** Easings pour withTiming */
  easing: {
    /** Standard - la plupart des animations */
    standard: { duration: 300 },
    /** Entrée - éléments qui apparaissent */
    enter: { duration: 300 },
    /** Sortie - éléments qui disparaissent */
    exit: { duration: 200 },
    /** Emphasis - attirer l'attention */
    emphasis: { duration: 500 },
  },

  /** Spring configs pour withSpring */
  spring: {
    /** Bouncy - animations playful */
    bouncy: { damping: 10, stiffness: 100 },
    /** Standard - la plupart des cas */
    standard: { damping: 15, stiffness: 150 },
    /** Stiff - réponse rapide */
    stiff: { damping: 20, stiffness: 300 },
    /** Gentle - animations subtiles */
    gentle: { damping: 20, stiffness: 100 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPOGRAPHY TOKENS (RE-EXPORT WITH SEMANTIC NAMES)
// ═══════════════════════════════════════════════════════════════════════════════

export const TypographyTokens = {
  /** Titres de page principaux */
  pageTitle: Typography.display.lg,

  /** Titres de section */
  sectionTitle: Typography.heading.lg,

  /** Titres de carte */
  cardTitle: Typography.heading.md,

  /** Sous-titres */
  subtitle: Typography.heading.sm,

  /** Corps de texte */
  body: Typography.body.md,

  /** Petits corps de texte */
  bodySmall: Typography.body.sm,

  /** Labels (inputs, form fields) */
  label: Typography.label.sm,

  /** Captions */
  caption: Typography.label.xs,

  /** Nombres/stats grands */
  stat: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Manrope_700Bold",
  },

  /** Badges/chips */
  badge: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Manrope_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 HELPER: GET TOKEN VALUE FOR CURRENT COLOR SCHEME
// ═══════════════════════════════════════════════════════════════════════════════

type ColorScheme = "light" | "dark";

/**
 * Helper pour récupérer la valeur d'un token selon le color scheme
 *
 * @example
 * ```tsx
 * const colorScheme = useColorScheme() ?? 'light';
 * const bgColor = getTokenValue(ColorTokens.background.primary, colorScheme);
 * ```
 */
export function getTokenValue<T extends { light: string; dark: string }>(
  token: T,
  colorScheme: ColorScheme,
): string {
  return token[colorScheme];
}

/**
 * Hook pour créer un theme object à partir des tokens
 * Utilise le color scheme actuel
 */
export function useDesignTokens(colorScheme: ColorScheme = "light") {
  return {
    colors: {
      background: {
        primary: getTokenValue(ColorTokens.background.primary, colorScheme),
        secondary: getTokenValue(ColorTokens.background.secondary, colorScheme),
        tertiary: getTokenValue(ColorTokens.background.tertiary, colorScheme),
        inverse: getTokenValue(ColorTokens.background.inverse, colorScheme),
        overlay: getTokenValue(ColorTokens.background.overlay, colorScheme),
      },
      text: {
        primary: getTokenValue(ColorTokens.text.primary, colorScheme),
        secondary: getTokenValue(ColorTokens.text.secondary, colorScheme),
        muted: getTokenValue(ColorTokens.text.muted, colorScheme),
        disabled: getTokenValue(ColorTokens.text.disabled, colorScheme),
        onAccent: getTokenValue(ColorTokens.text.onAccent, colorScheme),
        inverse: getTokenValue(ColorTokens.text.inverse, colorScheme),
      },
      interactive: {
        primary: getTokenValue(
          ColorTokens.interactive.primary.default,
          colorScheme,
        ),
        primaryHover: getTokenValue(
          ColorTokens.interactive.primary.hover,
          colorScheme,
        ),
        primaryPressed: getTokenValue(
          ColorTokens.interactive.primary.pressed,
          colorScheme,
        ),
        primarySubtle: getTokenValue(
          ColorTokens.interactive.primary.subtle,
          colorScheme,
        ),
        secondary: getTokenValue(
          ColorTokens.interactive.secondary.default,
          colorScheme,
        ),
        secondarySubtle: getTokenValue(
          ColorTokens.interactive.secondary.subtle,
          colorScheme,
        ),
      },
      semantic: {
        success: getTokenValue(
          ColorTokens.semantic.success.default,
          colorScheme,
        ),
        successSubtle: getTokenValue(
          ColorTokens.semantic.success.subtle,
          colorScheme,
        ),
        warning: getTokenValue(
          ColorTokens.semantic.warning.default,
          colorScheme,
        ),
        warningSubtle: getTokenValue(
          ColorTokens.semantic.warning.subtle,
          colorScheme,
        ),
        error: getTokenValue(ColorTokens.semantic.error.default, colorScheme),
        errorSubtle: getTokenValue(
          ColorTokens.semantic.error.subtle,
          colorScheme,
        ),
        info: getTokenValue(ColorTokens.semantic.info.default, colorScheme),
        infoSubtle: getTokenValue(
          ColorTokens.semantic.info.subtle,
          colorScheme,
        ),
      },
      border: {
        default: getTokenValue(ColorTokens.border.default, colorScheme),
        subtle: getTokenValue(ColorTokens.border.subtle, colorScheme),
        focus: getTokenValue(ColorTokens.border.focus, colorScheme),
        error: getTokenValue(ColorTokens.border.error, colorScheme),
      },
      glass: {
        light: getTokenValue(ColorTokens.glass.light, colorScheme),
        medium: getTokenValue(ColorTokens.glass.medium, colorScheme),
        strong: getTokenValue(ColorTokens.glass.strong, colorScheme),
      },
    },
    spacing: SpacingTokens,
    radius: RadiusTokens,
    shadows: ShadowTokens,
    animation: AnimationTokens,
    typography: TypographyTokens,
  };
}

export type DesignTokensTheme = ReturnType<typeof useDesignTokens>;
