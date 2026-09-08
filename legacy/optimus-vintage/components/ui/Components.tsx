/**
 * 🧩 OPTIMUS VINTAGE - UNIFIED UI COMPONENTS
 *
 * Modern, reusable components with glass effects
 * v2.0 - Consolidated from LuxuryComponents + WarmComponents
 */

import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
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
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint describing what happens when pressed */
  accessibilityHint?: string;
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
  accessibilityLabel,
  accessibilityHint,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
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
      paddingHorizontal: Spacing.md,
      gap: Spacing.xs,
    },
    md: {
      height: 44,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
    },
    lg: {
      height: 52,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.primary,
      borderWidth: 0,
      boxShadow: theme.shadowGlow,
    },
    secondary: {
      backgroundColor: theme.surfaceGlassStrong,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    danger: {
      backgroundColor: theme.danger,
      borderWidth: 0,
      boxShadow: theme.shadowGlow,
    },
    success: {
      backgroundColor: theme.success,
      borderWidth: 0,
      boxShadow: theme.shadowGlow,
    },
  };

  const textColorMap: Record<string, string> = {
    primary: theme.textOnAccent,
    secondary: theme.text,
    ghost: theme.text,
    danger: "#FFFFFF",
    success: "#FFFFFF",
  };

  const isDisabled = disabled || loading;
  const opacity = isDisabled ? 0.5 : 1;

  // Derive accessibility label from children if not provided
  const a11yLabel =
    accessibilityLabel || (typeof children === "string" ? children : undefined);

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
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        {...props}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radius.lg,
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
                ...Typography.label[size === "lg" ? "lg" : "md"],
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

interface CardProps {
  variant?: "default" | "glass" | "elevated";
  padding?: keyof typeof Spacing;
  noPadding?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint describing what happens when pressed */
  accessibilityHint?: string;
}

