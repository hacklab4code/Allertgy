import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, font } from '../../theme';
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

export const CATEGORY_OUTLINE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ue: 'shield-checkmark-outline',
  frutta_guscio: 'nutrition-outline',
  frutta: 'leaf-outline',
  verdura: 'flower-outline',
  cereali: 'restaurant-outline',
  spezie: 'flame-outline',
  intolleranze: 'water-outline',
  preferenze: 'heart-outline',
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

  const cardStyle = [
    styles.cardBase,
    selected
      ? isDiet
        ? styles.cardDiet
        : intensity === 'lieve'
          ? styles.cardLieve
          : intensity === 'grave'
            ? styles.cardGrave
            : styles.cardMod
      : styles.cardUnselected,
  ];

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

  const severityLabel = isDiet
    ? (isIt ? 'Dieta' : 'Diet')
    : intensity === 'grave'
      ? (isIt ? 'Grave' : 'Severe')
      : intensity === 'lieve'
        ? (isIt ? 'Lieve' : 'Mild')
        : (isIt ? 'Media' : 'Moderate');

  const severityTagStyle = isDiet
    ? styles.tagDiet
    : intensity === 'grave'
      ? styles.tagGrave
      : intensity === 'lieve'
        ? styles.tagLieve
        : styles.tagMod;

  const severityTextTagStyle = isDiet
    ? styles.tagTextDiet
    : intensity === 'grave'
      ? styles.tagTextGrave
      : intensity === 'lieve'
        ? styles.tagTextLieve
        : styles.tagTextMod;

  return (
    <Pressable
      style={({ pressed }) => [styles.chipWrapper, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${displayName}, ${selected ? `Selezionato (${severityLabel})` : 'Non selezionato'}`}
    >
      <View style={cardStyle}>
        {/* Top Checkmark Badge */}
        {selected ? (
          <View style={[styles.checkBadge, badgeStyle]}>
            <Ionicons name="checkmark-outline" size={10} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.checkBadgePlaceholder} />
        )}

        {/* Emoji Bubble */}
        <View style={emojiWrapStyle}>
          <Text style={styles.chipEmoji}>{resolvedEmoji}</Text>
        </View>

        {/* Label */}
        <Text
          style={[styles.chipLabel, selected && styles.chipLabelSelected]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>

        {/* Bottom Severity Tag */}
        {selected ? (
          <View style={[styles.severityTag, severityTagStyle]}>
            <Text style={[styles.severityTagText, severityTextTagStyle]}>
              {severityLabel}
            </Text>
          </View>
        ) : (
          <View style={styles.severityTagPlaceholder} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipWrapper: {
    width: '31.3%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  cardBase: {
    width: '100%',
    minHeight: 122,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardUnselected: {
    backgroundColor: '#FAF9FE',
    borderWidth: 1.2,
    borderColor: '#EAE6F5',
  },
  cardGrave: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  cardMod: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  cardLieve: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  cardDiet: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },

  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkBadgePlaceholder: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
  },
  badgeGrave: {
    backgroundColor: '#EF4444',
  },
  badgeMod: {
    backgroundColor: '#F97316',
  },
  badgeLieve: {
    backgroundColor: '#EAB308',
  },
  badgeDiet: {
    backgroundColor: '#10B981',
  },

  emojiWrapBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 2,
  },
  emojiWrapUnselected: {
    backgroundColor: '#EFEBF8',
  },
  emojiWrapGrave: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  emojiWrapMod: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  emojiWrapLieve: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
  },
  emojiWrapDiet: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },

  chipEmoji: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  chipLabel: {
    fontSize: 12,
    lineHeight: 14.5,
    fontWeight: '600',
    color: '#4A4370',
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    minHeight: 29,
    marginTop: 3,
    marginBottom: 3,
    includeFontPadding: false,
  },
  chipLabelSelected: {
    color: '#322A63',
    fontWeight: '800',
    fontFamily: font.bold,
  },

  severityTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityTagPlaceholder: {
    height: 16,
  },
  tagGrave: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  tagTextGrave: {
    color: '#991B1B',
  },
  tagMod: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  tagTextMod: {
    color: '#9A3412',
  },
  tagLieve: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  tagTextLieve: {
    color: '#854D0E',
  },
  tagDiet: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tagTextDiet: {
    color: '#15803D',
  },
  severityTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: font.bold,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

