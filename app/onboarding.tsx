/**
 * 🌿 ONBOARDING SCREEN - Luxury Edition
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Button, Card } from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { useSettingsStore } from "@/store/settings";
import { Haptic } from "@/utils/haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
  const { setCurrency, setTargetMargin, completeOnboarding } =
    useSettingsStore();
  const [currencyInput, setCurrencyInput] = React.useState("EUR");
  const [marginInput, setMarginInput] = React.useState("10");

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
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.gradient,
          {
            backgroundColor: Palette.gold[600] + "10",
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
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primarySubtle },
            ]}
          >
            <Text style={styles.emoji}>✨</Text>
          </View>
          <Text
            style={[
              Typography.body.sm,
              {
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 2,
              },
            ]}
          >
            Bienvenue sur
          </Text>
          <Text
            style={[
              Typography.display.lg,
              { color: theme.text, marginTop: Spacing.xs },
            ]}
          >
            Optimus Vintage
          </Text>
          <Text
            style={[
              Typography.body.md,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.md,
              },
            ]}
          >
            Gérez vos reventes vintage avec élégance.{"\n"}Gestion d'inventaire
            premium pour revendeurs.
          </Text>
        </Animated.View>

        {/* Setup Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: theme.primarySubtle },
                ]}
              >
                <AppIcon name="tune" size={16} color={theme.primary} />
              </View>
              <Text style={[Typography.heading.md, { color: theme.text }]}>
                Quick Setup
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[Typography.label.sm, { color: theme.textMuted }]}>
                CURRENCY
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceGlass,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={currencyInput}
                onChangeText={setCurrencyInput}
                placeholder="EUR"
                placeholderTextColor={theme.textMuted}
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[Typography.label.sm, { color: theme.textMuted }]}>
                TARGET MARGIN / ITEM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceGlass,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={marginInput}
                onChangeText={setMarginInput}
                placeholder="10"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
            </View>
          </Card>
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
                { backgroundColor: Palette.forest[500] + "20" },
              ]}
            >
              <AppIcon
                name="trending-up"
                size={18}
                color={Palette.forest[500]}
              />
            </View>
            <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
              Real-time profit tracking
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: Palette.cyan[500] + "20" },
              ]}
            >
              <AppIcon name="inventory-2" size={18} color={Palette.cyan[500]} />
            </View>
            <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
              Smart lot management
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: Palette.gold[500] + "20" },
              ]}
            >
              <AppIcon
                name="offline-bolt"
                size={18}
                color={Palette.gold[500]}
              />
            </View>
            <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
              Offline-first storage
            </Text>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.footer}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={handleFinish}
            icon={<AppIcon name="arrow-forward" size={20} color="#FFF" />}
            style={styles.button}
          >
            Get Started
          </Button>
          <Text
            style={[
              Typography.body.xs,
              { color: theme.textMuted, marginTop: Spacing.lg },
            ]}
          >
            Your data stays on your device
          </Text>
        </Animated.View>
      </ScrollView>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.02), 0 16px 32px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
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
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
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
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.03), inset 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 2px rgba(0,0,0,0.04)",
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
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)",
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
  button: {
    width: "100%",
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(16,185,129,0.25), 0 4px 8px rgba(16,185,129,0.2), 0 8px 16px rgba(16,185,129,0.15), 0 16px 32px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.25)",
  },
});
