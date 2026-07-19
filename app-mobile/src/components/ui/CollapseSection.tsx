import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MIN_TOUCH_TARGET } from '../../layoutConstants';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { CountBadge } from './Traffic';
import type { PuffyTint } from './PuffyCard';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  preview?: string;
  badge?: string | number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  tint?: PuffyTint;
};

/** Sezione profilo a scomparsa — header puffy + contenuto dedicato. */
export function CollapseSection({
  icon,
  iconColor = colors.brand,
  iconBg = colors.brand50,
  title,
  preview,
  badge,
  expanded,
  onToggle,
  children,
  tint = 'none',
}: Props) {
  const accentColor = tint === 'red' ? colors.redBorder
    : tint === 'yellow' ? colors.amberBorder
    : tint === 'green' ? colors.greenBorder
    : undefined;

  const badgeTint = tint === 'red' ? 'red'
    : tint === 'yellow' ? 'yellow'
    : tint === 'green' ? 'green'
    : 'brand';

  return (
    <GlassCard padded={false} tint={tint} accentColor={accentColor} style={styles.card}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconBg }, WIREFRAME_MODE && { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#000', borderRadius: 0 }]}>
          {WIREFRAME_MODE ? (
            <AppText variant="caption">ico</AppText>
          ) : (
            <Ionicons name={icon} size={20} color={iconColor} />
          )}
        </View>
        <View style={styles.headerBody}>
          <AppText variant="bodyBold">{title}</AppText>
          {preview && !expanded ? (
            <AppText variant="caption" numberOfLines={1}>{preview}</AppText>
          ) : null}
        </View>
        {badge != null && !expanded ? (
          <CountBadge count={badge} tint={badgeTint} />
        ) : null}
        <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceMuted} />
        </View>
      </Pressable>

      {expanded ? (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(160)}>
          <View style={styles.divider} />
          <View style={styles.body}>{children}</View>
        </Animated.View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
  },
  headerPressed: { opacity: 0.88 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBody: { flex: 1, gap: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    opacity: 0.6,
  },
  body: { paddingBottom: spacing.xs, paddingHorizontal: spacing.lg },
});
