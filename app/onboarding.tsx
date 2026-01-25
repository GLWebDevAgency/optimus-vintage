/**
 * 🌟 ONBOARDING SCREEN - Neumorphic Dark Edition
 *
 * Design fidèle 100% au mockup de référence
 * Style: Soft UI, Dark Neumorphic, Animations fluides
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { NeuScreen, useNeuColors } from "@/components/ui/Neumorphic";
import { useSettingsStore } from "@/store/settings";
import { Haptic } from "@/utils/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 FEATURE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FeatureCardProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
  delay,
}: FeatureCardProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();

  return (
    <Animated.View
      entering={SlideInRight.delay(delay).duration(400)}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.background.main,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.md,
        },
        Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconColor + "20",
        }}
      >
        <AppIcon name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: palette.text.primary,
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: palette.text.muted,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌟 ONBOARDING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { palette, shadows, spacing, radius } = useNeuColors();
  const { setCurrency, setTargetMargin, completeOnboarding } =
    useSettingsStore();
  const [currencyInput, setCurrencyInput] = useState("EUR");
  const [marginInput, setMarginInput] = useState("10");

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  React.useEffect(() => {
    logoOpacity.value = withDelay(200, withSpring(1, { damping: 15 }));
    logoScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 15 }),
      ),
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const handleFinish = () => {
    Haptic.success();
    setCurrency(currencyInput.toUpperCase());
    setTargetMargin(Number(marginInput) || 10);
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <NeuScreen>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            alignItems: "center",
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View
            style={[
              { alignItems: "center", marginBottom: spacing["2xl"] },
              logoAnimatedStyle,
            ]}
          >
            {/* Logo Glow */}
            <View
              style={[
                { marginBottom: spacing.xl },
                Platform.OS === "web" && {
                  boxShadow: `0 0 60px ${palette.primary.main}40`,
                },
              ]}
            >
              <LinearGradient
                colors={[palette.primary.main, palette.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: radius["2xl"],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 48 }}>💎</Text>
              </LinearGradient>
            </View>

            <Text
              style={{
                color: palette.text.muted,
                fontSize: 14,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: spacing.xs,
              }}
            >
              Bienvenue sur
            </Text>
            <Text
              style={{
                color: palette.text.primary,
                fontSize: 32,
                fontWeight: "800",
                letterSpacing: -0.5,
                marginBottom: spacing.sm,
              }}
            >
              Optimus Vintage
            </Text>
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 15,
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 280,
              }}
            >
              L'application premium pour gérer votre business de revente vintage
            </Text>
          </Animated.View>

          {/* Features */}
          <View
            style={{
              width: "100%",
              gap: spacing.md,
              marginBottom: spacing.xl,
            }}
          >
            <FeatureCard
              icon="trending-up"
              iconColor={palette.accent.green}
              title="Suivi des profits"
              description="Analysez vos marges en temps réel"
              delay={400}
            />
            <FeatureCard
              icon="inventory-2"
              iconColor={palette.primary.main}
              title="Gestion des lots"
              description="Organisez votre inventaire facilement"
              delay={500}
            />
            <FeatureCard
              icon="analytics"
              iconColor={palette.accent.blue}
              title="Statistiques avancées"
              description="Dashboard détaillé de vos performances"
              delay={600}
            />
          </View>

          {/* Setup Card */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(400)}
            style={[
              {
                width: "100%",
                backgroundColor: palette.background.main,
                borderRadius: radius["2xl"],
                padding: spacing.lg,
                marginBottom: spacing.xl,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.flat.css as any,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.md,
                  backgroundColor: palette.primary.main + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="tune" size={16} color={palette.primary.main} />
              </View>
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Configuration rapide
              </Text>
            </View>

            {/* Currency Input */}
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  marginBottom: spacing.xs,
                  marginLeft: spacing.xs,
                }}
              >
                DEVISE
              </Text>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: palette.background.main,
                    borderRadius: radius.xl,
                    paddingHorizontal: spacing.md,
                    height: 52,
                    gap: spacing.sm,
                    borderWidth: 1,
                    borderColor: shadows.pressed.borderColor,
                  },
                  Platform.OS === "web" && {
                    boxShadow: shadows.pressed.css as any,
                  },
                ]}
              >
                <AppIcon name="payments" size={18} color={palette.text.muted} />
                <TextInput
                  style={{
                    flex: 1,
                    color: palette.text.primary,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                  value={currencyInput}
                  onChangeText={setCurrencyInput}
                  placeholder="EUR"
                  placeholderTextColor={palette.text.muted}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Margin Input */}
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  marginBottom: spacing.xs,
                  marginLeft: spacing.xs,
                }}
              >
                MARGE CIBLE PAR ARTICLE (€)
              </Text>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: palette.background.main,
                    borderRadius: radius.xl,
                    paddingHorizontal: spacing.md,
                    height: 52,
                    gap: spacing.sm,
                    borderWidth: 1,
                    borderColor: shadows.pressed.borderColor,
                  },
                  Platform.OS === "web" && {
                    boxShadow: shadows.pressed.css as any,
                  },
                ]}
              >
                <AppIcon
                  name="trending-up"
                  size={18}
                  color={palette.text.muted}
                />
                <TextInput
                  style={{
                    flex: 1,
                    color: palette.text.primary,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                  value={marginInput}
                  onChangeText={setMarginInput}
                  placeholder="10"
                  placeholderTextColor={palette.text.muted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View entering={FadeInUp.delay(900).duration(400)}>
            <Pressable
              onPress={handleFinish}
              style={[
                {
                  width: "100%",
                  borderRadius: radius.xl,
                  overflow: "hidden",
                  marginBottom: spacing.lg,
                },
                Platform.OS === "web" && {
                  boxShadow: `0 8px 32px ${palette.primary.main}50`,
                },
              ]}
            >
              <LinearGradient
                colors={[palette.primary.main, palette.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  paddingVertical: 18,
                  paddingHorizontal: spacing.xl,
                }}
              >
                <Text
                  style={{
                    color: palette.text.white,
                    fontSize: 16,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  Commencer
                </Text>
                <AppIcon
                  name="arrow-forward"
                  size={20}
                  color={palette.text.white}
                />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeIn.delay(1000).duration(400)}
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 11,
                textAlign: "center",
                opacity: 0.6,
              }}
            >
              En continuant, vous acceptez nos conditions d'utilisation
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </NeuScreen>
  );
}
