import { Tabs, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import NotificationBell from '../../src/components/NotificationBell';

const icon = (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );

/** Schede principali dell'app cliente. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: '#047857',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#047857',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { height: 84, paddingTop: 6 },
        sceneStyle: { backgroundColor: '#f8fafc' },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <NotificationBell />
            <TouchableOpacity
              onPress={() => router.push('/emergency')}
              style={{
                backgroundColor: '#fee2e2',
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: '#fca5a5',
                paddingVertical: 5,
                paddingHorizontal: 10,
                shadowColor: '#dc2626',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Text style={{ color: '#b91c1c', fontWeight: '900', fontSize: 11, letterSpacing: 0.2 }}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Scansiona menu', tabBarLabel: 'Scansiona', tabBarIcon: icon('🔍') }} />
      <Tabs.Screen name="spesa" options={{ title: 'Spesa', tabBarLabel: 'Spesa', tabBarIcon: icon('🛒') }} />
      <Tabs.Screen name="locali" options={{ title: 'Ristoranti', tabBarLabel: 'Ristoranti', tabBarIcon: icon('🍽️') }} />
      <Tabs.Screen name="account" options={{ title: 'Profilo e impostazioni', tabBarLabel: 'Profilo', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
