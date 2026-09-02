/**
 * Scroll-linked enter/exit — interpolazione diretta (no spring) per scroll fluido.
 * - send-and-receive: fade + translateY
 * - candycane: slide laterale
 * - lite: nessuna animazione (liste lunghe)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useScrollTimeline } from './scrollTimeline';

export type ScrollEntryAnimation =
  | 'blurry'
  | 'candycane'
  | 'swoopy-n-blur'
  | 'send-and-receive';

type Props = {
  children: React.ReactNode;
  animation?: ScrollEntryAnimation;
  edge?: 'first' | 'last' | 'both';
  style?: StyleProp<ViewStyle>;
  /** Disattiva animazione scroll — usare su liste lunghe per evitare scatti. */
  lite?: boolean;
};

/** Spazio extra in fondo: gli ultimi item possono completare l’enter fino a fine lista. */
export function ScrollFocusEndPad() {
  const { height } = useWindowDimensions();
  return (
    <View
      style={[styles.endPad, { height: Math.max(160, Math.round(height * 0.24)) }]}
      pointerEvents="none"
    />
  );
}

function useSystemReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v) => {
          if (mounted) setReduce(v);
        })
        .catch(() => {});
    }
    const sub = typeof AccessibilityInfo?.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce)
      : null;
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

function ScrollEntryInner({
  children,
  animation = 'send-and-receive',
  edge,
  style,
  lite = false,
}: Props) {
  const timeline = useScrollTimeline();
  const reduceMotion = useSystemReduceMotion();
  const enabled = !!timeline && !reduceMotion && !lite;

  const layoutY = useSharedValue(0);
  const itemH = useSharedValue(120);
  const itemW = useSharedValue(320);
  const ready = useSharedValue(0);

  const handleLayout = useCallback(
    (event: any) => {
      const { y, height, width } = event.nativeEvent.layout;
      if (height > 0 && width > 0) {
        layoutY.value = y;
        itemH.value = height;
        itemW.value = width;
        ready.value = 1;
      }
    },
    [layoutY, itemH, itemW, ready],
  );

  const animStyle = useAnimatedStyle(() => {
    if (!enabled || !timeline || ready.value === 0) {
      return { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] };
    }

    const vh = timeline.viewportH.value;
    const h = itemH.value;
    const w = itemW.value;
    if (vh <= 1 || h <= 1) {
      return { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] };
    }

    // Calcolo puramente su UI-thread senza chiamate bridge
    const pageY = layoutY.value - timeline.scrollY.value;
    const maxScroll = Math.max(0, timeline.contentH.value - vh);
    const scrollY = timeline.scrollY.value;
    const nearTop = scrollY <= 8;
    const nearEnd = maxScroll <= 8 || maxScroll - scrollY <= 12;

    if ((edge === 'first' || edge === 'both') && nearTop) {
      return { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] };
    }
    if ((edge === 'last' || edge === 'both') && nearEnd) {
      return { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] };
    }

    if (animation === 'send-and-receive') {
      const enter = interpolate(
        pageY,
        [vh - h * 0.1, vh - h * 0.8],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const exit = interpolate(
        pageY,
        [h * 0.8, -h * 0.8],
        [0, 1],
        Extrapolation.CLAMP,
      );

      const enterOpacity = interpolate(enter, [0, 0.4, 1], [0.35, 0.75, 1], Extrapolation.CLAMP);
      const enterY = interpolate(enter, [0, 0.6, 1], [16, 6, 0], Extrapolation.CLAMP);
      const exitOpacity = interpolate(exit, [0, 0.6, 1], [1, 0.65, 0], Extrapolation.CLAMP);
      const exitY = interpolate(exit, [0, 1], [0, -18], Extrapolation.CLAMP);

      const opacity = Math.min(enterOpacity, exitOpacity);
      const translateY = exit > 0.002 ? exitY : enterY;

      return {
        opacity,
        transform: [{ translateY }],
      };
    }

    if (animation === 'candycane') {
      const exiting = pageY < 0;
      const focus = exiting
        ? interpolate(pageY, [-h, 0], [0, 1], Extrapolation.CLAMP)
        : interpolate(pageY, [vh - h * 1.05, vh + h * 0.15], [1, 0], Extrapolation.CLAMP);
      const direction = exiting ? 1 : -1;
      return {
        opacity: interpolate(focus, [0, 0.15, 1], [0, 0.85, 1], Extrapolation.CLAMP),
        transform: [{ translateX: direction * (1 - focus) * w * 0.28 }],
      };
    }

    if (animation === 'swoopy-n-blur' || animation === 'blurry') {
      const exiting = pageY < 0;
      const focus = exiting
        ? interpolate(pageY, [-h, 0], [0, 1], Extrapolation.CLAMP)
        : interpolate(pageY, [vh - h * 1.1, vh + h * 0.1], [1, 0], Extrapolation.CLAMP);
      return {
        opacity: focus,
        transform: [
          { translateY: exiting ? (1 - focus) * h * 0.2 : interpolate(focus, [0, 1], [12, 0], Extrapolation.CLAMP) },
          { scale: interpolate(focus, [0, 1], [0.96, 1], Extrapolation.CLAMP) },
        ],
      };
    }

    return { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] };
  }, [enabled, timeline, animation, edge]);

  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View
      collapsable={false}
      style={[styles.host, style]}
      onLayout={handleLayout}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </View>
  );
}

export const ScrollEntry = React.memo(ScrollEntryInner);

const styles = StyleSheet.create({
  host: {
    overflow: 'visible',
    width: '100%',
  },
  endPad: {
    width: '100%',
  },
});
