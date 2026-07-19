import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassIconButton } from './GlassIconButton';

/** Pulsante indietro liquid glass — schermate stack fuori dalle tab. */
export function GlassBackButton() {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={[styles.slot, { paddingTop: insets.top + 8 }]}>
        <GlassIconButton
          icon="chevron-back"
          onPress={() => router.back()}
          accessibilityLabel="Indietro"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  slot: {
    paddingLeft: 16,
    alignSelf: 'flex-start',
  },
});
