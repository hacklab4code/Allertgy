import React from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './ui/AppText';
import { radius } from '../theme';

export type DietaryFilterId = 'all' | 'safe100' | 'gluten_free' | 'lactose_free' | 'vegan' | 'pizza' | 'sushi';

type FilterChip = {
  id: DietaryFilterId;
  label: string;
  labelEn: string;
};

type Props = {
  selectedFilter: DietaryFilterId;
  onSelectFilter: (id: DietaryFilterId) => void;
  isIt?: boolean;
};

const FILTERS: FilterChip[] = [
  { id: 'safe100', label: '🟢 100% Compatibili', labelEn: '🟢 100% Safe' },
  { id: 'gluten_free', label: '🌾 Senza Glutine', labelEn: '🌾 Gluten Free' },
  { id: 'lactose_free', label: '🥛 Senza Lattosio', labelEn: '🥛 Lactose Free' },
  { id: 'vegan', label: '🥗 Vegano', labelEn: '🥗 Vegan' },
  { id: 'pizza', label: '🍕 Pizzerie', labelEn: '🍕 Pizza' },
  { id: 'sushi', label: '🍣 Sushi', labelEn: '🍣 Sushi' },
];

export default function HomeDietaryFilterBar({
  selectedFilter,
  onSelectFilter,
  isIt = true,
}: Props) {
  const handleSelect = (id: DietaryFilterId) => {
    void Haptics.selectionAsync();
    onSelectFilter(id === selectedFilter ? 'all' : id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((item) => {
          const isSelected = selectedFilter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.label,
                  isSelected ? styles.labelSelected : styles.labelUnselected,
                ]}
              >
                {isIt ? item.label : item.labelEn}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  chipSelected: {
    backgroundColor: 'rgba(35, 33, 44, 0.85)',
    borderColor: 'rgba(241, 254, 200, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelUnselected: {
    color: '#475569',
  },
  labelSelected: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
});
