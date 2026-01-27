/**
 * 📦 LOT DETAIL SCREEN - Ultra Premium Edition
 * Enterprise-grade lot management with real-time insights
 */

import {
    AnimatedButton,
    AnimatedSkeleton,
} from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import {
    AnimatedPremiumBackground,
    Button,
    Card,
} from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
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

// Segment options for items view
type SegmentOption = "top" | "losses" | "all";

// Extended item type with sale info
interface ItemWithSale extends Item {
  sale?: Sale;
  profit?: number;
}

/**
 * 🎨 Animated Segment Control - Premium Selection
 */
function AnimatedSegmentControl({
  options,
  activeKey,
  onSelect,
  theme,
}: {
  options: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
  theme: typeof Theme.dark;
}) {
  return (
    <View
      style={[styles.segmentedControl, { backgroundColor: theme.surfaceCard }]}
    >
      {options.map((seg, index) => {
        const isActive = activeKey === seg.key;
        return (
          <AnimatedSegmentButton
            key={seg.key}
            label={seg.label}
            isActive={isActive}
            onPress={() => onSelect(seg.key)}
            theme={theme}
            index={index}
          />
        );
      })}
    </View>
  );
}

function AnimatedSegmentButton({
  label,
  isActive,
  onPress,
  theme,
  index,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: typeof Theme.dark;
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
      ["transparent", theme.surface],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.textMuted, theme.primary],
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
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];
  const isDark = colorScheme === "dark";

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
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`;
    return date.toLocaleDateString("fr-FR");
  };

  const getROILabel = (roi: number): { label: string; color: string } => {
    if (roi >= 50) return { label: "Excellent", color: theme.success };
    if (roi >= 25) return { label: "Très bien", color: Palette.forest[500] };
    if (roi >= 0) return { label: "Bien", color: theme.primary };
    if (roi >= -25) return { label: "Faible", color: theme.warning };
    return { label: "Perte", color: theme.danger };
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
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
      </View>
    );
  }

  if (!lot || !summary || !protection) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <View
            style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}
          >
            <AppIcon name="error-outline" size={40} color={theme.danger} />
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text
            style={[
              Typography.heading.md,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            Lot introuvable
          </Text>
        </MotiView>
        <AnimatedButton
          variant="ghost"
          onPress={() => router.back()}
          delay={400}
          style={{ marginTop: Spacing.lg }}
        >
          Retour
        </AnimatedButton>
      </View>
    );
  }

  const roiInfo = getROILabel(summary.roiPercent);
  const recoveryPercent =
    summary.totalInvestment > 0
      ? Math.min(100, (summary.totalRevenue / summary.totalInvestment) * 100)
      : 0;
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ═══ Animated Premium Background ═══ */}
      <AnimatedPremiumBackground variant="light" />

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
          <AppIcon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
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
          <AppIcon name="edit" size={24} color={theme.primary} />
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
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Total investi
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatCurrency(summary.totalInvestment)}
            </Text>
          </Card>

          {/* Total Returned */}
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Total récupéré
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatCurrency(summary.totalRevenue)}
            </Text>
          </Card>

          {/* ROI Full Width */}
          <Card variant="elevated" style={styles.statCardFull}>
            <View style={styles.roiLeft}>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Retour sur investissement
              </Text>
              <Text style={[styles.roiValue, { color: theme.text }]}>
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
              <Text style={[styles.recoveryTitle, { color: theme.text }]}>
                Récupération des revenus
              </Text>
              <Text style={[styles.recoveryProfit, { color: theme.textMuted }]}>
                {formatCurrency(summary.profit)} Bénéfice net
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[styles.progressTrack, { backgroundColor: theme.border }]}
            >
              <Animated.View
                entering={FadeIn.delay(300).duration(600)}
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.min(recoveryPercent, 100)}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
                €0
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color:
                      recoveryPercent >= 100 ? theme.primary : theme.textMuted,
                    fontWeight: "600",
                  },
                ]}
              >
                {recoveryPercent >= 100
                  ? "Seuil de rentabilité atteint"
                  : `${recoveryPercent.toFixed(0)}% récupéré`}
              </Text>
              <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
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
                  backgroundColor: theme.primarySubtle,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <View style={styles.protectionHeader}>
                <View
                  style={[
                    styles.protectionIcon,
                    { backgroundColor: theme.primary + "30" },
                  ]}
                >
                  <AppIcon name="shield" size={24} color={theme.primary} />
                </View>
                <View style={styles.protectionInfo}>
                  <Text style={[styles.protectionTitle, { color: theme.text }]}>
                    Protection prix plancher
                  </Text>
                  <Text
                    style={[styles.protectionDesc, { color: theme.textMuted }]}
                  >
                    Vendez les{" "}
                    <Text style={{ fontWeight: "700", color: theme.text }}>
                      {summary.remainingQuantity} articles restants
                    </Text>{" "}
                    au-dessus de{" "}
                    <Text style={{ fontWeight: "700", color: theme.primary }}>
                      {formatCurrency(protection.floorPriceBreakEven)}
                    </Text>{" "}
                    pour maintenir la rentabilité.
                  </Text>
                </View>
              </View>
              <Button
                variant="primary"
                size="sm"
                onPress={() => {}}
                style={styles.protectionButton}
              >
                Ajuster la stratégie
              </Button>
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
              { key: "top", label: "Meilleures ventes" },
              { key: "losses", label: "Pertes" },
              { key: "all", label: "Tous" },
            ]}
            activeKey={activeSegment}
            onSelect={(key) => setActiveSegment(key as SegmentOption)}
            theme={theme}
          />
        </Animated.View>

        {/* Items List */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.itemsList}
        >
          {filteredItems.length === 0 ? (
            <Card style={styles.emptyState}>
              <AppIcon name="inventory-2" size={40} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Aucun article dans cette catégorie
              </Text>
            </Card>
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
                      backgroundColor: theme.surfaceCard,
                      borderRadius: Radius.xl,
                      borderWidth: 1,
                      borderColor: theme.border,
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
                        { backgroundColor: theme.surfaceCard },
                      ]}
                    >
                      <AppIcon
                        name="checkroom"
                        size={24}
                        color={theme.textMuted}
                      />
                    </View>
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === "SOLD"
                              ? theme.success
                              : item.status === "ONLINE"
                                ? theme.warning
                                : theme.textMuted,
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {item.status === "SOLD"
                          ? "VENDU"
                          : item.status === "ONLINE"
                            ? "EN LIGNE"
                            : "STOCK"}
                      </Text>
                    </View>
                  </View>

                  {/* Item Info */}
                  <View style={styles.itemInfo}>
                    <View>
                      <Text
                        style={[styles.itemTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {item.brand || "Inconnu"} - {item.type || "Article"}
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { color: theme.textMuted },
                        ]}
                      >
                        {item.sale
                          ? `Vendu sur ${item.sale.platform || "Vinted"} • ${formatDate(item.sale.saleDate)}`
                          : item.status === "ONLINE"
                            ? "En vente"
                            : "En stock"}
                      </Text>
                    </View>

                    <View style={styles.itemPricing}>
                      <View>
                        <Text
                          style={[
                            styles.profitLabel,
                            { color: theme.textMuted },
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
                                  ? theme.success
                                  : theme.danger,
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
                          style={[styles.salePrice, { color: theme.textMuted }]}
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
            <Text style={[styles.moreItems, { color: theme.textMuted }]}>
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
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <AppIcon name="add" size={28} color="#FFF" />
        </Pressable>
      </View>
    </View>
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

  // Recovery Card - Premium Glassmorphic
  recoveryCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
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
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.1)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
    borderCurve: "continuous",
    boxShadow:
      "0 1px 3px rgba(16,185,129,0.4), 0 2px 6px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
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
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
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
  protectionButton: {
    marginTop: Spacing.xs,
  },

  // Segmented Control - Premium Glassmorphic
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 2px rgba(0,0,0,0.08)",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },
  segmentButtonActive: {
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  segmentText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
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
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.5)",
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
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.04)",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)",
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
