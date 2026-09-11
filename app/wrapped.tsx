/**
 * 🎁 RESELL WRAPPED — Monthly Performance Report
 *
 * Spotify Wrapped-inspired animated monthly summary.
 * 5 vertical slides with progress bar, shareable.
 */

import { MonthInNumbers } from "@/components/wrapped/MonthInNumbers";
import { PlatformChampion } from "@/components/wrapped/PlatformChampion";
import { ROIGrowth } from "@/components/wrapped/ROIGrowth";
import { ShareCard } from "@/components/wrapped/ShareCard";
import { TopPerformer } from "@/components/wrapped/TopPerformer";
import { useIsDarkMode, VantaScreen } from "@/components/ui/PremiumUI";
import { Palette, Spacing } from "@/constants/Theme";
import { LotsRepository, SalesRepository } from "@/db/repositories";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { computeMonthlyWrapped } from "@/utils/data/wrapped-data";
import { useLocale } from "@/utils/i18n";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_SLIDES = 5;

export default function WrappedScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();
  const { width, height } = useWindowDimensions();
  const { t } = useLocale();
  const { isReduceMotionEnabled } = useAccessibility();

  useTrackScreen("wrapped");

  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  // Data
  const lotsQuery = useQuery({
    queryKey: ["lots"],
    queryFn: () => LotsRepository.getAll(),
  });
  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });

  const wrappedData = useMemo(() => {
    const lots = lotsQuery.data ?? [];
    const sales = salesQuery.data ?? [];
    return computeMonthlyWrapped(lots, sales);
  }, [lotsQuery.data, salesQuery.data]);

  // Progress bar animation
  const progressStyle = useAnimatedStyle(() => ({
    width: `${((progress.value + 1) / TOTAL_SLIDES) * 100}%`,
  }));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        progress.value = withTiming(newIndex, { duration: 300 });
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const slideHeight = height - insets.top - insets.bottom - 60;

  const renderSlide = useCallback(
    ({ index }: { item: number; index: number }) => {
      switch (index) {
        case 0:
          return (
            <MonthInNumbers
              data={wrappedData}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 1:
          return (
            <TopPerformer
              data={wrappedData}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 2:
          return (
            <PlatformChampion
              data={wrappedData}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 3:
          return (
            <ROIGrowth
              data={wrappedData}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 4:
          return (
            <ShareCard
              data={wrappedData}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        default:
          return null;
      }
    },
    [wrappedData, isReduceMotionEnabled],
  );

  return (
    <VantaScreen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header: progress bar + close */}
        <View style={styles.header}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: Palette.metal.gold },
                progressStyle,
              ]}
            />
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.closeButton}
          >
            <Text style={[styles.closeText, { color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }]}>
              ✕
            </Text>
          </Pressable>
        </View>

        {/* Month label */}
        <Text
          style={[
            styles.monthLabel,
            {
              color: isDark
                ? "rgba(255,255,255,0.4)"
                : "rgba(0,0,0,0.3)",
            },
          ]}
        >
          {t("wrapped.monthTitle", { month: wrappedData.monthLabel })}
        </Text>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={[0, 1, 2, 3, 4]}
          renderItem={renderSlide}
          keyExtractor={(item) => String(item)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          style={styles.flatList}
        />

        <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "600",
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
    paddingVertical: Spacing.xs,
  },
  flatList: {
    flex: 1,
  },
});
