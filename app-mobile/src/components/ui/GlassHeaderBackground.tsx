import React from 'react';
import { StyleSheet, View } from 'react-native';

export function GlassHeaderBackground() {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} />;
}
