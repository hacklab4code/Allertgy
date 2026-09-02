import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { colors, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

type Props = {
  imageUrl?: string | null;
  emoji?: string | { emoji?: string; color?: string };
  customEmoji?: string | { emoji?: string; color?: string };
  color?: string;
  index?: number;
  size?: number;
  active?: boolean;
  showCheckmark?: boolean;
  glow?: boolean;
};

/** Avatar bubble con supporto glow e badge di selezione attivo. */
export function AvatarBubble({
  imageUrl,
  emoji: rawEmoji,
  customEmoji,
  color: rawColor,
  index = 0,
  size = 64,
  active,
  showCheckmark = false,
  glow = false,
}: Props) {
  const fallback = avatarForIndex(index);
  const passedObj =
    (typeof customEmoji === 'object' && customEmoji !== null ? customEmoji : null)
    || (typeof rawEmoji === 'object' && rawEmoji !== null ? rawEmoji : null);

  const emoji =
    (typeof customEmoji === 'string' && customEmoji.trim() ? customEmoji : null)
    || (typeof rawEmoji === 'string' && rawEmoji.trim() ? rawEmoji : null)
    || passedObj?.emoji
    || fallback.emoji;

  const color =
    rawColor
    || passedObj?.color
    || fallback.color;

  if (WIREFRAME_MODE) {
    return (
      <View
        style={[
          wireBox({ fill: active ? '#000' : '#FFF' }),
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ fontSize: 10, color: active ? '#FFF' : '#000' }}>{String(emoji || '👤')}</Text>
      </View>
    );
  }

  const checkmarkSize = Math.max(16, Math.round(size * 0.36));

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      <View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderWidth: active ? 3 : 1.5,
            borderColor: active ? colors.brandInk : colors.border,
          },
          active && glow && styles.glowStyle,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: size * 0.46, textAlign: 'center' }}>{String(emoji || '👤')}</Text>
        )}
      </View>
      {active && showCheckmark && (
        <View
          style={[
            styles.checkmarkBadge,
            {
              width: checkmarkSize,
              height: checkmarkSize,
              borderRadius: checkmarkSize / 2,
              bottom: -2,
              right: -2,
            },
          ]}
        >
          <Text style={{ color: '#FFF', fontSize: checkmarkSize * 0.6, fontWeight: '900', textAlign: 'center', lineHeight: checkmarkSize }}>
            ✓
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowStyle: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  checkmarkBadge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});

export const AVATAR_EMOJIS = ['🧔', '👩', '👧', '👦', '🧑', '👶', '👵', '👴', '🐣', '🍀'];
export const AVATAR_COLORS = ['#FF9F1C', '#FF7096', '#3FCF73', '#5AA9FF', '#B388FF', '#FFD166', '#FF8FAB', '#06D6A0'];

export function avatarForIndex(i: number) {
  return { emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length], color: AVATAR_COLORS[i % AVATAR_COLORS.length] };
}
