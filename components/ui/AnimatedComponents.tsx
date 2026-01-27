/**
 * 🎬 Optimus Vintage - Premium Animated Components (Moti)
 * Declarative, composable animation components
 *
 * Usage:
 * <AnimatedCard delay={100}>
 *   <Text>Content</Text>
 * </AnimatedCard>
 */

import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Theme } from "@/constants/Theme";
import type { MotiProps } from "moti";
import { AnimatePresence, MotiText, MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
import React, { ReactNode } from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

type MotiTransitionProp = MotiProps["transition"];

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ TRANSITION PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const Transitions = {
  spring: {
    type: "spring" as const,
    damping: 18,
    stiffness: 120,
    mass: 1,
  },
  springBouncy: {
    type: "spring" as const,
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
  springStiff: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
    mass: 1,
  },
  timing: {
    type: "timing" as const,
    duration: 300,
  },
  timingFast: {
    type: "timing" as const,
    duration: 150,
  },
  timingSlow: {
    type: "timing" as const,
    duration: 500,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANIMATED CONTAINER - Base animated wrapper
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  animation?: "fadeUp" | "fadeIn" | "scaleIn" | "slideRight" | "slideLeft";
  exitAnimation?:
    | "fadeOut"
    | "fadeUp"
    | "scaleOut"
    | "slideRight"
    | "slideLeft";
  transition?: MotiTransitionProp;
}

export function AnimatedContainer({
  children,
  style,
  delay = 0,
  animation = "fadeUp",
  exitAnimation = "fadeOut",
  transition = Transitions.spring,
}: AnimatedContainerProps) {
  const getAnimationProps = () => {
    switch (animation) {
      case "fadeIn":
        return {
          from: { opacity: 0 },
          animate: { opacity: 1 },
        };
      case "fadeUp":
        return {
          from: { opacity: 0, translateY: 20 },
          animate: { opacity: 1, translateY: 0 },
        };
      case "scaleIn":
        return {
          from: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
        };
      case "slideRight":
        return {
          from: { opacity: 0, translateX: -30 },
          animate: { opacity: 1, translateX: 0 },
        };
      case "slideLeft":
        return {
          from: { opacity: 0, translateX: 30 },
          animate: { opacity: 1, translateX: 0 },
        };
      default:
        return {
          from: { opacity: 0, translateY: 20 },
          animate: { opacity: 1, translateY: 0 },
        };
    }
  };

  const getExitProps = () => {
    switch (exitAnimation) {
      case "fadeOut":
        return { opacity: 0 };
      case "fadeUp":
        return { opacity: 0, translateY: -20 };
      case "scaleOut":
        return { opacity: 0, scale: 0.9 };
      case "slideRight":
        return { opacity: 0, translateX: 30 };
      case "slideLeft":
        return { opacity: 0, translateX: -30 };
      default:
        return { opacity: 0 };
    }
  };

  const animProps = getAnimationProps();

  return (
    <MotiView
      {...animProps}
      exit={getExitProps()}
      transition={{ ...transition, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 ANIMATED CARD - Card with entrance animation
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCardProps {
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
  index?: number;
  variant?: "default" | "outlined" | "elevated";
  onPress?: () => void;
}

export function AnimatedCard({
  children,
  style,
  delay = 0,
  index = 0,
  variant = "default",
  onPress,
}: AnimatedCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  const staggerDelay = delay + index * 50;

  const cardStyles: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    variant === "outlined" && styles.cardOutlined,
    variant === "elevated" && styles.cardElevated,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <MotiPressable
        onPress={onPress}
        animate={({ pressed }) => {
          "worklet";
          return {
            scale: pressed ? 0.98 : 1,
            opacity: pressed ? 0.9 : 1,
          };
        }}
        transition={Transitions.springBouncy}
      >
        <MotiView
          from={{ opacity: 0, translateY: 15, scale: 0.98 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -10, scale: 0.98 }}
          transition={{ ...Transitions.spring, delay: staggerDelay }}
          style={cardStyles}
        >
          {children}
        </MotiView>
      </MotiPressable>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -10, scale: 0.98 }}
      transition={{ ...Transitions.spring, delay: staggerDelay }}
      style={cardStyles}
    >
      {children}
    </MotiView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ANIMATED STAT - Number that counts up
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedStatProps {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  delay?: number;
  decimals?: number;
}

export function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  style,
  delay = 0,
  decimals = 0,
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const duration = 1200;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = value * easeOut;

        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  const formattedValue =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <MotiText
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...Transitions.spring, delay }}
      style={style}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </MotiText>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 ANIMATED BUTTON - Press with feedback
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedButtonProps {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  delay?: number;
}

export function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
  variant = "primary",
  size = "md",
  delay = 0,
}: AnimatedButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: theme.primary,
        };
      case "secondary":
        return {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {};
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case "lg":
        return { paddingVertical: 18, paddingHorizontal: 28 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 20 };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return theme.text;
      case "ghost":
        return theme.primary;
      default:
        return theme.text;
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case "sm":
        return 13;
      case "lg":
        return 17;
      default:
        return 15;
    }
  };

  // Wrap string children in Text component
  const renderChildren = () => {
    if (typeof children === "string") {
      return (
        <Text
          style={{
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      );
    }
    return children;
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay }}
    >
      <MotiPressable
        onPress={disabled ? undefined : onPress}
        animate={({
          pressed,
          hovered,
        }: {
          pressed: boolean;
          hovered: boolean;
        }) => {
          "worklet";
          return {
            scale: pressed ? 0.96 : hovered ? 1.02 : 1,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          };
        }}
        transition={Transitions.springBouncy}
        style={[styles.button, getVariantStyle(), getSizeStyle(), style]}
      >
        {renderChildren()}
      </MotiPressable>
    </MotiView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💀 ANIMATED SKELETON - Loading placeholder
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  delay?: number;
}

