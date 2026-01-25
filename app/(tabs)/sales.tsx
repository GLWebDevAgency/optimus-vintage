/**
 * 💰 SALES SCREEN - Neumorphic Dark Edition
 *
 * Design fidèle 100% au mockup de référence
 * Style: Soft UI, Dark Neumorphic, Period filters
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    NeuPeriodChip,
    NeuScreen,
    useNeuColors,
} from "@/components/ui/Neumorphic";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Sale, SalesRepository } from "@/db/repositories";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
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

function formatCurrency(value: number): string {
  return `€${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎴 SALE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SaleCardProps {
  sale: Sale;
  index: number;
}

const SaleCard = React.memo(function SaleCard({ sale, index }: SaleCardProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const scale = useSharedValue(1);
  const priceNet = parseFloat(String(sale.priceNet)) || 0;
  const priceGross = parseFloat(String(sale.priceGross)) || 0;
  const fees = priceGross - priceNet;
  const isCompleted = sale.status === "COMPLETED";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptic.selection();
    // Navigate to sale detail or lot
    router.push(`/lots/${sale.lotId}`);
  }, [sale.lotId]);

  return (
    <Animated.View entering={SlideInRight.delay(index * 50).duration(300)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: palette.background.main,
              borderRadius: radius.xl,
              padding: spacing.md,
            },
            Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
          ]}
        >
          {/* Left: Icon + Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isCompleted
                  ? palette.accent.green + "20"
                  : palette.accent.yellow + "20",
              }}
            >
              <AppIcon
                name={isCompleted ? "check-circle" : "schedule"}
                size={20}
                color={
                  isCompleted ? palette.accent.green : palette.accent.yellow
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 14,
                  fontWeight: "700",
                }}
                numberOfLines={1}
              >
                {`Vente #${sale.id}`}
              </Text>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {formatDate(sale.saleDate)} • {sale.platform || "Direct"}
              </Text>
            </View>
          </View>

          {/* Right: Price */}
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: palette.accent.green,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              {formatCurrency(priceNet)}
            </Text>
            {fees > 0 && (
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                -{formatCurrency(fees)} frais
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 SALES SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function SalesScreen() {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

  // ─── Data Query ──────────────────────────────────────────────────────
  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });

  const loading = salesQuery.isLoading;
  const refreshing = salesQuery.isFetching && !loading;
  const allSales = (salesQuery.data ?? []).slice().reverse();

  useFocusEffect(
    useCallback(() => {
      salesQuery.refetch();
    }, []),
  );

  // ─── Filtered Sales ──────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    const option = PERIOD_OPTIONS.find((p) => p.key === selectedPeriod);
    if (!option || option.days === null) return allSales;
    const threshold = getDateThreshold(option.days);
    if (!threshold) return allSales;
    return allSales.filter((s) => new Date(s.saleDate) >= threshold);
  }, [allSales, selectedPeriod]);

  // ─── Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === "COMPLETED");
    const pending = filteredSales.filter((s) => s.status === "PENDING");
    const totalRevenue = completed.reduce(
      (sum, s) => sum + parseFloat(String(s.priceNet)),
      0,
    );
    const totalFees = completed.reduce(
      (sum, s) =>
        sum +
        (parseFloat(String(s.priceGross)) - parseFloat(String(s.priceNet))),
      0,
    );
    const avgValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Compare with previous period
    const option = PERIOD_OPTIONS.find((p) => p.key === selectedPeriod);
    let previousTotal = 0;
    let comparison = 0;

    if (option && option.days !== null) {
      const prevThreshold = getDateThreshold(option.days * 2);
      const currThreshold = getDateThreshold(option.days);
      if (prevThreshold && currThreshold) {
        const previousSales = allSales.filter((s) => {
          const d = new Date(s.saleDate);
          return (
            d >= prevThreshold && d < currThreshold && s.status === "COMPLETED"
          );
        });
        previousTotal = previousSales.reduce(
          (sum, s) => sum + parseFloat(String(s.priceNet)),
          0,
        );
        if (previousTotal > 0) {
          comparison = ((totalRevenue - previousTotal) / previousTotal) * 100;
        } else if (totalRevenue > 0) {
          comparison = 100;
        }
      }
    }

    return {
      salesCount: completed.length,
      pendingCount: pending.length,
      totalRevenue,
      totalFees,
      avgValue,
      comparison,
    };
  }, [filteredSales, allSales, selectedPeriod]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    Haptic.selection();
    salesQuery.refetch();
  }, [salesQuery]);

  const handleAddSale = useCallback(() => {
    Haptic.selection();
    router.push("/sales/new");
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <NeuScreen style={{ paddingTop: insets.top }}>
        <SkeletonList />
      </NeuScreen>
    );
  }

  return (
    <NeuScreen>
      <FlatList
        data={filteredSales}
        keyExtractor={(sale) => String(sale.id)}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary.main}
            colors={[palette.primary.main]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <View>
                <Text
                  style={{
                    color: palette.text.primary,
                    fontSize: 28,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  Mes Ventes
                </Text>
                <Text
                  style={{
                    color: palette.text.muted,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {stats.salesCount} ventes •{" "}
                  {formatCurrency(stats.totalRevenue)}
                </Text>
              </View>

              {/* Add Button */}
              <Pressable
                onPress={handleAddSale}
                style={[
                  {
                    width: 48,
                    height: 48,
                    borderRadius: radius.lg,
                    backgroundColor: palette.primary.main,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  Platform.OS === "web" && {
                    boxShadow: `0 0 15px ${palette.primary.main}50`,
                  },
                ]}
              >
                <AppIcon name="add" size={24} color={palette.text.white} />
              </Pressable>
            </Animated.View>

            {/* Period Chips */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}
            >
              {PERIOD_OPTIONS.map((option) => (
                <NeuPeriodChip
                  key={option.key}
                  label={option.shortLabel}
                  selected={selectedPeriod === option.key}
                  onPress={() => {
                    Haptic.selection();
                    setSelectedPeriod(option.key);
                  }}
                />
              ))}
            </Animated.View>

            {/* Revenue Hero Card */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <LinearGradient
                colors={[palette.primary.main, palette.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  {
                    borderRadius: radius["2xl"],
                    padding: spacing.xl,
                    marginBottom: spacing.lg,
                  },
                  Platform.OS === "web" && {
                    boxShadow: `0 8px 32px ${palette.primary.main}40`,
                  },
                ]}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: spacing.xs,
                  }}
                >
                  REVENU NET
                </Text>
                <Text
                  style={{
                    color: palette.text.white,
                    fontSize: 36,
                    fontWeight: "800",
                    letterSpacing: -1,
                  }}
                >
                  {formatCurrency(stats.totalRevenue)}
                </Text>
                {stats.comparison !== 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: spacing.xs,
                    }}
                  >
                    <AppIcon
                      name={
                        stats.comparison >= 0 ? "trending-up" : "trending-down"
                      }
                      size={14}
                      color={palette.text.white}
                    />
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {stats.comparison >= 0 ? "+" : ""}
                      {stats.comparison.toFixed(0)}% vs période préc.
                    </Text>
                  </View>
                )}

                {/* Mini Stats */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: spacing.lg,
                    paddingTop: spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        color: palette.text.white,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {stats.salesCount}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 10,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      Ventes
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 1,
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  />
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        color: palette.text.white,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {formatCurrency(stats.avgValue)}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 10,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      Moy/vente
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 1,
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  />
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        color: palette.text.white,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {formatCurrency(stats.totalFees)}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 10,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      Frais
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Pending Sales Alert */}
            {stats.pendingCount > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: palette.background.main,
                      borderRadius: radius.xl,
                      padding: spacing.md,
                      marginBottom: spacing.lg,
                    },
                    Platform.OS === "web" && {
                      boxShadow: shadows.flat.css as any,
                    },
                  ]}
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
                        width: 40,
                        height: 40,
                        borderRadius: radius.lg,
                        backgroundColor: palette.accent.yellow + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon
                        name="schedule"
                        size={18}
                        color={palette.accent.yellow}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: palette.text.primary,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {stats.pendingCount} vente
                        {stats.pendingCount > 1 ? "s" : ""} en attente
                      </Text>
                      <Text
                        style={{
                          color: palette.text.muted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        En cours de traitement
                      </Text>
                    </View>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={20}
                    color={palette.text.muted}
                  />
                </View>
              </Animated.View>
            )}

            {/* Section Title */}
            <Animated.View
              entering={FadeInDown.delay(500).duration(400)}
              style={{ marginBottom: spacing.md }}
            >
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Historique
              </Text>
            </Animated.View>
          </>
        }
        ListEmptyComponent={
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing["3xl"],
            }}
          >
            <View
              style={[
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: palette.background.main,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: shadows.pressed.borderColor,
                },
                Platform.OS === "web" && {
                  boxShadow: shadows.pressed.css as any,
                },
              ]}
            >
              <AppIcon
                name="point-of-sale"
                size={48}
                color={palette.text.muted}
              />
            </View>
            <Text
              style={{
                color: palette.text.primary,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: spacing.xs,
              }}
            >
              Aucune vente
            </Text>
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 14,
                textAlign: "center",
                marginBottom: spacing.lg,
              }}
            >
              Vos ventes apparaîtront ici
            </Text>
            <Pressable
              onPress={handleAddSale}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  backgroundColor: palette.primary.main,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: radius.xl,
                },
                Platform.OS === "web" && {
                  boxShadow: shadows.glow.cssMd as any,
                },
              ]}
            >
              <AppIcon name="add" size={18} color={palette.text.white} />
              <Text
                style={{
                  color: palette.text.white,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Ajouter une vente
              </Text>
            </Pressable>
          </Animated.View>
        }
        renderItem={({ item, index }) => <SaleCard sale={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </NeuScreen>
  );
}
