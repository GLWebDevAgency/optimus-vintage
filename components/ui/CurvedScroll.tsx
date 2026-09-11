/**
 * 🌀 iOS-STYLE CURVED SCROLL SYSTEM
 *
 * Items at scroll edges curve away with 3D perspective,
 * mimicking the depth effect seen in premium iOS apps.
 *
 * Exports:
 *  - useCurvedScroll()          — vertical scroll tracker
 *  - useCurvedHorizontalScroll() — horizontal scroll tracker
 *  - CurvedItem                 — per-item 3D curve (vertical ScrollView)
 *  - CurvedHorizontalItem       — per-item 3D curve (horizontal lists)
 *  - useCurvedListItem()        — hook for FlatList/FlashList items
 *  - ScrollEdgeFade             — edge gradient overlay
 *  - CurvePreset                — tuning presets
 */

import React, { useMemo } from "react";
import { type LayoutChangeEvent, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  type SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";

// ─── Presets ────────────────────────────────────────────────────────────────────

export const CurvePreset = {
  /** Subtle — for forms, detail screens. Gentle depth. */
  subtle: {
    perspective: 1200,
    maxRotate: 3.5,
    minScale: 0.965,
    minOpacity: 0.55,
    edgeThreshold: 0.62,
  },
  /** Standard — for lists, cards. Noticeable depth. */
  standard: {
    perspective: 1000,
    maxRotate: 5,
    minScale: 0.94,
    minOpacity: 0.4,
    edgeThreshold: 0.55,
  },
  /** Dramatic — for carousels, heroes. Bold depth. */
  dramatic: {
    perspective: 800,
    maxRotate: 10,
    minScale: 0.88,
    minOpacity: 0.3,
    edgeThreshold: 0.45,
  },
} as const;

type PresetKey = keyof typeof CurvePreset;

// ─── Hook: Vertical Scroll Tracker ──────────────────────────────────────────────

export function useCurvedScroll() {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  return { scrollY, scrollHandler };
}

// ─── Hook: Horizontal Scroll Tracker ────────────────────────────────────────────

export function useCurvedHorizontalScroll() {
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });
  return { scrollX, scrollHandler };
}

// ─── Component: CurvedItem (for vertical ScrollView children) ───────────────────

interface CurvedItemProps {
  scrollY: SharedValue<number>;
  children: React.ReactNode;
  preset?: PresetKey;
  style?: any;
  entering?: any;
}

