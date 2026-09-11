/**
 * 🌿 IMMERSIVE ONBOARDING — 4-Screen Storytelling Journey
 *
 * Screen 1: Welcome — Logo reveal + tagline
 * Screen 2: AI Scanner — Scanning animation + feature bullets
 * Screen 3: Dashboard Preview — Mini KPIs + chart tease
 * Screen 4: Quick Setup — Currency + margin (existing logic)
 *
 * Horizontal FlatList pager with animated pagination dots,
 * skip button (top-right), Next/Get Started button (bottom).
 */

import { DashboardSlide } from "@/components/onboarding/DashboardSlide";
import { ScannerSlide } from "@/components/onboarding/ScannerSlide";
import { SetupSlide } from "@/components/onboarding/SetupSlide";
import { WelcomeSlide } from "@/components/onboarding/WelcomeSlide";
import { PaginationDots } from "@/components/ui/PaginationDots";
import {
  PremiumButton,
  useIsDarkMode,
  useVantaTheme,
  VantaScreen,
} from "@/components/ui/PremiumUI";
import { Spacing, Typography } from "@/constants/Theme";
import { useSettingsStore } from "@/store/settings";
import { useAccessibility } from "@/utils/accessibility";
import analytics from "@/utils/analytics";
import { useLocale } from "@/utils/i18n";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
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
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_SLIDES = 4;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { width } = useWindowDimensions();
  const { t } = useLocale();
  const { isReduceMotionEnabled } = useAccessibility();

  const { setCurrency, setTargetMargin, completeOnboarding } =
    useSettingsStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currencyInput, setCurrencyInput] = useState("EUR");
  const [marginInput, setMarginInput] = useState("10");

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        analytics.track("onboarding_step_viewed", {
          screen_name: `onboarding_step_${newIndex + 1}`,
        });
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const goToNext = useCallback(() => {
    if (currentIndex < TOTAL_SLIDES - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: !isReduceMotionEnabled,
      });
    } else {
      handleFinish();
    }
  }, [currentIndex, isReduceMotionEnabled]);

  const handleSkip = useCallback(() => {
    analytics.track("onboarding_skipped");
    flatListRef.current?.scrollToIndex({
      index: TOTAL_SLIDES - 1,
      animated: !isReduceMotionEnabled,
    });
  }, [isReduceMotionEnabled]);

  const handleFinish = useCallback(() => {
    setCurrency(currencyInput);
    setTargetMargin(Number(marginInput) || 0);
    completeOnboarding();
    analytics.track("onboarding_completed");
    router.replace("/(tabs)");
  }, [currencyInput, marginInput]);

  const isLastSlide = currentIndex === TOTAL_SLIDES - 1;

  const renderSlide = useCallback(
    ({ index }: { item: number; index: number }) => {
      switch (index) {
        case 0:
          return (
            <WelcomeSlide
              isActive={currentIndex === 0}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 1:
          return (
            <ScannerSlide
              isActive={currentIndex === 1}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 2:
          return (
            <DashboardSlide
              isActive={currentIndex === 2}
              reduceMotion={isReduceMotionEnabled}
            />
          );
        case 3:
          return (
            <SetupSlide
              isActive={currentIndex === 3}
              reduceMotion={isReduceMotionEnabled}
              currencyInput={currencyInput}
              setCurrencyInput={setCurrencyInput}
              marginInput={marginInput}
              setMarginInput={setMarginInput}
            />
          );
        default:
          return null;
      }
    },
    [currentIndex, isReduceMotionEnabled, currencyInput, marginInput],
  );

  return (
    <VantaScreen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Skip Button — top-right */}
        {!isLastSlide && (
          <Animated.View
            entering={
              isReduceMotionEnabled
                ? undefined
                : FadeIn.delay(800).duration(400)
            }
            style={[styles.skipButton, { top: insets.top + Spacing.md }]}
          >
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text
                style={[
                  Typography.body.sm,
                  { color: theme.textMuted },
                ]}
              >
                {t("onboarding.skip")}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={[0, 1, 2, 3]}
          renderItem={renderSlide}
          keyExtractor={(item) => String(item)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          style={styles.flatList}
        />

        {/* Bottom Controls */}
        <Animated.View
          entering={
            isReduceMotionEnabled
              ? undefined
              : FadeInDown.delay(600).duration(500).springify()
          }
          style={[
            styles.bottomControls,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          {/* Pagination Dots */}
          <PaginationDots
            count={TOTAL_SLIDES}
            scrollX={scrollX}
            pageWidth={width}
          />

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <PremiumButton
              variant="primary"
              size="lg"
              fullWidth
              icon={isLastSlide ? "check-circle" : "arrow-forward"}
              iconPosition="right"
              onPress={goToNext}
            >
              {isLastSlide
                ? t("onboarding.getStarted")
                : t("common.next")}
            </PremiumButton>
          </View>
        </Animated.View>

        <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    right: Spacing.xl,
    zIndex: 10,
  },
  flatList: {
    flex: 1,
  },
  bottomControls: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  ctaContainer: {
    width: "100%",
  },
});
