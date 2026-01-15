import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { ensureTables } from '@/db/migrate';
import { useSettingsStore } from '@/store/settings';
import {
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold
} from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
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
          
          // Check onboarding (small delay to ensure store is hydrated? persist is usually fast with async storage)
          // Ideally we check `useSettingsStore.persist.hasHydrated()`
           const hasHydrated = useSettingsStore.persist.hasHydrated();
           // Manually wait/check? 
           // Actually, let's just create a quick layout effect.
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

  return <RootLayoutNav />;
}

// Separate component to use router hook safely
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isOnboardingDone } = useSettingsStore();
  const [isReady, setIsReady] = useState(false);

  // Check hydration / initial redirect
  useEffect(() => {
      // Small timeout to allow layout to mount
      // Better: use segments? 
      // For MVP: if !isOnboardingDone, replace.
      // We need to wait for store rehydration. 
      // Zustand persist middleware is async.
      
      const checkParams = async () => {
         // Force wait for hydration?
         await useSettingsStore.persist.rehydrate();
         setIsReady(true);
      };
      checkParams();
  }, []);

  useEffect(() => {
      if (!isReady) return;
      
      if (!isOnboardingDone) {
          router.replace('/onboarding');
      }
  }, [isReady, isOnboardingDone]);


  if (!isReady) return null; // Or a splash

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lots" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sales" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}
