/**
 * InteractiveSemaforoOrb — Cerchio interattivo semaforo con 3 colori animati (Verde, Giallo, Rosso)
 * e Glass Card glassy backdrop.
 * Inserito a fianco a destra nella TabBar quando si seleziona un ristorante.
 */
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeBlurView } from './SafeBlurView';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme';

interface Props {
  compact?: boolean;
  size?: number;
  label?: string;
  onPress?: () => void;
  activeStatus?: 'verde' | 'giallo' | 'rosso' | null;
}

export function InteractiveSemaforoOrb({
  compact = true,
  size = compact ? 64 : 100,
  label,
  onPress,
  activeStatus,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<'verde' | 'giallo' | 'rosso' | null>(activeStatus || null);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Animazioni di movimento fluido dei 3 blob semaforo (Verde, Giallo, Rosso)
  const blob1TransX = useSharedValue(0);
  const blob1TransY = useSharedValue(0);
  const blob2TransX = useSharedValue(0);
  const blob2TransY = useSharedValue(0);
  const blob3TransX = useSharedValue(0);
  const blob3TransY = useSharedValue(0);

  React.useEffect(() => {
    // Blob 1: Verde (Top-Left movement)
    blob1TransX.value = withRepeat(
      withSequence(
        withTiming(size * 0.25, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(size * 0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-size * 0.1, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1TransY.value = withRepeat(
      withSequence(
        withTiming(size * 0.1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(size * 0.25, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(size * 0.15, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Blob 2: Giallo (Bottom-Right movement)
    blob2TransX.value = withRepeat(
      withSequence(
        withTiming(-size * 0.25, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(-size * 0.1, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
        withTiming(size * 0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2TransY.value = withRepeat(
      withSequence(
        withTiming(-size * 0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-size * 0.25, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-size * 0.15, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Blob 3: Rosso (Center-Diagonal movement)
    blob3TransX.value = withRepeat(
      withSequence(
        withTiming(size * 0.15, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(-size * 0.18, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob3TransY.value = withRepeat(
      withSequence(
        withTiming(-size * 0.18, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(size * 0.12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [size]);

  React.useEffect(() => {
    if (activeStatus !== undefined) {
      setSelectedColor(activeStatus);
    }
  }, [activeStatus]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(1.12, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 16, stiffness: 200 })
    );
    rotation.value = withSequence(
      withTiming(8, { duration: 100 }),
      withTiming(-8, { duration: 100 }),
      withTiming(0, { duration: 120 })
    );

    if (onPress) {
      onPress();
    } else {
      setSelectedColor((prev) => {
        if (prev === 'verde') return 'giallo';
        if (prev === 'giallo') return 'rosso';
        return 'verde';
      });
    }
  };

  // Shared values per la transizione fluida dei colori al tap del semaforo
  const opacityGreen = useSharedValue(0.85);
  const scaleGreen = useSharedValue(1);
  const opacityYellow = useSharedValue(0.85);
  const scaleYellow = useSharedValue(1);
  const opacityRed = useSharedValue(0.85);
  const scaleRed = useSharedValue(1);

  React.useEffect(() => {
    if (selectedColor === 'verde') {
      opacityGreen.value = withTiming(1, { duration: 400 });
      scaleGreen.value = withSpring(1.5, { damping: 14, stiffness: 180 });
      opacityYellow.value = withTiming(0.12, { duration: 400 });
      scaleYellow.value = withTiming(0.75, { duration: 400 });
      opacityRed.value = withTiming(0.12, { duration: 400 });
      scaleRed.value = withTiming(0.75, { duration: 400 });
    } else if (selectedColor === 'giallo') {
      opacityGreen.value = withTiming(0.12, { duration: 400 });
      scaleGreen.value = withTiming(0.75, { duration: 400 });
      opacityYellow.value = withTiming(1, { duration: 400 });
      scaleYellow.value = withSpring(1.5, { damping: 14, stiffness: 180 });
      opacityRed.value = withTiming(0.12, { duration: 400 });
      scaleRed.value = withTiming(0.75, { duration: 400 });
    } else if (selectedColor === 'rosso') {
      opacityGreen.value = withTiming(0.12, { duration: 400 });
      scaleGreen.value = withTiming(0.75, { duration: 400 });
      opacityYellow.value = withTiming(0.12, { duration: 400 });
      scaleYellow.value = withTiming(0.75, { duration: 400 });
      opacityRed.value = withTiming(1, { duration: 400 });
      scaleRed.value = withSpring(1.5, { damping: 14, stiffness: 180 });
    } else {
      opacityGreen.value = withTiming(0.85, { duration: 400 });
      scaleGreen.value = withTiming(1, { duration: 400 });
      opacityYellow.value = withTiming(0.85, { duration: 400 });
      scaleYellow.value = withTiming(1, { duration: 400 });
      opacityRed.value = withTiming(0.85, { duration: 400 });
      scaleRed.value = withTiming(1, { duration: 400 });
    }
  }, [selectedColor]);

  const animatedWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    opacity: opacityGreen.value,
    transform: [
      { translateX: blob1TransX.value },
      { translateY: blob1TransY.value },
      { scale: scaleGreen.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    opacity: opacityYellow.value,
    transform: [
      { translateX: blob2TransX.value },
      { translateY: blob2TransY.value },
      { scale: scaleYellow.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    opacity: opacityRed.value,
    transform: [
      { translateX: blob3TransX.value },
      { translateY: blob3TransY.value },
      { scale: scaleRed.value },
    ],
  }));

  const blobSize = Math.round(size * 0.72);

  return (
    <View style={styles.outerContainer}>
      <Pressable onPress={handlePress} style={styles.pressableHit}>
        <Animated.View style={[animatedWrapStyle, styles.wrap]}>
          {/* Sfera Glass sferica perfettamente circolare e uniforme */}
          <View
            style={[
              styles.glassWrapper,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            {/* Blob 1: Semaforo Verde */}
            <Animated.View
              style={[
                styles.blob,
                blob1Style,
                {
                  width: blobSize,
                  height: blobSize,
                  borderRadius: blobSize / 2,
                  top: -blobSize * 0.15,
                  left: -blobSize * 0.15,
                },
              ]}
            >
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: '#34C759' }]}
              />
            </Animated.View>

            {/* Blob 2: Semaforo Giallo */}
            <Animated.View
              style={[
                styles.blob,
                blob2Style,
                {
                  width: blobSize,
                  height: blobSize,
                  borderRadius: blobSize / 2,
                  bottom: -blobSize * 0.15,
                  right: -blobSize * 0.15,
                },
              ]}
            >
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: '#FFCC00' }]}
              />
            </Animated.View>

            {/* Blob 3: Semaforo Rosso */}
            <Animated.View
              style={[
                styles.blob,
                blob3Style,
                {
                  width: blobSize,
                  height: blobSize,
                  borderRadius: blobSize / 2,
                  top: size * 0.15,
                  right: -blobSize * 0.05,
                },
              ]}
            >
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B30' }]}
              />
            </Animated.View>

            {/* Strato Blur uniforme circolare */}
            <View style={[styles.glassCard, { borderRadius: size / 2 }]}>
              {Platform.OS !== 'web' ? (
                <SafeBlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {label ? <Text style={styles.labelText}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  blob: {
    position: 'absolute',
    opacity: 0.85,
    zIndex: 1,
    overflow: 'hidden',
  },
  glassCard: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  labelText: {
    marginTop: 6,
    color: colors.brandInk,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
});
