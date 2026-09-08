/**
 * 🎬 Optimus Vintage - Animation System Index
 *
 * Central export for all animation utilities
 *
 * Usage:
 * import { AnimatedCard, EnteringAnimations, usePressAnimationReanimated } from '@/utils/animations';
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 REANIMATED 3 - Low-level powerful animations
// ═══════════════════════════════════════════════════════════════════════════════

export {
    BounceIn,
    BounceOut,
    // Predefined entering animations
    EnteringAnimations,

    // Predefined exiting animations
    ExitingAnimations,
    // Re-exported from reanimated
    FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, FadeOutUp, FlipInEasyX,
    FlipOutEasyX,
    Layout,
    // Layout transitions
    LayoutTransitions, LinearTransition,
    // Modal animation presets
    ModalAnimations,
    // Spring & Timing configs
    ReanimatedSpring,
    ReanimatedTiming, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, ZoomIn,
    ZoomOut, createStaggeredEntering,
    createStaggeredExiting,
    // Stagger helpers
    getStaggerDelay, useBreathingAnimation, useCountingNumber,
    // Animation hooks
    usePressAnimationReanimated,
    usePulseAnimation, useRotateAnimation, useScrollAnimations, useShakeAnimation, useShimmerAnimation, useSuccessAnimation, useToggleAnimation, useWaveAnimation
} from "./animations-reanimated";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 MOTI - Declarative animated components
// ═══════════════════════════════════════════════════════════════════════════════

export {
    AnimatePresence, AnimatedBadge,
    // UI Components
    AnimatedButton, AnimatedCard,
    // Animated containers
    AnimatedContainer, AnimatedIconButton, AnimatedListItem,
    // Mount/unmount animations
    AnimatedPresenceWrapper,
    // Loading states
    AnimatedSkeleton,
    AnimatedSpinner, AnimatedStat, PulseIndicator,
    // Transition presets
    Transitions
} from "@/components/ui/AnimatedComponents";

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 LEGACY - Old Animated API (for backwards compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

export {
    SpringConfigs,
    TimingConfigs, createScrollAnimations, useCountingAnimation, useEntranceAnimation, useGlowPulse, useGradientAnimation, usePressAnimation, useRotateAnimation as useRotateAnimationLegacy, useShimmerAnimation as useShimmerAnimationLegacy, useStaggeredList
} from "./animations";

