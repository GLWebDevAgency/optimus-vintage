/**
 * 💀 SKELETON LOADER - World-Class Loading States
 *
 * Best Practices Applied:
 * - Shimmer animation using Reanimated for 60fps
 * - Configurable variants for different content types
 * - Respects system reduce motion preferences
 * - Uses LinearGradient for smooth shimmer effect
 * - Follows Expo/React Native performance guidelines
 *
 * Usage:
 * <Skeleton variant="text" width={200} />
 * <Skeleton variant="circle" size={48} />
 * <Skeleton variant="card" />
 * <SkeletonDashboard /> // Full dashboard skeleton
 */

import { Palette, Radius, Spacing } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo } from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 SKELETON COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonColors = {
  light: {
    base: Palette.neutral[200],
    highlight: Palette.neutral[100],
  },
  dark: {
    base: Palette.neutral[800],
    highlight: Palette.neutral[700],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💀 BASE SKELETON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  /** Width of the skeleton (number for pixels, string for percentage) */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Style variant */
  variant?: "text" | "circle" | "rect" | "card";
  /** Size for circle variant */
  size?: number;
  /** Theme mode */
  mode?: "light" | "dark";
  /** Custom style */
  style?: ViewStyle;
  /** Animation duration in ms */
  duration?: number;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = Radius.sm,
  variant = "rect",
  size,
  mode = "light",
  style,
  duration = 1200,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(-1);
  const colors = SkeletonColors[mode];
  const { t } = useLocale();

  // Check for reduced motion preference
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Shimmer animation
  useEffect(() => {
    if (!reduceMotion) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false,
      );
    }
  }, [reduceMotion, duration]);

  // Animated gradient style
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [-1, 1], [-100, 100]);
    return {
      transform: [{ translateX: `${translateX}%` as any }],
    };
  });

  // Calculate dimensions based on variant
  const dimensions = useMemo(() => {
    switch (variant) {
      case "circle":
        const circleSize = size || 48;
        return {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        };
      case "text":
        return {
          width,
          height: height || 14,
          borderRadius: Radius.xs,
        };
      case "card":
        return {
          width: "100%" as const,
          height: height || 120,
          borderRadius: Radius.lg,
        };
      default:
        return { width, height, borderRadius };
    }
  }, [variant, width, height, size, borderRadius]);

  return (
    <View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.base,
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
        } as ViewStyle,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={t("accessibility.loading")}
    >
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={["transparent", colors.highlight, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 SKELETON VARIANTS FOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/** Skeleton for metric cards */
export function SkeletonMetricCard({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.metricCard}>
      <Skeleton variant="circle" size={32} mode={mode} />
      <View style={styles.metricContent}>
        <Skeleton width={60} height={24} mode={mode} />
        <Skeleton width={50} height={12} mode={mode} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Skeleton for hero revenue card */
export function SkeletonHeroCard({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={[styles.heroCard, mode === "dark" && styles.heroCardDark]}>
      {/* Period chips */}
      <View style={styles.periodChips}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            width={40}
            height={28}
            borderRadius={Radius.full}
            mode={mode}
          />
        ))}
      </View>

      {/* Main value */}
      <Skeleton width={180} height={48} mode={mode} style={{ marginTop: 16 }} />

      {/* Mini stats */}
      <View style={styles.heroStats}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.heroStat}>
            <Skeleton variant="circle" size={8} mode={mode} />
            <Skeleton width={50} height={12} mode={mode} />
            <Skeleton width={60} height={16} mode={mode} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton for quick action buttons */
export function SkeletonQuickActions({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.quickActionsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.quickActionBtn}>
          <Skeleton variant="circle" size={40} mode={mode} />
          <Skeleton
            width={50}
            height={12}
            mode={mode}
            style={{ marginTop: 8 }}
          />
        </View>
      ))}
    </View>
  );
}

