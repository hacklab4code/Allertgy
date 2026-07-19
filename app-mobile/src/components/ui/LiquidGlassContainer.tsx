import React, { type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { GlassContainer } from 'expo-glass-effect';
import { useNativeLiquidGlass } from './useNativeLiquidGlass';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Distanza in pt oltre cui i vetri nativi iniziano a fondersi (liquid merge Apple). */
  spacing?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/**
 * GlassContainer nativo iOS 26 — i vetri figli si fondono come nel tab bar di sistema.
 * Fallback: View normale su Android / iOS < 26.
 */
export function LiquidGlassContainer({ children, style, spacing = 14, onLayout }: Props) {
  const { native } = useNativeLiquidGlass();

  if (native) {
    return (
      <GlassContainer spacing={spacing} style={style} onLayout={onLayout}>
        {children}
      </GlassContainer>
    );
  }

  return (
    <View style={style} onLayout={onLayout}>
      {children}
    </View>
  );
}
