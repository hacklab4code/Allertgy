import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, TextInput
} from 'react-native';
import { api, API } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import type { Allergen } from '../../src/types';
import { TRANSLATED_ALLERGENS, t } from '../../src/engine/translations';

export default function Account() {
  const { email, allergie, setAllergie, logout, setEmergencyMedicines, language, setLanguage, ingredientiEsclusi, setIngredientiEsclusi } = useSession();
  const [all, setAll] = useState<Allergen[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergencyDraft, setEmergencyDraft] = useState('');

  const mie = all.filter((a) => allergie.includes(a.code));

  const loadProfileData = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      setEmergencyMedicines(p.emergency_medicines);
      setEmergencyDraft(p.emergency_medicines ?? '');
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.log('Errore caricamento profilo mobile:', e);
    }
  };

  useEffect(() => {
    api.allergens().then(setAll).catch(() => {});
    loadProfileData();
  }, [allergie]);

  const confirmLogout = () =>
    Alert.alert(
      language === 'it' ? 'Esci dall\'account' : 'Logout',
      language === 'it' ? 'Vuoi davvero uscire?' : 'Are you sure you want to logout?',
      [
        { text: language === 'it' ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: language === 'it' ? 'Esci' : 'Logout', style: 'destructive',
          onPress: () => { logout(); router.replace('/welcome'); },
        },
      ]
    );

  const saveEmergencyMedicines = async () => {
    setLoading(true);
    try {
      const value = emergencyDraft.trim() || null;
      await api.updateAppleHealth(0, value);
      setEmergencyMedicines(value);
      await loadProfileData();
      Alert.alert(
        language === 'it' ? 'Salvato' : 'Saved',
        language === 'it'
          ? 'Le informazioni di emergenza sono state aggiornate.'
          : 'Emergency information has been updated.'
      );
    } catch (e) {
      Alert.alert(language === 'it' ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const isIt = language === 'it';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Intestazione profilo */}
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>
          {(email ?? 'A')[0].toUpperCase()}
        </Text></View>
        <Text style={styles.email}>{profile?.display_name || email || (isIt ? 'Utente' : 'User')}</Text>
        {email && <Text style={styles.emailSub}>{email}</Text>}
        <Text style={styles.roleBadge}>{isIt ? '🙋 Account Cliente' : '🙋 Customer Account'}</Text>
      </View>

      {loading && <ActivityIndicator color="#059669" style={{ marginBottom: 12 }} />}

      {/* Sezione 1: Salute & Profilo */}
      <Text style={styles.sectionLabel}>{isIt ? 'SALUTE E PROFILO' : 'HEALTH & PROFILE'}</Text>
      <View style={styles.card}>
        {/* Allergies Row */}
        <TouchableOpacity style={styles.item} onPress={() => router.push('/allergie')}>
          <Text style={styles.itemIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Allergie e intolleranze' : 'Allergies & intolerances'}</Text>
            {mie.length === 0 ? (
              <Text style={styles.itemSub}>
                {isIt ? 'Nessuna selezionata — tocca per impostarle' : 'None selected — tap to set'}
              </Text>
            ) : (
              <View style={styles.chips}>
                {mie.map((a) => (
                  <View key={a.code} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {a.emoji} {isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Emergency Medicines Row */}
        <View style={[styles.item, { alignItems: 'flex-start' }]}>
          <Text style={styles.itemIcon}>💊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Farmaci e note di emergenza' : 'Emergency medicines and notes'}</Text>
            <Text style={styles.itemSub}>
              {isIt
                ? 'Scrivi cosa mostrare nella schermata SOS, ad esempio adrenalina autoiniettabile, antistaminico o contatti utili.'
                : 'Write what should appear in the SOS screen, such as epinephrine autoinjector, antihistamine, or useful contacts.'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.medicineInput]}
              value={emergencyDraft}
              onChangeText={setEmergencyDraft}
              placeholder={isIt ? 'es. EpiPen nello zaino, chiamare 112' : 'e.g. EpiPen in backpack, call emergency services'}
              multiline
            />
            <TouchableOpacity style={styles.smallButton} onPress={saveEmergencyMedicines} disabled={loading}>
              <Text style={styles.smallButtonText}>{isIt ? 'Salva note SOS' : 'Save SOS notes'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Lingua / Language Switch Row */}
        <View style={[styles.item, { paddingVertical: 10 }]}>
          <Text style={styles.itemIcon}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Lingua dell\'app' : 'App Language'}</Text>
            <Text style={styles.itemSub}>{isIt ? 'Seleziona italiano o inglese' : 'Select Italian or English'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity 
              onPress={() => setLanguage('it')}
              style={[
                styles.langBtn, 
                language === 'it' && styles.langBtnActive
              ]}
            >
              <Text style={[styles.langBtnText, language === 'it' && styles.langBtnTextActive]}>IT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setLanguage('en')}
              style={[
                styles.langBtn, 
                language === 'en' && styles.langBtnActive
              ]}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sezione 1.5: Ingredienti da Evitare */}
      <Text style={styles.sectionLabel}>{t('custom_ingredients_label', language)}</Text>
      <View style={styles.card}>
        <View style={{ padding: 14, gap: 10 }}>
          <Text style={styles.itemSub}>{t('custom_ingredients_sub', language)}</Text>
          <TextInput
            style={styles.textInput}
            value={ingredientiEsclusi.filter(s => s.length > 0).join(', ')}
            onChangeText={(txt) => {
              const list = txt.split(',').map((s) => s.trim());
              setIngredientiEsclusi(list);
            }}
            placeholder={isIt ? "es. cipolla, aglio" : "e.g. onion, garlic"}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Sezione 2: Documenti Certificati */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{isIt ? 'DOCUMENTI SANITARI' : 'MEDICAL DOCUMENTS'}</Text>
      </View>
      <View style={styles.card}>
        {documents.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={styles.emptyText}>{isIt ? 'Nessun certificato medico caricato.' : 'No medical certificates uploaded.'}</Text>
            <Text style={styles.emptyNote}>
              {isIt
                ? 'Il caricamento documenti da mobile arriverà in una prossima versione. Tieni sempre con te certificati e farmaci prescritti.'
                : 'Mobile document upload will arrive in a future version. Always keep certificates and prescribed medicines with you.'}
            </Text>
          </View>
        ) : (
          documents.map((d, index) => (
            <View key={d.id}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>📄 {d.filename}</Text>
                  <Text style={styles.docDate}>{isIt ? 'Caricato' : 'Uploaded'}: {d.created_at.substring(0, 10)}</Text>
                </View>
                <View style={[styles.statusBadge, d.status === 'verified' ? styles.badgeGreen : styles.badgeAmber]}>
                  <Text style={[styles.badgeText, d.status === 'verified' ? styles.badgeTextGreen : styles.badgeTextAmber]}>
                    {d.status === 'verified' 
                      ? (isIt ? 'Verificato' : 'Verified') 
                      : (isIt ? 'In attesa' : 'Pending')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sezione 3: Assistenza e Info */}
      <Text style={styles.sectionLabel}>{isIt ? 'INFO E SUPPORTO' : 'INFO & SUPPORT'}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.item}
          onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20AllerTgy')}>
          <Text style={styles.itemIcon}>✉️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Contatta l\'assistenza' : 'Contact support'}</Text>
            <Text style={styles.itemSub}>supporto@allertgy.it</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <View style={styles.item}>
          <Text style={styles.itemIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Informazioni app' : 'App info'}</Text>
            <Text style={styles.itemSub}>AllerTgy v0.4 · server: {API}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
        <Text style={styles.logoutText}>{isIt ? 'Esci dall\'account' : 'Logout'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 12 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#059669',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  email: { fontWeight: '800', fontSize: 16, color: '#1e293b', marginTop: 8 },
  emailSub: { color: '#64748b', fontSize: 12, marginTop: 1 },
  roleBadge: {
    marginTop: 6, fontSize: 11, color: '#047857', fontWeight: '800',
    backgroundColor: '#d1fae5', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 18, marginBottom: 6, paddingRight: 4,
  },
  addText: { color: '#059669', fontWeight: '700', fontSize: 13 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#94a3b8',
    marginTop: 18, marginBottom: 6, marginLeft: 4, letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  itemIcon: { fontSize: 20 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: '#1e293b' },
  itemSub: { color: '#64748b', fontSize: 12, marginTop: 1, lineHeight: 18 },
  chevron: { fontSize: 22, color: '#cbd5e1', fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  chip: {
    backgroundColor: '#d1fae5', borderRadius: 999,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  chipText: { color: '#065f46', fontSize: 11, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 48 },
  medicineBox: {
    backgroundColor: '#fef2f2', borderTopWidth: 1, borderTopColor: '#fee2e2',
    padding: 12, gap: 4,
  },
  medicineTitle: { fontWeight: '700', color: '#991b1b', fontSize: 12 },
  medicineText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  medicineNote: { color: '#94a3b8', fontSize: 9, marginTop: 2 },
  docRow: {
    flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'space-between',
  },
  docName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  docDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12 },
  badgeGreen: { backgroundColor: '#d1fae5' },
  badgeAmber: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeTextGreen: { color: '#065f46' },
  badgeTextAmber: { color: '#b45309' },
  emptyText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  emptyNote: { fontSize: 10, color: '#cbd5e1', marginTop: 2 },
  logout: { alignItems: 'center', padding: 16, marginTop: 12 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  langBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  langBtnTextActive: {
    color: '#065f46',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  medicineInput: {
    minHeight: 74,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  smallButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
