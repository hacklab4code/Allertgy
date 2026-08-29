import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { WIREFRAME_MODE } from '../../theme';
import { MOOD_PALETTES } from '../../experience/moodPalette';
import { useExperienceMood } from '../../store/experienceMood';

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
  const mood = useExperienceMood((s) => s.liveMood ?? s.mood);
  const syncFromHistory = useExperienceMood((s) => s.syncFromHistory);
  const palette = MOOD_PALETTES[mood];
  const moodFade = useSharedValue(1);

  useEffect(() => {
    void syncFromHistory();
  }, [syncFromHistory]);

  useEffect(() => {
    moodFade.value = 0.45;
    moodFade.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [mood, moodFade]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: moodFade.value,
  }));

  if (WIREFRAME_MODE) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bottom }]} />
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
});
