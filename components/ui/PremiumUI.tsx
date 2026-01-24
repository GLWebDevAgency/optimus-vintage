/**
 * 💎 PREMIUM UI SYSTEM - World-Class Components
 *
 * Système de design unifié inspiré de Linear, Arc, Figma
 * Thème cohérent avec la TabBar premium
 *
 * ✨ Features:
 * - Glassmorphic effects with blur
 * - Multi-layer shadows
 * - Smooth spring animations
 * - Haptic feedback
 * - Aurora gradients
 * - Luminous borders
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type PressableProps,
    type ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM COLORS - Unified Theme
// ═══════════════════════════════════════════════════════════════════════════════

export const PremiumColors = {
  // Primary accent - Emerald
  accent: Palette.emerald[500],
  accentLight: Palette.emerald[100],
  accentDark: Palette.emerald[600],
  accentMuted: `${Palette.emerald[500]}15`,
  accentGlow: `${Palette.emerald[500]}40`,

  // Secondary accent - Gold
  gold: Palette.gold[500],
  goldLight: Palette.gold[100],
  goldDark: Palette.gold[600],
  goldMuted: `${Palette.gold[500]}15`,
  goldGlow: `${Palette.gold[500]}40`,

  // Backgrounds
  background: Palette.neutral[50],
  backgroundSubtle: Palette.neutral[100],
  surface: Palette.neutral.white,
  surfaceElevated: Palette.neutral.white,
  cardBackground: Palette.neutral.white,

  // Text
  textPrimary: Palette.neutral[900],
  textSecondary: Palette.neutral[600],
  textMuted: Palette.neutral[400],
  textInverse: Palette.neutral.white,
  textWhite: Palette.neutral.white,

  // Navy / Secondary
  navy: Palette.navy[600],
  navyLight: Palette.navy[100],

  // Semantic
  success: Palette.success[500],
  successLight: Palette.success[50],
  danger: Palette.danger[500],
  dangerLight: Palette.danger[50],
  warning: Palette.warning[500],
  warningLight: Palette.warning[50],
  info: Palette.info[500],
  infoLight: Palette.info[50],

  // Glass & Borders
  glass: `${Palette.neutral.white}85`,
  glassBorder: `${Palette.neutral[200]}50`,
  border: Palette.neutral[200],
  borderSubtle: Palette.neutral[100],

  // Shadows
  shadowLight: "rgba(0, 0, 0, 0.04)",
  shadowMedium: "rgba(0, 0, 0, 0.08)",
  shadowStrong: "rgba(0, 0, 0, 0.12)",
  shadowAccent: `${Palette.emerald[200]}30`,

  // Dark mode variants
  dark: {
    background: Palette.navy[900],
    surface: Palette.navy[800],
    surfaceElevated: Palette.navy[750],
    textPrimary: Palette.neutral.white,
    textSecondary: Palette.neutral[400],
    textMuted: Palette.neutral[500],
    border: Palette.navy[700],
    borderSubtle: Palette.navy[800],
    glass: `${Palette.navy[800]}90`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// � USE PREMIUM THEME - Hook for easy theme access
// ═══════════════════════════════════════════════════════════════════════════════

export interface PremiumTheme {
  // Core surfaces
  surface: string;
  surfaceCard: string;
  surfaceHover: string;
  surfaceHighlight: string;
  background: string;

  // Borders
  border: string;
  borderCard: string;

  // Primary accent
  primary: string;
  primarySubtle: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  // Semantic
  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  warningSubtle: string;
}

export function usePremiumTheme(): PremiumTheme {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return {
    surface: isDark ? PremiumColors.dark.surface : PremiumColors.surface,
    surfaceCard: isDark
      ? PremiumColors.dark.surface
      : PremiumColors.cardBackground,
    surfaceHover: isDark ? Palette.navy[700] : Palette.neutral[100],
    surfaceHighlight: isDark ? Palette.emerald[900] : PremiumColors.accentLight,
    background: isDark
      ? PremiumColors.dark.background
      : PremiumColors.background,
    border: isDark ? PremiumColors.dark.border : PremiumColors.border,
    borderCard: isDark ? PremiumColors.dark.border : PremiumColors.glassBorder,
    primary: PremiumColors.accent,
    primarySubtle: PremiumColors.accentLight,
    text: isDark ? PremiumColors.dark.textPrimary : PremiumColors.textPrimary,
    textSecondary: isDark
      ? PremiumColors.dark.textSecondary
      : PremiumColors.textSecondary,
    textMuted: isDark ? PremiumColors.dark.textMuted : PremiumColors.textMuted,
    textOnAccent: PremiumColors.textWhite,
    success: PremiumColors.success,
    successSubtle: PremiumColors.successLight,
    danger: PremiumColors.danger,
    dangerSubtle: PremiumColors.dangerLight,
    warning: PremiumColors.warning,
    warningSubtle: PremiumColors.warningLight,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// �🏛️ PREMIUM SCREEN - Base container with aurora background
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PremiumScreen({ children, style }: PremiumScreenProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.screenContainer,
        {
          backgroundColor: isDark
            ? PremiumColors.dark.background
            : PremiumColors.background,
        },
        style,
      ]}
    >
      {/* Subtle arabesque pattern background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? [Palette.navy[900], Palette.navy[950], Palette.navy[900]]
              : ["#F8F9FA", "#F5F6F7", "#F8F9FA"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Arabesque pattern overlay */}
        <Svg
          width="100%"
          height="100%"
          style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.03 : 0.04 }]}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Moroccan-inspired geometric pattern */}
          <Path
            d="M50,0 L60,10 L50,20 L40,10 Z M50,20 L60,30 L50,40 L40,30 Z M50,40 L60,50 L50,60 L40,50 Z M50,60 L60,70 L50,80 L40,70 Z M50,80 L60,90 L50,100 L40,90 Z"
            fill={isDark ? Palette.gold[400] : Palette.gold[600]}
            fillOpacity="0.5"
          />
          <Path
            d="M25,10 L35,20 L25,30 L15,20 Z M25,30 L35,40 L25,50 L15,40 Z M25,50 L35,60 L25,70 L15,60 Z M25,70 L35,80 L25,90 L15,80 Z"
            fill={isDark ? Palette.emerald[400] : Palette.emerald[600]}
            fillOpacity="0.4"
          />
          <Path
            d="M75,10 L85,20 L75,30 L65,20 Z M75,30 L85,40 L75,50 L65,40 Z M75,50 L85,60 L75,70 L65,60 Z M75,70 L85,80 L75,90 L65,80 Z"
            fill={isDark ? Palette.emerald[400] : Palette.emerald[600]}
            fillOpacity="0.4"
          />
          <Path
            d="M0,25 L10,35 L0,45 L-10,35 Z M0,45 L10,55 L0,65 L-10,55 Z M0,65 L10,75 L0,85 L-10,75 Z"
            fill={isDark ? Palette.gold[300] : Palette.gold[500]}
            fillOpacity="0.3"
          />
          <Path
            d="M100,25 L110,35 L100,45 L90,35 Z M100,45 L110,55 L100,65 L90,55 Z M100,65 L110,75 L100,85 L90,75 Z"
            fill={isDark ? Palette.gold[300] : Palette.gold[500]}
            fillOpacity="0.3"
          />
          {/* Interlocking curves */}
          <Path
            d="M0,0 Q25,25 50,0 T100,0 M0,50 Q25,75 50,50 T100,50 M0,100 Q25,125 50,100 T100,100"
            stroke={isDark ? Palette.gold[400] : Palette.gold[500]}
            strokeWidth="0.3"
            fill="none"
            strokeOpacity="0.4"
          />
          <Path
            d="M0,25 Q25,50 50,25 T100,25 M0,75 Q25,100 50,75 T100,75"
            stroke={isDark ? Palette.emerald[400] : Palette.emerald[500]}
            strokeWidth="0.3"
            fill="none"
            strokeOpacity="0.35"
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 PREMIUM HEADER - App header with title
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function PremiumHeader({
  title,
  subtitle,
  rightAction,
  style,
}: PremiumHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[styles.headerContainer, style]}
    >
      <View style={styles.headerTextContainer}>
        {subtitle && (
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? Palette.neutral[500] : Palette.neutral[400] },
            ]}
          >
            {subtitle}
          </Text>
        )}
        <Text
          style={[
            styles.headerTitle,
            {
              color: isDark
                ? PremiumColors.dark.textPrimary
                : PremiumColors.textPrimary,
            },
          ]}
        >
          {title}
        </Text>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 PREMIUM CARD - Glassmorphic card with luminous border
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "glass" | "accent";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  entering?: any;
}

