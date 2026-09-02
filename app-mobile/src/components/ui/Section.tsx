import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { SurfaceCard } from './SurfaceCard';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  action?: ReactNode | ((ink: any) => ReactNode);
  card?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: 'auto' | 'onDark' | 'onLight';
};

/** Sezione — titolo eyebrow + lista, opzionalmente in card bianca. */
export function Section({
  title,
  subtitle,
  children,
  action,
  card = false,
  padded = true,
  style,
  tone = 'auto',
}: Props) {
  const isDarkMode = useIsDarkMode();
  const effectiveDark = tone === 'onDark' || isDarkMode;
  const titleColor = effectiveDark ? '#F1FEC8' : '#475569';
  const subtitleColor = effectiveDark ? '#E2E8F0' : colors.textSecondary;

  const resolvedAction = typeof action === 'function'
    ? action({ ink: titleColor, inkMuted: subtitleColor, action: colors.brand })
    : action;

  const list = children ? (
    card ? (
      <SurfaceCard padded={false} style={styles.card}>
        <View style={styles.list}>{children}</View>
      </SurfaceCard>
    ) : (
      <View style={styles.list}>{children}</View>
    )
  ) : null;

  return (
    <View style={[styles.wrap, WIREFRAME_MODE && wireBox({ dashed: true }), style]}>
      <View style={styles.head}>
        <View style={styles.titleBlock}>
          <AppText
            variant="eyebrow"
            color={titleColor}
            style={[
              styles.title,
              effectiveDark && {
                textShadowColor: 'rgba(0, 0, 0, 0.45)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              },
            ]}
          >
            {WIREFRAME_MODE ? `[SEZ] ${title}` : title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={subtitleColor} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {resolvedAction}
      </View>

      {list}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    alignSelf: 'stretch',
    width: '100%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  card: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  list: {
    gap: 0,
    width: '100%',
  },
});
