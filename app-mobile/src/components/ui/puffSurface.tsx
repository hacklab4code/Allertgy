/**
 * Superfici condivise — in wireframe: solo bordi neri, niente gloss.
 */
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, puffyShadow, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

export const PUFF = {
  glossTop: 'rgba(255,255,255,0.72)',
  glossMid: 'rgba(255,255,255,0.28)',
  glossEdge: colors.border,
  insetTop: 'rgba(210, 195, 246, 0.16)',
  insetSide: colors.borderStrong,
} as const;

type PuffOpts = {
  elevation?: number;
  r?: number;
  bg?: string;
  borderColor?: string;
};

export function puffRaised({
  elevation = 8,
  r = radius.lg,
  bg = colors.surfaceSecondary,
  borderColor = colors.border,
}: PuffOpts = {}): ViewStyle {
  if (WIREFRAME_MODE) return wireBox({ fill: bg });
  return {
    backgroundColor: bg,
    borderRadius: r,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    ...puffyShadow(elevation),
  };
}

export function puffDebossed({ bg = colors.surfaceTertiary }: PuffOpts = {}): ViewStyle {
  if (WIREFRAME_MODE) return wireBox({ fill: bg, dashed: true });
  return {
    backgroundColor: bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: PUFF.insetSide,
  };
}

/** Bordo a riflesso asimmetrico per elementi 3D lucidi e circolari. */
export function marshmallowGlossBorder(r: number): ViewStyle {
  if (WIREFRAME_MODE) return {};
  return {
    borderRadius: r,
    borderWidth: 1,
    borderColor: colors.border,
  };
}

export function GlossSheen({ intensity = 1 }: { intensity?: number } = {}) {
  if (WIREFRAME_MODE) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.topHighlight, { opacity: 0.55 * Math.max(0, Math.min(1, intensity)) }]}
    />
  );
}

export function TintWash({ color }: { color: string }) {
  if (WIREFRAME_MODE) return null;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: `${color}12` }]}
    />
  );
}

const styles = StyleSheet.create({
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: PUFF.glossTop,
  },
});
