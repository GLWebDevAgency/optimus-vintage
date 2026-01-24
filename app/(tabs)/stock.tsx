/**
 * 📦 STOCK SCREEN - Ultra Premium Edition
 * Premium inventory management with world-class animations
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Button, Card, Chip } from "@/components/ui/Components";
import {
    PremiumScreen,
    usePremiumTheme,
    type PremiumTheme,
} from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Typography } from "@/constants/Theme";
import { Item, ItemsRepository, LotsRepository } from "@/db/repositories";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    LayoutAnimation,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isAndroid = process.env.EXPO_OS === "android";

// Enable LayoutAnimation for Android
if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============

type SortOption = "newest" | "oldest" | "cost_high" | "cost_low" | "lot";
type ViewMode = "list" | "compact" | "grid";

interface StockStats {
  totalItems: number;
  totalValue: number;
  avgCost: number;
  lotsCount: number;
}

// ============ CONSTANTS ============

const ITEMS_PER_PAGE = 20;
const ANIMATION_STAGGER = 30; // ms between each item animation
const MAX_ANIMATED_ITEMS = 10; // Only animate first N items for performance

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Récent", icon: "schedule" },
  { key: "oldest", label: "Ancien", icon: "history" },
  { key: "cost_high", label: "Prix ↓", icon: "trending-down" },
  { key: "cost_low", label: "Prix ↑", icon: "trending-up" },
  { key: "lot", label: "Par Lot", icon: "inventory-2" },
];

// Helper to get first photo from item
function getItemFirstPhoto(item: Item): string | null {
  if (!item.photos) return null;
  try {
    const photos = JSON.parse(item.photos);
    return Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
  } catch {
    return null;
  }
}

// ============ ITEM CARD COMPONENT ============

interface ItemCardProps {
  item: Item;
  index: number;
  onSell: () => void;
  onPress?: () => void;
  viewMode: ViewMode;
  shouldAnimate: boolean;
}

const ItemCard = React.memo(function ItemCard({
  item,
  index,
  onSell,
  onPress,
  viewMode,
  shouldAnimate,
}: ItemCardProps) {
  const theme = usePremiumTheme();
  const unitCost = parseFloat(String(item.unitCost));
  const photoUri = getItemFirstPhoto(item);

  // Grid view for 2-column card layout
  if (viewMode === "grid") {
    return (
      <Animated.View
        entering={
          shouldAnimate
            ? FadeIn.delay(index * ANIMATION_STAGGER).duration(200)
            : undefined
        }
        style={styles.gridCardWrapper}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.gridCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderCard,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {/* Image or placeholder */}
          <View
            style={[
              styles.gridImageContainer,
              { backgroundColor: theme.surfaceCard },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <AppIcon name="checkroom" size={32} color={theme.textMuted} />
            )}
            {/* Lot badge */}
            <View
              style={[styles.gridLotBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.gridLotText}>#{item.lotId}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.gridContent}>
            <Text
              style={[
                Typography.body.sm,
                { color: theme.text, fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {item.brand || "Marque inconnue"}
            </Text>
            <Text
              style={[Typography.body.xs, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {item.type || "Article"} • {item.size || "TU"}
            </Text>

            <View style={styles.gridFooter}>
              <Text
                style={[
                  Typography.number.sm,
                  { color: theme.primary, fontWeight: "700" },
                ]}
              >
                €{unitCost.toFixed(2)}
              </Text>
              <Pressable
                onPress={onSell}
                hitSlop={8}
                style={[styles.gridSellBtn, { backgroundColor: theme.primary }]}
              >
                <AppIcon name="sell" size={14} color={theme.textOnAccent} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Compact view for dense lists
  if (viewMode === "compact") {
    return (
      <Animated.View
        entering={
          shouldAnimate
            ? FadeIn.delay(index * ANIMATION_STAGGER).duration(200)
            : undefined
        }
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.compactCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderCard,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.compactIcon,
              { backgroundColor: theme.surfaceCard, overflow: "hidden" },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <AppIcon name="checkroom" size={18} color={theme.textMuted} />
            )}
          </View>

          <View style={styles.compactInfo}>
            <Text
              style={[
                Typography.body.sm,
                { color: theme.text, fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {item.brand || "Marque"} • {item.type || "Article"}
            </Text>
            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
              Lot #{item.lotId} • {item.size || "TU"}
            </Text>
          </View>

          <Text
            style={[
              Typography.number.sm,
              { color: theme.primary, marginRight: Spacing.md },
            ]}
          >
            €{unitCost.toFixed(2)}
          </Text>

          <Pressable
            onPress={onSell}
            hitSlop={8}
            style={[styles.compactSellBtn, { backgroundColor: theme.primary }]}
          >
            <AppIcon name="sell" size={14} color={theme.textOnAccent} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  }

  // Full card view
  return (
    <Animated.View
      entering={
        shouldAnimate
          ? FadeInDown.delay(index * ANIMATION_STAGGER).duration(300)
          : undefined
      }
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <Card variant="default" style={styles.itemCard}>
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: theme.surfaceCard, overflow: "hidden" },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <AppIcon name="checkroom" size={28} color={theme.textMuted} />
            )}
            {/* Lot indicator */}
            <View
              style={[styles.lotIndicator, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.lotIndicatorText}>#{item.lotId}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardInfo}>
              <Text
                style={[Typography.heading.xs, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.brand || "Marque inconnue"}
              </Text>
              <Text
                style={[Typography.body.xs, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {item.type || "Vêtement"} {item.color ? `• ${item.color}` : ""}
              </Text>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.sizeBadge,
                    { backgroundColor: theme.surfaceCard },
                  ]}
                >
                  <Text
                    style={[
                      Typography.label.xs,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.size || "TU"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.conditionDot,
                    {
                      backgroundColor:
                        item.condition === "New"
                          ? theme.success
                          : item.condition === "Good"
                            ? theme.warning
                            : theme.textMuted,
                    },
                  ]}
                />
                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                  {item.condition === "New"
                    ? "Neuf"
                    : item.condition === "Good"
                      ? "Bon"
                      : "Usé"}
                </Text>
              </View>
              <View
                style={[
                  styles.costTag,
                  { backgroundColor: theme.primarySubtle },
                ]}
              >
                <Text style={[Typography.label.xs, { color: theme.primary }]}>
                  Coût: €{unitCost.toFixed(2)}
                </Text>
              </View>
            </View>

            <Pressable style={styles.sellButtonWrapper} onPress={onSell}>
              <View
                style={[
                  styles.sellButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <AppIcon name="sell" size={16} color={theme.textOnAccent} />
                <Text
                  style={[styles.sellButtonText, { color: theme.textOnAccent }]}
                >
                  Vendre
                </Text>
              </View>
            </Pressable>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
});

// ============ STATS BAR COMPONENT ============

function StatsBar({
  stats,
  theme,
}: {
  stats: StockStats;
  theme: PremiumTheme;
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.statsBar}>
      <View
        style={[
          styles.statItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon name="inventory" size={16} color={theme.primary} />
        <View>
          <Text style={[Typography.number.sm, { color: theme.text }]}>
            {stats.totalItems}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Articles
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon
          name="account-balance-wallet"
          size={16}
          color={theme.success}
        />
        <View>
          <Text style={[Typography.number.sm, { color: theme.success }]}>
            €{stats.totalValue.toFixed(0)}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Valeur
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon name="analytics" size={16} color={theme.warning} />
        <View>
          <Text style={[Typography.number.sm, { color: theme.text }]}>
            €{stats.avgCost.toFixed(2)}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Moy.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ============ SEARCH BAR COMPONENT ============

function SearchBar({
  value,
  onChangeText,
  onClear,
  theme,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  theme: PremiumTheme;
}) {
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <AppIcon name="search" size={20} color={theme.textMuted} />
      <TextInput
        ref={inputRef}
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Rechercher par marque, type, couleur..."
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}>
          <AppIcon name="close" size={18} color={theme.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

// ============ MAIN SCREEN ============

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const theme = usePremiumTheme();
  const flatListRef = useRef<FlatList>(null);

  // Data state
  const itemsQuery = useQuery({
    queryKey: ["stock-items"],
    queryFn: () => ItemsRepository.getAllStock(),
  });
  const lotsQuery = useQuery({
    queryKey: ["lots"],
    queryFn: () => LotsRepository.getAll(),
  });
  const { refetch: refetchItems } = itemsQuery;
  const { refetch: refetchLots } = lotsQuery;
  const loading = itemsQuery.isLoading || lotsQuery.isLoading;
  const refreshing =
    (itemsQuery.isFetching || lotsQuery.isFetching) && !loading;
  const allItems = itemsQuery.data ?? [];
  const lots = lotsQuery.data ?? [];
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLotId, setFilterLotId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [hasAnimated, setHasAnimated] = useState(false);

  // ============ DATA LOADING ============

  useFocusEffect(
    useCallback(() => {
      refetchItems();
      refetchLots();
    }, [refetchItems, refetchLots]),
  );

  useEffect(() => {
    if (!loading) {
      setPage(1);
      const timer = setTimeout(() => setHasAnimated(true), 500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [loading, allItems, lots]);

  // ============ FILTERING & SORTING ============

  const processedItems = useMemo(() => {
    let result = [...allItems];

    // Filter by lot
    if (filterLotId !== null) {
      result = result.filter((i) => i.lotId === filterLotId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.brand?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query) ||
          item.color?.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query) ||
          `lot ${item.lotId}`.includes(query) ||
          `#${item.id}`.includes(query),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
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
  }, [allItems, filterLotId, searchQuery, sortBy]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    return processedItems.slice(0, page * ITEMS_PER_PAGE);
  }, [processedItems, page]);

  const hasMore = paginatedItems.length < processedItems.length;

  // Stats
  const stats = useMemo<StockStats>(() => {
    const items =
      filterLotId !== null
        ? allItems.filter((i) => i.lotId === filterLotId)
        : allItems;

    const totalValue = items.reduce(
      (sum, i) => sum + parseFloat(String(i.unitCost)),
      0,
    );
    const uniqueLots = new Set(items.map((i) => i.lotId)).size;

    return {
      totalItems: items.length,
      totalValue,
      avgCost: items.length > 0 ? totalValue / items.length : 0,
      lotsCount: uniqueLots,
    };
  }, [allItems, filterLotId]);

  // ============ HANDLERS ============

  const handleSell = useCallback((item: Item) => {
    router.push({
      pathname: "/sales/new",
      params: { itemId: item.id, lotId: item.lotId },
    });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage((p) => p + 1);
      setTimeout(() => setLoadingMore(false), 100);
    }
  }, [loadingMore, hasMore]);

  const handleRefresh = useCallback(() => {
    setHasAnimated(false);
    refetchItems();
    refetchLots();
  }, [refetchItems, refetchLots]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setPage(1); // Reset pagination on search
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    Keyboard.dismiss();
  }, []);

  const handleSortChange = useCallback((option: SortOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortBy(option);
    setShowSortMenu(false);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((lotId: number | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterLotId(lotId);
    setPage(1);
  }, []);

  const toggleViewMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode((v) => {
      if (v === "list") return "compact";
      if (v === "compact") return "grid";
      return "list";
    });
  }, []);

  const getViewModeIcon = useCallback((): string => {
    switch (viewMode) {
      case "list":
        return "view-stream";
      case "compact":
        return "view-agenda";
      case "grid":
        return "grid-view";
      default:
        return "view-stream";
    }
  }, [viewMode]);

  // ============ RENDER ============

  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) => (
      <ItemCard
        item={item}
        index={index}
        onSell={() => handleSell(item)}
        onPress={() => router.push(`/items/edit/${item.id}`)}
        viewMode={viewMode}
        shouldAnimate={!hasAnimated && index < MAX_ANIMATED_ITEMS}
      />
    ),
    [viewMode, hasAnimated, handleSell],
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerLoader}>
        {loadingMore ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            {processedItems.length - paginatedItems.length} articles de plus
          </Text>
        )}
      </View>
    );
  }, [
    hasMore,
    loadingMore,
    processedItems.length,
    paginatedItems.length,
    theme,
  ]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    if (searchQuery) {
      return (
        <View style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: theme.surfaceCard }]}
          >
            <AppIcon name="search-off" size={48} color={theme.textMuted} />
          </View>
          <Text
            style={[
              Typography.heading.md,
              { color: theme.text, marginTop: Spacing.lg },
            ]}
          >
            Aucun résultat
          </Text>
          <Text
            style={[
              Typography.body.sm,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.xs,
              },
            ]}
          >
            Aucun article ne correspond à "{searchQuery}"
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleClearSearch}
            style={{ marginTop: Spacing.lg }}
          >
            Effacer la recherche
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View
          style={[styles.emptyIcon, { backgroundColor: theme.primarySubtle }]}
        >
          <AppIcon name="checkroom" size={48} color={theme.primary} />
        </View>
        <Text
          style={[
            Typography.heading.md,
            { color: theme.text, marginTop: Spacing.lg },
          ]}
        >
          Stock vide
        </Text>
        <Text
          style={[
            Typography.body.sm,
            {
              color: theme.textMuted,
              textAlign: "center",
              marginTop: Spacing.xs,
            },
          ]}
        >
          Ajoutez des articles via les Lots pour remplir votre stock
        </Text>
        <Button
          variant="primary"
          size="md"
          icon={<AppIcon name="add" size={18} color="#FFF" />}
          onPress={() => router.push("/lots/new")}
          style={{ marginTop: Spacing.xl }}
        >
          Créer un Lot
        </Button>
      </View>
    );
  }, [loading, searchQuery, theme, handleClearSearch]);

  const keyExtractor = useCallback((item: Item) => item.id.toString(), []);
  const colorScheme = useColorScheme() ?? "light";

  return (
    <PremiumScreen>
      {/* Floating Header with Blur */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView
          intensity={80}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.surface + "E6" },
          ]}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={[Typography.display.sm, { color: theme.text }]}>
              Stock
            </Text>
            <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>
              {processedItems.length}{" "}
              {filterLotId ? "filtrés" : "articles en stock"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.headerBtn,
                { backgroundColor: theme.surfaceHighlight },
              ]}
              onPress={() => {
                Haptic.selection();
                toggleViewMode();
              }}
            >
              <AppIcon
                name={getViewModeIcon() as any}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: insets.top + 90 }}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={handleClearSearch}
            theme={theme}
          />

          {/* Sort Button */}
          <Pressable
            style={[
              styles.sortButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {
              Haptic.selection();
              setShowSortMenu(!showSortMenu);
            }}
          >
            <AppIcon
              name={
                (SORT_OPTIONS.find((o) => o.key === sortBy)?.icon as any) ||
                "sort"
              }
              size={18}
              color={theme.primary}
            />
          </Pressable>
        </View>

        {/* Sort Menu Dropdown */}
        {showSortMenu && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={[
              styles.sortMenu,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && {
                    backgroundColor: theme.primarySubtle,
                  },
                ]}
                onPress={() => handleSortChange(option.key)}
              >
                <AppIcon
                  name={option.icon as any}
                  size={16}
                  color={
                    sortBy === option.key ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    Typography.body.sm,
                    {
                      color: sortBy === option.key ? theme.primary : theme.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Stats Bar */}
        {allItems.length > 0 && <StatsBar stats={stats} theme={theme} />}

        {/* Filter Chips */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.filterBar}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Chip
              label="Tout le stock"
              selected={filterLotId === null}
              icon={
                <AppIcon
                  name="inventory-2"
                  size={14}
                  color={
                    filterLotId === null
                      ? theme.textOnAccent
                      : theme.textSecondary
                  }
                />
              }
              onPress={() => handleFilterChange(null)}
            />

            {lots.map((lot) => {
              const lotItemCount = allItems.filter(
                (i) => i.lotId === lot.id,
              ).length;
              if (lotItemCount === 0) return null;

              return (
                <Chip
                  key={lot.id}
                  label={`${lot.name || `Lot #${lot.id}`} (${lotItemCount})`}
                  selected={filterLotId === lot.id}
                  onPress={() =>
                    handleFilterChange(lot.id === filterLotId ? null : lot.id)
                  }
                />
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Items List */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <SkeletonList count={6} />
          </View>
        ) : (
          <FlatList
            key={viewMode === "grid" ? "grid" : "list"}
            ref={flatListRef}
            data={paginatedItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={
              viewMode === "grid" ? styles.gridRow : undefined
            }
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={[
              styles.listContent,
              paginatedItems.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={isAndroid}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={
              viewMode === "compact"
                ? (_, index) => ({
                    length: 56,
                    offset: 56 * index,
                    index,
                  })
                : undefined
            }
          />
        )}
      </View>
    </PremiumScreen>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sortMenu: {
    position: "absolute",
    top: 130,
    right: Spacing.xl,
    zIndex: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  filterBar: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },

  // Full Card Styles
  itemCard: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    position: "relative",
  },
  lotIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lotIndicatorText: {
    fontSize: 9,
    fontFamily: "Manrope_700Bold",
    color: "#FFF",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  sizeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  costTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  sellButtonWrapper: {
    marginLeft: Spacing.md,
  },
  sellButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  sellButtonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },

  // Compact Card Styles
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactSellBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Grid Card Styles
  gridRow: {
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  gridCardWrapper: {
    flex: 1,
    maxWidth: "48%",
  },
  gridCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  gridImageContainer: {
    aspectRatio: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridLotBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  gridLotText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: "#FFF",
  },
  gridContent: {
    padding: Spacing.md,
  },
  gridFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  gridSellBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  empty: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
});
