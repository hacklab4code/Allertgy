import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CutoutOverlayProps {
  width?: number;
  height?: number;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientId?: string;
}

/**
 * Scoop morbido in basso a sinistra della foto col supporto per sfumature a scomparire.
 */
export function CutoutOverlay({
  width = 120,
  height = 44,
  color,
  gradientStart,
  gradientEnd,
  gradientId = 'cutoutGrad',
}: CutoutOverlayProps) {
  const flatEnd = width * 0.45;
  const transitionWidth = width - flatEnd;
  const cp1X = flatEnd + transitionWidth * 0.35;
  const cp2X = width - transitionWidth * 0.35;

  // S-curve matematica morbida per eliminare cuspidi e gradini
  const path = [
    `M 0 0`,
    `L ${flatEnd} 0`,
    `C ${cp1X} 0 ${cp2X} ${height} ${width} ${height}`,
    `L 0 ${height}`,
    `Z`,
  ].join(' ');

  const useGradient = Boolean(gradientStart && gradientEnd);
  const fill = useGradient ? `url(#${gradientId})` : (color || '#16A34A');

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {useGradient ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientStart} stopOpacity={1} />
              <Stop offset="70%" stopColor={gradientStart} stopOpacity={0.92} />
              <Stop offset="100%" stopColor={gradientEnd} stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Path d={path} fill={fill} />
      </Svg>
    </View>
  );
}


