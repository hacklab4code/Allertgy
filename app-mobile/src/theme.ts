/**
 * Design token AllerTgy — deriva da design_guidelines.json via designTokens.ts.
 * WIREFRAME_MODE = true → layout minimale (quadrati + testo) per mappare le sezioni.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';
import {
  puffyColors,
  tokenFonts,
  tokenRadius,
  tokenShadow,
  tokenSpacing,
  verdictEmoji,
} from './designTokens';
import { WIREFRAME_MODE } from './wireframe';

export { WIREFRAME_MODE, wireBox, wireLabel } from './wireframe';
export {
  TAB_BAR_CLEARANCE,
  TAB_BAR_HEIGHT,
  MIN_TOUCH_TARGET,
  CHIP_MIN_HEIGHT,
  SECTION_GAP,
  SCREEN_PADDING_H,
} from './layoutConstants';

const WIREFRAME_COLORS = {
  ...puffyColors,
  surface: '#FFFFFF',
  surfaceSecondary: '#FFFFFF',
  surfaceTertiary: '#F0F0F0',
  onSurface: '#000000',
  onSurfaceMuted: '#444444',
  surfaceInverse: '#000000',
  onSurfaceInverse: '#FFFFFF',
  brand: '#000000',
  brandSecondary: '#EEEEEE',
  brandTertiary: '#DDDDDD',
  onBrand: '#000000',
  green: '#000000',
  greenSoft: '#F5F5F5',
  onGreen: '#000000',
  yellow: '#000000',
  yellowSoft: '#F5F5F5',
  onYellow: '#000000',
  red: '#000000',
  redSoft: '#F5F5F5',
  onRed: '#000000',
  border: '#000000',
  borderStrong: '#000000',
  shadow: 'transparent',
  overlay: 'rgba(0,0,0,0.3)',
  white: '#FFFFFF',
  bg: '#FFFFFF',
  ink: '#000000',
  inkSoft: '#333333',
  textSecondary: '#444444',
  textMuted: '#666666',
  surfaceAlt: '#F5F5F5',
  brandDark: '#000000',
  brandDarker: '#000000',
  brandInk: '#000000',
  brand50: '#F5F5F5',
  brand100: '#EEEEEE',
  brand200: '#DDDDDD',
  brand300: '#CCCCCC',
  greenBg: '#F5F5F5',
  greenBorder: '#000000',
  greenText: '#000000',
  amber: '#000000',
  amberBg: '#F5F5F5',
  amberBorder: '#000000',
  amberText: '#000000',
  redBg: '#F5F5F5',
  redBorder: '#000000',
  redText: '#000000',
} as const;

export const colors = WIREFRAME_MODE ? WIREFRAME_COLORS : puffyColors;

export type Verdict = 'green' | 'yellow' | 'red';

export const verdictColor: Record<
  Verdict,
  { bg: string; soft: string; on: string; border: string; icon: string; emoji: string; label: string }
> = {
  green: {
    bg: colors.green,
    soft: colors.greenSoft,
    on: colors.onGreen,
    border: colors.greenBorder,
    icon: 'checkmark-circle',
    emoji: verdictEmoji.green,
    label: WIREFRAME_MODE ? 'VERDE' : 'Idoneo',
  },
  yellow: {
    bg: colors.yellow,
    soft: colors.yellowSoft,
    on: colors.onYellow,
    border: colors.amberBorder,
    icon: 'alert-circle',
    emoji: verdictEmoji.yellow,
    label: WIREFRAME_MODE ? 'GIALLO' : 'Attenzione',
  },
  red: {
    bg: colors.red,
    soft: colors.redSoft,
    on: colors.onRed,
    border: colors.redBorder,
    icon: 'close-circle',
    emoji: verdictEmoji.red,
    label: WIREFRAME_MODE ? 'ROSSO' : 'Non idoneo',
  },
};

export const spacing = tokenSpacing;

const WIREFRAME_RADIUS = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  pill: 0,
} as const;

export const radius = WIREFRAME_MODE ? WIREFRAME_RADIUS : tokenRadius;

export const font = WIREFRAME_MODE
  ? {
      displayMedium: undefined,
      displaySemibold: undefined,
      displayBold: undefined,
      regular: undefined,
      semibold: undefined,
      bold: undefined,
    }
  : tokenFonts;

function shadowRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Ombra puffy tintata col brand (viola gel) — effetto gommoso premium. */
export const puffyShadow = (elevation = tokenShadow.defaultElevation): ViewStyle => {
  if (WIREFRAME_MODE) return {};
  const scale = elevation / tokenShadow.defaultElevation;
  const opacity = Math.min(0.22, tokenShadow.puffyOpacity + scale * 0.02);
  const radius = tokenShadow.puffyRadius + scale * 2;
  const offsetY = Math.round(tokenShadow.puffyOffsetY * Math.max(0.35, scale * 0.65));
  return Platform.select({
    ios: {
      shadowColor: tokenShadow.color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation: Math.max(2, Math.round(4 + scale * 2)) },
    default: {
      boxShadow: `0px ${offsetY}px ${Math.round(radius)}px ${shadowRgba(tokenShadow.color, opacity)}`,
    } as ViewStyle,
  }) as ViewStyle;
};

