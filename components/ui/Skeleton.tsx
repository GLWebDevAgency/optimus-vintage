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

import { useNeuTheme } from "@/constants/ThemeContext";
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

const getSkeletonColors = (isDark: boolean) => ({
  base: isDark ? "#2A2A32" : "#D1D9E6", // Dark: surface dark, Light: neumorphic muted
  highlight: isDark ? "#32323A" : "#E8EDF5", // Légèrement plus clair
});

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
  /** Custom style */
  style?: ViewStyle;
  /** Animation duration in ms */
  duration?: number;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius: customBorderRadius,
  variant = "rect",
  size,
  style,
  duration = 1200,
}: SkeletonProps) {
  const { radius, isDark } = useNeuTheme();
  const shimmerPosition = useSharedValue(-1);
  const colors = getSkeletonColors(isDark);
  const borderRadius = customBorderRadius ?? radius.sm;

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
          borderRadius: radius.xs,
        };
      case "card":
        return {
          width: "100%" as const,
          height: height || 120,
          borderRadius: radius.lg,
        };
      default:
        return { width, height, borderRadius };
    }
  }, [variant, width, height, size, borderRadius, radius]);

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
      accessibilityLabel="Chargement en cours"
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
export function SkeletonMetricCard() {
  return (
    <View style={styles.metricCard}>
      <Skeleton variant="circle" size={32} />
      <View style={styles.metricContent}>
        <Skeleton width={60} height={24} />
        <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Skeleton for hero revenue card */
export function SkeletonHeroCard() {
  const { radius, isDark, palette } = useNeuTheme();
  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: isDark
            ? palette.background.elevated
            : palette.background.main,
          borderColor: isDark ? palette.divider.main : palette.divider.light,
        },
      ]}
    >
      {/* Period chips */}
      <View style={styles.periodChips}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={40} height={28} borderRadius={radius.full} />
        ))}
      </View>

      {/* Main value */}
      <Skeleton width={180} height={48} style={{ marginTop: 16 }} />

      {/* Mini stats */}
      <View style={styles.heroStats}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.heroStat}>
            <Skeleton variant="circle" size={8} />
            <Skeleton width={50} height={12} />
            <Skeleton width={60} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton for quick action buttons */
export function SkeletonQuickActions() {
  return (
    <View style={styles.quickActionsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.quickActionBtn}>
          <Skeleton variant="circle" size={40} />
          <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

/** Skeleton for top lot cards */
export function SkeletonTopLotCard() {
  return (
    <View style={styles.topLotCard}>
      <Skeleton variant="circle" size={28} />
      <View style={styles.topLotInfo}>
        <Skeleton width={120} height={16} />
        <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.topLotStats}>
        <Skeleton width={70} height={18} />
        <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Skeleton for stat row in details section */
export function SkeletonStatRow() {
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        <Skeleton variant="circle" size={28} />
        <Skeleton width={100} height={14} />
      </View>
      <Skeleton width={80} height={18} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 FULL DASHBOARD SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

export function SkeletonDashboard() {
  const { spacing, radius, isDark, palette } = useNeuTheme();

  return (
    <View
      style={[
        styles.dashboardContainer,
        { padding: spacing.lg, gap: spacing.lg },
      ]}
    >
      {/* Hero Card */}
      <SkeletonHeroCard />

      {/* Metric Cards Row */}
      <View style={[styles.metricsRow, { gap: spacing.sm }]}>
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { gap: spacing.sm }]}>
        <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
        <SkeletonQuickActions />
      </View>

      {/* Top Performers */}
      <View style={[styles.section, { gap: spacing.sm }]}>
        <Skeleton width={140} height={20} style={{ marginBottom: 12 }} />
        <SkeletonTopLotCard />
        <SkeletonTopLotCard />
        <SkeletonTopLotCard />
      </View>

      {/* Details Section */}
      <View style={[styles.section, { gap: spacing.sm }]}>
        <Skeleton width={80} height={20} style={{ marginBottom: 12 }} />
        <View
          style={[
            styles.detailsCard,
            {
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.sm,
              backgroundColor: isDark
                ? palette.background.elevated
                : palette.background.main,
              borderColor: isDark
                ? palette.divider.main
                : palette.divider.light,
            },
          ]}
        >
          <SkeletonStatRow />
          <SkeletonStatRow />
          <SkeletonStatRow />
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark
                  ? palette.divider.main
                  : palette.divider.light,
              },
            ]}
          />
          <SkeletonStatRow />
          <SkeletonStatRow />
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 LIST SKELETONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Skeleton for list items (stock, lots, sales) */
export function SkeletonListItem() {
  const { spacing, radius, isDark, palette } = useNeuTheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          padding: spacing.md,
          borderRadius: radius.lg,
          marginBottom: spacing.sm,
          gap: spacing.md,
          backgroundColor: isDark
            ? palette.background.elevated
            : palette.background.main,
          borderColor: isDark ? palette.divider.main : palette.divider.light,
        },
      ]}
    >
      <Skeleton
        variant="rect"
        width={60}
        height={60}
        borderRadius={radius.md}
      />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.listItemRight}>
        <Skeleton width={60} height={18} />
        <Skeleton variant="circle" size={24} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/** Full list skeleton */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
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
    // padding et gap appliqués dynamiquement
  },

  // Hero card
  heroCard: {
    borderRadius: 24, // radius.xl
    padding: 20, // spacing.lg
    borderWidth: 1,
  },
  periodChips: {
    flexDirection: "row",
    gap: 8, // spacing.xs
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20, // spacing.lg
    paddingTop: 16, // spacing.md
    borderTopWidth: 1,
  },
  heroStat: {
    alignItems: "center",
    gap: 8, // spacing.xs
  },

  // Metric cards
  metricsRow: {
    flexDirection: "row",
    // gap appliqué dynamiquement
  },
  metricCard: {
    flex: 1,
    borderRadius: 20, // radius.lg
    padding: 16, // spacing.md
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // spacing.sm
    borderWidth: 1,
  },
  metricContent: {
    flex: 1,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12, // spacing.sm
  },
  quickActionBtn: {
    flex: 1,
    minWidth: "22%",
    borderRadius: 20, // radius.lg
    padding: 16, // spacing.md
    alignItems: "center",
    borderWidth: 1,
  },

  // Top lot card
  topLotCard: {
    borderRadius: 20, // radius.lg
    padding: 16, // spacing.md
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // spacing.sm
    marginBottom: 8, // spacing.xs
    borderWidth: 1,
  },
  topLotInfo: {
    flex: 1,
  },
  topLotStats: {
    alignItems: "flex-end",
  },

  // Details section
  section: {
    // gap appliqué dynamiquement
  },
  detailsCard: {
    borderWidth: 1,
    // borderRadius, padding, gap, backgroundColor, borderColor appliqués dynamiquement
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8, // spacing.xs
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // spacing.sm
  },
  divider: {
    height: 1,
    marginVertical: 8, // spacing.xs
    // backgroundColor appliqué dynamiquement
  },

  // List skeleton
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    // padding, borderRadius, marginBottom, gap, backgroundColor, borderColor appliqués dynamiquement
  },
  listItemContent: {
    flex: 1,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
});