export function PremiumCard({
  children,
  variant = "default",
  padding = "md",
  style,
  onPress,
  entering,
}: PremiumCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paddingValue = {
    none: 0,
    sm: Spacing.sm,
    md: Spacing.md,
    lg: Spacing.lg,
  }[padding];

  const variantStyles = {
    default: {
      backgroundColor: isDark
        ? PremiumColors.dark.surface
        : PremiumColors.surface,
      borderColor: isDark
        ? PremiumColors.dark.border
        : PremiumColors.glassBorder,
      boxShadow: `
        0 2px 8px ${PremiumColors.shadowLight},
        0 4px 16px ${PremiumColors.shadowMedium}
      `,
    },
    elevated: {
      backgroundColor: isDark
        ? PremiumColors.dark.surfaceElevated
        : PremiumColors.surfaceElevated,
      borderColor: isDark
        ? PremiumColors.dark.border
        : PremiumColors.glassBorder,
      boxShadow: `
        0 4px 12px ${PremiumColors.shadowMedium},
        0 8px 24px ${PremiumColors.shadowStrong},
        0 16px 40px ${PremiumColors.shadowAccent}
      `,
    },
    glass: {
      backgroundColor: isDark ? PremiumColors.dark.glass : PremiumColors.glass,
      borderColor: isDark
        ? PremiumColors.dark.border
        : PremiumColors.glassBorder,
      boxShadow: `
        0 2px 8px ${PremiumColors.shadowLight},
        0 8px 32px ${PremiumColors.shadowMedium}
      `,
    },
    accent: {
      backgroundColor: isDark
        ? Palette.emerald[900]
        : PremiumColors.accentLight,
      borderColor: `${Palette.emerald[300]}40`,
      boxShadow: `
        0 4px 16px ${PremiumColors.accentGlow},
        0 8px 32px ${PremiumColors.shadowAccent}
      `,
    },
  };

  const cardContent = (
    <Animated.View
      entering={entering}
      style={[
        styles.cardContainer,
        {
          padding: paddingValue,
          ...variantStyles[variant],
        },
        animatedStyle,
        style,
      ]}
    >
      {variant === "glass" && isIOS && (
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PREMIUM STAT CARD - Metric display with icon
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: AppIconName | React.ReactNode;
  iconColor?: string;
  iconBackgroundColor?: string;
  variant?: "default" | "accent";
  style?: ViewStyle;
  onPress?: () => void;
}

export function PremiumStatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  iconColor = PremiumColors.accent,
  iconBackgroundColor,
  variant = "default",
  style,
  onPress,
}: PremiumStatCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <PremiumCard
      variant={variant === "accent" ? "accent" : "elevated"}
      padding="lg"
      style={style ? [{ flex: 1 }, style] : { flex: 1 }}
      onPress={onPress}
      entering={FadeInUp.duration(400).springify()}
    >
      {/* Header with label and icon */}
      <View style={styles.statCardHeader}>
        <Text
          style={[
            styles.statCardLabel,
            {
              color: isDark
                ? PremiumColors.dark.textSecondary
                : PremiumColors.textSecondary,
            },
          ]}
        >
          {label}
        </Text>
        {icon && (
          <View
            style={[
              styles.statCardIcon,
              {
                backgroundColor:
                  iconBackgroundColor ||
                  (isDark ? `${iconColor}20` : `${iconColor}15`),
              },
            ]}
          >
            {typeof icon === "string" ? (
              <AppIcon name={icon as AppIconName} size={18} color={iconColor} />
            ) : (
              icon
            )}
          </View>
        )}
      </View>

      {/* Value */}
      <Text
        style={[
          styles.statCardValue,
          {
            color: isDark
              ? PremiumColors.dark.textPrimary
              : PremiumColors.textPrimary,
          },
        ]}
      >
        {value}
      </Text>

      {/* Trend or Subtitle */}
      <View style={styles.statCardFooter}>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.isPositive
                  ? PremiumColors.successLight
                  : PremiumColors.dangerLight,
              },
            ]}
          >
            <AppIcon
              name={trend.isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={
                trend.isPositive ? PremiumColors.success : PremiumColors.danger
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.isPositive
                    ? PremiumColors.success
                    : PremiumColors.danger,
                },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        )}
        {subtitle && (
          <Text
            style={[
              styles.statCardSubtitle,
              {
                color: isDark
                  ? PremiumColors.dark.textMuted
                  : PremiumColors.textMuted,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </PremiumCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 PREMIUM BUTTON - Animated button with variants
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumButtonProps extends Omit<PressableProps, "style"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: AppIconName;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  children: React.ReactNode;
}

export function PremiumButton({
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
}: PremiumButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeStyles = {
    sm: { height: 36, paddingHorizontal: Spacing.md, gap: Spacing.xs },
    md: { height: 48, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    lg: { height: 56, paddingHorizontal: Spacing.xl, gap: Spacing.md },
  };

  const variantStyles = {
    primary: {
      backgroundColor: PremiumColors.accent,
      borderWidth: 0,
      boxShadow: `0 4px 16px ${PremiumColors.accentGlow}`,
    },
    secondary: {
      backgroundColor: isDark
        ? PremiumColors.dark.surface
        : PremiumColors.surface,
      borderWidth: 1,
      borderColor: isDark ? PremiumColors.dark.border : PremiumColors.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    danger: {
      backgroundColor: PremiumColors.danger,
      borderWidth: 0,
      boxShadow: `0 4px 16px ${Palette.danger[200]}40`,
    },
  };

  const textColor = {
    primary: PremiumColors.textInverse,
    secondary: isDark
      ? PremiumColors.dark.textPrimary
      : PremiumColors.textPrimary,
    ghost: PremiumColors.accent,
    danger: PremiumColors.textInverse,
  };

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.buttonContainer,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && { width: "100%" },
          (disabled || loading) && { opacity: 0.5 },
          animatedStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor[variant]} />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <AppIcon
                name={icon}
                size={size === "sm" ? 16 : 20}
                color={textColor[variant]}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                { color: textColor[variant] },
                size === "sm" && { fontSize: 13 },
                size === "lg" && { fontSize: 16 },
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === "right" && (
              <AppIcon
                name={icon}
                size={size === "sm" ? 16 : 20}
                color={textColor[variant]}
              />
            )}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ PREMIUM QUICK ACTION - Action button with icon
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumQuickActionProps {
  icon: AppIconName | React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: "default" | "accent";
  style?: ViewStyle;
}

export function PremiumQuickAction({
  icon,
  label,
  onPress,
  variant = "default",
  style,
}: PremiumQuickActionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAccent = variant === "accent";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.quickActionContainer,
          {
            backgroundColor: isDark
              ? isAccent
                ? Palette.emerald[900]
                : PremiumColors.dark.surface
              : isAccent
                ? PremiumColors.accentLight
                : PremiumColors.surface,
            borderColor: isDark
              ? isAccent
                ? Palette.emerald[700]
                : PremiumColors.dark.border
              : isAccent
                ? `${Palette.emerald[300]}40`
                : PremiumColors.border,
          },
          animatedStyle,
          style,
        ]}
      >
        <View
          style={[
            styles.quickActionIcon,
            {
              backgroundColor: isDark
                ? isAccent
                  ? `${Palette.emerald[500]}30`
                  : PremiumColors.dark.border
                : isAccent
                  ? `${Palette.emerald[500]}20`
                  : PremiumColors.backgroundSubtle,
            },
          ]}
        >
          {typeof icon === "string" ? (
            <AppIcon
              name={icon as AppIconName}
              size={20}
              color={
                isAccent
                  ? PremiumColors.accent
                  : isDark
                    ? Palette.neutral[400]
                    : Palette.neutral[600]
              }
            />
          ) : (
            icon
          )}
        </View>
        <Text
          style={[
            styles.quickActionLabel,
            {
              color: isDark
                ? PremiumColors.dark.textPrimary
                : PremiumColors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 PREMIUM PERIOD SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumPeriodSelectorProps {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function PremiumPeriodSelector({
  label,
  icon,
  onPress,
  style,
}: PremiumPeriodSelectorProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.periodSelectorContainer,
          {
            backgroundColor: isDark
              ? PremiumColors.dark.surface
              : PremiumColors.surface,
            borderColor: isDark
              ? PremiumColors.dark.border
              : PremiumColors.border,
          },
          animatedStyle,
          style,
        ]}
      >
        {icon}
        <Text
          style={[
            styles.periodSelectorLabel,
            {
              color: isDark
                ? PremiumColors.dark.textPrimary
                : PremiumColors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
        <AppIcon
          name="expand-more"
          size={20}
          color={isDark ? Palette.neutral[400] : Palette.neutral[500]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 PREMIUM SUMMARY CARD - Multi-row summary
// ═══════════════════════════════════════════════════════════════════════════════

interface SummaryRow {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

interface PremiumSummaryCardProps {
  rows: SummaryRow[];
  rightSection?: {
    label: string;
    value: string;
    valueColor?: string;
    badge?: React.ReactNode;
  };
  bottomBadge?: {
    icon?: React.ReactNode;
    label: string;
  };
  style?: ViewStyle;
}

export function PremiumSummaryCard({
  rows,
  rightSection,
  bottomBadge,
  style,
}: PremiumSummaryCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <PremiumCard
      variant="elevated"
      padding="lg"
      style={style}
      entering={FadeInUp.duration(400).springify()}
    >
      <View style={styles.summaryContent}>
        {/* Left rows */}
        <View style={styles.summaryRows}>
          {rows.map((row, index) => (
            <View key={index} style={styles.summaryRow}>
              {row.icon}
              <Text
                style={[
                  styles.summaryRowLabel,
                  {
                    color: isDark
                      ? PremiumColors.dark.textSecondary
                      : PremiumColors.textSecondary,
                  },
                ]}
              >
                {row.label}
              </Text>
              <Text
                style={[
                  styles.summaryRowValue,
                  {
                    color:
                      row.valueColor ||
                      (isDark
                        ? PremiumColors.dark.textPrimary
                        : PremiumColors.textPrimary),
                  },
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Right section */}
        {rightSection && (
          <View style={styles.summaryRightSection}>
            <View style={styles.summaryRightHeader}>
              <Text
                style={[
                  styles.summaryRightLabel,
                  {
                    color: isDark
                      ? PremiumColors.dark.textMuted
                      : PremiumColors.textMuted,
                  },
                ]}
              >
                {rightSection.label}
              </Text>
              {rightSection.badge}
            </View>
            <Text
              style={[
                styles.summaryRightValue,
                {
                  color:
                    rightSection.valueColor ||
                    (isDark
                      ? PremiumColors.dark.textPrimary
                      : PremiumColors.textPrimary),
                },
              ]}
            >
              {rightSection.value}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom badge */}
      {bottomBadge && (
        <View
          style={[
            styles.summaryBottomBadge,
            {
              backgroundColor: isDark
                ? `${PremiumColors.accent}20`
                : PremiumColors.accentMuted,
            },
          ]}
        >
          {bottomBadge.icon}
          <Text
            style={[
              styles.summaryBottomBadgeText,
              { color: PremiumColors.accent },
            ]}
          >
            {bottomBadge.label}
          </Text>
        </View>
      )}
    </PremiumCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PREMIUM SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumSectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function PremiumSectionHeader({
  title,
  action,
  style,
}: PremiumSectionHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.sectionHeader, style]}>
      <Text
        style={[
          styles.sectionHeaderTitle,
          {
            color: isDark
              ? PremiumColors.dark.textPrimary
              : PremiumColors.textPrimary,
          },
        ]}
      >
        {title}
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text
            style={[
              styles.sectionHeaderAction,
              { color: PremiumColors.accent },
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ PREMIUM SHIMMER - Loading placeholder
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function PremiumShimmer({
  width = "100%",
  height = 20,
  borderRadius = Radius.md,
  style,
}: PremiumShimmerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const shimmerPhase = useSharedValue(0);

  useEffect(() => {
    shimmerPhase.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerPhase.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View
      style={[
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius,
          backgroundColor: isDark
            ? PremiumColors.dark.border
            : PremiumColors.border,
          overflow: "hidden",
        },
        typeof width === "string" && { width: width as any },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          shimmerStyle,
          {
            backgroundColor: isDark
              ? PremiumColors.dark.surface
              : PremiumColors.backgroundSubtle,
          },
        ]}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Screen
  screenContainer: {
    flex: 1,
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    ...Typography.label.sm,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.5,
  },

  // Card
  cardContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    borderCurve: "continuous",
  },

  // Stat Card
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statCardLabel: {
    ...Typography.label.sm,
    letterSpacing: 0.5,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardValue: {
    ...Typography.number.xl,
    marginBottom: Spacing.xs,
  },
  statCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statCardSubtitle: {
    ...Typography.body.sm,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Button
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
  },

  // Quick Action
  quickActionContainer: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
    textAlign: "center",
  },

  // Period Selector
  periodSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  periodSelectorLabel: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Summary Card
  summaryContent: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  summaryRows: {
    flex: 1,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryRowLabel: {
    ...Typography.body.sm,
    flex: 1,
  },
  summaryRowValue: {
    ...Typography.body.sm,
    fontWeight: "600",
  },
  summaryRightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  summaryRightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  summaryRightLabel: {
    ...Typography.label.xs,
    letterSpacing: 0.5,
  },
  summaryRightValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Manrope_700Bold",
  },
  summaryBottomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.md,
  },
  summaryBottomBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
  },
  sectionHeaderAction: {
    fontSize: 14,
    fontWeight: "600",
  },
});
