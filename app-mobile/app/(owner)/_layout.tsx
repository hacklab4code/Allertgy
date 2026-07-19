import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import NotificationBell from '../../src/components/NotificationBell';
import { OnboardingRedirect } from '../../src/hooks/onboardingGuard';
import { colors, WIREFRAME_MODE } from '../../src/theme';
import { GlassHeaderBackground } from '../../src/components/ui/GlassHeaderBackground';

const icon = (label: string) =>
  ({ focused }: { focused: boolean }) => (
    WIREFRAME_MODE ? (
      <View style={[styles.wfIcon, focused && styles.wfIconOn]}>
        <Text style={{ fontSize: 9, color: focused ? '#FFF' : '#000' }}>{label.slice(0, 2)}</Text>
      </View>
    ) : (
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{label}</Text>
    )
  );

/**
 * Area ristoratore — 4 tab in basso.
 * Crescita, Piani, Recensioni e Statistiche si aprono da Impostazioni.
 */
export default function OwnerLayout() {
  return (
    <>
      <OnboardingRedirect area="owner" />
      <Tabs
      screenOptions={{
        headerTintColor: WIREFRAME_MODE ? '#000' : colors.brand,
        headerTitleStyle: { fontWeight: '700', color: WIREFRAME_MODE ? '#000' : colors.onSurface },
        headerStyle: { backgroundColor: 'transparent' },
        headerBackground: () => <GlassHeaderBackground />,
        headerShadowVisible: false,
        headerRight: () => (
          <View style={{ marginRight: 12 }}>
            <NotificationBell />
          </View>
        ),
        tabBarActiveTintColor: WIREFRAME_MODE ? '#000' : colors.brand,
        tabBarInactiveTintColor: WIREFRAME_MODE ? '#666' : colors.onSurfaceMuted,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: WIREFRAME_MODE
          ? { height: 56, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#FFF' }
          : {
              height: 84,
              paddingTop: 6,
              backgroundColor: colors.surfaceSecondary,
              borderTopColor: colors.border,
            },
        sceneStyle: { backgroundColor: WIREFRAME_MODE ? '#FFF' : colors.surface },
      }}
    >
      <Tabs.Screen name="locali" options={{ title: 'Attività', tabBarLabel: 'Attività', tabBarIcon: icon('🏪') }} />
      <Tabs.Screen name="menu" options={{ title: 'Gestione menù', tabBarLabel: 'Menù', tabBarIcon: icon('📋') }} />
      <Tabs.Screen name="qr" options={{ title: 'QR per i tavoli', tabBarLabel: 'QR', tabBarIcon: icon('🖨️') }} />
      <Tabs.Screen name="account" options={{ title: 'Impostazioni attività', tabBarLabel: 'Profilo', tabBarIcon: icon('👤') }} />
      <Tabs.Screen name="crescita" options={{ href: null, title: 'Boost e notifiche' }} />
      <Tabs.Screen name="piano" options={{ href: null, title: 'Piani e fatturazione' }} />
      <Tabs.Screen name="recensioni" options={{ href: null, title: 'Recensioni' }} />
      <Tabs.Screen name="statistiche" options={{ href: null, title: 'Statistiche' }} />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  wfIcon: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wfIconOn: { backgroundColor: '#000' },
});
