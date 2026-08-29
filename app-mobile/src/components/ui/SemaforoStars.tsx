import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { font } from '../../theme';

/** Font Awesome solid star — stesso path del rating CSS. */
const STAR_PATH =
  'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z';

const EMPTY = '#666666';

/** Colori checked del rating CSS (#star1…#star5). */
const TIER_COLOR = {
  1: '#ef4444',
  2: '#e06c2b',
  3: '#eab308',
  4: '#19c37d',
  5: '#ab68ff',
} as const;

type Props = {
  value: number;
  starSize?: number;
  showValue?: boolean;
  compact?: boolean;
};

function tierColor(v: number): string {
  if (v <= 0) return EMPTY;
  const tier = Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5;
  return TIER_COLOR[tier];
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 576 512">
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

/**
 * Stelle stile rating CSS: fill #666 vuote, colore tier sul voto
 * (1 rosso → 5 viola), path star pieno.
 */
export function SemaforoStars({
  value,
  starSize = 16,
  showValue = true,
  compact = false,
}: Props) {
  const size = compact ? 14 : starSize;
  const gap = compact ? 4 : 5;
  const clamped = Math.max(0, Math.min(5, value));
  const tint = tierColor(clamped);
  const label = Number.isFinite(value) ? value.toFixed(1) : null;

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="image"
      accessibilityLabel={label ? `${label} su 5 stelle` : 'Valutazione'}
    >
      <View style={[styles.track, { gap }]}>
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, clamped - i));
          return (
            <View key={i} style={{ width: size, height: size }}>
              <View style={styles.base}>
                <StarIcon size={size} color={EMPTY} />
              </View>
              {fill > 0 ? (
                <View style={[styles.fillClip, { width: size * fill, height: size }]}>
                  <StarIcon size={size} color={tint} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {showValue && label ? (
        <Text style={[styles.value, compact && styles.valueCompact, { color: tint }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wrapCompact: {
    gap: 6,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  base: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  fillClip: {
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  value: {
    fontFamily: font.displayBold,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: -0.35,
    fontWeight: '800',
    minWidth: 24,
  },
  valueCompact: {
    fontSize: 12,
    lineHeight: 14,
    minWidth: 20,
  },
});
