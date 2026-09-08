/**
 * 🎬 Optimus Vintage - Premium Animation System
 * World-class animations inspired by Apple, Linear, Stripe, Revolut
 *
 * Features:
 * - Spring-based physics for natural feel
 * - Staggered list animations
 * - Counting number animations
 * - Shimmer loading effects
 * - Micro-interaction utilities
 */

import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ ANIMATION CONFIGS - Premium spring physics
// ═══════════════════════════════════════════════════════════════════════════════

export const SpringConfigs = {
  // Ultra smooth for primary interactions
  gentle: {
    tension: 120,
    friction: 14,
    useNativeDriver: true,
  },
  // Responsive for buttons
  responsive: {
    tension: 180,
    friction: 12,
    useNativeDriver: true,
  },
  // Bouncy for playful elements
  bouncy: {
    tension: 200,
    friction: 8,
    useNativeDriver: true,
  },
  // Stiff for quick actions
  stiff: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  },
  // Wobbly for attention
  wobbly: {
    tension: 180,
    friction: 6,
    useNativeDriver: true,
  },
};

export const TimingConfigs = {
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    useNativeDriver: true,
  },
  normal: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    useNativeDriver: true,
  },
  smooth: {
    duration: 400,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    useNativeDriver: true,
  },
  slow: {
    duration: 600,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    useNativeDriver: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PRESS ANIMATION - Premium button feedback
// ═══════════════════════════════════════════════════════════════════════════════

export function usePressAnimation(config: {
  scaleTo?: number;
  type?: "spring" | "timing";
}) {
  const { scaleTo = 0.96, type = "spring" } = config;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (type === "spring") {
      Animated.spring(scale, {
        toValue: scaleTo,
        ...SpringConfigs.responsive,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: scaleTo,
        ...TimingConfigs.fast,
      }).start();
    }
  }, [scale, scaleTo, type]);

  const handlePressOut = useCallback(() => {
    if (type === "spring") {
      Animated.spring(scale, {
        toValue: 1,
        ...SpringConfigs.bouncy,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        ...TimingConfigs.fast,
      }).start();
    }
  }, [scale, type]);

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
    transform: [{ scale }],
  };

  return {
    scale,
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 ENTRANCE ANIMATIONS - Staggered list effects
// ═══════════════════════════════════════════════════════════════════════════════

export function useEntranceAnimation(config: {
  delay?: number;
  duration?: number;
  type?: "fadeUp" | "fadeIn" | "scaleIn" | "slideRight";
}) {
  const { delay = 0, duration = 500, type = "fadeUp" } = config;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(type === "fadeUp" ? 30 : 0),
  ).current;
  const translateX = useRef(
    new Animated.Value(type === "slideRight" ? -40 : 0),
  ).current;
  const scale = useRef(
    new Animated.Value(type === "scaleIn" ? 0.8 : 1),
  ).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          ...SpringConfigs.gentle,
          delay: 0,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          ...SpringConfigs.gentle,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...SpringConfigs.gentle,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration, opacity, translateY, translateX, scale]);

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
    opacity,
    transform: [{ translateY }, { translateX }, { scale }],
  };

  return { animatedStyle, opacity, translateY };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 COUNTING ANIMATION - Animated numbers for KPIs
// ═══════════════════════════════════════════════════════════════════════════════

export function useCountingAnimation(config: {
  value: number;
  duration?: number;
  delay?: number;
  formatFn?: (n: number) => string;
}) {
  const { value, duration = 1200, delay = 0, formatFn } = config;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false, // Required for text updates
      }).start();
    }, delay);

    const listener = animatedValue.addListener(({ value: v }) => {
      displayValue.current = v;
    });

    return () => {
      clearTimeout(timeout);
      animatedValue.removeListener(listener);
    };
  }, [value, duration, delay, animatedValue]);

  return {
    animatedValue,
    getDisplayValue: () =>
      formatFn
        ? formatFn(displayValue.current)
        : Math.round(displayValue.current).toString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ SHIMMER ANIMATION - Premium loading effect
// ═══════════════════════════════════════════════════════════════════════════════

export function useShimmerAnimation() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return { shimmer, translateX };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💫 GLOW PULSE - Pulsating glow effect
// ═══════════════════════════════════════════════════════════════════════════════

export function useGlowPulse(config?: { duration?: number }) {
  const { duration = 2000 } = config ?? {};
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, duration]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return { pulse, glowOpacity, glowScale };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎪 STAGGER ANIMATION - For list items
// ═══════════════════════════════════════════════════════════════════════════════

export function getStaggerDelay(index: number, baseDelay = 50) {
  // Decreasing delays for later items (faster cascade)
  return Math.min(index * baseDelay, 400);
}

export function useStaggeredList(itemCount: number, baseDelay = 60) {
  const animations = useRef(
    Array.from({ length: itemCount }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    })),
  ).current;

  useEffect(() => {
    const staggeredAnimations = animations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * baseDelay,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          delay: index * baseDelay,
          ...SpringConfigs.gentle,
        }),
      ]),
    );

    Animated.stagger(baseDelay, staggeredAnimations).start();
  }, [animations, baseDelay]);

  return animations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ROTATE ANIMATION - Spinning elements
// ═══════════════════════════════════════════════════════════════════════════════

export function useRotateAnimation(config?: { duration?: number }) {
  const { duration = 1000 } = config ?? {};
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation, duration]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return { rotation, rotate };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 GRADIENT ANIMATION - Moving gradient effect
// ═══════════════════════════════════════════════════════════════════════════════

export function useGradientAnimation(config?: { duration?: number }) {
  const { duration = 3000 } = config ?? {};
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, duration]);

  return { progress };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SCROLL ANIMATIONS - Header parallax effects
// ═══════════════════════════════════════════════════════════════════════════════

export function createScrollAnimations(scrollY: Animated.Value) {
  // Header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Header blur intensity
  const headerBlur = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: "clamp",
  });

  // Hero section parallax
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [50, 0, -30],
    extrapolate: "clamp",
  });

  // Hero scale effect
  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  // Title size morph
  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });

  return {
    headerOpacity,
    headerBlur,
    heroTranslateY,
    heroScale,
    titleScale,
  };
}
