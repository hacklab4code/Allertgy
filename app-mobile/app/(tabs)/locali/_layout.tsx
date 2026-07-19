import { Stack } from 'expo-router';
import { tabStackScreenOptions } from '../../../src/navigation/tabStackLayout';

export default function LocaliTabLayout() {
  return (
    <Stack screenOptions={tabStackScreenOptions('Ristoranti')}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
