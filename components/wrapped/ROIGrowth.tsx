/**
 * WRAPPED SLIDE 4 — ROI Growth
 *
 * Month-over-month comparison with growth arrow.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import type { WrappedData } from "@/utils/data/wrapped-data";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface ROIGrowthProps {
  data: WrappedData;
  reduceMotion: boolean;
}

export function ROIGrowth({ data, reduceMotion }: ROIGrowthProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width, height } = useWindowDimensions();

  const isPositive = data.roiChange !== null && data.roiChange >= 0;
  const changeColor = isPositive ? theme.success : theme.danger;

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
          {t("wrapped.slide4.title")}
        </Animated.Text>

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(300).duration(500).springify()
          }
        >
          <ObsidianBlock variant="premium" style={styles.card}>
            {data.roiChange !== null ? (
              <>
                {/* Big arrow + percentage */}
                <View
                  style={[
                    styles.arrowCircle,
                    {
                      backgroundColor: isDark
                        ? `${changeColor}15`
                        : `${changeColor}10`,
                    },
                  ]}
                >
                  <AppIcon
                    name={isPositive ? "trending-up" : "trending-down"}
                    size={40}
                    color={changeColor}
                  />
                </View>

                <Text
                  style={[
                    Typography.heading.xl,
                    { color: changeColor, textAlign: "center" },
                  ]}
                >
                  {isPositive
                    ? t("wrapped.slide4.up", {
                        percent: data.roiChange.toFixed(1),
                      })
                    : t("wrapped.slide4.down", {
                        percent: data.roiChange.toFixed(1),
                      })}
                </Text>

                <Text
                  style={[
                    Typography.body.sm,
                    { color: theme.textMuted, textAlign: "center" },
                  ]}
                >
                  {t("wrapped.slide4.vsLastMonth")}
                </Text>

                {/* Comparison */}
                <View style={styles.comparison}>
                  <View style={styles.comparisonItem}>
                    <Text
                      style={[
                        Typography.label.xs,
                        { color: theme.textMuted },
                      ]}
                    >
                      {data.monthLabel}
                    </Text>
                    <Text
                      style={[
                        Typography.heading.sm,
                        { color: theme.text },
                      ]}
                    >
                      {data.totalRevenue.toFixed(0)}€
                    </Text>
                  </View>
                  <AppIcon
                    name="arrow-forward"
                    size={16}
                    color={theme.textMuted}
                  />
                  <View style={styles.comparisonItem}>
                    <Text
                      style={[
                        Typography.label.xs,
                        { color: theme.textMuted },
                      ]}
                    >
                      Prev.
                    </Text>
                    <Text
                      style={[
                        Typography.heading.sm,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {data.previousMonthRevenue.toFixed(0)}€
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={[
                  Typography.body.md,
                  { color: theme.textMuted, textAlign: "center" },
                ]}
              >
                {t("wrapped.slide4.firstMonth")}
              </Text>
            )}
          </ObsidianBlock>
        </Animated.View>
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
    alignItems: "center",
    width: "100%",
  },
  card: {
    padding: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.lg,
    width: "100%",
  },
  arrowCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  comparison: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  comparisonItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
});