/** Glow semaforo — ombra colorata sul verdetto attivo. */
export const verdictGlow = (verdict: Verdict): ViewStyle => {
  if (WIREFRAME_MODE) return {};
  const tint = verdictColor[verdict].bg;
  return Platform.select({
    ios: {
      shadowColor: tint,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {
      boxShadow: `0px 4px 8px ${shadowRgba(tint, 0.3)}`,
    } as ViewStyle,
  }) as ViewStyle;
};

export const shadow = {
  card: puffyShadow(tokenShadow.cardElevation),
  raised: puffyShadow(tokenShadow.raisedElevation),
} as const;

const wfText = (size: number, weight: TextStyle['fontWeight'] = '400'): TextStyle =>
  WIREFRAME_MODE
    ? { fontSize: size, lineHeight: size + 6, fontWeight: weight, color: '#000000' }
    : {};

export const typography = WIREFRAME_MODE
  ? {
      hero: { ...wfText(20, '700') },
      h1: { ...wfText(18, '700') },
      h2: { ...wfText(16, '700') },
      h3: { ...wfText(14, '700') },
      body: { ...wfText(14) },
      bodySm: { ...wfText(13) },
      label: { ...wfText(11, '600') },
      caption: { ...wfText(12) },
    }
  : {
      hero: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, fontWeight: '800' } as TextStyle,
      h1: { fontFamily: font.displayBold, fontSize: 24, lineHeight: 30, fontWeight: '800' } as TextStyle,
      h2: { fontFamily: font.displaySemibold, fontSize: 19, lineHeight: 25, fontWeight: '800' } as TextStyle,
      h3: { fontFamily: font.displaySemibold, fontSize: 16, lineHeight: 22, fontWeight: '700' } as TextStyle,
      body: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, fontWeight: '500' } as TextStyle,
      bodySm: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, fontWeight: '500' } as TextStyle,
      label: { fontFamily: font.displayMedium, fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 0.6 } as TextStyle,
      caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, fontWeight: '600' } as TextStyle,
    };

export function semaforoColors(stato: 'verde' | 'giallo' | 'rosso' | 'grigio') {
  switch (stato) {
    case 'verde':
      return { bg: colors.greenSoft, border: colors.border, text: colors.onSurface, solid: colors.green };
    case 'giallo':
      return { bg: colors.yellowSoft, border: colors.border, text: colors.onSurface, solid: colors.yellow };
    case 'rosso':
      return { bg: colors.redSoft, border: colors.border, text: colors.onSurface, solid: colors.red };
    default:
      return { bg: colors.surfaceTertiary, border: colors.border, text: colors.textMuted, solid: colors.textMuted };
  }
}

export function statoToVerdict(stato: 'verde' | 'giallo' | 'rosso' | 'grigio'): Verdict | 'neutral' {
  if (stato === 'verde') return 'green';
  if (stato === 'giallo') return 'yellow';
  if (stato === 'rosso') return 'red';
  return 'neutral';
}
