import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font, puffyShadow, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'soft' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  fullWidth?: boolean;
};

const palettes = {
  primary: { bg: colors.brand, text: colors.onBrand, border: colors.brandDark },
  secondary: { bg: colors.surfaceInverse, text: colors.onSurfaceInverse, border: colors.surfaceInverse },
  soft: { bg: colors.surfaceSecondary, text: colors.onSurface, border: colors.border },
  danger: { bg: colors.red, text: '#FFFFFF', border: colors.redText },
};

export function PuffyButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  testID,
  fullWidth = true,
}: Props) {
  if (WIREFRAME_MODE) {
    return (
      <Pressable
        testID={testID}
        disabled={disabled || loading}
        onPress={onPress}
        style={[
          wireBox({ fill: variant === 'primary' ? '#000' : '#FFF', minHeight: 44 }),
          fullWidth && { alignSelf: 'stretch' },
          disabled && { opacity: 0.4 },
          style,
        ]}
      >
        <AppText
          variant="bodyBold"
          style={{
            textAlign: 'center',
            color: variant === 'primary' ? '#FFF' : '#000',
          }}
        >
          {loading ? '…' : `[BTN] ${label}`}
        </AppText>
      </Pressable>
    );
  }

  const scale = useSharedValue(1);
  const p = palettes[variant];
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      testID={testID}
      style={[animatedStyle, fullWidth && { alignSelf: 'stretch' }, puffyShadow(12), disabled && { opacity: 0.5 }, style]}
    >
      <Pressable
        disabled={disabled || loading}
        style={[styles.btn, { backgroundColor: p.bg, borderColor: p.border }]}
        onPressIn={() => { scale.value = withSpring(0.91, { damping: 18, stiffness: 380 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 11, stiffness: 280 }); }}
        onPress={() => {
          if (disabled || loading) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <View style={styles.btnInner}>
          {icon && <Ionicons name={icon} size={20} color={p.text} />}
          <AppText style={[styles.text, { color: p.text }]}>{loading ? 'Attendere…' : label}</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.pill, borderWidth: 2, overflow: 'hidden', minHeight: 54, justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, paddingHorizontal: spacing.lg, zIndex: 2 },
  text: { fontFamily: font.displaySemibold, fontSize: 16 },
});
