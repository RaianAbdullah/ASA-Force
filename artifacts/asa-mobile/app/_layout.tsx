import React, { useEffect } from 'react';
import { Platform, I18nManager } from 'react-native';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Apply RTL on startup (default locale is Arabic)
I18nManager.allowRTL(true);
// forceRTL removed — layout RTL is handled explicitly per-component
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from '@expo-google-fonts/inter';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { notificationApi, setSessionExpiredCallback } from '@/services/api';
import { loadSession } from '@/services/auth';

SplashScreen.preventAutoHideAsync();

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

const queryClient = new QueryClient();

// ── Push notification registration ─────────────────────────────────────────

async function registerPushToken() {
  // Push tokens only work on physical devices (not simulators/web)
  if (Platform.OS === 'web' || !Device.isDevice) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPerms = await Notifications.getPermissionsAsync() as any;
  let permGranted: boolean = Boolean(existingPerms?.granted);

  if (!permGranted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newPerms = await Notifications.requestPermissionsAsync() as any;
    permGranted = Boolean(newPerms?.granted);
  }

  if (!permGranted) return;

  const session = await loadSession();
  if (!session) return; // Only register token for authenticated users

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const platform  = Platform.OS === 'ios' ? 'ios' : 'android';
    await notificationApi.registerToken(tokenData.data, platform);
  } catch {
    // Non-fatal — push notifications degrade gracefully
  }
}

// ── Root layout ─────────────────────────────────────────────────────────────

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="index"   options={{ headerShown: false }} />
      <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Register push token after fonts load (user may already be logged in)
    if (fontsLoaded || fontError) {
      registerPushToken();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Wire up the session-expired redirect so api.ts can trigger navigation
    // when a token refresh fails anywhere in the app.
    setSessionExpiredCallback(() => {
      // router.replace navigates from any screen back to the welcome/login root
      router.replace('/');
    });
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
