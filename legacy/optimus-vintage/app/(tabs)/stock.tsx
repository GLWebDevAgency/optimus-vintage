/**
 * 📦 STOCK SCREEN - Vanta-Aether Architecture
 * "Digital Architecture evolving in infinite spatial void"
 *
 * v4.0 - Netflix-style Carousel by Lot with Visibility Controller
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { VantaScreen, useVantaTheme } from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  CarouselItem,
  LotVisibilityController,
  LotVisibilityItem,
  MonolithCard,
  NetflixCarousel,
  VantaSectionHeader,
} from "@/components/ui/VantaComponents";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { Item, ItemsRepository, Lot, LotsRepository } from "@/db/repositories";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { Haptic } from "@/utils/haptics";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import type { TFunction } from "i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Gravity-based spring physics
const SPRING_GRAVITY = {
  damping: 22,
  stiffness: 180,
  mass: 1.2,
};

const isAndroid = process.env.EXPO_OS === "android";

// Enable LayoutAnimation for Android
if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============

type SortOption = "newest" | "oldest" | "cost_high" | "cost_low" | "lot";
type ViewMode = "list" | "compact" | "grid"; // Kept for ItemCard compatibility

interface StockStats {
  totalItems: number;
  totalValue: number;
  avgCost: number;
  lotsCount: number;
}

interface LotCarouselData {
  lot: Lot;
  items: Item[];
}

// ============ CONSTANTS ============

const ITEMS_PER_CAROUSEL = 10; // Items shown per lot carousel
const ANIMATION_STAGGER = 30; // ms between each item animation
const MAX_ANIMATED_ITEMS = 10; // Only animate first N items for performance

const CURRENCY_MAP: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
  CAD: "CA$",
};

const SORT_OPTIONS_KEYS: { key: SortOption; icon: string }[] = [
  { key: "newest", icon: "schedule" },
  { key: "oldest", icon: "history" },
  { key: "cost_high", icon: "trending-down" },
  { key: "cost_low", icon: "trending-up" },
  { key: "lot", icon: "inventory-2" },
];

// Helper to get translated sort options
function getSortOptions(t: TFunction) {
  return SORT_OPTIONS_KEYS.map((option) => ({
    ...option,
    label: t(
      `items.sort.${option.key === "cost_high" ? "costHigh" : option.key === "cost_low" ? "costLow" : option.key === "lot" ? "byLot" : option.key}`,
    ),
  }));
}

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

// Helper to normalize brand name (handle "Unknown" or empty)
function normalizeBrand(
  brand: string | null | undefined,
  fallback: string,
): string {
  if (!brand || brand.toLowerCase() === "unknown" || brand.trim() === "") {
    return fallback;
  }
  return brand;
}

// Helper to normalize type name (handle "Clothing" or empty)
function normalizeType(
  type: string | null | undefined,
  fallback: string,
): string {
  if (!type || type.toLowerCase() === "clothing" || type.trim() === "") {
    return fallback;
  }
  return type;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 VANTA ITEM CARD - Kinetic Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface ItemCardProps {
  item: Item;
  index: number;
  onSell: () => void;
  onPress?: () => void;
  viewMode: ViewMode;
  shouldAnimate: boolean;
  translations: {
    unknownBrand: string;
    defaultType: string;
    defaultSize: string;
    conditionNew: string;
    conditionGood: string;
    conditionUsed: string;
    sellLabel: string;
    sellA11yLabel: string;
    costLabel: string;
    openDetailsHint: string;
    currencySymbol: string;
  };
}

const ItemCard = React.memo(function ItemCard({
  item,
  index,
  onSell,
  onPress,
  viewMode,
  shouldAnimate,
  translations,
}: ItemCardProps) {
  const theme = useVantaTheme();
  const isDark = theme.dark;
  const scale = useSharedValue(1);
  const unitCost = parseFloat(String(item.unitCost));
  const photoUri = getItemFirstPhoto(item);

  // Theme colors
  const colors = {
    background: theme.surface,
    border: theme.borderGlass,
    text: theme.text,
    textMuted: theme.textMuted,
    gold: theme.primary,
    goldSubtle: theme.primarySubtle,
  };

  // Normalize values
  const displayBrand = normalizeBrand(item.brand, translations.unknownBrand);
  const displayType = normalizeType(item.type, translations.defaultType);
  const displaySize = item.size || translations.defaultSize;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Grid view for 2-column card layout
  if (viewMode === "grid") {
    return (
      <Animated.View
        entering={
          shouldAnimate
            ? FadeIn.delay(index * ANIMATION_STAGGER).duration(200)
            : undefined
        }
        style={[styles.gridCardWrapper, animatedStyle]}
      >
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${displayBrand}. ${displayType}. ${translations.costLabel}: ${translations.currencySymbol}${unitCost.toFixed(2)}.`}
          accessibilityHint={translations.openDetailsHint}
          onPressIn={() => {
            scale.value = withSpring(0.97, SPRING_GRAVITY);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, SPRING_GRAVITY);
          }}
        >
          <ObsidianBlock style={{ overflow: "hidden" }}>
            {/* Image or placeholder */}
            <View
              style={[
                styles.gridImageContainer,
                {
                  backgroundColor: theme.surfaceSlab,
                },
              ]}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={`grid-${item.id}`}
                  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                  accessibilityLabel={t("accessibility.itemPhoto", {
                    brand: displayBrand,
                  })}
                />
              ) : (
                <AppIcon name="checkroom" size={32} color={colors.textMuted} />
              )}
              {/* Lot badge */}
              <View
                style={[styles.gridLotBadge, { backgroundColor: colors.gold }]}
              >
                <Text
                  style={[styles.gridLotText, { color: theme.textOnAccent }]}
                >
                  #{item.lotId}
                </Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.gridContent}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {displayBrand}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Manrope_400Regular",
                  color: colors.textMuted,
                }}
                numberOfLines={1}
              >
                {displayType} • {displaySize}
              </Text>

              <View style={styles.gridFooter}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "Manrope_700Bold",
                    color: colors.gold,
                  }}
                >
                  {translations.currencySymbol}
                  {unitCost.toFixed(2)}
                </Text>
                <Pressable
                  onPress={onSell}
                  hitSlop={8}
                  style={[styles.gridSellBtn, { backgroundColor: colors.gold }]}
                  accessibilityRole="button"
                  accessibilityLabel={translations.sellA11yLabel}
                  accessibilityHint={translations.sellA11yLabel}
                >
                  <AppIcon name="sell" size={14} color={theme.textOnAccent} />
                </Pressable>
              </View>
            </View>
          </ObsidianBlock>
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
        style={animatedStyle}
      >
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${displayBrand}. ${displayType}. ${translations.costLabel}: ${translations.currencySymbol}${unitCost.toFixed(2)}.`}
          accessibilityHint={translations.openDetailsHint}
          onPressIn={() => {
            scale.value = withSpring(0.98, SPRING_GRAVITY);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, SPRING_GRAVITY);
          }}
        >
          <ObsidianBlock
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <View
              style={[
                styles.compactIcon,
                {
                  backgroundColor: theme.surfaceSlab,
                  overflow: "hidden",
                },
              ]}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={`compact-${item.id}`}
                  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                />
              ) : (
                <AppIcon name="checkroom" size={18} color={colors.textMuted} />
              )}
            </View>

            <View style={styles.compactInfo}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {displayBrand} • {displayType}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Manrope_400Regular",
                  color: colors.textMuted,
                }}
              >
                Lot #{item.lotId} • {displaySize}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 15,
                fontFamily: "Manrope_700Bold",
                color: colors.gold,
                marginRight: 12,
              }}
            >
              {translations.currencySymbol}
              {unitCost.toFixed(2)}
            </Text>

            <Pressable
              onPress={onSell}
              hitSlop={8}
              style={[styles.compactSellBtn, { backgroundColor: colors.gold }]}
              accessibilityRole="button"
              accessibilityLabel={translations.sellA11yLabel}
              accessibilityHint={translations.sellA11yLabel}
            >
              <AppIcon name="sell" size={14} color={theme.textOnAccent} />
            </Pressable>
          </ObsidianBlock>
        </Pressable>
      </Animated.View>
    );
  }

  // Full card view (list mode)
  return (
    <Animated.View
      entering={
        shouldAnimate
          ? FadeInDown.delay(index * ANIMATION_STAGGER).duration(300)
          : undefined
      }
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${displayBrand}. ${displayType}. ${translations.costLabel}: ${translations.currencySymbol}${unitCost.toFixed(2)}.`}
        accessibilityHint={translations.openDetailsHint}
        onPressIn={() => {
          scale.value = withSpring(0.98, SPRING_GRAVITY);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_GRAVITY);
        }}
      >
        <ObsidianBlock
          style={{
            flexDirection: "row",
            padding: 16,
          }}
        >
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: theme.surfaceSlab,
                overflow: "hidden",
              },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={`list-${item.id}`}
                placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              />
            ) : (
              <AppIcon name="checkroom" size={28} color={colors.textMuted} />
            )}
            {/* Lot indicator */}
            <View
              style={[styles.lotIndicator, { backgroundColor: colors.gold }]}
            >
              <Text
                style={[styles.lotIndicatorText, { color: theme.textOnAccent }]}
              >
                #{item.lotId}
              </Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardInfo}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Manrope_700Bold",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {displayBrand}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Manrope_400Regular",
                  color: colors.textMuted,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {displayType} {item.color ? `• ${item.color}` : ""}
              </Text>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.sizeBadge,
                    { backgroundColor: colors.goldSubtle },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Manrope_600SemiBold",
                      color: colors.gold,
                    }}
                  >
                    {displaySize}
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
                            : colors.textMuted,
                    },
                  ]}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Manrope_400Regular",
                    color: colors.textMuted,
                  }}
                >
                  {item.condition === "New"
                    ? translations.conditionNew
                    : item.condition === "Good"
                      ? translations.conditionGood
                      : translations.conditionUsed}
                </Text>
              </View>
              <View
                style={[styles.costTag, { backgroundColor: colors.goldSubtle }]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Manrope_600SemiBold",
                    color: colors.gold,
                  }}
                >
                  {translations.costLabel}: {translations.currencySymbol}
                  {unitCost.toFixed(2)}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.sellButtonWrapper}
              onPress={onSell}
              accessibilityRole="button"
              accessibilityLabel={translations.sellA11yLabel}
              accessibilityHint={translations.sellA11yLabel}
            >
              <View
                style={[styles.sellButton, { backgroundColor: colors.gold }]}
              >
                <AppIcon name="sell" size={16} color={theme.textOnAccent} />
                <Text
                  style={[styles.sellButtonText, { color: theme.textOnAccent }]}
                >
                  {translations.sellLabel}
                </Text>
              </View>
            </Pressable>
          </View>
        </ObsidianBlock>
      </Pressable>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 VANTA KPI SECTION - Monolith Style
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBar({
  stats,
  t,
  currencySymbol,
}: {
  stats: StockStats;
  t: TFunction;
  currencySymbol: string;
}) {
  const theme = useVantaTheme();

  // Barres de visualisation pour le capital
  const valueBars = [40, 70, 100, 60, 30];

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.kpiSection}>
      {/* Section Header */}
      <VantaSectionHeader
        label={t("dashboard.stats.overview", "Aperçu")}
        style={{ paddingHorizontal: 0, marginBottom: Spacing.xs }}
      />

      {/* Première rangée: Articles et Valeur */}
      <View style={styles.kpiRow}>
        <MonolithCard
          icon="inventory"
          label={t("items.title")}
          value={stats.totalItems}
          trend={`${stats.lotsCount} ${t("navigation.lots")}`}
          trendPositive
          style={{ flex: 1 }}
        />
        <MonolithCard
          icon="account-balance-wallet"
          topLabel={t("dashboard.capital", "Capital")}
          label={t("dashboard.stockValue")}
          value={`${currencySymbol}${stats.totalValue >= 1000 ? (stats.totalValue / 1000).toFixed(1) + "k" : stats.totalValue.toFixed(0)}`}
          bars={valueBars}
          style={{ flex: 1 }}
        />
      </View>

      {/* Deuxième rangée: Moyenne et Encryption badge */}
      <View style={styles.kpiRow}>
        <MonolithCard
          icon="analytics"
          label={t("dashboard.stats.avgMargin", "Coût Moyen")}
          value={`${currencySymbol}${stats.avgCost.toFixed(2)}`}
          trend={t("items.unitCost", "par article")}
          trendPositive
          style={{ flex: 1 }}
        />
        <MonolithCard
          icon="lock"
          topLabel="SECURE"
          label={t("common.encryption", "Encryption")}
          value="AES"
          unit="4096"
          hashLines
          style={{ flex: 1 }}
        />
      </View>
    </Animated.View>
  );
}

