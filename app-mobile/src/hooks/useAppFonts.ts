import { useFonts } from 'expo-font';

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    'Fredoka-Medium': require('../../assets/fonts/Fredoka-Medium.ttf'),
    'Fredoka-SemiBold': require('../../assets/fonts/Fredoka-SemiBold.ttf'),
    'Fredoka-Bold': require('../../assets/fonts/Fredoka-Bold.ttf'),
    'Nunito-Regular': require('../../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf'),
  });
