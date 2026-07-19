import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppearanceState {
  /** Liquid Glass: nativo Apple quando disponibile, altrimenti fallback blur per tutti. */
  liquidGlassEnabled: boolean;
  setLiquidGlassEnabled: (enabled: boolean) => void;
}

export const useAppearance = create<AppearanceState>()(
  persist(
    (set) => ({
      liquidGlassEnabled: true,
      setLiquidGlassEnabled: (liquidGlassEnabled) => set({ liquidGlassEnabled }),
    }),
    {
      name: 'allertgy-appearance',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
