import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  loadReactions,
  saveReaction,
  deleteReaction,
  SYMPTOM_DEFINITIONS,
  type ReactionEntry,
} from '../src/services/reactionTracker';
import { loadScanHistory } from '../src/services/productStorage';

export default function DiarioReazioniScreen() {
  const insets = useSafeAreaInsets();
  const { language, subProfiles, email } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recentFoods, setRecentFoods] = useState<string[]>([]);

  // Draft state
  const [draftProfile, setDraftProfile] = useState<string>('');
  const [draftSeverity, setDraftSeverity] = useState<'lieve' | 'moderata' | 'grave'>('moderata');
  const [draftSymptoms, setDraftSymptoms] = useState<string[]>([]);
  const [draftFood, setDraftFood] = useState<string>('');
  const [draftMeds, setDraftMeds] = useState<string>('');
  const [draftNotes, setDraftNotes] = useState<string>('');

  const loadData = async () => {
    const [list, history] = await Promise.all([loadReactions(), loadScanHistory()]);
    setReactions(list);
    const historyNames = history.map((h) => h.name).slice(0, 5);
    setRecentFoods(historyNames);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openNewModal = () => {
    const defaultProf = subProfiles[0]?.name || (email ? email.split('@')[0] : 'Io');
    setDraftProfile(defaultProf);
    setDraftSeverity('moderata');
    setDraftSymptoms(['orticaria']);
    setDraftFood('');
    setDraftMeds('');
    setDraftNotes('');
    setModalVisible(true);
  };

  const handleToggleSymptom = (symId: string) => {
    void Haptics.selectionAsync();
    setDraftSymptoms((prev) =>
      prev.includes(symId) ? prev.filter((s) => s !== symId) : [...prev, symId]
    );
  };

  const handleSave = async () => {
    if (draftSymptoms.length === 0) {
      Alert.alert(isIt ? 'Seleziona almeno un sintomo' : 'Select at least one symptom');
      return;
    }

    const newEntry: ReactionEntry = {
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      profileName: draftProfile || 'Io',
      severity: draftSeverity,
      symptoms: draftSymptoms,
      suspectedFood: draftFood.trim() || undefined,
      medsAdministered: draftMeds.trim() || undefined,
      notes: draftNotes.trim() || undefined,
    };

    const updated = await saveReaction(newEntry);
    setReactions(updated);
    setModalVisible(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = async (id: string) => {
    void Haptics.selectionAsync();
    const updated = await deleteReaction(id);
    setReactions(updated);
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Diario delle Reazioni' : 'Reaction Tracker',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={openNewModal} hitSlop={8} style={styles.topActionBtn}>
              <Ionicons name="add" size={22} color="#1E1B4B" />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* INTRO BANNER */}
          <View style={styles.infoBanner}>
            <Ionicons name="book-outline" size={20} color="#6366F1" />
            <AppText variant="caption" color="#4338CA" style={{ flex: 1, lineHeight: 16 }}>
              {isIt
                ? 'Annota ogni reazione avversa con sintomi e farmaci somministrati. Potrai mostrare questo storico all\'allergologo durante la visita.'
                : 'Log adverse reactions with symptoms and meds given. Share this clinical history with your allergist.'}
            </AppText>
          </View>

          {reactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="heart-outline" size={48} color="#10B981" />
              <AppText variant="title" style={{ marginTop: 12, color: '#1E1B4B' }}>
                {isIt ? 'Nessuna reazione registrata' : 'No reactions logged'}
              </AppText>
              <AppText variant="caption" color="#6B6690" style={{ textAlign: 'center', marginTop: 4 }}>
                {isIt ? 'Tutto tranquillo! Se dovesse capitare un episodio, registralo qui.' : 'All clear! If an episode happens, log it here.'}
              </AppText>
              <SurfaceButton
                label={isIt ? 'Registra una reazione' : 'Log a reaction'}
                onPress={openNewModal}
                variant="primary"
                icon="add"
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            <View style={styles.timelineList}>
              {reactions.map((item) => {
                const isGrave = item.severity === 'grave';
                const isMod = item.severity === 'moderata';
                const sevColor = isGrave ? '#DC2626' : isMod ? '#D97706' : '#2563EB';
                const sevBg = isGrave ? '#FEF2F2' : isMod ? '#FFFBEB' : '#EFF6FF';

                return (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineHeader}>
                      <View style={[styles.severityPill, { backgroundColor: sevBg }]}>
                        <Ionicons name="alert-circle" size={12} color={sevColor} />
                        <AppText style={[styles.severityPillText, { color: sevColor }]}>
                          {item.severity.toUpperCase()}
                        </AppText>
                      </View>

                      <AppText variant="caption" color="#64748B">
                        📅 {item.date} · {item.time} ({item.profileName})
                      </AppText>

                      <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>

                    {/* SYMPTOM CHIPS */}
                    <View style={styles.symptomsRow}>
                      {item.symptoms.map((sId) => {
                        const sym = SYMPTOM_DEFINITIONS.find((d) => d.id === sId);
                        return (
                          <View key={sId} style={styles.symChip}>
                            <AppText style={{ fontSize: 11 }}>{sym?.emoji || '⚠️'}</AppText>
                            <AppText variant="caption" style={styles.symChipText}>
                              {sym?.label || sId}
                            </AppText>
                          </View>
                        );
                      })}
                    </View>

                    {item.suspectedFood && (
                      <View style={styles.foodRow}>
                        <Ionicons name="fast-food-outline" size={14} color="#D97706" />
                        <AppText variant="caption" color="#92400E" style={{ fontWeight: '700' }}>
                          {isIt ? 'Cibo sospetto:' : 'Suspected food:'} {item.suspectedFood}
                        </AppText>
                      </View>
                    )}

                    {item.medsAdministered && (
                      <View style={styles.medsRow}>
                        <Ionicons name="medical-outline" size={14} color="#2563EB" />
                        <AppText variant="caption" color="#1E40AF">
                          {isIt ? 'Farmaci somministrati:' : 'Meds taken:'} {item.medsAdministered}
                        </AppText>
                      </View>
                    )}

                    {item.notes && (
                      <AppText variant="caption" color="#475569" style={{ fontStyle: 'italic', marginTop: 4 }}>
                        "{item.notes}"
                      </AppText>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* NEW REACTION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHead}>
              <AppText variant="title" style={{ color: '#1E1B4B' }}>
                {isIt ? 'Registra Episodio Reazione' : 'Log Reaction Episode'}
              </AppText>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1B4B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* SEVERITY PICKER */}
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Gravità dell\'episodio' : 'Severity'}</AppText>
              <View style={styles.severityPickerRow}>
                {(['lieve', 'moderata', 'grave'] as const).map((sev) => {
                  const isSel = draftSeverity === sev;
                  const col = sev === 'grave' ? '#DC2626' : sev === 'moderata' ? '#D97706' : '#2563EB';
                  return (
                    <Pressable
                      key={sev}
                      style={[styles.sevPickerBtn, isSel && { backgroundColor: col, borderColor: col }]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setDraftSeverity(sev);
                      }}
                    >
                      <AppText variant="caption" style={[styles.sevPickerText, isSel && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {sev.toUpperCase()}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* SYMPTOMS SELECTOR */}
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Sintomi riscontrati' : 'Symptoms'}</AppText>
              <View style={styles.symptomsGrid}>
                {SYMPTOM_DEFINITIONS.map((sym) => {
                  const isSel = draftSymptoms.includes(sym.id);
                  return (
                    <Pressable
                      key={sym.id}
                      style={[styles.symSelectBtn, isSel && styles.symSelectBtnActive]}
                      onPress={() => handleToggleSymptom(sym.id)}
                    >
                      <AppText style={{ fontSize: 13 }}>{sym.emoji}</AppText>
                      <AppText variant="caption" style={[styles.symSelectText, isSel && styles.symSelectTextActive]}>
                        {sym.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* SUSPECTED FOOD */}
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Alimento o piatto sospetto' : 'Suspected food'}</AppText>
              <TextInput
                style={styles.input}
                value={draftFood}
                onChangeText={setDraftFood}
                placeholder="es. Torta alle noci o piatto al ristorante"
                placeholderTextColor="#94A3B8"
              />

              {recentFoods.length > 0 && (
                <View style={styles.recentSuggestions}>
                  <AppText variant="caption" color="#64748B" style={{ fontSize: 11 }}>
                    {isIt ? '💡 Prodotti scansionati di recente:' : 'Recent scans:'}
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                    {recentFoods.map((name) => (
                      <Pressable
                        key={name}
                        style={styles.recentChip}
                        onPress={() => {
                          setDraftFood(name);
                          void Haptics.selectionAsync();
                        }}
                      >
                        <AppText variant="caption" numberOfLines={1} style={{ fontSize: 11, color: '#334155' }}>
                          {name}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* MEDS ADMINISTERED */}
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Farmaci somministrati' : 'Meds given'}</AppText>
              <TextInput
                style={styles.input}
                value={draftMeds}
                onChangeText={setDraftMeds}
                placeholder="es. 10 gocce Zyrtec + Bentelan 1mg"
                placeholderTextColor="#94A3B8"
              />

              {/* NOTES */}
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Note e durata reazione' : 'Notes & duration'}</AppText>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                value={draftNotes}
                onChangeText={setDraftNotes}
                placeholder="es. Risolto dopo 30 min, nessun ricovero"
                placeholderTextColor="#94A3B8"
                multiline
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setModalVisible(false)}>
                <AppText variant="bodyBold" color="#64748B">{isIt ? 'Annulla' : 'Cancel'}</AppText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleSave}>
                <AppText variant="bodyBold" color="#FFFFFF">{isIt ? 'Salva Diario' : 'Save Entry'}</AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  infoBanner: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
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
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  severityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  symChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  medsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1E1B4B',
    fontFamily: font.regular,
  },
  severityPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevPickerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sevPickerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  symSelectBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  symSelectText: {
    fontSize: 12,
    color: '#475569',
  },
  symSelectTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  recentSuggestions: {
    marginTop: 6,
  },
  recentChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    maxWidth: 160,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalSaveBtn: {
    backgroundColor: '#1E1B4B',
  },
});
