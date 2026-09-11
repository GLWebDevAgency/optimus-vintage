/**
 * 📊 VANTA BAR CHART — Monthly Performance
 *
 * Victory Native bar chart showing last 6 months revenue.
 * Theme-aware with gold/champagne accent bars.
 */

import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Spacing, Typography } from "@/constants/Theme";
import type { MonthlyBarData } from "@/utils/data/chart-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Bar, CartesianChart } from "victory-native";

interface VantaBarChartProps {
  data: MonthlyBarData[];
  height?: number;
}

export function VantaBarChart({ data, height = 200 }: VantaBarChartProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();

  const hasData = data.some((d) => d.revenue > 0);

  if (!hasData) {
    return (
      <ObsidianBlock variant="simple" style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("dashboard.charts.monthlyPerformance")}
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
    label: d.month,
  }));

  return (
    <ObsidianBlock variant="simple" style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t("dashboard.charts.monthlyPerformance")}
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
          {({ points, chartBounds }) => (
            <Bar
              points={points.revenue}
              chartBounds={chartBounds}
              color={theme.primary}
              roundedCorners={{ topLeft: 6, topRight: 6 }}
              animate={{ type: "timing", duration: 500 }}
            />
          )}
        </CartesianChart>
      </View>

      {/* Month labels */}
      <View style={styles.labels}>
        {data.map((d) => (
          <Text
            key={d.monthKey}
            style={[
              Typography.label.xs,
              { color: theme.textMuted, flex: 1, textAlign: "center" },
            ]}
          >
            {d.month}
          </Text>
        ))}
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
  labels: {
    flexDirection: "row",
  },
});
