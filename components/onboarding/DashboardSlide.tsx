/**
 * SLIDE 3 — Dashboard Preview
 *
 * Mini KPI cards + feature bullets showing the analytics power.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface DashboardSlideProps {
  isActive: boolean;
  reduceMotion: boolean;
}

export function DashboardSlide({
  isActive,
  reduceMotion,
}: DashboardSlideProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width } = useWindowDimensions();

  const miniKPIs = [
    { label: "Revenue", value: "2,450€", icon: "trending-up" as const, color: theme.success },
    { label: "ROI", value: "+68%", icon: "insights" as const, color: theme.primary },
    { label: "Sales", value: "47", icon: "point-of-sale" as const, color: theme.warning },
  ];

  const features = [
    {
      icon: "speed" as const,
      text: t("onboarding.screen3.feature1"),
      color: theme.success,
    },
    {
      icon: "bar-chart" as const,
      text: t("onboarding.screen3.feature2"),
      color: theme.primary,
    },
    {
      icon: "auto-awesome" as const,
      text: t("onboarding.screen3.feature3"),
      color: theme.warning,
    },
  ];

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.content}>
        {/* Title */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(100).duration(600).springify()
          }
          style={styles.header}
        >
          <Text
            style={[
              Typography.heading.lg,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            {t("onboarding.screen3.title")}
          </Text>
          <Text
            style={[
              Typography.body.sm,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.sm,
              },
            ]}
          >
            {t("onboarding.screen3.description")}
          </Text>
        </Animated.View>

        {/* Mini KPI Cards */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(300).duration(500).springify()
          }
          style={styles.kpiRow}
        >
          {miniKPIs.map((kpi) => (
            <ObsidianBlock
              key={kpi.label}
              variant="simple"
              style={styles.kpiCard}
            >
              <View
                style={[
                  styles.kpiIcon,
                  {
                    backgroundColor: isDark
                      ? `${kpi.color}15`
                      : `${kpi.color}10`,
                  },
                ]}
              >
                <AppIcon name={kpi.icon} size={16} color={kpi.color} />
              </View>
              <Text
                style={[
                  Typography.heading.sm,
                  { color: theme.text, marginTop: Spacing.xs },
                ]}
              >
                {kpi.value}
              </Text>
              <Text
                style={[
                  Typography.label.xs,
                  { color: theme.textMuted, marginTop: 2 },
                ]}
              >
                {kpi.label}
              </Text>
            </ObsidianBlock>
          ))}
        </Animated.View>

        {/* Feature bullets */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.icon}
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(500 + index * 120)
                      .duration(500)
                      .springify()
              }
              style={styles.featureRow}
            >
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: isDark
                      ? `${feature.color}15`
                      : `${feature.color}10`,
                  },
                ]}
              >
                <AppIcon name={feature.icon} size={18} color={feature.color} />
              </View>
              <Text
                style={[Typography.body.sm, { color: theme.textSecondary }]}
              >
                {feature.text}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
  },
  kpiRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  features: {
    gap: Spacing.md,
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
