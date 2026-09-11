/**
 * WRAPPED SLIDE 2 — Top Performer
 *
 * Best-selling item with crown highlight.
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

interface TopPerformerProps {
  data: WrappedData;
  reduceMotion: boolean;
}

export function TopPerformer({ data, reduceMotion }: TopPerformerProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width, height } = useWindowDimensions();

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
          {t("wrapped.slide2.title")}
        </Animated.Text>

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(300).duration(500).springify()
          }
        >
          <ObsidianBlock variant="premium" style={styles.card}>
            {/* Crown icon */}
            <View
              style={[
                styles.crownCircle,
                {
                  backgroundColor: isDark
                    ? `${Palette.metal.gold}15`
                    : `${Palette.metal.champagne}20`,
                },
              ]}
            >
              <AppIcon name="emoji-events" size={36} color={theme.primary} />
            </View>

            {data.topItem ? (
              <>
                <Text
                  style={[
                    Typography.heading.md,
                    { color: theme.text, textAlign: "center" },
                  ]}
                >
                  {data.topItem.brand}
                </Text>
                <Text
                  style={[
                    Typography.heading.lg,
                    { color: theme.primary, textAlign: "center", marginTop: Spacing.sm },
                  ]}
                >
                  {data.topItem.revenue.toFixed(0)}€
                </Text>
                <Text
                  style={[
                    Typography.body.sm,
                    { color: theme.textMuted, textAlign: "center", marginTop: Spacing.sm },
                  ]}
                >
                  {t("wrapped.slide2.soldOn", { platform: data.topItem.platform })}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  Typography.body.md,
                  { color: theme.textMuted, textAlign: "center" },
                ]}
              >
                {t("wrapped.noData")}
              </Text>
            )}
          </ObsidianBlock>
        </Animated.View>

        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(500).duration(500).springify()
          }
          style={[
            Typography.body.sm,
            { color: theme.textMuted, textAlign: "center" },
          ]}
        >
          {t("wrapped.slide2.subtitle")}
        </Animated.Text>
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
  },
  card: {
    padding: Spacing["2xl"],
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
});
