/**
 * Superfici Violet Precision — flat bordered, gloss minimo.
 */
import { ViewStyle } from 'react-native';
import { colors, radius, softShadow, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

export const SURFACE = {
  glossTop: 'rgba(255,255,255,0.28)',
  glossMid: 'transparent',
  glossEdge: colors.border,
  insetTop: 'transparent',
  insetSide: colors.border,
} as const;

type SurfaceOpts = {
  elevation?: number;
  r?: number;
  bg?: string;
  borderColor?: string;
};

/** Card flat: bianco + bordo #E6DFF5 + ombra quasi assente. */
export function surfaceRaised({
  elevation = 1,
  r = radius.md,
  bg = colors.surfaceSecondary,
  borderColor = colors.border,
}: SurfaceOpts = {}): ViewStyle {
  if (WIREFRAME_MODE) return wireBox({ fill: bg });
  return {
    backgroundColor: bg,
    borderRadius: r,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    ...softShadow(elevation),
  };
}

export function surfaceDebossed({ bg = colors.surfaceTertiary }: SurfaceOpts = {}): ViewStyle {
  if (WIREFRAME_MODE) return wireBox({ fill: bg, dashed: true });
  return {
    backgroundColor: bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: SURFACE.insetSide,
  };
}

export function surfaceBorder(r: number): ViewStyle {
  if (WIREFRAME_MODE) return {};
  return {
    borderRadius: r,
    borderWidth: 1,
    borderColor: colors.border,
  };
}

/** Highlight spento — Violet Precision non usa gloss sulle superfici. */
export function GlossSheen(_props: { intensity?: number } = {}) {
  return null;
}

/** Wash semaforo disabilitato sulle card contenuto. */
export function TintWash(_props: { color: string }) {
  return null;
}
