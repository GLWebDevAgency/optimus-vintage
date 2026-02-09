/**
 * ⏱️ TRIAL BANNER — Shows trial status and days remaining
 *
 * Displays a banner at the top of the dashboard/tabs when user is on trial.
 * Shows upgrade CTA when trial is about to expire.
 *
 * Usage:
 *   <TrialBanner />
 */

import { Pressable, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { Theme } from "@/constants/Theme";
import { useSubscriptionStore } from "@/store/subscription";
import { usePlanAccess } from "@/utils/plan-access";

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, planDisplayName } = usePlanAccess();
  const { presentPaywall } = useSubscriptionStore();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Theme.dark : Theme.light;

  if (!isTrialing || trialDaysRemaining === null) return null;

  const isUrgent = trialDaysRemaining <= 3;
  const bannerColor = isUrgent ? colors.warning : colors.primary;
  const bannerBg = isUrgent ? colors.warningSubtle : colors.primarySubtle;

  return (
    <Pressable
      onPress={() => presentPaywall()}
      style={{
        backgroundColor: bannerBg,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: bannerColor + "30",
      }}
    >
      <View
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        <Text style={{ fontSize: 16 }}>{isUrgent ? "⚠️" : "✨"}</Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontFamily: "Manrope_500Medium",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {trialDaysRemaining === 0
            ? `Votre essai ${planDisplayName} expire aujourd'hui`
            : trialDaysRemaining === 1
              ? `Plus qu'1 jour d'essai ${planDisplayName}`
              : `${trialDaysRemaining}j d'essai ${planDisplayName} restants`}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: bannerColor,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          borderCurve: "continuous",
        }}
      >
        <Text
          style={{
            color: colors.textOnAccent,
            fontSize: 12,
            fontFamily: "Manrope_700Bold",
          }}
        >
          S'abonner
        </Text>
      </View>
    </Pressable>
  );
}
