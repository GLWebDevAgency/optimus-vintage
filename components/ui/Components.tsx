/**
 * 🧩 OPTIMUS VINTAGE - UNIFIED UI COMPONENTS
 *
 * Modern, reusable components with glass effects
 * v2.0 - Consolidated from LuxuryComponents + WarmComponents
 */

import { useNeuTheme } from "@/constants/ThemeContext";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Pressable,
    Text,
    View,
    type PressableProps,
    type ViewStyle,
} from "react-native";

const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = "left",
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const { palette, shadows, spacing, radius, typography } = useNeuTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const sizeStyles = {
    sm: {
      height: 32,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    md: {
      height: 44,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: palette.primary.main,
      borderWidth: 0,
      boxShadow: shadows.glow.css,
    },
    secondary: {
      backgroundColor: palette.background.elevated,
      borderWidth: 1,
      borderColor: palette.background.dark,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    danger: {
      backgroundColor: palette.accent.red,
      borderWidth: 0,
      boxShadow: shadows.glow.css,
    },
    success: {
      backgroundColor: palette.accent.green ?? palette.primary.main,
      borderWidth: 0,
      boxShadow: shadows.glow.css,
    },
  };

  const textColorMap: Record<string, string> = {
    primary: palette.text.white,
    secondary: palette.text.primary,
    ghost: palette.text.primary,
    danger: palette.text.white,
    success: palette.text.white,
  };

  const isDisabled = disabled || loading;
  const opacity = isDisabled ? 0.5 : 1;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        {...props}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.lg,
            opacity: pressed ? 0.8 : opacity,
            borderCurve: "continuous",
          },
          sizeStyles[size],
          variantStyles[variant],
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColorMap[variant]} size="small" />
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            <Text
              style={{
                color: textColorMap[variant],
                ...typography.label[size === "lg" ? "lg" : "md"],
                fontWeight: "600",
              }}
            >
              {children}
            </Text>
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 CARD
// ═══════════════════════════════════════════════════════════════════════════════

type SpacingKey =
  | "3xs"
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

