/**
 * Liquid-glass fallback — massima fedeltà su iOS <26, Android, web.
 */
import React, { type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { colors } from '../../theme';
import { SafeBlurView } from './SafeBlurView';
import { LiquidGlassCaustic, LiquidGlassSheen } from './LiquidGlassSheen';
import { useNativeLiquidGlass } from './useNativeLiquidGlass';

export type FallbackGlassStyle = 'regular' | 'clear';

type GlassPreset = {
  iosTint: BlurTint;
  androidTint: BlurTint;
  iosIntensityBoost: number;
  androidIntensityBoost: number;
  brandTint: string;
  frostTint: string;
  specularStrong: boolean;
  sheenWide: boolean;
};

const PRESETS: Record<FallbackGlassStyle, GlassPreset> = {
  regular: {
    iosTint: 'systemChromeMaterialLight',
    androidTint: 'light',
    iosIntensityBoost: 1,
    androidIntensityBoost: 1.4,
    brandTint: 'rgba(210, 195, 246, 0.18)',
    frostTint: 'rgba(255, 255, 255, 0.22)',
    specularStrong: false,
    sheenWide: false,
  },
  clear: {
    iosTint: 'systemUltraThinMaterialLight',
    androidTint: 'extraLight',
    iosIntensityBoost: 1.02,
    androidIntensityBoost: 1.25,
    brandTint: 'rgba(210, 195, 246, 0.12)',
    frostTint: 'rgba(255, 255, 255, 0.14)',
    specularStrong: true,
    sheenWide: true,
  },
};

type SurfaceProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  glassStyle?: FallbackGlassStyle;
  fallbackIntensity?: number;
  interactive?: boolean;
  reduceTransparency?: boolean;
  animated?: boolean;
};

function GlassSpecularStack({ strong = false }: { strong?: boolean }) {
  const topOpacity = strong ? 0.95 : 0.82;
  const midOpacity = strong ? 0.28 : 0.18;

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[
          `rgba(255,255,255,${topOpacity})`,
          `rgba(255,255,255,${midOpacity})`,
          'rgba(255,255,255,0.02)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.28, 0.55, 1]}
        style={styles.topGloss}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0)',
          'rgba(210, 195, 246, 0.10)',
          'rgba(54, 37, 92, 0.08)',
          'rgba(210, 195, 246, 0.18)',
        ]}
        locations={[0, 0.45, 0.78, 1]}
        style={styles.bottomGlow}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.leftEdgeGrad}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(54, 37, 92, 0.06)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rightEdgeGrad}
      />
      <View pointerEvents="none" style={[styles.topRim, strong && styles.topRimStrong]} />
      <View pointerEvents="none" style={styles.bottomRim} />
    </>
  );
}

function FrostedSolid({
  children,
  style,
  tintColor,
  glassStyle = 'regular',
  interactive = false,
}: Omit<SurfaceProps, 'fallbackIntensity' | 'reduceTransparency' | 'animated'>) {
  const preset = PRESETS[glassStyle];
  const overlay = tintColor ?? preset.brandTint;

  return (
    <View
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[styles.root, styles.frostedRoot, style]}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.72)' }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]} />
      <GlassSpecularStack strong={glassStyle === 'clear'} />
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

