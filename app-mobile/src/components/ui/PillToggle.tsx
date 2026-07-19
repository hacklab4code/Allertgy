import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, font, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { LiquidGlassView } from './LiquidGlassView';
import { GlassGlossPill, glassShellBorder } from './glassFallback';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
};

const TRACK_PAD = 5;

export function PillToggle<T extends string>({ options, value, onChange }: Props<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const slide = useSharedValue(activeIndex);

  useEffect(() => {
    slide.value = withSpring(activeIndex, { damping: 20, stiffness: 320, mass: 0.82 });
  }, [activeIndex, slide]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const pillWidth = trackWidth > 0 ? (trackWidth - TRACK_PAD * 2) / options.length : 0;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * pillWidth }],
    width: pillWidth,
    opacity: pillWidth > 0 ? 1 : 0,
  }));

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wfWrap, wireBox()]}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[wireBox({ fill: active ? '#000' : '#FFF' }), styles.wfBtn]}
              onPress={() => onChange(opt.value)}
            >
              <AppText variant="caption" style={{ color: active ? '#FFF' : '#000' }}>{opt.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.wrap} onLayout={onTrackLayout}>
      <LiquidGlassView
        glassStyle="regular"
        tintColor="rgba(210, 195, 246, 0.20)"
        fallbackIntensity={68}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.slidingPill, pillStyle]}>
        <GlassGlossPill />
      </Animated.View>

      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.btn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(opt.value);
            }}
          >
            <AppText style={[styles.text, active && styles.textActive]}>{opt.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wfWrap: { flexDirection: 'row', padding: 4, gap: 4 },
  wfBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  wrap: {
    flexDirection: 'row',
    padding: TRACK_PAD,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...glassShellBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  slidingPill: {
    position: 'absolute',
    top: TRACK_PAD,
    bottom: TRACK_PAD,
    left: TRACK_PAD,
    borderRadius: radius.pill,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  text: { fontFamily: font.semibold, fontSize: 12.5, color: colors.onSurfaceMuted },
  textActive: { color: colors.onSurface, fontFamily: font.bold },
});
