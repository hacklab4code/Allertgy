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
  runOnJS,
  useAnimatedReaction,
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

  const hostRef = React.useRef<View>(null);
  const anchorPageY = useSharedValue(0);
  const measuredAtScroll = useSharedValue(0);
  const itemH = useSharedValue(120);
  const itemW = useSharedValue(320);
  const ready = useSharedValue(0);

  const syncAnchor = useCallback(() => {
    if (!enabled || !timeline) return;
    const node = hostRef.current;
    if (!node) return;
    node.measureInWindow((_x, y, w, h) => {
      if (h <= 0 || w <= 0) return;
      anchorPageY.value = y;
      measuredAtScroll.value = timeline.scrollY.value;
      itemH.value = h;
      itemW.value = w;
      ready.value = 1;
    });
  }, [enabled, timeline, anchorPageY, measuredAtScroll, itemH, itemW, ready]);

  useEffect(() => {
    if (!enabled) return undefined;
    syncAnchor();
    const t1 = setTimeout(syncAnchor, 120);
    const t2 = setTimeout(syncAnchor, 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enabled, syncAnchor]);

  // Immagini / layout sopra che crescono → riallinea l’ancora (senza questo gli item in fondo “muoiono”).
  useAnimatedReaction(
    () => (timeline ? timeline.contentH.value : 0),
    (curr, prev) => {
      if (!enabled || !timeline) return;
      if (prev == null) return;
      if (Math.abs(curr - prev) < 4) return;
      runOnJS(syncAnchor)();
    },
    [enabled, timeline, syncAnchor],
  );

  // Riallinea ogni ~120px di scroll: evita drift dopo scroll lunghi / reload immagini.
  useAnimatedReaction(
    () => (timeline ? Math.round(timeline.scrollY.value / 120) : 0),
    (curr, prev) => {
      if (!enabled || !timeline) return;
      if (prev == null || curr === prev) return;
      runOnJS(syncAnchor)();
    },
    [enabled, timeline, syncAnchor],
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

    const pageY =
      anchorPageY.value - (timeline.scrollY.value - measuredAtScroll.value);
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
        [vh - h * 0.2, vh - h * 1.35],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const exit = interpolate(
        pageY,
        [h * 1.05, -h * 1.15],
        [0, 1],
        Extrapolation.CLAMP,
      );

      const enterOpacity = interpolate(enter, [0, 0.35, 1], [0, 0.6, 1], Extrapolation.CLAMP);
      const enterY = interpolate(enter, [0, 0.5, 1], [0.22, 0.08, 0], Extrapolation.CLAMP);
      const exitOpacity = interpolate(exit, [0, 0.5, 1], [1, 0.5, 0], Extrapolation.CLAMP);
      const exitY = interpolate(exit, [0, 1], [0, -0.35], Extrapolation.CLAMP);

      const opacity = Math.min(enterOpacity, exitOpacity);
      const translateY = exit > 0.002 ? exitY * h : enterY * h;

      return {
        opacity,
        transform: [{ translateY }],
      };
    }

    if (animation === 'candycane') {
      const exiting = pageY < 0;
      // Enter: opaco appena il piatto è quasi tutto in viewport (non serve 2× altezza).
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
          { translateY: exiting ? (1 - focus) * h * 0.3 : interpolate(focus, [0, 1], [16, 0], Extrapolation.CLAMP) },
          { scale: interpolate(focus, [0, 1], [0.94, 1], Extrapolation.CLAMP) },
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
      ref={hostRef}
      collapsable={false}
      style={[styles.host, style]}
      onLayout={syncAnchor}
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
