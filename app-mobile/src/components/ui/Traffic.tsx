import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  colors,
  font,
  radius,
  spacing,
  puffyShadow,
  verdictGlow,
  Verdict,
  verdictColor,
  WIREFRAME_MODE,
} from '../../theme';
import { verdictEmoji } from '../../designTokens';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { GlossSheen } from './puffSurface';

type VerdictLike = Verdict | 'neutral';

function verdictFromStato(stato: 'verde' | 'giallo' | 'rosso' | 'grigio'): VerdictLike {
  if (stato === 'verde') return 'green';
  if (stato === 'giallo') return 'yellow';
  if (stato === 'rosso') return 'red';
  return 'neutral';
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const v = verdictColor[verdict];
  if (WIREFRAME_MODE) {
    return (
      <View style={styles.wfHeroWrap}>
        <View style={[wireBox({ fill: '#000' }), styles.wfHero]}>
          <AppText variant="h1" style={{ color: '#FFF' }}>{v.label}</AppText>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.heroWrap}>
      <View
        style={[
          styles.hero,
          { backgroundColor: v.bg },
          puffyShadow(12),
          verdictGlow(verdict),
        ]}
      >
        <GlossSheen intensity={1} />
        <AppText style={styles.heroEmoji}>{verdictEmoji[verdict]}</AppText>
      </View>
      <AppText variant="h1" style={{ color: v.on, marginTop: spacing.md }}>{v.label}</AppText>
    </View>
  );
}

export function VerdictPill({
  verdict,
  label,
  size = 'sm',
  uppercase = true,
  testID,
}: {
  verdict: VerdictLike;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
  testID?: string;
}) {
  const displayLabel = label ?? (verdict !== 'neutral' ? verdictColor[verdict].label : '—');
  const text = uppercase ? displayLabel.toUpperCase() : displayLabel;

  if (WIREFRAME_MODE) {
    const tag = verdict === 'green' ? 'V' : verdict === 'yellow' ? 'G' : verdict === 'red' ? 'R' : '·';
    return (
      <View style={[wireBox(), styles.wfChip, sizeStyles[size]]} testID={testID}>
        <AppText variant="caption">[{tag}] {text}</AppText>
      </View>
    );
  }

  if (verdict === 'neutral') {
    return (
      <View style={[styles.pill, styles.pillNeutral, sizeStyles[size]]} testID={testID}>
        <AppText style={[styles.pillText, styles.pillTextNeutral, textSizeStyles[size]]}>{text}</AppText>
      </View>
    );
  }

  const v = verdictColor[verdict];
  const dotSize = size === 'lg' ? 10 : size === 'md' ? 9 : 8;
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: v.soft, borderColor: v.border ?? v.bg },
        sizeStyles[size],
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.pillDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: v.bg,
          },
        ]}
      />
      <AppText style={[styles.pillText, { color: v.on }, textSizeStyles[size]]}>{text}</AppText>
    </View>
  );
}

export function TrafficChip({
  verdict,
  label,
  testID,
}: {
  verdict: VerdictLike;
  label: string;
  testID?: string;
}) {
  return <VerdictPill verdict={verdict} label={label} size="md" testID={testID} />;
}

export function TrafficDot({ verdict, size = 14 }: { verdict: Verdict; size?: number }) {
  if (WIREFRAME_MODE) {
    const tag = verdict === 'green' ? 'V' : verdict === 'yellow' ? 'G' : 'R';
    return (
      <View style={[wireBox({ fill: '#000' }), { width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }]}>
        <AppText style={{ fontSize: 8, color: '#FFF' }}>{tag}</AppText>
      </View>
    );
  }
  const v = verdictColor[verdict];
  const ring = size + 6;
  return (
    <View style={[styles.dotRing, { width: ring, height: ring, backgroundColor: v.soft }]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: v.bg,
          borderWidth: 2,
          borderColor: colors.surfaceSecondary,
        }}
      />
    </View>
  );
}

export function MatchChip({
  label,
  severity = 'red',
  testID,
}: {
  label: string;
  severity?: 'red' | 'yellow';
  testID?: string;
}) {
  const palette = severity === 'yellow'
    ? { bg: colors.yellowSoft, border: colors.amberBorder, text: colors.amberText }
    : { bg: colors.redSoft, border: colors.redBorder, text: colors.redText };

  if (WIREFRAME_MODE) {
    return (
      <View style={[wireBox(), styles.matchChip, styles.wfChip]} testID={testID}>
        <AppText variant="caption">{label}</AppText>
      </View>
    );
  }

  return (
    <View
      style={[styles.matchChip, { backgroundColor: palette.bg, borderColor: palette.border }]}
      testID={testID}
    >
      <AppText style={[styles.matchChipText, { color: palette.text }]}>{label}</AppText>
    </View>
  );
}

export function CountBadge({
  count,
  tint = 'brand',
  testID,
}: {
  count: string | number;
  tint?: 'brand' | 'green' | 'yellow' | 'red';
  testID?: string;
}) {
  const palette = {
    brand: { bg: colors.brand50, border: colors.brand200, text: colors.brand },
    green: { bg: colors.greenSoft, border: colors.greenBorder, text: colors.onGreen },
    yellow: { bg: colors.yellowSoft, border: colors.amberBorder, text: colors.amberText },
    red: { bg: colors.redSoft, border: colors.redBorder, text: colors.redText },
  }[tint];

  if (WIREFRAME_MODE) {
    return (
      <View style={[wireBox(), styles.countBadge]} testID={testID}>
        <AppText variant="caption">{count}</AppText>
      </View>
    );
  }

  return (
    <View
      style={[styles.countBadge, { backgroundColor: palette.bg, borderColor: palette.border }]}
      testID={testID}
    >
      <AppText style={[styles.countBadgeText, { color: palette.text }]}>{count}</AppText>
    </View>
  );
}

export function StatoVerdictPill({
  stato,
  label,
  size = 'sm',
  testID,
}: {
  stato: 'verde' | 'giallo' | 'rosso' | 'grigio';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}) {
  return (
    <VerdictPill
      verdict={verdictFromStato(stato)}
      label={label}
      size={size}
      testID={testID}
    />
  );
}

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 4, paddingHorizontal: 8, gap: 5 },
  md: { paddingVertical: 6, paddingHorizontal: 10, gap: 6 },
  lg: { paddingVertical: 8, paddingHorizontal: 12, gap: 7 },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: 9, letterSpacing: 0.5 },
  md: { fontSize: 11, letterSpacing: 0.4 },
  lg: { fontSize: 12.5, letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  wfHeroWrap: { alignItems: 'center' },
  wfHero: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  wfChip: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10 },
  heroWrap: { alignItems: 'center' },
  hero: {
    width: 132,
    height: 132,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 56, zIndex: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  pillNeutral: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  pillDot: {
    flexShrink: 0,
  },
  pillText: { fontFamily: font.bold, fontWeight: '800' },
  pillTextNeutral: { color: colors.onSurfaceMuted },
  dotRing: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
  },
  matchChipText: {
    fontFamily: font.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  countBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '800',
  },
});
