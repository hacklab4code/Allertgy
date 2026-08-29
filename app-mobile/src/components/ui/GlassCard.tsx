import React, { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { radius, WIREFRAME_MODE } from '../../theme';
import { SurfaceCard, type SurfaceTint } from './SurfaceCard';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  cardRadius?: number;
  padded?: boolean;
  tint?: SurfaceTint;
  accentColor?: string;
};

/** Card contenuto flat Violet Precision (non è glass — glass è solo chrome). */
export function GlassCard({
  children,
  onPress,
  style,
  testID,
  cardRadius = radius.md,
  padded = true,
  tint = 'none',
}: Props) {
  return (
    <SurfaceCard
      testID={testID}
      onPress={onPress}
      style={style}
      radius={cardRadius}
      padded={padded}
      tint={tint}
      elevation={WIREFRAME_MODE ? 0 : 1}
    >
      {children}
    </SurfaceCard>
  );
}
