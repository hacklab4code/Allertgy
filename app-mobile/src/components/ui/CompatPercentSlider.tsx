import React, { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = {
  value: number;
  onChange: (v: number) => void;
  isIt?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  resultCount?: number;
  resultLabel?: string;
};

const THUMB = 26;
const TRACK_H = 2;
const STEP = 5;
const SPRING = { damping: 24, stiffness: 320, mass: 0.65 };

/** Stile range CSS + palette semaforo AllerTgy */
const G = {
  red: colors.red,
  amber: colors.amber,
  green: colors.green,
  thumb: '#1d1c25',
} as const;

function borderFor(percent: number): string {
  if (percent >= 70) return G.green;
  if (percent >= 50) return G.amber;
  if (percent > 0) return G.red;
  return G.red;
}

/** Slider compatibilità — track 2px a gradiente semaforo, thumb dark con bordo color-shift. */
export function CompatPercentSlider({
  value,
  onChange,
  isIt = true,
  onClear,
  clearLabel,
  resultCount,
  resultLabel,
}: Props) {
  const trackW = useSharedValue(0);
  const progress = useSharedValue(value);
  const lastHaptic = useRef(value);
  const border = borderFor(value);
  const active = value > 0;

  useEffect(() => {
    progress.value = withSpring(value, SPRING);
  }, [value, progress]);

  const statusLabel =
    value <= 0
      ? (isIt ? 'Qualsiasi' : 'Any')
      : (isIt ? `Almeno ${value}%` : `At least ${value}%`);

  const results =
    resultLabel
    ?? (resultCount == null
      ? null
      : resultCount === 1
        ? (isIt ? '1 locale' : '1 venue')
        : (isIt ? `${resultCount} locali` : `${resultCount} venues`));

  const emit = (next: number) => {
    if (next !== lastHaptic.current && next % 10 === 0) {
      void Haptics.selectionAsync();
    }
    lastHaptic.current = next;
    onChange(next);
  };

  const setFromX = (x: number) => {
    'worklet';
    const w = trackW.value;
    if (w <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    const next = Math.round((ratio * 100) / STEP) * STEP;
    progress.value = next;
    runOnJS(emit)(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));

  const tap = Gesture.Tap().onEnd((e) => setFromX(e.x));
  const gesture = Gesture.Exclusive(pan, tap);

  const thumbStyle = useAnimatedStyle(() => {
    const w = trackW.value;
    const travel = Math.max(0, w - THUMB);
    const left = w <= 0 ? 0 : (progress.value / 100) * travel;
    const borderColor = interpolateColor(
      progress.value,
      [0, 45, 50, 65, 70, 100],
      [G.red, G.red, G.amber, G.amber, G.green, G.green],
    );
    return {
      transform: [{ translateX: left }],
      borderColor,
    };
  });

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText style={styles.eyebrow}>
          {isIt ? 'Compatibilità' : 'Compatibility'}
        </AppText>

        <View style={styles.headerRight}>
          <View style={[styles.valuePill, { borderColor: border }]}>
            <View style={[styles.valueDot, { backgroundColor: border }]} />
            <AppText style={[styles.valueText, { color: border }]}>
              {statusLabel}
            </AppText>
          </View>
          {active && onClear ? (
            <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
              <AppText style={styles.clearText}>
                {clearLabel ?? (isIt ? 'Azzera' : 'Reset')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          style={styles.trackWrap}
          onLayout={onTrackLayout}
          accessibilityRole="adjustable"
          accessibilityLabel={isIt ? 'Compatibilità minima' : 'Minimum compatibility'}
          accessibilityValue={{ min: 0, max: 100, now: value }}
        >
          <LinearGradient
            colors={[G.red, G.amber, G.green]}
            locations={[0, 0.5, 0.7]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientTrack}
          />

          <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>

      <View style={styles.meta}>
        <AppText style={styles.metaEdge}>0%</AppText>
        {results ? (
          <AppText style={styles.metaCenter}>{results}</AppText>
        ) : (
          <View />
        )}
        <AppText style={[styles.metaEdge, styles.metaEdgeRight]}>100%</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: {
    fontFamily: font.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    color: colors.onSurfaceMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(29, 28, 37, 0.04)',
    borderWidth: 1,
  },
  valueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  valueText: {
    fontFamily: font.semibold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  clearText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.brand,
  },
  trackWrap: {
    height: 40,
    justifyContent: 'center',
  },
  gradientTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
    backgroundColor: G.thumb,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
    paddingHorizontal: 2,
  },
  metaEdge: {
    fontSize: 10,
    fontFamily: font.regular,
    letterSpacing: 0.2,
    color: colors.textMuted,
    minWidth: 28,
  },
  metaEdgeRight: {
    textAlign: 'right',
  },
  metaCenter: {
    fontSize: 11,
    fontFamily: font.semibold,
    textAlign: 'center',
    color: colors.onSurfaceMuted,
  },
});
