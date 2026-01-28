/**
 * ⚙️ SETTINGS SCREEN - Vanta-Aether Sanctuary
 *
 * Design inspiré des maquettes Vanta:
 * - Labels en MAJUSCULES avec letter-spacing
 * - Icônes dans carrés obsidian
 * - Section headers style "ARTIFACT ORCHESTRATION"
 * - Identity Node pour l'app info
 * - Toggle doré pour les options
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Palette, Spacing } from "@/constants/Theme";
import {
    THEME_MODE_OPTIONS,
    useSettingsStore
} from "@/store/settings";
import { useTrackScreen } from "@/utils/analytics";
import { exportDataToCSV } from "@/utils/data/export";
import { Haptic } from "@/utils/haptics";
import {
    SUPPORTED_LOCALES,
    useLocale
} from "@/utils/i18n";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VANTA DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const VANTA = {
  black: "#000000",
  obsidian: "#0a0a0a",
  obsidianLight: "#1a1a1a",
  titanium: "#111111",
  carbon: "#1c1c1c",
  gold: "#f4c025",
  goldSubtle: "rgba(244, 192, 37, 0.15)",
  goldMicro: "rgba(244, 192, 37, 0.08)",
  goldBorder: "rgba(244, 192, 37, 0.3)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.4)",
  textGhost: "rgba(255, 255, 255, 0.2)",
} as const;

const SPRING_CONFIG = { damping: 20, stiffness: 300 };

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 SUPPORTED CURRENCIES
// ═══════════════════════════════════════════════════════════════════════════════

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
];

function getColors(isDark: boolean) {
  return {
    background: isDark ? VANTA.black : Palette.ivory.base,
    surface: isDark ? VANTA.obsidian : Palette.ivory.pearl,
    surfaceRow: isDark ? VANTA.titanium : Palette.ivory.pearl,
    gold: isDark ? VANTA.gold : Palette.metal.champagne,
    goldSubtle: isDark ? VANTA.goldSubtle : `${Palette.metal.champagne}15`,
    goldMicro: isDark ? VANTA.goldMicro : `${Palette.metal.champagne}08`,
    goldBorder: isDark ? VANTA.goldBorder : `${Palette.metal.champagne}30`,
    text: isDark ? VANTA.textPrimary : Palette.neutral.anthracite,
    textSecondary: isDark ? VANTA.textSecondary : Palette.neutral[500],
    textMuted: isDark ? VANTA.textMuted : Palette.neutral[400],
    textGhost: isDark ? VANTA.textGhost : Palette.neutral[300],
    border: isDark
      ? "rgba(255, 255, 255, 0.06)"
      : `${Palette.metal.champagne}15`,
    danger: Palette.semantic.danger,
    dangerSubtle: `${Palette.semantic.danger}15`,
    success: Palette.semantic.success,
    successSubtle: `${Palette.semantic.success}15`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ SECTION HEADER - Style "ARTIFACT ORCHESTRATION"
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 3,
        color: colors.textMuted,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        marginLeft: Spacing.xs,
      }}
    >
      {title}
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌌 OBSIDIAN CARD - Carte avec bordure subtile
// ═══════════════════════════════════════════════════════════════════════════════

function ObsidianCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? VANTA.obsidian : Palette.ivory.pearl,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : `${Palette.metal.champagne}15`,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {/* Top shine */}
      {isDark && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1 }}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.06)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </View>
      )}
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 VANTA ROW - Style maquette avec icône carrée et label majuscule
// ═══════════════════════════════════════════════════════════════════════════════

function VantaRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  showChevron = true,
  colors,
}: {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  colors: ReturnType<typeof getColors>;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptic.impactLight();
          onPress();
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={animatedStyle}>
        <ObsidianCard style={{ marginBottom: Spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing.lg,
              gap: Spacing.md,
            }}
          >
            {/* Icône carrée style maquette */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.surfaceRow,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppIcon name={icon} size={20} color={colors.textGhost} />
            </View>

            {/* Label en majuscules */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  letterSpacing: 1.5,
                  color: colors.text,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </Text>
              {sublabel && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "400",
                    color: colors.textMuted,
                    marginTop: 2,
                    letterSpacing: 0.5,
                  }}
                >
                  {sublabel}
                </Text>
              )}
            </View>

            {/* Value */}
            {value}

            {/* Chevron doré */}
            {showChevron && onPress && (
              <AppIcon
                name="chevron-right"
                size={18}
                color={colors.textGhost}
              />
            )}
          </View>
        </ObsidianCard>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 VANTA TOGGLE ROW - Avec Switch doré
