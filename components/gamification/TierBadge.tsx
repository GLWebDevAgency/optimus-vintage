/**
 * 🏅 TIER BADGE
 *
 * Compact tier level display for dashboard header.
 * Shows current tier with progress to next.
 */

import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Spacing, Typography } from "@/constants/Theme";
import { useCurrentTier } from "@/store/gamification";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const TIER_LABELS_KEY: Record<number, string> = {
  1: "gamification.tier.level1",
  2: "gamification.tier.level2",
  3: "gamification.tier.level3",
  4: "gamification.tier.level4",
  5: "gamification.tier.level5",
};

export function TierBadge() {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { tier, progress } = useCurrentTier();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.dark
            ? `${Palette.metal.gold}12`
            : `${Palette.metal.champagne}15`,
        },
      ]}
    >
      <Text style={[styles.tierNumber, { color: theme.primary }]}>
        {tier}
      </Text>
      <Text
        style={[
          styles.tierLabel,
          { color: theme.textSecondary },
        ]}
        numberOfLines={1}
      >
        {t(TIER_LABELS_KEY[tier])}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierNumber: {
    fontSize: 12,
    fontWeight: "800",
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
