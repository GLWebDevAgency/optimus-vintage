/**
 * 🎉 ACHIEVEMENT UNLOCK MODAL
 *
 * Full-screen celebration overlay with spring animation + haptics.
 * Shows when a new achievement is unlocked.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { PremiumButton } from "@/components/ui/PremiumUI";
import {
  ACHIEVEMENT_MAP,
  ACHIEVEMENT_TIER_COLORS,
} from "@/constants/Achievements";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import type { AchievementId } from "@/store/gamification";
import { useGamificationStore } from "@/store/gamification";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";

export function AchievementUnlockModal() {
  const pendingUnlock = useGamificationStore((s) => s.pendingUnlock);
  const dismissPendingUnlock = useGamificationStore(
    (s) => s.dismissPendingUnlock,
  );
  const { t } = useLocale();

  const achievement = pendingUnlock ? ACHIEVEMENT_MAP[pendingUnlock] : null;
  const tierColor = achievement
    ? ACHIEVEMENT_TIER_COLORS[achievement.tier]
    : Palette.metal.gold;

  useEffect(() => {
    if (pendingUnlock) {
      Haptic.success();
    }
  }, [pendingUnlock]);

  if (!achievement) return null;

  return (
    <Modal
      visible={!!pendingUnlock}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.delay(200).duration(400).springify()}
          style={styles.card}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: `${tierColor}20` }]}
          >
            <AppIcon name={achievement.icon} size={40} color={tierColor} />
          </View>

          <Animated.Text
            entering={FadeInDown.delay(400).duration(300).springify()}
            style={styles.title}
          >
            {t("gamification.unlockTitle")}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(500).duration(300).springify()}
            style={[styles.achievementName, { color: tierColor }]}
          >
            {t(achievement.titleKey)}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(600).duration(300).springify()}
            style={styles.description}
          >
            {t(achievement.descriptionKey)}
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.delay(700).duration(300).springify()}
            style={styles.ctaContainer}
          >
            <PremiumButton
              variant="primary"
              size="md"
              onPress={dismissPendingUnlock}
            >
              {t("gamification.unlockDismiss")}
            </PremiumButton>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: Radius.xl,
    padding: Spacing["3xl"],
    alignItems: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.label.sm,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  achievementName: {
    ...Typography.heading.lg,
    textAlign: "center",
  },
  description: {
    ...Typography.body.sm,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  ctaContainer: {
    marginTop: Spacing.md,
  },
});
