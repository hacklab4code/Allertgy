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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB', // border-gray-200
  },
  chipSelected: {
    backgroundColor: '#000000', // bg-black
    borderColor: '#000000',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelUnselected: {
    color: '#374151', // text-gray-700
  },
  labelSelected: {
    color: '#FFFFFF', // text-white
  },
});
