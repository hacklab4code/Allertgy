import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, Screen } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import {
  CROSS_REACTIVITY_DATABASE,
  type CrossReactionFamily,
} from '../src/services/crossReactivity';

export default function AllergieCrociateScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');

  const filteredFamilies = useMemo(() => {
    let list = CROSS_REACTIVITY_DATABASE;
    if (selectedFamilyId !== 'all') {
      list = list.filter((f) => f.id === selectedFamilyId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) =>
        f.inhalantName.toLowerCase().includes(q) ||
        f.proteinFamily.toLowerCase().includes(q) ||
        f.crossedFoods.some((food) => food.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedFamilyId, searchQuery]);

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Allergie Crociate & Pollini' : 'Pollen-Food Cross Allergies',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* SEARCH BAR */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isIt ? 'Cerca polline, frutto o proteina (es. Mela, Betulla, LTP)...' : 'Search pollen, food or protein...'}
              placeholderTextColor="#94A3B8"
              clearButtonMode="while-editing"
            />
          </View>

          {/* FAMILY FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
            <Pressable
              style={[styles.filterChip, selectedFamilyId === 'all' && styles.filterChipActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedFamilyId('all');
              }}
            >
              <AppText style={[styles.filterChipText, selectedFamilyId === 'all' && styles.filterChipTextActive]}>
                🌟 {isIt ? 'Tutte le famiglie' : 'All'}
              </AppText>
            </Pressable>
            {CROSS_REACTIVITY_DATABASE.map((f) => {
              const isSel = selectedFamilyId === f.id;
              return (
                <Pressable
                  key={f.id}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedFamilyId(f.id);
                  }}
                >
                  <AppText style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                    {f.inhalantEmoji} {f.inhalantName.split('&')[0].trim()}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* INFO CALLOUT BANNER */}
          <View style={styles.infoBanner}>
            <Ionicons name="flower-outline" size={22} color="#059669" />
            <AppText variant="caption" color="#065F46" style={{ flex: 1, lineHeight: 16 }}>
              {isIt
                ? 'La Sindrome Orale Allergica (OAS) si manifesta quando il sistema immunitario confonde le proteine dei pollini con quelle di alcuni frutti o vegetali.'
                : 'Pollen Food Allergy Syndrome (OAS) occurs when the immune system confuses pollen proteins with similar fruit or vegetable proteins.'}
            </AppText>
          </View>

          {/* FAMILIES LIST */}
          <View style={styles.familiesList}>
            {filteredFamilies.map((fam) => (
              <View key={fam.id} style={styles.familyCard}>
                <View style={styles.familyCardHead}>
                  <View style={styles.emojiCircle}>
                    <Text style={{ fontSize: 24 }}>{fam.inhalantEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title" style={{ fontSize: 16, color: '#1E1B4B' }}>
                      {fam.inhalantName}
                    </AppText>
                    <AppText variant="caption" color="#6366F1" style={{ fontWeight: '700' }}>
                      🧬 {fam.proteinFamily}
                    </AppText>
                  </View>
                </View>

                <AppText variant="caption" color="#475569" style={{ lineHeight: 17, marginTop: 4 }}>
                  {fam.description}
                </AppText>

                {/* THERMOLABILITY ADVICE BOX */}
                <View style={[styles.adviceBox, fam.thermolabile ? styles.adviceBoxSafe : styles.adviceBoxRisk]}>
                  <AppText variant="caption" style={[styles.adviceText, fam.thermolabile ? styles.adviceTextSafe : styles.adviceTextRisk]}>
                    {fam.cookingSafetyAdvice}
                  </AppText>
                </View>

                {/* CROSSED FOODS PILLS */}
                <AppText variant="caption" style={styles.crossedTitle}>
                  {isIt ? 'Alimenti associati a rischio:' : 'Cross-reactive foods:'}
                </AppText>
                <View style={styles.foodsGrid}>
                  {fam.crossedFoods.map((food) => (
                    <View
                      key={food.name}
                      style={[
                        styles.foodChip,
                        food.riskLevel === 'ALTO' ? styles.foodChipHigh : styles.foodChipMed,
                      ]}
                    >
                      <AppText style={[styles.foodChipText, food.riskLevel === 'ALTO' ? styles.foodChipTextHigh : styles.foodChipTextMed]}>
                        {food.name}
                      </AppText>
                      {food.rawOnlySafe ? (
                        <View style={styles.cookedBadge}>
                          <AppText style={{ fontSize: 9, color: '#047857', fontWeight: '800' }}>COTTO OK</AppText>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E1B4B',
    fontFamily: font.regular,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  infoBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  familiesList: {
    gap: 14,
  },
  familyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  familyCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adviceBox: {
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
  },
  adviceBoxSafe: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  adviceBoxRisk: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  adviceText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  adviceTextSafe: {
    color: '#166534',
  },
  adviceTextRisk: {
    color: '#991B1B',
  },
  crossedTitle: {
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 0.4,
  },
  foodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  foodChipHigh: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  foodChipMed: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  foodChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  foodChipTextHigh: {
    color: '#B91C1C',
  },
  foodChipTextMed: {
    color: '#B45309',
  },
  cookedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
