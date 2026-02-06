/**
 * 📦 LOTS SCREEN - Vanta-Aether Architecture
 * "Digital Architecture evolving in infinite spatial void"
 *
 * v3.0 - Enhanced Vanta-Aether with Premium KPIs
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import { VantaScreen, useVantaTheme } from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
    GoldFissureProgress,
    MonolithCard,
    VantaStatusBadge,
} from "@/components/ui/VantaComponents";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { LotSummary, LotsRepository } from "@/db/repositories";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { useSettingsStore } from "@/store/settings";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
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
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isAndroid = process.env.EXPO_OS === "android";

// Enable LayoutAnimation for Android
if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Gravity-based spring physics
const SPRING_GRAVITY = {
  damping: 22,
  stiffness: 180,
  mass: 1.2,
};

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

const SORT_OPTIONS: { key: SortOption; labelKey: string; icon: string }[] = [
  { key: "newest", labelKey: "lots.sort.newest", icon: "schedule" },
  { key: "oldest", labelKey: "lots.sort.oldest", icon: "history" },
  {
    key: "investment_high",
    labelKey: "lots.sort.investmentHigh",
    icon: "trending-down",
  },
  {
    key: "investment_low",
    labelKey: "lots.sort.investmentLow",
    icon: "trending-up",
  },
  { key: "revenue", labelKey: "lots.sort.revenue", icon: "attach-money" },
  { key: "delta", labelKey: "lots.sort.delta", icon: "warning" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 OBSIDIAN BLOCK - Base Component
// "Polished Obsidian with surgical reflections"
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 VANTA LOT CARD - Kinetic Card Component
// ═══════════════════════════════════════════════════════════════════════════════

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
  const theme = useVantaTheme();
  const scale = useSharedValue(1);
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = ({ EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" } as Record<string, string>)[currency] || "€";

  // Theme tokens
  const colors = {
    background: theme.surface,
    border: theme.borderGlass,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    gold: theme.primary,
    goldSubtle: theme.primarySubtle,
  };

  const investment = parseFloat(String(lot.totalInvestment)) || 0;
  const revenue = parseFloat(String(lot.totalRevenue)) || 0;
  const soldCount = parseInt(String(lot.soldCount)) || 0;
  const initialQty = lot.initialQuantity || 0;

  const isProfitable = revenue >= investment;
  const progressPercent = initialQty > 0 ? (soldCount / initialQty) * 100 : 0;

  const handlePress = useCallback(() => {
    Haptic.selection();
    router.push(`/lots/${lot.id}`);
  }, [lot.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={
        shouldAnimate
          ? SlideInRight.delay(index * ANIMATION_STAGGER).duration(300)
          : undefined
      }
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${lot.name || `Lot #${lot.id}`}. ${t("lots.investment")}: ${currencySymbol}${investment.toFixed(0)}. ${t("lots.revenue")}: ${currencySymbol}${revenue.toFixed(0)}.`}
        accessibilityHint={t("accessibility.openDetails")}
        onPressIn={() => {
          scale.value = withSpring(0.98, SPRING_GRAVITY);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_GRAVITY);
        }}
      >
        <ObsidianBlock
          style={{
            padding: 20,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {/* Left accent line - Vanta signature */}
          <View
            pointerEvents="none"
            style={[
              styles.cardAccent,
              {
                backgroundColor: isProfitable ? theme.success : theme.primary,
              },
            ]}
          />
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.goldSubtle },
              ]}
            >
              <AppIcon name="inventory-2" size={24} color={colors.gold} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: "Manrope_700Bold",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {lot.name || `Lot #${lot.id}`}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Manrope_400Regular",
                  color: colors.textMuted,
                }}
              >
                {lot.provider || "N/A"} • {lot.buyDate}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isProfitable
                    ? theme.successSubtle
                    : colors.goldSubtle,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Manrope_700Bold",
                  color: isProfitable ? theme.success : colors.gold,
                }}
              >
                {isProfitable
                  ? t("lots.status.profitable")
                  : t("lots.status.inProgress")}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.borderGlass,
              },
            ]}
          />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.textMuted,
                  letterSpacing: 1,
                }}
              >
                {t("items.title").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Manrope_700Bold",
                  color: colors.text,
                  marginTop: 4,
                }}
              >
                {initialQty}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.textMuted,
                  letterSpacing: 1,
                }}
              >
                {t("lots.investment").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Manrope_700Bold",
                  color: colors.text,
                  marginTop: 4,
                }}
              >
                {currencySymbol}{investment.toFixed(0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.textMuted,
                  letterSpacing: 1,
                }}
              >
                {t("lots.revenue").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Manrope_700Bold",
                  color: colors.text,
                  marginTop: 4,
                }}
              >
                {currencySymbol}{revenue.toFixed(0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.textMuted,
                  letterSpacing: 1,
                }}
              >
                {t("lots.delta").toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Manrope_700Bold",
                  color: isProfitable ? theme.success : theme.danger,
                  marginTop: 4,
                }}
              >
                {isProfitable ? "+" : "-"}{currencySymbol}
                {Math.abs(revenue - investment).toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor: theme.borderGlass,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.gold,
                      width: `${Math.min(progressPercent, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Manrope_600SemiBold",
                  color: colors.textMuted,
                  minWidth: 45,
                  textAlign: "right",
                }}
              >
                {soldCount}/{initialQty}
              </Text>
            </View>
          </View>
        </ObsidianBlock>
      </Pressable>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 VANTA KPI SECTION - Monolith Style
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBar({ stats }: { stats: LotsStats }) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = ({ EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" } as Record<string, string>)[currency] || "€";
  const profit = stats.totalRevenue - stats.totalInvestment;
  const profitPercent =
    stats.totalInvestment > 0
      ? ((profit / stats.totalInvestment) * 100).toFixed(0)
      : "0";
  const isProfitable = profit >= 0;

  // Calcul des barres de visualisation basées sur les stats
  const investmentBars = [40, 70, 100, 60, 30];
  const progressPercent =
    stats.totalItems > 0 ? (stats.totalSold / stats.totalItems) * 100 : 0;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.kpiSection}>
      {/* Première rangée: Investissement et Profit */}
      <View style={styles.kpiRow}>
        <MonolithCard
          icon="account-balance-wallet"
          label={t("lots.investment")}
          value={`${currencySymbol}${stats.totalInvestment >= 1000 ? (stats.totalInvestment / 1000).toFixed(1) + "k" : stats.totalInvestment.toFixed(0)}`}
          trend={`${stats.totalLots} lots`}
          trendPositive
          bars={investmentBars}
          style={{ flex: 1 }}
        />
        <MonolithCard
          icon="trending-up"
          topLabel={
            isProfitable ? t("lots.status.profitable") : t("lots.delta")
          }
          label={t("lots.profit")}
          value={`${isProfitable ? "+" : ""}${currencySymbol}${Math.abs(profit) >= 1000 ? (Math.abs(profit) / 1000).toFixed(1) + "k" : Math.abs(profit).toFixed(0)}`}
          trend={`${isProfitable ? "+" : ""}${profitPercent}%`}
          trendPositive={isProfitable}
          style={{ flex: 1 }}
        />
      </View>

      {/* Deuxième rangée: Revenue et Progress */}
      <View style={styles.kpiRow}>
        <MonolithCard
          icon="payments"
          label={t("lots.revenue")}
          value={`${currencySymbol}${stats.totalRevenue >= 1000 ? (stats.totalRevenue / 1000).toFixed(1) + "k" : stats.totalRevenue.toFixed(0)}`}
          trend={`${stats.totalSold} ${t("lots.sold")}`}
          trendPositive
          style={{ flex: 1 }}
        />
        <View
          style={[
            styles.progressMonolith,
            { backgroundColor: theme.surface, borderColor: theme.borderGlass },
          ]}
        >
          <View style={styles.progressMonolithHeader}>
            <AppIcon name="inventory-2" size={18} color={theme.textMuted} />
            <Text
              style={[styles.progressMonolithLabel, { color: theme.textMuted }]}
            >
              {t("items.title").toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.progressMonolithValue, { color: theme.text }]}>
            {stats.totalSold}/{stats.totalItems}
          </Text>
          <GoldFissureProgress
            percentage={progressPercent}
            height={6}
            rightLabel={`${progressPercent.toFixed(0)}%`}
          />
        </View>
      </View>

      {/* Status Badge */}
      <VantaStatusBadge
        icon="lock"
        label="Données synchronisées"
        bars={3}
        style={{ marginTop: Spacing.sm, alignSelf: "center" }}
      />
    </Animated.View>
  );
}

// Legacy stats bar kept for reference
function _LegacyStatsBar({ stats }: { stats: LotsStats }) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = ({ EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" } as Record<string, string>)[currency] || "€";
  const profit = stats.totalRevenue - stats.totalInvestment;

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
          styles.statsBarItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon name="folder" size={16} color={colors.gold} />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: colors.text,
            }}
          >
            {stats.totalLots}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("navigation.lots")}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statsBarItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon
          name="account-balance-wallet"
          size={16}
          color={theme.warning}
        />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: colors.text,
            }}
          >
            {currencySymbol}{stats.totalInvestment.toFixed(0)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("lots.investment")}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statsBarItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <AppIcon
          name="trending-up"
          size={16}
          color={profit >= 0 ? theme.success : theme.danger}
        />
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Manrope_700Bold",
              color: profit >= 0 ? theme.success : theme.danger,
            }}
          >
            {profit >= 0 ? "+" : ""}{currencySymbol}{profit.toFixed(0)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
            }}
          >
            {t("lots.profit")}
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
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
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
        placeholder={t("common.search")}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={t("accessibility.search")}
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
          accessibilityHint={t("common.search")}
        >
          <AppIcon name="close" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 MAIN SCREEN - VANTA LOTS
// ═══════════════════════════════════════════════════════════════════════════════

export default function LotsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const flashListRef = useRef<FlashListRef<LotSummary>>(null);
  const { isReduceMotionEnabled } = useAccessibility();
  const { t } = useLocale();

  // Screen tracking
  useTrackScreen("lots");

  // Vanta theme colors
  const colors = {
    background: theme.background,
    surface: theme.surface,
    border: theme.borderGlass,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    gold: theme.primary,
    goldSubtle: theme.primarySubtle,
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
        shouldAnimate={
          !isReduceMotionEnabled && !hasAnimated && index < MAX_ANIMATED_ITEMS
        }
      />
    ),
    [hasAnimated, isReduceMotionEnabled],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    if (searchQuery) {
      return (
        <View style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.goldSubtle }]}
          >
            <AppIcon name="search-off" size={48} color={colors.textMuted} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Manrope_700Bold",
              color: colors.text,
              marginTop: 20,
            }}
          >
            {t("common.noResults")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Manrope_400Regular",
              color: colors.textMuted,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {`${t("common.noResults")}: "${searchQuery}"`}
          </Text>
          <Pressable
            onPress={handleClearSearch}
            style={{
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Manrope_600SemiBold",
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
          <AppIcon name="inventory-2" size={48} color={colors.gold} />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontFamily: "Manrope_700Bold",
            color: colors.text,
            marginTop: 20,
          }}
        >
          {t("lots.empty.title")}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Manrope_400Regular",
            color: colors.textMuted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {t("lots.empty.description")}
        </Text>
        <Pressable
          onPress={() => router.push("/lots/new")}
          style={{
            marginTop: 24,
            backgroundColor: colors.gold,
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AppIcon name="add" size={20} color={theme.textOnAccent} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Manrope_700Bold",
              color: theme.textOnAccent,
            }}
          >
            {t("lots.newLot")}
          </Text>
        </Pressable>
      </View>
    );
  }, [loading, searchQuery, colors, handleClearSearch, t, theme]);

  const keyExtractor = useCallback(
    (item: LotSummary) => item.id.toString(),
    [],
  );

  // ListHeaderComponent to include Stats in scroll
  const renderHeader = useCallback(() => {
    if (lots.length === 0) return null;
    return <StatsBar stats={stats} />;
  }, [lots.length, stats]);

  return (
    <VantaScreen style={styles.container}>
      {/* Vanta Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text
              style={{
                fontSize: 28,
                fontFamily: "Manrope_800ExtraBold",
                color: colors.text,
                letterSpacing: -0.5,
              }}
            >
              {t("lots.title")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Manrope_400Regular",
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              {processedLots.length} lot{processedLots.length !== 1 ? "s" : ""}{" "}
              • {stats.totalItems} pièces
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.gold }]}
            onPress={() => {
              Haptic.impactMedium();
              router.push("/lots/new");
            }}
            accessibilityRole="button"
            accessibilityLabel={t("lots.newLot")}
          >
            <AppIcon name="add" size={24} color={theme.textOnAccent} />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 16 }}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={handleClearSearch}
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
            accessibilityRole="button"
            accessibilityLabel={t("common.sort")}
          >
            <AppIcon
              name={
                (SORT_OPTIONS.find((o) => o.key === sortBy)?.icon as any) ||
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
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && {
                    backgroundColor: colors.goldSubtle,
                  },
                ]}
                onPress={() => handleSortChange(option.key)}
                accessibilityRole="button"
                accessibilityLabel={t(option.labelKey)}
                accessibilityState={{ selected: sortBy === option.key }}
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
                    fontSize: 14,
                    fontFamily: "Manrope_500Medium",
                    color: sortBy === option.key ? colors.gold : colors.text,
                  }}
                >
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Stats Bar */}
        {lots.length > 0 && <StatsBar stats={stats} />}

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
                tintColor={colors.gold}
                colors={[colors.gold]}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </VantaScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES - VANTA AETHER
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    boxShadow: `0 0 20px ${Palette.metal.goldGlow}`,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  sortMenu: {
    position: "absolute",
    top: 70,
    right: Spacing.xl,
    zIndex: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  // Nouvelle section KPI style Monolith
  kpiSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  progressMonolith: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    justifyContent: "space-between",
    minHeight: 140,
    borderCurve: "continuous",
  },
  progressMonolithHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressMonolithLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 2,
  },
  progressMonolithValue: {
    fontSize: 22,
    fontFamily: "Manrope_600SemiBold",
    marginVertical: Spacing.xs,
  },
  // Legacy stats bar (conservé pour compatibilité)
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
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
    borderCurve: "continuous",
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  sectionListHeader: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 999,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
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
    marginVertical: Spacing.md,
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
    height: 8,
    borderRadius: Radius.xs,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.xs,
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
    borderCurve: "continuous",
  },
});
