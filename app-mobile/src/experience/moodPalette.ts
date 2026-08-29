import type { Verdict } from '../theme';
import { compatibilitaColor } from '../engine/compatibility';

/** Mood atmosfera: lavanda di default, semaforo quando c’è un’esperienza recente. */
export type ExperienceMood = 'brand' | Verdict;

export type MoodPalette = {
  /** Colore pieno in cima */
  top: string;
  /** Fascia intermedia */
  mid: string;
  /** Dissolvenza verso il canvas */
  soft: string;
  /** Fondo app */
  bottom: string;
  glow: string;
};

/**
 * Gradiente dall’alto: brand = violet → lavanda → mist.
 * Semaforo = verde / giallo / rosso quando cambia il mood.
 */
export const MOOD_PALETTES: Record<ExperienceMood, MoodPalette> = {
  brand: {
    top: '#23212C',
    mid: '#3D384D',
    soft: '#F1FEC8',
    bottom: '#F6F2FC',
    glow: '#F1FEC8',
  },
  green: {
    top: '#059669',
    mid: '#34D399',
    soft: '#D1FAE5',
    bottom: '#F6F2FC',
    glow: '#34D399',
  },
  yellow: {
    top: '#D97706',
    mid: '#FBBF24',
    soft: '#FEF3C7',
    bottom: '#F6F2FC',
    glow: '#FBBF24',
  },
  red: {
    top: '#DC2626',
    mid: '#F87171',
    soft: '#FEE2E2',
    bottom: '#F6F2FC',
    glow: '#F87171',
  },
};

export function moodFromSemaforo(stato: 'verde' | 'giallo' | 'rosso' | null | undefined): ExperienceMood {
  if (stato === 'verde') return 'green';
  if (stato === 'giallo') return 'yellow';
  if (stato === 'rosso') return 'red';
  return 'brand';
}

export function moodFromVerdict(verdict: Verdict | 'neutral' | null | undefined): ExperienceMood {
  if (verdict === 'green' || verdict === 'yellow' || verdict === 'red') return verdict;
  return 'brand';
}

export type SemaforoStato = 'verde' | 'giallo' | 'rosso';

/** Stesso criterio del badge percentuale (≥70 verde, ≥40 giallo, altrimenti rosso). */
export function moodFromCompatPercentuale(percentuale: number | null | undefined): ExperienceMood {
  if (percentuale == null) return 'brand';
  return moodFromSemaforo(compatibilitaColor(percentuale));
}

/** Mood menù locale: filtro attivo → colore sezione; altrimenti percentuale o sezione unica aperta. */
export function moodFromMenuContext(opts: {
  filtro: 'tutti' | SemaforoStato;
  percentuale: number | null | undefined;
  expandedSections?: Record<SemaforoStato, boolean>;
}): ExperienceMood {
  const { filtro, percentuale, expandedSections } = opts;
  if (filtro !== 'tutti') {
    return moodFromSemaforo(filtro);
  }
  if (expandedSections) {
    const open = (['verde', 'giallo', 'rosso'] as const).filter((s) => expandedSections[s]);
    if (open.length === 1) {
      return moodFromSemaforo(open[0]);
    }
  }
  return moodFromCompatPercentuale(percentuale);
}
