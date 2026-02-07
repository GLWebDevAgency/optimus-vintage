/**
 * 🌌 VANTA UI SYSTEM - Aether & Ivory Architecture
 *
 * "Digital Architecture evolving in an infinite spatial void."
 *
 * Design Principles:
 * - AETHER (Dark): Obsidian slabs floating in void, defined by golden light lines
 * - IVORY (Light): Sculptures of light with diffuse shadows creating Z-axis depth
 *
 * Materials:
 * - Dark: Polished Obsidian, Black Titanium, Carbon Glass
 * - Light: Mother of Pearl, Frosted Glass, Noble Paper
 *
 * ✨ Features:
 * - Monolithic dock navigation
 * - Singularity data visualizations
 * - Optical fluid interactions
 * - Photon emanation accents
 * - Gravity-based animations
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { useAccessibility } from "@/utils/accessibility";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    type PressableProps,
    type TextInputProps,
    type ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VANTA THEME HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export type VantaTheme = typeof Theme.light;

export function usePremiumTheme(): VantaTheme {
  const colorScheme = useColorScheme() ?? "light";
  return colorScheme === "dark" ? Theme.dark : Theme.light;
}

export function useVantaTheme(): VantaTheme {
  return usePremiumTheme();
}

export function useIsDarkMode(): boolean {
  const colorScheme = useColorScheme() ?? "light";
  return colorScheme === "dark";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ VANTA SCREEN - Base container with spatial void background
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PremiumScreen({ children, style }: VantaScreenProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();

  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: theme.background },
        style,
      ]}
    >
      {/* Vanta Background Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {isDark ? (
          // AETHER: Absolute void with subtle gradient
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                experimental_backgroundImage: `linear-gradient(135deg, ${Palette.vanta.black} 0%, ${Palette.vanta.obsidian} 50%, ${Palette.vanta.black} 100%)`,
              },
            ]}
          />
        ) : (
          // IVORY: Organic gradient (paper/silk feel)
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                experimental_backgroundImage: `linear-gradient(135deg, ${Palette.ivory.cream} 0%, ${Palette.ivory.base} 50%, ${Palette.ivory.sand} 100%)`,
              },
            ]}
          />
        )}
      </View>
      {children}
    </View>
  );
}

export function VantaScreen({ children, style }: VantaScreenProps) {
  return <PremiumScreen style={style}>{children}</PremiumScreen>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 VANTA HEADER - System status header
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaHeaderProps {
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
}: VantaHeaderProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const { isReduceMotionEnabled } = useAccessibility();
  const entering = isReduceMotionEnabled
    ? undefined
    : FadeInDown.duration(400).springify();

  return (
    <Animated.View entering={entering} style={[styles.headerContainer, style]}>
      <View style={styles.headerTextContainer}>
        {subtitle && (
          <Text
            style={[
              Typography.label.sm,
              { color: isDark ? theme.textGold : theme.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
        <Text style={[Typography.heading.lg, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 VANTA SLAB - Obsidian/Pearl floating card
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaSlabProps {
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
}: VantaSlabProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
      pressed.value = withTiming(1, { duration: 100 });
      if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    pressed.value = withTiming(0, { duration: 150 });
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

  // Vanta slab styles based on mode and variant
  const getSlabStyle = () => {
    if (isDark) {
      // AETHER: Obsidian slabs with golden edge definition
      switch (variant) {
        case "elevated":
          return {
            backgroundColor: Palette.vanta.titanium,
            borderColor: Palette.vanta.steel,
            borderWidth: 1,
            boxShadow: theme.shadowCardFloat,
          };
        case "glass":
          return {
            backgroundColor: theme.surfaceGlass,
            borderColor: theme.borderGlass,
            borderWidth: 1,
            boxShadow: theme.shadowMd,
          };
        case "accent":
          return {
            backgroundColor: Palette.vanta.carbon,
            borderColor: theme.borderGold,
            borderWidth: 1,
            boxShadow: theme.shadowGlow,
          };
        default:
          return {
            backgroundColor: Palette.vanta.obsidian,
            borderColor: Palette.vanta.graphite,
            borderWidth: 1,
            boxShadow: theme.shadowSm,
          };
      }
    } else {
      // IVORY: Sculptures of light with diffuse shadows
      switch (variant) {
        case "elevated":
          return {
            backgroundColor: Palette.ivory.cream,
            borderColor: Palette.ivory.linen,
            borderWidth: 1,
            boxShadow: theme.shadowCardFloat,
          };
        case "glass":
          return {
            backgroundColor: theme.surfaceGlass,
            borderColor: theme.borderGlass,
            borderWidth: 1,
            boxShadow: theme.shadowMd,
          };
        case "accent":
          return {
            backgroundColor: Palette.ivory.parchment,
            borderColor: theme.borderGold,
            borderWidth: 1,
            boxShadow: theme.shadowGlow,
          };
        default:
          return {
            backgroundColor: Palette.ivory.cream,
            borderColor: Palette.ivory.linen,
            borderWidth: 1,
            boxShadow: theme.shadowSm,
          };
      }
    }
  };

  const slabStyles = getSlabStyle();

  const cardContent = (
    <Animated.View
      entering={entering}
      style={[
        styles.slabContainer,
        { padding: paddingValue },
        slabStyles,
        animatedStyle,
        style,
      ]}
    >
      {variant === "glass" && isIOS && (
        <BlurView
          intensity={isDark ? 30 : 40}
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

export function VantaSlab(props: VantaSlabProps) {
  return <PremiumCard {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 VANTA BUTTON - Optical Fluid / Mercury Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaButtonProps extends Omit<PressableProps, "style"> {
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
}: VantaButtonProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 18, stiffness: 350 });
    pressed.value = withTiming(1, { duration: 80 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    pressed.value = withTiming(0, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Optical Fluid effect - button "flattens" on press
    const shadowOpacity = interpolate(pressed.value, [0, 1], [1, 0.3]);
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: Spacing.lg, gap: Spacing.xs },
    md: { height: 52, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    lg: { height: 60, paddingHorizontal: Spacing["2xl"], gap: Spacing.md },
  };

  // Vanta button variants
  const getVariantStyles = () => {
    if (isDark) {
      switch (variant) {
        case "primary":
          return {
            backgroundColor: Palette.metal.gold,
            borderWidth: 0,
            boxShadow: `0 0 24px ${Palette.metal.gold}50, 0 4px 16px rgba(0,0,0,0.4)`,
          };
        case "secondary":
          return {
            backgroundColor: Palette.vanta.titanium,
            borderWidth: 1,
            borderColor: Palette.vanta.steel,
            boxShadow: theme.shadowMd,
          };
        case "ghost":
          return {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: Palette.metal.gold + "40",
          };
        case "danger":
          return {
            backgroundColor: theme.danger,
            borderWidth: 0,
            boxShadow: `0 0 20px ${theme.dangerGlow}`,
          };
      }
    } else {
      switch (variant) {
        case "primary":
          return {
            backgroundColor: Palette.metal.champagne,
            borderWidth: 0,
            boxShadow: `0 4px 20px ${Palette.metal.champagne}40, 0 2px 8px rgba(0,0,0,0.08)`,
          };
        case "secondary":
          return {
            backgroundColor: Palette.ivory.cream,
            borderWidth: 1,
            borderColor: Palette.ivory.linen,
            boxShadow: theme.shadowMd,
          };
        case "ghost":
          return {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: Palette.metal.champagne + "40",
          };
        case "danger":
          return {
            backgroundColor: theme.danger,
            borderWidth: 0,
            boxShadow: theme.shadowMd,
          };
      }
    }
  };

  const textColor = {
    primary: isDark ? Palette.vanta.black : Palette.neutral.white,
    secondary: theme.text,
    ghost: theme.primary,
    danger: Palette.neutral.white,
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
          getVariantStyles(),
          fullWidth && { width: "100%" },
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
                size={size === "sm" ? 18 : 22}
                color={textColor[variant]}
              />
            )}
            <Text
              style={[
                Typography.label.md,
                {
                  color: textColor[variant],
                  letterSpacing: 1.5,
                },
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === "right" && (
              <AppIcon
                name={icon}
                size={size === "sm" ? 18 : 22}
                color={textColor[variant]}
              />
            )}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function VantaButton(props: VantaButtonProps) {
  return <PremiumButton {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 VANTA METRIC CARD - Singularity style data display
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaMetricProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; isPositive: boolean };
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
  iconColor,
  iconBackgroundColor,
  variant = "default",
  style,
  onPress,
}: VantaMetricProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const finalIconColor = iconColor || theme.primary;

  return (
    <PremiumCard
      variant={variant === "accent" ? "accent" : "elevated"}
      padding="lg"
      style={style ? [{ flex: 1 }, style] : { flex: 1 }}
      onPress={onPress}
      entering={FadeInUp.duration(400).springify()}
    >
      {/* Header */}
      <View style={styles.metricHeader}>
        <Text
          style={[
            Typography.label.sm,
            { color: isDark ? theme.textSecondary : theme.textMuted },
          ]}
        >
          {label}
        </Text>
        {icon && (
          <View
            style={[
              styles.metricIcon,
              {
                backgroundColor:
                  iconBackgroundColor ||
                  (isDark ? theme.primarySubtle : theme.primaryMuted),
              },
            ]}
          >
            {typeof icon === "string" ? (
              <AppIcon
                name={icon as AppIconName}
                size={18}
                color={finalIconColor}
              />
            ) : (
              icon
            )}
          </View>
        )}
      </View>

      {/* Value - Large number display */}
      <Text
        style={[
          Typography.number.lg,
          {
            color: theme.text,
            marginTop: Spacing.sm,
          },
        ]}
      >
        {value}
      </Text>

      {/* Footer */}
      {(trend || subtitle) && (
        <View style={styles.metricFooter}>
          {trend && (
            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor: trend.isPositive
                    ? theme.successSubtle
                    : theme.dangerSubtle,
                },
              ]}
            >
              <AppIcon
                name={trend.isPositive ? "trending-up" : "trending-down"}
                size={12}
                color={trend.isPositive ? theme.success : theme.danger}
              />
              <Text
                style={[
                  Typography.label.xs,
                  { color: trend.isPositive ? theme.success : theme.danger },
                ]}
              >
                {trend.value}
              </Text>
            </View>
          )}
          {subtitle && (
            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </PremiumCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ VANTA QUICK ACTION
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaQuickActionProps {
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
}: VantaQuickActionProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 18, stiffness: 350 });
    pressed.value = withTiming(1, { duration: 80 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    pressed.value = withTiming(0, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAccent = variant === "accent";
  const iconColor = isAccent ? theme.primary : theme.textSecondary;

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
                ? Palette.vanta.carbon
                : Palette.vanta.titanium
              : isAccent
                ? Palette.ivory.parchment
                : Palette.ivory.cream,
            borderColor: isAccent ? theme.borderGold : theme.borderCard,
            borderWidth: 1,
            boxShadow: isAccent ? theme.shadowGlow : theme.shadowSm,
          },
          animatedStyle,
          style,
        ]}
      >
        <View
          style={[
            styles.quickActionIconContainer,
            {
              backgroundColor: isAccent
                ? theme.primarySubtle
                : isDark
                  ? Palette.vanta.graphite
                  : Palette.ivory.sand,
            },
          ]}
        >
          {typeof icon === "string" ? (
            <AppIcon name={icon as AppIconName} size={24} color={iconColor} />
          ) : (
            icon
          )}
        </View>
        <Text
          style={[
            Typography.label.sm,
            {
              color: isAccent ? theme.text : theme.textSecondary,
              marginTop: Spacing.sm,
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
// ⌨️ VANTA INPUT
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: AppIconName;
  rightIcon?: AppIconName;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function PremiumInput({
  label,
  error,
  helper,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: VantaInputProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? theme.danger
    : isFocused
      ? theme.primary
      : theme.border;

  return (
    <View style={[styles.inputWrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            Typography.label.sm,
            {
              color: error ? theme.danger : theme.textSecondary,
              marginBottom: Spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark
              ? Palette.vanta.titanium
              : Palette.ivory.cream,
            borderColor,
            borderWidth: 1,
            boxShadow: isFocused && !error ? theme.shadowGlow : "none",
          },
        ]}
      >
        {icon && (
          <View style={styles.inputIconLeft}>
            <AppIcon
              name={icon}
              size={20}
              color={
                error
                  ? theme.danger
                  : isFocused
                    ? theme.primary
                    : theme.textMuted
              }
            />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            icon && { paddingLeft: 0 },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.inputIconRight}
            disabled={!onRightIconPress}
          >
            <AppIcon
              name={rightIcon}
              size={20}
              color={error ? theme.danger : theme.textMuted}
            />
          </Pressable>
        )}
      </View>
      {(error || helper) && (
        <Text
          style={[
            Typography.body.xs,
            {
              color: error ? theme.danger : theme.textMuted,
              marginTop: Spacing.xs,
            },
          ]}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔵 VANTA STATUS INDICATOR - Pulsing connection dot
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaStatusProps {
  status: "connected" | "warning" | "error" | "idle";
  label?: string;
}

export function VantaStatus({ status, label }: VantaStatusProps) {
  const theme = usePremiumTheme();
  const isDark = useIsDarkMode();
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (status === "connected") {
      pulseOpacity.value = withTiming(0.4, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [status]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const statusColors = {
    connected: theme.success,
    warning: theme.warning,
    error: theme.danger,
    idle: theme.textMuted,
  };

  const statusLabels = {
    connected: "CONNECTED",
    warning: "WARNING",
    error: "ERROR",
    idle: "IDLE",
  };

  return (
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: statusColors[status],
            boxShadow: `0 0 8px ${statusColors[status]}`,
          },
        ]}
      />
      <Text
        style={[
          Typography.label.xs,
          { color: isDark ? theme.textSecondary : theme.textMuted },
        ]}
      >
        {label || statusLabels[status]}
      </Text>
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
    paddingHorizontal: Spacing.xl,
  },
  headerTextContainer: {
    flex: 1,
    gap: Spacing["2xs"],
  },

  // Slab (Card)
  slabContainer: {
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },

  // Button
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },

  // Metric Card
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  metricFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["2xs"],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing["2xs"],
    borderRadius: Radius.full,
  },

  // Quick Action
  quickActionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input
  inputWrapper: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  inputIconLeft: {
    marginRight: Spacing.sm,
  },
  inputIconRight: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },

  // Status
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type PremiumTheme = VantaTheme;