/** Skeleton for top lot cards */
export function SkeletonTopLotCard({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.topLotCard}>
      <Skeleton variant="circle" size={28} mode={mode} />
      <View style={styles.topLotInfo}>
        <Skeleton width={120} height={16} mode={mode} />
        <Skeleton width={60} height={12} mode={mode} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.topLotStats}>
        <Skeleton width={70} height={18} mode={mode} />
        <Skeleton width={50} height={12} mode={mode} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Skeleton for stat row in details section */
export function SkeletonStatRow({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        <Skeleton variant="circle" size={28} mode={mode} />
        <Skeleton width={100} height={14} mode={mode} />
      </View>
      <Skeleton width={80} height={18} mode={mode} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 FULL DASHBOARD SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

export function SkeletonDashboard({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.dashboardContainer}>
      {/* Hero Card */}
      <SkeletonHeroCard mode={mode} />

      {/* Metric Cards Row */}
      <View style={styles.metricsRow}>
        <SkeletonMetricCard mode={mode} />
        <SkeletonMetricCard mode={mode} />
        <SkeletonMetricCard mode={mode} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Skeleton
          width={120}
          height={20}
          mode={mode}
          style={{ marginBottom: 12 }}
        />
        <SkeletonQuickActions mode={mode} />
      </View>

      {/* Top Performers */}
      <View style={styles.section}>
        <Skeleton
          width={140}
          height={20}
          mode={mode}
          style={{ marginBottom: 12 }}
        />
        <SkeletonTopLotCard mode={mode} />
        <SkeletonTopLotCard mode={mode} />
        <SkeletonTopLotCard mode={mode} />
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <Skeleton
          width={80}
          height={20}
          mode={mode}
          style={{ marginBottom: 12 }}
        />
        <View style={styles.detailsCard}>
          <SkeletonStatRow mode={mode} />
          <SkeletonStatRow mode={mode} />
          <SkeletonStatRow mode={mode} />
          <View style={styles.divider} />
          <SkeletonStatRow mode={mode} />
          <SkeletonStatRow mode={mode} />
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 LIST SKELETONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Skeleton for list items (stock, lots, sales) */
export function SkeletonListItem({
  mode = "light",
}: {
  mode?: "light" | "dark";
}) {
  return (
    <View style={styles.listItem}>
      <Skeleton
        variant="rect"
        width={60}
        height={60}
        borderRadius={Radius.md}
        mode={mode}
      />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} mode={mode} />
        <Skeleton
          width="40%"
          height={12}
          mode={mode}
          style={{ marginTop: 6 }}
        />
        <Skeleton
          width="50%"
          height={12}
          mode={mode}
          style={{ marginTop: 4 }}
        />
      </View>
      <View style={styles.listItemRight}>
        <Skeleton width={60} height={18} mode={mode} />
        <Skeleton
          variant="circle"
          size={24}
          mode={mode}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

/** Full list skeleton */
export function SkeletonList({
  count = 5,
  mode = "light",
}: {
  count?: number;
  mode?: "light" | "dark";
}) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} mode={mode} />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
    borderCurve: "continuous",
  },
  shimmerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "300%",
  },
  shimmerGradient: {
    flex: 1,
    width: "33.33%",
  },

  // Dashboard skeleton styles
  dashboardContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // Hero card
  heroCard: {
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  heroCardDark: {
    backgroundColor: Palette.neutral[800],
    borderColor: Palette.neutral[700],
  },
  periodChips: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
  },
  heroStat: {
    alignItems: "center",
    gap: Spacing.xs,
  },

  // Metric cards
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  metricContent: {
    flex: 1,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
  },

  // Top lot card - Premium glassmorphic
  topLotCard: {
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.01), inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  topLotInfo: {
    flex: 1,
  },
  topLotStats: {
    alignItems: "flex-end",
  },

  // Details section
  section: {
    gap: Spacing.sm,
  },
  detailsCard: {
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.01), inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.neutral[200],
    marginVertical: Spacing.xs,
  },

  // List skeleton - Premium styling
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Palette.neutral.white,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  listItemContent: {
    flex: 1,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
});