export function CurvedItem({
  scrollY,
  children,
  preset = "subtle",
  style,
  entering,
}: CurvedItemProps) {
  const reduceMotion = useReducedMotion();
  const itemY = useSharedValue(0);
  const itemH = useSharedValue(0);
  const { height: vh } = useWindowDimensions();
  const cfg = CurvePreset[preset];

  const onLayout = (e: LayoutChangeEvent) => {
    itemY.value = e.nativeEvent.layout.y;
    itemH.value = e.nativeEvent.layout.height;
  };

  const curveStyle = useAnimatedStyle(() => {
    if (reduceMotion || itemH.value === 0) return {};

    const itemCenter = itemY.value + itemH.value / 2;
    const visibleCenter = itemCenter - scrollY.value;
    const vpCenter = vh / 2;
    const normalized = (visibleCenter - vpCenter) / vpCenter; // -1 → +1
    const abs = Math.abs(normalized);

    if (abs < cfg.edgeThreshold) return {};

    const t =
      (abs - cfg.edgeThreshold) / (1 - cfg.edgeThreshold);
    const p = Math.min(t, 1);

    return {
      opacity: interpolate(p, [0, 1], [1, cfg.minOpacity], Extrapolation.CLAMP),
      transform: [
        { perspective: cfg.perspective },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, cfg.minScale],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotateX: `${interpolate(
            p,
            [0, 1],
            [0, normalized > 0 ? -cfg.maxRotate : cfg.maxRotate],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  });

  return (
    <Animated.View
      entering={entering}
      style={[style, curveStyle]}
      onLayout={onLayout}
    >
      {children}
    </Animated.View>
  );
}

// ─── Hook: For FlatList / FlashList items ───────────────────────────────────────

export function useCurvedListItem(
  scrollY: SharedValue<number>,
  index: number,
  itemHeight: number,
  preset: PresetKey = "standard",
  headerOffset: number = 0,
) {
  const reduceMotion = useReducedMotion();
  const { height: vh } = useWindowDimensions();
  const cfg = CurvePreset[preset];

  return useAnimatedStyle(() => {
    if (reduceMotion) return {};

    const itemCenter = headerOffset + index * itemHeight + itemHeight / 2;
    const visibleCenter = itemCenter - scrollY.value;
    const vpCenter = vh / 2;
    const normalized = (visibleCenter - vpCenter) / vpCenter;
    const abs = Math.abs(normalized);

    if (abs < cfg.edgeThreshold) return {};

    const p = Math.min(
      (abs - cfg.edgeThreshold) / (1 - cfg.edgeThreshold),
      1,
    );

    return {
      opacity: interpolate(p, [0, 1], [1, cfg.minOpacity], Extrapolation.CLAMP),
      transform: [
        { perspective: cfg.perspective },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, cfg.minScale],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotateX: `${interpolate(
            p,
            [0, 1],
            [0, normalized > 0 ? -cfg.maxRotate : cfg.maxRotate],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  });
}

// ─── Component: CurvedHorizontalItem ────────────────────────────────────────────

interface CurvedHorizontalItemProps {
  scrollX: SharedValue<number>;
  index: number;
  itemWidth: number;
  children: React.ReactNode;
  preset?: PresetKey;
  style?: any;
}

export function CurvedHorizontalItem({
  scrollX,
  index,
  itemWidth,
  children,
  preset = "dramatic",
  style,
}: CurvedHorizontalItemProps) {
  const reduceMotion = useReducedMotion();
  const { width: vw } = useWindowDimensions();
  const cfg = CurvePreset[preset];

  const curveStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};

    const itemCenter = index * itemWidth + itemWidth / 2;
    const visibleCenter = itemCenter - scrollX.value;
    const vpCenter = vw / 2;
    const normalized = (visibleCenter - vpCenter) / vpCenter;
    const abs = Math.abs(normalized);

    if (abs < cfg.edgeThreshold) return {};

    const p = Math.min(
      (abs - cfg.edgeThreshold) / (1 - cfg.edgeThreshold),
      1,
    );

    return {
      opacity: interpolate(p, [0, 1], [1, cfg.minOpacity], Extrapolation.CLAMP),
      transform: [
        { perspective: cfg.perspective },
        {
          scale: interpolate(
            p,
            [0, 1],
            [1, cfg.minScale],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotateY: `${interpolate(
            p,
            [0, 1],
            [0, normalized > 0 ? -cfg.maxRotate : cfg.maxRotate],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  });

  return (
    <Animated.View style={[style, curveStyle]}>{children}</Animated.View>
  );
}

// ─── Component: ScrollEdgeFade ──────────────────────────────────────────────────
// Pure-View gradient overlay (no LinearGradient dependency).
// Uses 12 thin strips with cubic-eased opacity.

interface ScrollEdgeFadeProps {
  /** Background color to fade into */
  color: string;
  position: "top" | "bottom";
  /** Fade band height in px (default 48) */
  height?: number;
  /** Scroll offset to auto-hide top fade when at scroll origin */
  scrollY?: SharedValue<number>;
}

const FADE_STEPS = 12;

export function ScrollEdgeFade({
  color,
  position,
  height = 48,
  scrollY,
}: ScrollEdgeFadeProps) {
  const strips = useMemo(
    () =>
      Array.from({ length: FADE_STEPS }, (_, i) => {
        const t = i / (FADE_STEPS - 1);
        // Cubic ease-in for smooth falloff
        return position === "bottom" ? t * t * t : (1 - t) * (1 - t) * (1 - t);
      }),
    [position],
  );

  // Hide top fade when scroll is at origin
  const fadeOpacity = useAnimatedStyle(() => {
    if (!scrollY || position !== "top") return { opacity: 1 };
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 50],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          [position]: 0,
          left: 0,
          right: 0,
          height,
          zIndex: 10,
        },
        fadeOpacity,
      ]}
    >
      {strips.map((alpha, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: color, opacity: alpha }}
        />
      ))}
    </Animated.View>
  );
}