// ═══════════════════════════════════════════════════════════════════════════════

function VantaToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  colors,
}: {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <ObsidianCard style={{ marginBottom: Spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.surfaceRow,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppIcon name={icon} size={20} color={colors.textGhost} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              letterSpacing: 1.5,
              color: colors.text,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "400",
                color: colors.textMuted,
                marginTop: 2,
                letterSpacing: 0.5,
              }}
            >
              {sublabel}
            </Text>
          )}
        </View>

        <Switch
          value={value}
          onValueChange={(val) => {
            Haptic.impactLight();
            onValueChange(val);
          }}
          trackColor={{ false: colors.surfaceRow, true: colors.gold }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.surfaceRow}
        />
      </View>
    </ObsidianCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎚️ STEPPER ROW - Pour la marge en %
// ═══════════════════════════════════════════════════════════════════════════════

function StepperRow({
  icon,
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  suffix = "%",
  colors,
}: {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  colors: ReturnType<typeof getColors>;
}) {
  const [inputValue, setInputValue] = useState(String(value));

  const handleStep = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    Haptic.impactLight();
    onChange(newValue);
    setInputValue(String(newValue));
  };

  const handleInputBlur = () => {
    const num = parseInt(inputValue, 10) || min;
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
    setInputValue(String(clamped));
  };

  return (
    <ObsidianCard style={{ marginBottom: Spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.surfaceRow,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppIcon name={icon} size={20} color={colors.textGhost} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              letterSpacing: 1.5,
              color: colors.text,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "400",
                color: colors.textMuted,
                marginTop: 2,
                letterSpacing: 0.5,
              }}
            >
              {sublabel}
            </Text>
          )}
        </View>

        {/* Stepper controls */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => handleStep(-step)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.surfaceRow,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              opacity: value <= min ? 0.4 : 1,
            }}
            disabled={value <= min}
          >
            <AppIcon name="remove" size={16} color={colors.gold} />
          </Pressable>

          <View
            style={{
              minWidth: 56,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.surfaceRow,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 8,
              borderWidth: 1,
              borderColor: colors.goldBorder,
            }}
          >
            <TextInput
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.gold,
                textAlign: "center",
                minWidth: 24,
                padding: 0,
              }}
              value={inputValue}
              onChangeText={(t) => setInputValue(t.replace(/[^0-9]/g, ""))}
              onBlur={handleInputBlur}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textMuted,
              }}
            >
              {suffix}
            </Text>
          </View>

          <Pressable
            onPress={() => handleStep(step)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.surfaceRow,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              opacity: value >= max ? 0.4 : 1,
            }}
            disabled={value >= max}
          >
            <AppIcon name="add" size={16} color={colors.gold} />
          </Pressable>
        </View>
      </View>
    </ObsidianCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ AETHER BADGE - Style "AETHER TIER IV"
// ═══════════════════════════════════════════════════════════════════════════════

