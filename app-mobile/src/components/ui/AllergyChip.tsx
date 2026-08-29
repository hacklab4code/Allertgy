import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { font } from '../../theme';
import type { Allergen, AllergyCriterio, AllergyIntensity } from '../../types';
import { TRANSLATED_ALLERGENS } from '../../engine/translations';

export const CATEGORY_ICONS: Record<string, string> = {
  ue: '🛡️',
  frutta_guscio: '🌰',
  frutta: '🍓',
  verdura: '🥦',
  cereali: '🌾',
  spezie: '🧂',
  intolleranze: '🥛',
  preferenze: '🌱',
};

interface AllergyChipProps {
  a: Allergen;
  selected: boolean;
  intensity?: AllergyIntensity;
  criterio?: AllergyCriterio;
  onToggle: () => void;
  onConfigure: () => void;
  isIt?: boolean;
}

export function AllergyChip({
  a,
  selected,
  intensity = 'moderata',
  criterio = 'assoluto',
  onToggle,
  onConfigure,
  isIt = true,
}: AllergyChipProps) {
  const isDiet = Boolean(a.is_diet);
  const displayName = isIt
    ? a.name_it
    : TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it;

  const codeKey = (a.code || '').toLowerCase();
  const categoryKey = a.category || 'ue';

  const resolvedEmoji =
    a.emoji && a.emoji !== '⚠️'
      ? a.emoji
      : TRANSLATED_ALLERGENS[codeKey]?.emoji || CATEGORY_ICONS[categoryKey] || '⚠️';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfigure();
  };

  const emojiWrapStyle = [
    styles.emojiWrapBase,
    selected
      ? isDiet
        ? styles.emojiWrapDiet
        : intensity === 'lieve'
        ? styles.emojiWrapLieve
        : intensity === 'grave'
        ? styles.emojiWrapGrave
        : styles.emojiWrapMod
      : styles.emojiWrapUnselected,
  ];

  const badgeStyle = isDiet
    ? styles.badgeDiet
    : intensity === 'lieve'
    ? styles.badgeLieve
    : intensity === 'grave'
    ? styles.badgeGrave
    : styles.badgeMod;

  const badgeIconColor = intensity === 'lieve' ? '#2A2452' : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [styles.chipContainer, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={260}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${displayName}, ${selected ? 'Selezionato' : 'Non selezionato'}`}
    >
      <View style={emojiWrapStyle}>
        <Text style={styles.chipEmoji}>{resolvedEmoji}</Text>
        {selected && (
          <View style={[styles.badge, badgeStyle]}>
            <Ionicons name="checkmark" size={11} color={badgeIconColor} />
          </View>
        )}
      </View>
      <Text
        style={[styles.chipLabel, selected && styles.chipLabelSelected]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {displayName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  emojiWrapBase: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  emojiWrapUnselected: {
    backgroundColor: 'transparent',
  },
  emojiWrapGrave: {
    borderWidth: 2.5,
    borderColor: '#E5484D',
    backgroundColor: 'rgba(229, 72, 77, 0.12)',
  },
  emojiWrapMod: {
    borderWidth: 2.5,
    borderColor: '#F5A524',
    backgroundColor: 'rgba(245, 165, 36, 0.12)',
  },
  emojiWrapLieve: {
    borderWidth: 2.5,
    borderColor: '#F7CE45',
    backgroundColor: 'rgba(247, 206, 69, 0.15)',
  },
  emojiWrapDiet: {
    borderWidth: 2.5,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  chipEmoji: {
    fontSize: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F3F1FA',
  },
  badgeGrave: {
    backgroundColor: '#E5484D',
  },
  badgeMod: {
    backgroundColor: '#F5A524',
  },
  badgeLieve: {
    backgroundColor: '#F7CE45',
  },
  badgeDiet: {
    backgroundColor: '#10B981',
  },
  chipLabel: {
    fontSize: 13.5,
    lineHeight: 16,
    fontWeight: '600',
    color: '#2A2452',
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  chipLabelSelected: {
    color: '#322A63',
    fontWeight: '700',
    fontFamily: font.bold,
  },
});
