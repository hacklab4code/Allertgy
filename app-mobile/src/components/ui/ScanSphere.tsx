/**
 * Sfera blob 3D centrale — sostituisce il tasto Scansiona nella tab bar.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SCAN_SPHERE_SIZE } from '../../layoutConstants';
import { WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { ScanOrbVisual } from './ScanOrbVisual';

/** Area render blob leggermente più grande per le punte organiche */
const BLOB_RENDER_SIZE = Math.round(SCAN_SPHERE_SIZE * 1.35);

/** Diametro sfera — da layoutConstants */
export { SCAN_SPHERE_SIZE } from '../../layoutConstants';

type Props = {
  onPress: () => void;
  testID?: string;
};

export function ScanSphere({ onPress, testID }: Props) {
  const press = useSharedValue(0);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - press.value * 0.08 },
      { translateY: press.value * 3 },
    ],
  }));

  if (WIREFRAME_MODE) {
    return (
      <Pressable testID={testID} onPress={onPress} style={[wireBox({ fill: '#000' }), styles.wf]}>
        <AppText variant="caption" style={{ color: '#FFF', fontSize: 8 }}>SCAN</AppText>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="Scansiona"
        onPressIn={() => {
          press.value = withSpring(1, { damping: 12, stiffness: 400 });
        }}
        onPressOut={() => {
          press.value = withSpring(0, { damping: 10, stiffness: 280 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onPress();
        }}
        style={styles.hit}
        hitSlop={10}
      >
        <Animated.View style={[styles.blobHost, shellStyle]}>
          <ScanOrbVisual size={BLOB_RENDER_SIZE} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: BLOB_RENDER_SIZE,
    height: BLOB_RENDER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
  },
  hit: {
    width: BLOB_RENDER_SIZE,
    height: BLOB_RENDER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobHost: {
    width: BLOB_RENDER_SIZE,
    height: BLOB_RENDER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wf: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