export function AnimatedSkeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  delay = 0,
}: AnimatedSkeletonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300, delay }}
    >
      <MotiView
        from={{ opacity: 0.4 }}
        animate={{ opacity: 0.8 }}
        transition={{
          type: "timing",
          duration: 800,
          loop: true,
        }}
        style={[
          {
            width: typeof width === "number" ? width : undefined,
            height,
            borderRadius,
            backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA",
          },
          typeof width === "string" && { width: width as any },
          style,
        ]}
      />
    </MotiView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ANIMATED SPINNER - Loading indicator
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedSpinnerProps {
  size?: number;
  color?: string;
}

export function AnimatedSpinner({ size = 24, color }: AnimatedSpinnerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];
  const spinnerColor = color ?? theme.primary;

  return (
    <MotiView
      from={{ rotate: "0deg" }}
      animate={{ rotate: "360deg" }}
      transition={{
        type: "timing",
        duration: 1000,
        loop: true,
      }}
      style={[
        styles.spinner,
        {
          width: size,
          height: size,
          borderColor: spinnerColor,
          borderTopColor: "transparent",
        },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 ANIMATED PRESENCE WRAPPER - For mount/unmount animations
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedPresenceProps {
  children: ReactNode;
  visible: boolean;
  animation?: "fade" | "scale" | "slideUp" | "slideDown";
}

export function AnimatedPresenceWrapper({
  children,
  visible,
  animation = "fade",
}: AnimatedPresenceProps) {
  const getAnimationConfig = () => {
    switch (animation) {
      case "scale":
        return {
          from: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
        };
      case "slideUp":
        return {
          from: { opacity: 0, translateY: 30 },
          animate: { opacity: 1, translateY: 0 },
          exit: { opacity: 0, translateY: -30 },
        };
      case "slideDown":
        return {
          from: { opacity: 0, translateY: -30 },
          animate: { opacity: 1, translateY: 0 },
          exit: { opacity: 0, translateY: 30 },
        };
      default:
        return {
          from: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <MotiView {...getAnimationConfig()} transition={Transitions.spring}>
          {children}
        </MotiView>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 ANIMATED LIST ITEM - For FlatList/ScrollView items
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  style?: ViewStyle;
  baseDelay?: number;
  onPress?: () => void;
}

export function AnimatedListItem({
  children,
  index,
  style,
  baseDelay = 50,
  onPress,
}: AnimatedListItemProps) {
  const delay = Math.min(index * baseDelay, 400);

  const content = (
    <MotiView
      from={{ opacity: 0, translateY: 15, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -10 }}
      transition={{
        ...Transitions.spring,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );

  if (onPress) {
    return (
      <MotiPressable
        onPress={onPress}
        animate={({ pressed }: { pressed: boolean; hovered: boolean }) => {
          "worklet";
          return {
            scale: pressed ? 0.98 : 1,
            opacity: pressed ? 0.9 : 1,
          };
        }}
        transition={Transitions.timingFast}
      >
        {content}
      </MotiPressable>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ ANIMATED BADGE - For notifications and counts
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedBadgeProps {
  count: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedBadge({ count, style, textStyle }: AnimatedBadgeProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <MotiView
        key={count}
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={Transitions.springBouncy}
        style={[styles.badge, { backgroundColor: Palette.danger[500] }, style]}
      >
        <MotiText style={[styles.badgeText, textStyle]}>
          {count > 99 ? "99+" : count}
        </MotiText>
      </MotiView>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANIMATED ICON BUTTON - For toolbar actions
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedIconButtonProps {
  children: ReactNode;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}

export function AnimatedIconButton({
  children,
  onPress,
  size = 44,
  style,
}: AnimatedIconButtonProps) {
  return (
    <MotiPressable
      onPress={onPress}
      animate={({
        pressed,
        hovered,
      }: {
        pressed: boolean;
        hovered: boolean;
      }) => {
        "worklet";
        return {
          scale: pressed ? 0.85 : hovered ? 1.05 : 1,
          opacity: pressed ? 0.7 : 1,
        };
      }}
      transition={Transitions.springBouncy}
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {children}
    </MotiPressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌟 PULSE INDICATOR - For live/active states
// ═══════════════════════════════════════════════════════════════════════════════

interface PulseIndicatorProps {
  color?: string;
  size?: number;
}

export function PulseIndicator({
  color = "#34C759",
  size = 8,
}: PulseIndicatorProps) {
  return (
    <MotiView
      from={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{
        type: "timing",
        duration: 1500,
        loop: true,
      }}
      style={[
        styles.pulseRing,
        {
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          borderColor: color,
        },
      ]}
    >
      <MotiView
        style={[
          styles.pulseDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </MotiView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderCurve: "continuous",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  cardOutlined: {
    borderWidth: 1,
    boxShadow: "none",
  },
  cardElevated: {
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 999,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  pulseRing: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    position: "absolute",
  },
});

// Re-export AnimatePresence for convenience
export { AnimatePresence };
