import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OnboardingRedirect } from '../../src/hooks/onboardingGuard';
import { GlassOwnerTabBar } from '../../src/components/ui/GlassOwnerTabBar';
import { AmbientMesh } from '../../src/components/ui/AmbientMesh';
import { HeaderFloatingActions } from '../../src/components/ui/HeaderFloatingActions';

/**
 * Area Ristoratore dell'App Mobile — Stesso layout, ambient mesh e glass tab bar dell'Area Cliente.
 */
export default function OwnerLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar style="dark" />
      <AmbientMesh />
      <OnboardingRedirect area="owner" />
      <Tabs
        tabBar={(props) => <GlassOwnerTabBar {...props} />}
        initialRouteName="menu"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen name="locali" options={{ title: 'Attività', tabBarLabel: 'Attività' }} />
        <Tabs.Screen name="menu" options={{ title: 'Gestione menù', tabBarLabel: 'Menù' }} />
        <Tabs.Screen name="qr" options={{ title: 'QR per i tavoli', tabBarLabel: 'QR' }} />
        <Tabs.Screen name="account" options={{ title: 'Impostazioni attività', tabBarLabel: 'Profilo' }} />
        <Tabs.Screen name="scheda" options={{ href: null, title: 'Scheda pubblica' }} />
        <Tabs.Screen name="registro" options={{ href: null, title: 'Registro Allergeni' }} />
        <Tabs.Screen name="crescita" options={{ href: null, title: 'Boost e notifiche' }} />
        <Tabs.Screen name="piano" options={{ href: null, title: 'Piani e fatturazione' }} />
        <Tabs.Screen name="recensioni" options={{ href: null, title: 'Recensioni' }} />
        <Tabs.Screen name="statistiche" options={{ href: null, title: 'Statistiche' }} />
      </Tabs>
      <HeaderFloatingActions area="owner" />
    </View>
  );
}
