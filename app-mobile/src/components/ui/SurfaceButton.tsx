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
  buttonRadius?: number;
};

/** Palette Cosmic & Vanilla: superfici pulite, contrasto nitido e bordi soft e arrotondati (pill). */
const palettes = {
  primary: { bg: colors.brand, text: '#FFFFFF', border: colors.brand },
  secondary: { bg: colors.brand, text: '#FFFFFF', border: colors.brand },
  soft: { bg: colors.surfaceSecondary, text: colors.brand, border: colors.border },
  danger: { bg: colors.red, text: '#FFFFFF', border: colors.red },
};

const disabledPalettes = {
  primary: { bg: '#E2E8F0', text: colors.textMuted, border: colors.border },
  secondary: { bg: '#E2E8F0', text: colors.textMuted, border: colors.border },
  soft: { bg: colors.surfaceTertiary, text: colors.textMuted, border: colors.border },
  danger: { bg: colors.redSoft, text: colors.redText, border: colors.redBorder },
};

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
  buttonRadius = radius.pill,
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
        { borderRadius: buttonRadius },
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
          { backgroundColor: p.bg, borderColor: p.border, borderRadius: buttonRadius },
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
    borderRadius: radius.pill,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
  },
  fill: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
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
    fontWeight: '700',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
