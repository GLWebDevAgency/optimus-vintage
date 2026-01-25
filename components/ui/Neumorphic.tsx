/**
 * 🎨 NEUMORPHIC UI COMPONENTS
 *
 * Composants réutilisables avec effet neumorphique dark
 * Fidèle 100% au design système de référence:
 *
 * ÉTATS DES ÉLÉMENTS:
 * ─────────────────────────────────────────────────────
 * 🔹 FLAT     - État repos, ombre externe douce
 * 🔸 CONVEX   - État bombé, relief accentué
 * 🔻 PRESSED  - État enfoncé (inset), ombre interne
 * ⚡ ACTIVE   - Animation au toucher (scale + transition)
 *
 * Le design utilise:
 * - Flat → Pressed pour les toggles/chips (transition animée)
 * - Convex pour les éléments en relief (cards, barres)
 * - Pressed/Inset pour les éléments sélectionnés (tabs, filtres)
 */

import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    type PressableProps,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import {
    NeuPalette,
    NeuRadius,
    NeuShadows,
    NeuSpacing,
    NeuTypography,
} from "@/constants/NeumorphicTheme";
import { useNeuTheme } from "@/constants/ThemeContext";
import { AppIcon, type AppIconName } from "./AppIcon";

// ═══════════════════════════════════════════════════════════════════════════════
// 🪝 HOOK: useNeuColors - Accès dynamique aux couleurs du thème
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook pour accéder aux couleurs et ombres du thème actuel
 * Utilise le contexte de thème pour retourner les bonnes valeurs Light/Dark
 */
