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
import { GlassHeaderBackground } from '../src/components/ui/GlassHeaderBackground';
import { NAV_THEME } from '../src/lib/theme';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    <GestureHandlerRootView className="flex-1 bg-background" style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaProvider>
        <ThemeProvider value={NAV_THEME.light}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTintColor: colors.brand,
              headerTitleStyle: { fontWeight: '800', color: colors.onSurface },
              headerStyle: { backgroundColor: 'transparent' },
              headerBackground: () => <GlassHeaderBackground />,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.surface },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="register-allergies" options={{ title: 'Le tue allergie', headerBackVisible: false }} />
            <Stack.Screen name="legal" options={{ title: 'Termini e privacy', headerBackVisible: false }} />
            <Stack.Screen name="allergie" options={{ title: 'Le mie allergie' }} />
            <Stack.Screen name="disclaimer" options={{ title: 'Importante', headerBackVisible: false }} />
            <Stack.Screen name="onboarding" options={{ title: 'Guida', headerBackVisible: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(owner)" options={{ headerShown: false }} />
            <Stack.Screen name="scanner" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen
              name="menu/[codice]"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen
              name="menu/[codice]/dish/[id]"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen name="notifiche" options={{ title: 'Notifiche', headerBackTitle: 'Indietro' }} />
            <Stack.Screen
              name="emergency"
              options={{ title: 'SOS emergenza', presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen name="sub-profiles" options={{ title: 'Profili famiglia' }} />
            <Stack.Screen
              name="allergy-card"
              options={{ title: 'Pass allergeni', presentation: 'modal' }}
            />
            <Stack.Screen name="documenti" options={{ title: 'Documenti sanitari' }} />
            <Stack.Screen name="language" options={{ title: 'Lingua' }} />
            <Stack.Screen name="account-settings" options={{ title: 'Dati account' }} />
            <Stack.Screen name="subscription" options={{ title: 'Piano e abbonamento' }} />
            <Stack.Screen name="legal-docs" options={{ title: 'Documenti legali' }} />
            <Stack.Screen name="dispensa" options={{ title: 'Dispensa e Scadenze' }} />
            <Stack.Screen name="recalls" options={{ title: 'Richiami Alimentari' }} />
            <Stack.Screen name="medical-dossier" options={{ title: 'Fascicolo Medico PDF' }} />
            <Stack.Screen name="diario-reazioni" options={{ title: 'Diario delle Reazioni' }} />
            <Stack.Screen name="lista-spesa" options={{ title: 'Lista della Spesa Sicura' }} />
            <Stack.Screen name="lockscreen-ice" options={{ title: 'Sfondo Blocco ICE' }} />
            <Stack.Screen name="allergie-crociate" options={{ title: 'Allergie Crociate' }} />
            <Stack.Screen name="travel-hub" options={{ title: 'Frasario Viaggi' }} />
            <Stack.Screen name="kitchen-safety-sheet" options={{ title: 'Kitchen Safety & B2B' }} />
            <Stack.Screen name="shared-profile/[token]" options={{ title: 'Profilo condiviso' }} />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
