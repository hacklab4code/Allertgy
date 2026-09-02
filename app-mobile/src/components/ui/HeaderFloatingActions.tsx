import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import SosHeaderButton from '../SosHeaderButton';
import NotificationBell from '../NotificationBell';
import { useFloatingHeader } from '../../store/floatingHeader';
import { useOwner } from '../../store/owner';
import { meshScrollY } from '../../hooks/useMeshInk';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { colors, font, radius } from '../../theme';
import { AppText } from './AppText';
import { SafeBlurView } from './SafeBlurView';

const COSMIC_NEBULA_IMAGE = require('../../../assets/cosmic_nebula_bg.jpg');

interface HeaderFloatingActionsProps {
  area?: 'customer' | 'owner';
}

/**
 * Notifiche e azioni flottanti coordinate — identico in tutte le sezioni dell'app.
 * Sempre fisso in alto allo scorrimento, con lo stesso sfondo cosmico frosted glass della Home.
 * Owner: nome locale operativo.
 * Customer: SOS a sinistra, Titolo o Wordmark al centro, Notifiche a destra.
 */
export function HeaderFloatingActions({ area = 'customer' }: HeaderFloatingActionsProps) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();
  const visible = useFloatingHeader((s) => s.visible);
  const title = useFloatingHeader((s) => s.title);
  const venueName = useOwner((s) => s.current?.name);
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const backdropAnimStyle = useAnimatedStyle(() => {
    const isHomeScreen = !title;
    if (isHomeScreen) {
      // Sulla Home: trasparente a riposo perché si fonde con la hero card,
      // emerge e si consolida fluidamente man mano che la card sale [70, 130].
      const opacity = interpolate(
        meshScrollY.value,
        [70, 130],
        [0, 1],
        Extrapolation.CLAMP,
      );
      return { opacity };
    }

    // Nelle altre sezioni: sempre solido al 100%, con la composizione visiva identica alla Home
    return { opacity: 1 };
  });

  const isOwner = area === 'owner';

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.layer, { paddingTop: insets.top + 6 }, animStyle]}
    >
      {/* Sfondo Glass IDENTICO alla Home con bordi stondati */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.backdropContainer, backdropAnimStyle]}
      >
        {/* 0. Fondo base Ambient Wash */}
        <LinearGradient
          colors={
            isDark
              ? ['#736B98', '#645B88', '#736B98']
              : ['#F4FDE2', '#F7FEE7', '#F4FDE2']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 1. Base Traslucida */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(23, 20, 32, 0.45)', 'rgba(35, 33, 44, 0.55)', 'rgba(45, 40, 59, 0.50)']
              : ['rgba(241, 254, 200, 0.96)', 'rgba(238, 252, 192, 0.92)', 'rgba(230, 248, 175, 0.88)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Glow */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99, 102, 241, 0.22)', 'rgba(192, 132, 252, 0.16)', 'transparent']
              : ['rgba(255, 255, 255, 0.65)', 'rgba(241, 254, 200, 0.20)', 'transparent']
          }
          start={{ x: isDark ? 1 : 0.5, y: 0 }}
          end={{ x: isDark ? 0 : 0.5, y: isDark ? 0.8 : 0.9 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 3. Sfocatura Nativa SafeBlurView */}
        <SafeBlurView
          intensity={25}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* 4. Tinta Glass Trasparente */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(35, 33, 44, 0.28)', 'rgba(35, 33, 44, 0.45)']
              : ['rgba(241, 254, 200, 0.40)', 'rgba(232, 250, 180, 0.55)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

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
                <AppText
                  variant="title"
                  style={[styles.title, isDark && styles.titleDark]}
                  numberOfLines={1}
                >
                  {title}
                </AppText>
              ) : (
                <AppText style={[styles.brandWordmark, isDark && styles.brandWordmarkDark]}>
                  aller<AppText style={{ color: isDark ? '#F1FEC8' : '#4D7C0F' }}>Tgy</AppText>
                </AppText>
              )}
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
    zIndex: 100,
    elevation: 100,
  },
  backdropContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    minHeight: 54,
  },
  side: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideEnd: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#23212C',
  },
  brandWordmark: {
    fontFamily: font.displayBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
    fontWeight: '900',
    textAlign: 'center',
    color: '#23212C',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  brandWordmarkDark: {
    color: '#FFFFFF',
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
