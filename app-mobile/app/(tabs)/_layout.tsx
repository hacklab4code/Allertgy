import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OnboardingRedirect } from '../../src/hooks/onboardingGuard';
import { ProfileContextSheet } from '../../src/components/ui/ProfileContextSheet';
import { GlassTabBar } from '../../src/components/ui/GlassTabBar';
import { AmbientMesh } from '../../src/components/ui/AmbientMesh';
import { HeaderFloatingActions } from '../../src/components/ui/HeaderFloatingActions';
import { useFloatingHeader } from '../../src/store/floatingHeader';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar style="dark" />
      <AmbientMesh />
      <OnboardingRedirect area="customer" />
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          freezeOnBlur: true,
        }}
        screenListeners={{
          focus: () => {
            useFloatingHeader.getState().show();
          },
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
