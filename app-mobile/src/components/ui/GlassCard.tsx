import React, { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { radius, WIREFRAME_MODE } from '../../theme';
import { PuffyCard, type PuffyTint } from './PuffyCard';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  cardRadius?: number;
  padded?: boolean;
  tint?: PuffyTint;
  accentColor?: string;
};

/** Card contenuto — superficie puffy bianca (non glass). Nome storico mantenuto per retrocompatibilità. */
export function GlassCard({
  children,
  onPress,
  style,
  testID,
  cardRadius = radius.lg,
  padded = true,
  tint = 'none',
  accentColor,
}: Props) {
  return (
    <PuffyCard
      testID={testID}
      onPress={onPress}
      style={style}
      radius={cardRadius}
      padded={padded}
      tint={tint}
      accentColor={accentColor}
      elevation={WIREFRAME_MODE ? 0 : 5}
    >
      {children}
    </PuffyCard>
  );
}
