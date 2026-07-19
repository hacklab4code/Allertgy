import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './ui/AppText';
import { GlassCard } from './ui/GlassCard';
import { colors, spacing } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  card?: boolean;
  padded?: boolean;
  style?: ViewStyle;
};

export default function DetailSection({ title, subtitle, children, card = true, padded = true, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="label" color={colors.onSurfaceMuted} style={styles.title}>
        {title.toUpperCase()}
      </AppText>
      {subtitle ? <AppText variant="caption" style={styles.subtitle}>{subtitle}</AppText> : null}
      {children ? (
        card ? (
          <GlassCard padded={padded}>
            {children}
          </GlassCard>
        ) : (
          children
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl, gap: spacing.sm },
  title: { marginLeft: 4 },
  subtitle: { marginLeft: 4, marginRight: 4 },
});
