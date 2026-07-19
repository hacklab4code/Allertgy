import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Stack tab senza header nativo — azioni in HeaderFloatingActions. */
export function tabStackScreenOptions(_title?: string): NativeStackNavigationOptions {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' },
  };
}
