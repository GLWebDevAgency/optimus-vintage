/**
 * 🚀 Optimus Vintage - Premium Animation System (Reanimated 3 + Moti)
 * World-class animations inspired by Apple, Linear, Stripe, Revolut
 *
 * This is the modern replacement for animations.ts using:
 * - React Native Reanimated 3 (60fps native thread animations)
 * - Moti (declarative animation API)
 *
 * Features:
 * ✨ Spring-based physics for natural feel
 * ✨ Staggered list animations with entering/exiting
 * ✨ Layout animations
 * ✨ Gesture-driven animations
 * ✨ Skeleton loaders
 * ✨ Micro-interactions
 */

import { useCallback, useEffect } from "react";
import {
    BounceIn,
    BounceOut,
    Easing,
    Extrapolation,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    FadeOutDown,
    FadeOutUp,
    FadingTransition,
    FlipInEasyX,
    FlipOutEasyX,
    JumpingTransition,
    Layout,
    LinearTransition,
    SequencedTransition,
    SharedValue,
    SlideInLeft,
    SlideInRight,
    SlideOutLeft,
    SlideOutRight,
    ZoomIn,
    ZoomOut,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ SPRING CONFIGS - Reanimated 3 premium physics
// ═══════════════════════════════════════════════════════════════════════════════

export const ReanimatedSpring = {
  /** Ultra smooth for primary interactions - Apple-like */
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  /** Responsive for buttons and toggles */
  responsive: {
    damping: 15,
    stiffness: 180,
    mass: 1,
    overshootClamping: false,
  },
  /** Bouncy for playful elements - Stripe-like */
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
    overshootClamping: false,
  },
  /** Stiff for quick snappy actions */
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  },
  /** Wobbly for attention-grabbing */
  wobbly: {
    damping: 8,
    stiffness: 180,
    mass: 0.6,
    overshootClamping: false,
  },
  /** Slow and elegant for modals */
  elegant: {
    damping: 30,
    stiffness: 100,
    mass: 1.2,
    overshootClamping: false,
  },
} as const;

