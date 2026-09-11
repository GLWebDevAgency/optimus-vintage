/**
 * 🌌 VANTA COMPONENTS - Advanced Aether UI Elements
 *
 * Composants avancés inspirés du design Vanta Aether :
 * - Gravity Disk (ring de progression circulaire)
 * - Monolith Cards (cartes KPI style obsidian)
 * - Pulse Stream (graphiques flux dorés)
 * - Gold Fissure Progress (barres de progression premium)
 * - Item List Row (lignes de liste produits)
 *
 * Design Principles:
 * - Obsidian surfaces with gold photon emanations
 * - Chromatic text effects
 * - Floating/gravity animations
 * - Premium tactile feedback
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { CurvedHorizontalItem, useCurvedHorizontalScroll } from "@/components/ui/CurvedScroll";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 GRAVITY DISK - Circular Progress Ring (Mercury Style)
// "The interface floats in an infinite void"
// ═══════════════════════════════════════════════════════════════════════════════

interface GravityDiskProps {
  /** Pourcentage (0-100) */
  percentage: number;
  /** Taille du cercle */
  size?: number;
  /** Épaisseur du trait */
  strokeWidth?: number;
  /** Label au centre */
  label?: string;
  /** Sous-label */
  sublabel?: string;
  /** Style additionnel */
  style?: ViewStyle;
  /** Animation flottante */
  floating?: boolean;
}

