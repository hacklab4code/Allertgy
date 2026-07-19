import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import type { Allergen, SubProfile } from '../src/types';
import { colors, radius, spacing } from '../src/theme';
import { toggleAllergieSelectionWithIntensities } from '../src/engine/allergyLinks';
import {
  AppText,
  AvatarBubble,
  avatarForIndex,
  DebossedInput,
  EmptyStateCard,
  GlassCard,
  GlassScreenScroll,
  HeaderAddButton,
  PuffyButton,
  Screen,
  Section,
} from '../src/components/ui';

const RELATIONS = [
  { label: 'Figlio/a', labelEn: 'Child', value: 'figlio' },
  { label: 'Coniuge/Partner', labelEn: 'Spouse/Partner', value: 'coniuge' },
  { label: 'Genitore', labelEn: 'Parent', value: 'genitore' },
  { label: 'Amico/a', labelEn: 'Friend', value: 'amico' },
  { label: 'Altro', labelEn: 'Other', value: 'altro' },
];

export default function SubProfilesScreen() {
  const { subProfiles, setSubProfiles, language } = useSession();
  const params = useLocalSearchParams<{ edit?: string; add?: string }>();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SubProfile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('figlio');
  const [selectedAllergens, setSelectedAllergens] = useState<Record<string, 'lieve' | 'moderata' | 'grave'>>({});

  const isIt = language === 'it';
  const familyProfiles = subProfiles.filter((p) => p.relationship !== 'io');
  const primaryProfile = subProfiles.find((p) => p.relationship === 'io');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.allergens();
      setAllergens(all.filter((a) => !a.is_diet));
      const profiles = await api.getSubProfiles();
      setSubProfiles(profiles);
    } catch (e) {
      console.log('Errore caricamento profili:', e);
    }
    setLoading(false);
  }, [setSubProfiles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = useCallback(() => {
    setEditingProfile(null);
    setName('');
    setRelationship('figlio');
    setSelectedAllergens({});
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((p: SubProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setRelationship(p.relationship);
    const mapped: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
    p.allergens.forEach((a) => {
      mapped[a.code] = a.intensity;
    });
    setSelectedAllergens(mapped);
    setModalVisible(true);
  }, []);

  useEffect(() => {
    if (loading || subProfiles.length === 0) return;
    if (params.add === '1') {
      openAddModal();
      router.setParams({ add: undefined });
    } else if (params.edit) {
      const id = Number(params.edit);
      const target = subProfiles.find((p) => p.id === id);
      if (target) openEditModal(target);
      router.setParams({ edit: undefined });
    }
  }, [params.add, params.edit, subProfiles, loading, openAddModal, openEditModal]);

  const toggleAllergen = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selected = new Set(Object.keys(selectedAllergens));
    const { intensities } = toggleAllergieSelectionWithIntensities(
      selected,
      selectedAllergens,
      code,
    );
    setSelectedAllergens(intensities);
  };

  const cycleIntensity = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAllergens((prev) => {
      const copy = { ...prev };
      if (!copy[code]) return prev;
      const current = copy[code];
      if (current === 'lieve') copy[code] = 'moderata';
      else if (current === 'moderata') copy[code] = 'grave';
      else copy[code] = 'lieve';
      return copy;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(isIt ? 'Attenzione' : 'Warning', isIt ? 'Inserisci un nome valido.' : 'Please enter a valid name.');
      return;
    }
    setLoading(true);
    try {
      const payloadAllergens = Object.keys(selectedAllergens).map((code) => ({
        code,
        intensity: selectedAllergens[code],
      }));
      const body = {
        name: name.trim(),
        relationship: editingProfile?.relationship === 'io' ? 'io' : relationship,
        allergens: payloadAllergens,
      };
      if (editingProfile) {
        const updated = await api.updateSubProfile(editingProfile.id, body);
        setSubProfiles(subProfiles.map((p) => (p.id === editingProfile.id ? updated : p)));
      } else {
        const created = await api.createSubProfile(body);
        setSubProfiles([...subProfiles, created]);
      }
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleDelete = (p: SubProfile) => {
    if (p.relationship === 'io') {
      Alert.alert(
        isIt ? 'Azione non consentita' : 'Action not allowed',
        isIt ? 'Non puoi eliminare il profilo principale.' : 'You cannot delete your primary profile.',
      );
      return;
    }
    Alert.alert(
      isIt ? 'Elimina profilo' : 'Delete profile',
      isIt ? `Eliminare il profilo di ${p.name}?` : `Delete ${p.name}'s profile?`,
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? 'Elimina' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteSubProfile(p.id);
              setSubProfiles(subProfiles.filter((item) => item.id !== p.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
            }
            setLoading(false);
          },
        },
      ],
    );
  };

  const getRelationLabel = (rel: string) => {
    if (rel === 'io') return isIt ? 'Profilo principale' : 'Primary profile';
    const found = RELATIONS.find((r) => r.value === rel);
    return found ? (isIt ? found.label : found.labelEn) : rel;
  };

  const intensityStyle = (intensity: string) => {
    if (intensity === 'lieve') return styles.chipLieve;
    if (intensity === 'grave') return styles.chipGrave;
    return styles.chipModerata;
  };

  return (
    <Screen ambient>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAddButton onPress={openAddModal} accessibilityLabel="Aggiungi persona" />
          ),
        }}
      />
      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        <AppText variant="subtitle" style={styles.intro}>
          {isIt
            ? 'Ogni persona ha allergie separate per scansioni e semaforo.'
            : 'Each person has separate allergies for scans and traffic light.'}
        </AppText>

        {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.md }} />}

        {primaryProfile && (
          <GlassCard style={styles.primaryCard}>
            <View style={styles.cardRow}>
              <AvatarBubble {...avatarForIndex(0)} active size={52} />
              <View style={{ flex: 1 }}>
                <AppText variant="title">{primaryProfile.name}</AppText>
                <AppText variant="caption" color={colors.brand}>{getRelationLabel('io')}</AppText>
              </View>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/allergie')}
              >
                <Ionicons name="create-outline" size={20} color={colors.brand} />
              </Pressable>
            </View>
            <View style={styles.chips}>
              {primaryProfile.allergens.length === 0 ? (
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Nessun allergene — modifica dal profilo principale' : 'No allergens — edit from primary profile'}
                </AppText>
              ) : (
                primaryProfile.allergens.map((a) => (
                  <View key={a.code} style={[styles.chip, intensityStyle(a.intensity)]}>
                    <AppText variant="caption">{a.emoji} {a.name_it}</AppText>
                  </View>
                ))
              )}
            </View>
          </GlassCard>
        )}

        <Section
          title={isIt ? 'Altri profili' : 'Other profiles'}
          subtitle={familyProfiles.length > 0
            ? `${familyProfiles.length} ${isIt ? 'persone' : 'people'}`
            : (isIt ? 'Tocca + in alto per aggiungere una persona' : 'Tap + above to add a person')}
        >
        {!loading && familyProfiles.length === 0 ? (
          <EmptyStateCard
            icon="people"
            title={isIt ? 'Nessun profilo famiglia' : 'No family profiles'}
            description={isIt
              ? 'Aggiungi figli, partner o altri familiari per scansionare con allergie separate.'
              : 'Add children, partners or others to scan with separate allergies.'}
          />
        ) : (
          <View style={styles.list}>
            {familyProfiles.map((p, i) => {
              const av = avatarForIndex(i + 1);
              return (
                <GlassCard key={p.id}>
                  <View style={styles.cardRow}>
                    <AvatarBubble emoji={av.emoji} color={av.color} size={48} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold">{p.name}</AppText>
                      <AppText variant="caption" color={colors.brand}>{getRelationLabel(p.relationship)}</AppText>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable style={styles.iconBtn} onPress={() => openEditModal(p)}>
                        <Ionicons name="create-outline" size={20} color={colors.brand} />
                      </Pressable>
                      <Pressable style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => handleDelete(p)}>
                        <Ionicons name="trash-outline" size={20} color={colors.red} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.chips}>
                    {p.allergens.length === 0 ? (
                      <AppText variant="caption" color={colors.onSurfaceMuted}>
                        {isIt ? 'Nessun allergene impostato' : 'No allergens set'}
                      </AppText>
                    ) : (
                      p.allergens.map((a) => (
                        <View key={a.code} style={[styles.chip, intensityStyle(a.intensity)]}>
                          <AppText variant="caption">
                            {a.emoji} {a.name_it} ({a.intensity})
                          </AppText>
                        </View>
                      ))
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        </Section>
      </GlassScreenScroll>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Screen>
          <View style={styles.modalHead}>
            <AppText variant="h2">
              {editingProfile
                ? (isIt ? 'Modifica profilo' : 'Edit profile')
                : (isIt ? 'Nuovo profilo' : 'New profile')}
            </AppText>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
              <AppText variant="bodyBold" color={colors.brand}>{isIt ? 'Chiudi' : 'Close'}</AppText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <AppText variant="bodyBold">{isIt ? 'Nome' : 'Name'}</AppText>
              <DebossedInput
                value={name}
                onChangeText={setName}
                placeholder={isIt ? 'es. Sofia, Marco' : 'e.g. Sofia, Marco'}
              />
            </View>

            {editingProfile?.relationship !== 'io' && (
              <View style={styles.field}>
                <AppText variant="bodyBold">{isIt ? 'Relazione' : 'Relationship'}</AppText>
                <View style={styles.relationsRow}>
                  {RELATIONS.map((rel) => {
                    const on = relationship === rel.value;
                    return (
                      <Pressable
                        key={rel.value}
                        style={[styles.relationChip, on && styles.relationChipOn]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRelationship(rel.value);
                        }}
                      >
                        <AppText variant="caption" color={on ? colors.brand : colors.onSurfaceMuted}>
                          {isIt ? rel.label : rel.labelEn}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.field}>
              <AppText variant="bodyBold">{isIt ? 'Allergie e intolleranze' : 'Allergies & intolerances'}</AppText>
              <AppText variant="caption">
                {isIt
                  ? 'Seleziona gli allergeni. Tocca l\'intensità per cambiarla.'
                  : 'Select allergens. Tap intensity to change it.'}
              </AppText>
              <View style={styles.allergenList}>
                {allergens.map((a) => {
                  const isSelected = !!selectedAllergens[a.code];
                  const intensity = selectedAllergens[a.code] || 'moderata';
                  return (
                    <Pressable
                      key={a.code}
                      style={[styles.allergenRow, isSelected && styles.allergenRowOn]}
                      onPress={() => toggleAllergen(a.code)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <AppText variant="bodyBold" style={{ flex: 1 }}>
                        {a.emoji} {a.name_it}
                      </AppText>
                      {isSelected && (
                        <Pressable
                          style={[styles.intensityBadge, intensityStyle(intensity)]}
                          onPress={() => cycleIntensity(a.code)}
                        >
                          <AppText variant="caption">{intensity.toUpperCase()}</AppText>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <PuffyButton
              label={isIt ? 'Salva profilo' : 'Save profile'}
              onPress={handleSave}
              loading={loading}
            />
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  intro: { marginBottom: spacing.xs },
  primaryCard: { gap: spacing.md },
  sectionHead: { gap: 4, paddingHorizontal: 2 },
  list: { gap: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { backgroundColor: colors.redSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  chipLieve: { backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  chipModerata: { backgroundColor: colors.amberBg, borderColor: colors.amber },
  chipGrave: { backgroundColor: colors.redSoft, borderColor: colors.red },
  addBtn: { marginTop: spacing.sm },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalScroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 48 },
  field: { gap: spacing.sm },
  relationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  relationChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  relationChipOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  allergenList: { gap: spacing.sm },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  allergenRowOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  intensityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
