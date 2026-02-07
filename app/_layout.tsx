import {
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, useSegments } from "expo-router";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { NavigationTheme } from "@/constants/Theme";
import { ensureTables } from "@/db/migrate";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { useSubscriptionStore } from "@/store/subscription";
import { analytics } from "@/utils/analytics";
import "@/utils/i18n"; // Initialize i18n

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
    },
  },
});

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function init() {
      if (loaded) {
        try {
          await ensureTables();
          await analytics.initialize(); // Initialize analytics
          analytics.track("app_launched");
        } catch (e) {
          console.error("DB Init error", e);
        } finally {
          SplashScreen.hideAsync();
        }
      }
    }
    init();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

// Separate component to use router hook safely
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isOnboardingDone } = useSettingsStore();
  const { isAuthenticated, fetchMe } = useAuthStore();
  const { initialize: initSubscriptions } = useSubscriptionStore();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  // Check hydration / initial redirect
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      await useSettingsStore.persist.rehydrate();
      // Try to restore auth session
      await fetchMe();
      // Initialize RevenueCat (after auth so user ID can be set)
      await initSubscriptions();
      if (isMounted) {
        setIsReady(true);
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Don't redirect if user is on a public route (landing, onboarding, auth)
    const currentRoute = segments[0];
    const publicRoutes = ["landing", "onboarding", "auth"];
    if (publicRoutes.includes(currentRoute)) return;

    if (!isOnboardingDone) {
      router.replace("/onboarding");
    } else if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [isReady, isOnboardingDone, isAuthenticated, segments]);

  if (!isReady) return null; // Or a splash

  return (
    <ThemeProvider
      value={
        colorScheme === "dark" ? NavigationTheme.dark : NavigationTheme.light
      }
    >
      {/* Status bar: light text on dark mode, dark text on light mode */}
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="lots"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="sales"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="scanner" options={{ headerShown: false }} />
        <Stack.Screen
          name="items"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.85, 1.0],
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="auth"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="landing"
          options={{ headerShown: false, animation: "fade" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
