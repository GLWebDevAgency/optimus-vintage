/**
 * 🌌 VANTA DASHBOARD - The Singularity
 *
 * "Each data point is a gravitational singularity"
 * Obsidian Slabs floating in the spatial void
 *
 * Architecture:
 * - AETHER (Dark): Absolute Zero void, Gold emanations
 * - IVORY (Light): Organic warmth, Champagne refractions
 *
 * v6.0 - The "Vanta" Era
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import {
  VantaScreen,
  useIsDarkMode,
  useVantaTheme,
} from "@/components/ui/PremiumUI";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { LotsRepository, SalesRepository } from "@/db/repositories";
import { useTrackScreen } from "@/utils/analytics";
import { computeLotSummary } from "@/utils/engine/calculations";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 VANTA PHYSICS - Gravity-Based Springs
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING_GRAVITY = {
  damping: 22,
  stiffness: 180,
  mass: 1.2,
};

const SPRING_SNAP = {
  damping: 16,
  stiffness: 400,
  mass: 0.6,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

type PeriodFilter = "7d" | "30d" | "3m" | "1y" | "all";

interface PeriodOption {
  key: PeriodFilter;
  label: string;
  shortLabel: string;
  days: number | null;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "7d", label: "7 jours", shortLabel: "7J", days: 7 },
  { key: "30d", label: "30 jours", shortLabel: "30J", days: 30 },
  { key: "3m", label: "3 mois", shortLabel: "3M", days: 90 },
  { key: "1y", label: "1 an", shortLabel: "1A", days: 365 },
  { key: "all", label: "Tout", shortLabel: "∞", days: null },
];

function getDateThreshold(days: number | null): Date | null {
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatCurrency(value: number, compact = false): string {
  const prefix = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  if (compact) {
    if (absValue >= 1000000)
      return `${prefix}${(absValue / 1000000).toFixed(1)}M€`;
    if (absValue >= 1000) return `${prefix}${(absValue / 1000).toFixed(1)}k€`;
  }
  return `${prefix}${absValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}€`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 VANTA COMPONENTS - Digital Sculptures
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Status Pulse - Animated connection indicator ────────────────────────────
function StatusPulse() {
  const isDark = useIsDarkMode();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const goldColor = isDark ? Palette.metal.gold : Palette.metal.champagne;

  return (
    <View style={{ width: 10, height: 10, justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: goldColor,
          },
          pulseStyle,
        ]}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: goldColor,
          boxShadow: `0 0 12px ${isDark ? Palette.metal.goldGlow : Palette.metal.champagneGlow}`,
        }}
      />
    </View>
  );
}

// ─── Vanta Period Selector - Floating Obsidian Pills ─────────────────────────
interface VantaPeriodSelectorProps {
  options: PeriodOption[];
  selectedKey: PeriodFilter;
  onChange: (key: PeriodFilter) => void;
}

function VantaPeriodSelector({
  options,
  selectedKey,
  onChange,
}: VantaPeriodSelectorProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const selectedIndex = options.findIndex((o) => o.key === selectedKey);
  const segmentWidth = 100 / options.length;

  const indicatorPosition = useSharedValue(selectedIndex * segmentWidth);

  useEffect(() => {
    indicatorPosition.value = withSpring(
      selectedIndex * segmentWidth,
      SPRING_GRAVITY,
    );
  }, [selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorPosition.value}%` as unknown as number,
    width: `${segmentWidth}%` as unknown as number,
  }));

  // Pulsing glow for active indicator
  const glowOpacity = useSharedValue(0.6);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View
      style={{
        paddingHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
      }}
    >
      <View
        style={{
          height: 48,
          borderRadius: 16,
          backgroundColor: isDark ? Palette.vanta.titanium : Palette.ivory.sand,
          borderWidth: 1,
          borderColor: isDark
            ? `${Palette.metal.gold}15`
            : `${Palette.metal.champagne}20`,
          padding: 4,
          position: "relative",
          boxShadow: isDark
            ? `inset 0 2px 8px ${Palette.vanta.black}80`
            : `inset 0 2px 6px rgba(0, 0, 0, 0.06)`,
        }}
      >
        {/* Gold/Champagne Indicator */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              borderRadius: 12,
            },
            indicatorStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: 14,
                backgroundColor: isDark
                  ? Palette.metal.goldGlow
                  : Palette.metal.champagneGlow,
              },
              glowStyle,
            ]}
          />
          <View
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: isDark
                ? Palette.vanta.graphite
                : Palette.ivory.pearl,
              borderWidth: 1,
              borderColor: isDark
                ? Palette.metal.gold
                : Palette.metal.champagne,
              boxShadow: isDark
                ? `0 4px 16px ${Palette.metal.goldGlow}`
                : `0 4px 16px ${Palette.metal.champagneGlow}`,
            }}
          />
        </Animated.View>

        {/* Segment Buttons */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {options.map((option) => {
            const isSelected = option.key === selectedKey;

            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  Haptic.impactLight();
                  onChange(option.key);
                }}
                style={{
                  flex: 1,
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Manrope_700Bold",
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    color: isSelected
                      ? isDark
                        ? Palette.metal.gold
                        : Palette.metal.champagneDark
                      : theme.textMuted,
                  }}
                >
                  {option.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Vanta Slab Button - Obsidian/Pearl Interactive ──────────────────────────
interface VantaSlabButtonProps {
  icon: AppIconName;
  onPress: () => void;
  size?: number;
}

function VantaSlabButton({ icon, onPress, size = 20 }: VantaSlabButtonProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, SPRING_SNAP);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: Radius.lg,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark
              ? Palette.vanta.titanium
              : Palette.ivory.pearl,
            borderWidth: 1,
            borderColor: isDark
              ? `${Palette.metal.gold}20`
              : `${Palette.metal.champagne}30`,
            boxShadow: isDark
              ? `0 4px 16px ${Palette.vanta.black}80, inset 0 1px 0 ${Palette.vanta.steel}40`
              : `0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 ${Palette.ivory.pearl}`,
          },
          animatedStyle,
        ]}
      >
        <AppIcon
          name={icon}
          size={size}
          color={isDark ? Palette.metal.gold : Palette.metal.champagneDark}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Singularity - Hero KPI Card ───────────────────────────────────────
