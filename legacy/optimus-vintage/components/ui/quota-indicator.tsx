/**
 * 📊 QUOTA INDICATOR — Shows resource usage vs plan limits
 *
 * Compact indicator showing how much of a quota has been used.
 * Shows warning when approaching limit and blocks when exceeded.
 *
 * Usage:
 *   <QuotaIndicator resource="lots" current={2} />
 */

import { Pressable, Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { Theme } from "@/constants/Theme";
import { useSubscriptionStore } from "@/store/subscription";
import { usePlanAccess } from "@/utils/plan-access";

interface QuotaIndicatorProps {
  /** Resource type */
  resource: "lots" | "items" | "salesPerMonth" | "aiScansPerMonth";
  /** Current usage count */
  current: number;
  /** Optional: compact mode (no label) */
  compact?: boolean;
}

const RESOURCE_LABELS: Record<string, string> = {
  lots: "Lots",
  items: "Articles",
  salesPerMonth: "Ventes/mois",
  aiScansPerMonth: "Scans IA/mois",
};

export function QuotaIndicator({
  resource,
  current,
  compact = false,
}: QuotaIndicatorProps) {
  const { quotas, planName } = usePlanAccess();
  const { presentPaywall } = useSubscriptionStore();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Theme.dark : Theme.light;

  const maxMap: Record<string, number> = {
    lots: quotas.maxLots,
    items: quotas.maxItems,
    salesPerMonth: quotas.maxSalesPerMonth,
    aiScansPerMonth: quotas.maxAIScansPerMonth,
  };

  const max = maxMap[resource];
  if (!max || max === Infinity) return null; // Unlimited — don't show

  const ratio = current / max;
  const isWarning = ratio >= 0.8;
  const isExceeded = current >= max;

  const barColor = isExceeded
    ? colors.danger
    : isWarning
      ? colors.warning
      : colors.primary;

  return (
    <Pressable
      onPress={isWarning ? () => presentPaywall() : undefined}
      style={{
        flexDirection: compact ? "row" : "column",
        alignItems: compact ? "center" : "flex-start",
        gap: compact ? 8 : 4,
      }}
    >
      {!compact && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontFamily: "Manrope_500Medium",
            }}
          >
            {RESOURCE_LABELS[resource]}
          </Text>
          <Text
            style={{
              color: isExceeded ? colors.danger : colors.textSecondary,
              fontSize: 12,
              fontFamily: "Manrope_600SemiBold",
            }}
          >
            {current}/{max === Infinity ? "∞" : max}
          </Text>
        </View>
      )}

      {/* Progress bar */}
      <View
        style={{
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          width: compact ? 60 : "100%",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.min(100, ratio * 100)}%`,
            backgroundColor: barColor,
            borderRadius: 2,
          }}
        />
      </View>

      {compact && (
        <Text
          style={{
            color: isExceeded ? colors.danger : colors.textMuted,
            fontSize: 11,
            fontFamily: "Manrope_500Medium",
          }}
        >
          {current}/{max}
        </Text>
      )}

      {isExceeded && !compact && (
        <Text
          style={{
            color: colors.danger,
            fontSize: 11,
            fontFamily: "Manrope_500Medium",
            marginTop: 2,
          }}
        >
          Limite atteinte — Passez au Premium ↗
        </Text>
      )}
    </Pressable>
  );
}
