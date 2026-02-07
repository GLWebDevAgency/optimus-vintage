/**
 * 🔐 AUTH SCREENS — Login & Register
 *
 * Premium authentication screens with Vanta design system.
 * Features:
 * - Toggle between Login & Register
 * - Animated transitions
 * - Form validation with error display
 * - Haptic feedback on iOS
 * - i18n support
 */

import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import { useAuthStore } from "@/store/auth";
import { triggerHaptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";

const isIOS = process.env.EXPO_OS === "ios";

export default function AuthScreen() {
  const theme = useVantaTheme();
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={isIOS ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: isMobile ? 24 : 48,
          paddingVertical: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={{
            alignItems: "center",
            marginBottom: 48,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 40 }}>✦</Text>
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

        {/* Form */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{
            gap: 16,
            maxWidth: 400,
            alignSelf: "center",
            width: "100%",
          }}
        >
          {/* Display Name (Register only) */}
          {mode === "register" && (
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  ...Typography.label.sm,
                  color: theme.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("auth.displayName")}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t("auth.displayNamePlaceholder")}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                style={{
                  backgroundColor: theme.surfaceCard,
                  color: theme.text,
                  borderRadius: Radius.lg,
                  borderCurve: "continuous",
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 14,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              />
            </View>
          )}

          {/* Email */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                ...Typography.label.sm,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {t("auth.email")}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              style={{
                backgroundColor: theme.surfaceCard,
                color: theme.text,
                borderRadius: Radius.lg,
                borderCurve: "continuous",
                paddingHorizontal: Spacing.lg,
                paddingVertical: 14,
                fontSize: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            />
          </View>

          {/* Password */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                ...Typography.label.sm,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {t("auth.password")}
            </Text>
            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={
                  mode === "register"
                    ? t("auth.passwordPlaceholderNew")
                    : t("auth.passwordPlaceholder")
                }
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                style={{
                  backgroundColor: theme.surfaceCard,
                  color: theme.text,
                  borderRadius: Radius.lg,
                  borderCurve: "continuous",
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 14,
                  paddingRight: 50,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 18 }}>
                  {showPassword ? "🙈" : "👁️"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text
                style={{
                  color: Palette.semantic.danger,
                  fontSize: 13,
                  textAlign: "center",
                  paddingHorizontal: 8,
                }}
              >
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? theme.textMuted : Palette.metal.gold,
              paddingVertical: 16,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              boxShadow: isLoading
                ? undefined
                : `0 0 20px ${Palette.metal.goldGlow}`,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text
                style={{
                  color: "#000",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {mode === "login"
                  ? t("auth.loginButton")
                  : t("auth.registerButton")}
              </Text>
            )}
          </Pressable>

          {/* Toggle Mode */}
          <Pressable
            onPress={toggleMode}
            style={{ alignItems: "center", paddingVertical: 12 }}
          >
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>
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
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ color: theme.textMuted, fontSize: 13 }}>
              {t("auth.skipForNow")}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
