import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { WIREFRAME_MODE } from '../../theme';
import { MOOD_PALETTES } from '../../experience/moodPalette';
import { useExperienceMood } from '../../store/experienceMood';

type SparkKind = 'egg' | 'milk' | 'wheat' | 'shrimp' | 'nut' | 'fish' | 'seed' | 'bean';

const MICRO_SPARKS: {
  left: number;
  top: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
  kind: SparkKind;
}[] = [
  { left: 0.12, top: 0.06, size: 16, drift: 6, duration: 7200, delay: 0, kind: 'egg' },
  { left: 0.28, top: 0.11, size: 14, drift: 7, duration: 8000, delay: 400, kind: 'milk' },
  { left: 0.46, top: 0.05, size: 15, drift: 5, duration: 7600, delay: 200, kind: 'wheat' },
  { left: 0.62, top: 0.09, size: 13, drift: 6, duration: 8400, delay: 600, kind: 'shrimp' },
  { left: 0.78, top: 0.055, size: 14, drift: 6, duration: 7000, delay: 150, kind: 'nut' },
  { left: 0.9, top: 0.12, size: 15, drift: 7, duration: 8200, delay: 500, kind: 'fish' },
  { left: 0.18, top: 0.17, size: 13, drift: 5, duration: 7800, delay: 300, kind: 'seed' },
  { left: 0.36, top: 0.2, size: 14, drift: 6, duration: 8600, delay: 700, kind: 'bean' },
  { left: 0.54, top: 0.16, size: 12, drift: 5, duration: 7400, delay: 100, kind: 'egg' },
  { left: 0.7, top: 0.19, size: 14, drift: 6, duration: 8100, delay: 450, kind: 'milk' },
  { left: 0.86, top: 0.175, size: 13, drift: 5, duration: 7900, delay: 250, kind: 'wheat' },
  { left: 0.08, top: 0.13, size: 12, drift: 5, duration: 7500, delay: 350, kind: 'fish' },
];

function OutlineFoodGlyph({
  kind,
  size,
  stroke,
}: {
  kind: SparkKind;
  size: number;
  stroke: string;
}) {
  const sw = Math.max(1.35, size * 0.12);
  const common = {
    stroke,
    strokeWidth: sw,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'egg' ? <Ellipse cx="12" cy="13" rx="6.2" ry="7.6" {...common} /> : null}
      {kind === 'milk' ? (
        <>
          <Path d="M8.5 7.5h7l.8 2.6V18a2 2 0 0 1-2 2h-4.6a2 2 0 0 1-2-2V10.1l.8-2.6z" {...common} />
          <Path d="M9.5 7.5V6.2A1.2 1.2 0 0 1 10.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2v1.3" {...common} />
        </>
      ) : null}
      {kind === 'wheat' ? (
        <>
          <Path d="M12 20.5V8" {...common} />
          <Path d="M12 10c-2-1-3.4-.8-4 .3 1.5.4 2.9 1.2 4 2.4" {...common} />
          <Path d="M12 10c2-1 3.4-.8 4 .3-1.5.4-2.9 1.2-4 2.4" {...common} />
          <Path d="M12 14c-2-1-3.4-.8-4 .3 1.5.4 2.9 1.2 4 2.4" {...common} />
          <Path d="M12 14c2-1 3.4-.8 4 .3-1.5.4-2.9 1.2-4 2.4" {...common} />
        </>
      ) : null}
      {kind === 'shrimp' ? (
        <Path d="M6.5 14c0-3.6 2.7-6.3 6.3-6.3 1.8 0 3.5.9 4.5 2.5-2.6 0-4.4.9-5.3 2.6 2.5-.1 4.3.8 5.2 2.3-3.4.2-6 1.3-6.9 3.5-1.8-1-4-2.6-3.8-4.6z" {...common} />
      ) : null}
      {kind === 'nut' ? (
        <Path d="M12 4.5c2.7 1.8 4.5 4.5 4.5 7.7S14.8 19.5 12 20.5c-2.8-1-4.5-4-4.5-8.3S9.3 6.3 12 4.5z" {...common} />
      ) : null}
      {kind === 'fish' ? (
        <>
          <Path d="M4.5 12c3.6-4.4 8.2-5.3 12.8-3.5-.8 1.8-.8 5.2 0 7-4.6 1.8-9.2.9-12.8-3.5z" {...common} />
          <Path d="M17.3 8.8l2.7-1.8v9.8l-2.7-1.8" {...common} />
          <Circle cx="8.2" cy="11.2" r="0.85" stroke={stroke} strokeWidth={sw} fill="none" />
        </>
      ) : null}
      {kind === 'seed' ? <Ellipse cx="12" cy="12" rx="3.6" ry="6.4" {...common} /> : null}
      {kind === 'bean' ? (
        <Path d="M8.2 7.2c3.5-2.6 8-1 8.9 3.4s-2.6 8-7 7.2-5.4-5.2-1.9-10.6z" {...common} />
      ) : null}
    </Svg>
  );
}

