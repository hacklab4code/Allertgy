import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { surfaceRaised } from './surfaceTokens';

export type SurfaceTint = 'none' | 'brand' | 'green' | 'yellow' | 'red';

/** Violet Precision: tint non lava più la card — fill sempre bianco. */
export const SURFACE_TINT_BG: Record<SurfaceTint, string> = {
  none: colors.surfaceSecondary,
  brand: colors.surfaceSecondary,
  green: colors.surfaceSecondary,
  yellow: colors.surfaceSecondary,
  red: colors.surfaceSecondary,
};

export const SURFACE_TINT_BORDER: Record<SurfaceTint, string> = {
  none: colors.border,
  brand: colors.borderStrong,
  green: colors.border,
  yellow: colors.border,
  red: colors.border,
};

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Ignorato — ombre flat minime via surfaceRaised. */
  elevation?: number;
  padded?: boolean;
  tint?: SurfaceTint;
  radius?: number;
  /** @deprecated Preferisci VerdictDot — accent bar deprecata. */
  accentColor?: string;
  accentWidth?: number;
};

export function SurfaceCard({
  children,
  onPress,
  style,
  testID,
  padded = true,
  tint = 'none',
  radius: cardRadius = radius.md,
}: Props) {
  if (WIREFRAME_MODE) {
    const box = [styles.stretch, wireBox({ fill: SURFACE_TINT_BG[tint] }), padded && styles.padded, style];
    if (onPress) {
      return (
        <Pressable testID={testID} onPress={onPress} style={box}>
          {children}
        </Pressable>
      );
    }
    return (
      <View testID={testID} style={box}>
        {children}
      </View>
    );
  }

  const surface = [
    styles.stretch,
    surfaceRaised({
      r: cardRadius,
      bg: SURFACE_TINT_BG[tint],
      borderColor: SURFACE_TINT_BORDER[tint],
    }),
    styles.card,
    padded && styles.padded,
    style,
  ];

  if (!onPress) {
    return (
      <View testID={testID} style={surface}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [surface, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stretch: {
    alignSelf: 'stretch',
    width: '100%',
  },
  card: {
    overflow: 'hidden',
  },
  padded: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  pressed: { opacity: 0.88 },
});
