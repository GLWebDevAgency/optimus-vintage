/**
 * 🔐 AUTH SCREENS — Login & Register
 *
 * Premium authentication screens with Vanta design system.
 * Features:
 * - Toggle between Login & Register
 * - VantaScreen background with gradient + ambient orbs
 * - ObsidianBlock premium form container
 * - PremiumInput with focus glow & icons
 * - PremiumButton with spring animations & haptics
 * - Form validation with error display
 * - i18n support
 */

import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AppIcon } from "@/components/ui/AppIcon";
import { ObsidianBlock } from "@/components/ui/ObsidianBlock";
import {
    PremiumButton,
    PremiumInput,
    useIsDarkMode,
    useVantaTheme,
    VantaScreen,
} from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { useAuthStore } from "@/store/auth";
import { triggerHaptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";

const isIOS = process.env.EXPO_OS === "ios";

export default function AuthScreen() {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const isMobile = width < 500;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = useCallback(async () => {
    clearError();

    // Basic validation
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.emailRequired"));
      return;
    }
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("auth.passwordRequired"));
      return;
    }
    if (mode === "register" && password.length < 8) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }

    let success = false;
    if (mode === "login") {
      success = await login(email.trim(), password);
    } else {
      success = await register(
        email.trim(),
        password,
        displayName.trim() || undefined,
      );
    }

    if (success) {
      if (isIOS) triggerHaptic("success");
      router.replace("/(tabs)");
    } else {
      if (isIOS) triggerHaptic("error");
    }
  }, [mode, email, password, displayName, login, register, clearError, t]);

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    clearError();
    if (isIOS) triggerHaptic("light");
  };

  return (
    <VantaScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={isIOS ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: isMobile ? Spacing.xl : Spacing["4xl"],
            paddingVertical: Spacing["4xl"],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={{
              alignItems: "center",
              marginBottom: Spacing["3xl"],
              gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: Radius["2xl"],
                borderCurve: "continuous",
                backgroundColor: isDark
                  ? `${Palette.metal.gold}15`
                  : `${Palette.metal.champagne}20`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Spacing.sm,
              }}
            >
              <AppIcon
                name="auto-awesome"
                size={32}
                color={theme.primary}
              />
            </View>
            <Text
              style={{
                ...Typography.display.lg,
                color: theme.primary,
                textAlign: "center",
              }}
            >
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
            </Text>
            <Text
              style={{
                ...Typography.body.md,
                color: theme.textMuted,
                textAlign: "center",
              }}
            >
              {mode === "login"
                ? t("auth.loginSubtitle")
                : t("auth.registerSubtitle")}
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(150).springify()}
            style={{
              maxWidth: 400,
              alignSelf: "center",
              width: "100%",
            }}
          >
            <ObsidianBlock
              variant="premium"
              style={{ padding: Spacing["2xl"] }}
            >
              <View style={{ gap: Spacing.lg }}>
                {/* Display Name (Register only) */}
                {mode === "register" && (
                  <Animated.View entering={FadeInDown.duration(300).springify()}>
                    <PremiumInput
                      label={t("auth.displayName")}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder={t("auth.displayNamePlaceholder")}
                      autoCapitalize="words"
                      autoCorrect={false}
                      icon="person"
                    />
                  </Animated.View>
                )}

                {/* Email */}
                <PremiumInput
                  label={t("auth.email")}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />

                {/* Password */}
                <PremiumInput
                  label={t("auth.password")}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    mode === "register"
                      ? t("auth.passwordPlaceholderNew")
                      : t("auth.passwordPlaceholder")
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  icon="lock"
                  rightIcon={showPassword ? "visibility" : "visibility-off"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                {/* Error Message */}
                {error && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                      backgroundColor: isDark
                        ? `${Palette.semantic.danger}15`
                        : `${Palette.semantic.danger}10`,
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: Radius.md,
                      borderCurve: "continuous",
                    }}
                  >
                    <AppIcon
                      name="error-outline"
                      size={16}
                      color={Palette.semantic.danger}
                    />
                    <Text
                      style={{
                        ...Typography.body.sm,
                        color: Palette.semantic.danger,
                        flex: 1,
                      }}
                    >
                      {error}
                    </Text>
                  </Animated.View>
                )}

                {/* Submit Button */}
                <View style={{ marginTop: Spacing.sm }}>
                  <PremiumButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={isLoading}
                    onPress={handleSubmit}
                  >
                    {mode === "login"
                      ? t("auth.loginButton")
                      : t("auth.registerButton")}
                  </PremiumButton>
                </View>
              </View>
            </ObsidianBlock>

            {/* Toggle Mode */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300).springify()}
              style={{ alignItems: "center", marginTop: Spacing.xl }}
            >
              <Pressable
                onPress={toggleMode}
                style={{ alignItems: "center", paddingVertical: Spacing.md }}
              >
                <Text style={{ ...Typography.body.sm, color: theme.textMuted }}>
                  {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    {mode === "login"
                      ? t("auth.registerLink")
                      : t("auth.loginLink")}
                  </Text>
                </Text>
              </Pressable>

              {/* Skip (continue without account) */}
              <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={{ alignItems: "center", paddingVertical: Spacing.sm }}
              >
                <Text
                  style={{
                    ...Typography.body.xs,
                    color: theme.textMuted,
                  }}
                >
                  {t("auth.skipForNow")}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </VantaScreen>
  );
}
