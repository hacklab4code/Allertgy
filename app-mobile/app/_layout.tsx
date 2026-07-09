import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initPushNotifications } from '../src/services/pushNotifications';

export default function RootLayout() {
  useEffect(() => initPushNotifications(), []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: '#047857',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'AllerTgy' }} />
        <Stack.Screen name="legal" options={{ title: 'Termini e privacy', headerBackVisible: false }} />
        <Stack.Screen name="allergie" options={{ title: 'Le mie allergie' }} />
        <Stack.Screen name="disclaimer" options={{ title: 'Importante', headerBackVisible: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ title: 'Scansiona QR' }} />
        <Stack.Screen name="menu/[codice]" options={{ title: 'Menù' }} />
        <Stack.Screen name="notifiche" options={{ title: 'Notifiche' }} />
        <Stack.Screen name="emergency" options={{ title: 'SOS emergenza' }} />
        <Stack.Screen name="sub-profiles" options={{ title: 'Profili famiglia' }} />
        <Stack.Screen name="allergy-card" options={{ title: 'Pass allergeni' }} />
        <Stack.Screen name="documenti" options={{ title: 'Documenti sanitari' }} />
        <Stack.Screen name="language" options={{ title: 'Lingua' }} />
        <Stack.Screen name="legal-docs" options={{ title: 'Documenti legali' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset password' }} />
        <Stack.Screen name="shared-profile/[token]" options={{ title: 'Profilo condiviso' }} />
      </Stack>
    </>
  );
}
