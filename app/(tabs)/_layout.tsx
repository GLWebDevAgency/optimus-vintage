/**
 * 🌌 VANTA MONOLITHIC DOCK - World-Class Tab Navigation
 *
 * Design:
 * - AETHER (Dark): Brushed Black Titanium dock with Pure Gold glyphs
 * - IVORY (Light): Mother of Pearl Glass dock with Champagne Gold glyphs
 *
 * ✨ Features:
 * - Monolithic floating dock
 * - Abstract geometric glyphs pulsing with system activity
 * - Gravity-based inertia transitions
 * - Haptic shockwave feedback on iOS
 * - 100% visual consistency across all screens
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { SPRING_GRAVITY, SPRING_SNAPPY } from "@/constants/Animation";
import { Radius } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
    FadeInUp,
    interpolate,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = process.env.EXPO_OS === "ios";

const TAB_COUNT = 5;
const TAB_BAR_MARGIN = 20;
const TAB_BAR_HEIGHT = 72;
const ACTIVE_ICON_SIZE = 24;
const INACTIVE_ICON_SIZE = 22;

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ GOLD INDICATOR - Floating pill with photon emanation
// ═══════════════════════════════════════════════════════════════════════════════

interface GoldIndicatorProps {
  activeIndex: SharedValue<number>;
  tabWidth: number;
  containerPadding: number;
}

function GoldIndicator({
  activeIndex,
  tabWidth,
  containerPadding,
}: GoldIndicatorProps) {
  const theme = useVantaTheme();

  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorWidth = tabWidth - 12;
    const translateX = activeIndex.value * tabWidth + containerPadding + 6;

    return {
      transform: [{ translateX }],
      width: indicatorWidth,
    };
  });

  return (
    <Animated.View style={[styles.goldIndicator, indicatorStyle]}>
      <View
        style={[
          styles.indicatorPill,
          {
            backgroundColor: theme.dark ? theme.surfaceSlab : theme.surfaceHighlight,
            boxShadow: theme.dark
              ? `0 0 12px ${theme.primary}30, inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)`
              : `0 4px 16px ${theme.primaryGlow}, 0 2px 8px rgba(28,25,23,0.08), inset 0 1px 0 rgba(255,255,255,1)`,
            borderWidth: 1,
            borderColor: theme.dark ? `${theme.primary}30` : `${theme.primary}20`,
          },
        ]}
      />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💎 VANTA GLYPH - Animated tab icon with gold pulse
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaGlyphProps {
  name: AppIconName;
  label: string;
  focused: boolean;
  index: number;
  onPress: () => void;
}

function VantaGlyph({ name, label, focused, index, onPress }: VantaGlyphProps) {
  const theme = useVantaTheme();

  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glyphRotate = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Colors from theme
  const activeColor = theme.primary;
  const inactiveColor = theme.textMuted;

  // Focus state animations
  useEffect(() => {
    if (focused) {
      // Subtle lift and scale
      scale.value = withSpring(1.08, SPRING_SNAPPY);
      translateY.value = withSpring(-2, SPRING_SNAPPY);
      glowIntensity.value = withTiming(1, { duration: 300 });

      // Subtle rotation sequence
      glyphRotate.value = withSequence(
        withSpring(-3, { damping: 12, stiffness: 300 }),
        withSpring(0, { damping: 15, stiffness: 250 }),
      );
    } else {
      scale.value = withSpring(1, SPRING_GRAVITY);
      translateY.value = withSpring(0, SPRING_GRAVITY);
      glyphRotate.value = withSpring(0, SPRING_GRAVITY);
      glowIntensity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  // Press handlers with haptic shockwave
  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.88, SPRING_SNAPPY);
    if (isIOS) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_GRAVITY);
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

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${glyphRotate.value}deg` }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowIntensity.value, [0, 1], [0.5, 1]);
    return {
      opacity,
      transform: [
        { translateY: interpolate(glowIntensity.value, [0, 1], [1, 0]) },
      ],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.glyphItem}
    >
      <Animated.View style={[styles.glyphContent, containerStyle]}>
        {/* Glyph Icon */}
        <Animated.View style={[styles.glyphWrapper, glyphStyle]}>
          <AppIcon
            name={name}
            size={focused ? ACTIVE_ICON_SIZE : INACTIVE_ICON_SIZE}
            color={focused ? activeColor : inactiveColor}
          />
        </Animated.View>

        {/* Label */}
        <Animated.Text
          style={[
            styles.glyphLabel,
            labelStyle,
            { color: focused ? activeColor : inactiveColor },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ VANTA MONOLITHIC DOCK
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaDockProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function VantaDock({ state, descriptors, navigation }: VantaDockProps) {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const activeIndex = useSharedValue(state.index);
  const { t } = useLocale();
  const { width: screenWidth } = useWindowDimensions();

  // Calculate dimensions
  const containerWidth = screenWidth - TAB_BAR_MARGIN * 2;
  const containerPadding = 10;
  const tabWidth = (containerWidth - containerPadding * 2) / TAB_COUNT;

  // Update active index with gravity spring
  useEffect(() => {
    activeIndex.value = withSpring(state.index, SPRING_GRAVITY);
  }, [state.index]);

  // Route configuration with i18n labels
  const routeConfigMap: Record<string, { name: AppIconName; label: string }> =
    useMemo(
      () => ({
        index: { name: "home", label: t("navigation.dashboard") },
        lots: { name: "inventory-2", label: t("navigation.lots") },
        stock: { name: "checkroom", label: t("navigation.stock") },
        sales: { name: "point-of-sale", label: t("navigation.sales") },
        settings: { name: "settings", label: t("navigation.settings") },
      }),
      [t],
    );

  // Filter valid routes
  const validRoutes = useMemo(
    () => state.routes.filter((route: any) => routeConfigMap[route.name]),
    [state.routes],
  );

  return (
    <Animated.View
      entering={FadeInUp.duration(600).springify()}
      style={[
        styles.dockWrapper,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {/* Monolithic Dock Container */}
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: theme.dark ? theme.surfaceCard : theme.surfaceGlass,
            borderWidth: 1,
            borderColor: theme.dark ? theme.border : theme.border,
            boxShadow: theme.dark
              ? `0 0 1px ${theme.primary}20, 0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)`
              : `0 8px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
          },
        ]}
      >
        {/* Track Background */}
        <View
          style={[
            styles.trackBackground,
            { backgroundColor: theme.dark ? theme.surfaceCard : "transparent" },
          ]}
        />

        {/* Gold Active Indicator */}
        <GoldIndicator
          activeIndex={activeIndex}
          tabWidth={tabWidth}
          containerPadding={containerPadding}
        />

        {/* Glyph Items */}
        <View
          style={[styles.glyphsRow, { paddingHorizontal: containerPadding }]}
        >
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
              <VantaGlyph
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
      tabBar={(props) => <VantaDock {...props} />}
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
// 🎨 VANTA STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ─── Dock Wrapper ──────────────────────────────────────────────────────────
  dockWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR_MARGIN,
    paddingTop: 12,
  },

  // ─── Dock Container ────────────────────────────────────────────────────────
  dockContainer: {
    height: TAB_BAR_HEIGHT,
    borderRadius: Radius["3xl"],
    overflow: "hidden",
    borderCurve: "continuous",
    padding: 6,
  },

  // ─── Track Background ──────────────────────────────────────────────────────
  trackBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius["3xl"],
  },

  // ─── Gold Indicator ────────────────────────────────────────────────────────
  goldIndicator: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: Radius.xl,
  },

  indicatorPill: {
    flex: 1,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },

  // ─── Glyphs Row ────────────────────────────────────────────────────────────
  glyphsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },

  // ─── Glyph Item ────────────────────────────────────────────────────────────
  glyphItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },

  glyphContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  glyphWrapper: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  glyphLabel: {
    fontSize: 8,
    fontFamily: "Manrope_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
