/**
 * 🌿 ONBOARDING SCREEN - Vanta-Aether Edition
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing } from "@/constants/Theme";
import { useSettingsStore } from "@/store/settings";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VANTA = {
  black: "#000000",
  obsidian: "#0a0a0a",
  obsidianLight: "#1a1a1a",
  titanium: "#111111",
  carbon: "#1c1c1c",
  gold: "#f4c025",
  goldGlow: "rgba(244, 192, 37, 0.6)",
  goldSubtle: "rgba(244, 192, 37, 0.15)",
  success: "#22c55e",
  successSubtle: "rgba(34, 197, 94, 0.15)",
  danger: "#ef4444",
  dangerSubtle: "rgba(239, 68, 68, 0.15)",
  warning: "#f59e0b",
  warningSubtle: "rgba(245, 158, 11, 0.15)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.4)",
  light: {
    background: "#fafafa",
    surface: "#ffffff",
    gold: "#d4a017",
    text: "#1a1a1a",
    textSecondary: "rgba(0, 0, 0, 0.6)",
    textMuted: "rgba(0, 0, 0, 0.4)",
    border: "rgba(0, 0, 0, 0.08)",
  },
};

function getColors(isDark: boolean) {
  return {
    background: isDark ? VANTA.black : VANTA.light.background,
    surface: isDark ? VANTA.obsidianLight : VANTA.light.surface,
    surfaceCard: isDark ? VANTA.titanium : VANTA.light.surface,
    gold: isDark ? VANTA.gold : VANTA.light.gold,
    text: isDark ? VANTA.textPrimary : VANTA.light.text,
    textSecondary: isDark ? VANTA.textSecondary : VANTA.light.textSecondary,
    textMuted: isDark ? VANTA.textMuted : VANTA.light.textMuted,
    border: isDark ? "rgba(255, 255, 255, 0.08)" : VANTA.light.border,
    success: VANTA.success,
    successSubtle: VANTA.successSubtle,
    danger: VANTA.danger,
    dangerSubtle: VANTA.dangerSubtle,
    warning: VANTA.warning,
    warningSubtle: VANTA.warningSubtle,
  };
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const { setCurrency, setTargetMargin, completeOnboarding } =
    useSettingsStore();
  const [currencyInput, setCurrencyInput] = React.useState("EUR");
  const [marginInput, setMarginInput] = React.useState("10");
  const { t } = useLocale();

  const handleFinish = () => {
    Haptic.success();
    setCurrency(currencyInput);
    setTargetMargin(Number(marginInput) || 0);
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.gradient,
          {
            backgroundColor: VANTA.goldSubtle,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.hero}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: VANTA.goldSubtle }]}
          >
            <Text style={styles.emoji}>✨</Text>
          </View>
          <Text
            style={{
              fontFamily: "Manrope_500Medium",
              fontSize: 13,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {t("onboarding.welcome")}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 32,
              color: colors.text,
              marginTop: Spacing.xs,
            }}
          >
            {t("onboarding.appName")}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 16,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: Spacing.md,
            }}
          >
            {t("onboarding.tagline")}
            {"\n"}
            {t("onboarding.description")}
          </Text>
        </Animated.View>

        {/* Setup Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: VANTA.goldSubtle },
                ]}
              >
                <AppIcon name="tune" size={16} color={colors.gold} />
              </View>
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                {t("onboarding.quickSetup")}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 11,
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("onboarding.currency").toUpperCase()}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={currencyInput}
                onChangeText={setCurrencyInput}
                placeholder="EUR"
                placeholderTextColor={colors.textMuted}
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 11,
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("onboarding.targetMargin").toUpperCase()}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={marginInput}
                onChangeText={setMarginInput}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Animated.View>

        {/* Features Preview */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(500)}
          style={styles.features}
        >
          <View style={styles.featureRow}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: VANTA.successSubtle },
              ]}
            >
              <AppIcon name="trending-up" size={18} color={VANTA.success} />
            </View>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              {t("onboarding.feature1")}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: VANTA.goldSubtle },
              ]}
            >
              <AppIcon name="inventory-2" size={18} color={VANTA.gold} />
            </View>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              {t("onboarding.feature2")}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: VANTA.warningSubtle },
              ]}
            >
              <AppIcon name="offline-bolt" size={18} color={VANTA.warning} />
            </View>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              {t("onboarding.feature3")}
            </Text>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.footer}
        >
          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? VANTA.light.gold : VANTA.gold,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 16,
                color: VANTA.black,
                marginRight: Spacing.sm,
              }}
            >
              {t("onboarding.start")}
            </Text>
            <AppIcon name="arrow-forward" size={20} color={VANTA.black} />
          </Pressable>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 12,
              color: colors.textMuted,
              marginTop: Spacing.lg,
            }}
          >
            Your data stays on your device
          </Text>
        </Animated.View>
      </ScrollView>
      <StatusBar style={isDark ? "light" : "dark"} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: "50%",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderCurve: "continuous",
  },
  emoji: {
    fontSize: 40,
  },
  card: {
    padding: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    fontSize: 17,
    fontFamily: "Manrope_600SemiBold",
    marginTop: Spacing.sm,
    borderCurve: "continuous",
  },
  features: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
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
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
  button: {
    width: "100%",
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
