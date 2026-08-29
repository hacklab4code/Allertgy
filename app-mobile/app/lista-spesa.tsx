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
import { AppText, Screen, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
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
  const [inputCategory, setInputCategory] = useState('Dispensa');

  const loadData = async () => {
    const list = await loadShoppingList();
    setItems(list);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const liveWarning = useMemo(() => {
    if (!inputText.trim()) return null;
    return checkItemAllergenWarning(inputText, allergie, isIt);
  }, [inputText, allergie, isIt]);

  const handleAddItem = async () => {
    if (!inputText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await addShoppingItem(inputText, inputCategory, allergie);
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
    void Haptics.selectionAsync();
    const updated = await deleteShoppingItem(id);
    setItems(updated);
  };

  const handleClearCompleted = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = await clearCompletedItems();
    setItems(updated);
  };

  const completedCount = items.filter((i) => i.checked).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const CATEGORIES = ['Dispensa', 'Frutta & Verdura', 'Freschi', 'Surgelati', 'Altro'];

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Lista della Spesa Sicura' : 'Safe Grocery List',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
          headerRight: () => (
            completedCount > 0 ? (
              <Pressable onPress={handleClearCompleted} hitSlop={8} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <AppText variant="caption" color="#DC2626" style={{ fontWeight: '700' }}>
                  {isIt ? 'Pulisci spuntati' : 'Clear done'}
                </AppText>
              </Pressable>
            ) : null
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        {/* ADD ITEM CARD */}
        <View style={styles.addCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isIt ? 'Aggiungi un alimento...' : 'Add grocery item...'}
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />
            <Pressable
              style={[styles.addBtn, !inputText.trim() && styles.addBtnDisabled]}
              onPress={handleAddItem}
              disabled={!inputText.trim()}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* LIVE SAFETY WARNING BANNER */}
          {liveWarning && (
            <View style={styles.liveWarningPill}>
              <Ionicons name="warning" size={14} color="#DC2626" />
              <AppText variant="caption" color="#991B1B" style={{ fontWeight: '700', flex: 1 }}>
                {liveWarning}
              </AppText>
            </View>
          )}

          {/* CATEGORY CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
            {CATEGORIES.map((cat) => {
              const isSel = inputCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.catChip, isSel && styles.catChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setInputCategory(cat);
                  }}
                >
                  <AppText style={[styles.catChipText, isSel && styles.catChipTextActive]}>
                    {cat}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* PROGRESS BAR */}
        {items.length > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" color="#64748B" style={{ fontWeight: '700' }}>
                {completedCount} {isIt ? 'di' : 'of'} {items.length} {isIt ? 'acquistati' : 'completed'} ({progressPercent}%)
              </AppText>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cart-outline" size={48} color="#94A3B8" />
              <AppText variant="title" style={{ marginTop: 12, color: '#1E1B4B' }}>
                {isIt ? 'Nessun articolo in lista' : 'Shopping list is empty'}
              </AppText>
              <AppText variant="caption" color="#6B6690" style={{ textAlign: 'center', marginTop: 4 }}>
                {isIt ? 'Aggiungi alimenti sicuri da comprare al supermercato.' : 'Add safe foods to buy at the grocery store.'}
              </AppText>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={[styles.itemCard, item.checked && styles.itemCardChecked]}>
                  <Pressable onPress={() => handleToggle(item.id)} hitSlop={8} style={styles.checkboxTouch}>
                    <Ionicons
                      name={item.checked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={item.checked ? '#10B981' : '#94A3B8'}
                    />
                  </Pressable>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemCategoryText}>
                      🏷️ {item.category}
                    </Text>
                    {item.warningAllergen && (
                      <View style={styles.itemWarningPill}>
                        <Ionicons name="warning" size={12} color="#DC2626" />
                        <AppText variant="caption" color="#DC2626" style={{ fontWeight: '700', fontSize: 11 }}>
                          {item.warningAllergen}
                        </AppText>
                      </View>
                    )}
                  </View>

                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8} style={{ padding: 4 }}>
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* SCAN AT SUPERMARKET BUTTON */}
          <SurfaceButton
            label={isIt ? 'Apri Scanner Spesa' : 'Open Grocery Scanner'}
            onPress={() => router.push('/scanner')}
            variant="primary"
            icon="scan"
            style={{ marginTop: spacing.lg }}
          />
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B4B',
    fontFamily: font.regular,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
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
  categoryChipsScroll: {
    gap: 6,
    paddingTop: 4,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#3B82F6',
  },
  catChipText: {
    fontSize: 11.5,
    fontFamily: font.semibold,
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  progressWrap: {
    marginBottom: 14,
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardChecked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.75,
  },
  checkboxTouch: {
    padding: 2,
  },
  itemText: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: '#1E1B4B',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  itemCategoryText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemWarningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
});
