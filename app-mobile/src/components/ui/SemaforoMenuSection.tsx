import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, font, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { SemaforoGeminiBorder } from './SemaforoGeminiBorder';

type SemaforoKind = 'verde' | 'giallo' | 'rosso';

type Props = {
  kind: SemaforoKind;
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
};

const META: Record<SemaforoKind, { solid: string }> = {
  verde: { solid: colors.green },
  giallo: { solid: colors.amber },
  rosso: { solid: colors.red },
};

/** Lista piatti per stato — header con alone Gemini nella tinta di idoneità. */
export function SemaforoMenuSection({ kind, title, subtitle, count, children }: Props) {
  const m = META[kind];

  return (
    <View style={styles.root}>
      <SemaforoGeminiBorder
        kind={kind}
        active
        borderRadius={radius.md}
        borderWidth={1.5}
        pauseMs={6400}
        passMs={1400}
        fill={colors.surfaceSecondary}
      >
        <View style={styles.header}>
          <View style={[styles.bar, { backgroundColor: m.solid }]} />
          <View style={styles.copy}>
            <AppText variant="bodyBold" style={styles.title}>
              {title}
              <AppText variant="bodyBold" style={styles.count}>  {count}</AppText>
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={2}>
              {subtitle}
            </AppText>
          </View>
        </View>
      </SemaforoGeminiBorder>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  bar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    minHeight: 28,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: font.bold,
    color: colors.brandInk,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  count: {
    color: colors.onSurfaceMuted,
    fontWeight: '700',
  },
  list: {
    width: '100%',
    paddingBottom: 2,
  },
});
