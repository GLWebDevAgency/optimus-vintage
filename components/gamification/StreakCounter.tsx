/**
 * 🔥 STREAK COUNTER
 *
 * Compact streak display for dashboard header.
 * Shows flame icon + consecutive days count.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Spacing, Typography } from "@/constants/Theme";
import { useGamificationStore } from "@/store/gamification";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function StreakCounter() {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const streak = useGamificationStore((s) => s.streak);

  if (streak.currentDays === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.dark
            ? "rgba(245, 158, 11, 0.12)"
            : "rgba(245, 158, 11, 0.08)",
        },
      ]}
    >
      <AppIcon name="local-fire-department" size={14} color={theme.warning} />
      <Text style={[styles.text, { color: theme.warning }]}>
        {streak.currentDays}
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
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});
