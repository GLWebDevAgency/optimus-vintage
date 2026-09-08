/**
 * ⚙️ SETTINGS SCREEN — Vanta Sanctuary
 * "Configuration as an obsidian control panel"
 *
 * Priorities:
 * - Vanta tokens only (no per-screen hex)
 * - Premium UI primitives (VantaScreen + PremiumCard)
 * - WCAG 2.2: labels, roles, target sizes, reduce motion
 */

import appConfig from "@/app.json";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
    PremiumCard,
    PremiumHeader,
    VantaScreen,
    useVantaTheme,
    type VantaTheme,
} from "@/components/ui/PremiumUI";
import { Radius, Spacing } from "@/constants/Theme";
import { THEME_MODE_OPTIONS, useSettingsStore } from "@/store/settings";
import { useSubscriptionStore } from "@/store/subscription";
import { useAccessibility } from "@/utils/accessibility";
import { useTrackScreen } from "@/utils/analytics";
import { exportDataToCSV } from "@/utils/data/export";
import { Haptic } from "@/utils/haptics";
import { SUPPORTED_LOCALES, useLocale } from "@/utils/i18n";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
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

const SPRING_CONFIG = { damping: 20, stiffness: 300 };

type CurrencyOption = {
  code: string;
  symbol: string;
  nameKey: string;
  flag: string;
};

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "EUR", symbol: "€", nameKey: "settings.currencies.euro", flag: "🇪🇺" },
  {
    code: "USD",
    symbol: "$",
    nameKey: "settings.currencies.usDollar",
    flag: "🇺🇸",
  },
  {
    code: "GBP",
    symbol: "£",
    nameKey: "settings.currencies.britishPound",
    flag: "🇬🇧",
  },
  {
    code: "CHF",
    symbol: "Fr",
    nameKey: "settings.currencies.swissFranc",
    flag: "🇨🇭",
  },
  {
    code: "CAD",
    symbol: "C$",
    nameKey: "settings.currencies.canadianDollar",
    flag: "🇨🇦",
  },
  {
    code: "JPY",
    symbol: "¥",
    nameKey: "settings.currencies.japaneseYen",
    flag: "🇯🇵",
  },
  {
    code: "AUD",
    symbol: "A$",
    nameKey: "settings.currencies.australianDollar",
    flag: "🇦🇺",
  },
];

function getEnter(isReduceMotionEnabled: boolean, delayMs: number) {
  return isReduceMotionEnabled
    ? undefined
    : FadeInDown.delay(delayMs).duration(420);
}

function SectionHeader({ title, theme }: { title: string; theme: VantaTheme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
      {title}
    </Text>
  );
}

function RowIcon({ icon, theme }: { icon: AppIconName; theme: VantaTheme }) {
  return (
    <View
      style={[
        styles.iconBox,
        { backgroundColor: theme.surfaceHighlight, borderColor: theme.border },
      ]}
    >
      <AppIcon name={icon} size={20} color={theme.textMuted} />
    </View>
  );
}

type VantaRowProps = {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  theme: VantaTheme;
  isReduceMotionEnabled: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

function VantaRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  theme,
  isReduceMotionEnabled,
  accessibilityLabel,
  accessibilityHint,
}: VantaRowProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!onPress || isReduceMotionEnabled) return;
    scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [isReduceMotionEnabled, onPress]);

  const handlePressOut = useCallback(() => {
    if (isReduceMotionEnabled) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [isReduceMotionEnabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (!onPress) return;
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? accessibilityLabel : undefined}
      accessibilityHint={onPress ? accessibilityHint : undefined}
    >
      <Animated.View style={animatedStyle}>
        <PremiumCard padding="none" style={styles.card}>
          <View style={styles.row}>
            <RowIcon icon={icon} theme={theme} />

            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                {label}
              </Text>
              {sublabel ? (
                <Text style={[styles.rowSublabel, { color: theme.textMuted }]}>
                  {sublabel}
                </Text>
              ) : null}
            </View>

            {value ? <View style={styles.rowValue}>{value}</View> : null}

            {onPress ? (
              <AppIcon name="chevron-right" size={18} color={theme.textMuted} />
            ) : null}
          </View>
        </PremiumCard>
      </Animated.View>
    </Pressable>
  );
}

