import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { GlossSheen, puffRaised } from './puffSurface';

export type PuffyTint = 'none' | 'brand' | 'green' | 'yellow' | 'red';

export const PUFFY_TINT_BG: Record<PuffyTint, string> = {
  none: colors.surfaceSecondary,
  brand: colors.brand50,
  green: colors.greenSoft,
  yellow: colors.yellowSoft,
  red: colors.redSoft,
};

export const PUFFY_TINT_BORDER: Record<PuffyTint, string> = {
  none: colors.border,
  brand: colors.brandTertiary,
  green: colors.greenBorder,
  yellow: colors.amberBorder,
  red: colors.redBorder,
};

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  elevation?: number;
  padded?: boolean;
  tint?: PuffyTint;
  radius?: number;
  accentColor?: string;
  accentWidth?: number;
};

export function PuffyCard({
  children,
  onPress,
  style,
  testID,
  elevation = 10,
  padded = true,
  tint = 'none',
  radius: cardRadius = radius.lg,
  accentColor,
  accentWidth = 4,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const accentStyle = accentColor
    ? { borderLeftWidth: accentWidth, borderLeftColor: accentColor }
    : null;

  if (WIREFRAME_MODE) {
    const box = [wireBox({ fill: PUFFY_TINT_BG[tint] }), accentStyle, padded && styles.padded, style];
    if (onPress) {
      return (
        <Pressable testID={testID} onPress={onPress} style={box}>
          {children}
        </Pressable>
      );
    }
    return <View testID={testID} style={box}>{children}</View>;
  }

  const content = (
    <View
      style={[
        puffRaised({
          elevation,
          r: cardRadius,
          bg: PUFFY_TINT_BG[tint],
          borderColor: PUFFY_TINT_BORDER[tint],
        }),
        styles.card,
        accentStyle,
        padded && styles.padded,
        style,
      ]}
    >
      <GlossSheen intensity={0.55} />
      {children}
    </View>
  );

  if (!onPress) return <View testID={testID}>{content}</View>;

  return (
    <Animated.View testID={testID} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 18, stiffness: 360 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 11, stiffness: 280 }); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  padded: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
  },
});
