/**
 * SLIDE 1 — Welcome
 *
 * Animated logo reveal with tagline.
 * "Your Vintage Empire, Reimagined"
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useVantaTheme } from "@/components/ui/PremiumUI";
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
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface WelcomeSlideProps {
  isActive: boolean;
  reduceMotion: boolean;
}

export function WelcomeSlide({ isActive, reduceMotion }: WelcomeSlideProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { width } = useWindowDimensions();

  // Pulsing glow on logo
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || !isActive) return;
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [isActive, reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.content}>
        {/* Logo with glow */}
        <Animated.View style={glowStyle}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: `${Palette.metal.gold}12` },
            ]}
          >
            <View
              style={[
                styles.logoInner,
                { backgroundColor: `${Palette.metal.gold}18` },
              ]}
            >
              <AppIcon name="auto-awesome" size={48} color={theme.primary} />
            </View>
          </View>
        </Animated.View>

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
              Typography.label.sm,
              {
                color: theme.textMuted,
                letterSpacing: 3,
                textAlign: "center",
                marginBottom: Spacing.xs,
              },
            ]}
          >
            {t("onboarding.welcome").toUpperCase()}
          </Text>
          <Text
            style={[
              Typography.heading.xl,
              {
                color: theme.text,
                textAlign: "center",
              },
            ]}
          >
            {t("onboarding.appName")}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(400).duration(600).springify()
          }
        >
          <Text
            style={[
              Typography.heading.md,
              {
                color: theme.primary,
                textAlign: "center",
                marginTop: Spacing.md,
              },
            ]}
          >
            {t("onboarding.screen1.title")}
          </Text>
          <Text
            style={[
              Typography.body.md,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.lg,
                lineHeight: 24,
                paddingHorizontal: Spacing.xl,
              },
            ]}
          >
            {t("onboarding.screen1.description")}
          </Text>
        </Animated.View>
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
    gap: Spacing.xl,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
