import { StyleSheet, View } from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';
import { colors, WIREFRAME_MODE } from '../../theme';

export function GlassHeaderBackground() {
  if (WIREFRAME_MODE) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />;
  }

  return (
    <LiquidGlassView
      glassStyle="clear"
      tintColor="rgba(210, 195, 246, 0.12)"
      fallbackIntensity={94}
      style={StyleSheet.absoluteFill}
    />
  );
}