// Legacy stats bar kept for reference
function _LegacyStatsBar({
  stats,
  t,
  currencySymbol,
}: {
  stats: StockStats;
  t: TFunction;
  currencySymbol: string;
}) {
  const theme = useVantaTheme();
  const colors = {
    background: theme.surface,
    border: theme.borderGlass,
    text: theme.text,
    textMuted: theme.textMuted,
    gold: theme.primary,
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.statsBar}>
      <View
        style={[
          styles.statItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon name="inventory" size={16} color={colors.gold} />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: colors.text,
            }}
          >
            {stats.totalItems}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("items.title")}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon
          name="account-balance-wallet"
          size={16}
          color={theme.success}
        />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: theme.success,
            }}
          >
            {currencySymbol}
            {stats.totalValue.toFixed(0)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("dashboard.stockValue")}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon name="analytics" size={16} color={theme.warning} />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: colors.text,
            }}
          >
            {currencySymbol}
            {stats.avgCost.toFixed(2)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("dashboard.stats.avgMargin", "Moy.")}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 VANTA SEARCH BAR
// ═══════════════════════════════════════════════════════════════════════════════

function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const colors = {
    background: theme.surface,
    border: theme.borderGlass,
    text: theme.text,
    textMuted: theme.textMuted,
  };

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <AppIcon name="search" size={20} color={colors.textMuted} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          accessibilityHint={t("accessibility.search")}
        >
          <AppIcon name="close" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 MAIN SCREEN - VANTA STOCK
