/**
 * 📦 LOT DETAIL SCREEN - Ultra Premium Edition
 * Enterprise-grade lot management with real-time insights
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    AnimatedPremiumBackground,
    Button,
    Card,
} from "@/components/ui/Components";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import {
    Item,
    ItemsRepository,
    LotsRepository,
    Sale,
    SalesRepository,
} from "@/db/repositories";
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
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Segment options for items view
type SegmentOption = "top" | "losses" | "all";

// Extended item type with sale info
interface ItemWithSale extends Item {
  sale?: Sale;
  profit?: number;
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
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Skeleton width="100%" height={120} borderRadius={Radius.xl} />
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Skeleton width="48%" height={80} borderRadius={Radius.lg} />
            <Skeleton width="48%" height={80} borderRadius={Radius.lg} />
          </View>
          <Skeleton width="100%" height={60} borderRadius={Radius.lg} />
          <SkeletonList count={3} />
        </View>
      </View>
    );
  }

  if (!lot || !summary || !protection) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}
        >
          <AppIcon name="error-outline" size={40} color={theme.danger} />
        </View>
        <Text style={[Typography.heading.md, { color: theme.text }]}>
          Lot introuvable
        </Text>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.lg }}
        >
          Retour
        </Button>
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
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View
            style={[
              styles.segmentedControl,
              { backgroundColor: theme.surfaceCard },
            ]}
          >
            {[
              { key: "top", label: "Meilleures ventes" },
              { key: "losses", label: "Pertes" },
              { key: "all", label: "Tous" },
            ].map((seg) => (
              <Pressable
                key={seg.key}
                style={[
                  styles.segmentButton,
                  activeSegment === seg.key && [
                    styles.segmentButtonActive,
                    { backgroundColor: theme.surface },
                  ],
                ]}
                onPress={() => {
                  Haptic.selection();
                  setActiveSegment(seg.key as SegmentOption);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        activeSegment === seg.key
                          ? theme.primary
                          : theme.textMuted,
                    },
                  ]}
                >
                  {seg.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Items List */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
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

  // Recovery Card
  recoveryCard: {
    padding: Spacing.lg,
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
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
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
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
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

  // Segmented Control
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  segmentButtonActive: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
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
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  itemImageContainer: {
    position: "relative",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  statusBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
