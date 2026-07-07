/**
 * Design token condivisi dell'app cliente AllerTgy.
 * Un'unica fonte per colori, spaziature, raggi, ombre e tipografia:
 * tutte le schermate devono usare questi valori invece di hex sparsi,
 * così l'interfaccia resta coerente e riconoscibile.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

/** Verde brand (scala emerald) + semaforo + neutri. */
export const colors = {
  // Brand
  brand: '#059669',       // azione primaria
  brandDark: '#047857',
  brandDarker: '#065f46',
  brandInk: '#0B5D4D',    // testo/logo scuro
  brand50: '#ecfdf5',
  brand100: '#d1fae5',
  brand200: '#a7f3d0',
  brand300: '#6ee7b7',

  // Semaforo (idoneo / attenzione / non idoneo)
  green: '#16a34a',
  greenBg: '#ecfdf5',
  greenBorder: '#a7f3d0',
  greenText: '#047857',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
  amberBorder: '#fde68a',
  amberText: '#b45309',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  redText: '#b91c1c',

  // Neutri (scala slate)
  bg: '#f6f8fa',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e7ecf1',
  borderStrong: '#d5dee6',
  ink: '#0f172a',        // testo primario
  inkSoft: '#334155',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Ombre morbide e coerenti (leggere su iOS, elevation su Android). */
export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  raised: Platform.select({
    ios: {
      shadowColor: '#065f46',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 5 },
    default: {},
  }) as ViewStyle,
} as const;

export const typography = {
  hero: { fontSize: 28, lineHeight: 34, fontWeight: '800' } as TextStyle,
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800' } as TextStyle,
  h2: { fontSize: 19, lineHeight: 25, fontWeight: '800' } as TextStyle,
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '700' } as TextStyle,
  body: { fontSize: 14.5, lineHeight: 21, fontWeight: '500' } as TextStyle,
  bodySm: { fontSize: 13, lineHeight: 19, fontWeight: '500' } as TextStyle,
  label: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 0.6 } as TextStyle,
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' } as TextStyle,
} as const;

/** Colori di supporto per uno stato del semaforo. */
export function semaforoColors(stato: 'verde' | 'giallo' | 'rosso' | 'grigio') {
  switch (stato) {
    case 'verde':
      return { bg: colors.greenBg, border: colors.greenBorder, text: colors.greenText, solid: colors.green };
    case 'giallo':
      return { bg: colors.amberBg, border: colors.amberBorder, text: colors.amberText, solid: colors.amber };
    case 'rosso':
      return { bg: colors.redBg, border: colors.redBorder, text: colors.redText, solid: colors.red };
    default:
      return { bg: colors.surfaceAlt, border: colors.border, text: colors.textMuted, solid: colors.textMuted };
  }
}
