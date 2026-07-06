import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
      </Stack>
    </>
  );
}