interface CardProps {
  variant?: "default" | "glass" | "elevated";
  padding?: SpacingKey;
  noPadding?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({
  variant = "default",
  padding = "lg",
  noPadding = false,
  children,
  style,
  onPress,
}: CardProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: palette.background.elevated,
      borderWidth: 1,
      borderColor: palette.divider?.main ?? palette.background.dark,
      boxShadow: shadows.convex.css,
    },
    glass: {
      backgroundColor: palette.background.elevated,
      borderWidth: 1,
      borderColor: palette.background.dark,
    },
    elevated: {
      backgroundColor: palette.background.elevated,
      borderWidth: 1,
      borderColor: palette.divider?.main ?? palette.background.dark,
      boxShadow: shadows.hover?.css ?? shadows.convex.css,
    },
  };

  const content = (
    <View
      style={[
        {
          borderRadius: radius.xl,
          padding: noPadding ? 0 : spacing[padding],
          borderCurve: "continuous",
        },
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ SHIMMER SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

interface ShimmerSkeletonProps {
  width?: number | `${number}%` | "auto";
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerSkeleton({
  width = "100%" as const,
  height = 20,
  borderRadius,
  style,
}: ShimmerSkeletonProps) {
  const { palette, radius } = useNeuTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const resolvedBorderRadius = borderRadius ?? radius.md;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: resolvedBorderRadius,
          backgroundColor: palette.background.elevated,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📌 SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode | { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  icon,
  subtitle,
  action,
  style,
}: SectionHeaderProps) {
  const { palette, spacing, typography } = useNeuTheme();

  // Handle action as object { label, onPress } or ReactNode
  const renderAction = () => {
    if (!action) return null;
    if (
      typeof action === "object" &&
      "label" in action &&
      "onPress" in action
    ) {
      return (
        <Pressable onPress={action.onPress}>
          <Text style={{ ...typography.label.sm, color: palette.primary.main }}>
            {action.label}
          </Text>
        </Pressable>
      );
    }
    return action;
  };

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          gap: spacing.sm,
        }}
      >
        {icon}
        <View style={{ flex: 1, gap: spacing["2xs"] }}>
          <Text
            style={{ ...typography.heading.lg, color: palette.text.primary }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{ ...typography.body.sm, color: palette.text.secondary }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {renderAction()}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ CHIP
// ═══════════════════════════════════════════════════════════════════════════════

interface ChipProps {
  label: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  size?: "sm" | "md";
  selected?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({
  label,
  variant = "default",
  size = "md",
  selected = false,
  icon,
  onPress,
  style,
}: ChipProps) {
  const { palette, spacing, radius, typography } = useNeuTheme();

  const variantStyles: Record<string, { bg: string; text: string }> = {
    default: {
      bg: selected ? palette.primary.subtle : palette.background.elevated,
      text: selected ? palette.primary.main : palette.text.primary,
    },
    success: {
      bg: palette.primary.subtle,
      text: palette.accent.green ?? palette.primary.main,
    },
    danger: {
      bg: palette.accent.redGlow ?? "rgba(239, 68, 68, 0.15)",
      text: palette.accent.red,
    },
    warning: {
      bg: palette.accent.amberGlow ?? "rgba(245, 158, 11, 0.15)",
      text: palette.accent.amber,
    },
    info: {
      bg: palette.accent.blueGlow ?? "rgba(59, 130, 246, 0.15)",
      text: palette.accent.blue,
    },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: spacing["2xs"],
      paddingHorizontal: spacing.xs,
      typography: typography.label.xs,
    },
    md: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      typography: typography.label.sm,
    },
  };

  const chipContent = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing["2xs"],
          backgroundColor: variantStyles[variant].bg,
          borderRadius: radius.full,
          alignSelf: "flex-start",
          borderCurve: "continuous",
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? palette.primary.main : "transparent",
        },
        sizeStyles[size],
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          ...sizeStyles[size].typography,
          color: variantStyles[variant].text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{chipContent}</Pressable>;
  }

  return chipContent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 MOONROW BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
// Simplified, clean background in MoonRow style - no heavy animations

interface AnimatedPremiumBackgroundProps {
  variant?:
    | "light"
    | "navy"
    | "warm"
    | "cool"
    | "graphite"
    | "midnight"
    | "aurora";
  children?: React.ReactNode;
}

export function AnimatedPremiumBackground({
  variant = "light",
  children,
}: AnimatedPremiumBackgroundProps) {
  const { palette, isDark } = useNeuTheme();

  // MoonRow style: clean, simple backgrounds
  const getBackgroundColor = () => {
    if (!isDark) {
      // Light mode
      return palette.background.main;
    } else {
      // Dark mode
      return palette.background.main;
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: getBackgroundColor(),
      }}
    >
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 GLASS CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassContainerProps {
  intensity?: "light" | "medium" | "strong";
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassContainer({
  intensity = "medium",
  children,
  style,
}: GlassContainerProps) {
  const { palette, radius, isDark } = useNeuTheme();

  const blurIntensity = {
    light: isIOS ? 10 : undefined,
    medium: isIOS ? 20 : undefined,
    strong: isIOS ? 40 : undefined,
  };

  const fallbackOpacity = {
    light: palette.background.elevated,
    medium: palette.background.elevated,
    strong: "rgba(255, 255, 255, 0.2)",
  };

  if (isIOS) {
    return (
      <BlurView
        intensity={blurIntensity[intensity]!}
        tint={isDark ? "dark" : "light"}
        style={[
          {
            borderRadius: radius.xl,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: palette.background.dark,
            borderCurve: "continuous",
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Fallback for non-iOS
  return (
    <View
      style={[
        {
          backgroundColor: fallbackOpacity[intensity],
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: palette.background.dark,
          borderCurve: "continuous",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LUXURY LIST ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface LuxuryListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  leftContent?: React.ReactNode;
  leftImage?: React.ReactNode; // Alias for leftContent
  rightContent?: React.ReactNode;
  rightElement?: React.ReactNode; // Alias for rightContent
  value?: string;
  valueColor?: string;
  badge?: { label: string; variant: "success" | "danger" | "warning" | "info" };
  onPress?: () => void;
  variant?: "default" | "danger";
  style?: ViewStyle;
  index?: number;
  showDivider?: boolean;
  delay?: number; // For animation staggering
}

export function LuxuryListItem({
  title,
  subtitle,
  icon,
  leftContent,
  leftImage,
  rightContent,
  rightElement,
  value,
  valueColor,
  badge,
  onPress,
  variant = "default",
  style,
  index = 0,
  showDivider = false,
  delay,
}: LuxuryListItemProps) {
  const resolvedLeftContent = leftContent || leftImage;
  const resolvedRightContent = rightContent || rightElement;
  const { palette, spacing, radius, typography } = useNeuTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getBadgeStyle = (): { bg: string; text: string } => {
    if (!badge) return { bg: "transparent", text: palette.text.primary };
    const colors = {
      success: {
        bg: palette.primary.subtle,
        text: palette.accent.green ?? palette.primary.main,
      },
      danger: {
        bg: palette.accent.redGlow ?? "rgba(239, 68, 68, 0.15)",
        text: palette.accent.red,
      },
      warning: {
        bg: palette.accent.amberGlow ?? "rgba(245, 158, 11, 0.15)",
        text: palette.accent.amber,
      },
      info: {
        bg: palette.accent.blueGlow ?? "rgba(59, 130, 246, 0.15)",
        text: palette.accent.blue,
      },
    };
    return colors[badge.variant];
  };

  const content = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          backgroundColor: palette.background.elevated,
          borderRadius: showDivider ? 0 : radius.lg,
          gap: spacing.md,
          borderWidth: showDivider ? 0 : 1,
          borderBottomWidth: showDivider ? 1 : 1,
          borderColor:
            variant === "danger"
              ? (palette.accent.redGlow ?? "rgba(239, 68, 68, 0.15)")
              : (palette.divider?.main ?? palette.background.dark),
          borderCurve: "continuous",
        },
        style,
      ]}
    >
      {/* Left content (icon or custom content) */}
      {(icon || resolvedLeftContent) &&
        (resolvedLeftContent || (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor:
                variant === "danger"
                  ? (palette.accent.redGlow ?? "rgba(239, 68, 68, 0.15)")
                  : palette.background.elevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </View>
        ))}

      {/* Main content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...typography.body.md,
            fontWeight: "500",
            color:
              variant === "danger" ? palette.accent.red : palette.text.primary,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              ...typography.body.sm,
              color: palette.text.muted,
              marginTop: spacing["3xs"],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side: value and/or badge */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
      >
        {value && (
          <Text
            style={{
              ...typography.body.md,
              fontWeight: "600",
              color: valueColor || palette.text.primary,
            }}
          >
            {value}
          </Text>
        )}
        {badge && (
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing["3xs"],
              borderRadius: radius.sm,
              backgroundColor: getBadgeStyle().bg,
            }}
          >
            <Text
              style={{
                ...typography.label.xs,
                color: getBadgeStyle().text,
              }}
            >
              {badge.label}
            </Text>
          </View>
        )}
        {resolvedRightContent}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  title?: string;
  label?: string; // Alias for title (backward compat)
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "accent" | "danger";
  style?: ViewStyle;
  onPress?: () => void;
  delay?: number; // For animation staggering
}

export function StatCard({
  title,
  label,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  style,
  onPress,
  delay,
}: StatCardProps) {
  const displayTitle = title || label || "";
  const { palette, spacing, radius, typography } = useNeuTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const statContent = (
    <View
      style={[
        {
          backgroundColor:
            variant === "accent"
              ? palette.primary.subtle
              : palette.background.elevated,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor:
            variant === "accent"
              ? palette.primary.glow
              : (palette.divider?.main ?? palette.background.dark),
          borderCurve: "continuous",
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ ...typography.label.sm, color: palette.text.muted }}>
          {displayTitle}
        </Text>
        {icon}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: spacing.xs,
        }}
      >
        <Text style={{ ...typography.display.md, color: palette.text.primary }}>
          {value}
        </Text>
        {trend && (
          <Text
            style={{
              ...typography.label.sm,
              color: trend.isPositive
                ? palette.accent.green
                : palette.accent.red,
            }}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </Text>
        )}
      </View>
      {subtitle && (
        <Text style={{ ...typography.body.sm, color: palette.text.secondary }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {statContent}
        </Pressable>
      </Animated.View>
    );
  }

  return statContent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PROGRESS CIRCLE
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  value?: string; // Display value in center
  children?: React.ReactNode;
}

export function ProgressCircle({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  backgroundColor,
  value,
  children,
}: ProgressCircleProps) {
  const { palette, typography } = useNeuTheme();

  const progressColor = color || palette.primary.main;
  const bgColor = backgroundColor || palette.background.elevated;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ position: "absolute" }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          }}
        />
      </View>
      <View style={{ position: "absolute" }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: progressColor,
            borderRightColor: progress > 25 ? progressColor : "transparent",
            borderBottomColor: progress > 50 ? progressColor : "transparent",
            borderLeftColor: progress > 75 ? progressColor : "transparent",
            transform: [{ rotate: "-90deg" }],
          }}
        />
      </View>
      {value && (
        <Text
          style={{
            ...typography.label.sm,
            color: palette.text.primary,
            fontWeight: "600",
          }}
        >
          {value}
        </Text>
      )}
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🪟 GLASS CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps extends Omit<
  React.ComponentProps<typeof Card>,
  "variant"
> {
  delay?: number;
}

export function GlassCard({ delay, ...props }: GlassCardProps) {
  return <Card {...props} variant="glass" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 BACKWARD COMPATIBILITY ALIASES
// ═══════════════════════════════════════════════════════════════════════════════

export const WarmSectionHeader = SectionHeader;
export const WarmShimmer = ShimmerSkeleton;
export const WarmListItem = LuxuryListItem;
