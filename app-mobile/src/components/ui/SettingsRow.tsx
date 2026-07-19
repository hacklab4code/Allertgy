import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  children?: ReactNode;
};

export function SettingsDivider() {
  return <View style={styles.divider} />;
}

/** Riga impostazioni/navigazione riutilizzabile. */
export function SettingsRow({
  icon,
  iconColor = colors.brand,
  iconBg = colors.brand50,
  title,
  subtitle,
  onPress,
  right,
  children,
}: Props) {
  const body = (
    <View style={[styles.row, children ? styles.rowExpanded : null]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="bodyBold">{title}</AppText>
        {subtitle ? <AppText variant="caption" style={styles.rowSub}>{subtitle}</AppText> : null}
        {children}
      </View>
      {right ?? (onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceMuted} />
      ) : null)}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => pressed && styles.rowPressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  rowExpanded: { alignItems: 'flex-start' },
  rowPressed: { opacity: 0.88 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowSub: { color: colors.onSurfaceMuted },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
