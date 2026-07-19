import React, { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, type GlassStyle } from 'expo-glass-effect';
import { GlassFallbackSurface } from './glassFallback';
import { useNativeLiquidGlass } from './useNativeLiquidGlass';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  glassStyle?: GlassStyle;
  interactive?: boolean;
  fallbackIntensity?: number;
};

/** Native iOS 26 Liquid Glass quando disponibile; fallback ricco su tutti gli altri device. */
export function LiquidGlassView({
  children,
  style,
  tintColor,
  glassStyle = 'regular',
  interactive = false,
  fallbackIntensity = 92,
}: Props) {
  const { native, glassOff } = useNativeLiquidGlass();

  if (native) {
    return (
      <GlassView
        pointerEvents={interactive ? 'auto' : 'none'}
        glassEffectStyle={glassStyle}
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme="light"
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <GlassFallbackSurface
      style={style}
      glassStyle={glassStyle === 'clear' ? 'clear' : 'regular'}
      tintColor={tintColor}
      fallbackIntensity={fallbackIntensity}
      interactive={interactive}
      reduceTransparency={glassOff}
    >
      {children}
    </GlassFallbackSurface>
  );
}
