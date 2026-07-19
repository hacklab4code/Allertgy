import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LiquidGlassView } from './LiquidGlassView';
import { GlassLiquidTabBlob } from './glassFallback';
import { useNativeLiquidGlass } from './useNativeLiquidGlass';

type Props = {
  slide: SharedValue<number>;
  slotWidth: number;
  inset?: number;
  top: number;
  left: number;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Goccia indicatore tab — vetro nativo Apple (isInteractive) che scorre tra gli slot.
 * Su device senza Liquid Glass usa il fallback GlassLiquidTabBlob.
 */
export function LiquidGlassSlidingIndicator({
  slide,
  slotWidth,
  inset = 3,
  top,
  left,
  height,
  borderRadius = 22,
  style,
}: Props) {
  const { native } = useNativeLiquidGlass();
  const blobWidth = Math.max(0, slotWidth - inset * 2);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * slotWidth + inset }],
    width: blobWidth,
  }));

  if (slotWidth <= 0 || blobWidth <= 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.host,
        { top, left, height, borderRadius },
        blobStyle,
        style,
      ]}
    >
      {native ? (
        <LiquidGlassView
          interactive
          glassStyle="regular"
          tintColor="rgba(210, 195, 246, 0.20)"
          fallbackIntensity={88}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : (
        <GlassLiquidTabBlob />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
  },
});
