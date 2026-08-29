import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
  loadPantryItems,
  removePantryItem,
  loadMedsReminders,
  saveMedsReminder,
  deleteMedsReminder,
  type PantryItem,
  type MedsReminder,
} from '../src/services/productStorage';

export default function DispensaScreen() {
  const insets = useSafeAreaInsets();
  const { language, subProfiles, email } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [activeTab, setActiveTab] = useState<'pantry' | 'meds'>('pantry');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [medsList, setMedsList] = useState<MedsReminder[]>([]);
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<number | null>(null);

  // Modal State for adding/editing Meds Reminder
  const [medModalVisible, setMedModalVisible] = useState(false);
  const [medNameDraft, setMedNameDraft] = useState('');
  const [medDateDraft, setMedDateDraft] = useState('');
  const [medPersonDraft, setMedPersonDraft] = useState('');
  const [medNotesDraft, setMedNotesDraft] = useState('');

  const loadData = async () => {
    const [pantry, meds] = await Promise.all([
      loadPantryItems(),
      loadMedsReminders(),
    ]);
    setPantryItems(pantry);
    setMedsList(meds);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleRemovePantryItem = async (barcode: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await removePantryItem(barcode);
    setPantryItems(updated);
  };

  const handleSaveMedReminder = async () => {
    if (!medNameDraft.trim() || !medDateDraft.trim()) {
      Alert.alert(isIt ? 'Campi obbligatori' : 'Required fields', isIt ? 'Inserisci nome del farmaco e data di scadenza (AAAA-MM-GG)' : 'Please enter medicine name and expiry date');
      return;
    }

    const newMed: MedsReminder = {
      id: String(Date.now()),
      name: medNameDraft.trim(),
      expiryDate: medDateDraft.trim(),
      assignedTo: medPersonDraft.trim() || (isIt ? 'Principale' : 'Primary'),
      notes: medNotesDraft.trim() || undefined,
    };

    const updated = await saveMedsReminder(newMed);
    setMedsList(updated);
    setMedModalVisible(false);
    setMedNameDraft('');
    setMedDateDraft('');
    setMedPersonDraft('');
    setMedNotesDraft('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteMed = async (id: string) => {
    void Haptics.selectionAsync();
    const updated = await deleteMedsReminder(id);
    setMedsList(updated);
  };

  const calculateDaysRemaining = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredPantry = useMemo(() => {
    if (selectedProfileFilter === null) return pantryItems;
    return pantryItems.filter((p) => p.assignedProfileId === selectedProfileFilter);
  }, [pantryItems, selectedProfileFilter]);

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Dispensa & Scadenze' : 'Pantry & Expiry',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
          headerRight: () => (
            activeTab === 'pantry' ? (
              <Pressable onPress={() => router.push('/scanner')} hitSlop={8} style={styles.topActionBtn}>
                <Ionicons name="scan" size={18} color="#1E1B4B" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  const defaultDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setMedDateDraft(defaultDate);
                  setMedModalVisible(true);
                }}
                hitSlop={8}
                style={styles.topActionBtn}
              >
                <Ionicons name="add" size={22} color="#1E1B4B" />
              </Pressable>
            )
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        {/* SEGMENTED TAB SWITCHER */}
        <View style={styles.tabSwitcher}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'pantry' && styles.tabBtnActive]}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('pantry');
            }}
          >
            <Ionicons name="cube-outline" size={16} color={activeTab === 'pantry' ? '#1E1B4B' : '#6B6690'} />
            <AppText variant="bodyBold" style={[styles.tabBtnText, activeTab === 'pantry' && styles.tabBtnTextActive]}>
              {isIt ? 'Dispensa di Casa' : 'Safe Pantry'} ({pantryItems.length})
            </AppText>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'meds' && styles.tabBtnActive]}
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('meds');
            }}
          >
            <Ionicons name="medical-outline" size={16} color={activeTab === 'meds' ? '#1E1B4B' : '#6B6690'} />
            <AppText variant="bodyBold" style={[styles.tabBtnText, activeTab === 'meds' && styles.tabBtnTextActive]}>
              {isIt ? 'Farmaci & Adrenalina' : 'Meds & EpiPen'} ({medsList.length})
            </AppText>
          </Pressable>
        </View>

        {activeTab === 'pantry' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
            {/* SUBPROFILE FILTER */}
            {subProfiles.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
                <Pressable
                  style={[styles.filterChip, selectedProfileFilter === null && styles.filterChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedProfileFilter(null);
                  }}
                >
                  <AppText style={[styles.filterChipText, selectedProfileFilter === null && styles.filterChipTextActive]}>
                    👨‍👩‍👧‍👦 {isIt ? 'Tutta la famiglia' : 'All family'}
                  </AppText>
                </Pressable>
                {subProfiles.map((p) => {
                  const isSelected = selectedProfileFilter === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedProfileFilter(p.id);
                      }}
                    >
                      <AppText style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                        👶 {p.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {filteredPantry.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="basket-outline" size={48} color="#94A3B8" />
                <AppText variant="title" style={{ marginTop: 12, color: '#1E1B4B' }}>
                  {isIt ? 'Dispensa vuota' : 'Pantry is empty'}
                </AppText>
                <AppText variant="caption" color="#6B6690" style={{ textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                  {isIt
                    ? 'Scansiona prodotti al supermercato e aggiungili alla dispensa per sapere sempre cosa hai di sicuro a casa.'
                    : 'Scan products at the grocery store and add them here to know what safe food you have at home.'}
                </AppText>
                <SurfaceButton
                  label={isIt ? 'Scansiona un prodotto' : 'Scan a product'}
                  onPress={() => router.push('/scanner')}
                  variant="primary"
                  icon="scan"
                  style={{ marginTop: 18 }}
                />
              </View>
            ) : (
              <View style={styles.pantryGrid}>
                {filteredPantry.map((item) => (
                  <View key={item.barcode} style={styles.pantryItemCard}>
                    <View style={styles.pantryItemImgFrame}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.pantryItemImg} />
                      ) : (
                        <Ionicons name="cube-outline" size={24} color="#94A3B8" />
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: item.status === 'verde' ? '#10B981' : '#F59E0B' }]}>
                        <Ionicons name={item.status === 'verde' ? 'checkmark' : 'alert'} size={10} color="#FFFFFF" />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" numberOfLines={1} style={{ color: '#1E1B4B' }}>
                        {item.name}
                      </AppText>
                      <AppText variant="caption" color="#6B6690" numberOfLines={1}>
                        {item.brand || item.barcode}
                      </AppText>
                    </View>

                    <Pressable onPress={() => handleRemovePantryItem(item.barcode)} hitSlop={8} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
            <View style={styles.medsBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
              <AppText variant="caption" color="#1E40AF" style={{ flex: 1, lineHeight: 16 }}>
                {isIt
                  ? 'Gli autoiniettori di adrenalina e i farmaci salvavita hanno una scadenza critica (di solito 12-18 mesi). Tienili sempre monitorati.'
                  : 'Adrenaline auto-injectors and emergency meds have critical expiry dates. Keep them tracked here.'}
              </AppText>
            </View>

            <View style={styles.medsList}>
              {medsList.map((med) => {
                const days = calculateDaysRemaining(med.expiryDate);
                const isExpired = days <= 0;
                const isExpiringSoon = days > 0 && days <= 30;

                const badgeBg = isExpired ? '#FEF2F2' : isExpiringSoon ? '#FFFBEB' : '#ECFDF5';
                const badgeText = isExpired ? '#DC2626' : isExpiringSoon ? '#D97706' : '#059669';
                const statusLabel = isExpired
                  ? (isIt ? 'SCADUTO!' : 'EXPIRED!')
                  : isExpiringSoon
                  ? (isIt ? `Scade tra ${days} gg` : `Expires in ${days} d`)
                  : (isIt ? `Valido (${days} gg)` : `Valid (${days} d)`);

                return (
                  <View key={med.id} style={styles.medCard}>
                    <View style={styles.medCardHead}>
                      <View style={styles.medIconWrap}>
                        <Ionicons name="medical" size={18} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold" style={{ color: '#1E1B4B' }}>
                          {med.name}
                        </AppText>
                        <AppText variant="caption" color="#6B6690">
                          {isIt ? 'Assegnato a:' : 'Assigned to:'} {med.assignedTo} · Scadenza: {med.expiryDate}
                        </AppText>
                      </View>
                      <Pressable onPress={() => handleDeleteMed(med.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <View style={[styles.medStatusPill, { backgroundColor: badgeBg }]}>
                      <Ionicons
                        name={isExpired ? 'alert-circle' : isExpiringSoon ? 'time-outline' : 'checkmark-circle'}
                        size={14}
                        color={badgeText}
                      />
                      <AppText variant="caption" style={{ color: badgeText, fontWeight: '800' }}>
                        {statusLabel}
                      </AppText>
                    </View>

                    {med.notes && (
                      <AppText variant="caption" color="#4B5563" style={styles.medNotesText}>
                        💡 {med.notes}
                      </AppText>
                    )}
                  </View>
                );
              })}
            </View>

            <SurfaceButton
              label={isIt ? 'Aggiungi Farmaco / Autoiniettore' : 'Add Medicine / Auto-Injector'}
              onPress={() => {
                const defaultDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                setMedDateDraft(defaultDate);
                setMedModalVisible(true);
              }}
              variant="secondary"
              icon="add"
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        )}
      </View>

      {/* ADD MED MODAL */}
      <Modal visible={medModalVisible} animationType="slide" transparent onRequestClose={() => setMedModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHead}>
              <AppText variant="title" style={{ color: '#1E1B4B' }}>
                {isIt ? 'Nuovo Promemoria Farmaco' : 'New Medicine Reminder'}
              </AppText>
              <Pressable onPress={() => setMedModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1B4B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Nome Farmaco / Dispositivo' : 'Medicine Name'}</AppText>
              <TextInput
                style={styles.input}
                value={medNameDraft}
                onChangeText={setMedNameDraft}
                placeholder="es. EpiPen 0.3mg o Antistaminico"
                placeholderTextColor="#94A3B8"
              />

              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Data di Scadenza (AAAA-MM-GG)' : 'Expiry Date (YYYY-MM-DD)'}</AppText>
              <TextInput
                style={styles.input}
                value={medDateDraft}
                onChangeText={setMedDateDraft}
                placeholder="2027-06-30"
                placeholderTextColor="#94A3B8"
              />

              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'A chi appartiene?' : 'Assigned to'}</AppText>
              <TextInput
                style={styles.input}
                value={medPersonDraft}
                onChangeText={setMedPersonDraft}
                placeholder="es. Leo / Io"
                placeholderTextColor="#94A3B8"
              />

              <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Note (Lotto, Posizione)' : 'Notes'}</AppText>
              <TextInput
                style={styles.input}
                value={medNotesDraft}
                onChangeText={setMedNotesDraft}
                placeholder="es. Nello zaino di scuola"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setMedModalVisible(false)}>
                <AppText variant="bodyBold" color="#64748B">{isIt ? 'Annulla' : 'Cancel'}</AppText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleSaveMedReminder}>
                <AppText variant="bodyBold" color="#FFFFFF">{isIt ? 'Salva Promemoria' : 'Save Reminder'}</AppText>
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#ECEAF8',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    color: '#6B6690',
  },
  tabBtnTextActive: {
    color: '#1E1B4B',
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
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
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  pantryGrid: {
    gap: 10,
  },
  pantryItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pantryItemImgFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pantryItemImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  medsBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  medsList: {
    gap: 12,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  medCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  medNotesText: {
    fontSize: 12,
    lineHeight: 16,
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
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
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
