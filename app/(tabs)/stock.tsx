/**
 * 📦 STOCK SCREEN - Neumorphic Light/Dark Edition
 *
 * Design fidèle 100% au mockup de référence
 * Style: Soft UI, Neumorphic, Glow accents
 * Thème dynamique Light/Dark via useNeuColors()
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    NeuListItem,
    NeuPeriodChip,
    NeuScreen,
    NeuSearchBar,
    NeuStatGrid,
    useNeuColors,
} from "@/components/ui/Neumorphic";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Item, ItemsRepository, LotsRepository } from "@/db/repositories";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
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

type SortOption = "newest" | "oldest" | "cost_high" | "cost_low" | "lot";
type ViewMode = "list" | "grid";

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Récent", icon: "schedule" },
  { key: "oldest", label: "Ancien", icon: "history" },
  { key: "cost_high", label: "Prix ↓", icon: "trending-down" },
  { key: "cost_low", label: "Prix ↑", icon: "trending-up" },
  { key: "lot", label: "Par Lot", icon: "inventory-2" },
];

function getItemFirstPhoto(item: Item): string | null {
  if (!item.photos) return null;
  try {
    const photos = JSON.parse(item.photos);
    return Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
  } catch {
    return null;
  }
}

function formatCurrency(value: number): string {
  return `€${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎴 ITEM CARD COMPONENT (Grid mode)
// ═══════════════════════════════════════════════════════════════════════════════

interface ItemCardProps {
  item: Item;
  index: number;
  onPress?: () => void;
}

const ItemCard = React.memo(function ItemCard({
  item,
  index,
  onPress,
}: ItemCardProps) {
  const { palette, shadows, radius, spacing } = useNeuColors();
  const scale = useSharedValue(1);
  const unitCost = parseFloat(String(item.unitCost)) || 0;
  const photoUri = getItemFirstPhoto(item);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  }, [scale]);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={{ flex: 1, maxWidth: "50%", marginBottom: spacing.md }}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            backgroundColor: palette.background.main,
            borderRadius: radius.xl,
            overflow: "hidden",
            borderCurve: "continuous",
            ...(Platform.OS === "web" && {
              boxShadow: shadows.flat.css as any,
            }),
          }}
        >
          {/* Image */}
          <View
            style={{
              aspectRatio: 1,
              backgroundColor: palette.background.dark,
              borderRadius: radius.lg,
              margin: spacing.sm,
              overflow: "hidden",
            }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon
                  name="checkroom"
                  size={32}
                  color={palette.text.muted}
                />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={{ padding: spacing.sm, paddingTop: 0 }}>
            <Text
              style={{
                color: palette.text.primary,
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {item.brand && item.type
                ? `${item.brand} ${item.type}`
                : item.type || `Article #${item.id}`}
            </Text>
            <Text
              style={{
                color: palette.primary.main,
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              {formatCurrency(unitCost)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 ITEM LIST ROW (List mode)
// ═══════════════════════════════════════════════════════════════════════════════

const ItemListRow = React.memo(function ItemListRow({
  item,
  index,
  onPress,
}: ItemCardProps) {
  const { palette, spacing } = useNeuColors();
  const unitCost = parseFloat(String(item.unitCost)) || 0;

  return (
    <Animated.View entering={SlideInRight.delay(index * 30).duration(250)}>
      <NeuListItem
        title={
          item.brand && item.type
            ? `${item.brand} ${item.type}`
            : item.type || `Article #${item.id}`
        }
        subtitle={item.condition || "État non précisé"}
        leftIcon="checkroom"
        leftIconColor={palette.primary.main}
        rightValue={formatCurrency(unitCost)}
        onPress={onPress}
        showChevron
        style={{ marginBottom: spacing.sm }}
      />
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 STOCK SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 🎨 Thème dynamique Light/Dark
  const { palette, shadows, spacing, radius } = useNeuColors();

  // ─── Data Queries ────────────────────────────────────────────────────
  const itemsQuery = useQuery({
    queryKey: ["items"],
    queryFn: () => ItemsRepository.getAll(),
  });

  const lotsQuery = useQuery({
    queryKey: ["lots"],
    queryFn: () => LotsRepository.getAll(),
  });

  const loading = itemsQuery.isLoading;
  const refreshing = itemsQuery.isFetching && !loading;
  const items = itemsQuery.data ?? [];
  const lots = lotsQuery.data ?? [];

  useFocusEffect(
    useCallback(() => {
      itemsQuery.refetch();
      lotsQuery.refetch();
    }, []),
  );

  // ─── Filtered & Sorted Items ─────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.type?.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.color?.toLowerCase().includes(query),
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
      case "cost_high":
        result.sort(
          (a, b) =>
            parseFloat(String(b.unitCost)) - parseFloat(String(a.unitCost)),
        );
        break;
      case "cost_low":
        result.sort(
          (a, b) =>
            parseFloat(String(a.unitCost)) - parseFloat(String(b.unitCost)),
        );
        break;
      case "lot":
        result.sort((a, b) => a.lotId - b.lotId);
        break;
    }

    return result;
  }, [items, searchQuery, sortBy]);

  // ─── Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalValue = filteredItems.reduce(
      (sum, item) => sum + parseFloat(String(item.unitCost)),
      0,
    );
    const avgCost = totalItems > 0 ? totalValue / totalItems : 0;
    return { totalItems, totalValue, avgCost };
  }, [filteredItems]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    Haptic.selection();
    itemsQuery.refetch();
    lotsQuery.refetch();
  }, [itemsQuery, lotsQuery]);

  const handleItemPress = useCallback((item: Item) => {
    Haptic.selection();
    // Navigate to item detail
    router.push(`/lots/${item.lotId}`);
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
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode} // Force re-render when changing view mode
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
                alignItems: "flex-start",
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
                  Mon Stock
                </Text>
                <Text
                  style={{
                    color: palette.text.muted,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {stats.totalItems} articles •{" "}
                  {formatCurrency(stats.totalValue)}
                </Text>
              </View>

              {/* View Mode Toggle */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: palette.background.main,
                  borderRadius: radius.lg,
                  padding: 4,
                  ...(Platform.OS === "web" && {
                    boxShadow: shadows.pressed.css as any,
                  }),
                  borderWidth: 1,
                  borderColor: shadows.pressed.borderColor,
                }}
              >
                <Pressable
                  onPress={() => {
                    Haptic.selection();
                    setViewMode("grid");
                  }}
                  style={{
                    width: 36,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.md,
                    ...(viewMode === "grid" && {
                      backgroundColor: palette.background.light,
                      ...(Platform.OS === "web" && {
                        boxShadow: shadows.flat.css as any,
                      }),
                    }),
                  }}
                >
                  <AppIcon
                    name="grid-view"
                    size={18}
                    color={
                      viewMode === "grid"
                        ? palette.primary.main
                        : palette.text.muted
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptic.selection();
                    setViewMode("list");
                  }}
                  style={{
                    width: 36,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.md,
                    ...(viewMode === "list" && {
                      backgroundColor: palette.background.light,
                      ...(Platform.OS === "web" && {
                        boxShadow: shadows.flat.css as any,
                      }),
                    }),
                  }}
                >
                  <AppIcon
                    name="view-list"
                    size={18}
                    color={
                      viewMode === "list"
                        ? palette.primary.main
                        : palette.text.muted
                    }
                  />
                </Pressable>
              </View>
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
                placeholder="Rechercher article, marque..."
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => Haptic.selection()}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: palette.background.main,
                  borderRadius: radius.xl,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(Platform.OS === "web" && {
                    boxShadow: shadows.flat.css as any,
                  }),
                }}
              >
                <AppIcon name="tune" size={20} color={palette.primary.main} />
              </Pressable>
            </Animated.View>

            {/* Stats Grid */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <NeuStatGrid
                items={[
                  {
                    icon: "checkroom",
                    iconColor: palette.primary.main,
                    value: String(stats.totalItems),
                    label: "Articles",
                  },
                  {
                    icon: "payments",
                    iconColor: palette.accent.yellow,
                    value: formatCurrency(stats.totalValue),
                    label: "Valeur",
                  },
                  {
                    icon: "analytics",
                    iconColor: palette.accent.blue,
                    value: formatCurrency(stats.avgCost),
                    label: "Moy/pièce",
                  },
                ]}
                style={{
                  marginHorizontal: spacing.lg,
                  marginBottom: spacing.lg,
                }}
              />
            </Animated.View>

            {/* Sort Chips */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <NeuPeriodChip
                  key={option.key}
                  label={option.label}
                  selected={sortBy === option.key}
                  onPress={() => {
                    Haptic.selection();
                    setSortBy(option.key);
                  }}
                />
              ))}
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
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: palette.background.main,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.lg,
                ...(Platform.OS === "web" && {
                  boxShadow: shadows.pressed.css as any,
                }),
                borderWidth: 1,
                borderColor: shadows.pressed.borderColor,
              }}
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
              Aucun article
            </Text>
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {searchQuery
                ? "Aucun résultat pour cette recherche"
                : "Ajoutez un lot pour commencer"}
            </Text>
          </Animated.View>
        }
        renderItem={({ item, index }) =>
          viewMode === "grid" ? (
            <ItemCard
              item={item}
              index={index}
              onPress={() => handleItemPress(item)}
            />
          ) : (
            <ItemListRow
              item={item}
              index={index}
              onPress={() => handleItemPress(item)}
            />
          )
        }
        columnWrapperStyle={
          viewMode === "grid" ? { gap: spacing.md } : undefined
        }
      />
    </NeuScreen>
  );
}
