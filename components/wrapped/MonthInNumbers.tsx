/**
 * WRAPPED SLIDE 1 — Month in Numbers
 *
 * Animated counters: revenue, items sold, best day.
 */

import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Spacing, Typography } from "@/constants/Theme";
import type { WrappedData } from "@/utils/data/wrapped-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface MonthInNumbersProps {
  data: WrappedData;
  reduceMotion: boolean;
}

export function MonthInNumbers({ data, reduceMotion }: MonthInNumbersProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { width, height } = useWindowDimensions();

  const stats = [
    {
      label: t("wrapped.slide1.revenue"),
      value: `${data.totalRevenue.toFixed(0)}€`,
      color: theme.primary,
    },
    {
      label: t("wrapped.slide1.itemsSold"),
      value: String(data.itemsSold),
      color: theme.success,
    },
    {
      label: t("wrapped.slide1.bestDay"),
      value: data.bestDay
        ? `${data.bestDay.revenue.toFixed(0)}€`
        : "—",
      color: theme.warning,
    },
  ];

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.content}>
        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(100).duration(600).springify()
          }
          style={[Typography.heading.lg, { color: theme.text, textAlign: "center" }]}
        >
          {t("wrapped.slide1.title")}
        </Animated.Text>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Animated.View
              key={stat.label}
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(300 + index * 150)
                      .duration(500)
                      .springify()
              }
              style={styles.statCard}
            >
              <Text
                style={[
                  Typography.heading.xl,
                  { color: stat.color, textAlign: "center" },
                ]}
              >
                {stat.value}
              </Text>
              <Text
                style={[
                  Typography.label.sm,
                  { color: theme.textMuted, textAlign: "center", marginTop: Spacing.xs },
                ]}
              >
                {stat.label}
              </Text>
            </Animated.View>
          ))}
        </View>

        {data.bestDay && (
          <Animated.Text
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(800).duration(500).springify()
            }
            style={[
              Typography.body.sm,
              { color: theme.textMuted, textAlign: "center" },
            ]}
          >
            {data.bestDay.date}
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing["3xl"],
    alignItems: "center",
  },
  statsGrid: {
    gap: Spacing["2xl"],
    width: "100%",
  },
  statCard: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
});
