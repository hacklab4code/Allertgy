import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import SosHeaderButton from '../SosHeaderButton';
import NotificationBell from '../NotificationBell';
import { useFloatingHeader } from '../../store/floatingHeader';
import { useOwner } from '../../store/owner';
import { colors, font, radius } from '../../theme';
import { AppText } from './AppText';

interface HeaderFloatingActionsProps {
  area?: 'customer' | 'owner';
}

/**
 * Notifiche e azioni flottanti sul gradiente — titolo sezione al centro.
 * Owner: nome locale operativo (niente emoji chrome).
 */
export function HeaderFloatingActions({ area = 'customer' }: HeaderFloatingActionsProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const visible = useFloatingHeader((s) => s.visible);
  const title = useFloatingHeader((s) => s.title);
  const venueName = useOwner((s) => s.current?.name);
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [visible, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -18 }],
  }));

  const isOwner = area === 'owner';
  const isCustomerHome =
    !isOwner &&
    (pathname === '/' ||
      pathname === '/(tabs)/home' ||
      pathname === '/home' ||
      pathname?.startsWith('/(tabs)/home'));

  if (isCustomerHome) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.layer, { paddingTop: insets.top + 6 }, animStyle]}
    >
      <Animated.View pointerEvents="box-none" style={styles.row}>
        {isOwner ? (
          <View style={styles.ownerBadge}>
            <AppText variant="caption" style={styles.ownerEyebrow}>
              RISTORATORE
            </AppText>
            <AppText variant="bodyBold" style={styles.ownerVenue} numberOfLines={1}>
              {venueName || 'AllerTgy'}
            </AppText>
          </View>
        ) : (
          <>
            <View style={styles.side}>
              <SosHeaderButton />
            </View>
            <View style={styles.titleSlot} pointerEvents="none">
              {title ? (
                <AppText variant="title" style={styles.title} numberOfLines={1}>
                  {title}
                </AppText>
              ) : null}
            </View>
            <View style={[styles.side, styles.sideEnd]}>
              <NotificationBell />
            </View>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 44,
  },
  side: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideEnd: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.brandInk,
  },
  ownerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '78%',
  },
  ownerEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.onSurfaceMuted,
  },
  ownerVenue: {
    fontSize: 13,
    color: colors.brandInk,
  },
});
