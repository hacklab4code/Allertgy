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
  setPiatti: (piatti) => set({ piatti }),
  setPublished: (published) => set({ published }),
  reset: () => set({ restaurants: [], current: null, piatti: [], published: false }),
}));
