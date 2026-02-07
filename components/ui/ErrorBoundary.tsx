/**
 * 🛡️ ERROR BOUNDARY - Premium error recovery component
 * Catches render errors per screen and provides graceful recovery
 *
 * v1.0 - Vanta-Aether Architecture
 *
 * Usage in _layout.tsx:
 *   export { ScreenErrorBoundary as ErrorBoundary } from "@/components/ui/ErrorBoundary";
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { useLocale } from "@/utils/i18n";
import { router } from "expo-router";
import React, { type ErrorInfo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = process.env.EXPO_OS === "ios";

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary Class (React requires class component for error boundaries)
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ScreenErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // TODO: Send to Sentry when integrated
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Expo Router ErrorBoundary export (follows expo-router convention)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Export this from any _layout.tsx to enable per-route error catching:
 *
 *   export { ScreenErrorBoundary as ErrorBoundary } from "@/components/ui/ErrorBoundary";
 */
export function ScreenErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <ErrorFallbackScreen error={error} onRetry={retry} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 Premium Error Fallback UI
// ─────────────────────────────────────────────────────────────────────────────

function ErrorFallbackScreen({
  error,
  errorInfo,
  onRetry,
}: {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  onRetry: () => void;
}) {
  const theme = useVantaTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 20,
        }}
      >
        {/* Icon */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: `${theme.warning}15`,
              justifyContent: "center",
              alignItems: "center",
              borderCurve: "continuous",
            }}
          >
            <AppIcon name="warning" size={40} color={theme.warning} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text
            style={{
              fontSize: 22,
              fontFamily: "Manrope_700Bold",
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("errors.screenCrashTitle") || "Oups, quelque chose a planté"}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Manrope_400Regular",
              color: theme.textSecondary,
              textAlign: "center",
              lineHeight: 22,
              maxWidth: 320,
            }}
          >
            {t("errors.screenCrashSubtitle") ||
              "Cet écran a rencontré une erreur inattendue. Vos données sont en sécurité."}
          </Text>
        </Animated.View>

        {/* Retry Button */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => ({
              backgroundColor: theme.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 14,
              borderCurve: "continuous",
              opacity: pressed ? 0.85 : 1,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            })}
            accessibilityRole="button"
            accessibilityLabel={t("errors.retry") || "Réessayer"}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontFamily: "Manrope_600SemiBold",
                textAlign: "center",
              }}
            >
              {t("errors.retry") || "Réessayer"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Go Home Button */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Pressable
            onPress={() => {
              onRetry();
              router.replace("/(tabs)");
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              borderCurve: "continuous",
              opacity: pressed ? 0.6 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={t("errors.goHome") || "Retour à l'accueil"}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 15,
                fontFamily: "Manrope_500Medium",
                textAlign: "center",
              }}
            >
              {t("errors.goHome") || "Retour à l'accueil"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Error Details (collapsible) */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(500)}
            style={{ width: "100%", maxWidth: 400 }}
          >
            <Pressable
              onPress={() => setShowDetails(!showDetails)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
              }}
            >
              <AppIcon
                name={showDetails ? "expand-less" : "expand-more"}
                size={18}
                color={theme.textMuted}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Manrope_400Regular",
                  color: theme.textMuted,
                }}
              >
                {t("errors.details") || "Détails techniques"}
              </Text>
            </Pressable>

            {showDetails && (
              <View
                style={{
                  marginTop: 8,
                  padding: 16,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  backgroundColor: theme.surfaceCard,
                }}
              >
                <Text
                  selectable
                  style={{
                    fontSize: 12,
                    fontFamily: "SpaceMono",
                    color: theme.warning,
                    marginBottom: 8,
                  }}
                >
                  {error.name}: {error.message}
                </Text>
                {errorInfo?.componentStack && (
                  <Text
                    selectable
                    style={{
                      fontSize: 11,
                      fontFamily: "SpaceMono",
                      color: theme.textMuted,
                      lineHeight: 16,
                    }}
                    numberOfLines={15}
                  >
                    {errorInfo.componentStack.trim()}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
