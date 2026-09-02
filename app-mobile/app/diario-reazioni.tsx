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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { font, radius } from '../src/theme';
import {
  loadReactions,
  saveReaction,
  deleteReaction,
  SYMPTOM_DEFINITIONS,
  type ReactionEntry,
} from '../src/services/reactionTracker';
import { loadScanHistory } from '../src/services/productStorage';

type SeverityLevel = 'lieve' | 'moderata' | 'grave';

export default function DiarioReazioniScreen() {
  const insets = useSafeAreaInsets();
  const { language, subProfiles, email } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recentFoods, setRecentFoods] = useState<string[]>([]);
  const [selectedFilterProfile, setSelectedFilterProfile] = useState<string>('all');

  // Draft state for new entry
  const [draftProfile, setDraftProfile] = useState<string>('');
  const [draftSeverity, setDraftSeverity] = useState<SeverityLevel>('moderata');
  const [draftSymptoms, setDraftSymptoms] = useState<string[]>([]);
  const [draftFood, setDraftFood] = useState<string>('');
  const [draftMeds, setDraftMeds] = useState<string>('');
  const [draftNotes, setDraftNotes] = useState<string>('');

  const allAvailableProfiles = useMemo(() => {
    const list = subProfiles && subProfiles.length > 0
      ? subProfiles.map((p) => p.name)
      : [email ? email.split('@')[0] : 'Io'];
    return Array.from(new Set(list));
  }, [subProfiles, email]);

  const loadData = async () => {
    const [list, history] = await Promise.all([loadReactions(), loadScanHistory()]);
    setReactions(list);
    const historyNames = history.map((h) => h.name).filter(Boolean).slice(0, 6);
    setRecentFoods(historyNames);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openNewModal = () => {
    const defaultProf = allAvailableProfiles[0] || 'Io';
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
      Alert.alert(
        isIt ? 'Attenzione' : 'Attention',
        isIt ? 'Seleziona almeno un sintomo riscontrato.' : 'Select at least one symptom.'
      );
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

  const handleDelete = (id: string) => {
    Alert.alert(
      isIt ? 'Elimina episodio' : 'Delete entry',
      isIt ? 'Vuoi davvero rimuovere questa registrazione dal diario?' : 'Do you really want to remove this log?',
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? 'Elimina' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const updated = await deleteReaction(id);
            setReactions(updated);
          },
        },
      ]
    );
  };

  const filteredReactions = useMemo(() => {
    if (selectedFilterProfile === 'all') return reactions;
    return reactions.filter((r) => r.profileName.toLowerCase() === selectedFilterProfile.toLowerCase());
  }, [reactions, selectedFilterProfile]);

  const stats = useMemo(() => {
    const total = reactions.length;
    const severeCount = reactions.filter((r) => r.severity === 'grave').length;
    const lastEntry = reactions[0];
    return { total, severeCount, lastDate: lastEntry ? lastEntry.date : null };
  }, [reactions]);

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Diario delle Reazioni' : 'Reaction Tracker'}
        rightElement={
          <Pressable onPress={openNewModal} hitSlop={8} style={styles.topAddBtn}>
            <Ionicons name="add-outline" size={22} color="#23212C" />
          </Pressable>
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
                <Ionicons name="book-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {isIt ? 'Registro Clinico Reazioni' : 'Clinical Reaction Diary'}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? 'Traccia sintomi, alimenti sospetti e terapie da mostrare al tuo specialista.'
                    : 'Track symptoms, suspected foods and treatments for your specialist.'}
                </AppText>
              </View>
            </View>

            {/* QUICK STATS PILLS */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Ionicons name="documents-outline" size={15} color="#F1FEC8" />
                <AppText variant="caption" style={styles.statLabel}>
                  {isIt ? 'Totale' : 'Total'}: <AppText variant="caption" style={styles.statValue}>{stats.total}</AppText>
                </AppText>
              </View>

              {stats.severeCount > 0 && (
                <View style={[styles.statBox, styles.statBoxAlert]}>
                  <Ionicons name="warning-outline" size={15} color="#FCA5A5" />
                  <AppText variant="caption" style={[styles.statLabel, { color: '#FECACA' }]}>
                    {isIt ? 'Gravi' : 'Severe'}: <AppText variant="caption" style={[styles.statValue, { color: '#FECACA' }]}>{stats.severeCount}</AppText>
                  </AppText>
                </View>
              )}

              {stats.lastDate && (
                <View style={styles.statBox}>
                  <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.7)" />
                  <AppText variant="caption" style={styles.statLabel}>
                    {isIt ? 'Ultimo' : 'Last'}: <AppText variant="caption" style={styles.statValue}>{stats.lastDate}</AppText>
                  </AppText>
                </View>
              )}
            </View>

            {/* PRIMARY CTA VANILLA */}
            <Pressable style={styles.heroCtaBtn} onPress={openNewModal}>
              <Ionicons name="add-outline" size={20} color="#23212C" />
              <AppText variant="bodyBold" color="#23212C">
                {isIt ? 'Nuova Registrazione' : 'Log New Reaction'}
              </AppText>
            </Pressable>
          </View>

          {/* 2. FILTRI PROFILO */}
          {allAvailableProfiles.length > 1 && (
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <Pressable
                  style={[styles.filterChip, selectedFilterProfile === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedFilterProfile('all')}
                >
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={selectedFilterProfile === 'all' ? '#F1FEC8' : '#64748B'}
                  />
                  <AppText
                    variant="caption"
                    style={[styles.filterChipText, selectedFilterProfile === 'all' && styles.filterChipTextActive]}
                  >
                    {isIt ? 'Tutti i profili' : 'All profiles'}
                  </AppText>
                </Pressable>

                {allAvailableProfiles.map((pName) => {
                  const isSel = selectedFilterProfile.toLowerCase() === pName.toLowerCase();
                  return (
                    <Pressable
                      key={pName}
                      style={[styles.filterChip, isSel && styles.filterChipActive]}
                      onPress={() => setSelectedFilterProfile(pName)}
                    >
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color={isSel ? '#F1FEC8' : '#64748B'}
                      />
                      <AppText
                        variant="caption"
                        style={[styles.filterChipText, isSel && styles.filterChipTextActive]}
                      >
                        {pName}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 3. LISTA REAZIONI / TIMELINE */}
          {filteredReactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={42} color="#10B981" />
              </View>
              <AppText variant="title" style={styles.emptyTitle}>
                {isIt ? 'Nessun episodio registrato' : 'No logged reactions'}
              </AppText>
              <AppText variant="caption" style={styles.emptySubtitle}>
                {isIt
                  ? 'Il diario è pulito. Se dovesse manifestarsi una reazione avversa, tocca il pulsante per registrarla.'
                  : 'Everything looks clear. If an adverse episode occurs, record it here for clinical analysis.'}
              </AppText>
              <SurfaceButton
                label={isIt ? 'Registra episodio' : 'Log an episode'}
                onPress={openNewModal}
                variant="primary"
                icon="add"
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View style={styles.timelineList}>
              <View style={styles.sectionHeaderRow}>
                <AppText variant="bodyBold" style={styles.sectionTitle}>
                  {isIt ? 'Cronologia Episodi' : 'Episode History'}
                </AppText>
                <AppText variant="caption" color="#64748B">
                  {filteredReactions.length} {isIt ? 'voci' : 'entries'}
                </AppText>
              </View>

              {filteredReactions.map((item) => {
                const isGrave = item.severity === 'grave';
                const isMod = item.severity === 'moderata';
                const sevColor = isGrave ? '#DC2626' : isMod ? '#D97706' : '#059669';
                const sevBg = isGrave ? '#FEF2F2' : isMod ? '#FFFBEB' : '#ECFDF5';
                const sevBorder = isGrave ? '#FECACA' : isMod ? '#FDE68A' : '#A7F3D0';
                const sevIcon = isGrave ? 'warning-outline' : isMod ? 'alert-circle-outline' : 'shield-checkmark-outline';

                return (
                  <View key={item.id} style={styles.entryCard}>
                    {/* CARD HEADER: SEVERITY + DATE + DELETE */}
                    <View style={styles.entryHeader}>
                      <View style={[styles.severityBadge, { backgroundColor: sevBg, borderColor: sevBorder }]}>
                        <Ionicons name={sevIcon} size={13} color={sevColor} />
                        <AppText style={[styles.severityBadgeText, { color: sevColor }]}>
                          {item.severity.toUpperCase()}
                        </AppText>
                      </View>

                      <View style={styles.entryMetaRow}>
                        <Ionicons name="calendar-outline" size={13} color="#64748B" />
                        <AppText variant="caption" color="#64748B" style={styles.entryMetaText}>
                          {item.date} · {item.time}
                        </AppText>
                      </View>

                      <View style={styles.entryProfileTag}>
                        <Ionicons name="person-outline" size={12} color="#23212C" />
                        <AppText variant="caption" style={styles.entryProfileText}>
                          {item.profileName}
                        </AppText>
                      </View>

                      <Pressable
                        onPress={() => handleDelete(item.id)}
                        hitSlop={12}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>

                    {/* ALIMENTO SOSPETTO */}
                    {item.suspectedFood ? (
                      <View style={styles.foodBlock}>
                        <View style={styles.foodIconBox}>
                          <Ionicons name="restaurant-outline" size={16} color="#B45309" />
                        </View>
                        <View style={styles.foodTextBlock}>
                          <AppText variant="caption" style={styles.foodLabel}>
                            {isIt ? 'Alimento o piatto sospetto' : 'Suspected food'}
                          </AppText>
                          <AppText variant="bodyBold" style={styles.foodName}>
                            {item.suspectedFood}
                          </AppText>
                        </View>
                      </View>
                    ) : null}

                    {/* SINTOMI RISCONTRATI (OUTLINE CHIPS) */}
                    <View style={styles.symptomsContainer}>
                      <AppText variant="caption" style={styles.groupLabel}>
                        {isIt ? 'Sintomi riscontrati:' : 'Reported symptoms:'}
                      </AppText>
                      <View style={styles.symptomsRow}>
                        {item.symptoms.map((sId) => {
                          const sym = SYMPTOM_DEFINITIONS.find((d) => d.id === sId);
                          return (
                            <View key={sId} style={styles.symOutlineChip}>
                              <Ionicons
                                name={sym?.icon || 'bandage-outline'}
                                size={14}
                                color="#23212C"
                              />
                              <AppText variant="caption" style={styles.symChipLabel}>
                                {sym?.label || sId}
                              </AppText>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* FARMACI SOMMINISTRATI */}
                    {item.medsAdministered ? (
                      <View style={styles.medsBlock}>
                        <Ionicons name="medkit-outline" size={15} color="#23212C" />
                        <View style={{ flex: 1 }}>
                          <AppText variant="caption" style={styles.medsLabel}>
                            {isIt ? 'Terapia / Farmaci somministrati:' : 'Medication given:'}
                          </AppText>
                          <AppText variant="caption" style={styles.medsContent}>
                            {item.medsAdministered}
                          </AppText>
                        </View>
                      </View>
                    ) : null}

                    {/* NOTE CLINICHE */}
                    {item.notes ? (
                      <View style={styles.notesBlock}>
                        <Ionicons name="document-text-outline" size={15} color="#64748B" />
                        <AppText variant="caption" style={styles.notesContent}>
                          {item.notes}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* MODAL DI INSERIMENTO REGISTRAZIONE */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* DRAG HANDLE & HEADER */}
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Ionicons name="create-outline" size={20} color="#23212C" />
                <AppText variant="title" style={styles.modalTitle}>
                  {isIt ? 'Registra Episodio' : 'Log Reaction Episode'}
                </AppText>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={12}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-outline" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* 1. CHI HA AVUTO LA REAZIONE */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="person-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '1. Chi ha avuto la reazione?' : '1. Who experienced the reaction?'}
                  </AppText>
                </View>

                <View style={styles.profilePickerRow}>
                  {allAvailableProfiles.map((pName) => {
                    const isSel = draftProfile === pName;
                    return (
                      <Pressable
                        key={pName}
                        style={[styles.profilePickBtn, isSel && styles.profilePickBtnActive]}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setDraftProfile(pName);
                        }}
                      >
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={isSel ? '#F1FEC8' : '#475569'}
                        />
                        <AppText
                          variant="caption"
                          style={[styles.profilePickText, isSel && styles.profilePickTextActive]}
                        >
                          {pName}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 2. LIVELLO DI GRAVITÀ */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="warning-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '2. Livello di gravità' : '2. Severity level'}
                  </AppText>
                </View>

                <View style={styles.severityGrid}>
                  {(
                    [
                      { id: 'lieve', label: isIt ? 'Lieve' : 'Mild', icon: 'shield-checkmark-outline', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                      { id: 'moderata', label: isIt ? 'Moderata' : 'Moderate', icon: 'alert-circle-outline', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                      { id: 'grave', label: isIt ? 'Grave' : 'Severe', icon: 'warning-outline', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                    ] as const
                  ).map((item) => {
                    const isSel = draftSeverity === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.severityCardBtn,
                          isSel && { borderColor: item.border, backgroundColor: item.bg },
                        ]}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setDraftSeverity(item.id);
                        }}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={isSel ? item.color : '#64748B'}
                        />
                        <AppText
                          variant="caption"
                          style={[
                            styles.severityCardLabel,
                            isSel && { color: item.color, fontWeight: '700' },
                          ]}
                        >
                          {item.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 3. SINTOMI RISCONTRATI */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="pulse-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '3. Sintomi riscontrati' : '3. Symptoms identified'}
                  </AppText>
                </View>

                <View style={styles.symptomsSelectGrid}>
                  {SYMPTOM_DEFINITIONS.map((sym) => {
                    const isSel = draftSymptoms.includes(sym.id);
                    return (
                      <Pressable
                        key={sym.id}
                        style={[styles.symSelectTile, isSel && styles.symSelectTileActive]}
                        onPress={() => handleToggleSymptom(sym.id)}
                      >
                        <Ionicons
                          name={sym.icon || 'bandage-outline'}
                          size={16}
                          color={isSel ? '#F1FEC8' : '#23212C'}
                        />
                        <AppText
                          variant="caption"
                          style={[styles.symSelectTileText, isSel && styles.symSelectTileTextActive]}
                        >
                          {sym.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 4. ALIMENTO SOSPETTO & SUGGERIMENTI */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="restaurant-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '4. Alimento o piatto sospetto' : '4. Suspected food'}
                  </AppText>
                </View>

                <TextInput
                  style={styles.textInputField}
                  value={draftFood}
                  onChangeText={setDraftFood}
                  placeholder={isIt ? 'es. Torta alle noci, pizza al sesamo, gamberi...' : 'e.g. Nut cake, sesame bread, shrimp...'}
                  placeholderTextColor="#94A3B8"
                />

                {recentFoods.length > 0 && (
                  <View style={styles.recentScansContainer}>
                    <View style={styles.recentScansTitleRow}>
                      <Ionicons name="sparkles-outline" size={13} color="#23212C" />
                      <AppText variant="caption" style={styles.recentScansTitle}>
                        {isIt ? 'Dalle tue scansioni recenti (1 tap):' : 'From recent scans (1 tap):'}
                      </AppText>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.recentChipsRow}
                    >
                      {recentFoods.map((name) => (
                        <Pressable
                          key={name}
                          style={styles.recentScanChip}
                          onPress={() => {
                            setDraftFood(name);
                            void Haptics.selectionAsync();
                          }}
                        >
                          <Ionicons name="barcode-outline" size={12} color="#23212C" />
                          <AppText variant="caption" numberOfLines={1} style={styles.recentScanChipText}>
                            {name}
                          </AppText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 5. FARMACI SOMMINISTRATI */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="medkit-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '5. Terapia o farmaci assunti' : '5. Medication taken'}
                  </AppText>
                </View>

                <TextInput
                  style={styles.textInputField}
                  value={draftMeds}
                  onChangeText={setDraftMeds}
                  placeholder={isIt ? 'es. Antistaminico Cetirizina 10mg, Cortisone...' : 'e.g. Cetirizine 10mg, Epipen, Inhaler...'}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 6. NOTE CLINICHE */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Ionicons name="document-text-outline" size={16} color="#23212C" />
                  <AppText variant="bodyBold" style={styles.formSectionTitle}>
                    {isIt ? '6. Note cliniche ed esito' : '6. Clinical notes & outcome'}
                  </AppText>
                </View>

                <TextInput
                  style={[styles.textInputField, styles.textAreaField]}
                  value={draftNotes}
                  onChangeText={setDraftNotes}
                  placeholder={isIt ? 'es. Durata sintomi 45 min, risolto spontaneamente a casa...' : 'e.g. Duration 45 mins, resolved at home...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* MODAL ACTIONS BAR */}
            <View style={styles.modalActionBar}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <AppText variant="bodyBold" color="#64748B">
                  {isIt ? 'Annulla' : 'Cancel'}
                </AppText>
              </Pressable>

              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleSave}
              >
                <Ionicons name="checkmark-outline" size={18} color="#23212C" />
                <AppText variant="bodyBold" color="#23212C">
                  {isIt ? 'Salva nel Diario' : 'Save to Diary'}
                </AppText>
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
    paddingTop: 8,
  },
  scrollContent: {
    gap: 16,
    paddingTop: 4,
  },
  navBackBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  topAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HERO SUMMARY CARD COSMIC + VANILLA
  heroCard: {
    backgroundColor: '#23212C',
    borderRadius: 24,
    padding: 20,
    gap: 16,
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
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1FEC8',
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#F1FEC8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  // FILTRI PROFILO
  filterSection: {
    marginVertical: 2,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
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
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },

  // LISTA & CARD TIMELINE
  timelineList: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#23212C',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  severityBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  entryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryMetaText: {
    fontSize: 11.5,
  },
  entryProfileTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  entryProfileText: {
    fontSize: 11,
    color: '#23212C',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
  },

  // BLOCCHI INTERNI CARD
  foodBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 10,
  },
  foodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodTextBlock: {
    flex: 1,
  },
  foodLabel: {
    fontSize: 10.5,
    color: '#92400E',
    fontWeight: '600',
  },
  foodName: {
    fontSize: 13.5,
    color: '#78350F',
    marginTop: 1,
  },
  groupLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  symptomsContainer: {
    marginTop: 2,
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symOutlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  symChipLabel: {
    fontSize: 11.5,
    color: '#23212C',
    fontWeight: '600',
  },
  medsBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  medsLabel: {
    fontSize: 10.5,
    color: '#23212C',
    fontWeight: '700',
  },
  medsContent: {
    fontSize: 12,
    color: '#334155',
    marginTop: 1,
  },
  notesBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  notesContent: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 16,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#23212C',
    fontSize: 17,
  },
  emptySubtitle: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontSize: 13,
  },

  // MODAL / SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 33, 44, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    color: '#23212C',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },

  // FORM SECTIONS
  formSection: {
    gap: 8,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  formSectionTitle: {
    fontSize: 13.5,
    color: '#23212C',
  },
  profilePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profilePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  profilePickBtnActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  profilePickText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  profilePickTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },

  // SEVERITY GRID
  severityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  severityCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 14,
  },
  severityCardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // SYMPTOMS SELECT
  symptomsSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symSelectTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  symSelectTileActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  symSelectTileText: {
    fontSize: 12,
    color: '#475569',
  },
  symSelectTileTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },

  // INPUTS
  textInputField: {
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
  textAreaField: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  recentScansContainer: {
    marginTop: 4,
    gap: 6,
  },
  recentScansTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentScansTitle: {
    fontSize: 11,
    color: '#23212C',
    fontWeight: '600',
  },
  recentChipsRow: {
    gap: 6,
  },
  recentScanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: 180,
  },
  recentScanChipText: {
    fontSize: 11.5,
    color: '#23212C',
    fontWeight: '600',
  },

  // ACTION BAR
  modalActionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    shadowColor: '#F1FEC8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
