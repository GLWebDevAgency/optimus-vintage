/**
 * 📤 SHAREABLE CARD
 *
 * Branded card template that can be captured as PNG
 * for social sharing. Uses ViewShot for capture.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";

interface ShareableCardProps {
  /** Main stat value (e.g. "2,450€") */
  title: string;
  /** Label above title (e.g. "Monthly Revenue") */
  label: string;
  /** Optional secondary stats */
  stats?: { label: string; value: string }[];
  /** Optional subtitle below title */
  subtitle?: string;
}

export const ShareableCard = forwardRef<ViewShot, ShareableCardProps>(
  function ShareableCard({ title, label, stats, subtitle }, ref) {
    const theme = useVantaTheme();
    const isDark = useIsDarkMode();
    const { t } = useLocale();

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1, result: "tmpfile" }}
      >
        <View style={[styles.card, { backgroundColor: "#0a0a0a" }]}>
          {/* Brand Header */}
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>OV</Text>
            </View>
            <Text style={styles.brandName}>Optimus Vintage</Text>
          </View>

          {/* Label */}
          <Text style={styles.label}>{label}</Text>

          {/* Main Value */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {/* Stats Row */}
          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              {t("sharing.shareCard")} — optimus-vintage.app
            </Text>
          </View>
        </View>
      </ViewShot>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    padding: Spacing["2xl"],
    borderRadius: Radius.xl,
    gap: Spacing.md,
    minWidth: 320,
    maxWidth: 400,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.metal.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0a0a0a",
  },
  brandName: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  label: {
    ...Typography.label.sm,
    color: Palette.metal.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    ...Typography.heading.xl,
    color: "#ffffff",
    letterSpacing: -1,
  },
  subtitle: {
    ...Typography.body.sm,
    color: "rgba(255,255,255,0.5)",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    ...Typography.heading.sm,
    color: "#ffffff",
  },
  statLabel: {
    ...Typography.label.xs,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  footerLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
