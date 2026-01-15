/**
 * 🎨 Optimus Vintage - Premium UI Components
 * Glassmorphism cards, animated buttons, and luxurious inputs
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Layout, Palette, Radius, Spacing, Theme, Typography } from '@/constants/Theme';

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 PREMIUM CARD - Glassmorphism with subtle glow
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'glass' | 'outlined' | 'highlight' | 'hero';
    onPress?: () => void;
    activeOpacity?: number;
    glow?: boolean;
    glowColor?: string;
}

export function PremiumCard({
    children,
    style,
    variant = 'default',
    onPress,
    activeOpacity = 0.97,
    glow = false,
    glowColor,
}: PremiumCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.985,
            useNativeDriver: true,
            friction: 8,
            tension: 200,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 150,
        }).start();
    };

    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: theme.surface,
                    ...theme.shadowLg,
                };
            case 'glass':
                return {
                    backgroundColor: theme.surfaceGlass,
                    borderColor: theme.borderCard,
                    borderWidth: 1,
                };
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderColor: theme.border,
                    borderWidth: 1.5,
                };
            case 'highlight':
                return {
                    backgroundColor: theme.primarySubtle,
                    borderColor: theme.primary,
                    borderWidth: 1,
                };
            case 'hero':
                return {
                    backgroundColor: theme.primary,
                    ...theme.shadowGlow,
                };
            default:
                return {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderCard,
                    borderWidth: 1,
                    ...theme.shadowMd,
                };
        }
    };

    const cardStyle: ViewStyle = {
        borderRadius: Radius['2xl'],
        padding: Spacing['2xl'],
        ...getVariantStyles(),
        ...(glow && {
            shadowColor: glowColor || theme.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
        }),
        ...style,
    };

    if (onPress) {
        return (
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
                    {children}
                </Animated.View>
            </Pressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 PREMIUM BUTTON - Gradient with glow effect
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
}

export function PremiumButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
}: PremiumButtonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 8,
            tension: 200,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 150,
        }).start();
    };

    const sizeStyles = {
        sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, minHeight: 36 },
        md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 48 },
        lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'], minHeight: 56 },
    };

    const textSizes = {
        sm: Typography.label.md,
        md: Typography.label.lg,
        lg: Typography.heading.xs,
    };

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        if (disabled) return [Palette.neutral[300], Palette.neutral[400]];
        switch (variant) {
            case 'primary':
                return theme.gradientGold as unknown as [string, string, ...string[]];
            case 'success':
                return theme.gradientProfit as unknown as [string, string, ...string[]];
            case 'danger':
                return theme.gradientLoss as unknown as [string, string, ...string[]];
            case 'secondary':
                return [Palette.neutral[100], Palette.neutral[200]];
            default:
                return [Palette.neutral[100], Palette.neutral[200]];
        }
    };

    const getTextColor = (): string => {
        if (disabled) return Palette.neutral[500];
        switch (variant) {
            case 'primary':
            case 'success':
            case 'danger':
                return '#FFFFFF';
            case 'secondary':
                return theme.text;
            case 'ghost':
                return theme.primary;
            default:
                return theme.text;
        }
    };

    const getShadow = () => {
        if (disabled || variant === 'ghost' || variant === 'secondary') return {};
        switch (variant) {
            case 'primary':
                return theme.shadowGlow;
            case 'success':
                return theme.shadowSuccess;
            case 'danger':
                return {
                    shadowColor: Palette.rose[500],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                };
            default:
                return theme.shadowMd;
        }
    };

    const buttonContent = (
        <View style={styles.buttonContent}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[textSizes[size], { color: getTextColor() }]}>
                {loading ? 'Loading...' : title}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
    );

    if (variant === 'ghost') {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
            >
                <Animated.View
                    style={[
                        styles.buttonBase,
                        sizeStyles[size],
                        { backgroundColor: 'transparent' },
                        fullWidth && { width: '100%' },
                        { transform: [{ scale: scaleAnim }] },
                        style,
                    ]}
                >
                    {buttonContent}
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
        >
            <Animated.View
                style={[
                    { transform: [{ scale: scaleAnim }] },
                    fullWidth && { width: '100%' },
                    style,
                ]}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.buttonBase,
                        sizeStyles[size],
                        getShadow(),
                        disabled && styles.buttonDisabled,
                    ]}
                >
                    {buttonContent}
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 PREMIUM INPUT - Floating label with subtle animations
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumInputProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export function PremiumInput({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    containerStyle,
    value,
    onFocus,
    onBlur,
    ...props
}: PremiumInputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const [isFocused, setIsFocused] = React.useState(false);
    const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.timing(animValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (!value) {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        onBlur?.(e);
    };

    const labelStyle: Animated.AnimatedProps<TextStyle> = {
        position: 'absolute',
        left: leftIcon ? 48 : 16,
        top: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 11],
        }),
        color: error
            ? theme.danger
            : isFocused
            ? theme.primary
            : theme.textMuted,
        fontFamily: Typography.family.medium,
        zIndex: 1,
    };

    return (
        <View style={[styles.inputContainer, containerStyle]}>
            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: theme.surfaceHighlight,
                        borderColor: error
                            ? theme.danger
                            : isFocused
                            ? theme.primary
                            : theme.borderSubtle,
                        borderWidth: isFocused ? 2 : 1.5,
                    },
                ]}
            >
                {leftIcon && <View style={styles.inputIconLeft}>{leftIcon}</View>}
                <Animated.Text style={labelStyle}>{label}</Animated.Text>
                <TextInput
                    value={value}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                            paddingLeft: leftIcon ? 48 : 16,
                            paddingRight: rightIcon ? 48 : 16,
                        },
                        Typography.body.md,
                    ]}
                    placeholderTextColor={theme.textSubtle}
                    {...props}
                />
                {rightIcon && <View style={styles.inputIconRight}>{rightIcon}</View>}
            </View>
            {(error || hint) && (
                <Text
                    style={[
                        styles.inputHint,
                        { color: error ? theme.danger : theme.textMuted },
                    ]}
                >
                    {error || hint}
                </Text>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ PREMIUM BADGE - Pill-shaped status indicators
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumBadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
}

export function PremiumBadge({ label, variant = 'default', size = 'sm', icon }: PremiumBadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    const getColors = () => {
        switch (variant) {
            case 'success':
                return { bg: theme.successSubtle, text: theme.successText, border: theme.success };
            case 'warning':
                return { bg: theme.warningSubtle, text: theme.warningText, border: theme.warning };
            case 'danger':
                return { bg: theme.dangerSubtle, text: theme.dangerText, border: theme.danger };
            case 'info':
                return { bg: theme.infoSubtle, text: theme.infoText, border: theme.info };
            case 'gold':
                return { bg: theme.primarySubtle, text: theme.primary, border: theme.primary };
            default:
                return { bg: theme.backgroundSubtle, text: theme.textSecondary, border: theme.border };
        }
    };

    const colors = getColors();
    const sizeStyles = size === 'sm' 
        ? { paddingHorizontal: 10, paddingVertical: 4 }
        : { paddingHorizontal: 14, paddingVertical: 6 };

    return (
        <View
            style={[
                styles.badge,
                sizeStyles,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                },
            ]}
        >
            {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
            <Text
                style={[
                    size === 'sm' ? Typography.label.xs : Typography.label.sm,
                    { color: colors.text, textTransform: 'uppercase' },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 KPI CARD - Premium metric display
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
    label: string;
    value: string | number;
    trend?: {
        value: number;
        direction: 'up' | 'down' | 'neutral';
    };
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'hero' | 'compact';
    style?: ViewStyle;
}

export function KPICard({ label, value, trend, subtitle, icon, variant = 'default', style }: KPICardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    const isHero = variant === 'hero';
    const isCompact = variant === 'compact';

    const getTrendColor = () => {
        if (!trend) return theme.textMuted;
        if (trend.direction === 'up') return theme.success;
        if (trend.direction === 'down') return theme.danger;
        return theme.textMuted;
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.direction === 'up') return '↑';
        if (trend.direction === 'down') return '↓';
        return '→';
    };

    if (isHero) {
        return (
            <LinearGradient
                colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.kpiCard,
                    styles.kpiCardHero,
                    theme.shadowGlow,
                    style,
                ]}
            >
                {/* Decorative glow circle */}
                <View style={styles.kpiGlowCircle} />
                
                <View style={{ zIndex: 1 }}>
                    {icon && <View style={styles.kpiIconHero}>{icon}</View>}
                    <Text style={[Typography.label.sm, { color: 'rgba(255,255,255,0.85)', marginBottom: 8 }]}>
                        {label}
                    </Text>
                    <Text style={[Typography.number.xl, { color: '#FFFFFF', marginBottom: 4 }]}>
                        {value}
                    </Text>
                    {trend && (
                        <View style={styles.kpiTrendRow}>
                            <Text style={[Typography.label.md, { color: 'rgba(255,255,255,0.9)' }]}>
                                {getTrendIcon()} {Math.abs(trend.value)}%
                            </Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.kpiCard,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderCard,
                },
                theme.shadowSm,
                isCompact && styles.kpiCardCompact,
                style,
            ]}
        >
            {icon && <View style={[styles.kpiIcon, { backgroundColor: theme.primaryMuted }]}>{icon}</View>}
            <Text style={[Typography.label.sm, { color: theme.textMuted, marginBottom: 6 }]}>
                {label}
            </Text>
            <Text style={[isCompact ? Typography.number.md : Typography.number.lg, { color: theme.text, marginBottom: 4 }]}>
                {value}
            </Text>
            {trend && (
                <View style={styles.kpiTrendRow}>
                    <Text style={[Typography.label.sm, { color: getTrendColor() }]}>
                        {getTrendIcon()} {Math.abs(trend.value)}%
                    </Text>
                </View>
            )}
            {subtitle && (
                <Text style={[Typography.body.xs, { color: theme.textSubtle, marginTop: 2 }]}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 PREMIUM LIST ITEM - Elegant row component
// ═══════════════════════════════════════════════════════════════════════════════

interface ListItemProps {
    title: string;
    subtitle?: string;
    leftIcon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onPress?: () => void;
    showDivider?: boolean;
    badge?: {
        label: string;
        variant: 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'default';
    };
}

export function ListItem({
    title,
    subtitle,
    leftIcon,
    rightContent,
    onPress,
    showDivider = true,
    badge,
}: ListItemProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 0.98,
                useNativeDriver: true,
                friction: 8,
            }).start();
        }
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
        }).start();
    };

    const content = (
        <Animated.View
            style={[
                styles.listItem,
                {
                    borderBottomColor: showDivider ? theme.borderSubtle : 'transparent',
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            {leftIcon && (
                <View style={[styles.listItemIcon, { backgroundColor: theme.primaryMuted }]}>
                    {leftIcon}
                </View>
            )}
            <View style={styles.listItemContent}>
                <View style={styles.listItemTitleRow}>
                    <Text style={[Typography.heading.xs, { color: theme.text }]} numberOfLines={1}>
                        {title}
                    </Text>
                    {badge && <PremiumBadge label={badge.label} variant={badge.variant} size="sm" />}
                </View>
                {subtitle && (
                    <Text style={[Typography.body.sm, { color: theme.textSecondary, marginTop: 2 }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightContent && <View style={styles.listItemRight}>{rightContent}</View>}
        </Animated.View>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                {content}
            </Pressable>
        );
    }

    return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌟 GLASS HEADER - Blur header with fade
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassHeaderProps {
    title: string;
    subtitle?: string;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    paddingTop?: number;
}

export function GlassHeader({ title, subtitle, leftContent, rightContent, paddingTop = 0 }: GlassHeaderProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    return (
        <BlurView
            intensity={85}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[styles.glassHeader, { paddingTop: paddingTop + 12 }]}
        >
            <View style={styles.glassHeaderContent}>
                {leftContent ? (
                    leftContent
                ) : (
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>{title}</Text>
                        {subtitle && (
                            <Text style={[Typography.body.sm, { color: theme.textMuted, marginTop: 2 }]}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                )}
                {rightContent && <View>{rightContent}</View>}
            </View>
        </BlurView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 FAB - Floating Action Button with glow
// ═══════════════════════════════════════════════════════════════════════════════

interface FABProps {
    icon: React.ReactNode;
    onPress: () => void;
    position?: 'bottom-right' | 'bottom-center';
}

export function FAB({ icon, onPress, position = 'bottom-right' }: FABProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
        }).start();
    };

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View
                style={[
                    styles.fab,
                    position === 'bottom-center' && styles.fabCenter,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <LinearGradient
                    colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.fabGradient, theme.shadowGlow]}
                >
                    {icon}
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onPress: () => void;
    };
}

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
                {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
                <Text style={[Typography.heading.md, { color: theme.text }]}>{title}</Text>
            </View>
            {action && (
                <Pressable onPress={action.onPress}>
                    <Text style={[Typography.label.lg, { color: theme.primary }]}>{action.label}</Text>
                </Pressable>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PROGRESS BAR - Animated and stylish
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressBarProps {
    progress: number; // 0-100
    variant?: 'default' | 'success' | 'warning' | 'gradient';
    height?: number;
    showLabel?: boolean;
    label?: string;
}

export function ProgressBar({
    progress,
    variant = 'default',
    height = 8,
    showLabel = false,
    label,
}: ProgressBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const clampedProgress = Math.min(100, Math.max(0, progress));

    const getColor = () => {
        switch (variant) {
            case 'success':
                return theme.success;
            case 'warning':
                return theme.warning;
            default:
                return theme.primary;
        }
    };

    return (
        <View>
            {showLabel && (
                <View style={styles.progressLabelRow}>
                    <Text style={[Typography.label.sm, { color: theme.textMuted }]}>{label || 'Progress'}</Text>
                    <Text style={[Typography.label.sm, { color: theme.textSecondary }]}>{clampedProgress}%</Text>
                </View>
            )}
            <View style={[styles.progressBg, { height, backgroundColor: theme.backgroundSubtle }]}>
                {variant === 'gradient' ? (
                    <LinearGradient
                        colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${clampedProgress}%`, height }]}
                    />
                ) : (
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${clampedProgress}%`, height, backgroundColor: getColor() },
                        ]}
                    />
                )}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    // Button
    buttonBase: {
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    iconLeft: {
        marginRight: Spacing.sm,
    },
    iconRight: {
        marginLeft: Spacing.sm,
    },

    // Input
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    inputWrapper: {
        borderRadius: Radius.lg,
        minHeight: 60,
        justifyContent: 'center',
        position: 'relative',
    },
    input: {
        paddingTop: 22,
        paddingBottom: 10,
        minHeight: 60,
    },
    inputIconLeft: {
        position: 'absolute',
        left: 16,
        top: '50%',
        marginTop: -10,
        zIndex: 2,
    },
    inputIconRight: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
        zIndex: 2,
    },
    inputHint: {
        marginTop: 6,
        marginLeft: 4,
        ...Typography.body.xs,
    },

    // Badge
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.full,
        borderWidth: 1,
    },

    // KPI Card
    kpiCard: {
        borderRadius: Radius['2xl'],
        padding: Spacing.xl,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    kpiCardHero: {
        borderWidth: 0,
    },
    kpiCardCompact: {
        padding: Spacing.lg,
    },
    kpiGlowCircle: {
        position: 'absolute',
        top: -50,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    kpiIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    kpiIconHero: {
        marginBottom: Spacing.sm,
    },
    kpiTrendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // List Item
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
    },
    listItemIcon: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    listItemContent: {
        flex: 1,
    },
    listItemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemRight: {
        marginLeft: Spacing.md,
    },

    // Glass Header
    glassHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    glassHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: Layout.tabBar.height + 24,
        right: 24,
        zIndex: 50,
    },
    fabCenter: {
        right: undefined,
        left: '50%',
        marginLeft: -30,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Progress Bar
    progressBg: {
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    progressFill: {
        borderRadius: Radius.full,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
});
