/**
 * 💰 SALES SCREEN - Ultra Premium Edition
 * Premium transaction history with animations
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    Card,
    Chip,
    LuxuryListItem,
    SectionHeader,
} from "@/components/ui/Components";
import {
    PremiumColors,
    PremiumScreen,
    usePremiumTheme,
} from "@/components/ui/PremiumUI";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Typography } from "@/constants/Theme";
import { Sale, SalesRepository } from "@/db/repositories";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
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

// ============ TYPES ============

type PeriodFilter = "7d" | "30d" | "3m" | "1y" | "all";

interface PeriodOption {
  key: PeriodFilter;
  label: string;
  days: number | null; // null = all time
}

// ============ CONSTANTS ============

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "7d", label: "7 jours", days: 7 },
  { key: "30d", label: "30 jours", days: 30 },
  { key: "3m", label: "3 mois", days: 90 },
  { key: "1y", label: "1 an", days: 365 },
  { key: "all", label: "Tout", days: null },
];

// ============ HELPERS ============

function getDateThreshold(days: number | null): Date | null {
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function filterSalesByPeriod(sales: Sale[], period: PeriodFilter): Sale[] {
  const option = PERIOD_OPTIONS.find((p) => p.key === period);
  if (!option || option.days === null) return sales;

  const threshold = getDateThreshold(option.days);
  if (!threshold) return sales;

  return sales.filter((sale) => new Date(sale.saleDate) >= threshold);
}

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const theme = usePremiumTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");

  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });
  const { refetch } = salesQuery;
  const allSales = (salesQuery.data ?? []).slice().reverse();
  const loading = salesQuery.isLoading;
  const refreshing = salesQuery.isFetching && !loading;

  // Filter sales by period
  const sales = useMemo(() => {
    return filterSalesByPeriod(allSales, selectedPeriod);
  }, [allSales, selectedPeriod]);

  const { totalRevenue, salesCount, avgSaleValue, previousPeriodComparison } =
    useMemo(() => {
      const completed = sales.filter((sale) => sale.status === "COMPLETED");
      const total = completed.reduce(
        (sum, sale) => sum + parseFloat(String(sale.priceNet)),
        0,
      );
      const avg = completed.length > 0 ? total / completed.length : 0;

      // Calculate previous period for comparison
      const option = PERIOD_OPTIONS.find((p) => p.key === selectedPeriod);
      let comparison = 0;

      if (option && option.days !== null) {
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
            (sum, sale) => sum + parseFloat(String(sale.priceNet)),
            0,
          );

          if (previousTotal > 0) {
            comparison = ((total - previousTotal) / previousTotal) * 100;
          } else if (total > 0) {
            comparison = 100; // New sales, 100% increase
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

  const renderItem = ({ item, index }: { item: Sale; index: number }) => {
    const isCompleted = item.status === "COMPLETED";

    return (
      <Animated.View entering={SlideInRight.delay(index * 40).duration(300)}>
        <LuxuryListItem
          title={`Lot #${item.lotId} • Article #${item.itemId}`}
          subtitle={new Date(item.saleDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          leftContent={
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor: isCompleted
                    ? theme.successSubtle
                    : theme.dangerSubtle,
                },
              ]}
            >
              <AppIcon
                name={isCompleted ? "check-circle" : "cancel"}
                size={18}
                color={isCompleted ? theme.success : theme.danger}
              />
            </View>
          }
          value={`${isCompleted ? "+" : ""}€${parseFloat(String(item.priceNet)).toFixed(2)}`}
          valueColor={isCompleted ? theme.success : theme.textMuted}
          badge={
            isCompleted ? undefined : { label: item.status, variant: "danger" }
          }
          showDivider={index < sales.length - 1}
          onPress={() => router.push(`/sales/${item.id}`)}
          index={index}
        />
      </Animated.View>
    );
  };

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
              Ventes
            </Text>
            <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>
              Historique & Revenus
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptic.impactMedium();
              router.push("/sales/new");
            }}
          >
            <AppIcon name="add" size={24} color={PremiumColors.textWhite} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingTop: insets.top + 90, flex: 1 }}>
        {/* Period Filter Chips */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
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
                entering={ZoomIn.delay(100 + index * 50).duration(300)}
              >
                <Chip
                  label={option.label}
                  selected={selectedPeriod === option.key}
                  onPress={() => handlePeriodChange(option.key)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Revenue Hero Card */}
        <Animated.View
          style={styles.heroSection}
          entering={FadeInDown.delay(200).duration(500)}
        >
          <Card variant="elevated">
            <View style={styles.revenueContent}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.label.xs, { color: theme.textMuted }]}>
                  REVENU{" "}
                  {PERIOD_OPTIONS.find(
                    (p) => p.key === selectedPeriod,
                  )?.label.toUpperCase()}
                </Text>
                <Text
                  style={[
                    Typography.display.lg,
                    { color: theme.success, marginTop: Spacing.xs },
                  ]}
                >
                  €{totalRevenue.toFixed(2)}
                </Text>
                <View style={styles.revenueStats}>
                  <View style={styles.revenueStat}>
                    <AppIcon name="receipt" size={14} color={theme.textMuted} />
                    <Text
                      style={[
                        Typography.body.sm,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {salesCount} transactions
                    </Text>
                  </View>
                  <View style={styles.revenueStat}>
                    <AppIcon
                      name={
                        previousPeriodComparison >= 0
                          ? "trending-up"
                          : "trending-down"
                      }
                      size={14}
                      color={
                        previousPeriodComparison >= 0
                          ? theme.success
                          : theme.danger
                      }
                    />
                    <Text
                      style={[
                        Typography.body.sm,
                        {
                          color:
                            previousPeriodComparison >= 0
                              ? theme.success
                              : theme.danger,
                        },
                      ]}
                    >
                      {previousPeriodComparison >= 0 ? "+" : ""}
                      {previousPeriodComparison.toFixed(0)}% vs précédent
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.revenueIcon,
                  { backgroundColor: theme.successSubtle },
                ]}
              >
                <AppIcon
                  name="account-balance-wallet"
                  size={32}
                  color={theme.success}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Transactions List */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.listSection}
        >
          <SectionHeader
            title="Transactions récentes"
            icon={<AppIcon name="history" size={20} color={theme.primary} />}
          />

          <Card variant="default" noPadding style={styles.listCard}>
            <FlatList
              data={sales}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentInsetAdjustmentBehavior="automatic"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refetch}
                  tintColor={theme.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: Spacing.md }}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.empty}>
                    <View
                      style={[
                        styles.emptyIcon,
                        { backgroundColor: theme.primarySubtle },
                      ]}
                    >
                      <AppIcon
                        name="point-of-sale"
                        size={40}
                        color={theme.primary}
                      />
                    </View>
                    <Text
                      style={[
                        Typography.heading.md,
                        { color: theme.text, marginTop: Spacing.lg },
                      ]}
                    >
                      Aucune vente
                    </Text>
                    <Text
                      style={[
                        Typography.body.sm,
                        { color: theme.textMuted, textAlign: "center" },
                      ]}
                    >
                      Enregistrez votre première vente depuis le stock
                    </Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <SkeletonList count={5} />
                  </View>
                )
              }
            />
          </Card>
        </Animated.View>
      </View>
    </PremiumScreen>
  );
}

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
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  heroSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  revenueContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  revenueStats: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  revenueStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  revenueIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  listSection: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  listCard: {
    flex: 1,
    marginBottom: 100,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
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
  },
  loadingContainer: {
    padding: Spacing.xl,
  },
});
