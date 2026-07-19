import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';

type Props = TextInputProps & { error?: string };

export function DebossedInput({ style, error, ...rest }: Props) {
  const wrapStyle = WIREFRAME_MODE ? wireBox({ fill: '#FFF', dashed: true }) : styles.glassInput;

  return (
    <View style={styles.wrap}>
      <View style={[wrapStyle, error && styles.inputError]}>
        <TextInput
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
      {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  glassInput: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.red },
  input: {
    zIndex: 2,
    fontSize: 14,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
});
