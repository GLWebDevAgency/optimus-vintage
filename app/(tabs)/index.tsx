/**
 * 🌌 VANTA DASHBOARD - The Singularity
 *
 * "Rejeter le concept de 'pages' au profit d'une Architecture Digitale
 *  évoluant dans un vide spatial infini."
 *
 * Design Principles:
 * - FOND: Noir 'Vanta' absolu (#000000), néant profond
 * - MATIÈRE: Obsidienne polie, Titane noir, Verre de carbone
 * - ACCENTS: Or Pur uniquement, traités comme phénomènes physiques
 *
 * v6.0 - The "Vanta-Aether" Era
 */

import { VantaBarChart } from "@/components/charts/VantaBarChart";
import { VantaLineChart } from "@/components/charts/VantaLineChart";
import { VantaPieChart } from "@/components/charts/VantaPieChart";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { TierBadge } from "@/components/gamification/TierBadge";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { CurvedItem, ScrollEdgeFade } from "@/components/ui/CurvedScroll";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { VantaScreen, useVantaTheme } from "@/components/ui/PremiumUI";
import { SPRING_GRAVITY, SPRING_SNAP } from "@/constants/Animation";
import { QuotaIndicator } from "@/components/ui/quota-indicator";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { TrialBanner } from "@/components/ui/trial-banner";
import { Palette, Spacing } from "@/constants/Theme";
import { LotsRepository, SalesRepository } from "@/db/repositories";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { useAccessibility } from "@/utils/accessibility";
import { analytics, useTrackScreen } from "@/utils/analytics";
import {
  groupSalesByDate,
  groupSalesByMonth,
  groupSalesByPlatform,
} from "@/utils/data/chart-data";
import { useGamificationStore } from "@/store/gamification";
import { computeLotSummary } from "@/utils/engine/calculations";
import {
  recordMilestone,
  requestReview,
  shouldPromptReview,
} from "@/utils/review";
import { Haptic } from "@/utils/haptics";
import {
    formatCurrencyCompact,
    formatCurrency as i18nFormatCurrency,
    useLocale,
} from "@/utils/i18n";
import { usePlanAccess } from "@/utils/plan-access";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    FadeOut,
    LinearTransition,
    interpolate,
    useAnimatedRef,
    useAnimatedStyle,
    useScrollViewOffset,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";


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
  { key: "7d", label: "7d", shortLabel: "7J", days: 7 },
  { key: "30d", label: "30d", shortLabel: "30J", days: 30 },
  { key: "3m", label: "3m", shortLabel: "3M", days: 90 },
  { key: "1y", label: "1y", shortLabel: "1A", days: 365 },
  { key: "all", label: "all", shortLabel: "∞", days: null },
];

function getDateThreshold(days: number | null): Date | null {
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Currency symbol helper — uses store currency
function useCurrencySymbol(): string {
  const currency = useSettingsStore((s) => s.currency);
  const map: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF",
    JPY: "¥",
    CAD: "CA$",
  };
  return map[currency] ?? "€";
}

function formatNumber(value: number, locale = "fr-FR"): string {
  return value.toLocaleString(locale);
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 VANTA COMPONENTS - Digital Architecture
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Status Pulse - Gold photon emanation indicator ─────────────────────────
function StatusPulse() {
  const theme = useVantaTheme();
  const { isReduceMotionEnabled } = useAccessibility();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isReduceMotionEnabled) return;
    pulseScale.value = withRepeat(
      withTiming(1.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [isReduceMotionEnabled]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const goldColor = theme.primary;

  return (
    <View
      style={{
        width: 12,
        height: 12,
        justifyContent: "center",
        alignItems: "center",
      }}
      accessibilityRole="image"
    >
      {/* Pulsing glow ring */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: goldColor,
          },
          pulseStyle,
        ]}
      />
      {/* Solid core */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: goldColor,
        }}
      />
    </View>
  );
}

// ─── Gravity Disk - Hero KPI with Mercury Ring (like template) ───────────────
interface GravityDiskProps {
  percentage: number;
  value: string;
  label: string;
  sublabel?: string;
}

