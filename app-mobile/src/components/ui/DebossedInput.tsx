import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';

type Props = TextInputProps & { error?: string; rightIcon?: React.ReactNode };

export function DebossedInput({ style, error, rightIcon, ...rest }: Props) {
  const wrapStyle = WIREFRAME_MODE ? wireBox({ fill: '#FFF', dashed: true }) : styles.glassInput;

  return (
    <View style={styles.wrap}>
      <View style={[wrapStyle, styles.row, error && styles.inputError]}>
        <TextInput
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.input, style]}
          {...rest}
        />
        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </View>
      {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassInput: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.red },
  input: {
    flex: 1,
    zIndex: 2,
    fontSize: 14,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  rightIconWrap: {
    paddingRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
