/**
 * 💰 SALES SCREEN - Vanta-Aether Architecture
 * "Revenue flowing through the infinite void"
 *
 * v3.0 - Vanta UI refactor (tokens + accessibility + FlashList)
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Chip } from "@/components/ui/Components";
import {
  PremiumCard,
  PremiumHeader,
  PremiumStatCard,
  VantaScreen,
  useVantaTheme,
} from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Radius, Spacing } from "@/constants/Theme";
import { Sale, SalesRepository } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { Haptic } from "@/utils/haptics";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateShort,
  useLocale,
} from "@/utils/i18n";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PeriodFilter = "7d" | "30d" | "3m" | "1y" | "all";

interface PeriodOption {
  key: PeriodFilter;
  label: string;
  days: number | null;
}

const PERIOD_OPTIONS_CONFIG: {
  key: PeriodFilter;
  translationKey: string;
  days: number | null;
}[] = [
  { key: "7d", translationKey: "dashboard.period.7d", days: 7 },
  { key: "30d", translationKey: "dashboard.period.30d", days: 30 },
  { key: "3m", translationKey: "dashboard.period.3m", days: 90 },
  { key: "1y", translationKey: "dashboard.period.1y", days: 365 },
  { key: "all", translationKey: "dashboard.period.all", days: null },
];

function getDateThreshold(days: number | null): Date | null {
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function filterSalesByPeriod(sales: Sale[], period: PeriodFilter): Sale[] {
  const option = PERIOD_OPTIONS_CONFIG.find((p) => p.key === period);
  if (!option || option.days === null) return sales;

  const threshold = getDateThreshold(option.days);
  if (!threshold) return sales;

  return sales.filter((sale) => new Date(sale.saleDate) >= threshold);
}

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const currency = useSettingsStore((s) => s.currency) as any;
  const { t, locale } = useLocale();
  const { isReduceMotionEnabled } = useAccessibility();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

  useTrackScreen("sales");

  const PERIOD_OPTIONS: PeriodOption[] = useMemo(
    () =>
      PERIOD_OPTIONS_CONFIG.map((option) => ({
        key: option.key,
        label: t(option.translationKey),
        days: option.days,
      })),
    [t],
  );

  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });

  const { refetch } = salesQuery;
  const allSales = (salesQuery.data ?? []).slice().reverse();
  const loading = salesQuery.isLoading;
  const refreshing = salesQuery.isFetching && !loading;

  const sales = useMemo(() => {
    return filterSalesByPeriod(allSales, selectedPeriod);
  }, [allSales, selectedPeriod]);

  const { totalRevenue, salesCount, avgSaleValue, previousPeriodComparison } =
    useMemo(() => {
      const completed = sales.filter((sale) => sale.status === "COMPLETED");
      const total = completed.reduce(
        (sum, sale) => sum + (parseFloat(String(sale.priceNet)) || 0),
        0,
      );
      const avg = completed.length > 0 ? total / completed.length : 0;

      const option = PERIOD_OPTIONS_CONFIG.find((p) => p.key === selectedPeriod);
      let comparison = 0;

      if (option?.days) {
        const previousThreshold = getDateThreshold(option.days * 2);
        const currentThreshold = getDateThreshold(option.days);

        if (previousThreshold && currentThreshold) {
          const previousSales = allSales.filter((sale) => {
            const saleDate = new Date(sale.saleDate);
            return (
              saleDate >= previousThreshold &&
              saleDate < currentThreshold &&
              sale.status === "COMPLETED"
            );
          });

          const previousTotal = previousSales.reduce(
            (sum, sale) => sum + (parseFloat(String(sale.priceNet)) || 0),
            0,
          );

          if (previousTotal > 0) {
            comparison = ((total - previousTotal) / previousTotal) * 100;
          } else if (total > 0) {
            comparison = 100;
          }
        }
      }

      return {
        totalRevenue: total,
        salesCount: completed.length,
        avgSaleValue: avg,
        previousPeriodComparison: comparison,
      };
    }, [sales, allSales, selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handlePeriodChange = useCallback((period: PeriodFilter) => {
    Haptic.selection();
    setSelectedPeriod(period);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Sale; index: number }) => {
      const isCompleted = item.status === "COMPLETED";
      const accentColor = isCompleted ? theme.success : theme.danger;
      const accentSubtle = isCompleted ? theme.successSubtle : theme.dangerSubtle;
      const net = parseFloat(String(item.priceNet)) || 0;
      const dateLabel = formatDateShort(item.saleDate, locale);

      const statusLabel =
        item.status === "CANCELLED"
          ? t("sales.status.cancelled")
          : item.status === "REFUNDED"
            ? t("sales.status.refunded")
            : item.status === "PENDING"
              ? t("sales.status.pending")
              : item.status;

      return (
        <Animated.View
          entering={
            isReduceMotionEnabled
              ? undefined
              : SlideInRight.delay(index * 35).duration(260)
          }
        >
          <Pressable
            onPress={() => router.push(`/sales/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${t("sales.saleDetails")}. Lot ${item.lotId}. Article ${item.itemId}. ${formatCurrency(net, currency, locale)}.`}
            accessibilityHint={t("accessibility.openDetails")}
            style={styles.salePressable}
          >
            <PremiumCard variant="default" padding="md" style={styles.saleCard}>
              <View style={[styles.saleAccent, { backgroundColor: accentColor }]} />
              <View style={styles.saleMain}>
                <View style={styles.saleTitleRow}>
                  <View style={[styles.statusIcon, { backgroundColor: accentSubtle }]}>
                    <AppIcon
                      name={isCompleted ? "check-circle" : "cancel"}
                      size={18}
                      color={accentColor}
                    />
                  </View>
                  <View style={styles.saleInfo}>
                    <Text style={[styles.saleTitle, { color: theme.text }]} numberOfLines={1}>
                      Lot #{item.lotId} • Article #{item.itemId}
                    </Text>
                    <Text style={[styles.saleMeta, { color: theme.textMuted }]}>
                      {dateLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.saleRight}>
                  <Text
                    style={[
                      styles.saleAmount,
                      { color: isCompleted ? theme.success : theme.textMuted },
                    ]}
                  >
                    {formatCurrency(net, currency, locale)}
                  </Text>
                  {!isCompleted && (
                    <View style={[styles.statusBadge, { backgroundColor: theme.dangerSubtle }]}>
                      <Text style={[styles.statusBadgeText, { color: theme.danger }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.chevron}>
                  <AppIcon name="chevron-right" size={18} color={theme.textMuted} />
                </View>
              </View>
            </PremiumCard>
          </Pressable>
        </Animated.View>
      );
    },
    [currency, isReduceMotionEnabled, locale, t, theme],
  );

  return (
    <VantaScreen>
      <FlashList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + Spacing.sm }}>
            <View style={styles.header}>
              <PremiumHeader
                title={t("sales.title")}
                subtitle={t("dashboard.revenue")}
                rightAction={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("sales.newSale")}
                    onPress={() => {
                      Haptic.impactMedium();
                      router.push("/sales/new");
                    }}
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                  >
                    <AppIcon name="add" size={22} color={theme.textOnAccent} />
                  </Pressable>
                }
              />
            </View>

            <Animated.View
              entering={
                isReduceMotionEnabled
                  ? undefined
                  : FadeInDown.delay(100).duration(350)
              }
              style={styles.filterSection}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {PERIOD_OPTIONS.map((option, index) => (
                  <Animated.View
                    key={option.key}
                    entering={
                      isReduceMotionEnabled
                        ? undefined
                        : ZoomIn.delay(120 + index * 40).duration(260)
                    }
                  >
                    <Chip
                      label={option.label}
                      selected={selectedPeriod === option.key}
                      onPress={() => handlePeriodChange(option.key)}
                      accessibilityLabel={option.label}
                      accessibilityHint={t("common.filter")}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>

            <View style={styles.statsGrid}>
              <PremiumStatCard
                label={t("dashboard.revenue").toUpperCase()}
                value={formatCurrencyCompact(totalRevenue, currency, locale)}
                subtitle={t(PERIOD_OPTIONS_CONFIG.find((p) => p.key === selectedPeriod)?.translationKey ?? "dashboard.period.30d")}
                icon="payments"
                variant="accent"
                trend={
                  selectedPeriod === "all"
                    ? undefined
                    : {
                        value: `${previousPeriodComparison >= 0 ? "+" : ""}${previousPeriodComparison.toFixed(0)}%`,
                        isPositive: previousPeriodComparison >= 0,
                      }
                }
              />
              <PremiumStatCard
                label={t("sales.title").toUpperCase()}
                value={salesCount}
                subtitle={t("sales.title").toLowerCase()}
                icon="receipt"
              />
            </View>

            <View style={styles.statsGrid}>
              <PremiumStatCard
                label={t("sales.stats.avgSale").toUpperCase()}
                value={formatCurrency(avgSaleValue, currency, locale)}
                subtitle={t("sales.priceNet")}
                icon="account-balance-wallet"
              />
              <PremiumStatCard
                label={t("sales.stats.deltaPrev").toUpperCase()}
                value={`${previousPeriodComparison >= 0 ? "+" : ""}${previousPeriodComparison.toFixed(0)}%`}
                subtitle={t("common.previous")}
                icon={previousPeriodComparison >= 0 ? "trending-up" : "trending-down"}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                {t("sales.saleDetails").toUpperCase()}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonList count={5} />
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primarySubtle }]}>
                <AppIcon name="point-of-sale" size={40} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {t("sales.empty.title")}
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
                {t("sales.empty.description")}
              </Text>
            </View>
          )
        }
      />
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  filterSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  listContent: {
    paddingBottom: 120,
  },
  salePressable: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  saleCard: {
    overflow: "hidden",
  },
  saleAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 2,
    borderRadius: 999,
  },
  saleMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    gap: Spacing.md,
  },
  saleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  saleInfo: {
    flex: 1,
  },
  saleTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  saleMeta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  saleRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  saleAmount: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  chevron: {
    width: 24,
    alignItems: "flex-end",
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  emptyTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    marginTop: Spacing.lg,
  },
  emptyDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    padding: Spacing.xl,
  },
});
