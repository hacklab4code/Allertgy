import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SCREEN_PADDING_H } from '../../layoutConstants';
import { colors, font } from '../../theme';
import { SemaforoSectionShimmer } from './SemaforoGeminiBorder';

export type SemaforoFilterKind = 'verde' | 'giallo' | 'rosso';

const ORDER: SemaforoFilterKind[] = ['verde', 'giallo', 'rosso'];

type Props = {
  filtro: SemaforoFilterKind;
  onFiltroChange: (f: SemaforoFilterKind) => void;
  counts: { verde: number; giallo: number; rosso: number };
  language?: string;
  /** @deprecated ignorato — niente sticky / niente box */
  sticky?: boolean;
  style?: StyleProp<ViewStyle>;
};

const META: Record<SemaforoFilterKind, { solid: string; on: string }> = {
  verde: { solid: colors.green, on: colors.onGreen },
  giallo: { solid: colors.amber, on: colors.onYellow },
  rosso: { solid: colors.red, on: colors.onRed },
};

/**
 * Semaforo flat: solo 3 colonne centrate.
 * Tap sulle colonne + swipe sinistra/destra per cambiare sezione.
 * Rule attiva: shimmer Gemini nella tinta di idoneità.
 */
export function SemaforoFilterBar({
  filtro,
  onFiltroChange,
  counts,
  language = 'it',
  style,
}: Props) {
  const isIt = language.toLowerCase().startsWith('it');
  const didSwipeRef = useRef(false);
  const chips: { f: SemaforoFilterKind; label: string; n: number }[] = [
    { f: 'verde', label: isIt ? 'Idonei' : 'Suitable', n: counts.verde },
    { f: 'giallo', label: isIt ? 'Attenzione' : 'Caution', n: counts.giallo },
    { f: 'rosso', label: isIt ? 'Evitare' : 'Avoid', n: counts.rosso },
  ];

  const shiftFiltro = useCallback((dir: 1 | -1) => {
    const idx = ORDER.indexOf(filtro);
    const next = ORDER[idx + dir];
    if (!next) return;
    didSwipeRef.current = true;
    void Haptics.selectionAsync();
    onFiltroChange(next);
  }, [filtro, onFiltroChange]);

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      const goNext = e.translationX < -40 || e.velocityX < -450;
      const goPrev = e.translationX > 40 || e.velocityX > 450;
      if (goNext) runOnJS(shiftFiltro)(1);
      else if (goPrev) runOnJS(shiftFiltro)(-1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.row, style]} collapsable={false}>
        {chips.map((chip) => {
          const active = filtro === chip.f;
          const m = META[chip.f];
          return (
            <Pressable
              key={chip.f}
              onPress={() => {
                if (didSwipeRef.current) {
                  didSwipeRef.current = false;
                  return;
                }
                void Haptics.selectionAsync();
                onFiltroChange(chip.f);
              }}
              style={({ pressed }) => [styles.col, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${chip.label}, ${chip.n}`}
            >
              <Text style={[styles.count, { color: m.solid }, active && styles.countActive]}>
                {chip.n}
              </Text>
              <SemaforoSectionShimmer
                kind={chip.f}
                active={active}
                height={4}
                width={active ? 40 : 28}
                borderRadius={2}
                pauseMs={4200}
                passMs={1200}
              />
              <Text
                style={[styles.label, active && { color: m.on, fontWeight: '800' }]}
                numberOfLines={1}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  count: {
    fontFamily: font.displayBold,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 32,
    textAlign: 'center',
    minWidth: 36,
  },
  countActive: {
    fontWeight: '800',
  },
  label: {
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
});
