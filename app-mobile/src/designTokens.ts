/**
 * Bridge unico: design_guidelines.json → token TypeScript.
 * Non duplicare valori qui — aggiungili al JSON e mappa qui sotto.
 */
import guidelines from '../design_guidelines.json' with { type: 'json' };

const { color: c, verdict: v, spacing: s, radius_tokens: r, shadow: sh, fonts: f } = guidelines;

/** Palette puffy derivata dal Sacro Graal JSON */
export const puffyColors = {
  surface: c.surface,
  surfaceSecondary: c.surfaceSecondary,
  surfaceTertiary: c.surfaceTertiary,
  onSurface: c.onSurface,
  onSurfaceMuted: c.onSurfaceMuted,
  surfaceInverse: c.surfaceInverse,
  onSurfaceInverse: c.onSurfaceInverse,
  brand: c.brand,
  brandSecondary: c.brandSecondary,
  brandTertiary: c.brandTertiary,
  onBrand: c.onBrand,
  green: v.green.solid,
  greenSoft: v.green.soft,
  onGreen: v.green.on,
  yellow: v.yellow.solid,
  yellowSoft: v.yellow.soft,
  onYellow: v.yellow.on,
  red: v.red.solid,
  redSoft: v.red.soft,
  onRed: v.red.on,
  border: c.border,
  borderStrong: c.borderStrong,
  shadow: sh.color,
  overlay: c.overlay,
  white: c.white,
  bg: c.surface,
  ink: c.ink,
  inkSoft: c.inkSoft,
  textSecondary: c.textSecondary,
  textMuted: c.textMuted,
  surfaceAlt: c.surfaceTertiary,
  brandDark: c.brandDark,
  brandDarker: c.brandDarker,
  brandInk: c.brandInk,
  cosmic: c.cosmic ?? '#23212C',
  vanilla: c.vanilla ?? '#F1FEC8',
  brand50: c.brand50,
  brand100: c.brand100,
  brand200: c.brand200,
  brand300: c.brand300,
  greenBg: v.green.soft,
  greenBorder: v.green.border,
  greenText: v.green.on,
  amber: v.yellow.solid,
  amberBg: v.yellow.soft,
  amberBorder: v.yellow.border,
  amberText: v.yellow.on,
  redBg: v.red.soft,
  redBorder: v.red.border,
  redText: v.red.on,
} as const;

export type PuffyColorKey = keyof typeof puffyColors;

export const tokenSpacing = {
  xs: s.xs,
  sm: s.sm,
  md: s.md,
  lg: s.lg,
  xl: s.xl,
  '2xl': s['2xl'],
  '3xl': s['3xl'],
  /** @deprecated usa `2xl` — alias per retrocompatibilità */
  xxl: s['2xl'],
  /** @deprecated usa `3xl` — alias per retrocompatibilità */
  xxxl: s['3xl'],
} as const;

export const tokenRadius = {
  sm: r.sm,
  md: r.md,
  lg: r.lg,
  xl: r.xl,
  pill: r.pill,
} as const;

export const tokenFonts = {
  displayMedium: f.displayMedium,
  displaySemibold: f.displaySemibold,
  displayBold: f.displayBold,
  regular: f.regular,
  semibold: f.semibold,
  bold: f.bold,
} as const;

export const tokenShadow = {
  color: sh.color,
  cardElevation: sh.cardElevation,
  raisedElevation: sh.raisedElevation,
  defaultElevation: sh.defaultElevation,
  puffyOpacity: sh.puffyOpacity ?? 0.12,
  puffyRadius: sh.puffyRadius ?? 12,
  puffyOffsetY: sh.puffyOffsetY ?? 8,
} as const;

export const verdictEmoji = {
  green: v.green.emoji ?? '🟢',
  yellow: v.yellow.emoji ?? '🟡',
  red: v.red.emoji ?? '🔴',
} as const;

export const tokenTypographyScale = guidelines.typography.scale;

