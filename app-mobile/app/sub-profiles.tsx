import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { api } from '../src/api/client';
import DetailSection from '../src/components/DetailSection';
import { useSession } from '../src/store/session';
import type { Allergen, SubProfile } from '../src/types';
import { colors } from '../src/theme';

const RELATIONS = [
  { label: 'Figlio/a', value: 'figlio' },
  { label: 'Coniuge/Partner', value: 'coniuge' },
  { label: 'Genitore', value: 'genitore' },
  { label: 'Amico/a', value: 'amico' },
  { label: 'Altro', value: 'altro' }
];

export default function SubProfilesScreen() {
  const { subProfiles, setSubProfiles, language } = useSession();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Stati del form
  const [editingProfile, setEditingProfile] = useState<SubProfile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('altro');
  const [selectedAllergens, setSelectedAllergens] = useState<Record<string, 'lieve' | 'moderata' | 'grave'>>({});

  const isIt = language === 'it';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await api.allergens();
      setAllergens(all.filter(a => !a.is_diet));
      const profiles = await api.getSubProfiles();
      setSubProfiles(profiles);
    } catch (e) {
      console.log('Errore caricamento profili:', e);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingProfile(null);
    setName('');
    setRelationship('figlio');
    setSelectedAllergens({});
    setModalVisible(true);
  };

  const openEditModal = (p: SubProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setRelationship(p.relationship);
    
    const mapped: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
    p.allergens.forEach(a => {
      mapped[a.code] = a.intensity;
    });
    setSelectedAllergens(mapped);
    setModalVisible(true);
  };

  const toggleAllergen = (code: string) => {
    setSelectedAllergens(prev => {
      const copy = { ...prev };
      if (copy[code]) {
        delete copy[code];
      } else {
        copy[code] = 'moderata';
      }
      return copy;
    });
  };

  const cycleIntensity = (code: string) => {
    setSelectedAllergens(prev => {
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
      const payloadAllergens = Object.keys(selectedAllergens).map(code => ({
        code,
        intensity: selectedAllergens[code]
      }));

      const body = {
        name: name.trim(),
        relationship: editingProfile?.relationship === 'io' ? 'io' : relationship,
        allergens: payloadAllergens
      };

      if (editingProfile) {
        // Modifica
        const updated = await api.updateSubProfile(editingProfile.id, body);
        setSubProfiles(subProfiles.map(p => p.id === editingProfile.id ? updated : p));
      } else {
        // Creazione
        const created = await api.createSubProfile(body);
        setSubProfiles([...subProfiles, created]);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleDelete = (p: SubProfile) => {
    if (p.relationship === 'io') {
      Alert.alert(
        isIt ? 'Azione non consentita' : 'Action not allowed',
        isIt ? 'Non puoi eliminare il tuo profilo principale.' : 'You cannot delete your primary profile.'
      );
      return;
    }

    Alert.alert(
      isIt ? 'Elimina Profilo' : 'Delete Profile',
      isIt ? `Sei sicuro di voler eliminare il profilo di ${p.name}?` : `Are you sure you want to delete ${p.name}'s profile?`,
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? 'Elimina' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteSubProfile(p.id);
              setSubProfiles(subProfiles.filter(item => item.id !== p.id));
            } catch (e) {
              Alert.alert('Errore', (e as Error).message);
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const getRelationLabel = (rel: string) => {
    if (rel === 'io') return isIt ? 'Profilo Principale (Io)' : 'Primary Profile (Me)';
    const found = RELATIONS.find(r => r.value === rel);
    return found ? found.label : rel.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>👥 {isIt ? 'Profili Famiglia' : 'Family Profiles'}</Text>
          <Text style={styles.sub}>
            {isIt
              ? 'Gestisci le allergie di figli, partner o altre persone per controllare la compatibilità dei cibi per tutta la famiglia.'
              : 'Manage allergies for children, partners, or others to check food compatibility for the whole family.'}
          </Text>
        </View>

        {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />}

        <DetailSection
          title={isIt ? 'PERSONE REGISTRATE' : 'REGISTERED PROFILES'}
          subtitle={isIt ? 'Ogni persona ha allergie separate per scansioni e semaforo.' : 'Each person has separate allergies for scans and traffic light.'}
          card={false}
        />

        <View style={styles.list}>
          {subProfiles.map(p => (
            <View key={p.id} style={[styles.card, p.relationship === 'io' && styles.primaryCard]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardRelation}>{getRelationLabel(p.relationship)}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(p)}>
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  {p.relationship !== 'io' && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(p)}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.cardBody}>
                {p.allergens.length === 0 ? (
                  <Text style={styles.noAllergens}>
                    {isIt ? 'Nessun allergene impostato' : 'No allergens selected'}
                  </Text>
                ) : (
                  <View style={styles.chips}>
                    {p.allergens.map(a => (
                      <View key={a.code} style={[styles.chip, a.intensity === 'lieve' ? styles.lieve : a.intensity === 'grave' ? styles.grave : styles.moderata]}>
                        <Text style={styles.chipText}>
                          {a.emoji} {a.name_it} ({a.intensity})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addFab} onPress={openAddModal}>
        <Text style={styles.addFabText}>＋ {isIt ? 'Aggiungi Persona' : 'Add Profile'}</Text>
      </TouchableOpacity>

      {/* MODALE DI AGGIUNTA / MODIFICA */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProfile
                ? (isIt ? 'Modifica Profilo' : 'Edit Profile')
                : (isIt ? 'Nuovo Profilo' : 'New Profile')}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>{isIt ? 'Chiudi' : 'Close'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{isIt ? 'Nome della persona' : "Person's Name"}</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={isIt ? 'es. Sofia, Marco' : 'e.g. Sofia, Marco'}
              />
            </View>

            {editingProfile?.relationship !== 'io' && (
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{isIt ? 'Relazione' : 'Relationship'}</Text>
                <View style={styles.relationsRow}>
                  {RELATIONS.map(rel => (
                    <TouchableOpacity
                      key={rel.value}
                      style={[styles.relationChip, relationship === rel.value && styles.relationChipOn]}
                      onPress={() => setRelationship(rel.value)}
                    >
                      <Text style={[styles.relationText, relationship === rel.value && styles.relationTextOn]}>
                        {rel.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                {isIt ? 'Allergie e Intolleranze' : 'Allergies & Intolerances'}
              </Text>
              <Text style={styles.helperText}>
                {isIt
                  ? 'Seleziona gli allergeni e tocca l\'intensità per cambiarla (lieve, moderata, grave).'
                  : 'Select allergens and tap on intensity to change it (mild, moderate, severe).'}
              </Text>

              <View style={styles.allergenSelectorList}>
                {allergens.map(a => {
                  const isSelected = !!selectedAllergens[a.code];
                  const intensity = selectedAllergens[a.code] || 'moderata';
                  return (
                    <View key={a.code} style={[styles.allergenSelectorItem, isSelected && styles.selectorItemOn]}>
                      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => toggleAllergen(a.code)}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                          {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                        </View>
                        <Text style={[styles.selectorLabel, isSelected && styles.selectorLabelOn]}>
                          {a.emoji} {a.name_it}
                        </Text>
                      </TouchableOpacity>

                      {isSelected && (
                        <TouchableOpacity style={[styles.intensityBadge, intensity === 'lieve' ? styles.lieveBadge : intensity === 'grave' ? styles.graveBadge : styles.moderataBadge]} onPress={() => cycleIntensity(a.code)}>
                          <Text style={styles.intensityBadgeText}>
                            {intensity.toUpperCase()} 🔄
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{isIt ? 'Salva Profilo' : 'Save Profile'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  sub: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  primaryCard: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdf4'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 10 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  cardRelation: { fontSize: 11, fontWeight: '700', color: colors.brand, textTransform: 'uppercase', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8 },
  editBtnText: { fontSize: 14 },
  deleteBtn: { padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  deleteBtnText: { fontSize: 14 },
  cardBody: {},
  noAllergens: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  lieve: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  moderata: { backgroundColor: '#ffedd5', borderColor: '#ea580c' },
  grave: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  addFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  addFabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
  // Modale
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  closeText: { fontSize: 14, fontWeight: '800', color: colors.brand },
  modalScroll: { padding: 16, gap: 20 },
  formGroup: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc'
  },
  relationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relationChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  relationChipOn: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdf4'
  },
  relationText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  relationTextOn: { color: colors.brand },
  helperText: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  allergenSelectorList: { gap: 8 },
  allergenSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  selectorItemOn: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdf4'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  checkboxMark: { color: '#fff', fontWeight: '900', fontSize: 12 },
  selectorLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  selectorLabelOn: { fontWeight: '700', color: '#0f172a' },
  intensityBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  lieveBadge: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  moderataBadge: { backgroundColor: '#ffedd5', borderColor: '#ea580c' },
  graveBadge: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  intensityBadgeText: { fontSize: 10, fontWeight: '800', color: '#0f172a' },
  saveBtn: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});
