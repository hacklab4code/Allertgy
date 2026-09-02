import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { NavHeaderBackButton } from './NavHeaderBackButton';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { font } from '../../theme';

type Props = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  style?: StyleProp<ViewStyle>;
  showBack?: boolean;
};

/**
 * Header superiore unificato per le sotto-sezioni.
 * Completamente trasparente (senza barra bianca), con tasto Indietro Liquid Glass,
 * titolo centrato e slot per azioni a destra.
 */
export function ScreenTopHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  style,
  showBack = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();

  return (
    <View style={[styles.wrapper, { paddingTop: Math.max(insets.top, 12) + 6 }, style]}>
      <View style={styles.container}>
        <View style={styles.leftSlot}>
          {showBack ? <NavHeaderBackButton onPress={onBack} /> : null}
        </View>

        <View style={styles.centerSlot}>
          {title ? (
            <AppText
              numberOfLines={1}
              style={[
                styles.title,
                isDark && styles.titleDark,
              ]}
            >
              {title}
            </AppText>
          ) : null}
          {subtitle ? (
            <AppText
              variant="caption"
              numberOfLines={1}
              style={[
                styles.subtitle,
                isDark && styles.subtitleDark,
              ]}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {rightElement ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  leftSlot: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: font.bold,
    color: '#23212C',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  subtitleDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
