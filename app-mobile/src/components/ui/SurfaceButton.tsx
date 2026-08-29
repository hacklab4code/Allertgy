import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
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

/** Hex espliciti: evita testo bianco fantasma se il token bg non si pinta sopra la camera. */
const palettes = {
  primary: { bg: '#36255C', text: '#FFFFFF', border: '#36255C' },
  secondary: { bg: '#36255C', text: '#FFFFFF', border: '#36255C' },
  soft: { bg: '#FFFFFF', text: '#36255C', border: '#D2C3F6' },
  danger: { bg: colors.red, text: '#FFFFFF', border: colors.red },
};

const disabledPalettes = {
  primary: { bg: '#EDE6FA', text: '#5C5470', border: '#D2C3F6' },
  secondary: { bg: '#EDE6FA', text: '#5C5470', border: '#D2C3F6' },
  soft: { bg: '#F3F0F8', text: '#948E9C', border: '#E6DFF5' },
  danger: { bg: colors.redSoft, text: colors.redText, border: colors.redBorder },
};

/** Violet Precision — fill opaco su View interna (affidabile sopra CameraView). */
export function SurfaceButton({
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
        <Text
          style={{
            textAlign: 'center',
            color: variant === 'primary' ? '#FFF' : '#000',
            fontWeight: '700',
          }}
        >
          {loading ? '…' : `[BTN] ${label}`}
        </Text>
      </Pressable>
    );
  }

  const inactive = !!(disabled || loading);
  const p = inactive ? disabledPalettes[variant] : palettes[variant];

  return (
    <Pressable
      testID={testID}
      disabled={inactive}
      onPress={() => {
        if (inactive) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => [
        styles.hit,
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.fill,
          { backgroundColor: p.bg, borderColor: p.border },
        ]}
      />
      <View style={styles.btnInner}>
        {icon ? <Ionicons name={icon} size={20} color={p.text} /> : null}
        <Text style={[styles.text, { color: p.text }]}>
          {loading ? 'Attendere…' : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
  },
  fill: {
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  text: {
    fontFamily: font.displaySemibold,
    fontSize: 16,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  pressed: { opacity: 0.88 },
});
