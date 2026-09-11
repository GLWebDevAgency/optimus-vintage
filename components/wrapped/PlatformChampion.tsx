/**
 * WRAPPED SLIDE 3 — Platform Champion
 *
 * Mini platform breakdown with winner highlight.
 */

import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import type { WrappedData } from "@/utils/data/wrapped-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const PLATFORM_COLORS = [
  Palette.metal.gold,
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#EC4899",
];

interface PlatformChampionProps {
  data: WrappedData;
  reduceMotion: boolean;
}

export function PlatformChampion({
  data,
  reduceMotion,
}: PlatformChampionProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { width, height } = useWindowDimensions();

  const totalRevenue = data.platformBreakdown.reduce(
    (sum, p) => sum + p.revenue,
    0,
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.content}>
        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(100).duration(600).springify()
          }
          style={[
            Typography.heading.lg,
            { color: theme.text, textAlign: "center" },
          ]}
        >
          {t("wrapped.slide3.title")}
        </Animated.Text>

        <View style={styles.platforms}>
          {data.platformBreakdown.slice(0, 5).map((platform, index) => {
            const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length];
            const pct =
              totalRevenue > 0
                ? Math.round((platform.revenue / totalRevenue) * 100)
                : 0;

            return (
              <Animated.View
                key={platform.platform}
                entering={
                  reduceMotion
                    ? undefined
                    : FadeInDown.delay(300 + index * 120)
                        .duration(500)
                        .springify()
                }
              >
                <ObsidianBlock
                  variant={index === 0 ? "premium" : "simple"}
                  style={styles.platformCard}
                >
                  <View style={styles.platformRow}>
                    <View
                      style={[styles.dot, { backgroundColor: color }]}
                    />
                    <Text
                      style={[
                        Typography.body.md,
                        {
                          color: theme.text,
                          flex: 1,
                          fontWeight: index === 0 ? "700" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {platform.platform}
                    </Text>
                    <Text
                      style={[
                        Typography.heading.sm,
                        { color: index === 0 ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {pct}%
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
                        { backgroundColor: color, width: `${Math.max(pct, 3)}%` },
                      ]}
                    />
                  </View>
                  <Text
                    style={[Typography.label.xs, { color: theme.textMuted }]}
                  >
                    {t("wrapped.slide3.sales", { count: platform.count })}
                    {" · "}
                    {platform.revenue.toFixed(0)}€
                  </Text>
                </ObsidianBlock>
              </Animated.View>
            );
          })}
        </View>
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
    gap: Spacing["2xl"],
    width: "100%",
  },
  platforms: {
    gap: Spacing.md,
  },
  platformCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
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
