/**
 * Navigazione del locale: semaforo come controllo centrale,
 * con recensioni e informazioni in azioni indipendenti.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { InteractiveSemaforoOrb } from './InteractiveSemaforoOrb';

export type VenueTab = 'menu' | 'esperienza' | 'info';

type SideTab = Exclude<VenueTab, 'menu'>;

const ICONS: Record<SideTab, ReturnType<typeof require>> = {
  esperienza: require('../../../assets/venue_esperienza.png'),
  info: require('../../../assets/venue_info.png'),
};

type Props = {
  active: VenueTab;
  onChange: (tab: VenueTab) => void;
  language: string;
  activeStatus?: 'verde' | 'giallo' | 'rosso' | null;
  onOrbPress?: () => void;
};

function SideAction({
  tab,
  active,
  label,
  onPress,
}: {
  tab: SideTab;
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.sideAction, active && styles.sideActionActive]}
    >
      <Image source={ICONS[tab]} style={[styles.sideIcon, active && styles.sideIconActive]} resizeMode="contain" />
    </Pressable>
  );
}

export function VenueBottomBar({ active, onChange, language, activeStatus, onOrbPress }: Props) {
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase().startsWith('it');
  const bottomSafe = Math.max(insets.bottom, spacing.sm);

  const toggleTab = (tab: SideTab) => onChange(active === tab ? 'menu' : tab);

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wireframeRow, { paddingBottom: bottomSafe }]}>
        <Pressable style={[wireBox(), styles.wireframeSide]} onPress={() => toggleTab('esperienza')}>
          <AppText variant="caption">{isIt ? 'Recensioni' : 'Reviews'}</AppText>
        </Pressable>
        <Pressable style={[wireBox({ fill: '#000' }), styles.wireframeCenter]} onPress={onOrbPress}>
          <AppText variant="caption" style={{ color: '#FFF' }}>Semaforo</AppText>
        </Pressable>
        <Pressable style={[wireBox(), styles.wireframeSide]} onPress={() => toggleTab('info')}>
          <AppText variant="caption">Info</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.row, { paddingBottom: bottomSafe }]}>
        <SideAction
          tab="esperienza"
          active={active === 'esperienza'}
          label={isIt ? 'Scrivi esperienza' : 'Write review'}
          onPress={() => toggleTab('esperienza')}
        />

        <View style={styles.semaforoCard}>
          <InteractiveSemaforoOrb compact size={60} activeStatus={activeStatus} onPress={onOrbPress} />
        </View>

        <SideAction
          tab="info"
          active={active === 'info'}
          label={isIt ? 'Informazioni del locale' : 'Venue information'}
          onPress={() => toggleTab('info')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    alignItems: 'center',
    overflow: 'visible',
  },
  row: {
    width: '100%',
    paddingHorizontal: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sideAction: {
    width: 62,
    height: 58,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 7,
  },
  sideActionActive: {
    backgroundColor: colors.inkSoft,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  sideIcon: {
    width: 28,
    height: 28,
    opacity: 0.9,
  },
  sideIconActive: {
    width: 32,
    height: 32,
    opacity: 1,
  },
  semaforoCard: {
    flex: 1,
    maxWidth: 220,
    minWidth: 150,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  wireframeRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  wireframeSide: {
    width: 68,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wireframeCenter: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