type VantaToggleRowProps = {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  theme: VantaTheme;
  isReduceMotionEnabled: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

function VantaToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  theme,
  isReduceMotionEnabled,
  accessibilityLabel,
  accessibilityHint,
}: VantaToggleRowProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (isReduceMotionEnabled) return;
    scale.value = withSpring(0.99, SPRING_CONFIG);
  }, [isReduceMotionEnabled]);

  const handlePressOut = useCallback(() => {
    if (isReduceMotionEnabled) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [isReduceMotionEnabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptic.selection();
        onValueChange(!value);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={animatedStyle}>
        <PremiumCard padding="none" style={styles.card}>
          <View style={styles.row}>
            <RowIcon icon={icon} theme={theme} />

            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                {label}
              </Text>
              {sublabel ? (
                <Text style={[styles.rowSublabel, { color: theme.textMuted }]}>
                  {sublabel}
                </Text>
              ) : null}
            </View>

            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{
                false: theme.surfaceHighlight,
                true: theme.primary,
              }}
              thumbColor={
                Platform.OS === "android" ? theme.textOnAccent : undefined
              }
              ios_backgroundColor={theme.surfaceHighlight}
              style={styles.switch}
              pointerEvents="none"
              accessible={false}
            />
          </View>
        </PremiumCard>
      </Animated.View>
    </Pressable>
  );
}

type VantaStepperRowProps = {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  theme: VantaTheme;
  accessibilityLabel: string;
};

function VantaStepperRow({
  icon,
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 500,
  step = 5,
  suffix = "",
  theme,
  accessibilityLabel,
}: VantaStepperRowProps) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const clamp = useCallback(
    (n: number) => Math.max(min, Math.min(max, n)),
    [max, min],
  );

  const apply = useCallback(
    (n: number) => {
      const clamped = clamp(n);
      onChange(clamped);
      setInputValue(String(clamped));
    },
    [clamp, onChange],
  );

  return (
    <PremiumCard padding="none" style={styles.card}>
      <View style={styles.row}>
        <RowIcon icon={icon} theme={theme} />

        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
          {sublabel ? (
            <Text style={[styles.rowSublabel, { color: theme.textMuted }]}>
              {sublabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.stepper}>
          <Pressable
            onPress={() => {
              Haptic.impactLight();
              apply(value - step);
            }}
            disabled={value <= min}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: -${step}`}
            accessibilityState={{ disabled: value <= min }}
            style={[
              styles.stepButton,
              {
                backgroundColor: theme.surfaceHighlight,
                borderColor: theme.border,
                opacity: value <= min ? 0.4 : 1,
              },
            ]}
          >
            <AppIcon name="remove" size={18} color={theme.primary} />
          </Pressable>

          <View
            style={[
              styles.stepperValue,
              {
                backgroundColor: theme.surfaceHighlight,
                borderColor: theme.borderGold,
              },
            ]}
          >
            <TextInput
              value={inputValue}
              onChangeText={(text) =>
                setInputValue(text.replace(/[^0-9]/g, ""))
              }
              onBlur={() => {
                const num = parseInt(inputValue, 10);
                Haptic.impactLight();
                apply(Number.isFinite(num) ? num : min);
              }}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              accessibilityLabel={accessibilityLabel}
              style={[styles.stepperInput, { color: theme.primary }]}
            />
            {suffix ? (
              <Text style={[styles.stepperSuffix, { color: theme.textMuted }]}>
                {suffix}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              Haptic.impactLight();
              apply(value + step);
            }}
            disabled={value >= max}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: +${step}`}
            accessibilityState={{ disabled: value >= max }}
            style={[
              styles.stepButton,
              {
                backgroundColor: theme.surfaceHighlight,
                borderColor: theme.border,
                opacity: value >= max ? 0.4 : 1,
              },
            ]}
          >
            <AppIcon name="add" size={18} color={theme.primary} />
          </Pressable>
        </View>
      </View>
    </PremiumCard>
  );
}

function AetherBadge({ text, theme }: { text: string; theme: VantaTheme }) {
  return (
    <View
      style={[
        styles.badge,
        { borderColor: theme.borderGold, backgroundColor: "transparent" },
      ]}
    >
      <Text style={[styles.badgeText, { color: theme.primary }]}>{text}</Text>
    </View>
  );
}

