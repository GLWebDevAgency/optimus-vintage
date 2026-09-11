/**
 * SLIDE 2 — AI Scanner
 *
 * Animated scanning line + 3 feature bullets.
 * Showcases the AI identification capability.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface ScannerSlideProps {
  isActive: boolean;
  reduceMotion: boolean;
}

export function ScannerSlide({ isActive, reduceMotion }: ScannerSlideProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width } = useWindowDimensions();

  // Scanning line animation
  const scanY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || !isActive) return;
    scanY.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [isActive, reduceMotion]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanY.value * 80 + 10}%`,
    opacity: 0.8,
  }));

  const features = [
    {
      icon: "search" as const,
      text: t("onboarding.screen2.feature1"),
      color: theme.primary,
    },
    {
      icon: "attach-money" as const,
      text: t("onboarding.screen2.feature2"),
      color: theme.success,
    },
    {
      icon: "thumb-up" as const,
      text: t("onboarding.screen2.feature3"),
      color: theme.warning,
    },
  ];

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.content}>
        {/* Scanner visual */}
        <View
          style={[
            styles.scannerFrame,
            {
              borderColor: isDark
                ? `${Palette.metal.gold}30`
                : `${Palette.metal.champagne}40`,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
            },
          ]}
        >
          <AppIcon name="photo-camera" size={56} color={theme.textMuted} />

          {/* Scanning line */}
          <Animated.View
            style={[
              styles.scanLine,
              scanLineStyle,
              {
                backgroundColor: theme.primary,
              },
            ]}
          />

          {/* Corner accents */}
          <View style={[styles.cornerTL, { borderColor: theme.primary }]} />
          <View style={[styles.cornerTR, { borderColor: theme.primary }]} />
          <View style={[styles.cornerBL, { borderColor: theme.primary }]} />
          <View style={[styles.cornerBR, { borderColor: theme.primary }]} />
        </View>

        {/* Title */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(200).duration(600).springify()
          }
        >
          <Text
            style={[
              Typography.heading.lg,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            {t("onboarding.screen2.title")}
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
            {t("onboarding.screen2.description")}
          </Text>
        </Animated.View>

        {/* Feature bullets */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.icon}
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(400 + index * 120)
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
  scannerFrame: {
    width: 180,
    height: 180,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
  cornerTL: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
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
