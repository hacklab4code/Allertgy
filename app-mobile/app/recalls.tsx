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
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader } from '../src/components/ui';
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
  const { allergie, subProfiles, language } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [pantryBarcodes, setPantryBarcodes] = useState<string[]>([]);
  const [favoriteBarcodes, setFavoriteBarcodes] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('tutti');

  useEffect(() => {
    async function loadData() {
      const pantry = await loadPantryItems();
      const favs = await loadProductFavorites();
      setPantryBarcodes(pantry.map((p) => p.barcode));
      setFavoriteBarcodes(favs.map((f) => f.barcode));
    }
    void loadData();
  }, []);

  const analyzedRecalls = useMemo(() => {
    return checkUserRecalls(
      OFFICIAL_FOOD_RECALLS,
      allergie,
      pantryBarcodes
    );
  }, [allergie, pantryBarcodes]);

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
    { id: 'frutta_a_guscio', label: 'Frutta a guscio' },
    { id: 'uova', label: 'Uova' },
  ];

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Richiami Ministeriali' : 'Food Recalls Feed'}
      />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* HERO SUMMARY CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="alert-circle-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {isIt ? 'Allerta Sicurezza Alimentare' : 'Food Safety Alerts'}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? 'Monitoraggio in tempo reale dei ritiri ministeriali per allergeni e contaminazioni.'
                    : 'Real-time monitoring of Ministry recalls for undeclared allergens and cross-contamination.'}
                </AppText>
              </View>
            </View>

            {/* QUICK STATS */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Ionicons name="documents-outline" size={14} color="#F1FEC8" />
                <AppText variant="caption" style={styles.statLabel}>
                  {isIt ? 'Totale attivi' : 'Active'}: <AppText variant="caption" style={styles.statValue}>{analyzedRecalls.length}</AppText>
                </AppText>
              </View>
              {urgentAlerts.length > 0 && (
                <View style={[styles.statBox, styles.statBoxAlert]}>
                  <Ionicons name="warning-outline" size={14} color="#FCA5A5" />
                  <AppText variant="caption" style={[styles.statLabel, { color: '#FECACA' }]}>
                    {isIt ? 'Tuoi allergeni' : 'Your allergens'}: <AppText variant="caption" style={[styles.statValue, { color: '#FECACA' }]}>{urgentAlerts.length}</AppText>
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* URGENT PANTRY WARNING */}
          {urgentAlerts.length > 0 && (
            <View style={styles.urgentBanner}>
              <View style={styles.urgentBannerHead}>
                <Ionicons name="warning-outline" size={22} color="#DC2626" />
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
                    <Ionicons name="shield-checkmark-outline" size={12} color="#FFFFFF" />
                    <AppText style={styles.hazardText}>{recall.hazardLevel}</AppText>
                  </View>
                  <AppText variant="caption" color="#64748B">
                    {new Date(recall.recallDate).toLocaleDateString()}
                  </AppText>
                </View>

                {matchedPantryItem && (
                  <View style={styles.matchedPantryBanner}>
                    <Ionicons name="basket-outline" size={14} color="#DC2626" />
                    <AppText variant="caption" style={{ color: '#DC2626', fontWeight: '800' }}>
                      {isIt ? `Presente nella tua dispensa: ${matchedPantryItem}` : `Found in your pantry: ${matchedPantryItem}`}
                    </AppText>
                  </View>
                )}

                <AppText variant="title" style={{ color: '#23212C', fontSize: 16, marginTop: 4 }}>
                  {recall.productName}
                </AppText>
                <AppText variant="caption" color="#475569" style={{ fontWeight: '700' }}>
                  {recall.brand} · {recall.manufacturer}
                </AppText>

                <View style={styles.reasonBox}>
                  <Ionicons name="warning-outline" size={14} color="#92400E" />
                  <AppText variant="caption" style={styles.reasonText}>
                    {recall.reason}
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
                  <Ionicons name="bulb-outline" size={14} color="#64748B" />
                  <AppText variant="caption" style={styles.instructionsText}>
                    {recall.instructions}
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
    paddingTop: 8,
  },
  scrollContent: {
    gap: 14,
    paddingTop: 4,
  },
  navBackBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },

  // HERO SUMMARY CARD COSMIC + VANILLA
  heroCard: {
    backgroundColor: '#23212C',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.2)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.3)',
  },
  heroTextContainer: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statBoxAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statValue: {
    fontWeight: '700',
    color: '#F1FEC8',
  },

  urgentBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 16,
  },
  urgentBannerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterScroll: {
    marginBottom: 2,
  },
  filterScrollContent: {
    gap: 8,
    paddingVertical: 2,
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
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  filterChipText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
  recallList: {
    gap: 14,
  },
  recallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reasonText: {
    flex: 1,
    color: '#92400E',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },
  lotBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 2,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  instructionsText: {
    flex: 1,
    color: '#475569',
    lineHeight: 16,
    fontSize: 12,
  },
});
