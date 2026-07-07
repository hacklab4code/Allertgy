import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const icon = (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );

/** Schede dell'area ristoratore. */
export default function OwnerLayout() {
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
      }}
    >
      <Tabs.Screen name="locali" options={{ title: 'Il mio locale', tabBarLabel: 'Locale', tabBarIcon: icon('🏪') }} />
      <Tabs.Screen name="menu" options={{ title: 'Gestione menù', tabBarLabel: 'Menù', tabBarIcon: icon('📋') }} />
      <Tabs.Screen name="piano" options={{ title: 'Piano e prezzi', tabBarLabel: 'Piano', tabBarIcon: icon('💳') }} />
      <Tabs.Screen name="qr" options={{ title: 'QR per i tavoli', tabBarLabel: 'QR Code', tabBarIcon: icon('🖨️') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
