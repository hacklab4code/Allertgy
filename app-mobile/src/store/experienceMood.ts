import { create } from 'zustand';
import { loadScanHistory } from '../services/productStorage';
import {
  moodFromSemaforo,
  moodFromVerdict,
  type ExperienceMood,
} from '../experience/moodPalette';
import type { Verdict } from '../theme';

/** Dopo quanto il gradiente torna viola brand. */
export const MOOD_RESET_MS = 2 * 60 * 1000;

let moodResetTimer: ReturnType<typeof setTimeout> | null = null;

function clearMoodResetTimer() {
  if (moodResetTimer) {
    clearTimeout(moodResetTimer);
    moodResetTimer = null;
  }
}

function scheduleMoodReset(delayMs = MOOD_RESET_MS) {
  clearMoodResetTimer();
  if (delayMs <= 0) {
    useExperienceMood.setState({ mood: 'brand', liveMood: null });
    return;
  }
  moodResetTimer = setTimeout(() => {
    moodResetTimer = null;
    useExperienceMood.setState({ mood: 'brand', liveMood: null });
  }, delayMs);
}

type ExperienceMoodState = {
  mood: ExperienceMood;
  /** Override live (es. locale vicino) — ha priorità sulla history. */
  liveMood: ExperienceMood | null;
  setFromScan: (stato: 'verde' | 'giallo' | 'rosso') => void;
  setLiveMood: (verdict: Verdict | 'neutral' | null) => void;
  syncFromHistory: () => Promise<void>;
  resetToBrand: () => void;
  effectiveMood: () => ExperienceMood;
};

export const useExperienceMood = create<ExperienceMoodState>((set, get) => ({
  mood: 'brand',
  liveMood: null,
  setFromScan: (stato) => {
    set({ mood: moodFromSemaforo(stato) });
    scheduleMoodReset();
  },
  setLiveMood: (verdict) => {
    if (!verdict || verdict === 'neutral') {
      set({ liveMood: null });
      return;
    }
    set({ liveMood: moodFromVerdict(verdict) });
    scheduleMoodReset();
  },
  syncFromHistory: async () => {
    const history = await loadScanHistory();
    const latest = history[0];
    if (!latest?.status) {
      set({ mood: 'brand' });
      clearMoodResetTimer();
      return;
    }
    const ts = new Date(latest.date).getTime();
    const age = Number.isNaN(ts) ? Number.POSITIVE_INFINITY : Date.now() - ts;
    if (age >= MOOD_RESET_MS) {
      set({ mood: 'brand' });
      clearMoodResetTimer();
      return;
    }
    set({ mood: moodFromSemaforo(latest.status) });
    scheduleMoodReset(MOOD_RESET_MS - age);
  },
  resetToBrand: () => {
    clearMoodResetTimer();
    set({ mood: 'brand', liveMood: null });
  },
  effectiveMood: () => get().liveMood ?? get().mood,
}));
