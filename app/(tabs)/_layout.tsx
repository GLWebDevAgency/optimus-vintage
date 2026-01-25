/**
 * 📱 NEUMORPHIC TAB BAR - Dark Soft UI Edition
 *
 * ✨ Premium Features:
 * - États fidèles au design système:
 *   🔹 FLAT (non-sélectionné) - Ombre externe, relief sortant
 *   🔻 PRESSED (sélectionné) - Ombre interne (inset), enfoncé
 *   ⚡ ACTIVE - Animation scale + shadow transition au toucher
 * - Mint green (#00D084) primary accent with glow
 * - Fluid morphing indicator with spring physics
 * - Haptic feedback on iOS
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { NeuRadius } from "@/components/ui/Neumorphic";
import { useNeuTheme } from "@/constants/ThemeContext";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
    Dimensions,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = process.env.EXPO_OS === "ios";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION
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

const TIMING_SMOOTH = {
  duration: 200,
  easing: Easing.inOut(Easing.ease),
};

const TAB_COUNT = 5;
const TAB_BAR_HEIGHT = 80;
const TAB_BAR_RADIUS = 24;

// ═══════════════════════════════════════════════════════════════════════════════
// 💎 NEUMORPHIC TAB ICON - Flat ↔ Pressed avec animation fidèle au design
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tab Icon avec états neumorphiques:
 * ─────────────────────────────────────────────────────────────
 * 🔹 Non-focused: Flat/Convex (ombre externe, relief bombé)
 * 🔻 Focused: Pressed/Inset (ombre interne, enfoncé)
 * ⚡ Active touch: scale(0.88) + spring animation + haptic
 *
 * Transition fluide: shadow morph + color + glow pulse
 */

interface NeuTabIconProps {
  name: AppIconName;
  label: string;
  focused: boolean;
  index: number;
  onPress: () => void;
  palette: ReturnType<typeof useNeuTheme>["palette"];
  shadows: ReturnType<typeof useNeuTheme>["shadows"];
}

