/**
 * 🏆 ACHIEVEMENT BADGE
 *
 * Displays a single achievement with unlock status.
 * Uses tier-colored border when unlocked.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import {
  ACHIEVEMENT_TIER_COLORS,
  type AchievementDefinition,
} from "@/constants/Achievements";
import { Radius, Spacing, Typography } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
}

export function AchievementBadge({
  achievement,
  isUnlocked,
}: AchievementBadgeProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: isUnlocked
            ? tierColor
            : theme.dark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          opacity: isUnlocked ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isUnlocked
              ? `${tierColor}20`
              : theme.dark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
          },
        ]}
      >
        <AppIcon
          name={achievement.icon}
          size={24}
          color={isUnlocked ? tierColor : theme.textMuted}
        />
      </View>
      <Text
        style={[
          Typography.label.sm,
          { color: isUnlocked ? theme.text : theme.textMuted },
        ]}
        numberOfLines={1}
      >
        {t(achievement.titleKey)}
      </Text>
      <Text
        style={[
          Typography.body.xs,
          { color: theme.textMuted, textAlign: "center" },
        ]}
        numberOfLines={2}
      >
        {t(achievement.descriptionKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
});
