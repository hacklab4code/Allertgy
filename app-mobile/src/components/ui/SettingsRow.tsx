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
  danger?: boolean;
  /** Colore titolo (es. logout arancio). `danger` ha priorità. */
  titleColor?: string;
};

export function SettingsDivider() {
  return <View style={styles.divider} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsRow({
  icon,
  iconColor = colors.brand,
  iconBg = colors.brand50,
  title,
  subtitle,
  onPress,
  right,
  children,
  danger = false,
  titleColor,
}: Props) {
  const scale = useSharedValue(1);
  const resolvedTitleColor = danger ? colors.red : (titleColor ?? colors.brandInk);

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const body = (
    <View style={styles.innerRow}>
      <View style={[styles.iconWell, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.red : iconColor} />
      </View>
      <View style={styles.rowBody}>
        <AppText
          numberOfLines={1}
          color={resolvedTitleColor}
          style={[styles.title, danger && styles.titleDanger]}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            color={colors.textSecondary}
            style={styles.subtitle}
            numberOfLines={2}
          >
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      {right}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />
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
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export function SettingsSwitchRow({
  icon,
  iconColor = colors.brand,
  iconBg = colors.brand50,
  title,
  subtitle,
  value,
  onValueChange,
}: SwitchRowProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.iconWell, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowBody}>
        <AppText numberOfLines={1} color={colors.brandInk} style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color={colors.textSecondary} style={styles.subtitle} numberOfLines={2}>
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
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  innerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tileExpanded: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: 48,
    marginVertical: 2,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.displaySemibold,
    color: colors.brandInk,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  titleDanger: {
    color: colors.red,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: font.regular,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 16,
  },
});
