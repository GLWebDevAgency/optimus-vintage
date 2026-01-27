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
import { router } from "expo-router";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { NavigationTheme } from "@/constants/Theme";
import { ensureTables } from "@/db/migrate";
import { useSettingsStore } from "@/store/settings";
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
  const [isReady, setIsReady] = useState(false);

  // Check hydration / initial redirect
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      await useSettingsStore.persist.rehydrate();
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

    if (!isOnboardingDone) {
      router.replace("/onboarding");
    }
  }, [isReady, isOnboardingDone]);

  if (!isReady) return null; // Or a splash

  return (
    <ThemeProvider
      value={
        colorScheme === "dark" ? NavigationTheme.dark : NavigationTheme.light
      }
    >
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
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
