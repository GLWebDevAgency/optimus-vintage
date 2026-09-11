import "./install-storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AchievementId =
  | "first_lot"
  | "first_sale"
  | "sale_10"
  | "sale_100"
  | "sale_1000"
  | "roi_50"
  | "roi_100"
  | "platform_master"
  | "streak_7"
  | "streak_30"
  | "big_sale"
  | "lot_cleared";

export type TierLevel = 1 | 2 | 3 | 4 | 5;

interface AchievementRecord {
  unlockedAt: string | null;
}

interface StreakData {
  currentDays: number;
  lastActiveDate: string | null;
  longestStreak: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TIER THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

export const TIER_THRESHOLDS: Record<TierLevel, number> = {
  1: 0,
  2: 100,
  3: 500,
  4: 1000,
  5: 5000,
};

export function getTierForSales(totalSales: number): TierLevel {
  if (totalSales >= TIER_THRESHOLDS[5]) return 5;
  if (totalSales >= TIER_THRESHOLDS[4]) return 4;
  if (totalSales >= TIER_THRESHOLDS[3]) return 3;
  if (totalSales >= TIER_THRESHOLDS[2]) return 2;
  return 1;
}

export function getNextTierThreshold(tier: TierLevel): number | null {
  if (tier >= 5) return null;
  return TIER_THRESHOLDS[(tier + 1) as TierLevel];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 GAMIFICATION STORE
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ACHIEVEMENTS: Record<AchievementId, AchievementRecord> = {
  first_lot: { unlockedAt: null },
  first_sale: { unlockedAt: null },
  sale_10: { unlockedAt: null },
  sale_100: { unlockedAt: null },
  sale_1000: { unlockedAt: null },
  roi_50: { unlockedAt: null },
  roi_100: { unlockedAt: null },
  platform_master: { unlockedAt: null },
  streak_7: { unlockedAt: null },
  streak_30: { unlockedAt: null },
  big_sale: { unlockedAt: null },
  lot_cleared: { unlockedAt: null },
};

interface GamificationState {
  achievements: Record<AchievementId, AchievementRecord>;
  streak: StreakData;
  totalSalesCount: number;
  pendingUnlock: AchievementId | null;

  // Actions
  unlockAchievement: (id: AchievementId) => void;
  updateStreak: () => void;
  setTotalSalesCount: (count: number) => void;
  dismissPendingUnlock: () => void;
  checkAchievements: (data: AchievementCheckData) => void;
  resetGamification: () => void;
}

export interface AchievementCheckData {
  totalLots: number;
  totalSales: number;
  platforms: string[];
  maxRoi: number; // percentage
  maxSaleAmount: number;
  hasClearedLot: boolean;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      achievements: { ...DEFAULT_ACHIEVEMENTS },
      streak: {
        currentDays: 0,
        lastActiveDate: null,
        longestStreak: 0,
      },
      totalSalesCount: 0,
      pendingUnlock: null,

      unlockAchievement: (id) => {
        const { achievements } = get();
        if (achievements[id].unlockedAt) return; // Already unlocked
        set({
          achievements: {
            ...achievements,
            [id]: { unlockedAt: new Date().toISOString() },
          },
          pendingUnlock: id,
        });
      },

      updateStreak: () => {
        const { streak } = get();
        const today = new Date().toISOString().split("T")[0];

        if (streak.lastActiveDate === today) return; // Already recorded today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newCurrentDays: number;
        if (streak.lastActiveDate === yesterdayStr) {
          // Consecutive day
          newCurrentDays = streak.currentDays + 1;
        } else {
          // Streak broken, start fresh
          newCurrentDays = 1;
        }

        set({
          streak: {
            currentDays: newCurrentDays,
            lastActiveDate: today,
            longestStreak: Math.max(streak.longestStreak, newCurrentDays),
          },
        });
      },

      setTotalSalesCount: (count) => set({ totalSalesCount: count }),

      dismissPendingUnlock: () => set({ pendingUnlock: null }),

      checkAchievements: (data) => {
        const { achievements, streak, unlockAchievement } = get();
        const tryUnlock = (id: AchievementId) => {
          if (!achievements[id].unlockedAt) unlockAchievement(id);
        };

        // Lot-based
        if (data.totalLots >= 1) tryUnlock("first_lot");

        // Sale-based
        if (data.totalSales >= 1) tryUnlock("first_sale");
        if (data.totalSales >= 10) tryUnlock("sale_10");
        if (data.totalSales >= 100) tryUnlock("sale_100");
        if (data.totalSales >= 1000) tryUnlock("sale_1000");

        // ROI-based
        if (data.maxRoi >= 50) tryUnlock("roi_50");
        if (data.maxRoi >= 100) tryUnlock("roi_100");

        // Platform-based
        if (data.platforms.length >= 3) tryUnlock("platform_master");

        // Streak-based
        if (streak.currentDays >= 7) tryUnlock("streak_7");
        if (streak.currentDays >= 30) tryUnlock("streak_30");

        // Sale amount
        if (data.maxSaleAmount >= 100) tryUnlock("big_sale");

        // Lot cleared
        if (data.hasClearedLot) tryUnlock("lot_cleared");
      },

      resetGamification: () =>
        set({
          achievements: { ...DEFAULT_ACHIEVEMENTS },
          streak: { currentDays: 0, lastActiveDate: null, longestStreak: 0 },
          totalSalesCount: 0,
          pendingUnlock: null,
        }),
    }),
    {
      name: "optimus-vintage-gamification",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🪝 SELECTORS
// ═══════════════════════════════════════════════════════════════════════════════

export function useUnlockedCount(): { unlocked: number; total: number } {
  const achievements = useGamificationStore((s) => s.achievements);
  const ids = Object.keys(achievements) as AchievementId[];
  const unlocked = ids.filter((id) => achievements[id].unlockedAt).length;
  return { unlocked, total: ids.length };
}

export function useCurrentTier(): {
  tier: TierLevel;
  nextThreshold: number | null;
  progress: number;
} {
  const totalSalesCount = useGamificationStore((s) => s.totalSalesCount);
  const tier = getTierForSales(totalSalesCount);
  const nextThreshold = getNextTierThreshold(tier);
  const currentThreshold = TIER_THRESHOLDS[tier];
  const progress = nextThreshold
    ? (totalSalesCount - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;
  return { tier, nextThreshold, progress: Math.min(1, Math.max(0, progress)) };
}