/**
 * Semaforo tokens assoluti per AllerTgy
 * 🟢 Safe / Idoneo: #10B981
 * 🟡 Warning / Attenzione: #F59E0B
 * 🔴 Danger / Non idoneo: #EF4444
 */
export const SEMAFORO_TOKENS = {
  safe: {
    key: 'safe',
    solid: '#10B981',
    soft: '#ECFDF5',
    border: '#6EE7B7',
    text: '#065F46',
    label: 'Idoneo',
    sublabel: 'Nessun allergene rilevato',
    emoji: '🟢',
    icon: 'checkmark-circle' as const,
  },
  warning: {
    key: 'warning',
    solid: '#F59E0B',
    soft: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    label: 'Attenzione',
    sublabel: 'Tracce o dati incompleti',
    emoji: '🟡',
    icon: 'alert-circle' as const,
  },
  danger: {
    key: 'danger',
    solid: '#EF4444',
    soft: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    label: 'Non idoneo',
    sublabel: 'Contiene allergeni esclusi',
    emoji: '🔴',
    icon: 'close-circle' as const,
  },
  neutral: {
    key: 'neutral',
    solid: '#64748B',
    soft: '#F1F5F9',
    border: '#CBD5E1',
    text: '#334155',
    label: 'Non verificato',
    sublabel: 'Dati non disponibili',
    emoji: '⚪',
    icon: 'help-circle' as const,
  },
} as const;

export type SemaforoStatus = keyof typeof SEMAFORO_TOKENS;

/**
 * Normalizza qualsiasi input status in uno stato semaforico canonico
 */
export function normalizeSemaforoStatus(status?: string | null): SemaforoStatus {
  if (!status) return 'neutral';
  const s = status.toLowerCase().trim();
  if (s === 'safe' || s === 'green' || s === 'verde' || s === 'ok' || s === 'idoneo') return 'safe';
  if (s === 'warning' || s === 'yellow' || s === 'giallo' || s === 'amber' || s === 'attenzione') return 'warning';
  if (s === 'danger' || s === 'red' || s === 'rosso' || s === 'error' || s === 'non idoneo' || s === 'vietato') return 'danger';
  return 'neutral';
}

/** Brand Action standard (Cosmic #23212C + Vanilla #F1FEC8) */
export const BRAND_TOKENS = {
  primary: '#23212C',
  primaryHover: '#191820',
  dark: '#191820',
  darker: '#121118',
  hover: '#191820',
  light: '#F1FEC8',
  surface: '#F7FEE7',
  soft: '#F1FEC8',
  border: '#E2F4A6',
  borderStrong: '#23212C',
  text: '#23212C',
  ink: '#23212C',
  cosmic: '#23212C',
  vanilla: '#F1FEC8',
  lavender: '#F1FEC8',
  premiumGradient: ['#121118', '#23212C', '#353344'] as const,
  vanillaGradient: ['#F1FEC8', '#E6F8AB', '#D8F18C'] as const,
} as const;

/** Token Esatti Glassmorphism da css.glass */
export const CSS_GLASS = {
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 16,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(5px)',
  webkitBackdropFilter: 'blur(5px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  blurIntensity: 60,
} as const;

export const COSMIC_GLASS = {
  hex: '#23212C',
  rgb: '35, 33, 44',
  background: 'rgba(35, 33, 44, 0.82)',
  border: 'rgba(255, 255, 255, 0.15)',
  borderHighlight: 'rgba(241, 254, 200, 0.35)',
  borderRadius: 16,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
  blur: '5px',
  blurIntensity: 60,
} as const;

export const VANILLA_GLASS = {
  hex: '#F1FEC8',
  rgb: '241, 254, 200',
  background: 'rgba(241, 254, 200, 0.60)',
  border: 'rgba(255, 255, 255, 0.40)',
  borderDark: 'rgba(35, 33, 44, 0.08)',
  borderHighlight: 'rgba(255, 255, 255, 0.85)',
  borderRadius: 16,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  blur: '5px',
  blurIntensity: 60,
} as const;

/** Esporta il JSON grezzo per tooling / documentazione */
export const designGuidelines = guidelines;

