/**
 * ⚙️ SETTINGS SCREEN - Ultra Premium Edition
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { Card, SectionHeader } from "@/components/ui/Components";
import {
    PremiumScreen,
    usePremiumTheme
} from "@/components/ui/PremiumUI";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Typography } from "@/constants/Theme";
import { useSettingsStore } from "@/store/settings";
import { exportDataToCSV } from "@/utils/data/export";
import { Haptic } from "@/utils/haptics";
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
          opacity: pressed ? 0.7 : 1,
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
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    minWidth: 100,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: Radius.xl,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  appIconText: {
    fontSize: 32,
  },
});
