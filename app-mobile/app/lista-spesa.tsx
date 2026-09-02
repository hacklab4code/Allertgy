import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
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
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader } from '../src/components/ui';
import { font, radius } from '../src/theme';
import {
  loadShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCompletedItems,
  checkItemAllergenWarning,
  type ShoppingItem,
} from '../src/services/shoppingList';

export default function ListaSpesaScreen() {
  const insets = useSafeAreaInsets();
  const { language, allergie } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('altro');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    async function loadData() {
      const data = await loadShoppingList();
      setItems(data);
    }
    void loadData();
  }, []);

  const warningResult = useMemo(() => {
    if (!inputText.trim()) return null;
    return checkItemAllergenWarning(inputText, allergie);
  }, [inputText, allergie]);

  const handleAddItem = async () => {
    if (!inputText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await addShoppingItem(inputText, selectedCategory, allergie);
    setItems(updated);
    setInputText('');
    Keyboard.dismiss();
  };

  const handleToggle = async (id: string) => {
    void Haptics.selectionAsync();
    const updated = await toggleShoppingItem(id);
    setItems(updated);
  };

  const handleDelete = async (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await deleteShoppingItem(id);
    setItems(updated);
  };

  const handleClearCompleted = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = await clearCompletedItems();
    setItems(updated);
  };

  const pendingItems = useMemo(() => items.filter((i) => !i.checked), [items]);
  const completedItems = useMemo(() => items.filter((i) => i.checked), [items]);
  const completedCount = completedItems.length;
  const pendingCount = pendingItems.length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'pending') return pendingItems;
    if (selectedFilter === 'completed') return completedItems;
    return items;
  }, [items, selectedFilter, pendingItems, completedItems]);

  const CATEGORIES = [
    { id: 'fresco', label: isIt ? '🥬 Freschi' : '🥬 Fresh' },
    { id: 'dispensa', label: isIt ? '🥫 Dispensa' : '🥫 Pantry' },
    { id: 'forno', label: isIt ? '🥖 Forno' : '🥖 Bakery' },
    { id: 'bevande', label: isIt ? '🧃 Bevande' : '🧃 Drinks' },
    { id: 'altro', label: isIt ? '🏷️ Altro' : '🏷️ Other' },
  ];

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Lista della Spesa Sicura' : 'Safe Grocery List'}
        rightElement={
          completedCount > 0 ? (
            <Pressable onPress={handleClearCompleted} hitSlop={8} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={14} color="#DC2626" />
              <AppText variant="caption" style={styles.clearBtnText}>
                {isIt ? 'Pulisci spuntati' : 'Clear done'}
              </AppText>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* 1. HERO SUMMARY CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="cart-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {isIt ? 'Spesa Sicura & Allergen-Free' : 'Safe Grocery Assistant'}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? 'Verifica automatica degli ingredienti incompatibili con il tuo profilo attivo.'
                    : 'Real-time safety check against your active allergy profile.'}
                </AppText>
              </View>
            </View>

            {/* QUICK STATS & PROGRESS */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Ionicons name="checkbox-outline" size={14} color="#F1FEC8" />
                <AppText variant="caption" style={styles.statLabel}>
                  {isIt ? 'Acquistati' : 'Completed'}: <AppText variant="caption" style={styles.statValue}>{completedCount}/{items.length}</AppText>
                </AppText>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="bag-handle-outline" size={14} color="rgba(255,255,255,0.7)" />
                <AppText variant="caption" style={styles.statLabel}>
                  {isIt ? 'Da comprare' : 'Pending'}: <AppText variant="caption" style={styles.statValue}>{pendingCount}</AppText>
                </AppText>
              </View>
            </View>

            {/* PROGRESS BAR TRACK */}
            {items.length > 0 && (
              <View style={styles.progressWrap}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <AppText variant="caption" style={styles.progressPercentText}>
                  {progressPercent}% {isIt ? 'completato' : 'done'}
                </AppText>
              </View>
            )}
          </View>

          {/* 2. ADD ITEM INPUT CARD */}
          <View style={styles.addCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isIt ? 'Aggiungi alimento (es. Pasta mais, Latte avena)...' : 'Add grocery item...'}
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                onSubmitEditing={handleAddItem}
              />
              <Pressable
                style={[styles.addBtn, !inputText.trim() && styles.addBtnDisabled]}
                onPress={handleAddItem}
                disabled={!inputText.trim()}
              >
                <Ionicons name="add-outline" size={22} color="#23212C" />
              </Pressable>
            </View>

            {/* LIVE SAFETY DETECTOR BANNER */}
            {warningResult && (
              <View style={styles.liveWarningPill}>
                <Ionicons name="warning-outline" size={15} color="#DC2626" />
                <AppText variant="caption" color="#991B1B" style={styles.liveWarningText}>
                  {warningResult}
                </AppText>
              </View>
            )}

            {/* CATEGORY SELECTOR CHIPS */}
            <View style={styles.categoryWrap}>
              <AppText variant="caption" style={styles.categoryLabel}>
                {isIt ? 'Reparto supermercato:' : 'Aisle:'}
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSel = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.catChip, isSel && styles.catChipActive]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedCategory(cat.id);
                      }}
                    >
                      <AppText style={[styles.catChipText, isSel && styles.catChipTextActive]}>
                        {cat.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* 3. FILTER TABS (TUTTI / DA COMPRARE / ACQUISTATI) */}
          {items.length > 0 && (
            <View style={styles.filterTabsRow}>
              <Pressable
                style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('all')}
              >
                <AppText style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
                  {isIt ? 'Tutti' : 'All'} ({items.length})
                </AppText>
              </Pressable>

              <Pressable
                style={[styles.filterTab, selectedFilter === 'pending' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('pending')}
              >
                <AppText style={[styles.filterTabText, selectedFilter === 'pending' && styles.filterTabTextActive]}>
                  {isIt ? 'Da comprare' : 'To Buy'} ({pendingCount})
                </AppText>
              </Pressable>

              <Pressable
                style={[styles.filterTab, selectedFilter === 'completed' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('completed')}
              >
                <AppText style={[styles.filterTabText, selectedFilter === 'completed' && styles.filterTabTextActive]}>
                  {isIt ? 'Acquistati' : 'Done'} ({completedCount})
                </AppText>
              </Pressable>
            </View>
          )}

          {/* 4. ITEMS LIST / EMPTY STATE */}
          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={38} color="#23212C" />
              </View>
              <AppText variant="title" style={styles.emptyTitle}>
                {selectedFilter === 'completed'
                  ? (isIt ? 'Nessun articolo spuntato' : 'No completed items')
                  : selectedFilter === 'pending'
                  ? (isIt ? 'Hai acquistato tutto!' : 'All items completed!')
                  : (isIt ? 'La lista della spesa è vuota' : 'Shopping list is empty')}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.emptySubtitle}>
                {isIt
                  ? 'Aggiungi alimenti compatibili per non dimenticare nulla durante la spesa.'
                  : 'Add safe items to purchase on your next grocery run.'}
              </AppText>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {filteredItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, item.checked && styles.itemCardChecked]}>
                  <Pressable onPress={() => handleToggle(item.id)} hitSlop={8} style={styles.checkboxTouch}>
                    <Ionicons
                      name={item.checked ? 'checkbox-outline' : 'square-outline'}
                      size={22}
                      color={item.checked ? '#10B981' : '#94A3B8'}
                    />
                  </Pressable>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                      {item.name}
                    </Text>

                    <View style={styles.itemMetaRow}>
                      <View style={styles.itemCategoryTag}>
                        <Ionicons name="pricetag-outline" size={10} color="#64748B" />
                        <Text style={styles.itemCategoryText}>
                          {item.category}
                        </Text>
                      </View>

                      {item.warningAllergen && (
                        <View style={styles.itemWarningPill}>
                          <Ionicons name="warning-outline" size={12} color="#DC2626" />
                          <AppText variant="caption" color="#DC2626" style={styles.itemWarningText}>
                            {item.warningAllergen}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8} style={styles.deleteTouch}>
                    <Ionicons name="close-outline" size={18} color="#94A3B8" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* 5. SCANNER SPESA QUICK CTA */}
          <Pressable style={styles.scanCtaBtn} onPress={() => router.push('/scanner')}>
            <Ionicons name="scan-outline" size={18} color="#23212C" />
            <AppText variant="bodyBold" color="#23212C">
              {isIt ? 'Scansiona Codice a Barre in Negozio' : 'Scan Barcode in Store'}
            </AppText>
          </Pressable>
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  clearBtnText: {
    fontWeight: '700',
    color: '#DC2626',
    fontSize: 11.5,
  },

  // HERO CARD
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
    fontSize: 16,
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
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statLabel: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statValue: {
    fontWeight: '700',
    color: '#F1FEC8',
  },
  progressWrap: {
    gap: 4,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'right',
  },

  // ADD CARD
  addCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#23212C',
    fontFamily: font.regular,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  liveWarningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  liveWarningText: {
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
  },
  categoryWrap: {
    gap: 4,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  categoryChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  catChipText: {
    fontSize: 11.5,
    fontFamily: font.semibold,
    color: '#475569',
  },
  catChipTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },

  // FILTER TABS
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: font.semibold,
  },
  filterTabTextActive: {
    color: '#23212C',
    fontFamily: font.bold,
  },

  // ITEMS LIST
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardChecked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  checkboxTouch: {
    padding: 2,
  },
  itemText: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: '#23212C',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemCategoryText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  itemWarningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemWarningText: {
    fontWeight: '700',
    fontSize: 11,
  },
  deleteTouch: {
    padding: 4,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#23212C',
    fontSize: 16,
    marginTop: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12.5,
  },

  // SCAN CTA
  scanCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#F1FEC8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
