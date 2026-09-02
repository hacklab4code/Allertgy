import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, font } from '../../theme';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { AppText } from './AppText';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  iconSize?: number;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  children?: ReactNode;
  danger?: boolean;
  /** Colore titolo (es. logout arancio). `danger` ha priorità. */
  titleColor?: string;
};

export function SettingsDivider() {
  const isDark = useIsDarkMode();
  return (
    <View
      style={[
        styles.divider,
        isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
      ]}
    />
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsRow({
  icon,
  iconColor,
  iconBg,
  iconSize = 22,
  title,
  subtitle,
  onPress,
  right,
  children,
  danger = false,
  titleColor,
}: Props) {
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);

  const defaultIconColor = danger
    ? colors.red
    : isDark
      ? '#F1FEC8'
      : '#334155';

  const resolvedIconColor = iconColor || defaultIconColor;

  const resolvedTitleColor = danger
    ? colors.red
    : titleColor
      ? titleColor
      : isDark
        ? '#FFFFFF'
        : '#0F172A';

  const resolvedSubtitleColor = isDark ? '#94A3B8' : '#64748B';

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasIconBg = !!iconBg && iconBg !== 'transparent';

  const body = (
    <View style={styles.innerRow}>
      <View style={[styles.iconWell, hasIconBg ? { backgroundColor: iconBg } : styles.iconWellClean]}>
        <Ionicons name={icon} size={iconSize} color={resolvedIconColor} />
      </View>
      <View style={styles.rowBody}>
        <AppText
          numberOfLines={1}
          color={resolvedTitleColor}
          style={[styles.title, isDark && styles.titleDark, danger && styles.titleDanger]}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            color={resolvedSubtitleColor}
            style={[styles.subtitle, isDark && styles.subtitleDark]}
            numberOfLines={2}
          >
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      {right}
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? 'rgba(255, 255, 255, 0.35)' : '#94A3B8'}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.tile, children ? styles.tileExpanded : null]}>
        {body}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 18, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.tile, children ? styles.tileExpanded : null, containerAnimStyle]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {body}
    </AnimatedPressable>
  );
}

type SwitchRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  iconSize?: number;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export function SettingsSwitchRow({
  icon,
  iconColor,
  iconBg,
  iconSize = 22,
  title,
  subtitle,
  value,
  onValueChange,
}: SwitchRowProps) {
  const isDark = useIsDarkMode();
  const defaultIconColor = isDark ? '#F1FEC8' : '#334155';
  const resolvedIconColor = iconColor || defaultIconColor;
  const hasIconBg = !!iconBg && iconBg !== 'transparent';

  return (
    <View style={styles.tile}>
      <View style={[styles.iconWell, hasIconBg ? { backgroundColor: iconBg } : styles.iconWellClean]}>
        <Ionicons name={icon} size={iconSize} color={resolvedIconColor} />
      </View>
      <View style={styles.rowBody}>
        <AppText numberOfLines={1} color={isDark ? '#FFFFFF' : '#0F172A'} style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color={isDark ? '#94A3B8' : '#64748B'} style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(next);
        }}
        trackColor={{ false: colors.border, true: colors.brand200 }}
        thumbColor={value ? colors.brand : '#FFFFFF'}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  innerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tileExpanded: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginLeft: 46,
    marginVertical: 1,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWellClean: {
    backgroundColor: 'transparent',
    width: 28,
    height: 28,
  },
  rowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.displaySemibold,
    color: '#0F172A',
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  titleDanger: {
    color: colors.red,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: font.regular,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 16,
  },
  subtitleDark: {
    color: '#94A3B8',
  },
});