export function GlassFallbackSurface({
  children,
  style,
  tintColor,
  glassStyle = 'regular',
  fallbackIntensity = 92,
  interactive = false,
  reduceTransparency = false,
  animated = false,
}: SurfaceProps) {
  if (reduceTransparency) {
    return (
      <FrostedSolid style={style} tintColor={tintColor} glassStyle={glassStyle} interactive={interactive}>
        {children}
      </FrostedSolid>
    );
  }

  const preset = PRESETS[glassStyle];
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const intensity = Math.min(
    100,
    Math.round(
      fallbackIntensity * (isIOS ? preset.iosIntensityBoost : preset.androidIntensityBoost),
    ),
  );
  const overlay = tintColor ?? preset.brandTint;

  if (isWeb) {
    return (
      <View
        pointerEvents={interactive ? 'auto' : 'none'}
        style={[
          styles.root,
          styles.webGlass,
          { backgroundColor: overlay },
          style,
        ]}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: preset.frostTint }]} />
        <GlassSpecularStack strong={preset.specularStrong} />
        {animated ? <LiquidGlassSheen wide={preset.sheenWide} /> : null}
        {children ? <View style={styles.content}>{children}</View> : null}
      </View>
    );
  }

  return (
    <View pointerEvents={interactive ? 'auto' : 'none'} style={[styles.root, style]}>
      <SafeBlurView
        intensity={intensity}
        tint={isIOS ? preset.iosTint : preset.androidTint}
        blurReductionFactor={isIOS ? undefined : undefined}
        experimentalBlurMethod={isIOS ? undefined : 'none'}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: preset.frostTint }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: preset.brandTint }]} />

      {overlay !== preset.brandTint ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]} />
      ) : null}

      <LiquidGlassCaustic offset={glassStyle === 'clear' ? 'center' : 'left'} />
      <GlassSpecularStack strong={preset.specularStrong} />
      {animated ? <LiquidGlassSheen wide={preset.sheenWide} /> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

export function GlassGlossPill({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[styles.glossPill, style]}>
      <LiquidGlassViewShell fallbackIntensity={90} tintColor="rgba(255,255,255,0.38)" />
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.45)', 'rgba(210, 195, 246, 0.28)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glossPillRim} />
    </View>
  );
}

/** Goccia liquida scorrevole — indicatore tab stile TheFork (vetro + bordo glow). */
export function GlassLiquidTabBlob({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[styles.liquidTabBlob, style]}>
      <LiquidGlassViewShell fallbackIntensity={82} tintColor="rgba(210, 195, 246, 0.14)" />
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.78)',
          'rgba(210, 195, 246, 0.14)',
          'rgba(72,220,210,0.10)',
          'rgba(255,255,255,0.32)',
        ]}
        locations={[0, 0.35, 0.68, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.liquidTabBlobRim} />
      <View style={styles.liquidTabBlobGlow} />
    </View>
  );
}

function LiquidGlassViewShell({
  fallbackIntensity,
  tintColor,
}: {
  fallbackIntensity: number;
  tintColor: string;
}) {
  const { glassOff } = useNativeLiquidGlass();
  return (
    <GlassFallbackSurface
      animated={false}
      fallbackIntensity={fallbackIntensity}
      tintColor={tintColor}
      glassStyle="clear"
      reduceTransparency={glassOff}
      style={StyleSheet.absoluteFill}
    />
  );
}

export const glassShellBorder = {
  borderWidth: StyleSheet.hairlineWidth * 2,
  borderColor: 'rgba(255, 255, 255, 0.55)',
  borderTopColor: 'rgba(255, 255, 255, 0.95)',
  borderBottomColor: 'rgba(210, 195, 246, 0.45)',
  borderLeftColor: 'rgba(255, 255, 255, 0.65)',
  borderRightColor: 'rgba(210, 195, 246, 0.35)',
} as const;

export const glassCardShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 18,
  elevation: 6,
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  frostedRoot: { backgroundColor: 'rgba(255, 255, 255, 0.72)' },
  webGlass: {
    // @ts-expect-error — RN Web backdrop-filter
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
  },
  content: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  topGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    zIndex: 2,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '42%',
    zIndex: 2,
  },
  leftEdgeGrad: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 18,
    zIndex: 3,
  },
  rightEdgeGrad: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 14,
    zIndex: 3,
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.78)',
    zIndex: 4,
  },
  topRimStrong: { backgroundColor: 'rgba(255,255,255,0.95)' },
  bottomRim: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(210, 195, 246, 0.28)',
    zIndex: 4,
  },
  glossPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(210, 195, 246, 0.55)',
    borderTopColor: 'rgba(255,255,255,0.88)',
  },
  glossPillRim: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.82)',
    zIndex: 6,
  },
  liquidTabBlob: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(72, 220, 210, 0.62)',
    borderTopColor: 'rgba(255,255,255,0.90)',
    shadowColor: 'rgba(72, 220, 210, 0.55)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
  },
  liquidTabBlobRim: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.88)',
    zIndex: 6,
  },
  liquidTabBlobGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(72, 220, 210, 0.28)',
    zIndex: 7,
  },
});
