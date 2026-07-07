import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, TextInput
} from 'react-native';
import { api, API } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import type { Allergen } from '../../src/types';
import { getFlagEmoji, getLanguageLabel } from '../../src/constants/languages';
import { TRANSLATED_ALLERGENS, t } from '../../src/engine/translations';

export default function Account() {
  const { email, allergie, setAllergie, logout, setEmergencyMedicines, language, ingredientiEsclusi, setIngredientiEsclusi, emergencyContactName, emergencyContactPhone, setEmergencyContact } = useSession();
  const [all, setAll] = useState<Allergen[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [contactNameDraft, setContactNameDraft] = useState('');
  const [contactPhoneDraft, setContactPhoneDraft] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const mie = all.filter((a) => allergie.includes(a.code));

  const loadProfileData = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      setEmergencyMedicines(p.emergency_medicines);
      setEmergencyDraft(p.emergency_medicines ?? '');
      setEmergencyContact(p.emergency_contact_name ?? null, p.emergency_contact_phone ?? null);
      setContactNameDraft(p.emergency_contact_name ?? '');
      setContactPhoneDraft(p.emergency_contact_phone ?? '');
      const docs = await api.getDocuments();
      setDocuments(docs);
      const photo = await api.getProfilePhoto().catch(() => null);
      setPhotoUrl(photo?.photo_url ?? null);
    } catch (e) {
      console.log('Errore caricamento profilo mobile:', e);
    }
  };

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setLoading(true);
    try {
      const res = await api.uploadProfilePhoto(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
      setPhotoUrl(res.photo_url);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.allergens().then(setAll).catch(() => {});
    loadProfileData();
  }, [allergie]);

  const confirmLogout = () =>
    Alert.alert(
      t('logout_title', language),
      t('logout_confirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('logout_btn', language), style: 'destructive',
          onPress: () => { logout(); router.replace('/welcome'); },
        },
      ]
    );

  const saveEmergencyMedicines = async () => {
    setLoading(true);
    try {
      const value = emergencyDraft.trim() || null;
      await api.updateAppleHealth(profile?.apple_health_connected ?? 0, value, emergencyContactName, emergencyContactPhone);
      setEmergencyMedicines(value);
      await loadProfileData();
      Alert.alert(
        t('saved', language),
        t('emergency_saved', language)
      );
    } catch (e) {
      Alert.alert(t('error', language), (e as Error).message);
    }
    setLoading(false);
  };

  const saveEmergencyContact = async () => {
    setLoading(true);
    try {
      const name = contactNameDraft.trim() || null;
      const phone = contactPhoneDraft.trim() || null;
      await api.updateAppleHealth(
        profile?.apple_health_connected ?? 0,
        emergencyDraft.trim() || null,
        name,
        phone
      );
      setEmergencyContact(name, phone);
      await loadProfileData();
      Alert.alert(
        t('saved', language),
        t('contact_saved', language)
      );
    } catch (e) {
      Alert.alert(t('error', language), (e as Error).message);
    }
    setLoading(false);
  };

  const isIt = language === 'it';  // kept for legacy UI strings still using it/en pattern

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Intestazione profilo */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={changePhoto}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{(email ?? 'A')[0].toUpperCase()}</Text>
          )}
          <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>📷</Text></View>
        </TouchableOpacity>
        <Text style={styles.email}>{profile?.display_name || email || (isIt ? 'Utente' : 'User')}</Text>
        {email && <Text style={styles.emailSub}>{email}</Text>}
        <Text style={styles.roleBadge}>{isIt ? '🙋 Account Cliente' : '🙋 Customer Account'}</Text>
      </View>

      {loading && <ActivityIndicator color="#059669" style={{ marginBottom: 12 }} />}

      {/* Sezione 1: Salute & Profilo */}
      <Text style={styles.sectionLabel}>{t('health_profile_label', language) || (isIt ? 'SALUTE E PROFILO' : 'HEALTH & PROFILE')}</Text>
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

        {/* Contatto di emergenza Row */}
        <View style={[styles.item, { alignItems: 'flex-start' }]}>
          <Text style={styles.itemIcon}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Contatto di emergenza' : 'Emergency contact'}</Text>
            <Text style={styles.itemSub}>
              {isIt
                ? 'Imposta un nome e numero telefonico da contattare in caso di emergenza.'
                : 'Set a name and phone number to contact in case of emergency.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={[styles.textInput, { flex: 1, height: 44, paddingVertical: 8 }]}
                value={contactNameDraft}
                onChangeText={setContactNameDraft}
                placeholder={isIt ? 'Nome (es. Luca)' : 'Name (e.g. Luca)'}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, height: 44, paddingVertical: 8 }]}
                value={contactPhoneDraft}
                onChangeText={setContactPhoneDraft}
                placeholder={isIt ? 'Tel (es. +39...)' : 'Phone (e.g. +39...)'}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity style={styles.smallButton} onPress={saveEmergencyContact} disabled={loading}>
              <Text style={styles.smallButtonText}>{isIt ? 'Salva contatto' : 'Save contact'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Lingua / Language */}
        <TouchableOpacity style={styles.item} onPress={() => router.push('/language')}>
          <Text style={styles.itemIcon}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Lingua dell\'app' : 'App Language'}</Text>
            <Text style={styles.itemSub}>
              {getFlagEmoji(language)} {getLanguageLabel(language)} · {(language || 'it').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
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

      {/* Sezione 2: Documenti medici (nuovo flusso con AI e conferma manuale) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{isIt ? 'DOCUMENTI SANITARI' : 'MEDICAL DOCUMENTS'}</Text>
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/documenti')}>
          <Text style={styles.itemIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Documenti medici' : 'Medical documents'}</Text>
            <Text style={styles.itemSub}>
              {isIt
                ? 'Carica referti allergologici (privati e cancellabili). Con il tuo consenso, l\'AI può suggerire gli allergeni da confermare.'
                : 'Upload allergy reports (private and deletable). With your consent, AI can suggest allergens for you to confirm.'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sezione 3: Assistenza e Info */}
      <Text style={styles.sectionLabel}>{isIt ? 'INFO E SUPPORTO' : 'INFO & SUPPORT'}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/legal-docs?tab=terms')}>
          <Text style={styles.itemIcon}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Termini e condizioni' : 'Terms and conditions'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        
        <TouchableOpacity style={styles.item} onPress={() => router.push('/legal-docs?tab=privacy')}>
          <Text style={styles.itemIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Privacy e dati sulla salute' : 'Privacy and health data'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity style={styles.item} onPress={() => router.push('/legal-docs?tab=safety')}>
          <Text style={styles.itemIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Sicurezza e Limitazioni di Responsabilità' : 'Safety and Disclaimer'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity style={styles.item} onPress={() => router.push('/legal-docs?tab=cookies')}>
          <Text style={styles.itemIcon}>🍪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Informativa Cookie' : 'Cookie Policy'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity style={styles.item} onPress={() => Alert.alert(isIt ? 'Semaforo AllerTgy' : 'AllerTgy Traffic Light', isIt ? '🟢 Verde: Nessun allergene del tuo profilo dichiarato.\n\n🟡 Giallo: Possibili tracce, chiedi conferma al personale.\n\n🔴 Rosso: Contiene allergeni del tuo profilo.' : '🟢 Green: No allergen from your profile declared.\n\n🟡 Yellow: Possible traces, ask staff for confirmation.\n\n🔴 Red: Contains allergens from your profile.')}>
          <Text style={styles.itemIcon}>🚦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Come funziona il semaforo' : 'How the traffic light works'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />

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
            <Text style={styles.itemSub}>AllerTgy v0.5 · server: {API}</Text>
          </View>
        </View>
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          {isIt 
            ? 'AllerTgy confronta il tuo profilo con i dati dichiarati dal locale. Non sostituisce il parere medico: comunica sempre le tue allergie al personale.'
            : 'AllerTgy compares your profile with the data declared by the venue. It does not replace medical advice: always communicate your allergies to the staff.'}
        </Text>
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
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarBadge: {
    position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff',
    borderRadius: 999, width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  avatarBadgeText: { fontSize: 12 },
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
  disclaimerBox: {
    backgroundColor: '#EEF5F1',
    borderWidth: 1,
    borderColor: '#DDE8E2',
    borderRadius: 14,
    padding: 14,
    marginVertical: 16,
  },
  disclaimerText: {
    fontSize: 12.5,
    color: '#596B63',
    lineHeight: 18,
  },
});
