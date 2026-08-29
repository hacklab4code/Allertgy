import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
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
  tone = 'onLight',
}: Props) {
  const isDark = tone === 'onDark';
  const titleColor = isDark ? '#FFFFFF' : colors.textMuted;
  const subtitleColor = isDark ? 'rgba(255, 255, 255, 0.85)' : colors.textSecondary;

  const resolvedAction = typeof action === 'function'
    ? action({ ink: titleColor, inkMuted: subtitleColor, action: colors.brand })
    : action;

  const list = children ? (
    card ? (
      <SurfaceCard padded={padded} style={styles.card}>
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
              isDark && {
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
    gap: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  list: {
    gap: 0,
    width: '100%',
  },
});