export function GravityDisk({
  percentage,
  size = 200,
  strokeWidth = 4,
  label,
  sublabel,
  style,
  floating = true,
}: GravityDiskProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const progress = useSharedValue(0);
  const floatY = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    if (floating) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [percentage, floating]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[
        styles.gravityDiskContainer,
        floatingStyle,
        { width: size, height: size },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t("vanta.progress", { percentage: Math.round(percentage) })}${sublabel ? `. ${sublabel}` : ""}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
    >
      {/* Glow Background */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: Palette.metal.goldSubtle,
            opacity: 0.3,
          },
        ]}
      />

      {/* SVG Ring */}
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.borderGlass}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Palette.metal.gold}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center Content */}
      <View style={styles.gravityDiskCenter}>
        <Text style={[styles.gravityDiskValue, { color: theme.text }]}>
          {Math.round(percentage)}
          <Text
            style={[styles.gravityDiskPercent, { color: Palette.metal.gold }]}
          >
            %
          </Text>
        </Text>
        {sublabel && (
          <Text
            style={[styles.gravityDiskSublabel, { color: Palette.metal.gold }]}
          >
            {sublabel.toUpperCase()}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ MONOLITH CARD - Premium KPI Display
// "Obsidian slabs with golden light leaks"
// ═══════════════════════════════════════════════════════════════════════════════

interface MonolithCardProps {
  /** Icône */
  icon: AppIconName;
  /** Label supérieur (petit) */
  topLabel?: string;
  /** Label principal (uppercase, muted) */
  label: string;
  /** Valeur principale */
  value: string | number;
  /** Unité (affichée plus petite après la valeur) */
  unit?: string;
  /** Badge de tendance (ex: "+12%") */
  trend?: string;
  /** La tendance est positive ? */
  trendPositive?: boolean;
  /** Barres de visualisation (0-100)[] */
  bars?: number[];
  /** Lignes de "hash" style encryption */
  hashLines?: boolean;
  /** Style additionnel */
  style?: ViewStyle;
  /** Handler de press */
  onPress?: () => void;
}

export function MonolithCard({
  icon,
  topLabel,
  label,
  value,
  unit,
  trend,
  trendPositive = true,
  bars,
  hashLines,
  style,
  onPress,
}: MonolithCardProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 350 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Accessibility: create a meaningful description
  const accessibleValue =
    typeof value === "number"
      ? value.toString()
      : value
          .replace("€", `${t("accessibility.euros")} `)
          .replace("$", `${t("accessibility.dollars")} `)
          .replace("k", ` ${t("accessibility.thousand")}`);

  const content = (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.monolithCard,
        { backgroundColor: theme.surface, borderColor: theme.borderGlass },
        animatedStyle,
        style,
      ]}
      accessible
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${label}: ${accessibleValue}${unit ? ` ${unit}` : ""}${trend ? `. ${t("vanta.trend", { trend })}` : ""}`}
    >
      {/* Light Leak Effect */}
      <View
        style={[
          styles.monolithLightLeak,
          {
            experimental_backgroundImage: `linear-gradient(315deg, ${Palette.metal.goldSubtle} 0%, transparent 100%)`,
          },
        ]}
        pointerEvents="none"
      />

      {/* Top Edge Highlight */}
      <View style={styles.monolithEdgeHighlight} />

      {/* Header */}
      <View style={styles.monolithHeader}>
        <AppIcon name={icon} size={18} color={theme.textMuted} />
        {trend && (
          <View
            style={[
              styles.monolithTrendBadge,
              {
                backgroundColor: trendPositive
                  ? theme.successSubtle
                  : theme.dangerSubtle,
              },
            ]}
          >
            <Text
              style={[
                styles.monolithTrendText,
                { color: trendPositive ? theme.success : theme.danger },
              ]}
            >
              {trend}
            </Text>
          </View>
        )}
        {topLabel && (
          <Text
            style={[styles.monolithTopLabel, { color: Palette.metal.gold }]}
          >
            {topLabel.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.monolithContent}>
        <Text style={[styles.monolithLabel, { color: theme.textMuted }]}>
          {label.toUpperCase()}
        </Text>
        <View style={styles.monolithValueRow}>
          <Text style={[styles.monolithValue, { color: theme.text }]}>
            {value}
          </Text>
          {unit && (
            <Text style={[styles.monolithUnit, { color: theme.textMuted }]}>
              {unit}
            </Text>
          )}
        </View>
      </View>

      {/* Visual Elements */}
      {bars && bars.length > 0 && (
        <View style={styles.monolithBars}>
          {bars.map((height, i) => (
            <View
              key={i}
              style={[
                styles.monolithBar,
                {
                  height: `${height}%`,
                  backgroundColor: Palette.metal.gold,
                  opacity: 0.2 + (height / 100) * 0.8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {hashLines && (
        <View style={styles.monolithHashContainer}>
          <View
            style={[
              styles.monolithHashLine,
              { backgroundColor: Palette.metal.gold },
            ]}
          />
          <View style={styles.monolithHashRow}>
            <Text style={styles.monolithHashText}>EF45</Text>
            <Text style={styles.monolithHashText}>::</Text>
            <Text style={styles.monolithHashText}>A901</Text>
          </View>
          <View
            style={[
              styles.monolithHashLine,
              { backgroundColor: Palette.metal.gold, opacity: 0.3 },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 GOLD FISSURE PROGRESS - Premium Progress Bar
// "Golden light bleeding through obsidian"
// ═══════════════════════════════════════════════════════════════════════════════

interface GoldFissureProgressProps {
  /** Pourcentage (0-100) */
  percentage: number;
  /** Hauteur de la barre */
  height?: number;
  /** Afficher le label du pourcentage */
  showLabel?: boolean;
  /** Label custom à droite */
  rightLabel?: string;
  /** Style */
  style?: ViewStyle;
}

export function GoldFissureProgress({
  percentage,
  height = 4,
  showLabel = false,
  rightLabel,
  style,
}: GoldFissureProgressProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.progressWrapper, style]}>
      <View
        style={[
          styles.progressTrack,
          { height, backgroundColor: theme.borderGlass },
        ]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t("accessibility.progressBar", {
          percentage: Math.round(percentage),
        })}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: Palette.metal.gold,
              boxShadow: `0 0 8px ${Palette.metal.goldGlow}`,
            },
            animatedWidth,
          ]}
        />
      </View>
      {(showLabel || rightLabel) && (
        <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
          {rightLabel || `${Math.round(percentage)}%`}
        </Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 ITEM LIST ROW - Product Row Component
// "Chronos Serum | 50ML :: QTY 01 | $850.00"
// ═══════════════════════════════════════════════════════════════════════════════

interface ItemListRowProps {
  /** Icône à gauche */
  icon: AppIconName;
  /** Nom principal */
  name: string;
  /** Description (ex: "50ML :: QTY 01") */
  description?: string;
  /** Prix ou valeur à droite */
  price: string;
  /** Handler de press */
  onPress?: () => void;
  /** Style */
  style?: ViewStyle;
}

export function ItemListRow({
  icon,
  name,
  description,
  price,
  onPress,
  style,
}: ItemListRowProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 18, stiffness: 350 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Accessibility: format price for screen readers
  const accessiblePrice = price
    .replace("€", `${t("accessibility.euros")} `)
    .replace("$", `${t("accessibility.dollars")} `);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${description || ""}. ${accessiblePrice}`}
      accessibilityHint={t("vanta.tapForDetails")}
    >
      <Animated.View
        style={[
          styles.itemRow,
          { backgroundColor: theme.surface, borderColor: theme.borderGlass },
          animatedStyle,
          style,
        ]}
      >
        {/* Icon */}
        <View
          style={[styles.itemRowIcon, { backgroundColor: theme.surfaceSlab }]}
        >
          <AppIcon name={icon} size={20} color={theme.textMuted} />
        </View>

        {/* Content */}
        <View style={styles.itemRowContent}>
          <Text
            style={[styles.itemRowName, { color: theme.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {description && (
            <Text style={[styles.itemRowDesc, { color: theme.textMuted }]}>
              {description.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Price */}
        <Text style={[styles.itemRowPrice, { color: theme.text }]}>
          {price}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ VANTA SECTION HEADER
// "CURATED COLLECTION                          View All"
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaSectionHeaderProps {
  label: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function VantaSectionHeader({
  label,
  action,
  style,
}: VantaSectionHeaderProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();

  return (
    <View
      style={[styles.sectionHeader, style]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={t("accessibility.sectionHeader", { label })}
    >
      <Text style={[styles.sectionHeaderLabel, { color: theme.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text
            style={[styles.sectionHeaderAction, { color: theme.textSecondary }]}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 VANTA CATEGORY CARD
// Cards avec icône diamant, count, label
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaCategoryCardProps {
  icon: AppIconName;
  count: number;
  countLabel?: string;
  label: string;
  title: string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function VantaCategoryCard({
  icon,
  count,
  countLabel,
  label,
  title,
  accentColor,
  onPress,
  style,
}: VantaCategoryCardProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const scale = useSharedValue(1);
  const accent = accentColor || Palette.metal.gold;

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 18, stiffness: 350 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={t("accessibility.categoryCard", { title, count })}
      accessibilityHint={t("vanta.tapForDetails")}
    >
      <Animated.View
        style={[
          styles.categoryCard,
          { backgroundColor: theme.surface, borderColor: theme.borderGlass },
          animatedStyle,
          style,
        ]}
      >
        {/* Header with icon and count */}
        <View style={styles.categoryCardHeader}>
          <AppIcon name={icon} size={24} color={accent} />
          <Text style={[styles.categoryCardCount, { color: theme.textMuted }]}>
            {String(count).padStart(2, "0")}{" "}
            {countLabel?.toUpperCase() || t("vanta.items")}
          </Text>
        </View>

        {/* Labels */}
        <View style={styles.categoryCardLabels}>
          <Text style={[styles.categoryCardLabel, { color: theme.textMuted }]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.categoryCardTitle, { color: theme.text }]}>
            {title}
          </Text>
        </View>

        {/* Accent underline */}
        <View
          style={[styles.categoryCardAccent, { backgroundColor: accent }]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 VANTA STATUS BADGE
// "AES-4096 ENCRYPTED          |||"
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaStatusBadgeProps {
  icon: AppIconName;
  label: string;
  bars?: number;
  style?: ViewStyle;
}

export function VantaStatusBadge({
  icon,
  label,
  bars = 3,
  style,
}: VantaStatusBadgeProps) {
  const theme = useVantaTheme();

  return (
    <View
      style={[styles.statusBadge, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <AppIcon name={icon} size={14} color={Palette.metal.gold} />
      <Text style={[styles.statusBadgeLabel, { color: theme.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      <View style={styles.statusBadgeBars}>
        {Array.from({ length: bars }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.statusBadgeBar,
              {
                backgroundColor: Palette.metal.gold,
                opacity: 0.4 + (i / bars) * 0.6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 VANTA CTA BUTTON
// "COMPLETE ACQUISITION          →"
// ═══════════════════════════════════════════════════════════════════════════════

interface VantaCTAButtonProps {
  label: string;
  onPress: () => void;
  icon?: AppIconName;
  style?: ViewStyle;
}

export function VantaCTAButton({
  label,
  onPress,
  icon,
  style,
}: VantaCTAButtonProps) {
  const theme = useVantaTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 350 });
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.ctaButton,
          { borderColor: Palette.metal.gold },
          animatedStyle,
          style,
        ]}
      >
        <Text style={[styles.ctaButtonLabel, { color: Palette.metal.gold }]}>
          {label.toUpperCase()}
        </Text>
        <AppIcon
          name={icon || "arrow-forward"}
          size={20}
          color={Palette.metal.gold}
        />
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// � NETFLIX CAROUSEL - Horizontal Scrolling Items per Lot
// "Infinite scroll with progressive loading"
// ═══════════════════════════════════════════════════════════════════════════════

export interface CarouselItem {
  id: number;
  brand?: string | null;
  type?: string | null;
  unitCost: number | string;
  color?: string | null;
  size?: string | null;
  photoUri?: string | null;
  lotId: number;
}

interface NetflixCarouselProps {
  lotName: string;
  lotId: number;
  items: CarouselItem[];
  itemCount: number;
  onItemPress: (item: CarouselItem) => void;
  onSellPress: (item: CarouselItem) => void;
  onSeeAllPress: () => void;
  style?: ViewStyle;
}

const CAROUSEL_ITEM_WIDTH = 156; // 140 card + 16 margin
const CAROUSEL_PAGE_SIZE = 10; // Items loaded per page

export function NetflixCarousel({
  lotName,
  lotId,
  items,
  itemCount,
  onItemPress,
  onSellPress,
  onSeeAllPress,
  style,
}: NetflixCarouselProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { scrollX, scrollHandler } = useCurvedHorizontalScroll();

  // Progressive pagination — show items in batches
  const [visibleCount, setVisibleCount] = useState(CAROUSEL_PAGE_SIZE);
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const hasMore = visibleCount < items.length;

  const handleEndReached = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + CAROUSEL_PAGE_SIZE, items.length));
    }
  }, [hasMore, items.length]);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={{ width: 60, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color={Palette.metal.gold} />
      </View>
    );
  }, [hasMore]);

  const renderCarouselItem = useCallback(({ item, index }: { item: CarouselItem; index: number }) => {
    const cost =
      typeof item.unitCost === "string"
        ? parseFloat(item.unitCost)
        : item.unitCost;

    return (
      <CurvedHorizontalItem
        scrollX={scrollX}
        index={index}
        itemWidth={CAROUSEL_ITEM_WIDTH}
        preset="standard"
      >
        <Pressable
          style={[
            styles.carouselItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderGlass,
            },
          ]}
          onPress={() => onItemPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.brand || t("vanta.article")} ${item.type || ""}, ${cost.toFixed(2)} ${t("accessibility.euros")}`}
        >
          {/* Image / Placeholder */}
          <View
            style={[styles.carouselItemImage, { backgroundColor: theme.surface }]}
          >
            <AppIcon name="checkroom" size={40} color={theme.textMuted} />
            {/* Gradient Overlay */}
            <View
              style={[
                styles.carouselItemGradient,
                {
                  experimental_backgroundImage: `linear-gradient(to bottom, transparent 0%, ${theme.background} 100%)`,
                },
              ]}
            />
          </View>

          {/* Content */}
          <View style={styles.carouselItemContent}>
            <Text
              style={[styles.carouselItemBrand, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.brand || t("vanta.brand")}
            </Text>
            <Text
              style={[styles.carouselItemType, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {item.type || t("vanta.article")} ·{" "}
              {item.size || t("vanta.oneSize")}
            </Text>

            <View style={styles.carouselItemFooter}>
              <Text
                style={[styles.carouselItemPrice, { color: Palette.metal.gold }]}
              >
                €{cost.toFixed(0)}
              </Text>
              <Pressable
                style={[
                  styles.carouselSellBtn,
                  { backgroundColor: Palette.metal.goldSubtle },
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (isIOS)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSellPress(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("vanta.sell")}
              >
                <AppIcon name="sell" size={14} color={Palette.metal.gold} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </CurvedHorizontalItem>
    );
  }, [scrollX, theme, t, onItemPress, onSellPress]);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(lotId * 50)}
      style={[styles.carouselContainer, style]}
    >
      {/* Header */}
      <View style={styles.carouselHeader}>
        <View style={styles.carouselHeaderLeft}>
          <View
            style={[
              styles.carouselLotIcon,
              { backgroundColor: Palette.metal.goldSubtle },
            ]}
          >
            <AppIcon name="inventory-2" size={16} color={Palette.metal.gold} />
          </View>
          <Text style={[styles.carouselTitle, { color: theme.text }]}>
            {lotName}
          </Text>
          <Text style={[styles.carouselCount, { color: theme.textMuted }]}>
            ({itemCount})
          </Text>
        </View>

        <Pressable
          style={styles.carouselSeeAll}
          onPress={onSeeAllPress}
          accessibilityRole="button"
          accessibilityLabel={t("vanta.seeAllItems", { name: lotName })}
        >
          <Text
            style={[styles.carouselSeeAllText, { color: Palette.metal.gold }]}
          >
            {t("vanta.seeAll")}
          </Text>
          <AppIcon name="chevron-right" size={16} color={Palette.metal.gold} />
        </Pressable>
      </View>

      {/* Horizontal Scroll — with iOS curved depth + progressive pagination */}
      <Animated.FlatList
        horizontal
        data={visibleItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCarouselItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselList}
        decelerationRate="fast"
        snapToInterval={CAROUSEL_ITEM_WIDTH}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👁️ LOT VISIBILITY CONTROLLER - Sheet to show/hide lots
// "Filter your view by lot visibility"
// ═══════════════════════════════════════════════════════════════════════════════

export interface LotVisibilityItem {
  id: number;
  name: string;
  itemCount: number;
  isVisible: boolean;
}

interface LotVisibilityControllerProps {
  visible: boolean;
  lots: LotVisibilityItem[];
  onToggle: (lotId: number) => void;
  onClose: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export function LotVisibilityController({
  visible,
  lots,
  onToggle,
  onClose,
  onShowAll,
  onHideAll,
}: LotVisibilityControllerProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();

  if (!visible) return null;

  const visibleCount = lots.filter((l) => l.isVisible).length;

  return (
    <Pressable style={styles.visibilityOverlay} onPress={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.visibilitySheet, { backgroundColor: theme.surface }]}
      >
        {/* Handle */}
        <View
          style={[
            styles.visibilityHandle,
            { backgroundColor: theme.borderGlass },
          ]}
        />

        {/* Header */}
        <View style={styles.visibilityHeader}>
          <View>
            <Text style={[styles.visibilityTitle, { color: theme.text }]}>
              {t("vanta.visibleLots")}
            </Text>
            <Text
              style={[styles.visibilitySubtitle, { color: theme.textMuted }]}
            >
              {t("vanta.lotsDisplayed", {
                count: visibleCount,
                total: lots.length,
              })}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Pressable
              onPress={onShowAll}
              style={[
                styles.visibilityClose,
                { backgroundColor: Palette.metal.goldSubtle },
              ]}
              accessibilityLabel={t("vanta.showAllLots")}
            >
              <AppIcon name="visibility" size={18} color={Palette.metal.gold} />
            </Pressable>
            <Pressable
              onPress={onHideAll}
              style={[
                styles.visibilityClose,
                { backgroundColor: theme.background },
              ]}
              accessibilityLabel={t("vanta.hideAllLots")}
            >
              <AppIcon
                name="visibility-off"
                size={18}
                color={theme.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={[
                styles.visibilityClose,
                { backgroundColor: theme.background },
              ]}
              accessibilityLabel={t("common.close")}
            >
              <AppIcon name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* List */}
        <Animated.ScrollView
          style={styles.visibilityList}
          showsVerticalScrollIndicator={false}
        >
          {lots.map((lot) => (
            <Pressable
              key={lot.id}
              style={[
                styles.visibilityItem,
                { borderBottomColor: theme.borderGlass },
              ]}
              onPress={() => {
                if (isIOS)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(lot.id);
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: lot.isVisible }}
              accessibilityLabel={`${lot.name}, ${t("vanta.lotItems", { count: lot.itemCount })}`}
            >
              <View
                style={[
                  styles.carouselLotIcon,
                  {
                    backgroundColor: lot.isVisible
                      ? Palette.metal.goldSubtle
                      : theme.background,
                  },
                ]}
              >
                <AppIcon
                  name="inventory-2"
                  size={16}
                  color={lot.isVisible ? Palette.metal.gold : theme.textMuted}
                />
              </View>

              <View style={styles.visibilityItemInfo}>
                <Text
                  style={[
                    styles.visibilityItemName,
                    { color: lot.isVisible ? theme.text : theme.textMuted },
                  ]}
                >
                  {lot.name}
                </Text>
                <Text
                  style={[
                    styles.visibilityItemCount,
                    { color: theme.textMuted },
                  ]}
                >
                  {t("vanta.lotItems", { count: lot.itemCount })}
                </Text>
              </View>

              {/* Toggle Switch */}
              <View
                style={[
                  styles.visibilityToggle,
                  {
                    backgroundColor: lot.isVisible
                      ? Palette.metal.gold
                      : theme.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.visibilityToggleKnob,
                    {
                      backgroundColor: "#FFFFFF",
                      alignSelf: lot.isVisible ? "flex-end" : "flex-start",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </Animated.ScrollView>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// �🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Gravity Disk
  gravityDiskContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gravityDiskCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  gravityDiskValue: {
    fontSize: 48,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -2,
  },
  gravityDiskPercent: {
    fontSize: 20,
    fontFamily: "Manrope_500Medium",
  },
  gravityDiskSublabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 2,
    marginTop: 4,
  },

  // Monolith Card
  monolithCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 140,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    borderCurve: "continuous",
  },
  monolithLightLeak: {
    position: "absolute",
    bottom: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  monolithEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  monolithHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  monolithTrendBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  monolithTrendText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1,
  },
  monolithTopLabel: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1.5,
  },
  monolithContent: {
    gap: 4,
  },
  monolithLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 2,
  },
  monolithValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  monolithValue: {
    fontSize: 22,
    fontFamily: "Manrope_600SemiBold",
  },
  monolithUnit: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
  },
  monolithBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 32,
    marginTop: Spacing.sm,
  },
  monolithBar: {
    width: 4,
    borderRadius: 2,
  },
  monolithHashContainer: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  monolithHashLine: {
    height: 1,
    width: "100%",
    opacity: 0.4,
  },
  monolithHashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monolithHashText: {
    fontSize: 8,
    fontFamily: "Manrope_500Medium",
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 2,
  },

  // Progress
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    minWidth: 45,
    textAlign: "right",
  },

  // Item Row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    borderCurve: "continuous",
  },
  itemRowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRowContent: {
    flex: 1,
    gap: 2,
  },
  itemRowName: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
  },
  itemRowDesc: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    letterSpacing: 1,
  },
  itemRowPrice: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 2,
  },
  sectionHeaderAction: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    textDecorationLine: "underline",
  },

  // Category Card
  categoryCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 130,
    justifyContent: "space-between",
    borderCurve: "continuous",
  },
  categoryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryCardCount: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    letterSpacing: 1,
  },
  categoryCardLabels: {
    gap: 4,
  },
  categoryCardLabel: {
    fontSize: 10,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 1.5,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  categoryCardAccent: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    width: 24,
    height: 2,
    borderRadius: 1,
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadgeLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    letterSpacing: 1.5,
    flex: 1,
  },
  statusBadgeBars: {
    flexDirection: "row",
    gap: 2,
  },
  statusBadgeBar: {
    width: 3,
    height: 12,
    borderRadius: 1,
  },

  // CTA Button
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  ctaButtonLabel: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 2,
  },

  // Netflix Carousel
  carouselContainer: {
    marginBottom: Spacing.xl,
  },
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  carouselHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  carouselLotIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  carouselTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  carouselCount: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    marginLeft: Spacing.xs,
  },
  carouselSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  carouselSeeAllText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
  },
  carouselList: {
    paddingHorizontal: Spacing.lg,
  },
  carouselItem: {
    width: 140,
    marginRight: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  carouselItemImage: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselItemGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  carouselItemContent: {
    padding: Spacing.sm,
  },
  carouselItemBrand: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    marginBottom: 2,
  },
  carouselItemType: {
    fontSize: 11,
    fontFamily: "Manrope_400Regular",
    marginBottom: Spacing.xs,
  },
  carouselItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carouselItemPrice: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
  },
  carouselSellBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },

  // Visibility Controller
  visibilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  visibilitySheet: {
    borderTopLeftRadius: Radius["2xl"],
    borderTopRightRadius: Radius["2xl"],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    maxHeight: "70%",
  },
  visibilityHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  visibilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  visibilityTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  visibilitySubtitle: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    marginTop: 2,
  },
  visibilityClose: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityList: {
    paddingHorizontal: Spacing.xl,
  },
  visibilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  visibilityItemInfo: {
    flex: 1,
  },
  visibilityItemName: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
  },
  visibilityItemCount: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    marginTop: 2,
  },
  visibilityToggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  visibilityToggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
