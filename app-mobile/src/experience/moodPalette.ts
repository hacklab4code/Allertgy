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
    top: '#F4FDE2',
    mid: '#F8FDF0',
    soft: '#FCFEF9',
    bottom: '#F8FAFC',
    glow: '#E2F7A8',
  },
  green: {
    top: '#ECFDF5',
    mid: '#F0FDF4',
    soft: '#F6FBF8',
    bottom: '#F8FAFC',
    glow: '#A7F3D0',
  },
  yellow: {
    top: '#FFFBEB',
    mid: '#FEF3C7',
    soft: '#FDFBF5',
    bottom: '#F8FAFC',
    glow: '#FDE68A',
  },
  red: {
    top: '#FEF2F2',
    mid: '#FEE2E2',
    soft: '#FDF7F7',
    bottom: '#F8FAFC',
    glow: '#FECACA',
  },
};

export const MOOD_PALETTES_DARK: Record<ExperienceMood, MoodPalette> = {
  brand: {
    top: '#736B98',
    mid: '#645B88',
    soft: '#59507C',
    bottom: '#504771',
    glow: '#DDD6FE',
  },
  green: {
    top: '#2D7F67',
    mid: '#236E58',
    soft: '#1B5B49',
    bottom: '#2F4840',
    glow: '#A7F3D0',
  },
  yellow: {
    top: '#B46C26',
    mid: '#9E5B1D',
    soft: '#7E4612',
    bottom: '#4E3F32',
    glow: '#FEF08A',
  },
  red: {
    top: '#CC2E2E',
    mid: '#AC2323',
    soft: '#8D1B1B',
    bottom: '#503338',
    glow: '#FECDD3',
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
