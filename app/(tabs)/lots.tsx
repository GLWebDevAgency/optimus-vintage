/**
 * 📦 LOTS SCREEN - Ultra Premium Edition
 * Premium lot management with world-class animations
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { PremiumButton, PremiumScreen } from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { LotSummary, LotsRepository } from "@/db/repositories";
import { useTrackScreen } from "@/utils/analytics";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router, useFocusEffect } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Keyboard,
    LayoutAnimation,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isAndroid = process.env.EXPO_OS === "android";

// Enable LayoutAnimation for Android
if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============

type SortOption =
  | "newest"
  | "oldest"
  | "investment_high"
  | "investment_low"
  | "revenue"
  | "delta";

interface LotsStats {
  totalLots: number;
  totalInvestment: number;
  totalRevenue: number;
  totalDelta: number;
  totalItems: number;
  totalSold: number;
}

// ============ CONSTANTS ============

const ANIMATION_STAGGER = 50;
const MAX_ANIMATED_ITEMS = 8;

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Plus récent", icon: "schedule" },
  { key: "oldest", label: "Plus ancien", icon: "history" },
  { key: "investment_high", label: "Invest ↓", icon: "trending-down" },
  { key: "investment_low", label: "Invest ↑", icon: "trending-up" },
  { key: "revenue", label: "Revenue", icon: "attach-money" },
  { key: "delta", label: "Delta", icon: "warning" },
];

// ============ LOT CARD COMPONENT ============

interface LotCardProps {
  lot: LotSummary;
  index: number;
  shouldAnimate: boolean;
}

const LotCard = React.memo(function LotCard({
  lot,
  index,
  shouldAnimate,
}: LotCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  // Theme mapping
  const theme = {
    surfaceCard: isDark ? Theme.dark.surface : Theme.light.surface,
    border: isDark ? Theme.dark.border : Theme.light.border,
    primary: Theme.light.primary,
    primarySubtle: Theme.light.primarySubtle,
    text: isDark ? Theme.dark.text : Theme.light.text,
    textMuted: isDark ? Theme.dark.textMuted : Theme.light.textMuted,
    success: Theme.light.success,
    successSubtle: Theme.light.successSubtle,
    danger: Theme.light.danger,
    surfaceHover: isDark ? Palette.neutral[800] : Palette.neutral[100],
  };

  const investment = parseFloat(String(lot.totalInvestment)) || 0;
  const revenue = parseFloat(String(lot.totalRevenue)) || 0;
  const delta = parseFloat(String(lot.delta)) || 0;
  const soldCount = parseInt(String(lot.soldCount)) || 0;
  const initialQty = lot.initialQuantity || 0;

  const isProfitable = revenue >= investment;
  const progressPercent = initialQty > 0 ? (soldCount / initialQty) * 100 : 0;

  const handlePress = useCallback(() => {
    Haptic.selection();
    router.push(`/lots/${lot.id}`);
  }, [lot.id]);

  return (
    <Animated.View
      entering={
        shouldAnimate
          ? SlideInRight.delay(index * ANIMATION_STAGGER).duration(300)
          : undefined
      }
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.lotCard,
          {
            backgroundColor: theme.surfaceCard,
            borderColor: pressed ? theme.primary : theme.border,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            boxShadow: pressed
              ? `0 2px 8px rgba(0,0,0,0.1)`
              : `0 4px 16px rgba(0,0,0,0.06), 0 8px 24px ${theme.primary}10`,
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: theme.primarySubtle,
                boxShadow: `0 4px 12px ${theme.primary}25`,
              },
            ]}
          >
            <AppIcon name="inventory-2" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text
              style={[Typography.heading.sm, { color: theme.text }]}
              numberOfLines={1}
            >
              {lot.name || `Lot #${lot.id}`}
            </Text>
            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
              {lot.provider || "N/A"} • {lot.buyDate}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isProfitable
                  ? theme.successSubtle
                  : theme.primarySubtle,
              },
            ]}
          >
            <Text
              style={[
                Typography.label.xs,
                { color: isProfitable ? theme.success : theme.primary },
              ]}
            >
              {isProfitable ? "Profit" : "En cours"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
              ARTICLES
            </Text>
            <Text style={[Typography.number.md, { color: theme.text }]}>
              {initialQty}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
              INVESTI
            </Text>
            <Text style={[Typography.number.md, { color: theme.text }]}>
              €{investment.toFixed(0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
              REVENU
            </Text>
            <Text style={[Typography.number.md, { color: theme.text }]}>
              €{revenue.toFixed(0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
              DELTA
            </Text>
            <Text
              style={[
                Typography.number.md,
                { color: isProfitable ? theme.success : theme.danger },
              ]}
            >
              {isProfitable ? "+" : "-"}€
              {Math.abs(revenue - investment).toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.surfaceHover },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.min(progressPercent, 100)}%`,
                    boxShadow:
                      progressPercent > 0
                        ? `0 0 10px ${theme.primary}60, 0 0 4px ${theme.primary}40`
                        : "none",
                  },
                ]}
              />
            </View>
            <Text
              style={[
                Typography.label.xs,
                {
                  color: theme.textMuted,
                  fontWeight: "600",
                },
              ]}
            >
              {soldCount}/{initialQty}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ============ STATS BAR COMPONENT ============

interface PremiumTheme {
  surface: string;
  border: string;
  primary: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  success: string;
  danger: string;
  warning: string;
  surfaceCard: string;
  primarySubtle: string;
  successSubtle: string;
  surfaceHover: string;
  background: string;
}

function StatsBar({ stats, theme }: { stats: LotsStats; theme: PremiumTheme }) {
  const profit = stats.totalRevenue - stats.totalInvestment;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.statsBar}>
      <View
        style={[
          styles.statsBarItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon name="folder" size={16} color={theme.primary} />
        <View>
          <Text style={[Typography.number.sm, { color: theme.text }]}>
            {stats.totalLots}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Lots
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statsBarItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon
          name="account-balance-wallet"
          size={16}
          color={theme.warning}
        />
        <View>
          <Text style={[Typography.number.sm, { color: theme.text }]}>
            €{stats.totalInvestment.toFixed(0)}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Investi
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statsBarItem,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <AppIcon
          name="trending-up"
          size={16}
          color={profit >= 0 ? theme.success : theme.danger}
        />
        <View>
          <Text
            style={[
              Typography.number.sm,
              { color: profit >= 0 ? theme.success : theme.danger },
            ]}
          >
            {profit >= 0 ? "+" : ""}€{profit.toFixed(0)}
          </Text>
          <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
            Profit
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
  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <AppIcon name="search" size={20} color={theme.textMuted} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Rechercher lot, fournisseur..."
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

export default function LotsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const flashListRef = useRef<FlashListRef<LotSummary>>(null);
  const { t } = useLocale();

  // Screen tracking
  useTrackScreen("lots");

  // Premium theme
  const theme: PremiumTheme = {
    surface: isDark ? Theme.dark.surface : Theme.light.surface,
    surfaceCard: isDark ? Theme.dark.surface : Theme.light.surface,
    surfaceHover: isDark ? Palette.neutral[800] : Palette.neutral[100],
    background: isDark ? Theme.dark.background : Theme.light.background,
    border: isDark ? Theme.dark.border : Theme.light.border,
    primary: Theme.light.primary,
    primarySubtle: Theme.light.primarySubtle,
    text: isDark ? Theme.dark.text : Theme.light.text,
    textMuted: isDark ? Theme.dark.textMuted : Theme.light.textMuted,
    textSecondary: isDark
      ? Theme.dark.textSecondary
      : Theme.light.textSecondary,
    success: Theme.light.success,
    successSubtle: Theme.light.successSubtle,
    danger: Theme.light.danger,
    warning: Theme.light.warning,
  };

  // Data state
  const lotsQuery = useQuery({
    queryKey: ["lots-summary"],
    queryFn: () => LotsRepository.getSummary(),
  });
  const { refetch } = lotsQuery;
  const loading = lotsQuery.isLoading;
  const refreshing = lotsQuery.isFetching && !loading;
  const lots = lotsQuery.data ?? [];

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setHasAnimated(true), 400);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [loading, lots]);

  // ============ FILTERING & SORTING ============

  const processedLots = useMemo(() => {
    let result = [...lots];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (lot) =>
          lot.name?.toLowerCase().includes(query) ||
          lot.provider?.toLowerCase().includes(query) ||
          `lot #${lot.id}`.toLowerCase().includes(query) ||
          `#${lot.id}`.includes(query),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime(),
        );
        break;
      case "investment_high":
        result.sort(
          (a, b) =>
            parseFloat(String(b.totalInvestment)) -
            parseFloat(String(a.totalInvestment)),
        );
        break;
      case "investment_low":
        result.sort(
          (a, b) =>
            parseFloat(String(a.totalInvestment)) -
            parseFloat(String(b.totalInvestment)),
        );
        break;
      case "revenue":
        result.sort(
          (a, b) =>
            parseFloat(String(b.totalRevenue)) -
            parseFloat(String(a.totalRevenue)),
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

  // Stats
  const stats = useMemo<LotsStats>(() => {
    return lots.reduce(
      (acc, lot) => {
        const investment = parseFloat(String(lot.totalInvestment)) || 0;
        const revenue = parseFloat(String(lot.totalRevenue)) || 0;
        const delta = parseFloat(String(lot.delta)) || 0;
        const soldCount = parseInt(String(lot.soldCount)) || 0;
        const initialQty = lot.initialQuantity || 0;

        return {
          totalLots: acc.totalLots + 1,
          totalInvestment: acc.totalInvestment + investment,
          totalRevenue: acc.totalRevenue + revenue,
          totalDelta: acc.totalDelta + delta,
          totalItems: acc.totalItems + initialQty,
          totalSold: acc.totalSold + soldCount,
        };
      },
      {
        totalLots: 0,
        totalInvestment: 0,
        totalRevenue: 0,
        totalDelta: 0,
        totalItems: 0,
        totalSold: 0,
      },
    );
  }, [lots]);

  // ============ HANDLERS ============

  const handleRefresh = useCallback(() => {
    setHasAnimated(false);
    refetch();
  }, [refetch]);

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

  // ============ RENDER ============

  const renderItem = useCallback(
    ({ item, index }: { item: LotSummary; index: number }) => (
      <LotCard
        lot={item}
        index={index}
        shouldAnimate={!hasAnimated && index < MAX_ANIMATED_ITEMS}
      />
    ),
    [hasAnimated],
  );

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
            Aucun lot ne correspond à "{searchQuery}"
          </Text>
          <Pressable
            onPress={handleClearSearch}
            style={{
              marginTop: Spacing.lg,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
            }}
          >
            <Text style={[Typography.body.md, { color: theme.primary }]}>
              Effacer la recherche
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View
          style={[styles.emptyIcon, { backgroundColor: theme.primarySubtle }]}
        >
          <AppIcon name="inventory-2" size={48} color={theme.primary} />
        </View>
        <Text
          style={[
            Typography.heading.md,
            { color: theme.text, marginTop: Spacing.lg },
          ]}
        >
          Aucun lot
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
          Commencez à suivre vos achats{"\n"}en créant votre premier lot
        </Text>
        <PremiumButton
          icon="add"
          variant="primary"
          onPress={() => router.push("/lots/new")}
          style={{ marginTop: Spacing.xl }}
        >
          Créer un lot
        </PremiumButton>
      </View>
    );
  }, [loading, searchQuery, theme, handleClearSearch]);

  const keyExtractor = useCallback(
    (item: LotSummary) => item.id.toString(),
    [],
  );

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
              Mes Lots
            </Text>
            <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>
              {processedLots.length} lot{processedLots.length !== 1 ? "s" : ""}{" "}
              • {stats.totalItems} pièces
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptic.impactMedium();
              router.push("/lots/new");
            }}
          >
            <AppIcon name="add" size={24} color={Palette.neutral.white} />
          </Pressable>
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
        {lots.length > 0 && <StatsBar stats={stats} theme={theme} />}

        {/* Lots List - FlashList for performance */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <SkeletonList count={5} />
          </View>
        ) : (
          <FlashList
            ref={flashListRef}
            data={processedLots}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    // Premium glow
    boxShadow: `
      0 4px 16px rgba(16, 185, 129, 0.4),
      0 2px 8px rgba(16, 185, 129, 0.3)
    `,
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
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,
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
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,
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
  statsBarItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  lotCard: {
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderCurve: "continuous",
    // Ultra premium multi-layer shadow
    boxShadow: `
      0 1px 2px rgba(0, 0, 0, 0.02),
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(0, 0, 0, 0.04),
      0 16px 32px rgba(16, 185, 129, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.7)
    `,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    // Premium glow effect
    boxShadow: `
      0 4px 12px rgba(16, 185, 129, 0.25),
      0 2px 6px rgba(16, 185, 129, 0.15),
      inset 0 1px 2px rgba(255,255,255,0.2)
    `,
  },
  cardTitleContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderCurve: "continuous",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    minWidth: 60,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    // Inset shadow for depth
    boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.08)`,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    // Premium gradient-like glow on progress
    boxShadow: `
      0 0 12px rgba(16, 185, 129, 0.5),
      0 2px 8px rgba(16, 185, 129, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
  },
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