export function useNeuColors() {
  const theme = useNeuTheme();
  return {
    palette: theme.palette,
    shadows: theme.shadows,
    spacing: theme.spacing,
    radius: theme.radius,
    typography: theme.typography,
    isDark: theme.isDark,
    colorScheme: theme.colorScheme,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANIMATION CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.7,
};

const SPRING_SNAPPY = {
  damping: 24,
  stiffness: 320,
  mass: 0.5,
};

const TIMING_FAST = {
  duration: 120,
  easing: Easing.out(Easing.ease),
};

const TIMING_SMOOTH = {
  duration: 200,
  easing: Easing.inOut(Easing.ease),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 NEUMORPHIC SCREEN (Container de base avec fond brouillard)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withFog?: boolean;
}

export function NeuScreen({ children, style, withFog = true }: NeuScreenProps) {
  const { palette, isDark } = useNeuTheme();

  return (
    <View
      style={[{ flex: 1, backgroundColor: palette.background.main }, style]}
    >
      {/* Effet brouillard/gradient de fond */}
      {withFog && (
        <LinearGradient
          colors={[
            isDark ? "rgba(0, 208, 132, 0.08)" : "rgba(0, 208, 132, 0.05)",
            "transparent",
            isDark ? "rgba(99, 102, 241, 0.05)" : "rgba(99, 102, 241, 0.03)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.8,
          }}
        />
      )}
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 NEUMORPHIC CARD (Effet élevé avec shadows fidèles au design)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "flat" | "convex" | "pressed" | "gradient";
  onPress?: () => void;
  padding?: keyof typeof NeuSpacing;
  borderRadius?: keyof typeof NeuRadius;
}

/**
 * Card neumorphique avec variants:
 * ─────────────────────────────────────────────────────────────
 * 🔹 flat    - Ombre externe standard (élément au repos)
 * 🔸 convex  - Ombre externe prononcée (relief bombé)
 * 🔻 pressed - Ombre interne (enfoncé/inset)
 * 🌈 gradient - Dégradé avec ombre
 */
export function NeuCard({
  children,
  style,
  variant = "flat",
  onPress,
  padding = "lg",
  borderRadius = "xl",
}: NeuCardProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();
  const scale = useSharedValue(1);
  const activePress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${interpolate(activePress.value, [0, 1], [0, -0.3])}deg` },
    ],
  }));

  const handlePressIn = useCallback(() => {
    activePress.value = withTiming(1, TIMING_FAST);
    scale.value = withSpring(0.97, SPRING_SNAPPY);
  }, [scale, activePress]);

  const handlePressOut = useCallback(() => {
    activePress.value = withTiming(0, TIMING_FAST);
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale, activePress]);

  // Determine shadow based on variant (dynamique selon thème)
  const getShadowStyle = () => {
    switch (variant) {
      case "convex":
        return {
          web: { boxShadow: shadows.convex.css as any },
          ios: shadows.convex.ios,
          android: { elevation: shadows.convex.android },
        };
      case "pressed":
        return {
          web: { boxShadow: shadows.pressed.css as any },
          ios: {},
          android: {},
        };
      case "flat":
      default:
        return {
          web: { boxShadow: shadows.flat.css as any },
          ios: shadows.flat.ios,
          android: { elevation: shadows.flat.android },
        };
    }
  };

  const shadowStyles = getShadowStyle();

  const cardStyle: ViewStyle = {
    backgroundColor: palette.background.main,
    borderRadius: radius[borderRadius],
    padding: spacing[padding],
    borderCurve: "continuous",
    ...(Platform.OS === "web" && shadowStyles.web),
    ...(Platform.OS === "ios" && shadowStyles.ios),
    ...(Platform.OS === "android" && shadowStyles.android),
    ...(variant === "pressed" && {
      borderWidth: 1,
      borderColor: shadows.pressed.borderColor,
    }),
  };

  // Gradient variant
  if (variant === "gradient") {
    const content = (
      <LinearGradient
        colors={[
          palette.background.gradient.start,
          palette.background.gradient.end,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderRadius: radius[borderRadius],
            padding: spacing[padding],
          },
          Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
          Platform.OS === "ios" && shadows.flat.ios,
          Platform.OS === "android" && { elevation: shadows.flat.android },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            {content}
          </Pressable>
        </Animated.View>
      );
    }
    return content;
  }

  // Pressed variant (inset look)
  if (variant === "pressed") {
    return (
      <View
        style={[
          {
            backgroundColor: palette.background.main,
            borderRadius: radius[borderRadius],
            padding: spacing[padding],
            borderWidth: 1,
            borderColor: palette.background.dark,
          },
          Platform.OS === "web" && { boxShadow: shadows.pressed.css as any },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Flat variant (default)
  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[cardStyle, style]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 NEUMORPHIC BUTTON - Flat ↔ Pressed avec glow
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuButtonProps extends Omit<PressableProps, "style"> {
  children?: React.ReactNode;
  label?: string;
  icon?: AppIconName;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

/**
 * Button neumorphique avec animations:
 * ─────────────────────────────────────────────────────────────
 * 🔵 primary   - Fond primary + glow pulsant
 * ⚪ secondary - Flat convex → Pressed au toucher
 * 👻 ghost     - Transparent, texte primary
 *
 * Animation: scale(0.93) + shadow morph + haptic feedback
 */
export function NeuButton({
  children,
  label,
  icon,
  variant = "secondary",
  size = "md",
  style,
  labelStyle,
  fullWidth = false,
  onPress,
  ...props
}: NeuButtonProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();
  const scale = useSharedValue(1);
  const activePress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${interpolate(activePress.value, [0, 1], [0, -0.5])}deg` },
    ],
  }));

  const handlePressIn = useCallback(() => {
    activePress.value = withTiming(1, TIMING_FAST);
    scale.value = withSpring(0.93, SPRING_SNAPPY);
  }, [scale, activePress]);

  const handlePressOut = useCallback(() => {
    activePress.value = withTiming(0, TIMING_FAST);
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale, activePress]);

  const sizeStyles = {
    sm: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      iconSize: 16,
      fontSize: 11,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 22,
      iconSize: 18,
      fontSize: 12,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 28,
      iconSize: 20,
      fontSize: 14,
    },
  };
  const s = sizeStyles[size];

  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  const buttonStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: s.paddingVertical,
    paddingHorizontal: s.paddingHorizontal,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    ...(fullWidth && { width: "100%" }),
    ...(isPrimary && {
      backgroundColor: palette.primary.main,
      ...(Platform.OS === "web" && { boxShadow: shadows.glow.cssMd as any }),
      ...(Platform.OS === "ios" && shadows.glow.ios),
    }),
    ...(variant === "secondary" && {
      backgroundColor: palette.background.main,
      ...(Platform.OS === "web" && {
        boxShadow: shadows.convex.cssSm as any,
      }),
      ...(Platform.OS === "ios" && shadows.convex.iosSm),
      ...(Platform.OS === "android" && {
        elevation: shadows.convex.androidSm,
      }),
    }),
    ...(isGhost && {
      backgroundColor: "transparent",
    }),
  };

  const textColor = isPrimary
    ? palette.text.white
    : isGhost
      ? palette.primary.main
      : palette.text.secondary;

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: "100%" }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[buttonStyle, style]}
        {...props}
      >
        {icon && <AppIcon name={icon} size={s.iconSize} color={textColor} />}
        {label && (
          <Text
            style={[
              {
                color: textColor,
                fontSize: s.fontSize,
                fontWeight: "700",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔵 NEUMORPHIC ICON CONTAINER (Pressed style)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuIconProps {
  icon: AppIconName;
  size?: number;
  color?: string;
  containerSize?: number;
  variant?: "flat" | "pressed";
  style?: StyleProp<ViewStyle>;
}

export function NeuIcon({
  icon,
  size = 18,
  color,
  containerSize = 40,
  variant = "pressed",
  style,
}: NeuIconProps) {
  const { palette, shadows } = useNeuTheme();
  const iconColor = color ?? palette.text.secondary;

  // Pressed effect: sur iOS/Android on simule l'effet inset avec une bordure + overlay
  const isPressed = variant === "pressed";

  const containerStyle: ViewStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background.main,
    // Pressed: bordure interne pour simuler l'effet inset sur native
    ...(isPressed && {
      borderWidth: 1,
      borderColor: shadows.pressed.borderColor,
    }),
    // Web: boxShadow inset réel
    ...(isPressed &&
      Platform.OS === "web" && {
        boxShadow: shadows.pressed.cssSm as any,
        borderWidth: 0,
      }),
    // Flat variant
    ...(variant === "flat" &&
      Platform.OS === "web" && {
        boxShadow: shadows.flat.cssSm as any,
      }),
    ...(variant === "flat" && Platform.OS === "ios" && shadows.flat.iosSm),
    ...(variant === "flat" &&
      Platform.OS === "android" && {
        elevation: shadows.flat.androidSm,
      }),
  };

  return (
    <View style={[containerStyle, style]}>
      {/* Overlay pour effet pressed sur native */}
      {isPressed && Platform.OS !== "web" && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: containerSize / 2,
            backgroundColor: shadows.pressed.overlayColor,
          }}
        />
      )}
      <AppIcon name={icon} size={size} color={iconColor} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 NEUMORPHIC METRIC CARD (3-column layout)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuMetricCardProps {
  icon: AppIconName;
  iconColor: string;
  value: string;
  label: string;
  onPress?: () => void;
}

export function NeuMetricCard({
  icon,
  iconColor,
  value,
  label,
  onPress,
}: NeuMetricCardProps) {
  const { palette, spacing, typography } = useNeuTheme();

  return (
    <NeuCard
      style={styles.metricCard}
      padding="md"
      borderRadius="xl"
      onPress={onPress}
    >
      <NeuIcon
        icon={icon}
        color={iconColor}
        size={18}
        containerSize={40}
        variant="pressed"
      />
      <Text
        style={[
          typography.number.lg,
          { color: palette.text.primary, marginTop: spacing.sm },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          typography.label.xs,
          {
            color: palette.text.muted,
            marginTop: spacing["2xs"],
            textTransform: "uppercase", // Maquette: uppercase labels
          },
        ]}
      >
        {label}
      </Text>
    </NeuCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 NEUMORPHIC QUICK ACTION - Bouton d'action rapide
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuQuickActionProps {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  iconColor?: string;
}

/**
 * Quick Action avec animations fluides:
 * ─────────────────────────────────────────────────────────────
 * 🔵 primary   - Fond primary avec glow
 * ⚪ secondary - Fond dark avec icon pressed
 *
 * Animation: scale(0.92) + rotation subtile + spring physics
 */
export function NeuQuickAction({
  icon,
  label,
  onPress,
  variant = "secondary",
  iconColor,
}: NeuQuickActionProps) {
  const { palette, shadows, spacing, typography } = useNeuTheme();
  const defaultIconColor = iconColor ?? palette.text.secondary;
  const scale = useSharedValue(1);
  const activePress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${interpolate(activePress.value, [0, 1], [0, -1])}deg` },
    ],
  }));

  const handlePressIn = useCallback(() => {
    activePress.value = withTiming(1, TIMING_FAST);
    scale.value = withSpring(0.92, SPRING_SNAPPY);
  }, [scale, activePress]);

  const handlePressOut = useCallback(() => {
    activePress.value = withTiming(0, TIMING_FAST);
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale, activePress]);

  const isPrimary = variant === "primary";

  return (
    <Animated.View style={[styles.quickAction, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.quickActionInner,
          {
            backgroundColor: isPrimary
              ? palette.primary.main
              : palette.background.main,
            borderCurve: "continuous",
          },
          Platform.OS === "web" &&
            ({
              boxShadow: isPrimary ? shadows.glow.cssMd : shadows.convex.css,
            } as any),
          Platform.OS === "ios" &&
            (isPrimary ? shadows.glow.ios : shadows.convex.ios),
          Platform.OS === "android" && {
            elevation: isPrimary ? 14 : shadows.convex.android,
          },
        ]}
      >
        <View
          style={[
            styles.quickActionIconWrap,
            {
              backgroundColor: isPrimary
                ? "rgba(255,255,255,0.2)"
                : palette.background.main,
            },
            !isPrimary &&
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.cssSm as any,
              },
          ]}
        >
          <AppIcon
            name={icon}
            size={20}
            color={isPrimary ? palette.text.white : defaultIconColor}
          />
        </View>
        <Text
          style={[
            typography.label.xs,
            {
              color: isPrimary ? palette.text.white : palette.text.secondary,
              marginTop: spacing.sm,
              textAlign: "center",
              fontWeight: "700",
            },
          ]}
          numberOfLines={2}
        >
          {label.replace(" ", "\n")}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 NEUMORPHIC TOP LOT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuTopLotCardProps {
  rank: number;
  name: string;
  salesCount: number;
  revenue: string;
  profit: string;
  profitPositive: boolean;
  onPress?: () => void;
}

export function NeuTopLotCard({
  rank,
  name,
  salesCount,
  revenue,
  profit,
  profitPositive,
  onPress,
}: NeuTopLotCardProps) {
  const { palette, typography } = useNeuTheme();

  return (
    <NeuCard
      style={styles.topLotCard}
      padding="md"
      borderRadius="xl"
      onPress={onPress}
    >
      <View style={[styles.rankBadge, { backgroundColor: palette.gold.main }]}>
        <Text style={[typography.number.md, { color: palette.text.white }]}>
          #{rank}
        </Text>
      </View>
      <View style={styles.topLotInfo}>
        <Text
          style={[typography.heading.sm, { color: palette.text.primary }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={[typography.body.xs, { color: palette.text.muted }]}>
          {salesCount} vente{salesCount > 1 ? "s" : ""}
        </Text>
      </View>
      <View style={styles.topLotStats}>
        <Text style={[typography.number.md, { color: palette.text.primary }]}>
          {revenue}
        </Text>
        <Text
          style={[
            typography.label.sm,
            {
              color: profitPositive ? palette.primary.main : palette.accent.red,
            },
          ]}
        >
          {profit}
        </Text>
      </View>
    </NeuCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 NEUMORPHIC PERIOD CHIP - Flat ↔ Primary avec animation fluide
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuPeriodChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Period Chip avec transition animée fidèle au design système maquette:
 * ─────────────────────────────────────────────────────────────────────
 * 🔹 Non sélectionné: Flat/Convex (ombre externe, relief sortant, texte muted)
 * ✅ Sélectionné: bg-primary + shadow-glow-primary + text-white + scale 1.05
 * ⚡ Active: Animation scale(0.92) + spring physics
 *
 * REF MAQUETTE: <button class="bg-primary text-white shadow-glow-primary transform scale-105">
 */
export function NeuPeriodChip({
  label,
  selected,
  onPress,
}: NeuPeriodChipProps) {
  const { palette, shadows, radius, typography, isDark } = useNeuTheme();

  // Animation values
  const scale = useSharedValue(1);
  const pressProgress = useSharedValue(selected ? 1 : 0);
  const activePress = useSharedValue(0);

  // Sync selection state avec timing smooth
  useEffect(() => {
    pressProgress.value = withTiming(selected ? 1 : 0, TIMING_SMOOTH);
  }, [selected, pressProgress]);

  // Press handlers avec animation scale prononcée
  const handlePressIn = useCallback(() => {
    activePress.value = withTiming(1, TIMING_FAST);
    scale.value = withSpring(0.92, SPRING_SNAPPY);
  }, [scale, activePress]);

  const handlePressOut = useCallback(() => {
    activePress.value = withTiming(0, TIMING_FAST);
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale, activePress]);

  // Container animation (scale when selected + press effect)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          scale.value * interpolate(pressProgress.value, [0, 1], [1, 1.05]),
      },
      { rotate: `${interpolate(activePress.value, [0, 1], [0, -0.5])}deg` },
    ],
  }));

  // Background color animation (transparent → primary)
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor:
      pressProgress.value > 0.5
        ? palette.primary.main
        : palette.background.main,
  }));

  // Text style animation - smooth color transition
  const textStyle = useAnimatedStyle(() => ({
    color: pressProgress.value > 0.5 ? "#FFFFFF" : palette.text.muted,
  }));

  // Glow effect (visible when selected)
  const glowOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(pressProgress.value, [0, 1], [0, 1]),
  }));

  // Flat shadow (visible when NOT selected)
  const flatOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(pressProgress.value, [0, 0.5, 1], [1, 0.3, 0]),
  }));

  return (
    <Animated.View style={[styles.periodChipOuter, containerStyle]}>
      {/* Flat shadow layer (non-selected state) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.periodChipFlat,
          { backgroundColor: palette.background.main, borderRadius: radius.lg },
          flatOpacity,
          Platform.OS === "web" && ({ boxShadow: shadows.flat.cssSm } as any),
          Platform.OS === "ios" && shadows.flat.iosSm,
          Platform.OS === "android" && { elevation: shadows.flat.androidSm },
        ]}
      />

      {/* Glow layer (selected state) - shadow-glow-primary */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius.lg,
            backgroundColor: palette.primary.main,
          },
          Platform.OS === "web" && ({ boxShadow: shadows.glow.css } as any),
          Platform.OS === "ios" && shadows.glow.ios,
          glowOpacity,
        ]}
      />

      {/* Pressable area avec background animé */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.periodChipInner}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.lg },
            backgroundStyle,
          ]}
        />
        <Animated.Text
          style={[
            typography.label.sm,
            {
              fontWeight: "800",
              letterSpacing: 0.6,
            },
            textStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 INDICATOR DOT (avec glow)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuIndicatorDotProps {
  color: string;
  glowColor?: string;
  size?: number;
}

export function NeuIndicatorDot({
  color,
  glowColor,
  size = 8,
}: NeuIndicatorDotProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        glowColor &&
          Platform.OS === "web" &&
          ({
            boxShadow: `0 0 8px ${glowColor}`,
          } as any),
        glowColor &&
          Platform.OS === "ios" && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
          },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NeuPalette.background.main,
  },

  metricCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  quickAction: {
    flex: 1,
    aspectRatio: 1,
  },
  quickActionInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: NeuRadius.xl,
    padding: NeuSpacing.md,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: NeuRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  topLotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: NeuSpacing.md,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: NeuRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  topLotInfo: {
    flex: 1,
  },
  topLotStats: {
    alignItems: "flex-end",
  },

  // ─── Period Chip (Flat ↔ Pressed transition fidèle au design) ──────────────
  periodChipOuter: {
    position: "relative",
    marginRight: NeuSpacing.xs,
  },
  periodChipFlat: {
    backgroundColor: NeuPalette.background.main,
    borderRadius: NeuRadius.md,
  },
  periodChipPressed: {
    backgroundColor: NeuPalette.background.main,
    borderRadius: NeuRadius.md,
    borderWidth: 1,
    borderColor: NeuShadows.pressed.borderColor,
  },
  periodChipInner: {
    paddingVertical: NeuSpacing.sm,
    paddingHorizontal: NeuSpacing.md,
    borderRadius: NeuRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  periodChip: {
    paddingVertical: NeuSpacing.xs,
    paddingHorizontal: NeuSpacing.lg,
    borderRadius: NeuRadius.lg,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// � NEUMORPHIC SEARCH BAR (Pressed/Inset style)
// ═══════════════════════════════════════════════════════════════════════════════

import { TextInput } from "react-native";

interface NeuSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

/**
 * Search bar neumorphique avec effet inset (pressed)
 * Fidèle au design: shadow interne, icône search, placeholder doux
 */
export function NeuSearchBar({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  style,
  onClear,
}: NeuSearchBarProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.background.main,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.md,
          height: 48,
          borderWidth: 1,
          borderColor: shadows.pressed.borderColor,
          gap: spacing.sm,
        },
        Platform.OS === "web" && { boxShadow: shadows.pressed.css as any },
        style,
      ]}
    >
      <AppIcon name="search" size={20} color={palette.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.text.muted}
        style={{
          flex: 1,
          color: palette.text.primary,
          fontSize: 14,
          fontWeight: "500",
        }}
      />
      {value.length > 0 && onClear && (
        <Pressable onPress={onClear} hitSlop={8}>
          <AppIcon name="close" size={18} color={palette.text.muted} />
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 NEUMORPHIC PROGRESS BAR (Sunken track avec fill)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Progress bar neumorphique avec track enfoncé
 * Fidèle au design: shadow interne, progress avec glow
 */
export function NeuProgressBar({
  progress,
  height = 10,
  color,
  showLabel = false,
  style,
}: NeuProgressBarProps) {
  const { palette, shadows, spacing } = useNeuTheme();
  const fillColor = color ?? palette.primary.main;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: spacing.sm },
        style,
      ]}
    >
      <View
        style={[
          {
            flex: 1,
            height,
            borderRadius: height / 2,
            backgroundColor: palette.background.main,
            borderWidth: 1,
            borderColor: shadows.pressed.borderColor,
            overflow: "hidden",
          },
          Platform.OS === "web" && { boxShadow: shadows.pressed.css as any },
        ]}
      >
        <View
          style={{
            width: `${clampedProgress}%`,
            height: "100%",
            backgroundColor: fillColor,
            borderRadius: height / 2,
            ...(Platform.OS === "web" && {
              boxShadow: `0 0 8px ${fillColor}80`,
            }),
          }}
        />
      </View>
      {showLabel && (
        <Text
          style={{
            color: palette.text.muted,
            fontSize: 10,
            fontWeight: "600",
            minWidth: 40,
          }}
        >
          {Math.round(clampedProgress)}%
        </Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 NEUMORPHIC LIST ITEM (Flat card avec chevron)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: AppIconName;
  leftIconColor?: string;
  rightValue?: string;
  rightValueColor?: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  progress?: number;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * List item neumorphique avec effet flat
 * Fidèle au design: icône pressed, textes hiérarchiques, chevron
 */
export function NeuListItem({
  title,
  subtitle,
  leftIcon,
  leftIconColor,
  rightValue,
  rightValueColor,
  badge,
  badgeColor,
  onPress,
  progress,
  showChevron = true,
  style,
}: NeuListItemProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();
  const scale = useSharedValue(1);

  // Utiliser les valeurs dynamiques ou les fallbacks
  const iconColor = leftIconColor ?? palette.primary.main;
  const valueColor = rightValueColor ?? palette.text.primary;
  const badgeColorFinal = badgeColor ?? palette.primary.main;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_SNAPPY);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const content = (
    <View
      style={[
        {
          backgroundColor: palette.background.main,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.sm,
        },
        Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
        Platform.OS === "ios" && shadows.flat.ios,
        Platform.OS === "android" && { elevation: shadows.flat.android },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        {/* Left Icon (Pressed style) */}
        {leftIcon && (
          <View
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.background.main,
                borderWidth: 1,
                borderColor: shadows.pressed.borderColor,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            <AppIcon name={leftIcon} size={22} color={iconColor} />
          </View>
        )}

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 15,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 12,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={{ alignItems: "flex-end" }}>
          {badge && (
            <View
              style={{
                backgroundColor: `${badgeColorFinal}20`,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <Text
                style={{
                  color: badgeColorFinal,
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {badge}
              </Text>
            </View>
          )}
          {rightValue && (
            <Text
              style={{
                color: valueColor,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              {rightValue}
            </Text>
          )}
          {showChevron && !badge && !rightValue && (
            <AppIcon
              name="chevron-right"
              size={20}
              color={palette.text.muted}
            />
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {progress !== undefined && (
        <NeuProgressBar progress={progress} height={8} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 NEUMORPHIC HEADER (Screen header avec navigation)
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: AppIconName;
  onLeftPress?: () => void;
  rightIcon?: AppIconName;
  rightIconColor?: string;
  onRightPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function NeuHeader({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  rightIconColor,
  onRightPress,
  style,
}: NeuHeaderProps) {
  const { palette, spacing } = useNeuTheme();
  const iconColor = rightIconColor ?? palette.text.secondary;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      {/* Left Button */}
      {leftIcon ? (
        <Pressable onPress={onLeftPress}>
          <NeuIcon icon={leftIcon} size={20} />
        </Pressable>
      ) : (
        <View style={{ width: 44 }} />
      )}

      {/* Title */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text
          style={{
            color: palette.text.primary,
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: palette.text.muted,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Button */}
      {rightIcon ? (
        <Pressable onPress={onRightPress}>
          <NeuIcon icon={rightIcon} color={iconColor} size={20} />
        </Pressable>
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ NEUMORPHIC STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuBadgeProps {
  label: string;
  color?: string;
  variant?: "filled" | "subtle";
  style?: StyleProp<ViewStyle>;
}

export function NeuBadge({
  label,
  color,
  variant = "subtle",
  style,
}: NeuBadgeProps) {
  const { palette } = useNeuTheme();
  const badgeColor = color ?? palette.primary.main;
  const isFilled = variant === "filled";

  return (
    <View
      style={[
        {
          backgroundColor: isFilled ? badgeColor : `${badgeColor}20`,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 99,
        },
        isFilled &&
          Platform.OS === "web" && { boxShadow: `0 0 10px ${badgeColor}50` },
        style,
      ]}
    >
      <Text
        style={{
          color: isFilled ? palette.text.white : badgeColor,
          fontSize: 10,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 NEUMORPHIC STAT GRID (3-column stats)
// ═══════════════════════════════════════════════════════════════════════════════

interface StatItem {
  icon?: AppIconName;
  iconColor?: string;
  value: string;
  label: string;
  valueColor?: string;
}

interface NeuStatGridProps {
  items: StatItem[];
  style?: StyleProp<ViewStyle>;
}

export function NeuStatGrid({ items, style }: NeuStatGridProps) {
  const { palette, shadows, spacing, radius } = useNeuTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            {
              flex: 1,
              backgroundColor: palette.background.main,
              borderRadius: radius.xl,
              padding: spacing.md,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 80,
            },
            Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
            Platform.OS === "ios" && shadows.flat.ios,
            Platform.OS === "android" && { elevation: shadows.flat.android },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            {item.icon && (
              <AppIcon
                name={item.icon}
                size={14}
                color={item.iconColor || palette.primary.main}
              />
            )}
            <Text
              style={{
                color: item.valueColor || palette.text.primary,
                fontSize: 18,
                fontWeight: "800",
              }}
            >
              {item.value}
            </Text>
          </View>
          <Text
            style={{
              color: palette.text.muted,
              fontSize: 9,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// �📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NeuPalette, NeuRadius, NeuShadows, NeuSpacing, NeuTypography };
