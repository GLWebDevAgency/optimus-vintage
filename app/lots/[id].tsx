/**
 * 📦 LOT DETAIL SCREEN - Vanta-Aether Edition
 * Enterprise-grade lot management with real-time insights
 *
 * v2.0 - Enhanced with Vanta Monolith components
 */

import {
    AnimatedButton,
    AnimatedSkeleton,
} from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import { Card } from "@/components/ui/Components";
import {
    type VantaTheme,
    useVantaTheme,
    VantaScreen,
} from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import {
    Item,
    ItemsRepository,
    LotsRepository,
    Sale,
    SalesRepository,
} from "@/db/repositories";
import { ReanimatedSpring } from "@/utils/animations-reanimated";
import {
    computeLotSummary,
    computeProtection,
    LotSummary,
    ProtectionAnalysis,
} from "@/utils/engine/calculations";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    interpolateColor,
    LinearTransition,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LotColors = {
  background: string;
  surface: string;
  surfaceCard: string;
  gold: string;
  goldSubtle: string;
  textOnGold: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  warningSubtle: string;
};

function getLotColors(theme: VantaTheme): LotColors {
  return {
    background: theme.background,
    surface: theme.surface,
    surfaceCard: theme.surfaceCard,
    gold: theme.primary,
    goldSubtle: theme.primarySubtle,
    textOnGold: theme.textOnAccent,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    border: theme.borderGlass,
    success: theme.success,
    successSubtle: theme.successSubtle,
    danger: theme.danger,
    dangerSubtle: theme.dangerSubtle,
    warning: theme.warning,
    warningSubtle: theme.warningSubtle,
  };
}

// Segment options for items view
type SegmentOption = "top" | "losses" | "all";

// Extended item type with sale info
interface ItemWithSale extends Item {
  sale?: Sale;
  profit?: number;
}

/**
 * 🎨 Animated Segment Control - Vanta Premium Selection
 * Matching dashboard VantaPeriodSelector design
 */
