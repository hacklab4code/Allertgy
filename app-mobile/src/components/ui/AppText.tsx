import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, font, WIREFRAME_MODE } from '../../theme';
import { useIsDarkMode } from '../../hooks/useAppTheme';

type Variant =
  | 'h1'
  | 'h2'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'eyebrow'
  | 'metric';

const wfVariants: Record<Variant, TextStyle> = {
  h1: { fontSize: 18, fontWeight: '700', color: '#000' },
  h2: { fontSize: 16, fontWeight: '700', color: '#000' },
  title: { fontSize: 15, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 13, fontWeight: '400', color: '#444' },
  body: { fontSize: 14, fontWeight: '400', color: '#000' },
  bodyBold: { fontSize: 14, fontWeight: '700', color: '#000' },
  caption: { fontSize: 12, fontWeight: '400', color: '#666' },
  label: { fontSize: 12, fontWeight: '600', color: '#000' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#444', textTransform: 'uppercase' },
  metric: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: '#000' },
};

const appVariants: Record<Variant, TextStyle> = {
  h1: { fontFamily: font.displayBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.7, color: colors.onSurface },
  h2: { fontFamily: font.displaySemibold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: colors.onSurface },
  title: { fontFamily: font.displaySemibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: colors.onSurface },
  subtitle: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: colors.onSurfaceMuted },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: colors.onSurface },
  bodyBold: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, color: colors.onSurface },
  caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: colors.onSurfaceMuted },
  label: { fontFamily: font.displayMedium, fontSize: 13, lineHeight: 17, color: colors.onSurface },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.onSurfaceMuted,
  },
  metric: {
    fontFamily: font.displayBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: colors.onSurface,
  },
};

const appVariantsDark: Record<Variant, TextStyle> = {
  h1: { fontFamily: font.displayBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.7, color: '#FFFFFF' },
  h2: { fontFamily: font.displaySemibold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: '#FFFFFF' },
  title: { fontFamily: font.displaySemibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: '#FFFFFF' },
  subtitle: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: '#CBD5E1' },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  bodyBold: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, color: '#FFFFFF' },
  caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, color: '#CBD5E1' },
  label: { fontFamily: font.displayMedium, fontSize: 13, lineHeight: 17, color: '#FFFFFF' },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#F1FEC8',
  },
  metric: {
    fontFamily: font.displayBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
};

type Props = TextProps & { variant?: Variant; color?: string };

function resolveDarkColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  if (
    color === colors.onSurface ||
    color === colors.brandInk ||
    color === colors.ink ||
    color === '#0F172A' ||
    color === '#23212C' ||
    color === '#1F2937' ||
    color === '#000000'
  ) {
    return '#FFFFFF';
  }
  if (
    color === colors.onSurfaceMuted ||
    color === colors.textSecondary ||
    color === colors.textMuted ||
    color === colors.inkSoft ||
    color === '#64748B' ||
    color === '#475569'
  ) {
    return '#CBD5E1';
  }
  return color;
}

export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const isDark = useIsDarkMode();
  const variants = WIREFRAME_MODE ? wfVariants : (isDark ? appVariantsDark : appVariants);
  const resolvedColor = isDark ? resolveDarkColor(color) : color;
  return <Text style={[variants[variant], style, resolvedColor ? { color: resolvedColor } : null]} {...rest} />;
}

export const appTextVariants = WIREFRAME_MODE ? wfVariants : appVariants;
