/**
 * 🏆 ACHIEVEMENTS SCREEN
 *
 * Full list of achievements with unlock status,
 * tier progress, and streak info.
 */

import { AchievementBadge } from "@/components/gamification/AchievementBadge";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  CurvedItem,
  ScrollEdgeFade,
  useCurvedScroll,
} from "@/components/ui/CurvedScroll";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import {
  useIsDarkMode,
  useVantaTheme,
  VantaScreen,
} from "@/components/ui/PremiumUI";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TIER_COLORS,
  type AchievementTier,
} from "@/constants/Achievements";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import {
  useCurrentTier,
  useGamificationStore,
  useUnlockedCount,
} from "@/store/gamification";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { useLocale } from "@/utils/i18n";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIER_SECTIONS: { tier: AchievementTier; labelKey: string }[] = [
  { tier: "bronze", labelKey: "Bronze" },
  { tier: "silver", labelKey: "Silver" },
  { tier: "gold", labelKey: "Gold" },
  { tier: "platinum", labelKey: "Platinum" },
];

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { isReduceMotionEnabled } = useAccessibility();
  const { scrollY, scrollHandler } = useCurvedScroll();

  useTrackScreen("achievements");

  const achievements = useGamificationStore((s) => s.achievements);
  const streak = useGamificationStore((s) => s.streak);
  const { unlocked, total } = useUnlockedCount();
  const { tier, nextThreshold, progress } = useCurrentTier();

  return (
    <VantaScreen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppIcon name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[Typography.heading.md, { color: theme.text, flex: 1 }]}>
            {t("gamification.achievements")}
          </Text>
          <Text style={[Typography.label.sm, { color: theme.primary }]}>
            {t("gamification.unlockedCount", {
              unlocked: String(unlocked),
              total: String(total),
            })}
          </Text>
        </View>

        <Animated.ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Streak + Tier Summary */}
          <CurvedItem scrollY={scrollY}>
            <Animated.View
              entering={
                isReduceMotionEnabled
                  ? undefined
                  : FadeInDown.delay(100).duration(500).springify()
              }
              style={styles.summaryRow}
            >
            <ObsidianBlock variant="simple" style={styles.summaryCard}>
              <AppIcon
                name="local-fire-department"
                size={24}
                color={theme.warning}
              />
              <Text style={[Typography.heading.md, { color: theme.text }]}>
                {streak.currentDays}
              </Text>
              <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
                {t("gamification.streak.title")}
              </Text>
            </ObsidianBlock>

            <ObsidianBlock variant="simple" style={styles.summaryCard}>
              <Text
                style={[
                  Typography.heading.lg,
                  { color: theme.primary },
                ]}
              >
                {tier}
              </Text>
              <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
                {t("gamification.tier.title")}
              </Text>
              {nextThreshold && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${progress * 100}%`,
                      },
                    ]}
                  />
                </View>
              )}
            </ObsidianBlock>
          </Animated.View>
          </CurvedItem>

          {/* Achievements by Tier */}
          {TIER_SECTIONS.map((section, sectionIndex) => {
            const sectionAchievements = ACHIEVEMENTS.filter(
              (a) => a.tier === section.tier,
            );
            if (sectionAchievements.length === 0) return null;

            return (
              <CurvedItem key={section.tier} scrollY={scrollY}>
                <Animated.View
                  entering={
                    isReduceMotionEnabled
                      ? undefined
                      : FadeInDown.delay(200 + sectionIndex * 100)
                          .duration(500)
                          .springify()
                  }
                  style={styles.section}
                >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.tierDot,
                      {
                        backgroundColor:
                          ACHIEVEMENT_TIER_COLORS[section.tier],
                      },
                    ]}
                  />
                  <Text
                    style={[
                      Typography.label.sm,
                      {
                        color: ACHIEVEMENT_TIER_COLORS[section.tier],
                        letterSpacing: 1.5,
                      },
                    ]}
                  >
                    {section.labelKey.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.badgeGrid}>
                  {sectionAchievements.map((achievement) => (
                    <View key={achievement.id} style={styles.badgeWrapper}>
                      <AchievementBadge
                        achievement={achievement}
                        isUnlocked={!!achievements[achievement.id]?.unlockedAt}
                      />
                    </View>
                  ))}
                </View>
              </Animated.View>
              </CurvedItem>
            );
          })}
        </Animated.ScrollView>
        <ScrollEdgeFade color={theme.background} position="bottom" scrollY={scrollY} />

        <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing["2xl"],
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  badgeWrapper: {
    width: "47%",
  },
});
