import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Image, Linking, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View, ActivityIndicator, TextInput
} from 'react-native';
import { api, API } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import type { Allergen, CustomerPlan, ReferralStats } from '../../src/types';
import { getFlagEmoji, getLanguageLabel } from '../../src/constants/languages';
import { TRANSLATED_ALLERGENS, t } from '../../src/engine/translations';
import ShareProfileModal from '../../src/components/ShareProfileModal';
import DetailSection from '../../src/components/DetailSection';
import { useTranslation } from '../../src/constants/translations';
import { colors } from '../../src/theme';
import { connectAppleHealth, disconnectAppleHealth, isAppleHealthAvailable } from '../../src/services/appleHealth';

export default function Account() {
  const { email, allergie, setAllergie, logout, setEmergencyMedicines, language, ingredientiEsclusi, setIngredientiEsclusi, emergencyContactName, emergencyContactPhone, setEmergencyContact, subProfiles } = useSession();
  const { t: tLocal } = useTranslation();
  const [all, setAll] = useState<Allergen[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [contactNameDraft, setContactNameDraft] = useState('');
  const [contactPhoneDraft, setContactPhoneDraft] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ profileId: number | null; label: string } | null>(null);
  const [customerPlans, setCustomerPlans] = useState<CustomerPlan[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

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
    api.getCustomerPlans().then(setCustomerPlans).catch(() => {});
    api.getReferralStats().then(setReferral).catch(() => {});
    loadProfileData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      api.getProfilePhoto().then((photo) => setPhotoUrl(photo?.photo_url ?? null)).catch(() => {});
    }, []),
  );

  const purchasePlus = async () => {
    setLoading(true);
    try {
      const res = await api.customerCheckout();
      if (res.checkout_url) {
        await Linking.openURL(res.checkout_url);
      }
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const managePlus = async () => {
    setLoading(true);
    try {
      const res = await api.customerPortal();
      if (res.portal_url) await Linking.openURL(res.portal_url);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

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

  const confirmDeleteAccount = () =>
    Alert.alert(
      isIt ? 'Elimina account' : 'Delete account',
      isIt
        ? 'Questa azione cancella account, profilo allergie e dati collegati. Vuoi continuare?'
        : 'This will delete your account, allergy profile and linked data. Continue?',
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: isIt ? 'Elimina' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteAccount();
              logout();
              router.replace('/welcome');
            } catch (e) {
              Alert.alert(t('error', language), (e as Error).message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );

  const isIt = language === 'it';  // kept for legacy UI strings still using it/en pattern
  const plusPlan = customerPlans.find((p) => p.code === 'customer_plus');
  const hasPlus = profile?.has_customer_plus || referral?.has_plus;
  const activePlan = hasPlus
    ? (plusPlan ?? customerPlans.find((p) => p.code === 'customer_plus'))
    : (customerPlans.find((p) => p.code === 'customer_free') ?? customerPlans[0]);
  const profileScore = [
    allergie.length > 0,
    subProfiles.length > 0,
    !!emergencyContactPhone,
    !!emergencyDraft.trim(),
    documents.length > 0,
  ].filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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

      <View style={styles.dashboardGrid}>
        <TouchableOpacity style={styles.dashboardTile} onPress={() => router.push('/allergie')}>
          <Text style={styles.dashboardValue}>{allergie.length}</Text>
          <Text style={styles.dashboardLabel}>{isIt ? 'allergie attive' : 'active allergies'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dashboardTile} onPress={() => router.push('/sub-profiles')}>
          <Text style={styles.dashboardValue}>{subProfiles.length}</Text>
          <Text style={styles.dashboardLabel}>{isIt ? 'profili famiglia' : 'family profiles'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dashboardTile} onPress={() => router.push('/documenti')}>
          <Text style={styles.dashboardValue}>{documents.length}</Text>
          <Text style={styles.dashboardLabel}>{isIt ? 'documenti sanitari' : 'medical docs'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>{isIt ? 'Configurazione profilo' : 'Profile setup'}</Text>
        <Text style={styles.setupText}>
          {profileScore}/5 {isIt
            ? 'passaggi completati: allergie, famiglia, contatto SOS, note emergenza e documenti.'
            : 'steps completed: allergies, family, SOS contact, emergency notes and documents.'}
        </Text>
      </View>

      {/* Salute e dati usati dal semaforo */}
      <DetailSection
        title={isIt ? 'SALUTE E ALLERGIE' : 'HEALTH & ALLERGIES'}
        subtitle={isIt ? 'Profilo usato dal semaforo al ristorante, in spesa e sul pass per i camerieri.' : 'Profile used by the traffic light at restaurants, grocery scanning, and waiter pass.'}
        card={false}
      />
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

        {/* Allergy Card Pass Row */}
        <TouchableOpacity style={styles.item} onPress={() => router.push('/allergy-card')}>
          <Text style={styles.itemIcon}>🪪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Pass Allergeni (Allergy Card)' : 'Allergen Pass (Allergy Card)'}</Text>
            <Text style={styles.itemSub}>
              {isIt ? 'Genera un tesserino tradotto in 5 lingue per i camerieri' : 'Generate a card translated into 5 languages for waiters'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <View style={{ padding: 14, gap: 10 }}>
          <Text style={styles.itemTitle}>{tLocal('custom_ingredients_label')}</Text>
          <Text style={styles.itemSub}>{tLocal('custom_ingredients_sub')}</Text>
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

      <DetailSection
        title={isIt ? 'DOCUMENTI SANITARI' : 'MEDICAL DOCUMENTS'}
        subtitle={isIt ? 'Referti privati con analisi AI opzionale e conferma manuale.' : 'Private reports with optional AI analysis and manual confirmation.'}
        card={false}
      />
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

      {/* Famiglia e condivisione */}
      <DetailSection
        title={isIt ? 'FAMIGLIA E CONDIVISIONE' : 'FAMILY & SHARING'}
        subtitle={isIt ? 'Profili separati e invio allergie a familiari o contatti.' : 'Separate profiles and sharing allergies with family or contacts.'}
        card={false}
      />
      <View style={styles.card}>
        {/* Family Profiles Row */}
        <TouchableOpacity style={styles.item} onPress={() => router.push('/sub-profiles')}>
          <Text style={styles.itemIcon}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Profili Famiglia (Multi-Profile)' : 'Family Profiles (Multi-Profile)'}</Text>
            <Text style={styles.itemSub}>
              {isIt ? 'Gestisci le allergie di figli e familiari' : 'Manage allergies for children and family members'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Profile Sharing Row */}
        <View style={[styles.item, { alignItems: 'flex-start' }]}>
          <Text style={styles.itemIcon}>🔗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{isIt ? 'Condividi profilo allergie' : 'Share allergy profile'}</Text>
            <Text style={styles.itemSub}>
              {isIt
                ? 'Invia le tue allergie a contatti del telefono o utenti AllerTgy (24h per feste/spesa, sempre per famiglia).'
                : 'Send your allergies to phone contacts or AllerTgy users (24h for events, permanent for family).'}
            </Text>
            <View style={styles.shareActions}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setShareTarget({ profileId: null, label: profile?.display_name || (isIt ? 'Io' : 'Me') })}
                disabled={loading}
              >
                <Text style={styles.shareButtonText}>{isIt ? 'Condividi le mie allergie' : 'Share my allergies'}</Text>
              </TouchableOpacity>
            </View>
            {subProfiles.length > 0 && (
              <View style={styles.sharedProfilesList}>
                {subProfiles.map((p) => (
                  <View key={p.id} style={styles.sharedProfileRow}>
                    <Text style={styles.sharedProfileName}>{p.name}</Text>
                    <View style={styles.sharedProfileButtons}>
                      <TouchableOpacity onPress={() => setShareTarget({ profileId: p.id, label: p.name })} disabled={loading}>
                        <Text style={styles.sharedProfileLink}>{isIt ? 'Condividi' : 'Share'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

      </View>

      {isAppleHealthAvailable() && (
        <>
          <DetailSection
            title={tLocal('apple_health_section')}
            subtitle={tLocal('apple_health_sub')}
            card={false}
          />
          <View style={styles.card}>
            <View style={[styles.item, { alignItems: 'center' }]}>
              <Text style={styles.itemIcon}>❤️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{tLocal('apple_health_title')}</Text>
                <Text style={styles.itemSub}>{tLocal('apple_health_sub')}</Text>
              </View>
              <Switch
                value={!!profile?.apple_health_connected}
                onValueChange={async (on) => {
                  const labels = mie.map((a) => a.name_it);
                  const update = async (connected: number) => {
                    await api.updateAppleHealth(
                      connected,
                      emergencyDraft.trim() || null,
                      contactNameDraft.trim() || null,
                      contactPhoneDraft.trim() || null,
                    );
                    await loadProfileData();
                  };
                  if (on) await connectAppleHealth(update, labels, emergencyDraft);
                  else await disconnectAppleHealth(update);
                }}
                trackColor={{ false: colors.border, true: colors.brand200 }}
                thumbColor={profile?.apple_health_connected ? colors.brand : colors.surface}
              />
            </View>
          </View>
        </>
      )}

      {/* Dati mostrati nel pulsante SOS */}
      <DetailSection
        title={isIt ? 'EMERGENZA SOS' : 'SOS EMERGENCY'}
        subtitle={isIt ? 'Contenuto mostrato quando tocchi SOS nell\'header dell\'app.' : 'Content shown when you tap SOS in the app header.'}
        card={false}
      />
      <View style={styles.card}>
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

      </View>

      {/* Preferenze app */}
      <DetailSection
        title={isIt ? 'PREFERENZE APP' : 'APP PREFERENCES'}
        subtitle={isIt ? 'Lingua dell\'interfaccia e del semaforo.' : 'Interface and traffic light language.'}
        card={false}
      />
      <View style={styles.card}>
        {/* Lingua / Language */}
        <TouchableOpacity style={styles.item} onPress={() => router.push('/language')}>
          <Text style={styles.itemIcon}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{tLocal('app_language_label')}</Text>
            <Text style={styles.itemSub}>
              {getFlagEmoji(language)} {getLanguageLabel(language)} · {(language || 'it').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <DetailSection
        title={isIt ? 'PIANO CLIENTE' : 'CUSTOMER PLAN'}
        subtitle={isIt ? 'Funzioni gratuite, Plus Famiglia e inviti ristoratori.' : 'Free features, Family Plus, and restaurant invites.'}
        card={false}
      />
      {referral?.invite_code && (
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>{isIt ? 'Invita un ristoratore' : 'Invite a restaurant'}</Text>
          <Text style={styles.referralSub}>
            {isIt
              ? 'Condividi il tuo codice con un commerciante: quando registra il locale, sblocchi Plus Famiglia gratis e gli regali 1 mese di Pro.'
              : 'Share your code with a merchant: when they register their venue, you unlock Family Plus for free and they get 1 month of Pro.'}
          </Text>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>{isIt ? 'Il tuo codice' : 'Your code'}</Text>
            <Text style={styles.inviteCodeValue}>{referral.invite_code}</Text>
          </View>
          <Text style={styles.referralCount}>
            {isIt
              ? `${referral.referrals_count} ristorator${referral.referrals_count === 1 ? 'e portato' : 'i portati'}`
              : `${referral.referrals_count} merchant${referral.referrals_count === 1 ? '' : 's'} referred`}
          </Text>
          <TouchableOpacity
            style={styles.shareInviteBtn}
            onPress={() => {
              const msg = isIt
                ? `Registra il tuo locale su AllerTgy con il mio codice invito ${referral.invite_code}: tu ricevi 1 mese di Pro omaggio e io sblocco Plus Famiglia. I clienti con allergie scoprono subito cosa possono mangiare.`
                : `Register your venue on AllerTgy with my invite code ${referral.invite_code}: you get 1 free month of Pro and I unlock Family Plus. Customers with allergies instantly see what they can eat.`;
              Share.share({ message: msg });
            }}
          >
            <Text style={styles.shareInviteBtnText}>{isIt ? 'Condividi codice invito' : 'Share invite code'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.planOverview}>
        <View style={styles.planHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planName}>
              {hasPlus ? (plusPlan?.name ?? (isIt ? 'Plus Famiglia' : 'Family Plus')) : (activePlan?.name ?? (isIt ? 'Cliente Gratis' : 'Free Customer'))}
            </Text>
            <Text style={styles.planSub}>
              {hasPlus
                ? (isIt ? 'Attivo in omaggio grazie ai tuoi inviti.' : 'Active for free thanks to your referrals.')
                : (activePlan?.tagline ?? (isIt ? 'Semaforo, QR ristorante e profilo personale sempre gratuiti.' : 'Traffic light, restaurant QR and personal profile remain free.'))}
            </Text>
          </View>
          <Text style={styles.planPrice}>
            {hasPlus && profile?.customer_subscription_status === 'comped'
              ? (isIt ? 'Omaggio' : 'Free gift')
              : activePlan?.price_cents
                ? `€${(activePlan.price_cents / 100).toFixed(2).replace('.', ',')}`
                : (isIt ? 'Gratis' : 'Free')}
          </Text>
        </View>
        <View style={styles.planFeatures}>
          {((hasPlus ? plusPlan?.features : activePlan?.features) ?? [
            'Scansione QR ristorante e semaforo personalizzato',
            '1 profilo allergie personale',
            'Recensioni allergy-focused',
          ]).map((feature) => (
            <Text key={feature} style={styles.planFeature}>✓ {feature}</Text>
          ))}
        </View>
        {!hasPlus && plusPlan && (
          <>
            <TouchableOpacity style={styles.upgradeBox} onPress={purchasePlus}>
              <Text style={styles.upgradeTitle}>
                {isIt ? `Attiva ${plusPlan.name} — €${(plusPlan.price_cents / 100).toFixed(2)}/mese` : `Get ${plusPlan.name} — €${(plusPlan.price_cents / 100).toFixed(2)}/mo`}
              </Text>
              <Text style={styles.upgradeText}>{plusPlan.tagline}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.upgradeBox, { marginTop: 8, backgroundColor: '#f0fdf4' }]}
              onPress={() => Alert.alert(
                plusPlan.name,
                `${referral?.reward_message ?? plusPlan.tagline}\n\n${plusPlan.features.join('\n')}`,
              )}
            >
              <Text style={styles.upgradeTitle}>{isIt ? 'Oppure sblocca gratis con un invito' : 'Or unlock free with an invite'}</Text>
              <Text style={styles.upgradeText}>
                {isIt
                  ? 'Porta un ristoratore con il tuo codice: Plus Famiglia per te e 1 mese di Pro omaggio per lui.'
                  : 'Bring a merchant with your invite code: Family Plus for you and 1 free month of Pro for them.'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {hasPlus && profile?.customer_subscription_status === 'active' && (
          <TouchableOpacity style={styles.upgradeBox} onPress={managePlus}>
            <Text style={styles.upgradeTitle}>{isIt ? 'Gestisci abbonamento Plus' : 'Manage Plus subscription'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sezione 3: Assistenza e Info */}
      <DetailSection
        title={isIt ? 'INFO E SUPPORTO' : 'INFO & SUPPORT'}
        subtitle={isIt ? 'Documenti legali, assistenza e informazioni sull\'app.' : 'Legal documents, support, and app information.'}
        card={false}
      />
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

        <TouchableOpacity style={styles.item} onPress={confirmDeleteAccount} disabled={loading}>
          <Text style={styles.itemIcon}>🗑️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: '#b91c1c' }]}>{isIt ? 'Elimina account e dati' : 'Delete account and data'}</Text>
            <Text style={styles.itemSub}>{isIt ? 'Richiesta GDPR: cancella profilo, allergie e dati collegati.' : 'GDPR request: delete profile, allergies and linked data.'}</Text>
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

    {shareTarget && (
      <ShareProfileModal
        visible={!!shareTarget}
        onClose={() => setShareTarget(null)}
        profileId={shareTarget.profileId}
        profileLabel={shareTarget.label}
        isIt={isIt}
      />
    )}
    </View>
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
  dashboardGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dashboardTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center',
  },
  dashboardValue: { color: '#047857', fontWeight: '900', fontSize: 22 },
  dashboardLabel: { color: '#64748b', fontSize: 10.5, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  setupCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  setupTitle: { color: '#065f46', fontWeight: '900', fontSize: 13 },
  setupText: { color: '#047857', fontWeight: '600', fontSize: 12, lineHeight: 17, marginTop: 2 },
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
  planOverview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 12,
  },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planName: { color: '#1e293b', fontWeight: '900', fontSize: 16 },
  planSub: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 2 },
  planPrice: { color: '#047857', fontWeight: '900', fontSize: 15 },
  planFeatures: { gap: 6 },
  planFeature: { color: '#334155', fontSize: 12.5, fontWeight: '600', lineHeight: 17 },
  upgradeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
  },
  upgradeTitle: { color: '#0f172a', fontWeight: '900', fontSize: 13 },
  upgradeText: { color: '#64748b', fontWeight: '600', fontSize: 12, lineHeight: 17, marginTop: 2 },
  referralCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  referralTitle: { color: '#065f46', fontWeight: '900', fontSize: 15 },
  referralSub: { color: '#047857', fontSize: 12, lineHeight: 17 },
  inviteCodeBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  inviteCodeLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  inviteCodeValue: { color: '#065f46', fontWeight: '900', fontSize: 24, letterSpacing: 2, marginTop: 4 },
  referralCount: { color: '#047857', fontSize: 12, fontWeight: '700' },
  shareInviteBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  shareInviteBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  shareActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  shareButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shareButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  shareButtonGhost: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shareButtonGhostText: { color: '#047857', fontWeight: '800', fontSize: 12 },
  sharedProfilesList: { marginTop: 10, gap: 6 },
  sharedProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sharedProfileName: { color: '#1e293b', fontWeight: '700', fontSize: 12 },
  sharedProfileButtons: { flexDirection: 'row', gap: 12 },
  sharedProfileLink: { color: '#047857', fontWeight: '900', fontSize: 12 },
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
