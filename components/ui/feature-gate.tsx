/**
 * 🔒 FEATURE GATE — UI component for plan-based access control
 *
 * Wraps features that require a specific plan. Shows a lock overlay
 * with upgrade CTA when the feature is not available.
 *
 * Usage:
 *   <FeatureGate feature="analytics">
 *     <AnalyticsChart />
 *   </FeatureGate>
 */

import { Pressable, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { Theme } from "@/constants/Theme";
import { useSubscriptionStore } from "@/store/subscription";
import {
    FEATURE_REQUIRED_PLAN,
    PLAN_DISPLAY_NAMES,
    usePlanAccess,
    type FeatureName,
} from "@/utils/plan-access";

interface FeatureGateProps {
  /** Feature to check access for */
  feature: FeatureName;
  /** Content to render when feature is accessible */
  children: React.ReactNode;
  /** Optional: custom locked message */
  lockedMessage?: string;
  /** Optional: render inline (no overlay) — hides children entirely */
  hideWhenLocked?: boolean;
  /** Optional: custom fallback when locked */
  fallback?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  lockedMessage,
  hideWhenLocked = false,
  fallback,
}: FeatureGateProps) {
  const { hasFeature } = usePlanAccess();
  const { presentPaywall } = useSubscriptionStore();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Theme.dark : Theme.light;

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return fallback ? <>{fallback}</> : null;
  }

  const requiredPlan = FEATURE_REQUIRED_PLAN[feature];
  const planName = PLAN_DISPLAY_NAMES[requiredPlan];
  const message = lockedMessage ?? `Disponible avec le plan ${planName}`;

  return (
    <View style={{ position: "relative" }}>
      <View style={{ opacity: 0.3, pointerEvents: "none" }}>{children}</View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.dark
            ? "rgba(0,0,0,0.6)"
            : "rgba(255,255,255,0.7)",
          borderRadius: 12,
          borderCurve: "continuous",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            marginBottom: 8,
          }}
        >
          🔒
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontFamily: "Manrope_600SemiBold",
            textAlign: "center",
            marginBottom: 12,
            paddingHorizontal: 16,
          }}
        >
          {message}
        </Text>
        <Pressable
          onPress={() => presentPaywall()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            borderCurve: "continuous",
          }}
        >
          <Text
            style={{
              color: colors.textOnAccent,
              fontSize: 14,
              fontFamily: "Manrope_700Bold",
            }}
          >
            Passer à {planName}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
