import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
import { MOOD_PALETTES, MOOD_PALETTES_DARK } from '../../experience/moodPalette';
import { useExperienceMood } from '../../store/experienceMood';
import { useIsDarkMode } from '../../hooks/useAppTheme';

const COSMIC_NEBULA_IMAGE = require('../../../assets/cosmic_nebula_bg.jpg');

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
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [drift, pulse]);

  const primaryStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.90, 1]),
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.65]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 1], [0.25, 0.45]),
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-14, 14]) },
    ],
  }));

  return (
    <>
      {/* Wash principale continuo a tutto schermo */}
      <Animated.View style={[StyleSheet.absoluteFill, primaryStyle]}>
        <LinearGradient
          colors={[top, mid, soft, bottom]}
          locations={[0, 0.30, 0.65, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bloom superiore morbido sfumato verso il basso */}
      <Animated.View style={[styles.bloomFixed, bloomStyle]}>
        <LinearGradient
          colors={[`${glow}90`, `${glow}25`, 'transparent']}
          locations={[0, 0.50, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Alone soft laterale */}
      <Animated.View style={[styles.sideGlow, sideStyle]}>
        <LinearGradient
          colors={['transparent', `${glow}35`, 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}

export function AmbientMesh() {
  const isDark = useIsDarkMode();
  const mood = useExperienceMood((s) => s.liveMood ?? s.mood);
  const syncFromHistory = useExperienceMood((s) => s.syncFromHistory);
  const palette = isDark ? MOOD_PALETTES_DARK[mood] : MOOD_PALETTES[mood];
  const moodFade = useSharedValue(1);

  useEffect(() => {
    void syncFromHistory();
  }, [syncFromHistory]);

  useEffect(() => {
    moodFade.value = 0.45;
    moodFade.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [mood, isDark, moodFade]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: moodFade.value,
  }));

  if (WIREFRAME_MODE) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bottom }]} />
      {/* Texture sottile Nebulosa Cosmica & Stelle nello sfondo globale */}
      <Image
        source={COSMIC_NEBULA_IMAGE}
        style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
        resizeMode="cover"
      />
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <LiveGradientWash
          top={palette.top}
          mid={palette.mid}
          soft={palette.soft}
          bottom={palette.bottom}
          glow={palette.glow}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', zIndex: 0 },
  bloomFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  sideGlow: {
    position: 'absolute',
    top: 0,
    left: '-10%',
    right: '-10%',
    height: '65%',
  },
});
