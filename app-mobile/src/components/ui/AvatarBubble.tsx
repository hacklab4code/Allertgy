import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radius, puffyShadow, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

type Props = {
  emoji: string;
  color: string;
  size?: number;
  active?: boolean;
};

export function AvatarBubble({ emoji, color, size = 64, active }: Props) {
  if (WIREFRAME_MODE) {
    return (
      <View
        style={[
          wireBox({ fill: active ? '#000' : '#FFF' }),
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ fontSize: 10, color: active ? '#FFF' : '#000' }}>{emoji}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: active ? 3 : 2,
          borderColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
        },
        active ? puffyShadow(10) : puffyShadow(4),
      ]}
    >
      <View style={[styles.gloss, { width: size * 0.4, height: size * 0.22, top: size * 0.12 }]} />
      <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gloss: {
    position: 'absolute',
    left: '22%',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '-18deg' }],
  },
});

export const AVATAR_EMOJIS = ['🧔', '👩', '👧', '👦', '🧑', '👶', '👵', '👴', '🐣', '🍀'];
export const AVATAR_COLORS = ['#FF9F1C', '#FF7096', '#3FCF73', '#5AA9FF', '#B388FF', '#FFD166', '#FF8FAB', '#06D6A0'];

export function avatarForIndex(i: number) {
  return { emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length], color: AVATAR_COLORS[i % AVATAR_COLORS.length] };
}
