import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import { api } from '../src/api/client';
import type { Menu, Piatto } from '../src/types';
import { getAllergenName } from '../src/engine/translations';
import { autoDetectMenuAllergens } from '../src/engine/autoAllergenTagger';
import { shareOfficialAllergenBook } from '../src/services/officialAllergenBook';

export default function KitchenSafetySheetScreen() {
  const insets = useSafeAreaInsets();
  const { language, email } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [haccpManager, setHaccpManager] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('tutte');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ id: number; nome_piatto: string; suggestedAllergens: string[] }>>([]);
  const [editingDish, setEditingDish] = useState<Piatto | null>(null);
  const [customAllergensDraft, setCustomAllergensDraft] = useState<string[]>([]);
  const [crossContamDraft, setCrossContamDraft] = useState<string[]>([]);
  const [savingDish, setSavingDish] = useState(false);

  useEffect(() => {
    async function fetchOwnerMenu() {
      try {
        const data = await api.menu('demo');
        setMenu(data);
      } catch {
        // Fallback demo menu if not logged as owner
        setMenu({
          restaurant_id: 1,
          public_code: 'DEMO-KITCHEN',
          nome_ristorante: 'Ristorante Pizzeria Bellini',
          citta: 'Milano',
          indirizzo: 'Via Roma 12',
          aggiornato_il: '2026-09-01',
          piatti: [
            {
              id: 101,
              nome_piatto: 'Spaghetti ai Frutti di Mare',
              descrizione: 'Spaghetti trafilati al bronzo con cozze, vongole veraci, gamberi freschi e prezzemolo.',
              prezzo_cents: 1600,
              categoria: 'Primi',
              allergeni_contenuti: ['molluschi', 'crostacei', 'cereali'],
              allergeni_tracce: ['pesce'],
            },
            {
              id: 102,
              nome_piatto: 'Pizza Margherita DOC',
              descrizione: 'Farina di grano tenero, pomodoro San Marzano DOP, mozzarella di bufala campana, basilico.',
              prezzo_cents: 950,
              categoria: 'Pizze',
              allergeni_contenuti: ['cereali', 'latte'],
              allergeni_tracce: ['soia'],
            },
            {
              id: 103,
              nome_piatto: 'Tiramisù Tradizionale',
              descrizione: 'Savoiardi artigianali, caffè espresso, crema al mascarpone, uova fresche pastorizzate, cacao amaro.',
              prezzo_cents: 650,
              categoria: 'Dolci',
              allergeni_contenuti: ['uova', 'latte', 'cereali'],
              allergeni_tracce: ['frutta_a_guscio'],
            },
            {
              id: 104,
              nome_piatto: 'Insalata Greca con Feta',
              descrizione: 'Pomodori ramati, cetrioli, olive kalamata, cipolla rossa di Tropea, formaggio Feta DOP, origano.',
              prezzo_cents: 1100,
              categoria: 'Contorni',
              allergeni_contenuti: ['latte'],
              allergeni_tracce: [],
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    void fetchOwnerMenu();
  }, []);

  const dishes = useMemo(() => menu?.piatti || [], [menu]);

  const stations = useMemo(() => {
    const list = dishes.map((d) => d.categoria).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedStation === 'tutte') return dishes;
    return dishes.filter((p) => p.categoria === selectedStation);
  }, [dishes, selectedStation]);

  const handleRunAiAutoTagger = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const results = autoDetectMenuAllergens(dishes);
    setAiSuggestions(results);
    setAiModalVisible(true);
  };

  const handleExportAllergenBook = async () => {
    if (!menu) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await shareOfficialAllergenBook(menu, haccpManager || (email ? email.split('@')[0] : 'Responsabile HACCP'));
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Kitchen Safety & B2B Hub' : 'Kitchen Safety Sheet'}
        rightElement={
          <Pressable onPress={handleExportAllergenBook} hitSlop={8} style={styles.topActionBtn}>
            <Ionicons name="print-outline" size={18} color="#23212C" />
          </Pressable>
        }
      />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* QUICK B2B HERO CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {menu?.nome_ristorante || 'Il Tuo Locale'} · Scheda Cucina
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt ? 'Controllo HACCP & Protocolli Anti-Contaminazione' : 'HACCP Protocols & Chef Safety'}
                </AppText>
              </View>
            </View>

            <View style={styles.b2bBtnRow}>
              <Pressable style={styles.aiTagBtn} onPress={handleRunAiAutoTagger}>
                <Ionicons name="flash-outline" size={15} color="#23212C" />
                <AppText variant="caption" style={{ color: '#23212C', fontWeight: '800' }}>
                  {isIt ? 'AI Auto-Tagger' : 'AI Auto-Tagger'}
                </AppText>
              </Pressable>

              <Pressable style={styles.aslExportBtn} onPress={handleExportAllergenBook}>
                <Ionicons name="document-text-outline" size={15} color="#F1FEC8" />
                <AppText variant="caption" style={{ color: '#F1FEC8', fontWeight: '800' }}>
                  {isIt ? 'Libro Allergeni ASL' : 'Official Book'}
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* STATION FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
            <Pressable
              style={[styles.filterChip, selectedStation === 'tutte' && styles.filterChipActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedStation('tutte');
              }}
            >
              <AppText style={[styles.filterChipText, selectedStation === 'tutte' && styles.filterChipTextActive]}>
                {isIt ? 'Tutte le portate' : 'All dishes'} ({dishes.length})
              </AppText>
            </Pressable>
            {stations.map((st) => {
              const isSel = selectedStation === st;
              return (
                <Pressable
                  key={st}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedStation(st);
                  }}
                >
                  <AppText style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                    {st}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* DISHES SAFETY LIST */}
          <View style={styles.dishList}>
            {filteredDishes.map((piatto: Piatto) => {
              const contained = piatto.allergeni_contenuti || [];
              const traces = piatto.allergeni_tracce || [];

              return (
                <View key={piatto.id} style={styles.dishSafetyCard}>
                  <View style={styles.dishHeader}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" style={{ fontSize: 16, color: '#23212C' }}>
                        {piatto.nome_piatto}
                      </AppText>
                      {piatto.categoria ? (
                        <AppText variant="caption" color="#64748B" style={{ fontWeight: '600', marginTop: 2 }}>
                          {piatto.categoria}
                        </AppText>
                      ) : null}
                    </View>

                    {piatto.kitchen_protocol_confirmed === 1 ? (
                      <View style={styles.protocolBadge}>
                        <Ionicons name="shield-checkmark-outline" size={12} color="#059669" />
                        <AppText style={styles.protocolBadgeText}>CUCINA SICURA</AppText>
                      </View>
                    ) : (
                      <View style={styles.protocolBadgeWarn}>
                        <Ionicons name="alert-circle-outline" size={12} color="#D97706" />
                        <AppText style={styles.protocolBadgeWarnText}>STANDARD</AppText>
                      </View>
                    )}
                  </View>

                  {piatto.descrizione ? (
                    <AppText variant="caption" color="#475569" style={{ lineHeight: 16 }}>
                      {piatto.descrizione}
                    </AppText>
                  ) : null}

                  {/* CONTAINED ALLERGENS CHIPS */}
                  <View style={styles.allergenSection}>
                    <AppText variant="caption" style={styles.allergenTitle}>
                      {isIt ? 'Allergeni Presenti:' : 'Allergens Contained:'}
                    </AppText>
                    <View style={styles.allergenChipsRow}>
                      {contained.length > 0 ? (
                        contained.map((a: string) => (
                          <View key={a} style={styles.allergenPillContained}>
                            <AppText style={styles.allergenPillContainedText}>
                              {getAllergenName(a, isIt ? 'it' : 'en')}
                            </AppText>
                          </View>
                        ))
                      ) : (
                        <AppText variant="caption" color="#059669" style={{ fontWeight: '700' }}>
                          Nessun allergene UE dichiarato
                        </AppText>
                      )}
                    </View>
                  </View>

                  {/* TRACES CHIPS */}
                  {traces.length > 0 && (
                    <View style={styles.allergenSection}>
                      <AppText variant="caption" style={styles.allergenTitle}>
                        {isIt ? 'Possibili Tracce:' : 'Possible Traces:'}
                      </AppText>
                      <View style={styles.allergenChipsRow}>
                        {traces.map((a: string) => (
                          <View key={a} style={styles.allergenPillTraces}>
                            <AppText style={styles.allergenPillTracesText}>
                              {getAllergenName(a, isIt ? 'it' : 'en')}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* KITCHEN SANIFICATION INSTRUCTIONS */}
                  <View style={styles.chefInstructionBox}>
                    <Ionicons name="restaurant-outline" size={14} color="#23212C" />
                    <AppText variant="caption" color="#23212C" style={{ flex: 1, fontWeight: '600' }}>
                      {isIt
                        ? 'Istruzione Brigata: Utilizzare pinze sanificate e padella dedicata in caso di comanda con allergie.'
                        : 'Kitchen Rule: Use sanitized pan and dedicated utensils for allergic guest.'}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* AI AUTO-TAGGER MODAL */}
      <Modal visible={aiModalVisible} animationType="slide" transparent onRequestClose={() => setAiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="flash-outline" size={20} color="#23212C" />
                <AppText variant="title" style={{ color: '#23212C' }}>
                  {isIt ? 'Rilevamento AI Allergeni Menù' : 'AI Allergen Tagging'}
                </AppText>
              </View>
              <Pressable onPress={() => setAiModalVisible(false)} hitSlop={8}>
                <Ionicons name="close-outline" size={22} color="#23212C" />
              </Pressable>
            </View>

            <AppText variant="caption" color="#64748B" style={{ marginBottom: 12 }}>
              {isIt
                ? 'L\'intelligenza artificiale ha analizzato nomi e descrizioni dei tuoi piatti rilevando gli ingredienti critici.'
                : 'AI scanned dish descriptions and matched EU allergens.'}
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {aiSuggestions.map((item) => (
                <View key={item.id} style={styles.aiSuggestionCard}>
                  <AppText variant="bodyBold" style={{ color: '#23212C' }}>
                    {item.nome_piatto}
                  </AppText>
                  <View style={styles.aiTagsRow}>
                    {item.suggestedAllergens.map((alg) => (
                      <View key={alg} style={styles.aiTagPill}>
                        <AppText style={styles.aiTagPillText}>
                          {getAllergenName(alg, isIt ? 'it' : 'en')}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={styles.aiApplyBtn}
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setAiModalVisible(false);
                Alert.alert(
                  isIt ? 'Allergeni Aggiornati' : 'Allergens Updated',
                  isIt ? 'Tutti gli allergeni rilevati dall\'AI sono stati associati con successo al menù!' : 'All AI detected allergens applied to the menu!'
                );
              }}
            >
              <AppText variant="bodyBold" color="#23212C">
                {isIt ? 'Conferma e Applica Tutti al Menù' : 'Confirm and Apply All'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  topActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
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
  b2bBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiTagBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1FEC8',
    paddingVertical: 11,
    borderRadius: 12,
  },
  aslExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterScroll: {
    marginBottom: 2,
  },
  filterScrollContent: {
    gap: 6,
    paddingVertical: 2,
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
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
  dishList: {
    gap: 12,
  },
  dishSafetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  protocolBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  protocolBadgeWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  protocolBadgeWarnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  allergenSection: {
    gap: 4,
    marginTop: 2,
  },
  allergenTitle: {
    fontWeight: '800',
    color: '#475569',
    fontSize: 11.5,
  },
  allergenChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergenPillContained: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  allergenPillContainedText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
  allergenPillTraces: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergenPillTracesText: {
    color: '#D97706',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chefInstructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 33, 44, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSuggestionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  aiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiTagPill: {
    backgroundColor: '#F1FEC8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2F4A6',
  },
  aiTagPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#23212C',
  },
  aiApplyBtn: {
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
});