function AnimatedSegmentControl({
  options,
  activeKey,
  onSelect,
  colors,
  isDark,
}: {
  options: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
  colors: LotColors;
  isDark: boolean;
}) {
  const selectedIndex = options.findIndex((o) => o.key === activeKey);
  const indicatorPosition = useSharedValue(selectedIndex);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const segmentWidth =
    containerWidth > 0 ? (containerWidth - 8) / options.length : 0;

  useEffect(() => {
    indicatorPosition.value = withSpring(selectedIndex, {
      damping: 22,
      stiffness: 180,
      mass: 1.2,
    });
  }, [selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (segmentWidth === 0) return { opacity: 0 };
    return {
      opacity: 1,
      transform: [{ translateX: indicatorPosition.value * segmentWidth }],
      width: segmentWidth,
    };
  }, [segmentWidth]);

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[
        styles.segmentedControl,
        {
          backgroundColor: isDark ? colors.surface : Palette.ivory.sand,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.03)" : `${colors.gold}20`,
        },
      ]}
    >
      {/* Gold Indicator */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 4,
            left: 4,
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
            backgroundColor: isDark ? colors.surfaceCard : Palette.ivory.pearl,
            borderWidth: 1,
            borderColor: colors.gold,
          }}
        />
      </Animated.View>

      {/* Segment Buttons */}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        {options.map((seg) => {
          const isActive = activeKey === seg.key;
          return (
            <Pressable
              key={seg.key}
              onPress={() => {
                Haptic.selection();
                onSelect(seg.key);
              }}
              style={{
                flex: 1,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Manrope_700Bold",
                  fontWeight: "700",
                  letterSpacing: 1,
                  color: isActive
                    ? colors.gold
                    : isDark
                      ? colors.textSecondary
                      : Palette.neutral[500],
                }}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Legacy AnimatedSegmentButton kept for compatibility but no longer used
function AnimatedSegmentButton({
  label,
  isActive,
  onPress,
  colors,
  index,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: LotColors;
  index: number;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, ReanimatedSpring.responsive);
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["transparent", colors.surface],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.textSecondary, colors.gold],
    ),
  }));

  return (
    <MotiPressable
      onPress={() => {
        Haptic.selection();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, ReanimatedSpring.responsive);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, ReanimatedSpring.bouncy);
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.segmentButton, animatedStyle]}>
        <Animated.Text style={[styles.segmentText, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </MotiPressable>
  );
}

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const colors = getLotColors(theme);
  const isDark = theme.dark;
  const { t } = useLocale();

  const [activeSegment, setActiveSegment] = useState<SegmentOption>("all");
  const lotId = id ? parseInt(id, 10) : null;
  const lotQuery = useQuery({
    queryKey: ["lot-detail", lotId],
    enabled: !!lotId,
    queryFn: async () => {
      if (!lotId) {
        return { lot: null, items: [], sales: [] };
      }

      const [lot, items, sales] = await Promise.all([
        LotsRepository.getById(lotId),
        ItemsRepository.getByLotId(lotId),
        SalesRepository.getByLotId(lotId),
      ]);

      return { lot, items, sales };
    },
  });

  const loading = lotQuery.isLoading;
  const lot = lotQuery.data?.lot ?? null;
  const rawItems = lotQuery.data?.items ?? [];
  const rawSales = lotQuery.data?.sales ?? [];

  const items = useMemo<ItemWithSale[]>(() => {
    return rawItems.map((item) => {
      const itemSale = rawSales.find((sale) => sale.itemId === item.id);
      const unitCost = parseFloat(String(item.unitCost)) || 0;
      const saleNet = itemSale ? parseFloat(String(itemSale.priceNet)) || 0 : 0;
      return {
        ...item,
        sale: itemSale,
        profit: itemSale ? saleNet - unitCost : undefined,
      };
    });
  }, [rawItems, rawSales]);

  const summary = useMemo<LotSummary | null>(() => {
    if (!lot) return null;
    return computeLotSummary(lot, rawItems, rawSales);
  }, [lot, rawItems, rawSales]);

  const protection = useMemo<ProtectionAnalysis | null>(() => {
    if (!summary) return null;
    return computeProtection(summary.delta, summary.remainingQuantity, 0);
  }, [summary]);

  const filteredItems = useMemo<ItemWithSale[]>(() => {
    switch (activeSegment) {
      case "top":
        return items
          .filter((item) => item.status === "SOLD" && (item.profit ?? 0) > 0)
          .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));
      case "losses":
        return items
          .filter((item) => item.status === "SOLD" && (item.profit ?? 0) < 0)
          .sort((a, b) => (a.profit ?? 0) - (b.profit ?? 0));
      case "all":
      default:
        return items;
    }
  }, [items, activeSegment]);

  const formatCurrency = (value: number) => `€${Math.abs(value).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return t("common.today");
    if (diffDays === 1) return t("common.yesterday");
    if (diffDays < 7)
      return `${t("common.ago")} ${diffDays}${t("common.daysShort")}`;
    if (diffDays < 30)
      return `${t("common.ago")} ${Math.floor(diffDays / 7)}${t("common.weeksShort")}`;
    return date.toLocaleDateString("fr-FR");
  };

  const getROILabel = (roi: number): { label: string; color: string } => {
    if (roi >= 50)
      return { label: t("lots.roiExcellent"), color: colors.success };
    if (roi >= 25)
      return { label: t("lots.roiVeryGood"), color: Palette.forest[500] };
    if (roi >= 0) return { label: t("lots.roiGood"), color: colors.gold };
    if (roi >= -25) return { label: t("lots.roiLow"), color: colors.warning };
    return { label: t("lots.roiLoss"), color: colors.danger };
  };

  if (loading) {
    return (
      <VantaScreen style={styles.loadingContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={{ padding: Spacing.lg, gap: Spacing.md, width: "100%" }}
        >
          {/* Header skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={120}
            borderRadius={Radius.xl}
            delay={0}
          />

          {/* Stats row skeleton */}
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <AnimatedSkeleton
              width="48%"
              height={80}
              borderRadius={Radius.lg}
              delay={100}
            />
            <AnimatedSkeleton
              width="48%"
              height={80}
              borderRadius={Radius.lg}
              delay={150}
            />
          </View>

          {/* ROI card skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={60}
            borderRadius={Radius.lg}
            delay={200}
          />

          {/* Items list skeleton */}
          {[0, 1, 2].map((i) => (
            <AnimatedSkeleton
              key={i}
              width="100%"
              height={80}
              borderRadius={Radius.lg}
              delay={300 + i * 100}
            />
          ))}
        </MotiView>
      </VantaScreen>
    );
  }

  if (!lot || !summary || !protection) {
    return (
      <VantaScreen style={styles.errorContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <View
            style={[styles.errorIcon, { backgroundColor: colors.dangerSubtle }]}
          >
            <AppIcon name="error-outline" size={40} color={colors.danger} />
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 20,
              color: colors.text,
              textAlign: "center",
            }}
          >
            {t("lots.notFound")}
          </Text>
        </MotiView>
        <AnimatedButton
          variant="ghost"
          onPress={() => router.back()}
          delay={400}
          style={{ marginTop: Spacing.lg }}
        >
          {t("common.back")}
        </AnimatedButton>
      </VantaScreen>
    );
  }

  const roiInfo = getROILabel(summary.roiPercent);
  const recoveryPercent =
    summary.totalInvestment > 0
      ? Math.min(100, (summary.totalRevenue / summary.totalInvestment) * 100)
      : 0;
  return (
    <VantaScreen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Pressable
          onPress={() => {
            Haptic.selection();
            router.back();
          }}
          style={styles.headerButton}
          hitSlop={8}
        >
          <AppIcon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          Lot #{lot.id} - {lot.name || lot.provider}
        </Text>
        <Pressable
          style={styles.headerButton}
          hitSlop={8}
          onPress={() => {
            Haptic.selection();
            router.push(`/lots/edit/${lot.id}`);
          }}
        >
          <AppIcon name="edit" size={24} color={colors.gold} />
        </Pressable>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.statsGrid}
        >
          {/* Total Invested */}
          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statLabel,
                { color: isDark ? colors.textSecondary : Palette.neutral[600] },
              ]}
            >
              {t("lots.totalInvested")}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(summary.totalInvestment)}
            </Text>
          </Card>

          {/* Total Returned */}
          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statLabel,
                { color: isDark ? colors.textSecondary : Palette.neutral[600] },
              ]}
            >
              {t("lots.totalRecovered")}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(summary.totalRevenue)}
            </Text>
          </Card>

          {/* ROI Full Width */}
          <Card variant="elevated" style={styles.statCardFull}>
            <View style={styles.roiLeft}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: isDark ? colors.textSecondary : Palette.neutral[600],
                  },
                ]}
              >
                {t("lots.returnOnInvestment")}
              </Text>
              <Text style={[styles.roiValue, { color: colors.text }]}>
                {summary.roiPercent >= 0 ? "+" : ""}
                {summary.roiPercent.toFixed(0)}%
              </Text>
            </View>
            <View
              style={[
                styles.roiBadge,
                { backgroundColor: roiInfo.color + "20" },
              ]}
            >
              <AppIcon
                name={summary.roiPercent >= 0 ? "trending-up" : "trending-down"}
                size={16}
                color={roiInfo.color}
              />
              <Text style={[styles.roiBadgeText, { color: roiInfo.color }]}>
                {roiInfo.label}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Revenue Recovery */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.recoveryCard}>
            <View style={styles.recoveryHeader}>
              <Text style={[styles.recoveryTitle, { color: colors.text }]}>
                {t("lots.revenueRecovery")}
              </Text>
              <Text
                style={[
                  styles.recoveryProfit,
                  {
                    color: isDark ? colors.textSecondary : Palette.neutral[600],
                  },
                ]}
              >
                {formatCurrency(summary.profit)} {t("lots.netProfit")}
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <Animated.View
                entering={FadeIn.delay(300).duration(600)}
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.gold,
                    width: `${Math.min(recoveryPercent, 100)}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color: isDark ? colors.textSecondary : Palette.neutral[500],
                  },
                ]}
              >
                €0
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color:
                      recoveryPercent >= 100
                        ? colors.gold
                        : isDark
                          ? colors.textSecondary
                          : Palette.neutral[600],
                    fontWeight: "600",
                  },
                ]}
              >
                {recoveryPercent >= 100
                  ? t("lots.breakEvenReached")
                  : `${recoveryPercent.toFixed(0)}% ${t("lots.recovered")}`}
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color: isDark ? colors.textSecondary : Palette.neutral[500],
                  },
                ]}
              >
                {formatCurrency(summary.totalInvestment)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Floor Price Protection */}
        {summary.remainingQuantity > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View
              style={[
                styles.protectionCard,
                {
                  backgroundColor: isDark
                    ? colors.surface
                    : Palette.ivory.cream,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  // Ajout d'une ombre pour plus de profondeur
                  shadowColor: colors.gold,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              <View style={styles.protectionHeader}>
                <View
                  style={[
                    styles.protectionIcon,
                    { backgroundColor: colors.goldSubtle },
                  ]}
                >
                  <AppIcon name="shield" size={24} color={colors.gold} />
                </View>
                <View style={styles.protectionInfo}>
                  <Text
                    style={[styles.protectionTitle, { color: colors.text }]}
                  >
                    {t("lots.floorPriceProtection")}
                  </Text>
                  <Text
                    style={[
                      styles.protectionDesc,
                      {
                        color: isDark
                          ? colors.textSecondary
                          : Palette.neutral[600],
                        lineHeight: 22,
                      },
                    ]}
                  >
                    Vendez les{" "}
                    <Text style={{ fontWeight: "700", color: colors.text }}>
                      {summary.remainingQuantity} articles restants
                    </Text>{" "}
                    au-dessus de{" "}
                    <Text style={{ fontWeight: "700", color: colors.gold }}>
                      {formatCurrency(protection.floorPriceBreakEven)}
                    </Text>{" "}
                    pour maintenir la rentabilité.
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: colors.gold,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: Radius.lg,
                  alignItems: "center",
                  marginTop: Spacing.sm,
                }}
                accessibilityRole="button"
                accessibilityLabel={t("lots.adjustStrategy")}
              >
                <Text
                  style={{
                    color: colors.textOnGold,
                    fontFamily: "Manrope_700Bold",
                    fontSize: 14,
                  }}
                >
                  {t("lots.adjustStrategy")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Segmented Control */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          layout={LinearTransition.springify()}
        >
          <AnimatedSegmentControl
            options={[
              { key: "top", label: t("lots.topSales") },
              { key: "losses", label: t("lots.losses") },
              { key: "all", label: t("common.all") },
            ]}
            activeKey={activeSegment}
            onSelect={(key) => setActiveSegment(key as SegmentOption)}
            colors={colors}
            isDark={isDark}
          />
        </Animated.View>

        {/* Items List */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.itemsList}
        >
          {filteredItems.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: isDark
                    ? colors.surface
                    : Palette.ivory.cream,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.goldSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: Spacing.md,
                }}
              >
                <AppIcon name="inventory-2" size={32} color={colors.gold} />
              </View>
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: isDark ? colors.textSecondary : Palette.neutral[600],
                    fontSize: 15,
                  },
                ]}
              >
                {t("lots.noItemsInCategory")}
              </Text>
            </View>
          ) : (
            filteredItems.slice(0, 10).map((item, index) => (
              <Animated.View
                key={item.id}
                entering={SlideInRight.delay(index * 50).duration(300)}
              >
                <View
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.surfaceCard,
                      borderRadius: Radius.xl,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity:
                        item.status === "STOCK" || item.status === "ONLINE"
                          ? 0.7
                          : 1,
                    },
                  ]}
                >
                  {/* Image Placeholder */}
                  <View style={styles.itemImageContainer}>
                    <View
                      style={[
                        styles.itemImage,
                        { backgroundColor: colors.surfaceCard },
                      ]}
                    >
                      <AppIcon
                        name="checkroom"
                        size={24}
                        color={
                          isDark ? colors.textSecondary : Palette.neutral[500]
                        }
                      />
                    </View>
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === "SOLD"
                              ? colors.success
                              : item.status === "ONLINE"
                                ? colors.warning
                                : isDark
                                  ? colors.textSecondary
                                  : Palette.neutral[500],
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {item.status === "SOLD"
                          ? t("items.status.sold").toUpperCase()
                          : item.status === "ONLINE"
                            ? t("items.status.online").toUpperCase()
                            : t("items.status.stock").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Item Info */}
                  <View style={styles.itemInfo}>
                    <View>
                      <Text
                        style={[styles.itemTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.brand || t("items.unknownBrand")} -{" "}
                        {item.type || t("items.defaultType")}
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          {
                            color: isDark
                              ? colors.textSecondary
                              : Palette.neutral[600],
                          },
                        ]}
                      >
                        {item.sale
                          ? `${t("items.soldOn")} ${item.sale.platform || "Vinted"} • ${formatDate(item.sale.saleDate)}`
                          : item.status === "ONLINE"
                            ? t("items.onSale")
                            : t("items.inStock")}
                      </Text>
                    </View>

                    <View style={styles.itemPricing}>
                      <View>
                        <Text
                          style={[
                            styles.profitLabel,
                            {
                              color: isDark
                                ? colors.textSecondary
                                : Palette.neutral[600],
                            },
                          ]}
                        >
                          {item.sale ? "BÉNÉFICE NET" : "BÉNÉFICE EST."}
                        </Text>
                        <Text
                          style={[
                            styles.profitValue,
                            {
                              color:
                                (item.profit ?? 0) >= 0
                                  ? colors.success
                                  : colors.danger,
                            },
                          ]}
                        >
                          {item.profit !== undefined
                            ? `${item.profit >= 0 ? "+" : ""}${formatCurrency(item.profit)}`
                            : `~${formatCurrency(10)}`}
                        </Text>
                      </View>
                      {item.sale && (
                        <Text
                          style={[
                            styles.salePrice,
                            {
                              color: isDark
                                ? colors.textSecondary
                                : Palette.neutral[500],
                            },
                          ]}
                        >
                          {formatCurrency(
                            parseFloat(String(item.sale.priceGross)),
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))
          )}

          {filteredItems.length > 10 && (
            <Text
              style={[
                styles.moreItems,
                { color: isDark ? colors.textSecondary : Palette.neutral[600] },
              ]}
            >
              + {filteredItems.length - 10} autres articles
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <View
        style={{ position: "absolute", bottom: insets.bottom + 24, right: 24 }}
      >
        <Pressable
          onPress={() => router.push("/sales/new")}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.gold,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="add" size={28} color={colors.textOnGold} />
        </Pressable>
      </View>
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    marginHorizontal: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.md,
  },
  statCardFull: {
    width: "100%",
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
  },
  roiLeft: {
    flex: 1,
  },
  roiValue: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
  },
  roiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  roiBadgeText: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
  },

  // Recovery Card - Premium
  recoveryCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  recoveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  recoveryTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  recoveryProfit: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    borderCurve: "continuous",
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
    borderCurve: "continuous",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
  },

  // Protection Card
  protectionCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  protectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  protectionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  protectionInfo: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    marginBottom: 4,
  },
  protectionDesc: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    lineHeight: 20,
  },

  // Segmented Control - Premium Vanta Style
  segmentedControl: {
    height: 44,
    borderRadius: 14,
    padding: 4,
    position: "relative",
    borderCurve: "continuous",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },
  segmentButtonActive: {},
  segmentText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1,
  },

  // Items List
  itemsList: {
    gap: Spacing.md,
  },
  emptyState: {
    padding: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  itemCard: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  itemImageContainer: {
    position: "relative",
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: "Manrope_700Bold",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
  },
  itemSubtitle: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    marginTop: 2,
  },
  itemPricing: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  profitLabel: {
    fontSize: 9,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profitValue: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  salePrice: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    textDecorationLine: "line-through",
  },
  moreItems: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    marginTop: Spacing.sm,
  },
});