export const ReanimatedTiming = {
  /** Fast micro-interactions (150ms) */
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  /** Normal transitions (300ms) */
  normal: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  /** Smooth Apple-like transitions (400ms) */
  smooth: {
    duration: 400,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
  /** Slow elegant transitions (600ms) */
  slow: {
    duration: 600,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  },
  /** Extra slow for dramatic effect */
  dramatic: {
    duration: 800,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PREDEFINED ENTERING/EXITING ANIMATIONS - Ready to use
// ═══════════════════════════════════════════════════════════════════════════════

export const EnteringAnimations = {
  /** Fade in from bottom - elegant list items */
  fadeUp: FadeInUp.duration(400).springify().damping(18).stiffness(120),

  /** Fade in from top - dropdown menus */
  fadeDown: FadeInDown.duration(400).springify().damping(18).stiffness(120),

  /** Simple fade in */
  fadeIn: FadeIn.duration(300),

  /** Slide from right - navigation forward */
  slideRight: SlideInRight.duration(350).springify().damping(20).stiffness(150),

  /** Slide from left - navigation back */
  slideLeft: SlideInLeft.duration(350).springify().damping(20).stiffness(150),

  /** Zoom in with bounce - modals */
  zoomBounce: ZoomIn.springify().damping(12).stiffness(200),

  /** Bounce in - celebration */
  bounce: BounceIn.duration(500),

  /** Flip in - card reveals */
  flip: FlipInEasyX.duration(400),

  /** Quick zoom - quick menus */
  quickZoom: ZoomIn.duration(200),
};

export const ExitingAnimations = {
  /** Fade out to top */
  fadeUp: FadeOutUp.duration(300),

  /** Fade out to bottom */
  fadeDown: FadeOutDown.duration(300),

  /** Simple fade out */
  fadeOut: FadeOut.duration(250),

  /** Slide to right - navigation forward */
  slideRight: SlideOutRight.duration(300),

  /** Slide to left - navigation back */
  slideLeft: SlideOutLeft.duration(300),

  /** Zoom out */
  zoomOut: ZoomOut.duration(200),

  /** Bounce out */
  bounce: BounceOut.duration(400),

  /** Flip out */
  flip: FlipOutEasyX.duration(300),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 LAYOUT TRANSITIONS - For dynamic content changes
// ═══════════════════════════════════════════════════════════════════════════════

export const LayoutTransitions = {
  /** Smooth linear transition for lists */
  linear: LinearTransition.springify().damping(18).stiffness(120),

  /** Sequenced transition for complex layouts */
  sequenced: SequencedTransition.duration(400),

  /** Fading transition for grids */
  fading: FadingTransition.duration(350),

  /** Jumping transition for playful UIs */
  jumping: JumpingTransition.duration(400),

  /** Default spring layout */
  spring: Layout.springify().damping(15).stiffness(150),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PRESS ANIMATION HOOK - Premium button feedback
// ═══════════════════════════════════════════════════════════════════════════════

export function usePressAnimationReanimated(config?: {
  scaleTo?: number;
  springConfig?: keyof typeof ReanimatedSpring;
}) {
  const { scaleTo = 0.96, springConfig = "responsive" } = config ?? {};

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    "worklet";
    scale.value = withSpring(scaleTo, ReanimatedSpring[springConfig]);
    opacity.value = withTiming(0.9, ReanimatedTiming.fast);
  }, [scale, opacity, scaleTo, springConfig]);

  const handlePressOut = useCallback(() => {
    "worklet";
    scale.value = withSpring(1, ReanimatedSpring.bouncy);
    opacity.value = withTiming(1, ReanimatedTiming.fast);
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    scale,
    opacity,
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ PULSE ANIMATION - For attention-grabbing elements
// ═══════════════════════════════════════════════════════════════════════════════

export function usePulseAnimation(config?: {
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
}) {
  const {
    minScale = 1,
    maxScale = 1.05,
    minOpacity = 0.7,
    maxOpacity = 1,
    duration = 1500,
  } = config ?? {};

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1, // infinite
      false,
    );
  }, [progress, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [minScale, maxScale]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [maxOpacity, minOpacity]),
  }));

  return { progress, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💫 SHIMMER ANIMATION - Premium skeleton loading
// ═══════════════════════════════════════════════════════════════════════════════

export function useShimmerAnimation(config?: {
  duration?: number;
  width?: number;
}) {
  const { duration = 1500, width = 200 } = config ?? {};

  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width * 2, {
        duration,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      false,
    );
  }, [translateX, duration, width]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { translateX, shimmerStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔢 COUNTING NUMBER ANIMATION - For KPIs and stats
// ═══════════════════════════════════════════════════════════════════════════════

export function useCountingNumber(config: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const { value, duration = 1200, delay = 0 } = config;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    );
  }, [animatedValue, value, duration, delay]);

  return animatedValue;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ROTATE ANIMATION - Spinning loaders
// ═══════════════════════════════════════════════════════════════════════════════

export function useRotateAnimation(config?: { duration?: number }) {
  const { duration = 1000 } = config ?? {};

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { rotation, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎪 STAGGER HELPERS - For list item animations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get stagger delay for list items
 * @param index - Item index in list
 * @param baseDelay - Base delay in ms (default: 50)
 * @param maxDelay - Maximum delay cap (default: 400)
 */
export function getStaggerDelay(index: number, baseDelay = 50, maxDelay = 400) {
  return Math.min(index * baseDelay, maxDelay);
}

/**
 * Create entering animation with stagger delay
 */
export function createStaggeredEntering(index: number, baseDelay = 50) {
  return FadeInUp.delay(getStaggerDelay(index, baseDelay))
    .springify()
    .damping(18)
    .stiffness(120);
}

/**
 * Create exiting animation with stagger delay
 */
export function createStaggeredExiting(index: number, baseDelay = 30) {
  return FadeOutUp.delay(getStaggerDelay(index, baseDelay)).duration(250);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 WAVE ANIMATION - For loading states
// ═══════════════════════════════════════════════════════════════════════════════

export function useWaveAnimation(config?: {
  amplitude?: number;
  frequency?: number;
  duration?: number;
}) {
  const { amplitude = 5, duration = 800 } = config ?? {};

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(amplitude, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [translateY, amplitude, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { translateY, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SCROLL-BASED ANIMATIONS - Header parallax effects
// ═══════════════════════════════════════════════════════════════════════════════

export function useScrollAnimations(scrollY: SharedValue<number>) {
  const headerOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP),
  }));

  const heroTranslateY = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, 100],
          [50, 0, -30],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const heroScale = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.2, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const titleScale = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.75],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return {
    headerOpacity,
    heroTranslateY,
    heroScale,
    titleScale,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 TOGGLE ANIMATION - For switches and toggles
// ═══════════════════════════════════════════════════════════════════════════════

export function useToggleAnimation(
  isActive: boolean,
  config?: {
    translateX?: number;
    springConfig?: keyof typeof ReanimatedSpring;
  },
) {
  const { translateX = 20, springConfig = "responsive" } = config ?? {};

  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(
      isActive ? 1 : 0,
      ReanimatedSpring[springConfig],
    );
  }, [isActive, progress, springConfig]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, translateX]) },
    ],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor:
      interpolate(progress.value, [0, 1], [0, 1]) > 0.5 ? "#34C759" : "#E5E5EA",
  }));

  return { progress, knobStyle, trackStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 BREATHING ANIMATION - Subtle ambient effects
// ═══════════════════════════════════════════════════════════════════════════════

export function useBreathingAnimation(config?: {
  minScale?: number;
  maxScale?: number;
  duration?: number;
}) {
  const { minScale = 0.98, maxScale = 1.02, duration = 3000 } = config ?? {};

  const scale = useSharedValue(minScale);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(minScale, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [scale, minScale, maxScale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SHAKE ANIMATION - For error states
// ═══════════════════════════════════════════════════════════════════════════════

export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shake, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 SUCCESS ANIMATION - Celebration effect
// ═══════════════════════════════════════════════════════════════════════════════

export function useSuccessAnimation() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const trigger = useCallback(() => {
    scale.value = 0;
    opacity.value = 1;

    scale.value = withSequence(
      withSpring(1.2, ReanimatedSpring.bouncy),
      withSpring(1, ReanimatedSpring.gentle),
    );

    opacity.value = withDelay(800, withTiming(0, { duration: 300 }));
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { trigger, animatedStyle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 MODAL ANIMATION PRESETS - For sheets and modals
// ═══════════════════════════════════════════════════════════════════════════════

export const ModalAnimations = {
  /** Bottom sheet slide up */
  sheetEntering: FadeInUp.springify().damping(20).stiffness(150),
  sheetExiting: FadeOutDown.duration(250),

  /** Center modal zoom */
  modalEntering: ZoomIn.springify().damping(15).stiffness(180),
  modalExiting: ZoomOut.duration(200),

  /** Full screen slide */
  fullScreenEntering: SlideInRight.springify().damping(25).stiffness(150),
  fullScreenExiting: SlideOutRight.duration(300),
};

// Export all entering/exiting from reanimated for convenience
export {
    BounceIn,
    BounceOut, FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, FadeOutUp, FlipInEasyX,
    FlipOutEasyX,
    Layout,
    LinearTransition, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, ZoomIn,
    ZoomOut
};

