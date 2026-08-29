import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, font, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { AppText } from './AppText';
import { CountBadge } from './Traffic';
import type { SurfaceTint } from './SurfaceCard';

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
  tint?: SurfaceTint;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pannello espandibile — stessa tile di SettingsRow. */
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
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.985, { damping: 18, stiffness: 420 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 280 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[styles.tile, animStyle]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View
          style={[
            styles.iconWell,
            { backgroundColor: iconBg },
            WIREFRAME_MODE && { backgroundColor: '#F5F5F5', borderRadius: 0 },
          ]}
        >
          {WIREFRAME_MODE ? (
            <AppText variant="caption">ico</AppText>
          ) : (
            <Ionicons name={icon} size={19} color={iconColor} />
          )}
        </View>

        <View style={styles.headerBody}>
          <AppText numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {preview ? (
            <AppText numberOfLines={1} style={styles.preview}>
              {preview}
            </AppText>
          ) : null}
        </View>

        {badge != null && !expanded ? (
          <CountBadge count={badge} tint="brand" />
        ) : null}

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.borderStrong}
        />
      </AnimatedPressable>

      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.expand}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    width: '100%',
    gap: 6,
    marginBottom: spacing.md,
  },
  tile: {
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  headerBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.displaySemibold,
    color: colors.brandInk,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  preview: {
    fontFamily: font.regular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  expand: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFF5',
    overflow: 'hidden',
    padding: spacing.md,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