function IdentityNode({
  theme,
  appName,
  version,
}: {
  theme: VantaTheme;
  appName: string;
  version: string;
}) {
  const { t } = useLocale();
  return (
    <PremiumCard padding="lg" style={styles.identityCard}>
      <View style={styles.identityHeader}>
        <View
          style={[
            styles.identityAvatar,
            { backgroundColor: theme.primary, borderColor: theme.borderGold },
          ]}
          accessibilityRole="image"
          accessibilityLabel={appName}
        >
          <Text style={styles.identityAvatarEmoji}>✦</Text>
        </View>

        <View style={styles.identityText}>
          <Text style={[styles.identityLabel, { color: theme.primary }]}>
            {t("settings.identityNode")}
          </Text>
          <Text style={[styles.identityTitle, { color: theme.text }]}>
            {appName}
          </Text>
          <Text style={[styles.identityMeta, { color: theme.textMuted }]}>
            {version}
          </Text>
        </View>

        <View
          style={styles.identityBars}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {[0.8, 0.6, 1, 0.4].map((h, i) => (
            <View
              key={i}
              style={[
                styles.identityBar,
                {
                  height: 24 * h,
                  backgroundColor: i === 2 ? theme.primary : theme.textMuted,
                  opacity: i === 2 ? 1 : 0.35,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.identityStatus}>
        <Text style={[styles.identityStatusLabel, { color: theme.textMuted }]}>
          {t("settings.currentStatus")}
        </Text>
        <AetherBadge text={t("settings.aetherTier")} theme={theme} />
      </View>
    </PremiumCard>
  );
}

type ActionButtonProps = {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger" | "gold";
  loading?: boolean;
  theme: VantaTheme;
  isReduceMotionEnabled: boolean;
  accessibilityLabel: string;
};

function ActionButton({
  icon,
  label,
  onPress,
  variant = "default",
  loading = false,
  theme,
  isReduceMotionEnabled,
  accessibilityLabel,
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (isReduceMotionEnabled) return;
    scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [isReduceMotionEnabled]);

  const handlePressOut = useCallback(() => {
    if (isReduceMotionEnabled) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [isReduceMotionEnabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isGold = variant === "gold";
  const isDanger = variant === "danger";
  const borderColor = isDanger
    ? theme.danger
    : isGold
      ? theme.primary
      : theme.border;
  const textColor = isDanger
    ? theme.danger
    : isGold
      ? theme.primary
      : theme.text;

  return (
    <Pressable
      onPress={() => {
        if (loading) return;
        Haptic.impactLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: loading }}
      style={{ marginBottom: Spacing.sm }}
    >
      <Animated.View
        style={[
          styles.actionButton,
          { borderColor, opacity: loading ? 0.6 : 1 },
          animatedStyle,
        ]}
      >
        <View style={styles.actionLeft}>
          <AppIcon name={icon} size={18} color={textColor} />
          <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
        </View>
        <AppIcon name="arrow-forward" size={18} color={textColor} />
      </Animated.View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const { isReduceMotionEnabled } = useAccessibility();
  const { t, locale, changeLocale } = useLocale();

  useTrackScreen("settings");

  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const targetMargin = useSettingsStore((s) => s.targetMargin);
  const setTargetMargin = useSettingsStore((s) => s.setTargetMargin);
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  const [exporting, setExporting] = useState(false);

  const currentLang = useMemo(
    () =>
      SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0],
    [locale],
  );

  const currentCurrency = useMemo(
    () =>
      SUPPORTED_CURRENCIES.find((c) => c.code === currency) ??
      SUPPORTED_CURRENCIES[0],
    [currency],
  );

  const currentTheme = useMemo(
    () =>
      THEME_MODE_OPTIONS.find((o) => o.key === themeMode) ??
      THEME_MODE_OPTIONS[0],
    [themeMode],
  );

  const showLanguagePicker = useCallback(() => {
    const cancelLabel = t("common.cancel");
    if (Platform.OS === "ios") {
      const options = [
        ...SUPPORTED_LOCALES.map((l) => `${l.flag}  ${l.nativeName}`),
        cancelLabel,
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: t("settings.language").toUpperCase(),
        },
        (idx) => {
          if (idx < SUPPORTED_LOCALES.length) {
            Haptic.impactLight();
            changeLocale(SUPPORTED_LOCALES[idx].code);
          }
        },
      );
      return;
    }

    Alert.alert(t("settings.language"), undefined, [
      ...SUPPORTED_LOCALES.map((l) => ({
        text: `${l.flag} ${l.nativeName}`,
        onPress: () => changeLocale(l.code),
      })),
      { text: cancelLabel, style: "cancel" },
    ]);
  }, [changeLocale, t]);

  const showCurrencyPicker = useCallback(() => {
    const cancelLabel = t("common.cancel");
    if (Platform.OS === "ios") {
      const options = [
        ...SUPPORTED_CURRENCIES.map(
          (c) => `${c.flag}  ${c.symbol}  ${t(c.nameKey)}`,
        ),
        cancelLabel,
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: t("settings.currency").toUpperCase(),
        },
        (idx) => {
          if (idx < SUPPORTED_CURRENCIES.length) {
            Haptic.impactLight();
            setCurrency(SUPPORTED_CURRENCIES[idx].code);
          }
        },
      );
      return;
    }

    Alert.alert(t("settings.currency"), undefined, [
      ...SUPPORTED_CURRENCIES.map((c) => ({
        text: `${c.flag} ${c.symbol} ${t(c.nameKey)}`,
        onPress: () => setCurrency(c.code),
      })),
      { text: cancelLabel, style: "cancel" },
    ]);
  }, [setCurrency, t]);

  const showThemePicker = useCallback(() => {
    const cancelLabel = t("common.cancel");
    const themeLabels: Record<string, string> = {
      system: t("settings.themes.system"),
      light: t("settings.themes.light"),
      dark: t("settings.themes.dark"),
    };
    const getThemeLabel = (key: string) => themeLabels[key] || key;
    if (Platform.OS === "ios") {
      const options = [
        ...THEME_MODE_OPTIONS.map((o) => getThemeLabel(o.key)),
        cancelLabel,
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: t("settings.theme").toUpperCase(),
        },
        (idx) => {
          if (idx < THEME_MODE_OPTIONS.length) {
            Haptic.impactLight();
            setThemeMode(THEME_MODE_OPTIONS[idx].key);
          }
        },
      );
      return;
    }

    Alert.alert(t("settings.theme"), undefined, [
      ...THEME_MODE_OPTIONS.map((o) => ({
        text: getThemeLabel(o.key),
        onPress: () => setThemeMode(o.key),
      })),
      { text: cancelLabel, style: "cancel" },
    ]);
  }, [setThemeMode, t]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportDataToCSV();
      Haptic.success();
      Alert.alert(t("common.success"), t("settings.exportSuccess"));
    } catch {
      Haptic.error();
      Alert.alert(t("common.error"), t("settings.exportError"));
    } finally {
      setExporting(false);
    }
  }, [t]);

  const handleReset = useCallback(() => {
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
  }, [resetOnboarding, t]);

  const themeIcon: AppIconName =
    themeMode === "dark"
      ? "dark-mode"
      : themeMode === "light"
        ? "light-mode"
        : "smartphone";

  const version = String(appConfig?.expo?.version ?? "1.0.0");

  return (
    <VantaScreen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.sm,
            paddingBottom: insets.bottom + Spacing["6xl"],
          },
        ]}
      >
        <View style={styles.header}>
          <PremiumHeader
            title={t("settings.title")}
            subtitle={t("settings.subtitle")}
            style={{ paddingHorizontal: 0 }}
          />
        </View>

        <View>
          <Animated.View entering={getEnter(isReduceMotionEnabled, 80)}>
            <IdentityNode
              theme={theme}
              appName="Optimus Vintage"
              version={`VER: ${version}`}
            />
          </Animated.View>

          {/* Subscription / Customer Center */}
          <Animated.View entering={getEnter(isReduceMotionEnabled, 110)}>
            <SectionHeader
              title={t("settings.subscription").toUpperCase()}
              theme={theme}
            />

            <VantaRow
              icon="verified"
              label={t("settings.manageSub").toUpperCase()}
              sublabel={t("settings.manageSubDescription")}
              value={
                <Text style={[styles.valueAccent, { color: theme.primary }]}>
                  {useSubscriptionStore.getState().isPro ? "PRO" : "FREE"}
                </Text>
              }
              onPress={() => {
                useSubscriptionStore.getState().presentCustomerCenter();
              }}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={t("settings.manageSub")}
              accessibilityHint={t("settings.manageSubDescription")}
            />

            <VantaRow
              icon="auto-awesome"
              label={t("settings.upgrade").toUpperCase()}
              sublabel={t("settings.upgradeDescription")}
              onPress={() => {
                useSubscriptionStore.getState().presentPaywall();
              }}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={t("settings.upgrade")}
            />
          </Animated.View>

          <Animated.View entering={getEnter(isReduceMotionEnabled, 140)}>
            <SectionHeader
              title={t("settings.appearance").toUpperCase()}
              theme={theme}
            />

            <VantaRow
              icon={themeIcon}
              label={t("settings.theme").toUpperCase()}
              sublabel={currentTheme.description}
              value={
                <Text style={[styles.valueAccent, { color: theme.primary }]}>
                  {currentTheme.label.toUpperCase()}
                </Text>
              }
              onPress={showThemePicker}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={`${t("settings.theme")}: ${currentTheme.label}`}
              accessibilityHint={t("common.edit")}
            />

            <VantaRow
              icon="language"
              label={t("settings.language").toUpperCase()}
              sublabel={t("settings.languageDescription")}
              value={
                <View style={styles.valueInline}>
                  <Text style={styles.flag}>{currentLang.flag}</Text>
                  <Text style={[styles.valueMuted, { color: theme.textMuted }]}>
                    {currentLang.nativeName}
                  </Text>
                </View>
              }
              onPress={showLanguagePicker}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={`${t("settings.language")}: ${currentLang.nativeName}`}
              accessibilityHint={t("common.edit")}
            />
          </Animated.View>

          <Animated.View entering={getEnter(isReduceMotionEnabled, 200)}>
            <SectionHeader
              title={t("settings.preferences").toUpperCase()}
              theme={theme}
            />

            <VantaRow
              icon="currency-exchange"
              label={t("settings.currency").toUpperCase()}
              sublabel={t("settings.currencyDescription")}
              value={
                <View style={styles.valueInline}>
                  <Text style={styles.flag}>{currentCurrency.flag}</Text>
                  <View
                    style={[
                      styles.currencyPill,
                      {
                        backgroundColor: theme.primaryMuted,
                        borderColor: theme.borderGold,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.currencySymbol, { color: theme.primary }]}
                    >
                      {currentCurrency.symbol}
                    </Text>
                  </View>
                </View>
              }
              onPress={showCurrencyPicker}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={`${t("settings.currency")}: ${currentCurrency.code}`}
              accessibilityHint={t("common.edit")}
            />

            <VantaStepperRow
              icon="trending-up"
              label={t("settings.targetMargin").toUpperCase()}
              sublabel={t("settings.targetMarginDescription")}
              value={targetMargin}
              onChange={setTargetMargin}
              min={0}
              max={500}
              step={5}
              suffix={currentCurrency.symbol}
              theme={theme}
              accessibilityLabel={t("settings.targetMargin")}
            />

            <VantaToggleRow
              icon="vibration"
              label={t("settings.haptics").toUpperCase()}
              sublabel={t("settings.hapticsDescription")}
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={t("settings.haptics")}
            />
          </Animated.View>

          <Animated.View entering={getEnter(isReduceMotionEnabled, 260)}>
            <SectionHeader
              title={t("settings.dataManagement").toUpperCase()}
              theme={theme}
            />

            <FeatureGate feature="csvExport">
              <ActionButton
                icon="download"
                label={
                  exporting ? t("settings.exporting") : t("settings.exportData")
                }
                onPress={handleExport}
                loading={exporting}
                variant="gold"
                theme={theme}
                isReduceMotionEnabled={isReduceMotionEnabled}
                accessibilityLabel={t("settings.exportData")}
              />
            </FeatureGate>

            <ActionButton
              icon="refresh"
              label={t("settings.resetOnboarding")}
              onPress={handleReset}
              variant="danger"
              theme={theme}
              isReduceMotionEnabled={isReduceMotionEnabled}
              accessibilityLabel={t("settings.resetOnboarding")}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </VantaScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingBottom: Spacing.sm,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },

  card: {
    marginBottom: Spacing.sm,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  rowText: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
  },

  rowSublabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.4,
  },

  rowValue: {
    marginRight: Spacing.xs,
  },

  valueAccent: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  valueInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  flag: {
    fontSize: 16,
  },

  valueMuted: {
    fontSize: 13,
    fontWeight: "600",
  },

  currencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  currencySymbol: {
    fontSize: 14,
    fontWeight: "800",
  },

  switch: {
    transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  stepButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stepperValue: {
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
    gap: 4,
  },

  stepperInput: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    minWidth: 28,
    padding: 0,
  },

  stepperSuffix: {
    fontSize: 12,
    fontWeight: "600",
  },

  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  identityCard: {
    marginBottom: Spacing.sm,
  },

  identityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },

  identityAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  identityAvatarEmoji: {
    fontSize: 28,
    fontWeight: "900",
  },

  identityText: {
    flex: 1,
  },

  identityLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  identityTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },

  identityMeta: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },

  identityBars: {
    gap: 4,
  },

  identityBar: {
    width: 4,
    borderRadius: 2,
  },

  identityStatus: {
    marginTop: Spacing.lg,
    alignItems: "center",
    gap: 8,
  },

  identityStatusLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    backgroundColor: "transparent",
  },

  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  actionText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
