import { Stack } from 'expo-router';
import { tabStackScreenOptions } from '../../../src/navigation/tabStackLayout';

export default function PreferitiTabLayout() {
  return (
    <Stack screenOptions={tabStackScreenOptions('Preferiti')}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