export function Card({
  variant = "default",
  padding = "lg",
  noPadding = false,
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
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
      backgroundColor: theme.surfaceCard,
      borderWidth: 1,
      borderColor: theme.borderCard,
      // Premium multi-layer glassmorphic shadow
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.02),
        0 2px 4px rgba(0, 0, 0, 0.02),
        0 4px 8px rgba(0, 0, 0, 0.03),
        0 8px 16px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.6)
      `,
    },
    glass: {
      backgroundColor: theme.surfaceGlass,
      borderWidth: 1,
      borderColor: theme.border,
      // Glassmorphic effect
      boxShadow: `
        0 4px 12px rgba(0, 0, 0, 0.05),
        0 8px 24px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.4)
      `,
    },
    elevated: {
      backgroundColor: theme.surfaceCard,
      borderWidth: 1,
      borderColor: theme.borderCard,
      // Premium elevated shadow with depth
      boxShadow: `
        0 2px 4px rgba(0, 0, 0, 0.02),
        0 4px 8px rgba(0, 0, 0, 0.03),
        0 8px 16px rgba(0, 0, 0, 0.04),
        0 16px 32px rgba(0, 0, 0, 0.06),
        0 32px 64px rgba(16, 185, 129, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.7)
      `,
    },
  };

  const content = (
    <View
      style={[
        {
          borderRadius: Radius.xl,
          padding: noPadding ? 0 : Spacing[padding],
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
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
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
  borderRadius = Radius.md,
  style,
}: ShimmerSkeletonProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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
          borderRadius,
          backgroundColor: theme.surfaceGlass,
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];

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
          <Text style={{ ...Typography.label.sm, color: theme.primary }}>
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
          gap: Spacing.md,
          marginBottom: Spacing.md,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          gap: Spacing.sm,
        }}
      >
        {icon}
        <View style={{ flex: 1, gap: Spacing["2xs"] }}>
          <Text style={{ ...Typography.heading.lg, color: theme.text }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ ...Typography.body.sm, color: theme.textSecondary }}>
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
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint describing what happens when pressed */
  accessibilityHint?: string;
}

export function Chip({
  label,
  variant = "default",
  size = "md",
  selected = false,
  icon,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ChipProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];

  const variantStyles: Record<string, { bg: string; text: string }> = {
    default: {
      bg: selected ? theme.primarySubtle : theme.surfaceGlassStrong,
      text: selected ? theme.primary : theme.text,
    },
    success: {
      bg: theme.successSubtle,
      text: theme.success,
    },
    danger: {
      bg: theme.dangerSubtle,
      text: theme.danger,
    },
    warning: {
      bg: theme.warningSubtle,
      text: theme.warning,
    },
    info: {
      bg: theme.infoSubtle,
      text: theme.info,
    },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: Spacing["2xs"],
      paddingHorizontal: Spacing.xs,
      typography: Typography.label.xs,
    },
    md: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      typography: Typography.label.sm,
    },
  };

  const chipContent = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing["2xs"],
          backgroundColor: variantStyles[variant].bg,
          borderRadius: Radius.full,
          alignSelf: "flex-start",
          borderCurve: "continuous",
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? theme.primary : "transparent",
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
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ selected }}
      >
        {chipContent}
      </Pressable>
    );
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
  const colorScheme = useColorScheme() ?? "light";

  // MoonRow style: clean, simple backgrounds
  const getBackgroundColor = () => {
    if (colorScheme === "light") {
      switch (variant) {
        case "navy":
          return Palette.navy[900];
        case "warm":
        case "graphite":
        case "midnight":
        case "aurora":
        case "cool":
        case "light":
        default:
          return Palette.neutral.white;
      }
    } else {
      // Dark mode: navy-based backgrounds
      switch (variant) {
        case "light":
          return Palette.neutral.white;
        case "navy":
          return Palette.neutral[900];
        case "warm":
          return Palette.neutral[50];
        case "cool":
          return Palette.neutral[50];
        case "graphite":
          return Palette.neutral[800];
        case "midnight":
          return Palette.neutral[950];
        case "aurora":
          return Palette.neutral[900];
        default:
          return Palette.neutral.white;
      }
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];

  const blurIntensity = {
    light: isIOS ? 10 : undefined,
    medium: isIOS ? 20 : undefined,
    strong: isIOS ? 40 : undefined,
  };

  const fallbackOpacity = {
    light: theme.surfaceGlass,
    medium: theme.surfaceGlassStrong,
    strong: Palette.glass.white20,
  };

  if (isIOS) {
    return (
      <BlurView
        intensity={blurIntensity[intensity]!}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          {
            borderRadius: Radius.xl,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.border,
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
          borderRadius: Radius.xl,
          borderWidth: 1,
          borderColor: theme.border,
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
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
    if (!badge) return { bg: "transparent", text: theme.text };
    const colors = {
      success: { bg: theme.successSubtle, text: theme.success },
      danger: { bg: theme.dangerSubtle, text: theme.danger },
      warning: { bg: theme.warningSubtle, text: theme.warning },
      info: { bg: theme.infoSubtle, text: theme.info },
    };
    return colors[badge.variant];
  };

  const content = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          padding: Spacing.md,
          backgroundColor: theme.surfaceCard,
          borderRadius: showDivider ? 0 : Radius.lg,
          gap: Spacing.md,
          borderWidth: showDivider ? 0 : 1,
          borderBottomWidth: showDivider ? 1 : 1,
          borderColor:
            variant === "danger" ? theme.dangerSubtle : theme.borderCard,
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
              borderRadius: Radius.md,
              backgroundColor:
                variant === "danger" ? theme.dangerSubtle : theme.surfaceGlass,
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
            ...Typography.body.md,
            fontWeight: "500",
            color: variant === "danger" ? theme.danger : theme.text,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              ...Typography.body.sm,
              color: theme.textMuted,
              marginTop: Spacing["3xs"],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side: value and/or badge */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}
      >
        {value && (
          <Text
            style={{
              ...Typography.body.md,
              fontWeight: "600",
              color: valueColor || theme.text,
            }}
          >
            {value}
          </Text>
        )}
        {badge && (
          <View
            style={{
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing["3xs"],
              borderRadius: Radius.sm,
              backgroundColor: getBadgeStyle().bg,
            }}
          >
            <Text
              style={{
                ...Typography.label.xs,
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
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
            variant === "accent" ? theme.primarySubtle : theme.surfaceCard,
          borderRadius: Radius.xl,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor:
            variant === "accent" ? Palette.accent.glow : theme.borderCard,
          borderCurve: "continuous",
          gap: Spacing.sm,
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
        <Text style={{ ...Typography.label.sm, color: theme.textMuted }}>
          {displayTitle}
        </Text>
        {icon}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: Spacing.xs,
        }}
      >
        <Text style={{ ...Typography.display.md, color: theme.text }}>
          {value}
        </Text>
        {trend && (
          <Text
            style={{
              ...Typography.label.sm,
              color: trend.isPositive
                ? Palette.success[500]
                : Palette.danger[500],
            }}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </Text>
        )}
      </View>
      {subtitle && (
        <Text style={{ ...Typography.body.sm, color: theme.textSecondary }}>
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];

  const progressColor = color || Palette.accent[500];
  const bgColor = backgroundColor || theme.surfaceGlass;

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
            ...Typography.label.sm,
            color: theme.text,
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