interface VantaSingularityProps {
  revenue: number;
  profit: number;
  investment: number;
  roi: number;
  onDetailPress: () => void;
}

function VantaSingularity({
  revenue,
  profit,
  investment,
  roi,
  onDetailPress,
}: VantaSingularityProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();

  // Pulsing core animation
  const coreScale = useSharedValue(1);
  const coreGlow = useSharedValue(0.5);

  useEffect(() => {
    coreScale.value = withRepeat(
      withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    coreGlow.value = withRepeat(
      withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
    opacity: coreGlow.value,
  }));

  const isProfitable = profit >= 0;
  const isPositiveROI = roi >= 0;

  return (
    <View
      style={{
        marginHorizontal: Spacing.lg,
        borderRadius: 28,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark
          ? `${Palette.metal.gold}30`
          : `${Palette.metal.champagne}40`,
        boxShadow: isDark
          ? `0 8px 40px ${Palette.vanta.black}, 0 0 60px ${Palette.metal.goldSubtle}`
          : `0 8px 40px rgba(0, 0, 0, 0.08), 0 0 40px ${Palette.metal.champagneSubtle}`,
      }}
    >
      <LinearGradient
        colors={
          isDark
            ? [Palette.vanta.titanium, Palette.vanta.carbon]
            : [Palette.ivory.pearl, Palette.ivory.cream]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: Spacing.xl }}
      >
        {/* Floating Glow Core */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: isDark
                ? Palette.metal.goldGlow
                : Palette.metal.champagneGlow,
            },
            coreAnimatedStyle,
          ]}
        />

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: Spacing.sm,
          }}
        >
          <Text
            style={{
              ...Typography.label.sm,
              color: isDark ? Palette.metal.gold : Palette.metal.champagneDark,
              letterSpacing: 2,
              fontWeight: "600",
            }}
          >
            CHIFFRE D'AFFAIRES
          </Text>
          <Pressable
            onPress={() => {
              Haptic.impactLight();
              onDetailPress();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
              borderRadius: Radius.full,
              backgroundColor: isDark
                ? `${Palette.metal.gold}15`
                : `${Palette.metal.champagne}20`,
              gap: 4,
            }}
          >
            <Text
              style={{
                ...Typography.label.xs,
                color: isDark
                  ? Palette.metal.gold
                  : Palette.metal.champagneDark,
              }}
            >
              Détails
            </Text>
            <AppIcon
              name="chevron-right"
              size={14}
              color={isDark ? Palette.metal.gold : Palette.metal.champagneDark}
            />
          </Pressable>
        </View>

        {/* Hero Number */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text
            style={{
              fontSize: 60,
              fontFamily: "Manrope_700Bold",
              letterSpacing: -3,
              lineHeight: 64,
              color: theme.text,
            }}
          >
            {formatNumber(revenue)}
            <Text
              style={{
                fontSize: 32,
                color: isDark ? Palette.metal.gold : Palette.metal.champagne,
              }}
            >
              €
            </Text>
          </Text>
        </View>

        {/* Singularity Metrics Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            backgroundColor: isDark
              ? `${Palette.vanta.black}60`
              : `${Palette.ivory.sand}80`,
            borderRadius: 16,
            padding: Spacing.sm,
          }}
        >
          {/* Profit */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              padding: Spacing.xs,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isProfitable
                  ? Palette.semantic.success
                  : Palette.semantic.danger,
                boxShadow: isProfitable
                  ? `0 0 16px ${Palette.semantic.success}80`
                  : `0 0 16px ${Palette.semantic.danger}80`,
              }}
            />
            <Text style={{ ...Typography.body.xs, color: theme.textMuted }}>
              Profit
            </Text>
            <Text
              style={{
                ...Typography.number.sm,
                fontWeight: "700",
                color: isProfitable
                  ? Palette.semantic.success
                  : Palette.semantic.danger,
              }}
            >
              {isProfitable ? "+" : ""}
              {formatCurrency(profit)}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              width: 1,
              alignSelf: "stretch",
              marginVertical: Spacing.xs,
              backgroundColor: isDark
                ? Palette.vanta.steel
                : Palette.ivory.linen,
            }}
          />

          {/* Investment */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              padding: Spacing.xs,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: Palette.semantic.info,
                boxShadow: `0 0 16px ${Palette.semantic.info}80`,
              }}
            />
            <Text style={{ ...Typography.body.xs, color: theme.textMuted }}>
              Invest.
            </Text>
            <Text
              style={{
                ...Typography.number.sm,
                fontWeight: "700",
                color: Palette.semantic.info,
              }}
            >
              {formatCurrency(investment, true)}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              width: 1,
              alignSelf: "stretch",
              marginVertical: Spacing.xs,
              backgroundColor: isDark
                ? Palette.vanta.steel
                : Palette.ivory.linen,
            }}
          />

          {/* ROI / Marge */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              padding: Spacing.xs,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isPositiveROI
                  ? isDark
                    ? Palette.metal.gold
                    : Palette.metal.champagne
                  : Palette.semantic.danger,
                boxShadow: isPositiveROI
                  ? isDark
                    ? `0 0 16px ${Palette.metal.goldGlow}`
                    : `0 0 16px ${Palette.metal.champagneGlow}`
                  : `0 0 16px ${Palette.semantic.danger}80`,
              }}
            />
            <Text style={{ ...Typography.body.xs, color: theme.textMuted }}>
              Marge
            </Text>
            <Text
              style={{
                ...Typography.number.sm,
                fontWeight: "700",
                color: isPositiveROI
                  ? isDark
                    ? Palette.metal.gold
                    : Palette.metal.champagneDark
                  : Palette.semantic.danger,
              }}
            >
              {formatPercent(roi)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Vanta Metric Orb - Floating Data Point ──────────────────────────────────
interface VantaMetricOrbProps {
  icon: AppIconName;
  label: string;
  value: string;
  accentColor: string;
  accentGlow: string;
  onPress?: () => void;
}

function VantaMetricOrb({
  icon,
  label,
  value,
  accentColor,
  accentGlow,
  onPress,
}: VantaMetricOrbProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, SPRING_SNAP);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptic.impactLight();
          onPress();
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            borderRadius: 20,
            padding: Spacing.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark
              ? Palette.vanta.titanium
              : Palette.ivory.pearl,
            borderWidth: 1,
            borderColor: isDark ? `${accentColor}25` : `${accentColor}20`,
            boxShadow: isDark
              ? `0 4px 24px ${Palette.vanta.black}80, 0 0 30px ${accentGlow}`
              : `0 4px 24px rgba(0, 0, 0, 0.06), 0 0 20px ${accentGlow}`,
          },
          animatedStyle,
        ]}
      >
        {/* Icon Container with Glow */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.sm,
            backgroundColor: isDark ? `${accentColor}20` : `${accentColor}15`,
            boxShadow: `0 4px 16px ${accentGlow}`,
          }}
        >
          <AppIcon name={icon} size={22} color={accentColor} />
        </View>

        {/* Value */}
        <Text
          style={{
            ...Typography.number.lg,
            fontSize: 26,
            fontWeight: "800",
            letterSpacing: -0.5,
            color: theme.text,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>

        {/* Label */}
        <Text
          style={{
            ...Typography.label.xs,
            color: theme.textMuted,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: "600",
            fontSize: 10,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Action Slab - Quick Action Button ─────────────────────────────────
interface VantaActionSlabProps {
  icon: AppIconName;
  label: string;
  accentColor: string;
  accentGlow: string;
  onPress: () => void;
}

function VantaActionSlab({
  icon,
  label,
  accentColor,
  accentGlow,
  onPress,
}: VantaActionSlabProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0.3);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING_SNAP);
    glowIntensity.value = withTiming(0.8, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
    glowIntensity.value = withTiming(0.3, { duration: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptic.impactMedium();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: Spacing.xl,
            borderRadius: 24,
            backgroundColor: isDark
              ? Palette.vanta.titanium
              : Palette.ivory.pearl,
            borderWidth: 1,
            borderColor: isDark ? `${accentColor}30` : `${accentColor}25`,
            boxShadow: isDark
              ? `0 8px 32px ${Palette.vanta.black}, 0 0 40px ${accentGlow}`
              : `0 8px 32px rgba(0, 0, 0, 0.08), 0 0 30px ${accentGlow}`,
          },
          animatedStyle,
        ]}
      >
        {/* Glowing Icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.sm,
            backgroundColor: isDark ? `${accentColor}20` : `${accentColor}12`,
            boxShadow: `0 6px 24px ${accentGlow}`,
          }}
        >
          <AppIcon name={icon} size={26} color={accentColor} />
        </View>

        <Text
          style={{
            ...Typography.label.sm,
            color: theme.text,
            fontWeight: "700",
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Top Lot Card - Ranked Performers ──────────────────────────────────
interface VantaTopLotProps {
  rank: number;
  name: string;
  revenue: number;
  profit: number;
  soldCount: number;
  onPress: () => void;
}

function VantaTopLotCard({
  rank,
  name,
  revenue,
  profit,
  soldCount,
  onPress,
}: VantaTopLotProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const isProfitable = profit >= 0;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_SNAP);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Rank medal colors (Gold, Silver, Bronze)
  const getRankStyle = (r: number) => {
    switch (r) {
      case 1:
        return {
          bg: isDark ? Palette.metal.gold : Palette.metal.champagne,
          glow: isDark ? Palette.metal.goldGlow : Palette.metal.champagneGlow,
          text: isDark ? Palette.vanta.black : Palette.ivory.pearl,
        };
      case 2:
        return {
          bg: Palette.metal.mercury,
          glow: "rgba(200, 200, 200, 0.4)",
          text: Palette.vanta.graphite,
        };
      case 3:
        return {
          bg: Palette.metal.bronze,
          glow: "rgba(205, 127, 50, 0.4)",
          text: Palette.ivory.pearl,
        };
      default:
        return {
          bg: theme.surfaceCard,
          glow: "transparent",
          text: theme.textSecondary,
        };
    }
  };
  const rankStyle = getRankStyle(rank);

  return (
    <Pressable
      onPress={() => {
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            padding: Spacing.md,
            borderRadius: 20,
            gap: Spacing.md,
            backgroundColor: isDark
              ? Palette.vanta.titanium
              : Palette.ivory.pearl,
            borderWidth: 1,
            borderColor: isDark
              ? `${Palette.metal.gold}15`
              : `${Palette.metal.champagne}20`,
            boxShadow: isDark
              ? `0 4px 20px ${Palette.vanta.black}80, 0 0 30px ${rankStyle.glow}`
              : `0 4px 20px rgba(0, 0, 0, 0.06), 0 0 20px ${rankStyle.glow}`,
          },
          animatedStyle,
        ]}
      >
        {/* Rank Badge */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: rankStyle.bg,
            boxShadow: `0 4px 16px ${rankStyle.glow}`,
          }}
        >
          <Text
            style={{
              ...Typography.label.md,
              color: rankStyle.text,
              fontWeight: "900",
              letterSpacing: -0.5,
            }}
          >
            #{rank}
          </Text>
        </View>

        {/* Lot Info */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              ...Typography.body.md,
              color: theme.text,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={{ ...Typography.body.xs, color: theme.textMuted }}>
            {soldCount} vente{soldCount > 1 ? "s" : ""}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text
            style={{
              ...Typography.number.md,
              color: theme.text,
              fontWeight: "700",
            }}
          >
            {formatCurrency(revenue)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              paddingHorizontal: Spacing.xs,
              paddingVertical: 2,
              borderRadius: Radius.full,
              backgroundColor: isProfitable
                ? `${Palette.semantic.success}20`
                : `${Palette.semantic.danger}20`,
            }}
          >
            <AppIcon
              name={isProfitable ? "trending-up" : "trending-down"}
              size={10}
              color={
                isProfitable
                  ? Palette.semantic.success
                  : Palette.semantic.danger
              }
            />
            <Text
              style={{
                ...Typography.label.xs,
                color: isProfitable
                  ? Palette.semantic.success
                  : Palette.semantic.danger,
                fontWeight: "700",
              }}
            >
              {isProfitable ? "+" : ""}
              {formatCurrency(profit)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 VANTA DASHBOARD - Main Screen
// ═══════════════════════════════════════════════════════════════════════════════

export default function VantaDashboard() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

  useTrackScreen("dashboard");

  // ─── Data Queries ────────────────────────────────────────────────────
  const lotsQuery = useQuery({
    queryKey: ["lots"],
    queryFn: () => LotsRepository.getAll(),
  });

  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });

  const loading = lotsQuery.isLoading || salesQuery.isLoading;
  const refreshing =
    (lotsQuery.isFetching || salesQuery.isFetching) && !loading;
  const lots = lotsQuery.data ?? [];
  const allSales = salesQuery.data ?? [];

  // ─── Filtered Sales ──────────────────────────────────────────────────
  const sales = useMemo(() => {
    const option = PERIOD_OPTIONS.find((p) => p.key === selectedPeriod);
    if (!option || option.days === null) return allSales;
    const threshold = getDateThreshold(option.days);
    if (!threshold) return allSales;
    return allSales.filter((s) => new Date(s.saleDate) >= threshold);
  }, [allSales, selectedPeriod]);

  // ─── Computed Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalInvest = 0;
    let totalRev = 0;
    let totalStock = 0;
    let activeLots = 0;
    let stockValue = 0;

    const lotStats: {
      id: number;
      name: string;
      revenue: number;
      profit: number;
      soldCount: number;
    }[] = [];

    for (const lot of lots) {
      const lotSales = sales.filter((s) => s.lotId === lot.id);
      const allLotSales = allSales.filter((s) => s.lotId === lot.id);
      const summary = computeLotSummary(lot, [], allLotSales);

      totalInvest += summary.totalInvestment;
      totalStock += summary.remainingQuantity;
      if (summary.remainingQuantity > 0) activeLots++;

      const avgCost =
        lot.totalCost && lot.initialQuantity
          ? Number(lot.totalCost) / lot.initialQuantity
          : 0;
      stockValue += summary.remainingQuantity * avgCost;

      const periodRevenue = lotSales.reduce(
        (sum, s) => sum + parseFloat(String(s.priceNet)),
        0,
      );
      totalRev += periodRevenue;

      lotStats.push({
        id: lot.id,
        name: lot.name || `Lot #${lot.id}`,
        revenue: periodRevenue,
        profit: periodRevenue - lotSales.length * avgCost,
        soldCount: lotSales.length,
      });
    }

    const profit = totalRev - totalInvest;
    const roi = totalInvest > 0 ? (profit / totalInvest) * 100 : 0;
    const avgSaleValue = sales.length > 0 ? totalRev / sales.length : 0;
    const avgMargin = sales.length > 0 ? profit / sales.length : 0;

    const topLots = lotStats
      .filter((l) => l.soldCount > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return {
      revenue: totalRev,
      profit,
      investment: totalInvest,
      roi,
      stockCount: totalStock,
      stockValue,
      salesCount: sales.length,
      avgSaleValue,
      avgMargin,
      activeLots,
      topLots,
    };
  }, [lots, sales, allSales]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    lotsQuery.refetch();
    salesQuery.refetch();
  }, [lotsQuery, salesQuery]);

  const handlePeriodChange = useCallback((period: PeriodFilter) => {
    Haptic.selection();
    setSelectedPeriod(period);
  }, []);

  // ─── Accent Colors based on mode ─────────────────────────────────────
  const accentGold = isDark ? Palette.metal.gold : Palette.metal.champagne;
  const accentGoldGlow = isDark
    ? Palette.metal.goldGlow
    : Palette.metal.champagneGlow;

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <VantaScreen>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + Spacing.sm,
            paddingBottom: insets.bottom + 120,
            gap: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonDashboard />
        </ScrollView>
      </VantaScreen>
    );
  }

  return (
    <VantaScreen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.sm,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accentGold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ VANTA STATUS BAR ═══ */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.sm,
            opacity: 0.8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppIcon
              name="grid-view"
              size={14}
              color={isDark ? Palette.metal.gold : Palette.metal.champagne}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 3,
                textTransform: "uppercase",
                color: isDark ? `${Palette.neutral.white}60` : Palette.neutral[400],
              }}
            >
              NEXUS-01
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <StatusPulse />
            <Text
              style={{
                fontSize: 9,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                color: isDark ? `${Palette.neutral.white}40` : Palette.neutral[400],
              }}
            >
              CONNECTED
            </Text>
          </View>
        </Animated.View>

        {/* ═══ HEADER ═══ */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: Spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.md,
              flex: 1,
            }}
          >
            {/* Avatar with Gold/Champagne Glow */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: accentGold,
                boxShadow: `0 6px 24px ${accentGoldGlow}`,
              }}
            >
              <Text
                style={{
                  ...Typography.heading.md,
                  color: isDark ? Palette.vanta.black : Palette.ivory.pearl,
                  fontWeight: "800",
                }}
              >
                OV
              </Text>
            </View>
            <View>
              <Text
                style={{
                  ...Typography.heading.lg,
                  color: theme.text,
                }}
              >
                Optimus Vintage
              </Text>
              <Text
                style={{
                  ...Typography.body.sm,
                  color: theme.textMuted,
                }}
              >
                {lots.length} lots • {stats.stockCount} articles
              </Text>
            </View>
          </View>
          <VantaSlabButton
            icon="settings"
            onPress={() => router.push("/(tabs)/settings")}
          />
        </Animated.View>

        {/* ═══ PERIOD SELECTOR ═══ */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <VantaPeriodSelector
            options={PERIOD_OPTIONS}
            selectedKey={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </Animated.View>

        {/* ═══ HERO SINGULARITY ═══ */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <VantaSingularity
            revenue={stats.revenue}
            profit={stats.profit}
            investment={stats.investment}
            roi={stats.roi}
            onDetailPress={() => router.push("/(tabs)/sales")}
          />
        </Animated.View>

        {/* ═══ METRIC ORBS (3 columns) ═══ */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500)}
          style={{
            flexDirection: "row",
            gap: Spacing.md,
            paddingHorizontal: Spacing.lg,
          }}
        >
          <VantaMetricOrb
            icon="inventory-2"
            label="En stock"
            value={formatNumber(stats.stockCount)}
            accentColor={accentGold}
            accentGlow={accentGoldGlow}
            onPress={() => router.push("/(tabs)/stock")}
          />
          <VantaMetricOrb
            icon="receipt"
            label="Ventes"
            value={formatNumber(stats.salesCount)}
            accentColor={Palette.semantic.info}
            accentGlow={`${Palette.semantic.info}50`}
            onPress={() => router.push("/(tabs)/sales")}
          />
          <VantaMetricOrb
            icon="folder"
            label="Lots actifs"
            value={formatNumber(stats.activeLots)}
            accentColor={Palette.semantic.success}
            accentGlow={`${Palette.semantic.success}50`}
            onPress={() => router.push("/(tabs)/lots")}
          />
        </Animated.View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={{ paddingHorizontal: Spacing.lg }}
        >
          <View style={{ marginBottom: Spacing.md }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 3,
                textTransform: "uppercase",
                color: isDark ? `${Palette.neutral.white}40` : Palette.neutral[400],
                marginBottom: 6,
              }}
            >
              COMMANDES
            </Text>
            <Text
              style={{
                ...Typography.heading.md,
                color: theme.text,
              }}
            >
              Actions Rapides
            </Text>
            <View
              style={{
                width: 32,
                height: 2,
                backgroundColor: accentGold,
                marginTop: 8,
                borderRadius: 1,
                opacity: 0.6,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: Spacing.md,
            }}
          >
            <VantaActionSlab
              icon="add"
              label="Nouveau lot"
              accentColor={Palette.semantic.success}
              accentGlow={`${Palette.semantic.success}40`}
              onPress={() => router.push("/lots/new")}
            />
            <VantaActionSlab
              icon="sell"
              label="Vendre"
              accentColor={accentGold}
              accentGlow={accentGoldGlow}
              onPress={() => router.push("/sales/new")}
            />
          </View>
        </Animated.View>

        {/* ═══ TOP PERFORMERS ═══ */}
        {stats.topLots.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={{ paddingHorizontal: Spacing.lg }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: Spacing.md,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: isDark ? `${Palette.neutral.white}40` : Palette.neutral[400],
                    marginBottom: 6,
                  }}
                >
                  PERFORMANCE
                </Text>
                <Text style={{ ...Typography.heading.md, color: theme.text }}>
                  Top Performers
                </Text>
                <View
                  style={{
                    width: 32,
                    height: 2,
                    backgroundColor: accentGold,
                    marginTop: 8,
                    borderRadius: 1,
                    opacity: 0.6,
                  }}
                />
              </View>
              <Pressable 
                onPress={() => router.push("/(tabs)/lots")}
                style={{
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: accentGold,
                    textDecorationLine: "underline",
                  }}
                >
                  Voir tout
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: Spacing.sm }}>
              {stats.topLots.map((lot, index) => (
                <VantaTopLotCard
                  key={lot.id}
                  rank={index + 1}
                  name={lot.name}
                  revenue={lot.revenue}
                  profit={lot.profit}
                  soldCount={lot.soldCount}
                  onPress={() => router.push(`/lots/${lot.id}`)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </VantaScreen>
  );
}
