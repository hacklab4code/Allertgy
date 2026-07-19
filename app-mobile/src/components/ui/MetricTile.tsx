import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import type { PuffyTint } from './PuffyCard';

type Props = {
  value: string | number;
  label: string;
  detail?: string;
  tint?: PuffyTint;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/** Numero operativo in primo piano, su superficie puffy. */
export function MetricTile({
  value,
  label,
  detail,
  tint = 'none',
  accent = colors.brand,
  style,
}: Props) {
  return (
    <View style={style}>
      <GlassCard style={styles.card} padded tint={tint}>
        <View style={styles.topLine}>
          <View style={[styles.signal, { backgroundColor: accent }]} />
          {detail ? (
            <AppText variant="caption" color={colors.onSurfaceMuted}>
              {detail}
            </AppText>
          ) : null}
        </View>
        <AppText variant="metric" color={accent} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.label}>
          {label}
        </AppText>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 138,
    justifyContent: 'space-between',
  },
  topLine: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  signal: {
    width: 28,
    height: 5,
    borderRadius: 999,
  },
  label: {
    lineHeight: 16,
    minHeight: 32,
  },
});