function MicroFoodSpark({
  kind,
  left,
  top,
  size,
  drift,
  duration,
  delay,
  width,
  height,
  stroke,
}: {
  kind: SparkKind;
  left: number;
  top: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
  width: number;
  height: number;
  stroke: string;
}) {
  const progress = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    twinkle.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, duration, progress, twinkle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * -drift },
      { translateX: progress.value * drift * 0.2 },
      { rotate: `${progress.value * 6 - 3}deg` },
      { scale: 0.94 + twinkle.value * 0.14 },
    ],
    opacity: 0.45 + twinkle.value * 0.4,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        animatedStyle,
        {
          left: width * left - size / 2,
          top: height * top,
          width: size,
          height: size,
        },
      ]}
    >
      <OutlineFoodGlyph kind={kind} size={size} stroke={stroke} />
    </Animated.View>
  );
}

/**
 * Gradiente animato dall’alto (non macchie):
 * wash verticale + bloom + alone laterale che respirano.
 */
function LiveGradientWash({
  top,
  mid,
  soft,
  bottom,
  glow,
}: {
  top: string;
  mid: string;
  soft: string;
  bottom: string;
  glow: string;
}) {
  const pulse = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [drift, pulse]);

  const primaryStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.82, 1]),
    transform: [
      { scaleY: interpolate(pulse.value, [0, 1], [0.96, 1.06]) },
      { translateY: interpolate(pulse.value, [0, 1], [0, -8]) },
    ],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.85]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 1], [0.35, 0.65]),
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-18, 18]) },
      { scale: interpolate(drift.value, [0, 1], [1, 1.05]) },
    ],
  }));

  return (
    <>
      {/* Wash principale: violet/semaforo → lavanda → mist, dall’alto */}
      <Animated.View style={[styles.washFixed, primaryStyle]}>
        <LinearGradient
          colors={[top, mid, soft, bottom]}
          locations={[0, 0.28, 0.62, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bloom superiore — intensità che respira */}
      <Animated.View style={[styles.bloomFixed, bloomStyle]}>
        <LinearGradient
          colors={[`${top}E6`, `${mid}99`, `${soft}55`, 'transparent']}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Alone soft laterale — deriva lenta, ancora dall’alto */}
      <Animated.View style={[styles.sideGlow, sideStyle]}>
        <LinearGradient
          colors={['transparent', `${glow}AA`, `${mid}66`, 'transparent']}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}

export function AmbientMesh() {
  const { width, height } = useWindowDimensions();
  const scale = width / 390;
  const mood = useExperienceMood((s) => s.liveMood ?? s.mood);
  const syncFromHistory = useExperienceMood((s) => s.syncFromHistory);
  const palette = MOOD_PALETTES[mood];
  const moodFade = useSharedValue(1);
  const sparks = useMemo(() => MICRO_SPARKS, []);
  const stroke = '#F8F5FD';

  useEffect(() => {
    void syncFromHistory();
  }, [syncFromHistory]);

  useEffect(() => {
    moodFade.value = 0.45;
    moodFade.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [mood, moodFade]);

  const moodStyle = useAnimatedStyle(() => ({ opacity: moodFade.value }));

  if (WIREFRAME_MODE) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bottom }]} />
      <Animated.View style={[StyleSheet.absoluteFill, moodStyle]}>
        <LiveGradientWash
          top={palette.top}
          mid={palette.mid}
          soft={palette.soft}
          bottom={palette.bottom}
          glow={palette.glow}
        />
      </Animated.View>
      {sparks.map((spark, index) => (
        <MicroFoodSpark
          key={index}
          kind={spark.kind}
          left={spark.left}
          top={spark.top}
          size={spark.size * scale}
          drift={spark.drift * scale}
          duration={spark.duration}
          delay={spark.delay}
          width={width}
          height={height}
          stroke={stroke}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', zIndex: 0 },
  washFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  bloomFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
  },
  sideGlow: {
    position: 'absolute',
    top: 0,
    left: '-8%',
    right: '-8%',
    height: '44%',
  },
  spark: { position: 'absolute', zIndex: 2 },
});