function AetherBadge({
  text,
  colors,
}: {
  text: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.goldBorder,
        backgroundColor: "transparent",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 2,
          color: colors.gold,
          textTransform: "uppercase",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👤 IDENTITY NODE - Style Avatar Card
// ═══════════════════════════════════════════════════════════════════════════════

function IdentityNode({ colors }: { colors: ReturnType<typeof getColors> }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ObsidianCard style={{ padding: Spacing.xl }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: Spacing.lg }}
      >
        {/* App Icon / Avatar */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.gold,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.goldBorder,
          }}
        >
          <Text style={{ fontSize: 32 }}>✨</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 2,
              color: colors.gold,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            IDENTITY NODE
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            Optimus Vintage
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.gold,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.textMuted,
                letterSpacing: 1,
              }}
            >
              VER: 1.0.0
            </Text>
          </View>
        </View>

        {/* Stats bars */}
        <View style={{ gap: 4 }}>
          {[0.8, 0.6, 1, 0.4].map((h, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: 24 * h,
                backgroundColor: i === 2 ? colors.gold : colors.textGhost,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
      </View>

      {/* Status Badge */}
      <View style={{ marginTop: Spacing.lg, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 2,
            color: colors.textMuted,
            marginBottom: 8,
          }}
        >
          CURRENT STATUS
        </Text>
        <AetherBadge text="AETHER PRO" colors={colors} />
      </View>
    </ObsidianCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 ACTION CARD - Style "COMPLETE ACQUISITION"
// ═══════════════════════════════════════════════════════════════════════════════

function ActionButton({
  icon,
  label,
  onPress,
  variant = "default",
  loading = false,
  colors,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger" | "gold";
  loading?: boolean;
  colors: ReturnType<typeof getColors>;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isGold = variant === "gold";
  const isDanger = variant === "danger";

  const borderColor = isDanger
    ? colors.danger
    : isGold
      ? colors.gold
      : colors.border;
  const textColor = isDanger
    ? colors.danger
    : isGold
      ? colors.gold
      : colors.text;

  return (
    <Pressable
      onPress={() => {
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
    >
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: Spacing.lg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: borderColor,
            backgroundColor: "transparent",
            marginBottom: Spacing.sm,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
          }}
        >
          <AppIcon name={icon} size={18} color={textColor} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              letterSpacing: 2,
              color: textColor,
              textTransform: "uppercase",
            }}
          >
            {loading ? `${label}...` : label}
          </Text>
        </View>
        <AppIcon name="arrow-forward" size={18} color={textColor} />
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 MAIN SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);

  useTrackScreen("settings");
  const { t, locale, changeLocale } = useLocale();

  const {
    currency,
    setCurrency,
    targetMargin,
    setTargetMargin,
    resetOnboarding,
    themeMode,
    setThemeMode,
  } = useSettingsStore();

  const [exporting, setExporting] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Helpers
  const currentLang = SUPPORTED_LOCALES.find((l) => l.code === locale);
  const currentCurrency =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
    SUPPORTED_CURRENCIES[0];
  const currentTheme = THEME_MODE_OPTIONS.find((o) => o.key === themeMode);

  const showLanguagePicker = () => {
    if (Platform.OS === "ios") {
      const options = [
        ...SUPPORTED_LOCALES.map((l) => `${l.flag}  ${l.nativeName}`),
        "Cancel",
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: "SELECT LANGUAGE",
        },
        (idx) => {
          if (idx < SUPPORTED_LOCALES.length) {
            Haptic.impactLight();
            changeLocale(SUPPORTED_LOCALES[idx].code);
          }
        },
      );
    } else {
      Alert.alert("Select Language", undefined, [
        ...SUPPORTED_LOCALES.map((l) => ({
          text: `${l.flag} ${l.nativeName}`,
          onPress: () => changeLocale(l.code),
        })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const showCurrencyPicker = () => {
    if (Platform.OS === "ios") {
      const options = [
        ...SUPPORTED_CURRENCIES.map((c) => `${c.flag}  ${c.symbol}  ${c.name}`),
        "Cancel",
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: "SELECT CURRENCY",
        },
        (idx) => {
          if (idx < SUPPORTED_CURRENCIES.length) {
            Haptic.impactLight();
            setCurrency(SUPPORTED_CURRENCIES[idx].code);
          }
        },
      );
    } else {
      Alert.alert("Select Currency", undefined, [
        ...SUPPORTED_CURRENCIES.map((c) => ({
          text: `${c.flag} ${c.symbol} ${c.name}`,
          onPress: () => setCurrency(c.code),
        })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const showThemePicker = () => {
    if (Platform.OS === "ios") {
      const options = [...THEME_MODE_OPTIONS.map((o) => o.label), "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: "SELECT APPEARANCE",
        },
        (idx) => {
          if (idx < THEME_MODE_OPTIONS.length) {
            Haptic.impactLight();
            setThemeMode(THEME_MODE_OPTIONS[idx].key);
          }
        },
      );
    } else {
      Alert.alert("Select Appearance", undefined, [
        ...THEME_MODE_OPTIONS.map((o) => ({
          text: o.label,
          onPress: () => setThemeMode(o.key),
        })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDataToCSV();
      Haptic.success();
      Alert.alert(t("common.success"), "Data exported successfully");
    } catch {
      Haptic.error();
      Alert.alert(t("common.error"), "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(t("settings.resetTitle"), t("settings.resetMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: () => {
          Haptic.warning();
          resetOnboarding();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.md,
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.lg,
        }}
      >
        <Animated.Text
          entering={FadeInDown.duration(400)}
          style={{
            fontSize: 34,
            fontWeight: "800",
            letterSpacing: -0.8,
            color: colors.text,
          }}
        >
          Settings
        </Animated.Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── IDENTITY NODE ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <IdentityNode colors={colors} />
        </Animated.View>

        {/* ─── DISPLAY CONFIGURATION ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <SectionHeader title="DISPLAY CONFIGURATION" colors={colors} />

          <VantaRow
            icon={
              themeMode === "dark"
                ? "dark-mode"
                : themeMode === "light"
                  ? "light-mode"
                  : "smartphone"
            }
            label="APPEARANCE"
            sublabel={currentTheme?.description}
            value={
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.gold,
                  letterSpacing: 1,
                }}
              >
                {currentTheme?.label.toUpperCase()}
              </Text>
            }
            onPress={showThemePicker}
            colors={colors}
          />

          <VantaRow
            icon="language"
            label="LANGUAGE PROTOCOL"
            value={
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 16 }}>{currentLang?.flag}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textMuted,
                  }}
                >
                  {currentLang?.nativeName}
                </Text>
              </View>
            }
            onPress={showLanguagePicker}
            colors={colors}
          />
        </Animated.View>

        {/* ─── FINANCIAL PROTOCOLS ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <SectionHeader title="FINANCIAL PROTOCOLS" colors={colors} />

          <VantaRow
            icon="currency-exchange"
            label="CURRENCY UNIT"
            value={
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 16 }}>{currentCurrency.flag}</Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: colors.goldMicro,
                    borderWidth: 1,
                    borderColor: colors.goldBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: colors.gold,
                    }}
                  >
                    {currentCurrency.symbol}
                  </Text>
                </View>
              </View>
            }
            onPress={showCurrencyPicker}
            colors={colors}
          />

          <StepperRow
            icon="trending-up"
            label="TARGET MARGIN"
            sublabel="Profit percentage per item"
            value={targetMargin}
            onChange={setTargetMargin}
            colors={colors}
          />
        </Animated.View>

        {/* ─── HAPTIC RESONANCE ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <SectionHeader title="SENSORY FEEDBACK" colors={colors} />

          <VantaToggleRow
            icon="settings"
            label="HAPTIC RESONANCE"
            sublabel="Tactile fluidity"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            colors={colors}
          />
        </Animated.View>

        {/* ─── DATA OPERATIONS ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <SectionHeader title="DATA OPERATIONS" colors={colors} />

          <ActionButton
            icon="download"
            label="EXPORT INVENTORY"
            onPress={handleExport}
            loading={exporting}
            variant="gold"
            colors={colors}
          />

          <ActionButton
            icon="refresh"
            label="SYSTEM RESET"
            onPress={handleReset}
            variant="danger"
            colors={colors}
          />
        </Animated.View>

        {/* ─── ENCRYPTED FOOTER ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View
            style={{
              marginTop: Spacing.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <AppIcon name="check-circle" size={12} color={colors.textGhost} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                letterSpacing: 2,
                color: colors.textGhost,
              }}
            >
              AES-256 ENCRYPTED
            </Text>
            <View style={{ flexDirection: "row", gap: 3, marginLeft: 8 }}>
              {[1, 0.6, 1].map((opacity, i) => (
                <View
                  key={i}
                  style={{
                    width: 3,
                    height: 10,
                    backgroundColor: colors.gold,
                    opacity,
                    borderRadius: 1,
                  }}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
