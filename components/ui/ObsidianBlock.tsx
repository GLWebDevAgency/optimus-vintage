/**
 * 🌌 OBSIDIAN BLOCK - Shared Vanta-Aether Block Component
 *
 * "Polished Obsidian with surgical reflections"
 *
 * Two variants:
 * - "simple": Surface + borderGlass (used by Stock, Lots screens)
 * - "premium": Obsidian BG + top shine gradient + glow position (used by Dashboard)
 */

import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette } from "@/constants/Theme";
import React from "react";
import { View, type ViewStyle } from "react-native";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VANTA TOKENS (dashboard-specific dark values)
// ═══════════════════════════════════════════════════════════════════════════════

const OBSIDIAN_BG = "#0a0a0a";

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ObsidianGlowPosition = "bottom-right" | "top-left" | "center";

export interface ObsidianBlockProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** "simple" = theme.surface BG, "premium" = Obsidian + shine */
  variant?: "simple" | "premium";
  /** Only for variant="premium" */
  glowPosition?: ObsidianGlowPosition;
  /** Only for variant="premium" */
  hasTopShine?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ObsidianBlock({
  children,
  style,
  variant = "simple",
  glowPosition = "bottom-right",
  hasTopShine = true,
}: ObsidianBlockProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();

  // ─── Simple variant (Stock, Lots) ────────────────────────────────────
  if (variant === "simple") {
    return (
      <View
        style={[
          {
            backgroundColor: theme.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.borderGlass,
            borderCurve: "continuous",
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ─── Premium variant (Dashboard) ────────────────────────────────────
  if (!isDark) {
    // Light mode: Ivory styling
    return (
      <View
        style={[
          {
            backgroundColor: Palette.ivory.pearl,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: `${Palette.metal.champagne}15`,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: OBSIDIAN_BG,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.06)",
          overflow: "hidden",
        },
        style,
      ]}
    >
      {/* Top shine line (surgical reflection) */}
      {hasTopShine && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            experimental_backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      )}

      {children}
    </View>
  );
}
