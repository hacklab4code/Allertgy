import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useProfileSheet } from '../../store/profileSheet';

/**
 * Backdrop touch overlay per chiudere il cambio profilo quando si tocca fuori dalla tab bar.
 * I profili sono ora integrati al 100% come unico pezzo all'interno di GlassTabBar (zero tagli/seam).
 */
export function ProfileContextSheet() {
  const insets = useSafeAreaInsets();
  const visible = useProfileSheet((s) => s.visible);
  const close = useProfileSheet((s) => s.close);
  const [mounted, setMounted] = React.useState(visible);

  const opacityAnim = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      opacityAnim.value = withTiming(1, { duration: 220 });
    } else {
      opacityAnim.value = withTiming(0, { duration: 180 });
      const timer = setTimeout(() => {
        setMounted(false);
      }, 190);
      return () => clearTimeout(timer);
    }
  }, [visible, opacityAnim]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacityAnim.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  if (!mounted && !visible) return null;

  const bottomSafe = Math.max(insets.bottom, 10);
  const DOCK_ESTIMATED_H = 160;

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    close();
  };

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, styles.portal]}>
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.backdrop,
          { bottom: bottomSafe + DOCK_ESTIMATED_H },
          backdropAnimStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    zIndex: 90,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});