function GravityDisk({ percentage, value, label, sublabel }: GravityDiskProps) {
  const theme = useVantaTheme();
  const { isReduceMotionEnabled } = useAccessibility();

  // Floating animation
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (isReduceMotionEnabled) return;
    floatY.value = withRepeat(
      withTiming(-5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [isReduceMotionEnabled]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Calculate stroke dashoffset for percentage
  const circumference = 2 * Math.PI * 110; // radius = 110
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const goldColor = theme.primary;
  const textColor = theme.text;
  const mutedColor = theme.textMuted;

  return (
    <View
      style={{ alignItems: "center", paddingVertical: Spacing.xl }}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}${sublabel ?? ""}`}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "300",
          letterSpacing: 4,
          textTransform: "uppercase",
          color: mutedColor,
          marginBottom: Spacing.lg,
        }}
      >
        {label}
      </Text>

      {/* Mercury Ring Container */}
      <Animated.View
        style={[
          {
            position: "relative",
            width: 256,
            height: 256,
            // Floating shadow beneath the disk
            boxShadow: theme.shadowCardFloat,
            borderRadius: 128,
          },
          floatStyle,
        ]}
      >
        {/* Outer faint ring */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 128,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: theme.borderGlass,
            boxShadow: theme.shadowGlow,
          }}
        />

        {/* SVG Mercury Ring */}
        <Svg
          width={256}
          height={256}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          {/* Background ring */}
          <Circle
            cx={128}
            cy={128}
            r={110}
            stroke={theme.borderGlass}
            strokeWidth={2}
            fill="none"
          />
          {/* Gold progress ring */}
          <Circle
            cx={128}
            cy={128}
            r={110}
            stroke={goldColor}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>

        {/* Inner Content */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text
              selectable
              style={{
                fontSize: 64,
                fontWeight: "700",
                color: textColor,
                letterSpacing: -3,
                fontVariant: ["tabular-nums"],
              }}
            >
              {value}
            </Text>
            {sublabel && (
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: `${goldColor}CC`,
                  marginTop: 12,
                }}
              >
                {sublabel}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Vanta Period Selector - Minimal Obsidian Pills ──────────────────────────
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

  const goldColor = theme.primary;

  return (
    <View style={{ paddingHorizontal: Spacing.lg, marginVertical: Spacing.md }}>
      <View
        accessibilityRole="tablist"
        style={{
          height: 44,
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderGlass,
          padding: 4,
          position: "relative",
        }}
      >
        {/* Gold Indicator with glow */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              borderRadius: 10,
            },
            indicatorStyle,
          ]}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: theme.surfaceHighlight,
              borderWidth: 1,
              borderColor: goldColor,
            }}
          />
        </Animated.View>

        {/* Segment Buttons */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {options.map((option) => {
            const isSelected = option.key === selectedKey;

            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  Haptic.impactLight();
                  onChange(option.key);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
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
                    fontSize: 12,
                    fontFamily: "Manrope_700Bold",
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: isSelected
                      ? goldColor
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

// ─── Vanta Slab Button - Obsidian Interactive ────────────────────────────────
interface VantaSlabButtonProps {
  icon: AppIconName;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}

function VantaSlabButton({
  icon,
  onPress,
  size = 20,
  accessibilityLabel,
}: VantaSlabButtonProps) {
  const theme = useVantaTheme();
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          {
            width: 44,
            height: 44,
            borderRadius: 14,
            borderCurve: "continuous",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.borderGlass,
          },
          animatedStyle,
        ]}
      >
        <AppIcon name={icon} size={size} color={theme.primary} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Monolith Card - Tier 1 Data Block (like template) ───────────────────────
interface MonolithCardProps {
  icon: AppIconName;
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  badgeVariant?: "gold" | "success" | "info";
  children?: React.ReactNode;
  onPress?: () => void;
}

function MonolithCard({
  icon,
  label,
  value,
  unit,
  badge,
  badgeVariant = "gold",
  children,
  onPress,
}: MonolithCardProps) {
  const theme = useVantaTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_SNAP);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goldColor = theme.primary;
  const textColor = theme.text;
  const mutedColor = theme.textMuted;

  const badgeColors = {
    gold: {
      text: goldColor,
      bg: theme.primaryMuted,
    },
    success: {
      text: Palette.semantic.success,
      bg: `${Palette.semantic.success}15`,
    },
    info: { text: Palette.semantic.info, bg: `${Palette.semantic.info}15` },
  };

  const content = (
    <Animated.View style={animatedStyle}>
      <ObsidianBlock
        variant="premium"
        style={{
          padding: Spacing.lg,
          height: 140,
          justifyContent: "space-between",
        }}
        glowPosition="bottom-right"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            zIndex: 1,
          }}
        >
          <AppIcon
            name={icon}
            size={18}
            color={theme.textGhost}
          />
          {badge && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: badgeColors[badgeVariant].bg,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  color: badgeColors[badgeVariant].text,
                }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ gap: 4, zIndex: 1 }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: mutedColor,
            }}
          >
            {label}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
          >
            <Text
              selectable
              style={{
                fontSize: 28,
                fontWeight: "500",
                color: textColor,
                fontVariant: ["tabular-nums"],
              }}
            >
              {value}
            </Text>
            {unit && (
              <Text
                style={{ fontSize: 14, fontWeight: "400", color: mutedColor }}
              >
                {unit}
              </Text>
            )}
          </View>
        </View>

        {/* Optional visual element */}
        {children && <View style={{ zIndex: 1 }}>{children}</View>}
      </ObsidianBlock>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptic.impactLight();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }} accessibilityLabel={label}>
      {content}
    </View>
  );
}

// ─── Vanta Singularity - Hero Section with Gravity Disk ──────────────────────
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
  const { t, locale } = useLocale();
  const currency = useSettingsStore((s) => s.currency) as
    | "EUR"
    | "USD"
    | "GBP"
    | "CHF"
    | "JPY";
  const currencySymbol = useCurrencySymbol();

  const formatCurrencyLocal = useCallback(
    (value: number, compact = false) => {
      if (compact) return formatCurrencyCompact(value, currency, locale);
      return i18nFormatCurrency(value, currency, locale);
    },
    [currency, locale],
  );

  const isProfitable = profit >= 0;

  // Calculate percentage for the ring (ROI capped at 100%)
  const roiPercentage = Math.min(Math.max(roi, 0), 100);

  const goldColor = theme.primary;
  const textColor = theme.text;
  const mutedColor = theme.textMuted;

  // Strip currency symbols for display value
  const stripSymbol = (s: string) =>
    s
      .replace(/[€$£¥]/g, "")
      .replace(/CHF/g, "")
      .replace(/CA\$/g, "")
      .trim();

  return (
    <View style={{ paddingHorizontal: Spacing.lg }}>
      {/* Gravity Disk with Revenue */}
      <GravityDisk
        percentage={roiPercentage}
        value={stripSymbol(formatCurrencyLocal(revenue, true))}
        label={t("dashboard.hero.revenue")}
        sublabel={currencySymbol}
      />

      {/* Sub-label */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 2,
          textTransform: "uppercase",
          color: `${goldColor}99`,
          textAlign: "center",
          marginTop: -Spacing.md,
          marginBottom: Spacing.lg,
        }}
      >
        {t("dashboard.hero.optimalFlow")}
      </Text>

      {/* Metrics Row - Obsidian Monoliths */}
      <View style={{ flexDirection: "row", gap: Spacing.md }}>
        {/* Profit Monolith */}
        <MonolithCard
          icon="trending-up"
          label={t("dashboard.hero.profit")}
          value={stripSymbol(formatCurrencyLocal(profit, true))}
          unit={currencySymbol}
          badge={
            isProfitable ? formatPercent(roi) : t("dashboard.hero.deficit")
          }
          badgeVariant={isProfitable ? "success" : "gold"}
          onPress={onDetailPress}
        >
          {/* Visual bars like template */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 2,
              height: 24,
              opacity: 0.6,
            }}
          >
            {[40, 70, 100, 60, 30].map((h, i) => (
              <View
                key={i}
                style={{
                  width: 3,
                  height: `${h}%`,
                  borderRadius: 1,
                  backgroundColor: isProfitable
                    ? i === 2
                      ? Palette.semantic.success
                      : `${Palette.semantic.success}${Math.round((h / 100) * 99)
                          .toString(16)
                          .padStart(2, "0")}`
                    : Palette.semantic.danger,
                }}
              />
            ))}
          </View>
        </MonolithCard>

        {/* Investment Monolith */}
        <MonolithCard
          icon="account-balance-wallet"
          label={t("dashboard.hero.investment")}
          value={stripSymbol(formatCurrencyLocal(investment, true))}
          unit={currencySymbol}
          badge={t("dashboard.hero.capital")}
          badgeVariant="info"
        >
          {/* Cryptic hash lines like template */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                height: 1,
                backgroundColor: `${theme.primary}40`,
              }}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "SpaceMono",
                  color: theme.textGhost,
                  letterSpacing: 2,
                }}
              >
                {Math.floor(investment).toString(16).toUpperCase().slice(0, 4)}
              </Text>
              <Text style={{ fontSize: 7, color: theme.textGhost }}>∷</Text>
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "SpaceMono",
                  color: theme.textGhost,
                  letterSpacing: 2,
                }}
              >
                {Math.floor(profit).toString(16).toUpperCase().slice(0, 4)}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: `${theme.primary}20`,
              }}
            />
          </View>
        </MonolithCard>
      </View>
    </View>
  );
}

// ─── Vanta Metric Orb - Mini Obsidian Block ──────────────────────────────────
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
  const { t } = useLocale();
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

  const textColor = theme.text;
  const mutedColor = theme.textMuted;

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
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={t("vanta.tapForDetails")}
    >
      <Animated.View style={animatedStyle}>
        <ObsidianBlock
          variant="premium"
          style={{
            padding: Spacing.md,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 110,
          }}
          glowPosition="center"
        >
          {/* Icon Container */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              borderCurve: "continuous",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: Spacing.sm,
              backgroundColor: `${accentColor}20`,
              zIndex: 1,
            }}
          >
            <AppIcon name={icon} size={20} color={accentColor} />
          </View>

          {/* Value */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              letterSpacing: -0.5,
              color: textColor,
              zIndex: 1,
              fontVariant: ["tabular-nums"],
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
              fontSize: 9,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: mutedColor,
              marginTop: 4,
              zIndex: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </ObsidianBlock>
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Action Slab - Obsidian Quick Action ───────────────────────────────
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
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING_SNAP);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_GRAVITY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textColor = theme.text;

  return (
    <Pressable
      onPress={() => {
        Haptic.impactMedium();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={animatedStyle}>
        <ObsidianBlock
          variant="premium"
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: Spacing.xl,
          }}
          glowPosition="center"
        >
          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: Spacing.sm,
              backgroundColor: `${accentColor}${theme.dark ? "20" : "12"}`,
              borderCurve: "continuous",
              zIndex: 1,
            }}
          >
            <AppIcon name={icon} size={26} color={accentColor} />
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 0.3,
              color: textColor,
              zIndex: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </ObsidianBlock>
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Top Lot Card - Obsidian Ranked Block ──────────────────────────────
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
  const { t, locale } = useLocale();
  const currency = useSettingsStore((s) => s.currency) as
    | "EUR"
    | "USD"
    | "GBP"
    | "CHF"
    | "JPY";
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
          bg: theme.primary,
          glow: theme.primaryGlow,
          text: theme.textOnAccent,
        };
      case 2:
        return {
          bg: "#a0a0a0", // Silver
          glow: "rgba(160, 160, 160, 0.4)",
          text: theme.textOnAccent,
        };
      case 3:
        return {
          bg: "#cd7f32", // Bronze
          glow: "rgba(205, 127, 50, 0.4)",
          text: theme.textOnAccent,
        };
      default:
        return {
          bg: theme.surface,
          glow: "transparent",
          text: theme.textSecondary,
        };
    }
  };
  const rankStyle = getRankStyle(rank);

  const textColor = theme.text;
  const mutedColor = theme.textMuted;

  return (
    <Pressable
      onPress={() => {
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${t("accessibility.lotRank", { rank })}. ${name}. ${i18nFormatCurrency(revenue, currency, locale)}`}
      accessibilityHint={t("vanta.tapForDetails")}
    >
      <Animated.View style={animatedStyle}>
        <ObsidianBlock
          variant="premium"
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: Spacing.md,
            gap: Spacing.md,
          }}
          glowPosition={rank === 1 ? "center" : "top-left"}
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
              borderCurve: "continuous",
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                letterSpacing: -0.5,
                color: rankStyle.text,
              }}
            >
              #{rank}
            </Text>
          </View>

          {/* Lot Info */}
          <View style={{ flex: 1, gap: 2, zIndex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: textColor,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: mutedColor,
              }}
            >
              {soldCount}{" "}
              {soldCount > 1
                ? t("dashboard.topPerformers.sales")
                : t("dashboard.topPerformers.sale")}
            </Text>
          </View>

          {/* Stats */}
          <View style={{ alignItems: "flex-end", gap: 4, zIndex: 1 }}>
            <Text
              selectable
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: textColor,
                fontVariant: ["tabular-nums"],
              }}
            >
              {i18nFormatCurrency(revenue, currency, locale)}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 20,
                borderCurve: "continuous",
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
                  fontSize: 11,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                  color: isProfitable
                    ? Palette.semantic.success
                    : Palette.semantic.danger,
                }}
              >
                {isProfitable ? "+" : ""}
                {i18nFormatCurrency(profit, currency, locale)}
              </Text>
            </View>
          </View>
        </ObsidianBlock>
      </Animated.View>
    </Pressable>
  );
}

