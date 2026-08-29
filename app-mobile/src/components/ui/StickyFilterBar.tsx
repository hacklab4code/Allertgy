import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

export type FilterKey = 'ALL' | 'SAFE' | 'WARN' | 'RISK';

export interface FilterCounts {
  all: number;
  safe: number;
  warn: number;
  risk: number;
}

export interface StickyFilterBarProps {
  activeFilter: FilterKey;
  counts: FilterCounts;
  onSelectFilter: (filter: FilterKey) => void;
  language?: string;
}

export const StickyFilterBar: React.FC<StickyFilterBarProps> = ({
  activeFilter,
  counts,
  onSelectFilter,
  language = 'it',
}) => {
  const isIt = language.toLowerCase().startsWith('it');

  const FILTERS: { key: FilterKey; label: string; count: number; dotColor?: string }[] = [
    { key: 'ALL', label: isIt ? 'Tutti' : 'All', count: counts.all },
    { key: 'SAFE', label: isIt ? 'Idonei' : 'Suitable', count: counts.safe, dotColor: '#10B981' },
    { key: 'WARN', label: isIt ? 'Con Tracce' : 'Traces', count: counts.warn, dotColor: '#F59E0B' },
    { key: 'RISK', label: isIt ? 'Non Idonei' : 'Avoid', count: counts.risk, dotColor: '#EF4444' },
  ];

  const handlePress = (key: FilterKey) => {
    void Haptics.selectionAsync();
    onSelectFilter(key);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.key)}
              style={({ pressed }) => [
                styles.chip,
                isActive ? styles.chipActive : styles.chipInactive,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label}, ${item.count} piatti`}
            >
              {item.dotColor && (
                <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
              )}
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isActive ? styles.countBadgeActive : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isActive ? styles.countTextActive : styles.countTextInactive,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F2FC',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DFF5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#36255C',
    borderColor: '#36255C',
    shadowColor: '#36255C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6DFF5',
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#1C0D30',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countBadgeInactive: {
    backgroundColor: '#EDE6FA',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextInactive: {
    color: '#36255C',
  },
});
