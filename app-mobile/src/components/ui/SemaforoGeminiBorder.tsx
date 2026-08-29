import React, { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius as themeRadius } from '../../theme';

export type SemaforoGeminiKind = 'semaforo' | 'verde' | 'giallo' | 'rosso';

type Props = {
  children: ReactNode;
  /** `semaforo` = rainbow verde→giallo→rosso; altrimenti tinta sezione */
  kind?: SemaforoGeminiKind;
  active?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  pauseMs?: number;
  passMs?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  fill?: string;
};

/** Colori saturi — niente pastelli, niente viola. */
const RAINBOW = [
  '#22C55E',
  '#4ADE80',
  '#FBBF24',
  '#F59E0B',
  '#EF4444',
  '#F87171',
  '#22C55E',
] as const;

const KIND_RAINBOW: Record<SemaforoGeminiKind, readonly string[]> = {
  semaforo: RAINBOW,
  verde: ['#86EFAC', '#22C55E', '#16A34A', '#4ADE80', '#86EFAC'],
  giallo: ['#FDE68A', '#FBBF24', '#F59E0B', '#FCD34D', '#FDE68A'],
  rosso: ['#FECACA', '#EF4444', '#DC2626', '#F87171', '#FECACA'],
};

/**
 * Bordo Gemini vero: disco colorato che ruota dietro un “buco”
 * opaco — resta solo l’anello rainbow (verde / giallo / rosso).
 */
export function SemaforoGeminiBorder({
  children,
  kind = 'semaforo',
  active = true,
  borderRadius = themeRadius.lg,
  borderWidth = 2.5,
  pauseMs = 4500,
  passMs = 1400,
  style,
  contentStyle,
  fill = colors.surfaceSecondary,
}: Props) {
  const spin = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  useEffect(() => {
    cancelAnimation(spin);
    spin.value = 0;
    if (!active) return;

    // Rotazione continua e fluida del bordo Gemini
    spin.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(spin);
  }, [active, spin]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const stops = KIND_RAINBOW[kind];
  const innerRadius = Math.max(0, borderRadius - borderWidth);
  const disc = Math.max(size.w, size.h) * 2.2 || 280;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.wrap,
        {
          borderRadius,
          padding: active ? borderWidth : 0,
          borderWidth: active ? 0 : 1.5,
          borderColor: 'rgba(26,26,26,0.14)',
        },
        style,
      ]}
    >
      {active && size.w > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.disc,
            {
              width: disc,
              height: disc,
              top: (size.h - disc) / 2,
              left: (size.w - disc) / 2,
            },
            discStyle,
          ]}
        >
          <LinearGradient
            colors={stops as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.content,
          {
            borderRadius: active ? innerRadius : borderRadius - 1,
            backgroundColor: fill,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** Sweep su barra sezione — tinta idoneità, scorrimento fluido e continuo. */
export function SemaforoSectionShimmer({
  kind,
  active = true,
  height = 4,
  width,
  borderRadius = 2,
  style,
}: {
  kind: Exclude<SemaforoGeminiKind, 'semaforo'>;
  active?: boolean;
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  pauseMs?: number;
  passMs?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const trackW = useSharedValue(40);
  const solid =
    kind === 'verde' ? '#22C55E' : kind === 'giallo' ? '#FBBF24' : '#EF4444';

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (!active) return;

    progress.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [active, progress]);

  const sheenStyle = useAnimatedStyle(() => {
    const w = Math.max(trackW.value, 1);
    const sheen = Math.min(60, w * 0.45);
    return {
      width: sheen,
      transform: [{ translateX: progress.value * (w + sheen) - sheen }],
    };
  });

  return (
    <View
      style={[
        styles.ruleTrack,
        {
          height,
          width: width ?? '100%',
          borderRadius,
          backgroundColor: solid,
          opacity: active ? 1 : 0.45,
        },
        style,
      ]}
      onLayout={(e) => {
        trackW.value = e.nativeEvent.layout.width;
      }}
    >
      {active ? (
        <Animated.View pointerEvents="none" style={[styles.ruleSheen, sheenStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.95)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * Scia luminosa in stile Google Gemini sul bordo superiore.
 * Scorre in continuo ed in modo fluido sul bordo in alto del container.
 */
export function SemaforoGeminiTopBeam({
  kind = 'semaforo',
  active = true,
  height = 3.5,
  style,
}: {
  kind?: SemaforoGeminiKind;
  active?: boolean;
  height?: number;
  pauseMs?: number;
  passMs?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const containerWidth = useSharedValue(200);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (!active) return;

    progress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      false
    );

    return () => cancelAnimation(progress);
  }, [active, progress]);

  const stopsMap: Record<SemaforoGeminiKind, readonly [string, string, ...string[]]> = {
    semaforo: [
      'transparent',
      '#22C55E',
      '#FBBF24',
      '#EF4444',
      '#22C55E',
      'transparent',
    ],
    verde: [
      'transparent',
      'rgba(134,239,172,0.6)',
      '#22C55E',
      '#4ADE80',
      'rgba(134,239,172,0.6)',
      'transparent',
    ],
    giallo: [
      'transparent',
      'rgba(253,230,138,0.6)',
      '#FBBF24',
      '#F59E0B',
      'rgba(253,230,138,0.6)',
      'transparent',
    ],
    rosso: [
      'transparent',
      'rgba(254,202,202,0.6)',
      '#EF4444',
      '#F87171',
      'rgba(254,202,202,0.6)',
      'transparent',
    ],
  };

  const shadowColorMap: Record<SemaforoGeminiKind, string> = {
    semaforo: '#FBBF24',
    verde: '#22C55E',
    giallo: '#F59E0B',
    rosso: '#EF4444',
  };

  const animStyle = useAnimatedStyle(() => {
    const cw = Math.max(containerWidth.value, 1);
    const beamW = Math.max(cw * 0.5, 120);
    const translateX = progress.value * (cw + beamW) - beamW;

    return {
      width: beamW,
      transform: [{ translateX }],
    };
  });

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.topBeamTrack, { height }, style]}
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        style={[
          styles.topBeamSheen,
          {
            shadowColor: shadowColorMap[kind],
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
            elevation: 5,
          },
          animStyle,
        ]}
      >
        <LinearGradient
          colors={stopsMap[kind]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  disc: {
    position: 'absolute',
  },
  content: {
    overflow: 'hidden',
    zIndex: 1,
  },
  ruleTrack: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  ruleSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  topBeamTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  topBeamSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});