function NeuTabIcon({
  name,
  label,
  focused,
  index,
  onPress,
  palette,
  shadows,
}: NeuTabIconProps) {
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pressProgress = useSharedValue(focused ? 1 : 0);
  const glowPulse = useSharedValue(0);
  const activeTouch = useSharedValue(0); // Track active press state

  // Sync focus state with pressed animation
  useEffect(() => {
    if (focused) {
      pressProgress.value = withTiming(1, TIMING_SMOOTH);
      translateY.value = withSpring(-3, SPRING_CONFIG);
      // Subtle breathing glow animation when focused
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
    } else {
      pressProgress.value = withTiming(0, TIMING_SMOOTH);
      translateY.value = withSpring(0, SPRING_SNAPPY);
      glowPulse.value = 0;
    }
  }, [focused, pressProgress, translateY, glowPulse]);

  // Press handlers with haptic feedback
  const handlePressIn = useCallback(() => {
    activeTouch.value = 1;
    scale.value = withSpring(0.88, SPRING_SNAPPY);
    if (isIOS) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [scale, activeTouch]);

  const handlePressOut = useCallback(() => {
    activeTouch.value = 0;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale, activeTouch]);

  const handlePress = useCallback(() => {
    if (isIOS && !focused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [focused, onPress]);

  // Container animation (scale + position + subtle rotation)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(activeTouch.value, [0, 1], [0, -1])}deg` },
    ],
  }));

  // Flat shadow layer (visible when NOT focused) - Extruded/Convex look
  const flatShadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressProgress.value, [0, 0.4, 1], [1, 0.3, 0]),
    transform: [{ scale: interpolate(pressProgress.value, [0, 1], [1, 0.96]) }],
  }));

  // Pressed shadow layer (visible when focused - inset/depressed effect)
  const pressedShadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressProgress.value, [0, 0.6, 1], [0, 0.3, 1]),
    transform: [{ scale: interpolate(pressProgress.value, [0, 1], [0.96, 1]) }],
  }));

  // Glow dot animation with breathing effect
  const glowDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.7, 1.3]) }],
  }));

  // Icon color transition
  const iconColor = focused ? palette.primary.main : palette.text.muted;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContent, containerStyle]}>
        {/* Icon container with layered shadows for morph effect */}
        <View style={styles.iconContainer}>
          {/* Flat/Convex shadow layer (non-focused) - Extruded look */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.iconBgFlat,
              { backgroundColor: palette.background.main },
              flatShadowStyle,
              Platform.OS === "web" &&
                ({ boxShadow: shadows.convex.cssSm } as any),
              Platform.OS === "ios" && shadows.convex.iosSm,
              Platform.OS === "android" && {
                elevation: shadows.convex.androidSm,
              },
            ]}
          />

          {/* Pressed/Inset shadow layer (focused) - Depressed look */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.iconBgPressed,
              { backgroundColor: palette.background.main },
              pressedShadowStyle,
              Platform.OS === "web" &&
                ({ boxShadow: shadows.pressed.cssSm } as any),
            ]}
          />

          {/* Icon with animated color */}
          <AppIcon name={name} size={24} color={iconColor} />

          {/* Active glow dot with pulse animation */}
          {focused && (
            <Animated.View
              style={[
                styles.activeDot,
                { backgroundColor: palette.primary.main },
                glowDotStyle,
                Platform.OS === "web" &&
                  ({
                    boxShadow: `0 0 8px ${palette.primary.main}`,
                  } as any),
                Platform.OS === "ios" && {
                  shadowColor: palette.primary.main,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                },
              ]}
            />
          )}
        </View>

        {/* Label with animated color */}
        <Text
          style={[
            styles.tabLabel,
            {
              color: focused ? palette.text.primary : palette.text.muted,
            },
            focused && styles.tabLabelActive,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ NEUMORPHIC TAB BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function NeuTabBar({ state, descriptors, navigation }: NeuTabBarProps) {
  const insets = useSafeAreaInsets();
  const { palette, shadows } = useNeuTheme();

  // Route configuration (matching design)
  const routeConfigMap: Record<string, { name: AppIconName; label: string }> = {
    index: { name: "home", label: "Accueil" },
    lots: { name: "grid-view", label: "Lots" },
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
        { paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      {/* Main neumorphic container */}
      <View
        style={[
          styles.tabBarContainer,
          { backgroundColor: palette.background.main },
          Platform.OS === "web" && ({ boxShadow: shadows.tabBar.css } as any),
          Platform.OS === "ios" && shadows.tabBar.ios,
        ]}
      >
        {/* Tab items */}
        <View style={styles.tabsRow}>
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
              <NeuTabIcon
                key={route.key}
                name={config.name}
                label={config.label}
                focused={isFocused}
                index={index}
                onPress={onPress}
                palette={palette}
                shadows={shadows}
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
      tabBar={(props) => <NeuTabBar {...props} />}
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
// 🎨 NEUMORPHIC STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ─── Container ─────────────────────────────────────────────────────────────
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
  },

  tabBarContainer: {
    height: TAB_BAR_HEIGHT,
    borderTopLeftRadius: TAB_BAR_RADIUS,
    borderTopRightRadius: TAB_BAR_RADIUS,
    borderCurve: "continuous",
  },

  // ─── Tabs Row ──────────────────────────────────────────────────────────────
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  // ─── Tab Item ──────────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  // ─── Icon Container ────────────────────────────────────────────────────────
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: NeuRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // Flat state (non-focused) - external shadow, raised look
  iconBgFlat: {
    borderRadius: NeuRadius.lg,
  },

  // Pressed state (focused) - inset shadow, depressed look
  iconBgPressed: {
    borderRadius: NeuRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  // ─── Active Dot ────────────────────────────────────────────────────────────
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // ─── Tab Label ─────────────────────────────────────────────────────────────
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  tabLabelActive: {
    fontWeight: "700",
  },
});
