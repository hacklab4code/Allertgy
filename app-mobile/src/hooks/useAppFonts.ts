import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    'Sora-Medium': require('../../assets/fonts/Sora-Medium.ttf'),
    'Sora-SemiBold': require('../../assets/fonts/Sora-SemiBold.ttf'),
    'Sora-Bold': require('../../assets/fonts/Sora-Bold.ttf'),
    'Nunito-Regular': require('../../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf'),
    ...Ionicons.font,
  });
