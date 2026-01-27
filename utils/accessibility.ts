/**
 * 🎯 ACCESSIBILITY UTILITIES
 *
 * Hooks et utilitaires pour l'accessibilité WCAG 2.2 AA
 * Partie de la roadmap mondiale 2026
 */

import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ACCESSIBILITY HOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface AccessibilityState {
  /** Reduce Motion activé (animations réduites) */
  isReduceMotionEnabled: boolean;
  /** Screen Reader actif (VoiceOver/TalkBack) */
  isScreenReaderEnabled: boolean;
  /** Texte en gras activé (iOS) */
  isBoldTextEnabled: boolean;
  /** Grayscale activé (daltonisme) */
  isGrayscaleEnabled: boolean;
  /** Invert Colors activé */
  isInvertColorsEnabled: boolean;
  /** Reduce Transparency activé (iOS) */
  isReduceTransparencyEnabled: boolean;
}

/**
 * Hook pour accéder aux préférences d'accessibilité du système
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isReduceMotionEnabled, isScreenReaderEnabled } = useAccessibility();
 *
 *   return (
 *     <Animated.View
 *       entering={isReduceMotionEnabled ? undefined : FadeIn}
 *     >
 *       {isScreenReaderEnabled && <Text>Description complète</Text>}
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useAccessibility(): AccessibilityState {
  const [state, setState] = useState<AccessibilityState>({
    isReduceMotionEnabled: false,
    isScreenReaderEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    isReduceTransparencyEnabled: false,
  });

  useEffect(() => {
    // Initial fetch
    const fetchSettings = async () => {
      const [
        reduceMotion,
        screenReader,
        boldText,
        grayscale,
        invertColors,
        reduceTransparency,
      ] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
        Platform.OS === "ios"
          ? (AccessibilityInfo.isBoldTextEnabled?.() ?? Promise.resolve(false))
          : Promise.resolve(false),
        Platform.OS === "ios"
          ? (AccessibilityInfo.isGrayscaleEnabled?.() ?? Promise.resolve(false))
          : Promise.resolve(false),
        Platform.OS === "ios"
          ? (AccessibilityInfo.isInvertColorsEnabled?.() ??
            Promise.resolve(false))
          : Promise.resolve(false),
        Platform.OS === "ios"
          ? (AccessibilityInfo.isReduceTransparencyEnabled?.() ??
            Promise.resolve(false))
          : Promise.resolve(false),
      ]);

      setState({
        isReduceMotionEnabled: reduceMotion,
        isScreenReaderEnabled: screenReader,
        isBoldTextEnabled: boldText,
        isGrayscaleEnabled: grayscale,
        isInvertColorsEnabled: invertColors,
        isReduceTransparencyEnabled: reduceTransparency,
      });
    };

    fetchSettings();

    // Subscribe to changes
    const subscriptions = [
      AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) =>
        setState((s) => ({ ...s, isReduceMotionEnabled: enabled })),
      ),
      AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) =>
        setState((s) => ({ ...s, isScreenReaderEnabled: enabled })),
      ),
    ];

    // iOS-specific listeners
    if (Platform.OS === "ios") {
      subscriptions.push(
        AccessibilityInfo.addEventListener("boldTextChanged", (enabled) =>
          setState((s) => ({ ...s, isBoldTextEnabled: enabled })),
        ),
        AccessibilityInfo.addEventListener("grayscaleChanged", (enabled) =>
          setState((s) => ({ ...s, isGrayscaleEnabled: enabled })),
        ),
        AccessibilityInfo.addEventListener("invertColorsChanged", (enabled) =>
          setState((s) => ({ ...s, isInvertColorsEnabled: enabled })),
        ),
        AccessibilityInfo.addEventListener(
          "reduceTransparencyChanged",
          (enabled) =>
            setState((s) => ({ ...s, isReduceTransparencyEnabled: enabled })),
        ),
      );
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
    };
  }, []);

  return state;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ACCESSIBILITY PROPS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

type AccessibilityRole =
  | "none"
  | "button"
  | "link"
  | "search"
  | "image"
  | "text"
  | "adjustable"
  | "header"
  | "summary"
  | "imagebutton"
  | "checkbox"
  | "radio"
  | "switch"
  | "menu"
  | "menuitem"
  | "menubar"
  | "tab"
  | "tablist"
  | "timer"
  | "toolbar"
  | "list"
  | "listitem"
  | "progressbar"
  | "spinbutton"
  | "alert"
  | "combobox"
  | "grid"
  | "scrollbar"
  | "slider";

interface A11yButtonProps {
  accessibilityRole: "button";
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    busy?: boolean;
    expanded?: boolean;
  };
}

/**
 * Génère les props d'accessibilité pour un bouton
 *
 * @example
 * ```tsx
 * <Pressable
 *   onPress={handleSave}
 *   {...a11yButton('Enregistrer', 'Sauvegarde les modifications', { disabled: isLoading })}
 * >
 *   <Text>Enregistrer</Text>
 * </Pressable>
 * ```
 */
export function a11yButton(
  label: string,
  hint?: string,
  state?: A11yButtonProps["accessibilityState"],
): A11yButtonProps {
  return {
    accessibilityRole: "button",
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
  };
}

