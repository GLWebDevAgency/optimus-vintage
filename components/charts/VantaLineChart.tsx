/**
 * 📈 VANTA LINE CHART — Revenue Trend
 *
 * Victory Native line chart with theme-aware colors.
 * Displays revenue over time, synced with period selector.
 */

import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Spacing, Typography } from "@/constants/Theme";
import type { RevenueDataPoint } from "@/utils/data/chart-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line } from "victory-native";

interface VantaLineChartProps {
  data: RevenueDataPoint[];
  height?: number;
}

export function VantaLineChart({ data, height = 200 }: VantaLineChartProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();

  if (data.length === 0) {
    return (
      <ObsidianBlock variant="simple" style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("dashboard.charts.revenueTrend")}
        </Text>
        <View style={[styles.emptyState, { height }]}>
          <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
            {t("dashboard.charts.noData")}
          </Text>
        </View>
      </ObsidianBlock>
    );
  }

  const chartData = data.map((d, i) => ({
    x: i,
    revenue: d.revenue,
    label: d.label,
  }));

  return (
    <ObsidianBlock variant="simple" style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t("dashboard.charts.revenueTrend")}
      </Text>
      <View style={{ height }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["revenue"]}
          axisOptions={{
            font: null,
            lineColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
            labelColor: isDark
              ? "rgba(255,255,255,0.4)"
              : "rgba(0,0,0,0.4)",
          }}
        >
          {({ points }) => (
            <Line
              points={points.revenue}
              color={theme.primary}
              strokeWidth={2.5}
              curveType="natural"
              animate={{ type: "timing", duration: 500 }}
            />
          )}
        </CartesianChart>
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
    alignItems: "center",
    justifyContent: "center",
  },
});
