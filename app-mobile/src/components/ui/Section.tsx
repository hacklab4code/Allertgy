import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  action?: ReactNode;
  card?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Sezione tipografica — titolo fuori, contenuto sotto. Niente card-in-card. */
export function Section({
  title,
  subtitle,
  children,
  action,
  card = false,
  padded = true,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, WIREFRAME_MODE && wireBox({ dashed: true }), style]}>
      <View style={styles.head}>
        <View style={styles.titleBlock}>
          <AppText variant="h2" style={styles.title}>
            {WIREFRAME_MODE ? `[SEZ] ${title}` : title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action}
      </View>
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
  wrap: { gap: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    letterSpacing: -0.35,
  },
  subtitle: {
    lineHeight: 16,
  },
});
