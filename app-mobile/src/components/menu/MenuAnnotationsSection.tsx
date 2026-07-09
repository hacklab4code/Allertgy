import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DetailSection from '../DetailSection';
import { colors } from '../../theme';
import type { Allergen, CustomerAnnotation } from '../../types';

type AnnotationState = {
  annotations: CustomerAnnotation[];
  selectedAllergen: Allergen | null;
  setSelectedAllergen: (a: Allergen | null) => void;
  customAllergenSearch: string;
  setCustomAllergenSearch: (v: string) => void;
  showAllAllergensDropdown: boolean;
  setShowAllAllergensDropdown: (v: boolean) => void;
  annotIngredient: string;
  setAnnotIngredient: (v: string) => void;
  annotNotes: string;
  setAnnotNotes: (v: string) => void;
  annotBusy: boolean;
  myAllergenList: Allergen[];
  filteredAllAllergens: Allergen[];
  submitAnnotation: () => void;
};

type Props = {
  language: string;
  allergie: readonly string[];
  canSubmit: boolean;
  state: AnnotationState;
};

export default function MenuAnnotationsSection({ language, allergie, canSubmit, state }: Props) {
  const {
    annotations,
    selectedAllergen,
    setSelectedAllergen,
    customAllergenSearch,
    setCustomAllergenSearch,
    showAllAllergensDropdown,
    setShowAllAllergensDropdown,
    annotIngredient,
    setAnnotIngredient,
    annotNotes,
    setAnnotNotes,
    annotBusy,
    myAllergenList,
    filteredAllAllergens,
    submitAnnotation,
  } = state;

  const isIt = language === 'it';

  return (
    <>
      <DetailSection
        title={isIt ? 'COMMUNITY E SICUREZZA' : 'COMMUNITY & SAFETY'}
        subtitle={
          isIt
            ? 'Segnalazioni di altri clienti e invio di nuovi warning.'
            : 'Reports from other customers and submitting new warnings.'
        }
        card={false}
      />
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.title}>
            ⚠️ Warning e Annotazioni Clienti ({annotations.length})
          </Text>
        </View>
        <Text style={styles.subtitle}>
          Segnalazioni degli utenti su ingredienti non dichiarati o problematici per allergie specifiche.
        </Text>

        {annotations.map((ann) => {
          const matchesMyAllergy = allergie.includes(ann.allergen_code);
          return (
            <View key={ann.id} style={[styles.card, matchesMyAllergy && styles.cardHighlight]}>
              <View style={styles.cardHead}>
                <Text style={styles.allergen}>
                  {ann.allergen_emoji} {ann.allergen_name_it}
                </Text>
                {matchesMyAllergy && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>Tua Allergia</Text>
                  </View>
                )}
              </View>
              {ann.ingredient ? (
                <Text style={styles.ingredient}>
                  Ingrediente critico:{' '}
                  <Text style={{ fontWeight: '800', color: colors.redText }}>{ann.ingredient}</Text>
                </Text>
              ) : null}
              <Text style={styles.notes}>"{ann.notes}"</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  Inviato da {ann.author_name} · {new Date(ann.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          );
        })}

        {annotations.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🛡️</Text>
            <Text style={styles.emptyText}>Nessuna segnalazione di ingredienti per questo locale.</Text>
          </View>
        )}

        {canSubmit && (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>📢 Segnala un ingrediente critico</Text>
            </View>
            <Text style={styles.formSub}>
              Se hai riscontrato ingredienti non indicati o pericolosi per una specifica allergia in questo locale,
              segnalalo per avvisare gli altri utenti.
            </Text>

            <Text style={styles.formLabel}>1. Seleziona l'allergia correlata:</Text>
            <View style={styles.quickAllergensGrid}>
              {myAllergenList.map((a) => {
                const isSelected = selectedAllergen?.code === a.code;
                return (
                  <TouchableOpacity
                    key={a.code}
                    onPress={() => {
                      setSelectedAllergen(a);
                      setShowAllAllergensDropdown(false);
                    }}
                    style={[styles.quickAllergenChip, isSelected && styles.quickAllergenChipActive]}
                  >
                    <Text style={[styles.quickAllergenChipText, isSelected && styles.quickAllergenChipTextActive]}>
                      {a.emoji} {a.name_it}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowAllAllergensDropdown(!showAllAllergensDropdown)}
                style={[
                  styles.quickAllergenChip,
                  showAllAllergensDropdown && styles.quickAllergenChipActive,
                  { backgroundColor: '#f1f5f9' },
                ]}
              >
                <Text style={styles.quickAllergenChipText}>🔍 Altro allergene...</Text>
              </TouchableOpacity>
            </View>

            {showAllAllergensDropdown && (
              <View style={styles.dropdownContainer}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Cerca allergene..."
                  value={customAllergenSearch}
                  onChangeText={setCustomAllergenSearch}
                  placeholderTextColor="#94a3b8"
                />
                <ScrollView style={[styles.dropdownList, { maxHeight: 150 }]} nestedScrollEnabled>
                  {filteredAllAllergens.map((a) => (
                    <TouchableOpacity
                      key={a.code}
                      onPress={() => {
                        setSelectedAllergen(a);
                        setShowAllAllergensDropdown(false);
                        setCustomAllergenSearch('');
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={styles.dropdownItemText}>
                        {a.emoji} {a.name_it}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredAllAllergens.length === 0 && (
                    <Text style={styles.dropdownEmpty}>Nessun allergene trovato</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {selectedAllergen && (
              <View style={styles.selectedAlert}>
                <Text style={styles.selectedAlertText}>
                  Selezionato:{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {selectedAllergen.emoji} {selectedAllergen.name_it}
                  </Text>
                </Text>
              </View>
            )}

            <Text style={styles.formLabel}>2. Ingrediente problematico (es. latte in polvere):</Text>
            <TextInput
              style={styles.formInput}
              value={annotIngredient}
              onChangeText={setAnnotIngredient}
              placeholder="Quale ingrediente ti ha dato fastidio?"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.formLabel}>3. Descrivi cosa è successo o dove si trova:</Text>
            <TextInput
              style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
              value={annotNotes}
              onChangeText={setAnnotNotes}
              multiline
              placeholder="es. Trovato nelle patatine fritte anche se non segnalato dal menù..."
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.submit, (annotBusy || !selectedAllergen || !annotNotes.trim()) && { opacity: 0.5 }]}
              disabled={annotBusy || !selectedAllergen || !annotNotes.trim()}
              onPress={submitAnnotation}
            >
              {annotBusy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Invia Warning di Sicurezza</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 12.5, color: '#64748b', lineHeight: 18, marginTop: -8 },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  cardHighlight: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allergen: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  matchBadge: { backgroundColor: '#fecaca', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  matchBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#b91c1c', textTransform: 'uppercase' },
  ingredient: { fontSize: 13, color: '#334155', fontWeight: '600' },
  notes: { fontSize: 13, color: '#475569', lineHeight: 19 },
  meta: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6, marginTop: 2 },
  metaText: { fontSize: 10.5, color: '#94a3b8', fontWeight: '600' },
  emptyBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 12.5, color: '#64748b', fontWeight: '600', textAlign: 'center', marginTop: 4 },
  form: { borderTopWidth: 1.5, borderTopColor: '#f1f5f9', paddingTop: 16, gap: 10, marginTop: 6 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formTitle: { fontWeight: '800', fontSize: 14.5, color: '#0f172a' },
  formSub: { fontSize: 12, color: '#94a3b8', lineHeight: 17 },
  formLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginTop: 4 },
  quickAllergensGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickAllergenChip: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  quickAllergenChipActive: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  quickAllergenChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  quickAllergenChipTextActive: { color: '#e11d48', fontWeight: '800' },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    fontSize: 13.5,
    color: '#0f172a',
  },
  submit: {
    height: 44,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownSearch: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  dropdownList: { maxHeight: 140 },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  dropdownEmpty: { paddingVertical: 12, fontSize: 12.5, color: '#94a3b8', textAlign: 'center', fontWeight: '600' },
  selectedAlert: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  selectedAlertText: { fontSize: 12.5, color: '#b45309', fontWeight: '600' },
});
