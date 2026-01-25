/**
 * 📦 LOTS SCREEN - Neumorphic Dark Edition
 *
 * Design fidèle 100% au mockup mes_lots_neumorphic_redesign
 * Style: Soft UI, Dark Neumorphic, Progress bars, Stats
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    NeuBadge,
    NeuProgressBar,
    NeuScreen,
    NeuSearchBar,
    NeuStatGrid,
    useNeuColors,
} from "@/components/ui/Neumorphic";
import { SkeletonList } from "@/components/ui/Skeleton";
import { LotSummary, LotsRepository } from "@/db/repositories";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
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

type SortOption = "newest" | "oldest" | "investment" | "delta";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Récent" },
  { key: "oldest", label: "Ancien" },
  { key: "investment", label: "Invest." },
  { key: "delta", label: "Delta" },
];

function formatCurrency(value: number): string {
  const prefix = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  return `€${prefix}${absValue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎴 LOT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface LotCardProps {
  lot: LotSummary;
  index: number;
}

const LotCard = React.memo(function LotCard({ lot, index }: LotCardProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const scale = useSharedValue(1);

  const investment = parseFloat(String(lot.totalInvestment)) || 0;
  const delta = parseFloat(String(lot.delta)) || 0;
  const revenue = investment - delta; // totalRevenue = investment - delta (car delta = invest - revenue)
  const soldCount = parseInt(String(lot.soldCount)) || 0;
  const initialQty = lot.initialQuantity || 0;
  const progressPercent = initialQty > 0 ? (soldCount / initialQty) * 100 : 0;
  const isProfitable = delta >= 0;

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
    router.push(`/lots/${lot.id}`);
  }, [lot.id]);

  // Status badge
  const getStatusBadge = () => {
    if (soldCount === initialQty && initialQty > 0) {
      return { label: "TERMINÉ", color: palette.accent.green };
    }
    if (soldCount > 0) {
      return { label: "EN COURS", color: palette.primary.main };
    }
    return { label: "NOUVEAU", color: palette.accent.blue };
  };
  const status = getStatusBadge();

  return (
    <Animated.View entering={SlideInRight.delay(index * 60).duration(350)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            {
              backgroundColor: palette.background.main,
              borderRadius: radius["2xl"],
              padding: spacing.lg,
              borderCurve: "continuous",
            },
            Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
          ]}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
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
              {/* Icon (Pressed style) */}
              <View
                style={[
                  {
                    width: 48,
                    height: 48,
                    borderRadius: radius.lg,
                    backgroundColor: palette.background.main,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: shadows.pressed.borderColor,
                  },
                  Platform.OS === "web" && {
                    boxShadow: shadows.pressed.css as any,
                  },
                ]}
              >
                <AppIcon
                  name="inventory-2"
                  size={22}
                  color={palette.primary.main}
                />
              </View>
              <View>
                <Text
                  style={{
                    color: palette.text.primary,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  {lot.name || `Lot #${lot.id}`}
                </Text>
                <Text
                  style={{
                    color: palette.text.muted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {lot.provider || "Fournisseur"} •{" "}
                  {lot.createdAt?.split("T")[0] || ""}
                </Text>
              </View>
            </View>
            <NeuBadge label={status.label} color={status.color} />
          </View>

          {/* Stats Grid */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                ARTICLES
              </Text>
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {initialQty}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                INVESTI
              </Text>
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {formatCurrency(investment)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                REVENU
              </Text>
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {formatCurrency(revenue)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                DELTA
              </Text>
              <Text
                style={{
                  color: isProfitable
                    ? palette.accent.green
                    : palette.accent.red,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {formatCurrency(delta)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <NeuProgressBar
              progress={progressPercent}
              height={10}
              color={palette.primary.main}
            />
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 10,
                fontWeight: "600",
                minWidth: 70,
              }}
            >
              {soldCount}/{initialQty} VENDUS
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 LOTS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function LotsScreen() {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // ─── Data Query ──────────────────────────────────────────────────────
  const lotsQuery = useQuery({
    queryKey: ["lots-summary"],
    queryFn: () => LotsRepository.getSummary(),
  });

  const loading = lotsQuery.isLoading;
  const refreshing = lotsQuery.isFetching && !loading;
  const lots = lotsQuery.data ?? [];

  useFocusEffect(
    useCallback(() => {
      lotsQuery.refetch();
    }, []),
  );

  // ─── Filtered & Sorted Lots ──────────────────────────────────────────
  const filteredLots = useMemo(() => {
    let result = [...lots];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.name?.toLowerCase().includes(query) ||
          lot.provider?.toLowerCase().includes(query),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;
      case "oldest":
        result.sort((a, b) => a.id - b.id);
        break;
      case "investment":
        result.sort(
          (a, b) =>
            parseFloat(String(b.totalInvestment)) -
            parseFloat(String(a.totalInvestment)),
        );
        break;
      case "delta":
        result.sort(
          (a, b) => parseFloat(String(b.delta)) - parseFloat(String(a.delta)),
        );
        break;
    }

    return result;
  }, [lots, searchQuery, sortBy]);

  // ─── Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalInvest = 0;
    let totalProfit = 0;
    let totalItems = 0;

    for (const lot of lots) {
      totalInvest += parseFloat(String(lot.totalInvestment)) || 0;
      totalProfit += parseFloat(String(lot.delta)) || 0;
      totalItems += lot.initialQuantity || 0;
    }

    return { lotsCount: lots.length, totalInvest, totalProfit, totalItems };
  }, [lots]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    Haptic.selection();
    lotsQuery.refetch();
  }, [lotsQuery]);

  const handleAddLot = useCallback(() => {
    Haptic.selection();
    router.push("/lots/new");
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
        data={filteredLots}
        keyExtractor={(lot) => String(lot.id)}
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
                  Mes Lots
                </Text>
                <Text
                  style={{
                    color: palette.text.muted,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {stats.lotsCount} lots • {stats.totalItems} pièces
                </Text>
              </View>

              {/* Add Button */}
              <Pressable
                onPress={handleAddLot}
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

            {/* Search Bar */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              <NeuSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery("")}
                placeholder="Rechercher lot, fournisseur..."
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => Haptic.selection()}
                style={[
                  {
                    width: 48,
                    height: 48,
                    backgroundColor: palette.background.main,
                    borderRadius: radius.xl,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  Platform.OS === "web" && {
                    boxShadow: shadows.flat.css as any,
                  },
                ]}
              >
                <AppIcon
                  name="history"
                  size={20}
                  color={palette.primary.main}
                />
              </Pressable>
            </Animated.View>

            {/* Stats Grid */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <NeuStatGrid
                items={[
                  {
                    icon: "folder-open",
                    iconColor: palette.primary.main,
                    value: String(stats.lotsCount),
                    label: "Lots",
                  },
                  {
                    icon: "assignment",
                    iconColor: palette.accent.yellow,
                    value: formatCurrency(stats.totalInvest),
                    label: "Investi",
                  },
                  {
                    icon: "trending-up",
                    iconColor:
                      stats.totalProfit >= 0
                        ? palette.accent.green
                        : palette.accent.red,
                    value: formatCurrency(stats.totalProfit),
                    valueColor:
                      stats.totalProfit >= 0
                        ? palette.accent.green
                        : palette.accent.red,
                    label: "Profit",
                  },
                ]}
                style={{ marginBottom: spacing.lg }}
              />
            </Animated.View>

            {/* Sort Chips - Section title */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Tous les lots
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.xs,
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      Haptic.selection();
                      setSortBy(option.key);
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: radius.md,
                      backgroundColor:
                        sortBy === option.key
                          ? palette.primary.main + "20"
                          : palette.background.main,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          sortBy === option.key
                            ? palette.primary.main
                            : palette.text.muted,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
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
                name="inventory-2"
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
              Aucun lot
            </Text>
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 14,
                textAlign: "center",
                marginBottom: spacing.lg,
              }}
            >
              {searchQuery
                ? "Aucun résultat pour cette recherche"
                : "Créez votre premier lot pour commencer"}
            </Text>
            {!searchQuery && (
              <Pressable
                onPress={handleAddLot}
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
                  Créer un lot
                </Text>
              </Pressable>
            )}
          </Animated.View>
        }
        renderItem={({ item, index }) => <LotCard lot={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </NeuScreen>
  );
}
