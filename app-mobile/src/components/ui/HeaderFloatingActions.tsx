import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SosHeaderButton from '../SosHeaderButton';
import NotificationBell from '../NotificationBell';
import { LiquidGlassView } from './LiquidGlassView';
import { colors } from '../../theme';

/** SOS + notifiche in una barra glass fissa — non fluttuano sulle card. */
export function HeaderFloatingActions() {
  const insets = useSafeAreaInsets();
  const barHeight = insets.top + 52;

  return (
    <View pointerEvents="box-none" style={[styles.layer, { height: barHeight }]}>
      <LiquidGlassView
        glassStyle="clear"
        tintColor="rgba(246, 242, 252, 0.72)"
        fallbackIntensity={88}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="box-none"
        style={[styles.row, { paddingTop: insets.top + 6 }]}
      >
        <SosHeaderButton />
        <NotificationBell />
      </View>
      <View style={styles.hairline} />
    </View>
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
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
