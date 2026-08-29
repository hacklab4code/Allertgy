import { create } from 'zustand';
import type { PiattoIn, Restaurant } from '../types';

/** Stato di lavoro del ristoratore (non persistito: si ricarica dal server). */
interface OwnerState {
  restaurants: Restaurant[];
  current: Restaurant | null;
  /** bozza del menù in modifica */
  piatti: PiattoIn[];
  published: boolean;
  setRestaurants: (r: Restaurant[]) => void;
  setCurrent: (r: Restaurant | null) => void;
  /** Aggiorna campi del locale senza azzerare la bozza menù. */
  patchCurrent: (patch: Partial<Restaurant>) => void;
  setPiatti: (p: PiattoIn[]) => void;
  setPublished: (v: boolean) => void;
  reset: () => void;
}

export const useOwner = create<OwnerState>()((set) => ({
  restaurants: [],
  current: null,
  piatti: [],
  published: false,
  setRestaurants: (restaurants) => set({ restaurants }),
  setCurrent: (current) => set({ current, piatti: [], published: false }),
  patchCurrent: (patch) => set((s) => ({
    current: s.current ? { ...s.current, ...patch } : null,
    restaurants: s.current
      ? s.restaurants.map((r) => (r.id === s.current!.id ? { ...r, ...patch } : r))
      : s.restaurants,
  })),
  setPiatti: (piatti) => set({ piatti }),
  setPublished: (published) => set({ published }),
  reset: () => set({ restaurants: [], current: null, piatti: [], published: false }),
}));
