import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Riflesso liquido animato — sweep di luce sul vetro. */
export function LiquidGlassSheen({ wide = false }: { wide?: boolean }) {
  const { width } = useWindowDimensions();
  const sweep = useSharedValue(-width * 0.6);

  useEffect(() => {
    sweep.value = withRepeat(
      withSequence(
        withTiming(width * 1.4, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-width * 0.6, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [sweep, width]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value }, { skewX: '-16deg' }],
  }));

  return (
    <View pointerEvents="none" style={styles.clip}>
      <Animated.View style={[styles.sheenTrack, wide && styles.sheenTrackWide, sheenStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.62)',
            'rgba(255,255,255,0.22)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Macchia caustica — luce concentrata nel vetro. */
export function LiquidGlassCaustic({ offset = 'left' }: { offset?: 'left' | 'right' | 'center' }) {
  const anchor =
    offset === 'right'
      ? { right: '8%' as const, top: '6%' as const }
      : offset === 'center'
        ? { left: '36%' as const, top: '4%' as const }
        : { left: '8%' as const, top: '10%' as const };

  return (
    <View pointerEvents="none" style={[styles.caustic, anchor]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 4,
  },
  sheenTrack: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 120,
    opacity: 0.9,
  },
  sheenTrackWide: { width: 160 },
  caustic: {
    position: 'absolute',
    width: 96,
    height: 48,
    borderRadius: 48,
    opacity: 0.62,
    transform: [{ rotate: '-22deg' }],
    zIndex: 3,
  },
});
