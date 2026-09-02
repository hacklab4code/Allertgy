import { useColorScheme } from 'react-native';
import { useAppearance } from '../store/appearance';

export function useIsDarkMode(): boolean {
  const systemScheme = useColorScheme();
  const themeMode = useAppearance((s) => s.themeMode);
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return systemScheme === 'dark';
}
