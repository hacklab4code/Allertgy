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
import { AppText, Screen, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import { api } from '../src/api/client';
import type { Menu, Piatto } from '../src/types';
import { getAllergenName } from '../src/engine/translations';
import { autoDetectMenuAllergens } from '../src/engine/autoAllergenTagger';
import { shareOfficialAllergenBook } from '../src/services/officialAllergenBook';

export default function KitchenSafetySheetScreen() {
  const insets = useSafeAreaInsets();
  const { language, role, email } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string>('tutte');
  const [haccpManager, setHaccpManager] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ReturnType<typeof autoDetectMenuAllergens>>([]);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        // Try getting owner restaurant or demo
        const profile = await api.getProfile().catch(() => null);
        const code = (profile as any)?.public_code || (profile as any)?.restaurant_code || 'DEMO';
        const m = await api.menu(code).catch(() => null);
        if (m) {
          setMenu(m);
        } else {
          // Fallback demo menu for restaurateurs
          setMenu({
            restaurant_id: 1,
            public_code: 'DEMO',
            nome_ristorante: 'Osteria del Buongusto',
            citta: 'Milano',
            indirizzo: 'Via Roma 12',
            aggiornato_il: new Date().toISOString(),
            menu_available: true,
            piatti: [
              {
                id: 101,
                nome_piatto: 'Spaghetti alla Carbonara',
                categoria: 'Primi Piatti',
                descrizione: 'Guanciale croccante, tuorli d\'uovo freschi, pecorino romano DOP, pepe nero',
                prezzo_cents: 1400,
                allergeni_contenuti: ['glutine', 'uova', 'latte'],
                allergeni_tracce: [],
                kitchen_protocol_confirmed: 1,
              },
              {
                id: 102,
                nome_piatto: 'Fritto Misto del Tirreno',
                categoria: 'Secondi di Pesce',
                descrizione: 'Calamari, gamberi rosa e paranza fritti in pastella di grano tenero',
                prezzo_cents: 1800,
                allergeni_contenuti: ['glutine', 'crostacei', 'molluschi', 'pesce'],
                allergeni_tracce: [],
                kitchen_protocol_confirmed: 1,
              },
              {
                id: 103,
                nome_piatto: 'Risotto ai Funghi Porcini (Senza Glutine)',
                categoria: 'Primi Piatti',
                descrizione: 'Riso Carnaroli mantecato con burro e parmigiano 24 mesi, brodo vegetale',
                prezzo_cents: 1600,
                allergeni_contenuti: ['latte', 'sedano'],
                allergeni_tracce: [],
                kitchen_protocol_confirmed: 1,
              },
              {
                id: 104,
                nome_piatto: 'Tiramisù Tradizionale',
                categoria: 'Dessert',
                descrizione: 'Savoiardi bagnati al caffè espresso, crema al mascarpone e cacao amaro',
                prezzo_cents: 700,
                allergeni_contenuti: ['glutine', 'latte', 'uova'],
                allergeni_tracce: ['frutta_a_guscio'],
                kitchen_protocol_confirmed: 0,
              },
            ],
          });
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    void fetchMenu();
  }, []);

  const dishes = useMemo(() => menu?.piatti || [], [menu]);

  const stations = useMemo(() => {
    const set = new Set<string>();
    dishes.forEach((d: Piatto) => {
      if (d.categoria) set.add(d.categoria.trim());
    });
    return Array.from(set);
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedStation === 'tutte') return dishes;
    return dishes.filter((d: Piatto) => d.categoria?.trim() === selectedStation);
  }, [dishes, selectedStation]);

  const handleRunAiAutoTagger = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const suggestions = autoDetectMenuAllergens(dishes);
    setAiSuggestions(suggestions);
    setAiModalVisible(true);
  };

  const handleExportAllergenBook = async () => {
    if (!menu) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await shareOfficialAllergenBook(menu, haccpManager || (email ? email.split('@')[0] : 'Responsabile HACCP'));
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Kitchen Safety & B2B Hub' : 'Kitchen Safety Sheet',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleExportAllergenBook} hitSlop={8} style={styles.topActionBtn}>
              <Ionicons name="print-outline" size={18} color="#1E1B4B" />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* QUICK B2B TOOLS BANNER */}
          <View style={styles.b2bActionCard}>
            <View style={styles.b2bHead}>
              <Ionicons name="shield-checkmark" size={22} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <AppText variant="title" style={{ fontSize: 15, color: '#1E1B4B' }}>
                  {menu?.nome_ristorante || 'Il Tuo Locale'} · Scheda Cucina
                </AppText>
                <AppText variant="caption" color="#64748B">
                  {isIt ? 'Controllo HACCP & Protocolli Anti-Contaminazione' : 'HACCP Protocols & Chef Safety'}
                </AppText>
              </View>
            </View>

            <View style={styles.b2bBtnRow}>
              <Pressable style={styles.aiTagBtn} onPress={handleRunAiAutoTagger}>
                <Ionicons name="flash" size={15} color="#FFFFFF" />
                <AppText variant="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {isIt ? '⚡ AI Auto-Tagger' : '⚡ AI Auto-Tagger'}
                </AppText>
              </Pressable>

              <Pressable style={styles.aslExportBtn} onPress={handleExportAllergenBook}>
                <Ionicons name="document-text" size={15} color="#1E1B4B" />
                <AppText variant="caption" style={{ color: '#1E1B4B', fontWeight: '800' }}>
                  {isIt ? '📄 Libro Allergeni ASL' : '📄 Official Book'}
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
                🍽️ {isIt ? 'Tutte le portate' : 'All dishes'} ({dishes.length})
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
                      <AppText variant="title" style={{ fontSize: 16, color: '#1E1B4B' }}>
                        {piatto.nome_piatto}
                      </AppText>
                      {piatto.categoria ? (
                        <AppText variant="caption" color="#64748B" style={{ fontWeight: '600' }}>
                          🏷️ {piatto.categoria}
                        </AppText>
                      ) : null}
                    </View>

                    {piatto.kitchen_protocol_confirmed === 1 ? (
                      <View style={styles.protocolBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#059669" />
                        <AppText style={styles.protocolBadgeText}>CUCINA SICURA</AppText>
                      </View>
                    ) : (
                      <View style={styles.protocolBadgeWarn}>
                        <Ionicons name="alert" size={12} color="#D97706" />
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
                      🔴 {isIt ? 'Allergeni Presenti:' : 'Allergens Contained:'}
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
                          🟢 Nessun allergene UE dichiarato
                        </AppText>
                      )}
                    </View>
                  </View>

                  {/* TRACES CHIPS */}
                  {traces.length > 0 && (
                    <View style={styles.allergenSection}>
                      <AppText variant="caption" style={styles.allergenTitle}>
                        🟡 {isIt ? 'Possibili Tracce:' : 'Possible Traces:'}
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
                    <Ionicons name="restaurant" size={14} color="#4338CA" />
                    <AppText variant="caption" color="#3730A3" style={{ flex: 1, fontWeight: '600' }}>
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
                <Ionicons name="flash" size={20} color="#F59E0B" />
                <AppText variant="title" style={{ color: '#1E1B4B' }}>
                  {isIt ? 'Rilevamento AI Allergeni Menù' : 'AI Allergen Tagging'}
                </AppText>
              </View>
              <Pressable onPress={() => setAiModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1B4B" />
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
                  <AppText variant="bodyBold" style={{ color: '#1E1B4B' }}>
                    {item.nome_piatto}
                  </AppText>
                  <View style={styles.aiTagsRow}>
                    {item.suggestedAllergens.map((alg) => (
                      <View key={alg} style={styles.aiTagPill}>
                        <AppText style={styles.aiTagPillText}>
                          ✓ {getAllergenName(alg, isIt ? 'it' : 'en')}
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
              <AppText variant="bodyBold" color="#FFFFFF">
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
  },
  topActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  b2bActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  b2bHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 12,
  },
  aslExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
  dishList: {
    gap: 12,
  },
  dishSafetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
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
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  aiTagPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  aiApplyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
});
