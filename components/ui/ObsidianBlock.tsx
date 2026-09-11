/**
 * 🌌 OBSIDIAN BLOCK - Shared Vanta-Aether Block Component
 *
 * "Polished Obsidian with surgical reflections"
 *
 * Two variants:
 * - "simple": Surface + borderGlass (used by Stock, Lots screens)
 * - "premium": Obsidian BG + top shine gradient + glow position (used by Dashboard)
 */

import { useVantaTheme } from "@/components/ui/PremiumUI";
import React from "react";
import { View, type ViewStyle } from "react-native";

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

  // ─── Premium variant (Dashboard) — works for all 6 themes ──────────
  return (
    <View
      style={[
        {
          backgroundColor: theme.dark ? theme.surface : theme.surfaceHighlight,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.dark ? theme.borderGlass : `${theme.primary}15`,
          overflow: "hidden",
          boxShadow: theme.dark
            ? "0 2px 8px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.02)",
        },
        style,
      ]}
    >
      {/* Top shine line (surgical reflection) — dark themes only */}
      {theme.dark && hasTopShine && (
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
