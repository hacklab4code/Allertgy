/**
 * Bridge unico: design_guidelines.json → token TypeScript.
 * Non duplicare valori qui — aggiungili al JSON e mappa qui sotto.
 */
import guidelines from '../design_guidelines.json';

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

/** Esporta il JSON grezzo per tooling / documentazione */
export const designGuidelines = guidelines;