// ─── Vanta Section Header - Reusable Obsidian Section Title ──────────────────
interface VantaSectionHeaderProps {
  tier: string;
  title: string;
}

function VantaSectionHeader({ tier, title }: VantaSectionHeaderProps) {
  const theme = useVantaTheme();
  return (
    <View accessibilityRole="header" accessibilityLabel={title}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: "500",
          letterSpacing: 3,
          textTransform: "uppercase",
          color: theme.textGhost,
          marginBottom: 8,
        }}
      >
        {tier}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          letterSpacing: -0.5,
          color: theme.text,
        }}
      >
        {title}
      </Text>
      {/* Gold accent line */}
      <View
        style={{
          width: 40,
          height: 2,
          backgroundColor: theme.primary,
          marginTop: 10,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 VANTA DASHBOARD - Main Screen
// ═══════════════════════════════════════════════════════════════════════════════

export default function VantaDashboard() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");
  const { t, locale } = useLocale();
  const currency = useSettingsStore((s) => s.currency) as
    | "EUR"
    | "USD"
    | "GBP"
    | "CHF"
    | "JPY";
  const currencySymbol = useCurrencySymbol();

  // Locale-aware formatCurrency for dashboard
  const formatCurrency = useCallback(
    (value: number, compact = false) => {
      if (compact) {
        return formatCurrencyCompact(value, currency, locale);
      }
      return i18nFormatCurrency(value, currency, locale);
    },
    [currency, locale],
  );

  useTrackScreen("dashboard");
  const { isReduceMotionEnabled } = useAccessibility();

  // User info for header
  const user = useAuthStore((s) => s.user);
  const { planDisplayName } = usePlanAccess();

  // Scroll-driven animations (world-class header effect)
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, 80, 160],
      [1, 0.8, 0],
      "clamp",
    );
    const translateY = interpolate(
      scrollOffset.value,
      [0, 160],
      [0, -20],
      "clamp",
    );
    const scale = interpolate(scrollOffset.value, [0, 160], [1, 0.95], "clamp");
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const statusBarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollOffset.value, [0, 60], [1, 0], "clamp");
    return { opacity };
  });

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

    const lotStats: {
      id: number;
      name: string;
      revenue: number;
      profit: number;
      soldCount: number;
    }[] = [];

    // Pre-group sales by lotId for O(1) lookup instead of O(n) filter per lot
    const salesByLotId = new Map<number, typeof sales>();
    const allSalesByLotId = new Map<number, typeof allSales>();
    for (const s of sales) {
      const arr = salesByLotId.get(s.lotId) ?? [];
      arr.push(s);
      salesByLotId.set(s.lotId, arr);
    }
    for (const s of allSales) {
      const arr = allSalesByLotId.get(s.lotId) ?? [];
      arr.push(s);
      allSalesByLotId.set(s.lotId, arr);
    }

    for (const lot of lots) {
      const lotSales = salesByLotId.get(lot.id) ?? [];
      const allLotSales = allSalesByLotId.get(lot.id) ?? [];
      const summary = computeLotSummary(lot, [], allLotSales);

      totalInvest += summary.totalInvestment;
      totalStock += summary.remainingQuantity;
      if (summary.remainingQuantity > 0) activeLots++;

      const avgCost =
        lot.totalCost && lot.initialQuantity
          ? Number(lot.totalCost) / lot.initialQuantity
          : 0;

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
      salesCount: sales.length,
      activeLots,
      topLots,
    };
  }, [lots, sales, allSales]);

  // ─── Chart Data ─────────────────────────────────────────────────────
  const { hasFeature } = usePlanAccess();
  const showCharts = hasFeature("analytics");

  const chartLineData = useMemo(() => {
    if (!showCharts) return [];
    const option = PERIOD_OPTIONS.find((p) => p.key === selectedPeriod);
    return groupSalesByDate(allSales, option?.days ?? null);
  }, [allSales, selectedPeriod, showCharts]);

  const chartBarData = useMemo(() => {
    if (!showCharts) return [];
    return groupSalesByMonth(allSales, 6);
  }, [allSales, showCharts]);

  const chartPlatformData = useMemo(() => {
    if (!showCharts) return [];
    return groupSalesByPlatform(sales);
  }, [sales, showCharts]);

  // ─── Gamification ──────────────────────────────────────────────────
  const checkAchievements = useGamificationStore((s) => s.checkAchievements);
  const setTotalSalesCount = useGamificationStore((s) => s.setTotalSalesCount);

  useEffect(() => {
    if (lotsQuery.isLoading || salesQuery.isLoading) return;

    setTotalSalesCount(allSales.length);

    // Compute achievement check data
    const platforms = [...new Set(allSales.map((s) => s.platform).filter(Boolean))];
    const maxSaleAmount = allSales.reduce(
      (max, s) => Math.max(max, parseFloat(String(s.priceNet)) || 0),
      0,
    );

    // Check for cleared lots (all items sold)
    const hasClearedLot = lots.some((lot) => {
      if (!lot.initialQuantity || lot.initialQuantity === 0) return false;
      const lotSaleCount = allSales.filter((s) => s.lotId === lot.id).length;
      return lotSaleCount >= lot.initialQuantity;
    });

    checkAchievements({
      totalLots: lots.length,
      totalSales: allSales.length,
      platforms: platforms as string[],
      maxRoi: stats.roi,
      maxSaleAmount,
      hasClearedLot,
    });
  }, [lots, allSales, lotsQuery.isLoading, salesQuery.isLoading]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const refetchLots = lotsQuery.refetch;
  const refetchSales = salesQuery.refetch;

  const handleRefresh = useCallback(() => {
    refetchLots();
    refetchSales();
  }, [refetchLots, refetchSales]);

  const handlePeriodChange = useCallback((period: PeriodFilter) => {
    Haptic.selection();
    setSelectedPeriod(period);
  }, []);

  // ─── Accent Colors from theme ───────────────────────────────────────
  const accentGold = theme.primary;
  const accentGoldGlow = theme.primaryGlow;

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  // Haptic feedback when pull-to-refresh completes + review prompt
  const wasRefreshing = useRef(false);
  useEffect(() => {
    if (wasRefreshing.current && !refreshing) {
      Haptic.success();
      // Check for in-app review prompt after successful refresh
      (async () => {
        const salesCount = allSales.length;
        if (await shouldPromptReview(salesCount)) {
          analytics.track("review_prompted");
          await requestReview();
          await recordMilestone(salesCount);
        }
      })();
    }
    wasRefreshing.current = refreshing;
  }, [refreshing]);

  if (loading) {
    return (
      <VantaScreen>
        <Animated.ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingTop: insets.top + Spacing.sm,
            paddingBottom: insets.bottom + 120,
            gap: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonDashboard />
        </Animated.ScrollView>
      </VantaScreen>
    );
  }

  return (
    <VantaScreen>
      {/* ═══ TRIAL BANNER ═══ */}
      <TrialBanner />
      <Animated.ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
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
        <CurvedItem
          scrollY={scrollOffset}
          entering={
            isReduceMotionEnabled ? undefined : FadeInDown.duration(400)
          }
        >
          <Animated.View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: Spacing.lg,
                paddingBottom: Spacing.sm,
              },
              statusBarAnimatedStyle,
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AppIcon
                name="grid-view"
                size={14}
                color={theme.primary}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: theme.textGhost,
                }}
              >
                OPTIMUS VINTAGE — {planDisplayName.toUpperCase()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <StatusPulse />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "500",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: theme.textGhost,
                }}
              >
                {t("dashboard.status.connected")}
              </Text>
            </View>
          </Animated.View>
        </CurvedItem>

        {/* ═══ HEADER ═══ */}
        <Animated.View
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInDown.delay(50).duration(400)
          }
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: Spacing.lg,
            },
            headerAnimatedStyle,
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.md,
              flex: 1,
            }}
          >
            {/* Avatar - Matching template */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.primary,
                borderCurve: "continuous",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: theme.textOnAccent,
                }}
              >
                OV
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  color: theme.text,
                }}
              >
                {t("dashboard.welcome", "Bienvenue")}
                {user?.displayName ? ` ${user.displayName}` : ""}
              </Text>
              <View
                style={{ flexDirection: "row", gap: Spacing.sm, marginTop: 6 }}
              >
                <View style={{ flex: 1 }}>
                  <QuotaIndicator
                    resource="lots"
                    current={lots.length}
                    compact
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <QuotaIndicator
                    resource="items"
                    current={stats.stockCount}
                    compact
                  />
                </View>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <StreakCounter />
            <TierBadge />
            <VantaSlabButton
              icon="settings"
              onPress={() => router.push("/(tabs)/settings")}
              accessibilityLabel={t("accessibility.settingsButton")}
            />
          </View>
        </Animated.View>

        {/* ═══ PERIOD SELECTOR ═══ */}
        <CurvedItem
          scrollY={scrollOffset}
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInDown.delay(50).duration(400)
          }
        >
          <VantaPeriodSelector
            options={PERIOD_OPTIONS}
            selectedKey={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </CurvedItem>

        {/* ═══ HERO SINGULARITY ═══ */}
        <CurvedItem
          scrollY={scrollOffset}
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInUp.delay(100).duration(500)
          }
        >
          <VantaSingularity
            revenue={stats.revenue}
            profit={stats.profit}
            investment={stats.investment}
            roi={stats.roi}
            onDetailPress={() => router.push("/(tabs)/sales")}
          />
        </CurvedItem>

        {/* ═══ METRIC ORBS (3 columns) ═══ */}
        <CurvedItem
          scrollY={scrollOffset}
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInUp.delay(150).duration(500)
          }
          style={{
            flexDirection: "row",
            gap: Spacing.md,
            paddingHorizontal: Spacing.lg,
          }}
        >
          <VantaMetricOrb
            icon="inventory-2"
            label={t("dashboard.metrics.inStock")}
            value={formatNumber(stats.stockCount, locale)}
            accentColor={accentGold}
            accentGlow={accentGoldGlow}
            onPress={() => router.push("/(tabs)/stock")}
          />
          <VantaMetricOrb
            icon="receipt"
            label={t("dashboard.metrics.sales")}
            value={formatNumber(stats.salesCount, locale)}
            accentColor={Palette.semantic.info}
            accentGlow={`${Palette.semantic.info}50`}
            onPress={() => router.push("/(tabs)/sales")}
          />
          <VantaMetricOrb
            icon="folder"
            label={t("dashboard.metrics.activeLots")}
            value={formatNumber(stats.activeLots, locale)}
            accentColor={Palette.semantic.success}
            accentGlow={`${Palette.semantic.success}50`}
            onPress={() => router.push("/(tabs)/lots")}
          />
        </CurvedItem>

        {/* ═══ QUICK ACTIONS ═══ */}
        <Animated.View
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInUp.delay(200).duration(500)
          }
          style={{ paddingHorizontal: Spacing.lg }}
        >
          <View style={{ marginBottom: Spacing.md }}>
            <VantaSectionHeader
              tier={t("dashboard.quickActions.tier")}
              title={t("dashboard.quickActions.title")}
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
              label={t("dashboard.quickActions.newLot")}
              accentColor={Palette.semantic.success}
              accentGlow={`${Palette.semantic.success}40`}
              onPress={() => router.push("/lots/new")}
            />
            <VantaActionSlab
              icon="sell"
              label={t("dashboard.quickActions.sell")}
              accentColor={theme.primary}
              accentGlow={theme.primaryGlow}
              onPress={() => router.push("/sales/new")}
            />
            <VantaActionSlab
              icon="auto-awesome"
              label={t("dashboard.quickActions.aiScanner")}
              accentColor={Palette.sky[400]}
              accentGlow={`${Palette.sky[400]}50`}
              onPress={() => router.push("/scanner")}
            />
          </View>
        </Animated.View>

        {/* ═══ TOP PERFORMERS ═══ */}
        <Animated.View
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInUp.delay(300).duration(500)
          }
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
            <VantaSectionHeader
              tier={t("dashboard.topPerformers.tier")}
              title={t("dashboard.topPerformers.title")}
            />
            {stats.topLots.length > 0 && (
              <Pressable
                onPress={() => router.push("/(tabs)/lots")}
                style={{
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing.xs,
                }}
                accessibilityRole="link"
                accessibilityLabel={t("dashboard.topPerformers.viewAll")}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: theme.primary,
                    textDecorationLine: "underline",
                  }}
                >
                  {t("dashboard.topPerformers.viewAll")}
                </Text>
              </Pressable>
            )}
          </View>

          {stats.topLots.length > 0 ? (
            <Animated.View
              style={{ gap: Spacing.sm }}
              layout={
                isReduceMotionEnabled ? undefined : LinearTransition.springify()
              }
            >
              {stats.topLots.map((lot, index) => (
                <Animated.View
                  key={lot.id}
                  entering={
                    isReduceMotionEnabled
                      ? undefined
                      : FadeInUp.delay(index * 80)
                          .duration(400)
                          .springify()
                  }
                  exiting={
                    isReduceMotionEnabled ? undefined : FadeOut.duration(200)
                  }
                >
                  <VantaTopLotCard
                    rank={index + 1}
                    name={lot.name}
                    revenue={lot.revenue}
                    profit={lot.profit}
                    soldCount={lot.soldCount}
                    onPress={() => router.push(`/lots/${lot.id}`)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            /* Empty State */
            <ObsidianBlock
              variant="premium"
              style={{
                padding: Spacing.xl,
                alignItems: "center",
                justifyContent: "center",
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  borderCurve: "continuous",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: theme.primaryMuted,
                }}
              >
                <AppIcon
                  name="emoji-events"
                  size={28}
                  color={theme.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: theme.textSecondary,
                  textAlign: "center",
                }}
              >
                {t("dashboard.topPerformers.emptyTitle")}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                {t("dashboard.topPerformers.emptySubtitle")}
              </Text>
            </ObsidianBlock>
          )}
        </Animated.View>

        {/* ── WRAPPED CARD — Entry Point ────────────────────────── */}
        {showCharts && (
          <Animated.View
            entering={
              isReduceMotionEnabled
                ? undefined
                : FadeInUp.delay(300).duration(500)
            }
            style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}
          >
            <Pressable onPress={() => router.push("/wrapped")}>
              <ObsidianBlock variant="premium" style={{ padding: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryMuted, alignItems: "center", justifyContent: "center" }}>
                  <AppIcon name="auto-awesome" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
                    {t("dashboard.wrappedCard.title")}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                    {t("dashboard.wrappedCard.subtitle", { month: new Date().toLocaleString("default", { month: "long" }) })}
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={18} color={theme.textMuted} />
              </ObsidianBlock>
            </Pressable>
          </Animated.View>
        )}

        {/* ── TIER 4 // ANALYTICS CHARTS ─────────────────────────── */}
        {showCharts && (
          <Animated.View
            entering={
              isReduceMotionEnabled
                ? undefined
                : FadeInUp.delay(350).duration(500)
            }
            style={{ paddingHorizontal: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing["2xl"] }}
          >
            <VantaLineChart data={chartLineData} />
            <VantaBarChart data={chartBarData} />
            <VantaPieChart data={chartPlatformData} />
          </Animated.View>
        )}
      </Animated.ScrollView>
    </VantaScreen>
  );
}
