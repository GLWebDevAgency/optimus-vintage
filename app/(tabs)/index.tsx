/**
 * 💎 DASHBOARD - Neumorphic Light/Dark Edition
 *
 * Design fidèle 100% au mockup de référence
 * Style: Soft UI, Neumorphic, Glow accents
 * Primary: #00D084 (Mint Green)
 * Thème dynamique Light/Dark via useNeuColors()
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    NeuCard,
    NeuIndicatorDot,
    NeuMetricCard,
    NeuPeriodChip,
    NeuQuickAction,
    NeuScreen,
    NeuTopLotCard,
    useNeuColors,
} from "@/components/ui/Neumorphic";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { LotsRepository, SalesRepository } from "@/db/repositories";
import { computeLotSummary } from "@/utils/engine/calculations";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  { key: "all", label: "Tout", shortLabel: "TOUT", days: null },
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
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString("fr-FR");
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 DASHBOARD SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

  // 🎨 Thème dynamique Light/Dark
  const { palette, shadows, spacing, radius, typography } = useNeuColors();

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

  if (loading) {
    return (
      <NeuScreen>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonDashboard />
        </ScrollView>
      </NeuScreen>
    );
  }

  return (
    <NeuScreen>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screen,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: palette.primary.main,
                justifyContent: "center",
                alignItems: "center",
                ...(Platform.OS === "web" &&
                  ({ boxShadow: shadows.flat.cssSm } as any)),
                ...(Platform.OS === "ios" && shadows.flat.iosSm),
              }}
            >
              <Text
                style={{ ...typography.heading.md, color: palette.text.white }}
              >
                OV
              </Text>
            </View>
            <View>
              <Text
                style={{
                  ...typography.heading.xl,
                  color: palette.text.primary,
                }}
              >
                Optimus Vintage
              </Text>
              <Text
                style={{ ...typography.body.xs, color: palette.text.muted }}
              >
                {lots.length} lots • {stats.stockCount} articles
              </Text>
            </View>
          </View>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              backgroundColor: palette.background.main,
              justifyContent: "center",
              alignItems: "center",
              ...(Platform.OS === "web" &&
                ({ boxShadow: shadows.flat.cssSm } as any)),
              ...(Platform.OS === "ios" && shadows.flat.iosSm),
            }}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <AppIcon name="settings" size={20} color={palette.text.muted} />
          </Pressable>
        </Animated.View>

        {/* ═══ PERIOD FILTER ═══ */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={{
            marginBottom: spacing.lg,
            marginHorizontal: -spacing.screen,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.screen,
              gap: spacing.md,
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <NeuPeriodChip
                key={option.key}
                label={option.shortLabel}
                selected={selectedPeriod === option.key}
                onPress={() => handlePeriodChange(option.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ═══ HERO REVENUE CARD (Gradient) ═══ */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={{ marginBottom: spacing.lg }}
        >
          <LinearGradient
            colors={[
              palette.background.gradient.start,
              palette.background.gradient.end,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius["2xl"],
              padding: spacing.xl,
              overflow: "hidden",
              ...(Platform.OS === "web" &&
                ({ boxShadow: shadows.flat.css } as any)),
              ...(Platform.OS === "ios" && shadows.flat.ios),
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  ...typography.label.md,
                  color: palette.text.muted,
                  letterSpacing: 2,
                }}
              >
                CHIFFRE D'AFFAIRES
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/sales")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: palette.background.main,
                  gap: 4,
                  ...(Platform.OS === "web" &&
                    ({ boxShadow: shadows.flat.cssSm } as any)),
                }}
              >
                <Text
                  style={{
                    ...typography.label.xs,
                    color: palette.primary.main,
                  }}
                >
                  DÉTAILS
                </Text>
                <AppIcon
                  name="chevron-right"
                  size={14}
                  color={palette.primary.main}
                />
              </Pressable>
            </View>

            {/* Hero Value */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                marginBottom: spacing.xl,
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "800",
                  color: palette.text.primary,
                  letterSpacing: -1,
                }}
              >
                {formatNumber(stats.revenue)}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "400",
                  color: palette.text.muted,
                  marginLeft: 4,
                }}
              >
                €
              </Text>
            </View>

            {/* Mini Stats (3 columns) */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Profit */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <NeuIndicatorDot
                    color={palette.accent.green}
                    glowColor={palette.accent.greenGlow}
                  />
                  <Text
                    style={{
                      ...typography.label.xs,
                      color: palette.text.muted,
                      textTransform: "none",
                      fontWeight: "600",
                    }}
                  >
                    Profit
                  </Text>
                </View>
                <Text
                  style={{
                    ...typography.number.md,
                    color:
                      stats.profit >= 0
                        ? palette.accent.green
                        : palette.accent.red,
                  }}
                >
                  {stats.profit >= 0 ? "+" : ""}
                  {formatCurrency(stats.profit)}
                </Text>
              </View>

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  height: 40,
                  backgroundColor: palette.divider.main,
                }}
              />

              {/* Ventes */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <NeuIndicatorDot
                    color={palette.accent.blue}
                    glowColor={palette.accent.blueGlow}
                  />
                  <Text
                    style={{
                      ...typography.label.xs,
                      color: palette.text.muted,
                      textTransform: "none",
                      fontWeight: "600",
                    }}
                  >
                    Ventes
                  </Text>
                </View>
                <Text
                  style={{
                    ...typography.number.md,
                    color: palette.accent.blue,
                  }}
                >
                  {stats.salesCount}
                </Text>
              </View>

              {/* Divider */}
              <View
                style={{
                  width: 1,
                  height: 40,
                  backgroundColor: palette.divider.main,
                }}
              />

              {/* ROI */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <NeuIndicatorDot
                    color={palette.accent.yellow}
                    glowColor={palette.accent.yellowGlow}
                  />
                  <Text
                    style={{
                      ...typography.label.xs,
                      color: palette.text.muted,
                      textTransform: "none",
                      fontWeight: "600",
                    }}
                  >
                    ROI
                  </Text>
                </View>
                <Text
                  style={{
                    ...typography.number.md,
                    color:
                      stats.roi >= 0
                        ? palette.accent.yellow
                        : palette.accent.red,
                  }}
                >
                  {formatPercent(stats.roi)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ═══ METRIC CARDS (3 columns) ═══ */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500)}
          style={{
            flexDirection: "row",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <NeuMetricCard
            icon="inventory-2"
            iconColor={palette.accent.indigo}
            value={formatNumber(stats.stockCount)}
            label="En Stock"
            onPress={() => router.push("/(tabs)/stock")}
          />
          <NeuMetricCard
            icon="account-balance-wallet"
            iconColor={palette.accent.teal}
            value={formatCurrency(stats.stockValue, true)}
            label="Val. Stock"
          />
          <NeuMetricCard
            icon="folder"
            iconColor={palette.accent.blue}
            value={formatNumber(stats.activeLots)}
            label="Lots Actifs"
            onPress={() => router.push("/(tabs)/lots")}
          />
        </Animated.View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={{ marginBottom: spacing.lg }}
        >
          <Text
            style={{
              ...typography.heading.sm,
              color: palette.text.primary,
              marginBottom: spacing.md,
            }}
          >
            Actions rapides
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <NeuQuickAction
              icon="add"
              label="Nouveau Lot"
              onPress={() => router.push("/lots/new")}
              variant="primary"
            />
            <NeuQuickAction
              icon="sell"
              label="Vendre"
              onPress={() => router.push("/sales/new")}
              iconColor={palette.accent.amber}
            />
            <NeuQuickAction
              icon="inventory-2"
              label="Stock"
              onPress={() => router.push("/(tabs)/stock")}
              iconColor={palette.accent.sky}
            />
            <NeuQuickAction
              icon="analytics"
              label="Lots"
              onPress={() => router.push("/(tabs)/lots")}
              iconColor={palette.accent.purple}
            />
          </View>
        </Animated.View>

        {/* ═══ TOP PERFORMERS ═══ */}
        {stats.topLots.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={{ marginBottom: spacing.lg }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  ...typography.heading.sm,
                  color: palette.text.primary,
                }}
              >
                Top Performers
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/lots")}>
                <Text
                  style={{
                    ...typography.label.sm,
                    color: palette.primary.main,
                  }}
                >
                  VOIR TOUT
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: spacing.sm }}>
              {stats.topLots.map((lot, index) => (
                <Animated.View
                  key={lot.id}
                  entering={SlideInRight.delay(350 + index * 100).duration(400)}
                >
                  <NeuTopLotCard
                    rank={index + 1}
                    name={lot.name}
                    salesCount={lot.soldCount}
                    revenue={formatCurrency(lot.revenue)}
                    profit={`${lot.profit >= 0 ? "+" : ""}${formatCurrency(lot.profit)}`}
                    profitPositive={lot.profit >= 0}
                    onPress={() => router.push(`/lots/${lot.id}`)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {stats.topLots.length === 0 && lots.length === 0 && (
          <Animated.View
            entering={FadeIn.delay(400).duration(500)}
            style={{ marginBottom: spacing.lg }}
          >
            <NeuCard
              style={{ alignItems: "center" }}
              padding="xl"
              borderRadius="xl"
            >
              <AppIcon
                name="inventory-2"
                size={48}
                color={palette.text.muted}
              />
              <Text
                style={{
                  ...typography.heading.lg,
                  color: palette.text.primary,
                  marginTop: spacing.lg,
                  textAlign: "center",
                }}
              >
                Commencez votre aventure
              </Text>
              <Text
                style={{
                  ...typography.body.md,
                  color: palette.text.muted,
                  marginTop: spacing.xs,
                  textAlign: "center",
                  maxWidth: 280,
                }}
              >
                Créez votre premier lot pour suivre vos articles vintage
              </Text>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  backgroundColor: palette.primary.main,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.xl,
                  borderRadius: radius.xl,
                  marginTop: spacing.xl,
                  ...(Platform.OS === "web" &&
                    ({ boxShadow: shadows.glow.css } as any)),
                  ...(Platform.OS === "ios" && shadows.glow.ios),
                }}
                onPress={() => router.push("/lots/new")}
              >
                <AppIcon name="add" size={18} color={palette.text.white} />
                <Text
                  style={{ ...typography.label.md, color: palette.text.white }}
                >
                  Créer un lot
                </Text>
              </Pressable>
            </NeuCard>
          </Animated.View>
        )}
      </ScrollView>
    </NeuScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 TYPE EXPORT pour NeuColors (utilisé pour la compatibilité)
// ═══════════════════════════════════════════════════════════════════════════════
export type NeuColors = ReturnType<typeof useNeuColors>;
