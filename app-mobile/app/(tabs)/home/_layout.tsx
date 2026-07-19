import { Stack } from 'expo-router';
import { tabStackScreenOptions } from '../../../src/navigation/tabStackLayout';

export default function HomeTabLayout() {
  return (
    <Stack screenOptions={tabStackScreenOptions('Home')}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
