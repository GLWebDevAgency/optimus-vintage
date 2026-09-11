import type { AppIconName } from "@/components/ui/AppIcon";
import type { AchievementId } from "@/store/gamification";

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementDefinition {
  id: AchievementId;
  icon: AppIconName;
  titleKey: string;
  descriptionKey: string;
  tier: AchievementTier;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Bronze — Getting Started
  {
    id: "first_lot",
    icon: "inventory-2",
    titleKey: "gamification.badges.first_lot.title",
    descriptionKey: "gamification.badges.first_lot.description",
    tier: "bronze",
  },
  {
    id: "first_sale",
    icon: "point-of-sale",
    titleKey: "gamification.badges.first_sale.title",
    descriptionKey: "gamification.badges.first_sale.description",
    tier: "bronze",
  },

  // Silver — Growing
  {
    id: "sale_10",
    icon: "trending-up",
    titleKey: "gamification.badges.sale_10.title",
    descriptionKey: "gamification.badges.sale_10.description",
    tier: "silver",
  },
  {
    id: "streak_7",
    icon: "speed",
    titleKey: "gamification.badges.streak_7.title",
    descriptionKey: "gamification.badges.streak_7.description",
    tier: "silver",
  },
  {
    id: "big_sale",
    icon: "attach-money",
    titleKey: "gamification.badges.big_sale.title",
    descriptionKey: "gamification.badges.big_sale.description",
    tier: "silver",
  },
  {
    id: "roi_50",
    icon: "insights",
    titleKey: "gamification.badges.roi_50.title",
    descriptionKey: "gamification.badges.roi_50.description",
    tier: "silver",
  },

  // Gold — Pro
  {
    id: "sale_100",
    icon: "emoji-events",
    titleKey: "gamification.badges.sale_100.title",
    descriptionKey: "gamification.badges.sale_100.description",
    tier: "gold",
  },
  {
    id: "roi_100",
    icon: "auto-awesome",
    titleKey: "gamification.badges.roi_100.title",
    descriptionKey: "gamification.badges.roi_100.description",
    tier: "gold",
  },
  {
    id: "platform_master",
    icon: "public",
    titleKey: "gamification.badges.platform_master.title",
    descriptionKey: "gamification.badges.platform_master.description",
    tier: "gold",
  },
  {
    id: "lot_cleared",
    icon: "check-circle",
    titleKey: "gamification.badges.lot_cleared.title",
    descriptionKey: "gamification.badges.lot_cleared.description",
    tier: "gold",
  },
  {
    id: "streak_30",
    icon: "local-shipping",
    titleKey: "gamification.badges.streak_30.title",
    descriptionKey: "gamification.badges.streak_30.description",
    tier: "gold",
  },

  // Platinum — Legend
  {
    id: "sale_1000",
    icon: "emoji-events",
    titleKey: "gamification.badges.sale_1000.title",
    descriptionKey: "gamification.badges.sale_1000.description",
    tier: "platinum",
  },
];

export const ACHIEVEMENT_MAP: Record<AchievementId, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
    AchievementId,
    AchievementDefinition
  >;

// Tier display colors (used by AchievementBadge)
export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#F4C025",
  platinum: "#E5E4E2",
};
