import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

export type OutlineIconName = keyof typeof Ionicons.glyphMap;

export interface AppIconProps {
  name: OutlineIconName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}

/**
 * Standard Design System Icon Component for AllerTgy.
 * Regola: Usa ESCLUSIVAMENTE icone in stile Outline per mantenere perfetta coerenza visiva.
 */
export function AppIcon({ name, size = 20, color = '#23212C', style }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

export default AppIcon;
