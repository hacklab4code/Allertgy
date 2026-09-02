import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppearanceState {
  /** Liquid Glass: nativo Apple quando disponibile, altrimenti fallback blur per tutti. */
  liquidGlassEnabled: boolean;
  themeMode: ThemeMode;
  setLiquidGlassEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useAppearance = create<AppearanceState>()(
  persist(
    (set, get) => ({
      liquidGlassEnabled: true,
      themeMode: 'system',
      setLiquidGlassEnabled: (liquidGlassEnabled) => set({ liquidGlassEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleTheme: () => {
        const current = get().themeMode;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ themeMode: next });
      },
    }),
    {
      name: 'allertgy-appearance',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
