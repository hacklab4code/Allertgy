import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { OnboardingRedirect } from '../../src/hooks/onboardingGuard';
import { ProfileContextSheet } from '../../src/components/ui/ProfileContextSheet';
import { PuffyTabBar } from '../../src/components/ui/PuffyTabBar';
import { AmbientMesh } from '../../src/components/ui/AmbientMesh';
import { HeaderFloatingActions } from '../../src/components/ui/HeaderFloatingActions';

/** 4 route tab + Scansiona (azione su /scanner) — barra custom con 5 voci. */
export default function TabsLayout() {
  return (
    <View className="flex-1 bg-transparent">
      <AmbientMesh />
      <OnboardingRedirect area="customer" />
      <Tabs
        tabBar={(props) => <PuffyTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="locali" options={{ title: 'Ristoranti', tabBarLabel: 'Ristoranti' }} />
        <Tabs.Screen name="preferiti" options={{ title: 'Preferiti', tabBarLabel: 'Preferiti' }} />
        <Tabs.Screen name="account" options={{ title: 'Profilo', tabBarLabel: 'Profilo' }} />
        <Tabs.Screen name="scan" options={{ href: null }} />
      </Tabs>
      <HeaderFloatingActions />
      <ProfileContextSheet />
    </View>
  );
}
