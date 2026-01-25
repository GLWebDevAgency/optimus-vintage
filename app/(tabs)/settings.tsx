/**
 * ⚙️ SETTINGS SCREEN - Neumorphic Dark Edition
 *
 * Design fidèle 100% au mockup de référence
 * Style: Soft UI, Dark Neumorphic, Sections groupées
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { NeuRadius, NeuSpacing } from "@/components/ui/Neumorphic";
import { useNeuTheme, type ThemeMode } from "@/constants/ThemeContext";
import { useSettingsStore } from "@/store/settings";
import { exportDataToCSV } from "@/utils/data/export";
import { Haptic } from "@/utils/haptics";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
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
// 🎛️ SETTINGS ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingsRowProps {
  icon: AppIconName;
  iconColor?: string;
  label: string;
  description?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
  keyboardType?: "default" | "numeric";
  palette: ReturnType<typeof useNeuTheme>["palette"];
  shadows: ReturnType<typeof useNeuTheme>["shadows"];
  rightContent?: React.ReactNode;
}

function SettingsRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onChangeText,
  onPress,
  showChevron = false,
  isDestructive = false,
  keyboardType = "default",
  palette,
  shadows,
  rightContent,
}: SettingsRowProps) {
  const color = iconColor || palette.primary.main;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  };

  const content = (
    <View style={[styles.settingsRow]}>
      {/* Icon */}
      <View
        style={[
          styles.settingsIcon,
          {
            backgroundColor: isDestructive
              ? palette.accent.red + "20"
              : color + "20",
          },
        ]}
      >
        <AppIcon
          name={icon}
          size={20}
          color={isDestructive ? palette.accent.red : color}
        />
      </View>

      {/* Label & Description */}
      <View style={styles.settingsContent}>
        <Text
          style={[
            styles.settingsLabel,
            { color: palette.text.primary },
            isDestructive && { color: palette.accent.red },
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={[styles.settingsDescription, { color: palette.text.muted }]}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Right side */}
      {rightContent ? (
        rightContent
      ) : onChangeText && value !== undefined ? (
        <TextInput
          style={[
            styles.settingsInput,
            {
              color: palette.text.primary,
              backgroundColor: palette.background.dark,
            },
            Platform.OS === "web" && {
              boxShadow: shadows.pressed.cssXs as any,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={palette.text.muted}
        />
      ) : showChevron ? (
        <AppIcon name="chevron-right" size={20} color={palette.text.muted} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => {
            Haptic.selection();
            onPress();
          }}
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
// 🌓 THEME PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ThemeOptionProps {
  mode: ThemeMode;
  label: string;
  icon: AppIconName;
  isActive: boolean;
  onPress: () => void;
  palette: ReturnType<typeof useNeuTheme>["palette"];
  shadows: ReturnType<typeof useNeuTheme>["shadows"];
}

function ThemeOption({
  mode,
  label,
  icon,
  isActive,
  onPress,
  palette,
  shadows,
}: ThemeOptionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={() => {
          Haptic.selection();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.themeOption,
          {
            backgroundColor: palette.background.main,
            borderColor: isActive ? palette.primary.main : "transparent",
          },
          Platform.OS === "web" &&
            ({
              boxShadow: isActive
                ? `${shadows.convex.cssSm}, ${shadows.glow.cssXs}`
                : shadows.flat.cssSm,
            } as any),
          Platform.OS === "ios" &&
            (isActive ? shadows.convex.iosSm : shadows.flat.iosSm),
        ]}
      >
        <AppIcon
          name={icon}
          size={22}
          color={isActive ? palette.primary.main : palette.text.muted}
        />
        <Text
          style={[
            styles.themeOptionLabel,
            {
              color: isActive ? palette.primary.main : palette.text.muted,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ThemePicker() {
  const { themeMode, setThemeMode, palette, shadows } = useNeuTheme();

  return (
    <View style={styles.themePicker}>
      <ThemeOption
        mode="light"
        label="Clair"
        icon="light-mode"
        isActive={themeMode === "light"}
        onPress={() => setThemeMode("light")}
        palette={palette}
        shadows={shadows}
      />
      <ThemeOption
        mode="dark"
        label="Sombre"
        icon="dark-mode"
        isActive={themeMode === "dark"}
        onPress={() => setThemeMode("dark")}
        palette={palette}
        shadows={shadows}
      />
      <ThemeOption
        mode="system"
        label="Auto"
        icon="settings"
        isActive={themeMode === "system"}
        onPress={() => setThemeMode("system")}
        palette={palette}
        shadows={shadows}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 SETTINGS SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
  palette: ReturnType<typeof useNeuTheme>["palette"];
  shadows: ReturnType<typeof useNeuTheme>["shadows"];
}

function SettingsSection({
  title,
  children,
  delay = 0,
  palette,
  shadows,
}: SettingsSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.section}
    >
      <Text style={[styles.sectionTitle, { color: palette.text.muted }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: palette.background.main },
          Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
          Platform.OS === "ios" && shadows.flat.ios,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { palette, shadows, isDark } = useNeuTheme();
  const {
    currency,
    targetMargin,
    setCurrency,
    setTargetMargin,
    resetOnboarding,
  } = useSettingsStore();

  const [currencyInput, setCurrencyInput] = useState(currency);
  const [marginInput, setMarginInput] = useState(String(targetMargin));

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleExportData = async () => {
    Haptic.selection();
    try {
      await exportDataToCSV();
      Alert.alert("Succès", "Données exportées avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'exporter les données");
    }
  };

  const handleResetData = () => {
    Haptic.warning();
    Alert.alert(
      "Réinitialiser les données",
      "Cette action supprimera toutes vos données. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            resetOnboarding();
            Haptic.success();
            Alert.alert("Succès", "Données réinitialisées");
          },
        },
      ],
    );
  };

  const handleSaveCurrency = () => {
    if (currencyInput.trim()) {
      setCurrency(currencyInput.trim().toUpperCase());
    }
  };

  const handleSaveMargin = () => {
    const margin = parseFloat(marginInput);
    if (!isNaN(margin)) {
      setTargetMargin(margin);
    }
  };

  // Divider component with theme colors
  const Divider = () => (
    <View
      style={[styles.divider, { backgroundColor: palette.divider.light }]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background.main }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + NeuSpacing.md,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: palette.text.primary }]}>
            Réglages
          </Text>
          <Text style={[styles.headerSubtitle, { color: palette.text.muted }]}>
            Personnalisez votre expérience
          </Text>
        </Animated.View>

        {/* Appearance Section */}
        <SettingsSection
          title="APPARENCE"
          delay={150}
          palette={palette}
          shadows={shadows}
        >
          <View style={styles.themeRow}>
            <View style={styles.themeRowHeader}>
              <View
                style={[
                  styles.settingsIcon,
                  { backgroundColor: palette.primary.main + "20" },
                ]}
              >
                <AppIcon
                  name={isDark ? "dark-mode" : "light-mode"}
                  size={20}
                  color={palette.primary.main}
                />
              </View>
              <View style={styles.settingsContent}>
                <Text
                  style={[
                    styles.settingsLabel,
                    { color: palette.text.primary },
                  ]}
                >
                  Thème
                </Text>
                <Text
                  style={[
                    styles.settingsDescription,
                    { color: palette.text.muted },
                  ]}
                >
                  Choisissez l'apparence de l'app
                </Text>
              </View>
            </View>
            <ThemePicker />
          </View>
        </SettingsSection>

        {/* Profile Section */}
        <SettingsSection
          title="PROFIL"
          delay={200}
          palette={palette}
          shadows={shadows}
        >
          <SettingsRow
            icon="person"
            label="Mon profil"
            description="Gérer vos informations"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="notifications"
            iconColor={palette.accent.yellow}
            label="Notifications"
            description="Alertes et rappels"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
        </SettingsSection>

        {/* Business Settings */}
        <SettingsSection
          title="PARAMÈTRES MÉTIER"
          delay={300}
          palette={palette}
          shadows={shadows}
        >
          <SettingsRow
            icon="payments"
            iconColor={palette.accent.green}
            label="Devise"
            description="Devise affichée"
            value={currencyInput}
            onChangeText={setCurrencyInput}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="trending-up"
            iconColor={palette.accent.blue}
            label="Marge cible"
            description="€ par article"
            value={marginInput}
            onChangeText={setMarginInput}
            keyboardType="numeric"
            palette={palette}
            shadows={shadows}
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection
          title="DONNÉES"
          delay={400}
          palette={palette}
          shadows={shadows}
        >
          <SettingsRow
            icon="download"
            iconColor={palette.primary.main}
            label="Exporter en CSV"
            description="Télécharger vos données"
            showChevron
            onPress={handleExportData}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="cloud-upload"
            iconColor={palette.accent.blue}
            label="Sauvegarder"
            description="Sauvegarder sur le cloud"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="sync"
            iconColor={palette.accent.yellow}
            label="Synchroniser"
            description="Sync avec vos appareils"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
        </SettingsSection>

        {/* App Info */}
        <SettingsSection
          title="APPLICATION"
          delay={500}
          palette={palette}
          shadows={shadows}
        >
          <SettingsRow
            icon="info"
            iconColor={palette.text.muted}
            label="À propos"
            description="Version, licences"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="help"
            iconColor={palette.text.muted}
            label="Aide & Support"
            description="FAQ, contact"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
          <Divider />
          <SettingsRow
            icon="star"
            iconColor={palette.accent.yellow}
            label="Noter l'app"
            description="Laissez un avis"
            showChevron
            onPress={() => {}}
            palette={palette}
            shadows={shadows}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="ZONE DANGER"
          delay={600}
          palette={palette}
          shadows={shadows}
        >
          <SettingsRow
            icon="delete-outline"
            label="Réinitialiser les données"
            description="Supprimer toutes les données"
            isDestructive
            showChevron
            onPress={handleResetData}
            palette={palette}
            shadows={shadows}
          />
        </SettingsSection>

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(400)}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: palette.text.primary }]}>
            Optimus Vintage
          </Text>
          <Text style={[styles.footerVersion, { color: palette.text.muted }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.footerCopyright, { color: palette.text.muted }]}>
            © 2026 GLWebDevAgency. Tous droits réservés.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: NeuSpacing.lg,
  },

  // Header
  header: {
    marginBottom: NeuSpacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: NeuSpacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: NeuSpacing.sm,
    marginLeft: NeuSpacing.xs,
  },
  sectionCard: {
    borderRadius: NeuRadius["2xl"],
    overflow: "hidden",
  },

  // Row
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: NeuSpacing.md,
    gap: NeuSpacing.md,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: NeuRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingsDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsInput: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: NeuRadius.md,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 60,
  },

  // Divider
  divider: {
    height: 1,
    marginLeft: 68, // Icon width + padding
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: NeuSpacing.xl,
    marginTop: NeuSpacing.lg,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footerVersion: {
    fontSize: 12,
    marginTop: NeuSpacing.xs,
  },
  footerCopyright: {
    fontSize: 10,
    marginTop: NeuSpacing.sm,
    opacity: 0.6,
  },

  // Theme Picker
  themePicker: {
    flexDirection: "row",
    gap: NeuSpacing.sm,
    marginTop: NeuSpacing.md,
  },
  themeOption: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: NeuSpacing.md,
    borderRadius: NeuRadius.lg,
    borderWidth: 2,
    gap: NeuSpacing.xs,
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  themeRow: {
    padding: NeuSpacing.md,
    gap: NeuSpacing.sm,
  },
  themeRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: NeuSpacing.md,
  },
});
