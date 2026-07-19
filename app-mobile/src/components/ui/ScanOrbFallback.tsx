/**
 * Fallback 2D della sfera scan — palette semaforo animata come BlobSphereGL.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const PALETTES = [
  ['#6EE7B7', '#34D399', '#059669'],
  ['#FDE68A', '#FBBF24', '#D97706'],
  ['#FCA5A5', '#F87171', '#DC2626'],
] as const;

function ColorLayer({
  palette,
  index,
  phase,
  size,
}: {
  palette: readonly [string, string, string];
  index: number;
  phase: SharedValue<number>;
  size: number;
}) {
  const layerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      phase.value,
      [index - 0.5, index, index + 0.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, layerStyle]}>
      <LinearGradient
        colors={[...palette]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
}

type Props = { size: number };

export function ScanOrbFallback({ size }: Props) {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(3, { duration: 8800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [phase]);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.sin(phase.value * Math.PI * 2) * 0.035 }],
  }));

  return (
    <Animated.View
      style={[
        styles.wrap,
        shellStyle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {PALETTES.map((palette, index) => (
        <ColorLayer key={index} palette={palette} index={index} phase={phase} size={size} />
      ))}
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.42,
            height: size * 0.22,
            borderRadius: size * 0.2,
            top: size * 0.12,
            left: size * 0.16,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 16,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    borderTopColor: 'rgba(255,255,255,0.92)',
  },
});
