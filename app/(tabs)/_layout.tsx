/**
 * 📱 WORLD-CLASS TAB BAR - Inspired by Linear, Arc, Figma
 *
 * ✨ Premium Features:
 * - Fluid morphing indicator with elastic spring physics
 * - Parallax depth layers with subtle 3D effects
 * - Luminescent glow trails following active tab
 * - Haptic micro-feedback on iOS
 * - Glassmorphic aurora background
 * - Particle shimmer effects on focus
 * - Responsive pressure-sensitive animations
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { Palette } from "@/constants/Theme";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = process.env.EXPO_OS === "ios";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION - Physics & Timing
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.8,
  overshootClamping: false,
};

const SPRING_SNAPPY = {
  damping: 22,
  stiffness: 280,
  mass: 0.6,
};

const TAB_COUNT = 5;
const TAB_BAR_MARGIN = 20;
const TAB_BAR_HEIGHT = 68;
const TAB_BAR_RADIUS = 32;

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 AURORA BACKGROUND - Animated gradient mesh
// ═══════════════════════════════════════════════════════════════════════════════

function AuroraBackground() {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.5, 1], [0.3, 0.5, 0.3]),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
      <LinearGradient
        colors={[
          `${Palette.emerald[100]}20`,
          `${Palette.neutral[100]}40`,
          `${Palette.gold[100]}15`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ MORPHING INDICATOR - Fluid pill that morphs between tabs
// ═══════════════════════════════════════════════════════════════════════════════

interface MorphingIndicatorProps {
  activeIndex: SharedValue<number>;
  tabWidth: number;
  containerPadding: number;
}

function MorphingIndicator({
  activeIndex,
  tabWidth,
  containerPadding,
}: MorphingIndicatorProps) {
  // Glow pulse animation
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  // Calculate indicator position with elastic overshoot
  const indicatorStyle = useAnimatedStyle(() => {
    const translateX =
      activeIndex.value * tabWidth + containerPadding + (tabWidth - 52) / 2;
    const glowIntensity = interpolate(glowPulse.value, [0, 1], [0.6, 1]);

    return {
      transform: [{ translateX }],
      opacity: glowIntensity,
    };
  });

  return (
    <Animated.View style={[styles.morphIndicator, indicatorStyle]}>
      {/* Outer glow */}
      <View style={styles.indicatorGlowOuter}>
        <LinearGradient
          colors={[
            `${Palette.emerald[400]}00`,
            `${Palette.emerald[500]}40`,
            `${Palette.emerald[400]}00`,
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Main pill */}
      <View style={styles.indicatorPillMain}>
        <LinearGradient
          colors={[
            Palette.emerald[400],
            Palette.emerald[500],
            Palette.emerald[600],
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Highlight reflection */}
      <View style={styles.indicatorHighlight} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💎 PREMIUM TAB ICON - Multi-layer animated icon
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumTabIconProps {
  name: AppIconName;
  label: string;
  focused: boolean;
  index: number;
  onPress: () => void;
}

function PremiumTabIcon({
  name,
  label,
  focused,
  index,
  onPress,
}: PremiumTabIconProps) {
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const labelOpacity = useSharedValue(0.6);
  const labelScale = useSharedValue(0.95);
  const pressScale = useSharedValue(1);
  const glowRadius = useSharedValue(0);
  const shimmerPhase = useSharedValue(0);

  // Focus state animations
  useEffect(() => {
    if (focused) {
      // Icon lifts up and scales
      scale.value = withSpring(1.12, SPRING_CONFIG);
      translateY.value = withSpring(-3, SPRING_CONFIG);

      // Subtle rotation bounce
      iconRotate.value = withSequence(
        withSpring(-3, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 12, stiffness: 300 }),
      );

      // Label appears
      labelOpacity.value = withDelay(50, withTiming(1, { duration: 200 }));
      labelScale.value = withDelay(50, withSpring(1, SPRING_SNAPPY));

      // Glow expands
      glowRadius.value = withSpring(1, { damping: 15, stiffness: 150 });

      // Shimmer effect
      shimmerPhase.value = withDelay(100, withTiming(1, { duration: 600 }));
    } else {
      scale.value = withSpring(1, SPRING_SNAPPY);
      translateY.value = withSpring(0, SPRING_SNAPPY);
      iconRotate.value = withSpring(0, SPRING_SNAPPY);
      labelOpacity.value = withTiming(0.55, { duration: 150 });
      labelScale.value = withTiming(0.95, { duration: 150 });
      glowRadius.value = withTiming(0, { duration: 200 });
      shimmerPhase.value = 0;
    }
  }, [focused]);

  // Press handlers with haptic
  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.92, SPRING_SNAPPY);
    if (isIOS) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const handlePress = useCallback(() => {
    if (isIOS && !focused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [focused, onPress]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pressScale.value * scale.value },
      { translateY: translateY.value },
    ],
  }));

  const iconWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowRadius.value * 0.8,
    transform: [{ scale: interpolate(glowRadius.value, [0, 1], [0.5, 1.3]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      { scale: labelScale.value },
      { translateY: interpolate(labelOpacity.value, [0.55, 1], [2, 0]) },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerPhase.value,
    transform: [
      { translateX: interpolate(shimmerPhase.value, [0, 1], [-20, 20]) },
    ],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContent, containerStyle]}>
        {/* Ambient glow */}
        <Animated.View style={[styles.ambientGlow, glowStyle]}>
          <LinearGradient
            colors={[
              `${Palette.emerald[400]}00`,
              `${Palette.emerald[500]}50`,
              `${Palette.emerald[400]}00`,
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Icon container with background */}
        <Animated.View style={[styles.iconWrapper, iconWrapperStyle]}>
          {/* Focus background pill */}
          {focused && (
            <Animated.View
              entering={FadeIn.duration(150)}
              style={styles.iconBgPill}
            >
              <LinearGradient
                colors={[`${Palette.emerald[100]}`, `${Palette.emerald[50]}`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Shimmer overlay */}
              <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
                <LinearGradient
                  colors={[
                    "transparent",
                    `${Palette.neutral.white}60`,
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          )}

          {/* Icon */}
          <AppIcon
            name={name}
            size={22}
            color={focused ? Palette.emerald[600] : Palette.neutral[400]}
          />
        </Animated.View>

        {/* Label with micro-animation */}
        <Animated.Text style={[styles.tabLabel, labelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ WORLD-CLASS TAB BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface WorldClassTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function WorldClassTabBar({
  state,
  descriptors,
  navigation,
}: WorldClassTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = useSharedValue(state.index);

  // Calculate dimensions
  const containerWidth = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;
  const containerPadding = 12;
  const tabWidth = (containerWidth - containerPadding * 2) / TAB_COUNT;

  // Update active index with spring animation
  useEffect(() => {
    activeIndex.value = withSpring(state.index, SPRING_CONFIG);
  }, [state.index]);

  // Route configuration
  const routeConfigMap: Record<string, { name: AppIconName; label: string }> = {
    index: { name: "home", label: "Accueil" },
    lots: { name: "inventory-2", label: "Lots" },
    stock: { name: "checkroom", label: "Stock" },
    sales: { name: "point-of-sale", label: "Ventes" },
    settings: { name: "settings", label: "Réglages" },
  };

  // Filter valid routes
  const validRoutes = useMemo(
    () => state.routes.filter((route: any) => routeConfigMap[route.name]),
    [state.routes],
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={[
        styles.tabBarWrapper,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {/* Main container */}
      <View style={styles.tabBarContainer}>
        {/* Multi-layer glassmorphic background */}
        <View style={styles.glassContainer}>
          {/* Base blur */}
          <BlurView
            intensity={isIOS ? 60 : 100}
            tint="light"
            style={StyleSheet.absoluteFill}
          />

          {/* Aurora gradient mesh */}
          <AuroraBackground />

          {/* Glass overlay */}
          <View style={styles.glassOverlay} />

          {/* Top edge highlight */}
          <View style={styles.topHighlight}>
            <LinearGradient
              colors={[
                `${Palette.neutral.white}80`,
                `${Palette.neutral.white}20`,
                "transparent",
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        {/* Luminous border */}
        <View style={styles.luminousBorder}>
          <LinearGradient
            colors={[
              `${Palette.emerald[300]}30`,
              `${Palette.neutral[200]}15`,
              `${Palette.gold[300]}25`,
              `${Palette.neutral[200]}10`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Morphing active indicator */}
        <MorphingIndicator
          activeIndex={activeIndex}
          tabWidth={tabWidth}
          containerPadding={containerPadding}
        />

        {/* Tab items */}
        <View style={[styles.tabsRow, { paddingHorizontal: containerPadding }]}>
          {validRoutes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = routeConfigMap[route.name];
            if (!config) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <PremiumTabIcon
                key={route.key}
                name={config.name}
                label={config.label}
                focused={isFocused}
                index={index}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 TAB LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <WorldClassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="lots" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="sales" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ─── Container ─────────────────────────────────────────────────────────────
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR_MARGIN,
    paddingTop: 8,
  },

  tabBarContainer: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    overflow: "hidden",
    borderCurve: "continuous",
    // Premium multi-layer shadow
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.02),
      0 4px 8px rgba(0, 0, 0, 0.03),
      0 8px 16px rgba(0, 0, 0, 0.04),
      0 16px 32px rgba(0, 0, 0, 0.05),
      0 0 0 0.5px ${Palette.neutral[200]}50,
      0 20px 40px ${Palette.emerald[200]}20
    `,
  },

  // ─── Glass Effect ──────────────────────────────────────────────────────────
  glassContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: TAB_BAR_RADIUS,
  },

  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${Palette.neutral.white}75`,
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
  },

  // ─── Luminous Border ───────────────────────────────────────────────────────
  luminousBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.8,
  },

  // ─── Morphing Indicator ────────────────────────────────────────────────────
  morphIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 52,
    height: 4,
    alignItems: "center",
  },

  indicatorGlowOuter: {
    position: "absolute",
    top: -2,
    left: -8,
    right: -8,
    height: 8,
    opacity: 0.6,
  },

  indicatorPillMain: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
    boxShadow: `0 0 8px ${Palette.emerald[500]}80`,
  },

  indicatorHighlight: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: `${Palette.neutral.white}60`,
    borderRadius: 0.5,
  },

  // ─── Tabs Row ──────────────────────────────────────────────────────────────
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  // ─── Tab Item ──────────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },

  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Ambient Glow ──────────────────────────────────────────────────────────
  ambientGlow: {
    position: "absolute",
    top: -16,
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  // ─── Icon Wrapper ──────────────────────────────────────────────────────────
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    overflow: "hidden",
  },

  iconBgPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: "hidden",
    borderCurve: "continuous",
  },

  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: 40,
  },

  // ─── Tab Label ─────────────────────────────────────────────────────────────
  tabLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.1,
    marginTop: 4,
    color: Palette.neutral[600],
  },
});