// ═══════════════════════════════════════════════════════════════════════════════

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const { isReduceMotionEnabled } = useAccessibility();
  const { t } = useLocale();
  const currency = useSettingsStore((state) => state.currency);
  const currencySymbol = CURRENCY_MAP[currency] || currency;

  // Screen tracking
  useTrackScreen("stock");

  // Vanta theme colors — memoized to stabilize useCallback deps
  const colors = useMemo(
    () => ({
      background: theme.background,
      surface: theme.surface,
      border: theme.borderGlass,
      text: theme.text,
      textSecondary: theme.textSecondary,
      textMuted: theme.textMuted,
      gold: theme.primary,
      goldSubtle: theme.primarySubtle,
    }),
    [
      theme.background,
      theme.surface,
      theme.borderGlass,
      theme.text,
      theme.textSecondary,
      theme.textMuted,
      theme.primary,
      theme.primarySubtle,
    ],
  );

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

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showVisibilityController, setShowVisibilityController] =
    useState(false);
  const [hiddenLotIds, setHiddenLotIds] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);

  // Translated sort options
  const sortOptions = useMemo(() => getSortOptions(t), [t]);

  // ============ DATA LOADING ============

  useFocusEffect(
    useCallback(() => {
      refetchItems();
      refetchLots();
    }, [refetchItems, refetchLots]),
  );

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setHasAnimated(true), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, allItems, lots]);

  // ============ GROUPING BY LOT (Netflix Style) ============

  const lotCarousels = useMemo<LotCarouselData[]>(() => {
    // Group items by lot
    const lotMap = new Map<number, Item[]>();

    // First filter by search query
    let filteredItems = [...allItems];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredItems = filteredItems.filter(
        (item) =>
          item.brand?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query) ||
          item.color?.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query) ||
          `lot ${item.lotId}`.includes(query) ||
          `#${item.id}`.includes(query),
      );
    }

    // Sort items within each lot
    const sortItems = (items: Item[]) => {
      switch (sortBy) {
        case "newest":
          return items.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        case "oldest":
          return items.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          });
        case "cost_high":
          return items.sort(
            (a, b) =>
              parseFloat(String(b.unitCost)) - parseFloat(String(a.unitCost)),
          );
        case "cost_low":
          return items.sort(
            (a, b) =>
              parseFloat(String(a.unitCost)) - parseFloat(String(b.unitCost)),
          );
        default:
          return items;
      }
    };

    // Group by lotId
    filteredItems.forEach((item) => {
      const existing = lotMap.get(item.lotId) || [];
      lotMap.set(item.lotId, [...existing, item]);
    });

    // Create carousel data for each lot
    const carousels: LotCarouselData[] = [];
    lots.forEach((lot) => {
      const items = lotMap.get(lot.id) || [];
      if (items.length > 0 && !hiddenLotIds.has(lot.id)) {
        carousels.push({
          lot,
          items: sortItems(items).slice(0, ITEMS_PER_CAROUSEL),
        });
      }
    });

    return carousels;
  }, [allItems, lots, searchQuery, sortBy, hiddenLotIds]);

  // Stats
  const stats = useMemo<StockStats>(() => {
    const totalValue = allItems.reduce(
      (sum, i) => sum + parseFloat(String(i.unitCost)),
      0,
    );
    const uniqueLots = new Set(allItems.map((i) => i.lotId)).size;

    return {
      totalItems: allItems.length,
      totalValue,
      avgCost: allItems.length > 0 ? totalValue / allItems.length : 0,
      lotsCount: uniqueLots,
    };
  }, [allItems]);

  // Lot visibility items for controller
  // Pre-compute item count per lot — O(n) instead of O(lots × items)
  const itemCountByLot = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of allItems) {
      map.set(item.lotId, (map.get(item.lotId) ?? 0) + 1);
    }
    return map;
  }, [allItems]);

  const lotVisibilityItems = useMemo<LotVisibilityItem[]>(() => {
    return lots.map((lot) => ({
      id: lot.id,
      name: lot.name || `Lot #${lot.id}`,
      itemCount: itemCountByLot.get(lot.id) ?? 0,
      isVisible: !hiddenLotIds.has(lot.id),
    }));
  }, [lots, itemCountByLot, hiddenLotIds]);

  // ============ HANDLERS ============

  const handleSell = useCallback((item: CarouselItem) => {
    router.push({
      pathname: "/sales/new",
      params: { itemId: item.id, lotId: item.lotId },
    });
  }, []);

  const handleItemPress = useCallback((item: CarouselItem) => {
    router.push(`/items/${item.id}`);
  }, []);

  const handleSeeAllPress = useCallback((lotId: number) => {
    // Navigate to lot detail or filter by this lot
    router.push(`/lots/${lotId}`);
  }, []);

  const handleRefresh = useCallback(() => {
    setHasAnimated(false);
    refetchItems();
    refetchLots();
  }, [refetchItems, refetchLots]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    Keyboard.dismiss();
  }, []);

  const handleSortChange = useCallback((option: SortOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortBy(option);
    setShowSortMenu(false);
  }, []);

  const handleToggleLotVisibility = useCallback((lotId: number) => {
    setHiddenLotIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lotId)) {
        newSet.delete(lotId);
      } else {
        newSet.add(lotId);
      }
      return newSet;
    });
  }, []);

  const handleShowAllLots = useCallback(() => {
    setHiddenLotIds(new Set());
  }, []);

  const handleHideAllLots = useCallback(() => {
    setHiddenLotIds(new Set(lots.map((l) => l.id)));
  }, [lots]);

  // ============ RENDER ============

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    if (searchQuery) {
      return (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <AppIcon name="search-off" size={48} color={colors.textMuted} />
          </View>
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 18,
              color: colors.text,
              marginTop: Spacing.lg,
            }}
          >
            {t("common.noResults")}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: Spacing.xs,
            }}
          >
            {t("common.noResults")} "{searchQuery}"
          </Text>
          <Pressable
            onPress={handleClearSearch}
            style={{
              marginTop: Spacing.lg,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
            }}
          >
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 14,
                color: colors.gold,
              }}
            >
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View
          style={[styles.emptyIcon, { backgroundColor: colors.goldSubtle }]}
        >
          <AppIcon name="checkroom" size={48} color={colors.gold} />
        </View>
        <Text
          style={{
            fontFamily: "Manrope_700Bold",
            fontSize: 18,
            color: colors.text,
            marginTop: Spacing.lg,
          }}
        >
          {t("items.empty.title")}
        </Text>
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            textAlign: "center",
            marginTop: Spacing.xs,
          }}
        >
          {t("items.empty.description")}
        </Text>
        <Pressable
          onPress={() => router.push("/lots/new")}
          style={{
            marginTop: Spacing.xl,
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.xs,
            backgroundColor: colors.gold,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl,
            borderRadius: 16,
          }}
          accessibilityRole="button"
          accessibilityLabel={t("lots.newLot")}
        >
          <AppIcon name="add" size={18} color={theme.textOnAccent} />
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 14,
              color: theme.textOnAccent,
            }}
          >
            {t("lots.newLot")}
          </Text>
        </Pressable>
      </View>
    );
  }, [loading, searchQuery, colors, handleClearSearch, t, theme]);

  // Visible lot count for header
  const visibleLotCount = lots.length - hiddenLotIds.size;

  return (
    <VantaScreen>
      {/* Floating Header - Vanta Style */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
        />
        <View style={styles.headerContent}>
          <View>
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 28,
                color: colors.text,
              }}
            >
              {t("navigation.stock")}
            </Text>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {allItems.length} {t("items.title")} · {visibleLotCount} lots
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Lot Visibility Controller Button */}
            <Pressable
              style={[
                styles.headerBtn,
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor:
                    hiddenLotIds.size > 0 ? Palette.metal.gold : colors.border,
                },
              ]}
              onPress={() => {
                Haptic.selection();
                setShowVisibilityController(true);
              }}
              accessibilityLabel={t("accessibility.manageLotVisibility", {
                visible: visibleLotCount,
                total: lots.length,
              })}
              accessibilityRole="button"
            >
              <AppIcon
                name={hiddenLotIds.size > 0 ? "visibility-off" : "visibility"}
                size={20}
                color={
                  hiddenLotIds.size > 0
                    ? Palette.metal.gold
                    : colors.textSecondary
                }
              />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, paddingTop: insets.top + 90 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={handleClearSearch}
            placeholder={t("common.search")}
          />

          {/* Sort Button */}
          <Pressable
            style={[
              styles.sortButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptic.selection();
              setShowSortMenu(!showSortMenu);
            }}
            accessibilityLabel={t("accessibility.sortItems")}
            accessibilityRole="button"
          >
            <AppIcon
              name={
                (sortOptions.find((o) => o.key === sortBy)?.icon as any) ||
                "sort"
              }
              size={18}
              color={colors.gold}
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
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {sortOptions.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && {
                    backgroundColor: colors.goldSubtle,
                  },
                ]}
                onPress={() => handleSortChange(option.key)}
              >
                <AppIcon
                  name={option.icon as any}
                  size={16}
                  color={
                    sortBy === option.key ? colors.gold : colors.textSecondary
                  }
                />
                <Text
                  style={{
                    fontFamily: "Manrope_500Medium",
                    fontSize: 14,
                    color: sortBy === option.key ? colors.gold : colors.text,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Stats Bar */}
        {allItems.length > 0 && (
          <StatsBar stats={stats} t={t} currencySymbol={currencySymbol} />
        )}

        {/* Loading State */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <SkeletonList count={6} />
          </View>
        ) : lotCarousels.length === 0 ? (
          renderEmpty()
        ) : (
          /* Netflix-style Carousels by Lot */
          lotCarousels.map((carouselData) => (
            <NetflixCarousel
              key={carouselData.lot.id}
              lotId={carouselData.lot.id}
              lotName={carouselData.lot.name || `Lot #${carouselData.lot.id}`}
              items={carouselData.items.map((item) => ({
                id: item.id,
                brand: item.brand,
                type: item.type,
                unitCost: item.unitCost,
                color: item.color,
                size: item.size,
                photoUri: getItemFirstPhoto(item),
                lotId: item.lotId,
              }))}
              itemCount={itemCountByLot.get(carouselData.lot.id) ?? 0}
              onItemPress={handleItemPress}
              onSellPress={handleSell}
              onSeeAllPress={() => handleSeeAllPress(carouselData.lot.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Lot Visibility Controller Sheet */}
      <LotVisibilityController
        visible={showVisibilityController}
        lots={lotVisibilityItems}
        onToggle={handleToggleLotVisibility}
        onClose={() => setShowVisibilityController(false)}
        onShowAll={handleShowAllLots}
        onHideAll={handleHideAllLots}
      />
    </VantaScreen>
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
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
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
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
  },
  sortButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  sortMenu: {
    position: "absolute",
    top: 130,
    right: Spacing.xl,
    zIndex: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
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
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  // Section KPI Vanta Monolith
  kpiSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  kpiRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  filterBar: {
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    backgroundColor: "transparent",
  },
  emptyList: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  itemSeparator: {
    height: Spacing.sm,
  },
  itemSeparatorCompact: {
    height: 4,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },

  // Full Card Styles - Premium Glassmorphic
  itemCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderCurve: "continuous",
  },
  imageContainer: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    position: "relative",
    borderCurve: "continuous",
  },
  lotIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },
  sellButtonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },

  // Compact Card Styles - Premium
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    borderCurve: "continuous",
  },
  compactInfo: {
    flex: 1,
  },
  compactSellBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },

  // Grid Card Styles
  gridRow: {
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  gridCardWrapper: {
    flex: 1,
    padding: Spacing.xs,
  },
  gridCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    borderCurve: "continuous",
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
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
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