interface A11yLinkProps {
  accessibilityRole: "link";
  accessibilityLabel: string;
  accessibilityHint?: string;
}

/**
 * Génère les props d'accessibilité pour un lien
 */
export function a11yLink(label: string, hint?: string): A11yLinkProps {
  return {
    accessibilityRole: "link",
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

interface A11yImageProps {
  accessibilityRole: "image";
  accessibilityLabel: string;
  accessible: boolean;
}

/**
 * Génère les props d'accessibilité pour une image
 */
export function a11yImage(description: string): A11yImageProps {
  return {
    accessibilityRole: "image",
    accessibilityLabel: description,
    accessible: true,
  };
}

interface A11yHeaderProps {
  accessibilityRole: "header";
  accessibilityLabel?: string;
}

/**
 * Génère les props d'accessibilité pour un header
 */
export function a11yHeader(label?: string): A11yHeaderProps {
  return {
    accessibilityRole: "header",
    accessibilityLabel: label,
  };
}

interface A11yListItemProps {
  accessibilityRole: "button";
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * Génère les props d'accessibilité pour un item de liste cliquable
 *
 * @example
 * ```tsx
 * <Pressable
 *   onPress={() => navigateToLot(lot.id)}
 *   {...a11yListItem(
 *     `Lot ${lot.name}, ${lot.initialQuantity} pièces`,
 *     'Ouvrir les détails du lot',
 *     `${soldCount} vendus sur ${lot.initialQuantity}`
 *   )}
 * >
 * ```
 */
export function a11yListItem(
  label: string,
  hint?: string,
  valueText?: string,
): A11yListItemProps {
  return {
    accessibilityRole: "button",
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityValue: valueText ? { text: valueText } : undefined,
  };
}

interface A11yProgressProps {
  accessibilityRole: "progressbar";
  accessibilityLabel: string;
  accessibilityValue: {
    min: number;
    max: number;
    now: number;
    text?: string;
  };
}

/**
 * Génère les props d'accessibilité pour une barre de progression
 *
 * @example
 * ```tsx
 * <View
 *   {...a11yProgress('Progression des ventes', 0, 100, 75, '75% vendu')}
 * >
 *   <View style={{ width: '75%' }} />
 * </View>
 * ```
 */
export function a11yProgress(
  label: string,
  min: number,
  max: number,
  now: number,
  text?: string,
): A11yProgressProps {
  return {
    accessibilityRole: "progressbar",
    accessibilityLabel: label,
    accessibilityValue: { min, max, now, text },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SCREEN READER ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Annonce un message au screen reader
 *
 * @example
 * ```tsx
 * async function handleSave() {
 *   await saveSale();
 *   announce('Vente enregistrée avec succès');
 * }
 * ```
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Annonce un message poliment (après le message en cours)
 * iOS uniquement - sur Android, utilise announce standard
 */
export function announcePolite(message: string): void {
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibilityWithOptions?.(message, {
      queue: true,
    });
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COLOR CONTRAST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule le ratio de contraste entre deux couleurs (WCAG 2.1)
 * Retourne un ratio entre 1 et 21
 *
 * - 4.5:1 minimum pour texte normal (WCAG AA)
 * - 3:1 minimum pour grand texte (>= 18pt ou 14pt bold)
 * - 7:1 pour WCAG AAA
 */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Vérifie si le contraste est suffisant pour WCAG AA
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 3 : 4.5);
}

/**
 * Vérifie si le contraste est suffisant pour WCAG AAA
 */
export function meetsContrastAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 4.5 : 7);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 FOCUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Met le focus sur un élément après un délai
 * Utile après une navigation ou un changement d'état
 *
 * @example
 * ```tsx
 * const inputRef = useRef<TextInput>(null);
 *
 * useEffect(() => {
 *   if (showInput) {
 *     focusWithDelay(inputRef);
 *   }
 * }, [showInput]);
 * ```
 */
export function focusWithDelay(
  ref: React.RefObject<{ focus: () => void }>,
  delayMs: number = 100,
): void {
  setTimeout(() => {
    ref.current?.focus();
  }, delayMs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ACCESSIBILITY CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Taille minimum recommandée pour les cibles tactiles (44x44 pts) */
export const MIN_TOUCH_TARGET_SIZE = 44;

/** Durée minimum recommandée pour les timeouts avec interaction */
export const MIN_TIMEOUT_INTERACTIVE = 20000; // 20 secondes

/** Animation duration maximum pour reduce motion */
export const MAX_ANIMATION_DURATION_REDUCED = 0;

/** Labels communs pour l'application */
export const A11Y_LABELS = {
  // Navigation
  back: "Retour",
  close: "Fermer",
  menu: "Menu",
  search: "Rechercher",
  settings: "Paramètres",

  // Actions
  add: "Ajouter",
  edit: "Modifier",
  delete: "Supprimer",
  save: "Enregistrer",
  cancel: "Annuler",
  confirm: "Confirmer",
  refresh: "Actualiser",

  // Status
  loading: "Chargement en cours",
  error: "Erreur",
  success: "Succès",
  empty: "Aucun élément",

  // Domain specific
  lot: "Lot",
  item: "Article",
  sale: "Vente",
  stock: "Stock",
  dashboard: "Tableau de bord",
  profit: "Bénéfice",
  loss: "Perte",
} as const;
