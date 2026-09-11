/**
 * 🍩 VANTA PIE CHART — Platform Distribution
 *
 * Victory Native pie/donut chart showing sales by platform.
 * Color-coded segments with legend.
 */

import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import type { PlatformData } from "@/utils/data/chart-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Platform colors
const PLATFORM_COLORS = [
  Palette.metal.gold,
  "#10B981", // emerald
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#EC4899", // pink
  "#8B5CF6", // violet
  "#06B6D4", // cyan
];

interface VantaPieChartProps {
  data: PlatformData[];
}

export function VantaPieChart({ data }: VantaPieChartProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();

  if (data.length === 0) {
    return (
      <ObsidianBlock variant="simple" style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("dashboard.charts.platformDistribution")}
        </Text>
        <View style={styles.emptyState}>
          <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
            {t("dashboard.charts.noData")}
          </Text>
        </View>
      </ObsidianBlock>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <ObsidianBlock variant="simple" style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t("dashboard.charts.platformDistribution")}
      </Text>

      {/* Simple visual bars instead of Skia Pie (more reliable cross-platform) */}
      <View style={styles.barsContainer}>
        {data.map((platform, index) => {
          const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length];
          const percentage =
            totalRevenue > 0
              ? Math.round((platform.revenue / totalRevenue) * 100)
              : 0;

          return (
            <View key={platform.platform} style={styles.platformRow}>
              <View style={styles.platformInfo}>
                <View
                  style={[styles.colorDot, { backgroundColor: color }]}
                />
                <Text
                  style={[Typography.body.sm, { color: theme.text, flex: 1 }]}
                  numberOfLines={1}
                >
                  {platform.label}
                </Text>
                <Text
                  style={[
                    Typography.label.sm,
                    { color: theme.textSecondary },
                  ]}
                >
                  {percentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: theme.dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: color,
                      width: `${Math.max(percentage, 2)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[Typography.label.xs, { color: theme.textMuted }]}
              >
                {platform.count}{" "}
                {t("dashboard.charts.salesCount", {
                  count: platform.count,
                }).replace(`${platform.count} `, "")}
                {" · "}
                {platform.revenue.toFixed(0)}€
              </Text>
            </View>
          );
        })}
      </View>
    </ObsidianBlock>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.heading.sm,
  },
  emptyState: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  barsContainer: {
    gap: Spacing.lg,
  },
  platformRow: {
    gap: Spacing.xs,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
});
