/**
 * 💎 PAYWALL SCREEN — RevenueCatUI native paywall
 *
 * Uses RevenueCatUI.presentPaywall() for the native paywall experience.
 * Falls back to a simple upgrade prompt on web.
 *
 * On native: instantly presents the RevenueCat-hosted paywall modal,
 * then handles the result (purchased, restored, cancelled, error).
 */

import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Typography } from "@/constants/Theme";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import { triggerHaptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";

const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 PAYWALL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function PaywallScreen() {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const params = useLocalSearchParams<{ reason?: string; feature?: string }>();
  const { user } = useAuthStore();
  const { isPro, presentPaywall, restorePurchases } = useSubscriptionStore();

  // On native, present RevenueCatUI paywall immediately
  useEffect(() => {
    if (Platform.OS === "web") return;

    const showPaywall = async () => {
      const purchased = await presentPaywall();
      if (purchased) {
        if (isIOS) triggerHaptic("success");
        Alert.alert(t("subscription.purchaseSuccess"), "", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
      // Don't auto-dismiss: in Preview API Mode presentPaywall() returns false
      // immediately. Let user close manually or navigate back.
    };

    showPaywall();
  }, []);

  // On web, show a simple fallback UI
  const handleRestore = useCallback(async () => {
    const restored = await restorePurchases();
    if (restored) {
      if (isIOS) triggerHaptic("success");
      Alert.alert(t("subscription.restoreSuccess"), "", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert(t("subscription.restoreNone"), "", [{ text: "OK" }]);
    }
  }, [t, restorePurchases]);

  // Native: screen is just a trigger — RevenueCatUI handles the UI
  if (Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  // Web fallback: simple upgrade prompt
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingBottom: 80,
      }}
    >
      {/* Close button */}
      <View style={{ alignItems: "flex-end" }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.surfaceCard,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel={t("common.close")}
          accessibilityRole="button"
        >
          <Text style={{ color: theme.textMuted, fontSize: 18 }}>✕</Text>
        </Pressable>
      </View>

      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(600)}
        style={{ alignItems: "center", gap: 12, marginBottom: 32 }}
      >
        <Text style={{ fontSize: 48 }}>✦</Text>
        <Text
          style={{
            ...Typography.display.md,
            color: theme.text,
            textAlign: "center",
          }}
        >
          {t("paywall.title")}
        </Text>
        <Text
          style={{
            ...Typography.body.md,
            color: theme.textMuted,
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          {params.reason
            ? t("paywall.reasonPrefix") + " " + params.reason
            : t("paywall.subtitle")}
        </Text>

        {/* Pro badge if already subscribed */}
        {isPro && (
          <View
            style={{
              borderWidth: 1,
              borderColor: Palette.metal.gold,
              borderRadius: Radius.full,
              paddingHorizontal: 14,
              paddingVertical: 4,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: Palette.metal.gold,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              OPTIMUS VINTAGE PRO ✓
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Web: features list */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={{
          backgroundColor: theme.surfaceCard,
          borderRadius: Radius["2xl"],
          borderCurve: "continuous",
          padding: 24,
          gap: 12,
          maxWidth: 500,
          alignSelf: "center",
          width: "100%",
          borderWidth: 2,
          borderColor: Palette.metal.gold,
          boxShadow: `0 0 30px ${Palette.metal.goldGlow}`,
        }}
      >
        <Text
          style={{
            ...Typography.heading.md,
            color: theme.text,
          }}
        >
          Optimus Vintage Pro
        </Text>

        {[
          "Lots et articles illimités",
          "Ventes illimitées",
          "Scans IA illimités",
          "P&L avancé",
          "Rapports PDF",
          "3 appareils",
          "Sync marketplace",
          "IA pricing intelligent",
        ].map((feat) => (
          <View
            key={feat}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: Palette.semantic.success, fontSize: 13 }}>
              ✓
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {feat}
            </Text>
          </View>
        ))}

        <Text
          style={{
            ...Typography.body.sm,
            color: theme.textMuted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {t("paywall.webOnly")}
        </Text>
      </Animated.View>

      {/* Restore */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={{
          alignItems: "center",
          gap: 8,
          marginTop: 24,
        }}
      >
        <Pressable onPress={handleRestore}>
          <Text
            style={{
              color: theme.primary,
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            {t("paywall.restorePurchases")}
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
