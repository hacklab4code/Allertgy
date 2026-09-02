import 'react-native-gesture-handler';
import '../global.css';
import { Stack, router } from 'expo-router';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setUnauthorizedHandler } from '../src/api/client';
import { useAppFonts } from '../src/hooks/useAppFonts';
import { initPushNotifications } from '../src/services/pushNotifications';
import { useIsDarkMode } from '../src/hooks/useAppTheme';
import { GlassHeaderBackground } from '../src/components/ui/GlassHeaderBackground';
import { NavHeaderBackButton } from '../src/components/ui/NavHeaderBackButton';
import { NAV_THEME } from '../src/lib/theme';
import { colors, font } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useIsDarkMode();
  const [fontsLoaded, fontErr] = useAppFonts();
  const ready = fontsLoaded || !!fontErr;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => { });
  }, [ready]);

  useEffect(() => {
    if (ready) initPushNotifications();
  }, [ready]);

  useEffect(() => {
    setUnauthorizedHandler(() => router.replace('/welcome'));
    return () => setUnauthorizedHandler(null);
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView className="flex-1 bg-background" style={{ flex: 1, backgroundColor: isDark ? '#504771' : colors.surface }}>
      <SafeAreaProvider>
        <ThemeProvider value={isDark ? NAV_THEME.dark : NAV_THEME.light}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? '#504771' : colors.surface },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="register-allergies" />
            <Stack.Screen name="legal" />
            <Stack.Screen name="allergie" />
            <Stack.Screen name="disclaimer" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(owner)" />
            <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen
              name="menu/[codice]"
              options={{
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen
              name="menu/[codice]/dish/[id]"
              options={{
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen name="notifiche" />
            <Stack.Screen
              name="emergency"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="sub-profiles" />
            <Stack.Screen
              name="allergy-card"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="documenti" />
            <Stack.Screen name="language" />
            <Stack.Screen name="account-settings" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="legal-docs" />
            <Stack.Screen name="dispensa" />
            <Stack.Screen name="recalls" />
            <Stack.Screen name="medical-dossier" />
            <Stack.Screen name="diario-reazioni" />
            <Stack.Screen name="lista-spesa" />
            <Stack.Screen name="lockscreen-ice" />
            <Stack.Screen name="allergie-crociate" />
            <Stack.Screen name="travel-hub" />
            <Stack.Screen name="kitchen-safety-sheet" />
            <Stack.Screen name="shared-profile/[token]" />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
