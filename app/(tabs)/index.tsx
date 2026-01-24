/**
 * 💎 DASHBOARD - Premium Analytics Edition
 * Inspired by modern analytics dashboards (Linear, Stripe, Vercel)
 *
 * Key Metrics for Vintage Resellers:
 * - Total Revenue (main hero number)
 * - Profit/Loss with trend
 * - Stock value & count
 * - Sales velocity
 * - Top performing lots
 * - ROI breakdown
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { PremiumScreen, usePremiumTheme } from "@/components/ui/PremiumUI";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { LotsRepository, SalesRepository } from "@/db/repositories";
import { computeLotSummary } from "@/utils/engine/calculations";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

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
  { key: "all", label: "Tout", shortLabel: "Tout", days: null },
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
  return `${prefix}${absValue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Period Chip Component
interface PeriodChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function PeriodChip({ label, selected, onPress }: PeriodChipProps) {
  const theme = usePremiumTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.periodChip,
        {
          backgroundColor: selected ? theme.primary : "transparent",
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <Text
        style={[
          Typography.label.sm,
          {
            color: selected ? "#FFFFFF" : theme.textSecondary,
            fontWeight: selected ? "700" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Metric Card Component (3-column layout like reference)
interface MetricCardProps {
  icon: AppIconName;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  onPress?: () => void;
}

function MetricCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
}: MetricCardProps) {
  const theme = usePremiumTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.metricCard,
        { backgroundColor: theme.surfaceCard, borderColor: theme.borderCard },
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <AppIcon name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.metricContent}>
        <Text style={[Typography.number.lg, { color: theme.text }]}>
          {value}
        </Text>
        <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// Stat Row Item (for breakdown sections)
interface StatRowProps {
  icon: AppIconName;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  trend?: { value: string; positive: boolean };
}

function StatRow({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  trend,
}: StatRowProps) {
  const theme = usePremiumTheme();

  return (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        <View
          style={[styles.statRowIcon, { backgroundColor: `${iconColor}15` }]}
        >
          <AppIcon name={icon} size={14} color={iconColor} />
        </View>
        <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.statRowRight}>
        <Text
          style={[Typography.number.md, { color: valueColor || theme.text }]}
        >
          {value}
        </Text>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.positive
                  ? theme.successSubtle
                  : theme.dangerSubtle,
              },
            ]}
          >
            <AppIcon
              name={trend.positive ? "trending-up" : "trending-down"}
              size={10}
              color={trend.positive ? theme.success : theme.danger}
            />
            <Text
              style={[
                Typography.label.xs,
                { color: trend.positive ? theme.success : theme.danger },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Quick Action Button
interface QuickActionBtnProps {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  accentColor?: string;
  accentBg?: string;
}

function QuickActionBtn({
  icon,
  label,
  onPress,
  variant = "secondary",
  accentColor,
  accentBg,
}: QuickActionBtnProps) {
  const theme = usePremiumTheme();
  const isPrimary = variant === "primary";

  // Use custom accent color or fallback to theme
  const iconColor = accentColor || theme.primary;
  const iconBgColor = accentBg || theme.primarySubtle;

  return (
    <Pressable
      onPress={() => {
        Haptic.impactMedium();
        onPress();
      }}
      style={[
        styles.quickActionBtn,
        {
          backgroundColor: isPrimary ? iconColor : theme.surfaceCard,
          borderColor: isPrimary ? iconColor : theme.borderCard,
        },
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: isPrimary ? "rgba(255,255,255,0.2)" : iconBgColor,
          },
        ]}
      >
        <AppIcon
          name={icon}
          size={18}
          color={isPrimary ? "#FFFFFF" : iconColor}
        />
      </View>
      <Text
        style={[
          Typography.label.sm,
          { color: isPrimary ? "#FFFFFF" : theme.text, marginTop: Spacing.xs },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Donut Chart Component (visual breakdown)
interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

// Semi-Circular Donut Chart avec SVG - Style référence
function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const theme = usePremiumTheme();

  // Configuration du semi-donut
  const SIZE = 140;
  const STROKE_WIDTH = 20;
  const RADIUS = (SIZE - STROKE_WIDTH) / 2;
  const CENTER = SIZE / 2;

  // Calculer le total pour les proportions
  const total = segments.reduce((sum, s) => sum + Math.abs(s.value), 0);

  // Calculer les arcs pour un demi-cercle (180°)
  // On commence à 180° (gauche) et on va vers 0° (droite)
  let currentAngle = 180; // Commence à gauche

  const arcs = segments.map((segment) => {
    const percentage = total > 0 ? Math.abs(segment.value) / total : 0;
    const sweepAngle = percentage * 180; // Sur 180° seulement
    const startAngle = currentAngle;
    currentAngle -= sweepAngle; // On va dans le sens anti-horaire

    return {
      ...segment,
      startAngle,
      endAngle: currentAngle,
      sweepAngle,
    };
  });

  // Fonction pour créer un arc SVG
  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  return (
    <View style={styles.donutContainer}>
      {/* Semi-Donut SVG */}
      <View
        style={[styles.donutVisual, { width: SIZE, height: SIZE / 2 + 30 }]}
      >
        <View
          style={{ width: SIZE, height: SIZE / 2 + 10, overflow: "hidden" }}
        >
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Background arc (gris) */}
            <Path
              d={describeArc(CENTER, CENTER, RADIUS, 180, 0)}
              stroke={theme.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />

            {/* Segments colorés */}
            {arcs.map((arc, index) => {
              if (arc.sweepAngle < 0.5) return null; // Skip très petits segments
              return (
                <Path
                  key={index}
                  d={describeArc(
                    CENTER,
                    CENTER,
                    RADIUS,
                    arc.startAngle,
                    arc.endAngle,
                  )}
                  stroke={arc.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        </View>

        {/* Centre avec valeur - positionné au milieu du demi-cercle */}
        <View
          style={[
            styles.donutCenter,
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: "center",
            },
          ]}
        >
          <Text
            style={[
              Typography.display.lg,
              {
                color: theme.text,
                fontSize: 28,
                fontWeight: "800",
                letterSpacing: -0.5,
              },
            ]}
          >
            {centerValue}
          </Text>
          <Text
            style={[
              Typography.label.sm,
              { color: theme.textMuted, marginTop: 2 },
            ]}
          >
            {centerLabel}
          </Text>
        </View>
      </View>

      {/* Legend à droite */}
      <View style={styles.donutLegend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: segment.color }]}
            />
            <View style={styles.legendText}>
              <Text style={[Typography.body.sm, { color: theme.text }]}>
                {segment.label}
              </Text>
              <Text
                style={[
                  Typography.number.md,
                  { color: segment.color, fontWeight: "600" },
                ]}
              >
                {formatCurrency(segment.value)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Top Lot Card
interface TopLotProps {
  rank: number;
  name: string;
  revenue: number;
  profit: number;
  soldCount: number;
  onPress: () => void;
}

function TopLotCard({
  rank,
  name,
  revenue,
  profit,
  soldCount,
  onPress,
}: TopLotProps) {
  const theme = usePremiumTheme();
  const isProfitable = profit >= 0;

  // 🏆 Rank colors: Gold, Silver, Bronze
  const getRankColors = (r: number) => {
    switch (r) {
      case 1:
        return { bg: Palette.gold[500], text: "#FFFFFF" };
      case 2:
        return { bg: Palette.neutral[400], text: "#FFFFFF" };
      case 3:
        return { bg: Palette.amber[600], text: "#FFFFFF" };
      default:
        return { bg: theme.surfaceHighlight, text: theme.textSecondary };
    }
  };
  const rankColors = getRankColors(rank);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.topLotCard,
        { backgroundColor: theme.surfaceCard, borderColor: theme.borderCard },
      ]}
    >
      <View
        style={[
          styles.rankBadge,
          {
            backgroundColor: rankColors.bg,
          },
        ]}
      >
        <Text
          style={[
            Typography.label.sm,
            { color: rankColors.text, fontWeight: "700" },
          ]}
        >
          #{rank}
        </Text>
      </View>
      <View style={styles.topLotInfo}>
        <Text
          style={[Typography.body.md, { color: theme.text, fontWeight: "600" }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
          {soldCount} ventes
        </Text>
      </View>
      <View style={styles.topLotStats}>
        <Text style={[Typography.number.md, { color: theme.text }]}>
          {formatCurrency(revenue)}
        </Text>
        <Text
          style={[
            Typography.label.xs,
            { color: isProfitable ? Palette.emerald[500] : Palette.rose[500] },
          ]}
        >
          {isProfitable ? "+" : ""}
          {formatCurrency(profit)}
        </Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = usePremiumTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

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

      // Calculate stock value (remaining items × average cost)
      const avgCost =
        lot.totalCost && lot.initialQuantity
          ? Number(lot.totalCost) / lot.initialQuantity
          : 0;
      stockValue += summary.remainingQuantity * avgCost;

      // Period-specific revenue
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

    // Top performing lots (by revenue)
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  // Show skeleton while loading
  if (loading) {
    return (
      <PremiumScreen>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.sm,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonDashboard />
        </ScrollView>
      </PremiumScreen>
    );
  }

  return (
    <PremiumScreen>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.sm,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <View
              style={[styles.avatarCircle, { backgroundColor: theme.primary }]}
            >
              <Text style={[Typography.heading.md, { color: "#FFFFFF" }]}>
                OV
              </Text>
            </View>
            <View>
              <Text style={[Typography.heading.lg, { color: theme.text }]}>
                Optimus Vintage
              </Text>
              <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                {lots.length} lots • {stats.stockCount} articles
              </Text>
            </View>
          </View>
          <Pressable
            style={[
              styles.headerBtn,
              {
                backgroundColor: theme.surfaceCard,
                borderColor: theme.borderCard,
              },
            ]}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <AppIcon name="settings" size={20} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* ═══ PERIOD FILTER ═══ */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.periodSection}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScroll}
          >
            {PERIOD_OPTIONS.map((option) => (
              <PeriodChip
                key={option.key}
                label={option.shortLabel}
                selected={selectedPeriod === option.key}
                onPress={() => handlePeriodChange(option.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ═══ HERO REVENUE CARD ═══ */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.section}
        >
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.surfaceCard,
                borderColor: theme.borderCard,
              },
            ]}
          >
            <View style={styles.heroHeader}>
              <Text style={[Typography.label.sm, { color: theme.textMuted }]}>
                CHIFFRE D'AFFAIRES
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/sales")}
                style={[
                  styles.detailsBtn,
                  { backgroundColor: theme.surfaceHighlight },
                ]}
              >
                <Text
                  style={[Typography.label.xs, { color: theme.textSecondary }]}
                >
                  Détails
                </Text>
                <AppIcon
                  name="chevron-right"
                  size={14}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.heroValue}>
              <Text style={[styles.heroNumber, { color: theme.text }]}>
                {formatNumber(stats.revenue)}
                <Text
                  style={[Typography.heading.lg, { color: theme.textMuted }]}
                >
                  €
                </Text>
              </Text>
            </View>

            {/* Mini stats under hero */}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <View
                  style={[
                    styles.heroStatDot,
                    { backgroundColor: Palette.emerald[500] },
                  ]}
                />
                <Text
                  style={[Typography.body.sm, { color: theme.textSecondary }]}
                >
                  Profit
                </Text>
                <Text
                  style={[
                    Typography.number.sm,
                    {
                      color:
                        stats.profit >= 0
                          ? Palette.emerald[500]
                          : Palette.rose[500],
                    },
                  ]}
                >
                  {stats.profit >= 0 ? "+" : ""}
                  {formatCurrency(stats.profit)}
                </Text>
              </View>
              <View
                style={[
                  styles.heroStatDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <View style={styles.heroStat}>
                <View
                  style={[
                    styles.heroStatDot,
                    { backgroundColor: Palette.sky[500] },
                  ]}
                />
                <Text
                  style={[Typography.body.sm, { color: theme.textSecondary }]}
                >
                  Ventes
                </Text>
                <Text
                  style={[Typography.number.sm, { color: Palette.sky[400] }]}
                >
                  {stats.salesCount}
                </Text>
              </View>
              <View
                style={[
                  styles.heroStatDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <View style={styles.heroStat}>
                <View
                  style={[
                    styles.heroStatDot,
                    { backgroundColor: Palette.gold[500] },
                  ]}
                />
                <Text
                  style={[Typography.body.sm, { color: theme.textSecondary }]}
                >
                  ROI
                </Text>
                <Text
                  style={[
                    Typography.number.sm,
                    {
                      color:
                        stats.roi >= 0 ? Palette.gold[400] : Palette.rose[500],
                    },
                  ]}
                >
                  {formatPercent(stats.roi)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ═══ METRIC CARDS (3 columns) ═══ */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500)}
          style={styles.metricsRow}
        >
          <MetricCard
            icon="inventory-2"
            iconColor={Palette.violet[500]}
            iconBg={Palette.violet[100]}
            label="En stock"
            value={formatNumber(stats.stockCount)}
            onPress={() => router.push("/(tabs)/stock")}
          />
          <MetricCard
            icon="account-balance-wallet"
            iconColor={Palette.teal[500]}
            iconBg={Palette.teal[100]}
            label="Val. stock"
            value={formatCurrency(stats.stockValue, true)}
          />
          <MetricCard
            icon="folder"
            iconColor={Palette.indigo[500]}
            iconBg={Palette.indigo[100]}
            label="Lots actifs"
            value={formatNumber(stats.activeLots)}
            onPress={() => router.push("/(tabs)/lots")}
          />
        </Animated.View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.section}
        >
          <Text
            style={[
              Typography.heading.sm,
              { color: theme.text, marginBottom: Spacing.md },
            ]}
          >
            Actions rapides
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionBtn
              icon="add"
              label="Nouveau lot"
              onPress={() => router.push("/lots/new")}
              variant="primary"
              accentColor={Palette.emerald[500]}
              accentBg={Palette.emerald[100]}
            />
            <QuickActionBtn
              icon="sell"
              label="Vendre"
              onPress={() => router.push("/sales/new")}
              accentColor={Palette.gold[500]}
              accentBg={Palette.gold[100]}
            />
            <QuickActionBtn
              icon="inventory-2"
              label="Stock"
              onPress={() => router.push("/(tabs)/stock")}
              accentColor={Palette.sky[500]}
              accentBg={Palette.sky[100]}
            />
            <QuickActionBtn
              icon="analytics"
              label="Lots"
              onPress={() => router.push("/(tabs)/lots")}
              accentColor={Palette.fuchsia[500]}
              accentBg={Palette.fuchsia[100]}
            />
          </View>
        </Animated.View>

        {/* ═══ TOP PERFORMERS ═══ */}
        {stats.topLots.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.heading.sm, { color: theme.text }]}>
                Top Performers
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/lots")}>
                <Text style={[Typography.label.sm, { color: theme.primary }]}>
                  Voir tout
                </Text>
              </Pressable>
            </View>
            <View style={styles.topLotsContainer}>
              {stats.topLots.map((lot, index) => (
                <TopLotCard
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

        {/* ═══ KEY METRICS BREAKDOWN ═══ */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
          style={styles.section}
        >
          <Text
            style={[
              Typography.heading.sm,
              { color: theme.text, marginBottom: Spacing.md },
            ]}
          >
            Détails
          </Text>
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: theme.surfaceCard,
                borderColor: theme.borderCard,
              },
            ]}
          >
            <StatRow
              icon="trending-up"
              iconColor={Palette.emerald[500]}
              label="Revenu total"
              value={formatCurrency(stats.revenue)}
              valueColor={Palette.emerald[500]}
            />
            <StatRow
              icon="trending-down"
              iconColor={Palette.violet[500]}
              label="Investissement"
              value={formatCurrency(stats.investment)}
              valueColor={Palette.violet[500]}
            />
            <StatRow
              icon="account-balance-wallet"
              iconColor={
                stats.profit >= 0 ? Palette.teal[500] : Palette.rose[500]
              }
              label="Profit net"
              value={formatCurrency(stats.profit)}
              valueColor={
                stats.profit >= 0 ? Palette.teal[500] : Palette.rose[500]
              }
              trend={{
                value: formatPercent(stats.roi),
                positive: stats.roi >= 0,
              }}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <StatRow
              icon="receipt"
              iconColor={Palette.sky[500]}
              label="Ventes effectuées"
              value={String(stats.salesCount)}
            />
            <StatRow
              icon="sell"
              iconColor={Palette.gold[500]}
              label="Prix moyen de vente"
              value={formatCurrency(stats.avgSaleValue)}
            />
            <StatRow
              icon="inventory"
              iconColor={Palette.indigo[500]}
              label="Valeur du stock"
              value={formatCurrency(stats.stockValue)}
              valueColor={Palette.indigo[500]}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </PremiumScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  // Period Filter
  periodSection: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  periodScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  periodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  // Hero Card - Glassmorphic 3D effect
  heroCard: {
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    padding: Spacing.xl,
    // Multi-layer 3D shadow
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(0, 0, 0, 0.04),
      0 16px 32px rgba(16, 185, 129, 0.08)
    `,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 2,
  },
  heroValue: {
    marginBottom: Spacing.lg,
  },
  heroNumber: {
    fontSize: 48,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
    // Glassmorphic 3D effect
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(16, 185, 129, 0.06)
    `,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  metricContent: {
    alignItems: "center",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    // Glassmorphic 3D effect
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(16, 185, 129, 0.05)
    `,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },

  // Breakdown Card - Glassmorphic
  breakdownCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(16, 185, 129, 0.06)
    `,
  },

  // Donut Chart
  donutContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  donutVisual: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutRing: {
    justifyContent: "center",
    alignItems: "center",
  },
  donutInner: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  donutSegmentIndicator: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
  },
  donutLegend: {
    flex: 1,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Top Lots
  topLotsContainer: {
    gap: Spacing.sm,
  },
  topLotCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    // Glassmorphic 3D effect
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03)
    `,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  topLotInfo: {
    flex: 1,
  },
  topLotStats: {
    alignItems: "flex-end",
  },

  // Details Card - Glassmorphic 3D
  detailsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(16, 185, 129, 0.06)
    `,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statRowIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  statRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
});
