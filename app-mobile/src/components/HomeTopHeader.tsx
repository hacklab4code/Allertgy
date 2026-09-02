import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDarkMode } from '../hooks/useAppTheme';
import { BlurView } from 'expo-blur';
import { font } from '../theme';
import { AppText } from './ui/AppText';
import SosHeaderButton from './SosHeaderButton';
import NotificationBell from './NotificationBell';

interface HomeTopHeaderProps {
  scrollY?: SharedValue<number>;
}

export default function HomeTopHeader({ scrollY }: HomeTopHeaderProps) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();

  return (
    <View pointerEvents="box-none" style={[styles.headerContainer, { paddingTop: insets.top + 6 }]}>
      {/* 1. Sfocatura nativa */}
      <BlurView
        intensity={25}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Tinta esatta trasparente */}
      <View
        style={[
          StyleSheet.absoluteFill,
          isDark ? styles.cosmicOverlay : styles.vanillaOverlay,
        ]}
        pointerEvents="none"
      />

      {/* Contenuto: SOS a sinistra | allerTgy al centro | Notifiche a destra */}
      <View pointerEvents="box-none" style={styles.content}>
        <View style={styles.sideLeft}>
          <SosHeaderButton />
        </View>

        <View style={styles.brandCenterSlot} pointerEvents="none">
          <AppText style={[styles.brandWordmark, isDark && styles.brandWordmarkDark]}>
            aller<AppText style={{ color: isDark ? '#F1FEC8' : '#4D7C0F' }}>Tgy</AppText>
          </AppText>
        </View>

        <View style={styles.sideRight}>
          <NotificationBell />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute', // FONDAMENTALE: scollega l'header dal normale flusso della pagina
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Lo costringe a stare sempre in primo piano
    elevation: 100,
    backgroundColor: 'transparent', // DEVE essere trasparente, nessun colore solido qui!
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden', // Ritaglia il blur sulla curva inferiore
  },
  vanillaOverlay: {
    backgroundColor: 'rgba(241, 254, 200, 0.88)',
  },
  cosmicOverlay: {
    backgroundColor: 'rgba(35, 33, 44, 0.55)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 56,
    width: '100%',
  },
  brandCenterSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
  brandWordmarkDark: {
    color: '#FFFFFF',
  },
  sideLeft: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideRight: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
