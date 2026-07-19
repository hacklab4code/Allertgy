import { Stack } from 'expo-router';
import { tabStackScreenOptions } from '../../../src/navigation/tabStackLayout';

export default function AccountTabLayout() {
  return (
    <Stack screenOptions={tabStackScreenOptions('Profilo')}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
