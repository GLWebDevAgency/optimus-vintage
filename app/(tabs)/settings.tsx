/**
 * ⚙️ SETTINGS SCREEN - Ultra Premium Edition
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { Card, SectionHeader } from "@/components/ui/Components";
import { PremiumScreen, usePremiumTheme } from "@/components/ui/PremiumUI";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Typography } from "@/constants/Theme";
import { useSettingsStore } from "@/store/settings";
import { useTrackScreen } from "@/utils/analytics";
import { exportDataToCSV } from "@/utils/data/export";
import { Haptic } from "@/utils/haptics";
import {
    SUPPORTED_LOCALES,
    useLocale,
    type SupportedLocale,
} from "@/utils/i18n";
import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Settings Row Component
function SettingsRow({
  label,
  description,
  value,
  onChangeText,
  onBlur,
  keyboardType = "default",
  maxLength,
  isLast = false,
}: {
  label: string;
  description: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  keyboardType?: "default" | "numeric";
  maxLength?: number;
  isLast?: boolean;
}) {
  const theme = usePremiumTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.border },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View style={styles.rowLabel}>
        <Text
          style={[
            Typography.body.md,
            { color: theme.text, fontFamily: "Manrope_600SemiBold" },
          ]}
        >
          {label}
        </Text>
        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
          {description}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceCard,
            color: theme.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholderTextColor={theme.textMuted}
      />
    </View>
  );
}

// Language Selector Row Component
function LanguageRow({
  currentLocale,
  onChangeLocale,
  isLast = false,
}: {
  currentLocale: SupportedLocale;
  onChangeLocale: (locale: SupportedLocale) => void;
  isLast?: boolean;
}) {
  const theme = usePremiumTheme();
  const currentLanguage = SUPPORTED_LOCALES.find(
    (l) => l.code === currentLocale,
  );

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.border },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View style={styles.rowLabel}>
        <Text
          style={[
            Typography.body.md,
            { color: theme.text, fontFamily: "Manrope_600SemiBold" },
          ]}
        >
          Langue
        </Text>
        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
          Changer la langue de l'app
        </Text>
      </View>
      <View style={styles.languageButtons}>
        {SUPPORTED_LOCALES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => {
              Haptic.selection();
              onChangeLocale(lang.code);
            }}
            style={({ pressed }) => [
              styles.langButton,
              {
                backgroundColor:
                  lang.code === currentLocale
                    ? theme.primary
                    : theme.surfaceCard,
                borderColor:
                  lang.code === currentLocale ? theme.primary : theme.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                boxShadow:
                  lang.code === currentLocale
                    ? `0 4px 12px ${theme.primary}40`
                    : "0 2px 6px rgba(0,0,0,0.04)",
              },
            ]}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text
              style={[
                Typography.label.xs,
                {
                  color:
                    lang.code === currentLocale ? "#FFFFFF" : theme.textMuted,
                },
              ]}
            >
              {lang.code.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Action Row Component
function ActionRow({
  icon,
  label,
  onPress,
  variant = "default",
  disabled = false,
  isLast = false,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  isLast?: boolean;
}) {
  const theme = usePremiumTheme();
  const isDanger = variant === "danger";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        {
          borderBottomColor: theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          backgroundColor: pressed ? `${theme.surface}80` : "transparent",
        },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={() => {
        Haptic.selection();
        onPress();
      }}
      disabled={disabled}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: isDanger ? theme.dangerSubtle : theme.surfaceCard,
            boxShadow: isDanger
              ? `0 4px 12px ${theme.danger}20`
              : "0 2px 8px rgba(0,0,0,0.06)",
          },
        ]}
      >
        <AppIcon
          name={icon}
          size={20}
          color={isDanger ? theme.danger : theme.text}
        />
      </View>
      <Text
        style={[
          Typography.body.md,
          {
            color: isDanger ? theme.danger : theme.text,
            fontFamily: "Manrope_600SemiBold",
            flex: 1,
          },
        ]}
      >
        {label}
      </Text>
      <AppIcon name="chevron-right" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = usePremiumTheme();

  // Screen tracking
  useTrackScreen("settings");

  // i18n
  const { t, locale, changeLocale } = useLocale();

  const {
    currency,
    setCurrency,
    targetMargin,
    setTargetMargin,
    resetOnboarding,
  } = useSettingsStore();

  const [currencyInput, setCurrencyInput] = React.useState(currency);
  const [marginInput, setMarginInput] = React.useState(String(targetMargin));
  const [exporting, setExporting] = React.useState(false);

  const handleSave = () => {
    setCurrency(currencyInput);
    setTargetMargin(Number(marginInput) || 0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDataToCSV();
    } catch (e) {
      Alert.alert("Erreur", "L'export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Réinitialiser l'app ?",
      "Cela effacera les préférences locales et relancera l'onboarding.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", style: "destructive", onPress: resetOnboarding },
      ],
    );
  };

  const colorScheme = useColorScheme() ?? "light";

  return (
    <PremiumScreen>
      {/* Floating Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <Text style={[Typography.display.sm, { color: theme.text }]}>
            Réglages
          </Text>
          <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
            Préférences & Données
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={{ marginBottom: Spacing.md }}>
            <SectionHeader
              icon={<AppIcon name="tune" size={20} color={theme.primary} />}
              title="Préférences"
            />
          </View>
          <Card style={styles.section}>
            <SettingsRow
              label="Devise"
              description="Symbole utilisé pour les prix"
              value={currencyInput}
              onChangeText={setCurrencyInput}
              onBlur={handleSave}
              maxLength={3}
            />
            <SettingsRow
              label="Marge cible"
              description="Objectif de profit par article"
              value={marginInput}
              onChangeText={setMarginInput}
              onBlur={handleSave}
              keyboardType="numeric"
            />
            <LanguageRow
              currentLocale={locale}
              onChangeLocale={changeLocale}
              isLast
            />
          </Card>
        </Animated.View>

        {/* Data Management Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View
            style={{
              marginBottom: Spacing.md,
              marginTop: Spacing.lg,
            }}
          >
            <SectionHeader
              icon={<AppIcon name="storage" size={20} color={theme.primary} />}
              title="Gestion des données"
            />
          </View>
          <Card style={styles.section}>
            <ActionRow
              icon="download"
              label={
                exporting ? "Export en cours..." : "Exporter les données (CSV)"
              }
              onPress={handleExport}
              disabled={exporting}
            />
            <ActionRow
              icon="refresh"
              label="Réinitialiser l'onboarding"
              onPress={handleReset}
              variant="danger"
              isLast
            />
          </Card>
        </Animated.View>

        {/* App Info Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card variant="elevated" style={styles.infoCard}>
            <View
              style={[
                styles.infoGradient,
                { backgroundColor: theme.surfaceCard },
              ]}
            >
              <View
                style={[styles.appIcon, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.appIconText}>✨</Text>
              </View>
              <Text style={[Typography.heading.md, { color: theme.text }]}>
                Optimus Vintage
              </Text>
              <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                Version 1.0.0
              </Text>
              <Text
                style={[
                  Typography.body.xs,
                  {
                    color: theme.textMuted,
                    marginTop: Spacing.md,
                    textAlign: "center",
                  },
                ]}
              >
                Gestion d'inventaire vintage premium{"\n"}pour le revendeur
                moderne
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    gap: Spacing.xxs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  section: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  rowLabel: {
    flex: 1,
    gap: Spacing.xxs,
  },
  input: {
    textAlign: "right",
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    minWidth: 110,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    // Premium neumorphic inset effect
    boxShadow: `
      inset 0 2px 6px rgba(0,0,0,0.05),
      inset 0 1px 2px rgba(0,0,0,0.03),
      0 1px 0 rgba(255,255,255,0.5)
    `,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    // Premium convex shadow with glow
    boxShadow: `
      0 4px 12px rgba(0,0,0,0.08),
      0 2px 4px rgba(0,0,0,0.04),
      inset 0 1px 0 rgba(255,255,255,0.3)
    `,
  },
  infoCard: {
    overflow: "hidden",
    padding: 0,
    marginTop: Spacing.lg,
  },
  infoGradient: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius["2xl"],
    borderCurve: "continuous",
  },
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderCurve: "continuous",
    // Ultra premium multi-layer shadow with glow
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.15),
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 12px 32px rgba(16, 185, 129, 0.25),
      0 24px 48px rgba(16, 185, 129, 0.15),
      0 0 0 4px rgba(255, 255, 255, 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.2)
    `,
  },
  appIconText: {
    fontSize: 40,
    fontWeight: "900",
  },
  languageButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderCurve: "continuous",
    minHeight: 44,
  },
  langFlag: {
    fontSize: 20,
  },
});
