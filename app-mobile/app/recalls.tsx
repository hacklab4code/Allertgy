import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, Screen } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import {
  OFFICIAL_FOOD_RECALLS,
  checkUserRecalls,
  type FoodRecall,
  type RecallAlertMatch,
} from '../src/services/recalls';
import { loadPantryItems, loadProductFavorites } from '../src/services/productStorage';

export default function RecallsScreen() {
  const insets = useSafeAreaInsets();
  const { language, allergie } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [pantryNames, setPantryNames] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('tutti');

  useEffect(() => {
    async function loadUserProducts() {
      const [pantry, favs] = await Promise.all([loadPantryItems(), loadProductFavorites()]);
      const names = [...pantry.map((p) => p.name), ...favs.map((f) => f.name)];
      setPantryNames(names);
    }
    void loadUserProducts();
  }, []);

  const analyzedRecalls = useMemo(() => {
    return checkUserRecalls(OFFICIAL_FOOD_RECALLS, allergie, pantryNames);
  }, [allergie, pantryNames]);

  const urgentAlerts = useMemo(() => {
    return analyzedRecalls.filter((r) => r.matchedPantryItem || r.matchedAllergen);
  }, [analyzedRecalls]);

  const filteredRecalls = useMemo(() => {
    if (selectedFilter === 'tutti') return analyzedRecalls;
    if (selectedFilter === 'pericolo') return analyzedRecalls.filter((r) => r.matchedAllergen || r.matchedPantryItem);
    return analyzedRecalls.filter((r) => r.recall.allergenKey === selectedFilter);
  }, [analyzedRecalls, selectedFilter]);

  const FILTER_OPTIONS = [
    { id: 'tutti', label: isIt ? 'Tutti i richiami' : 'All recalls' },
    { id: 'pericolo', label: isIt ? '⚠️ Rilevanti per te' : '⚠️ Relevant for you' },
    { id: 'glutine', label: '🌾 Glutine' },
    { id: 'latte', label: '🥛 Latte' },
    { id: 'frutta_a_guscio', label: '🌰 Frutta guscio' },
    { id: 'uova', label: '🥚 Uova' },
  ];

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Richiami Ministeriali' : 'Food Recalls Feed',
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
          {/* URGENT PANTRY WARNING */}
          {urgentAlerts.length > 0 && (
            <View style={styles.urgentBanner}>
              <View style={styles.urgentBannerHead}>
                <Ionicons name="warning" size={22} color="#DC2626" />
                <AppText variant="bodyBold" style={{ color: '#991B1B', flex: 1 }}>
                  {isIt
                    ? `Attenzione: ${urgentAlerts.length} richiami attivi per i tuoi allergeni!`
                    : `Warning: ${urgentAlerts.length} active recalls matching your allergens!`}
                </AppText>
              </View>
              <AppText variant="caption" color="#7F1D1D" style={{ lineHeight: 17, marginTop: 4 }}>
                {isIt
                  ? 'Il Ministero della Salute ha emesso avvisi di sicurezza per prodotti con allergeni non dichiarati o contaminazione.'
                  : 'Health Ministry issued safety alerts for products with undeclared allergens.'}
              </AppText>
            </View>
          )}

          {/* FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
            {FILTER_OPTIONS.map((opt) => {
              const isSelected = selectedFilter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedFilter(opt.id);
                  }}
                >
                  <AppText style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* RECALLS LIST */}
          <View style={styles.recallList}>
            {filteredRecalls.map(({ recall, matchedAllergen, matchedPantryItem }) => (
              <View key={recall.id} style={[styles.recallCard, (matchedAllergen || matchedPantryItem) && styles.recallCardDanger]}>
                <View style={styles.recallCardHead}>
                  <View style={[styles.hazardPill, recall.hazardLevel === 'ALTO' ? styles.hazardHigh : styles.hazardMed]}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                    <AppText style={styles.hazardText}>{recall.hazardLevel}</AppText>
                  </View>
                  <AppText variant="caption" color="#64748B">
                    {new Date(recall.recallDate).toLocaleDateString()}
                  </AppText>
                </View>

                {matchedPantryItem && (
                  <View style={styles.matchedPantryBanner}>
                    <Ionicons name="basket" size={14} color="#DC2626" />
                    <AppText variant="caption" style={{ color: '#DC2626', fontWeight: '800' }}>
                      {isIt ? `Presente nella tua dispensa: ${matchedPantryItem}` : `Found in your pantry: ${matchedPantryItem}`}
                    </AppText>
                  </View>
                )}

                <AppText variant="title" style={{ color: '#1E1B4B', fontSize: 16, marginTop: 4 }}>
                  {recall.productName}
                </AppText>
                <AppText variant="caption" color="#4B5563" style={{ fontWeight: '700' }}>
                  {recall.brand} · {recall.manufacturer}
                </AppText>

                <View style={styles.reasonBox}>
                  <AppText variant="caption" style={styles.reasonText}>
                    ⚠️ {recall.reason}
                  </AppText>
                </View>

                <View style={styles.lotBox}>
                  <AppText variant="caption" color="#64748B">
                    <AppText style={{ fontWeight: '700' }}>{isIt ? 'Lotti interessati:' : 'Lots:'} </AppText>
                    {recall.lotNumbers.join(', ')}
                  </AppText>
                  {recall.expiryDates && (
                    <AppText variant="caption" color="#64748B">
                      <AppText style={{ fontWeight: '700' }}>{isIt ? 'Scadenze:' : 'Expiry:'} </AppText>
                      {recall.expiryDates.join(', ')}
                    </AppText>
                  )}
                </View>

                <View style={styles.instructionsBox}>
                  <AppText variant="caption" style={styles.instructionsText}>
                    💡 {recall.instructions}
                  </AppText>
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
  urgentBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  urgentBannerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterScrollContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  recallList: {
    gap: 14,
  },
  recallCard: {
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
  recallCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  recallCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hazardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  hazardHigh: {
    backgroundColor: '#DC2626',
  },
  hazardMed: {
    backgroundColor: '#D97706',
  },
  hazardText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  matchedPantryItem: {
    color: '#DC2626',
  },
  matchedPantryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: 4,
  },
  reasonBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reasonText: {
    color: '#92400E',
    fontWeight: '700',
    lineHeight: 16,
  },
  lotBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 2,
  },
  instructionsBox: {
    paddingTop: 4,
  },
  instructionsText: {
    color: '#4B5563',
    lineHeight: 16,
  },
});
