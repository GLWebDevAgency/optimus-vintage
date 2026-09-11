/**
 * SLIDE 4 — Quick Setup
 *
 * Currency + margin inputs (existing logic preserved).
 * This is the final screen before entering the app.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { PremiumInput } from "@/components/ui/PremiumUI";
import { useLocale } from "@/utils/i18n";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface SetupSlideProps {
  isActive: boolean;
  reduceMotion: boolean;
  currencyInput: string;
  setCurrencyInput: (v: string) => void;
  marginInput: string;
  setMarginInput: (v: string) => void;
}

export function SetupSlide({
  isActive,
  reduceMotion,
  currencyInput,
  setCurrencyInput,
  marginInput,
  setMarginInput,
}: SetupSlideProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
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
            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: isDark
                    ? `${Palette.metal.gold}15`
                    : `${Palette.metal.champagne}20`,
                },
              ]}
            >
              <AppIcon name="tune" size={20} color={theme.primary} />
            </View>
            <Text
              style={[
                Typography.heading.lg,
                { color: theme.text, textAlign: "center" },
              ]}
            >
              {t("onboarding.screen4.title")}
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
              {t("onboarding.screen4.subtitle")}
            </Text>
          </Animated.View>

          {/* Setup Card */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(300).duration(500).springify()
            }
          >
            <ObsidianBlock
              variant="premium"
              style={{ padding: Spacing["2xl"] }}
            >
              <View style={{ gap: Spacing.lg }}>
                <PremiumInput
                  label={t("onboarding.currency").toUpperCase()}
                  value={currencyInput}
                  onChangeText={setCurrencyInput}
                  placeholder="EUR"
                  maxLength={3}
                />

                <PremiumInput
                  label={t("onboarding.targetMargin").toUpperCase()}
                  value={marginInput}
                  onChangeText={setMarginInput}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </ObsidianBlock>
          </Animated.View>

          {/* Privacy note */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(500).duration(500).springify()
            }
            style={styles.privacyRow}
          >
            <AppIcon name="lock" size={14} color={theme.textMuted} />
            <Text
              style={[
                Typography.body.xs,
                { color: theme.textMuted },
              ]}
            >
              {t("onboarding.dataOnDevice")}
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    gap: Spacing.md,
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
});
