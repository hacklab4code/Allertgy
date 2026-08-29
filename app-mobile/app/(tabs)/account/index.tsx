import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Clipboard, Image, Linking, Pressable, Share, StatusBar, StyleSheet, View, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/api/client';
import { logoutAndCleanup, syncUserAllergensFromServer } from '../../../src/services/authSession';
import { useSession } from '../../../src/store/session';
import type { Allergen, ReferralStats } from '../../../src/types';
import { getFlagEmoji, getLanguageLabel } from '../../../src/constants/languages';
import { t } from '../../../src/engine/translations';
import ShareProfileModal from '../../../src/components/ShareProfileModal';
import { useTranslation } from '../../../src/constants/translations';
import { colors, spacing, radius } from '../../../src/theme';
import {
  AppText,
  ErrorStateCard,
  GlassScreenScroll,
  Screen,
  Section,
  SettingsRow,
  SettingsDivider,
} from '../../../src/components/ui';
import { useProfileSheet } from '../../../src/store/profileSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_PADDING_H } from '../../../src/layoutConstants';
import { useSectionTitle } from '../../../src/hooks/useSectionTitle';
import Constants from 'expo-constants';
import { loadTrustProfile, type TrustProfile } from '../../../src/services/communityTrust';

const ORANGE = colors.amber;
const ORANGE_SOFT = colors.amberBg;
const ICON_WHITE = '#FFFFFF';

function SectionCountBadge({ count }: { count: number }) {
  return (
    <View style={styles.sectionCountBadge}>
      <AppText style={styles.sectionCountBadgeText}>{count}</AppText>
    </View>
  );
}

export default function Account() {
  const insets = useSafeAreaInsets();
  const {
    email, allergie, setEmergencyMedicines, language,
    emergencyContactName,
    setEmergencyContact, subProfiles, setSubProfiles,
    setProfilePhotoUrl,
  } = useSession();
  const { t: tLocal } = useTranslation();
  const [all, setAll] = useState<Allergen[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ profileId: number | null; label: string } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [trustProfile, setTrustProfile] = useState<TrustProfile | null>(null);

  const openProfileSheet = useProfileSheet((s) => s.open);

  const mie = all.filter((a) => allergie.includes(a.code));
  const isIt = language === 'it';
  useSectionTitle(isIt ? 'Profilo' : 'Profile');
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const loadProfileData = async () => {
    setProfileError(false);
    try {
      const p = await api.getProfile();
      setProfile(p);
      setEmergencyMedicines(p.emergency_medicines);
      setEmergencyDraft(p.emergency_medicines ?? '');
      setEmergencyContact(p.emergency_contact_name ?? null, p.emergency_contact_phone ?? null);
      const docs = await api.getDocuments();
      setDocuments(docs);
      const photo = await api.getProfilePhoto().catch(() => null);
      const url = photo?.photo_url ?? null;
      setPhotoUrl(url);
      setProfilePhotoUrl(url);
    } catch (e) {
      console.log('Errore caricamento profilo mobile:', e);
      setProfileError(true);
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
      setProfilePhotoUrl(res.photo_url);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.allergens().then(setAll).catch(() => { });
    api.getReferralStats().then(setReferral).catch(() => { });
    loadProfileData();
    syncUserAllergensFromServer().catch(() => { });
    api.getSubProfiles().then(setSubProfiles).catch(() => { });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
      void loadTrustProfile(isIt).then(setTrustProfile);
      syncUserAllergensFromServer().catch(() => { });
      api.getDocuments().then(setDocuments).catch(() => { });
      api.getProfilePhoto().then((photo) => {
        const url = photo?.photo_url ?? null;
        setPhotoUrl(url);
        setProfilePhotoUrl(url);
      }).catch(() => { });
      api.getSubProfiles().then(setSubProfiles).catch(() => { });
    }, [setSubProfiles, setProfilePhotoUrl]),
  );

  const confirmLogout = () =>
    Alert.alert(
      t('logout_title', language),
      t('logout_confirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('logout_btn', language), style: 'destructive',
          onPress: async () => { await logoutAndCleanup(); router.replace('/welcome'); },
        },
      ],
    );

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
              await logoutAndCleanup();
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

  const shareInviteCode = async () => {
    if (!referral?.invite_code) return;
    const msg = isIt
      ? `Registra il tuo locale su AllerTgy con il mio codice invito ${referral.invite_code}: tu ricevi 1 mese di Pro omaggio e io sblocco Plus Famiglia.`
      : `Register your venue on AllerTgy with my invite code ${referral.invite_code}: you get 1 free month of Pro and I unlock Family Plus.`;
    Share.share({ message: msg });
  };

  const copyInviteCode = async () => {
    if (!referral?.invite_code) return;
    Clipboard.setString(referral.invite_code);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      isIt ? 'Codice copiato!' : 'Code copied!',
      isIt
        ? `Il codice ${referral.invite_code} è stato copiato negli appunti.`
        : `Code ${referral.invite_code} copied to clipboard.`,
    );
  };

  const exportAllergySummary = async () => {
    const labels = mie.map((a) => (isIt ? a.name_it : (a.name_en || a.name_it)));
    const lines = [
      'AllerTgy — Profilo allergie',
      '',
      labels.length
        ? `${isIt ? 'Allergie' : 'Allergies'}: ${labels.join(', ')}`
        : (isIt ? 'Allergie: nessuna registrata' : 'Allergies: none registered'),
      emergencyDraft.trim()
        ? `${isIt ? 'Farmaci emergenza' : 'Emergency medicines'}: ${emergencyDraft.trim()}`
        : '',
      '',
      isIt
        ? 'Generato da AllerTgy. Puoi incollarlo in Note mediche.'
        : 'Generated by AllerTgy. You can paste it into Medical Notes.',
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') });
  };

  const displayName = profile?.display_name || email || (isIt ? 'Utente' : 'User');
  const familyMenuSubtitle = subProfiles.length > 0
    ? `${subProfiles.length} ${isIt ? 'profili attivi' : 'active profiles'}`
    : (isIt ? 'Solo profilo personale' : 'Personal profile only');
  const docsMenuSubtitle = documents.length > 0
    ? `${documents.length} ${isIt ? 'documenti caricati' : 'documents uploaded'}`
    : (isIt ? 'Nessun documento' : 'No documents');
  const sosConfigured = !!(emergencyContactName || emergencyDraft.trim());
  const sosMenuSubtitle = sosConfigured
    ? (isIt ? 'SOS configurato' : 'SOS configured')
    : (isIt ? 'Da impostare' : 'Not set up');
  const langCode = (language || 'it').toUpperCase().slice(0, 2);

  return (
    <Screen edges={false} ambient>
      <StatusBar barStyle="dark-content" />
      <GlassScreenScroll
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        headerFloat
        contentContainerStyle={[styles.scroll, { paddingTop: 0, paddingHorizontal: 0, gap: 0 }]}
      >
        <View style={[styles.identityBand, { paddingTop: insets.top + 54 }]}>
          <View style={styles.identityInner}>
            <Pressable
              onPress={changePhoto}
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Cambia foto profilo' : 'Change profile photo'}
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <AppText style={styles.avatarLetter}>
                    {(email ?? 'A')[0].toUpperCase()}
                  </AppText>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={12} color={colors.brand} />
              </View>
            </Pressable>

            <Pressable
              onPress={openProfileSheet}
              style={({ pressed }) => [styles.nameHit, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Cambia profilo attivo' : 'Switch active profile'}
            >
              <View style={styles.nameRow}>
                <AppText style={styles.identityName} numberOfLines={1}>{displayName}</AppText>
                <Ionicons name="chevron-down" size={18} color={colors.onSurfaceMuted} />
              </View>
            </Pressable>

            {trustProfile && (
              <View style={[styles.trustBadgePill, { backgroundColor: `${trustProfile.badgeColor}15`, borderColor: `${trustProfile.badgeColor}40` }]}>
                <AppText style={{ fontSize: 11 }}>{trustProfile.badgeEmoji}</AppText>
                <AppText style={[styles.trustBadgeText, { color: trustProfile.badgeColor }]}>
                  {trustProfile.title} ({trustProfile.points} pt)
                </AppText>
              </View>
            )}

            {referral?.invite_code ? (
              <View style={styles.headerInvite}>
                <View style={styles.inviteActionRow}>
                  <Pressable
                    onPress={copyInviteCode}
                    style={({ pressed }) => [styles.inviteCodeBadge, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={isIt ? 'Copia codice' : 'Copy code'}
                  >
                    <AppText style={styles.inviteCodeText}>
                      {referral.invite_code.split('').join(' ')}
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={shareInviteCode}
                    style={({ pressed }) => [styles.inviteIconBtn, pressed && styles.pressed]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={isIt ? 'Condividi codice' : 'Share code'}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.brand} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {profileError && (
            <ErrorStateCard
              message={isIt ? 'Impossibile caricare il profilo. Controlla la connessione.' : 'Could not load profile. Check your connection.'}
              retryLabel={isIt ? 'Riprova' : 'Retry'}
              onRetry={loadProfileData}
            />
          )}

          {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: 8 }} />}

          <Section title={isIt ? 'Profilo e Salute' : 'Profile & Health'}>
            <SettingsRow
              icon="shield-checkmark"
              iconBg={colors.green}
              iconColor={ICON_WHITE}
              title={isIt ? 'Allergie e ingredienti' : 'Allergies & ingredients'}
              subtitle={mie.length > 0 ? `${mie.length} ${isIt ? 'allergie attive' : 'active allergies'}` : (isIt ? 'Nessuna allergia' : 'No allergies')}
              onPress={() => router.push('/allergie')}
              right={mie.length > 0 ? <SectionCountBadge count={mie.length} /> : undefined}
            />
            <SettingsDivider />
            <SettingsRow
              icon="card"
              iconBg="#4A5568"
              iconColor={ICON_WHITE}
              title={isIt ? 'Pass allergeni' : 'Allergen pass'}
              subtitle={isIt ? 'Mostra le allergie al personale' : 'Show your allergies to staff'}
              onPress={() => router.push('/allergy-card')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="people"
              iconBg={colors.brand}
              iconColor={ICON_WHITE}
              title={isIt ? 'Sottoprofili Famiglia' : 'Family Sub-Profiles'}
              subtitle={familyMenuSubtitle}
              onPress={() => router.push('/sub-profiles')}
              right={<SectionCountBadge count={subProfiles.length} />}
            />
            <SettingsDivider />
            <SettingsRow
              icon="warning"
              iconBg={colors.red}
              iconColor={ICON_WHITE}
              title={isIt ? 'SOS e contatti' : 'SOS & contacts'}
              subtitle={sosMenuSubtitle}
              onPress={() => router.push('/emergency')}
              right={
                !sosConfigured ? (
                  <View style={styles.warnBadge}>
                    <AppText style={styles.warnBadgeText}>!</AppText>
                  </View>
                ) : undefined
              }
            />
            <SettingsDivider />
            <SettingsRow
              icon="document-text"
              iconBg={ORANGE}
              iconColor={ICON_WHITE}
              title={isIt ? 'Documenti sanitari' : 'Medical documents'}
              subtitle={docsMenuSubtitle}
              onPress={() => router.push('/documenti')}
            />
          </Section>

          <Section title={isIt ? 'Strumenti Clinici & Casa' : 'Clinical & Home Tools'}>
            <SettingsRow
              icon="print"
              iconBg="#2563EB"
              iconColor={ICON_WHITE}
              title={isIt ? 'Fascicolo Medico & Modulo Scuola' : 'Medical & School Report'}
              subtitle={isIt ? 'Esporta PDF per mensa o allergologo' : 'Export PDF for school or doctor'}
              onPress={() => router.push('/medical-dossier')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="book"
              iconBg="#6366F1"
              iconColor={ICON_WHITE}
              title={isIt ? 'Diario delle Reazioni' : 'Reaction Tracker'}
              subtitle={isIt ? 'Traccia sintomi e farmaci assunti' : 'Log symptoms and emergency meds'}
              onPress={() => router.push('/diario-reazioni')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="cube"
              iconBg="#0EA5E9"
              iconColor={ICON_WHITE}
              title={isIt ? 'Dispensa & Scadenze Farmaci' : 'Safe Pantry & Meds'}
              subtitle={isIt ? 'Cibi approvati e promemoria EpiPen' : 'Approved foods & EpiPen expiry'}
              onPress={() => router.push('/dispensa')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="cart"
              iconBg="#10B981"
              iconColor={ICON_WHITE}
              title={isIt ? 'Lista della Spesa Sicura' : 'Safe Grocery List'}
              subtitle={isIt ? 'Con verifica preventiva allergeni' : 'With real-time allergen check'}
              onPress={() => router.push('/lista-spesa')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="shield-checkmark"
              iconBg="#EF4444"
              iconColor={ICON_WHITE}
              title={isIt ? 'Richiami Ministero Salute' : 'Food Recalls Feed'}
              subtitle={isIt ? 'Avvisi lotti contaminati' : 'Contaminated lots alerts'}
              onPress={() => router.push('/recalls')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="phone-portrait"
              iconBg="#DC2626"
              iconColor={ICON_WHITE}
              title={isIt ? 'Sfondo Blocco Schermo ICE' : 'Lock Screen ICE Wallpaper'}
              subtitle={isIt ? 'Visibile ai soccorritori a telefono bloccato' : 'Visible on lockscreen for medics'}
              onPress={() => router.push('/lockscreen-ice')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="flower"
              iconBg="#059669"
              iconColor={ICON_WHITE}
              title={isIt ? 'Allergie Crociate & Pollini' : 'Pollen-Food Cross Allergies'}
              subtitle={isIt ? 'Sindrome Orale Allergica (OAS) & LTP' : 'OAS and crossed foods'}
              onPress={() => router.push('/allergie-crociate')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="airplane"
              iconBg="#8B5CF6"
              iconColor={ICON_WHITE}
              title={isIt ? 'Frasario Viaggi Offline' : 'Traveler Safe Hub'}
              subtitle={isIt ? '10 lingue per ristoranti ed emergenze' : '10 languages for travel'}
              onPress={() => router.push('/travel-hub')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="restaurant"
              iconBg="#1E1B4B"
              iconColor={ICON_WHITE}
              title={isIt ? 'Area Ristoratori & Cucina B2B' : 'Restaurateur & Kitchen Hub'}
              subtitle={isIt ? 'AI Auto-Tagger e Libro Allergeni ASL' : 'AI Tagger & ASL Allergen Book'}
              onPress={() => router.push('/kitchen-safety-sheet')}
            />
          </Section>

          <Section title={isIt ? 'Impostazioni & Supporto' : 'Settings & Support'}>
            <SettingsRow
              icon="language"
              iconBg="#3B82F6"
              iconColor={ICON_WHITE}
              title={tLocal('app_language_label')}
              subtitle={`${getFlagEmoji(language)} ${getLanguageLabel(language)}`}
              onPress={() => router.push('/language')}
              right={<AppText style={styles.trailingCode}>{langCode}</AppText>}
            />
            <SettingsDivider />
            <SettingsRow
              icon="notifications"
              iconBg="#4A5568"
              iconColor={ICON_WHITE}
              title={isIt ? 'Notifiche' : 'Notifications'}
              subtitle={isIt ? 'Avvisi, richieste e aggiornamenti' : 'Alerts, requests and updates'}
              onPress={() => router.push('/notifiche')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="document-text"
              iconBg="#EC4899"
              iconColor={ICON_WHITE}
              title={isIt ? 'Esporta riepilogo allergie' : 'Export allergy summary'}
              subtitle={isIt ? 'Condividi con medico o contatto fidato' : 'Share with a doctor or trusted contact'}
              onPress={exportAllergySummary}
            />
            <SettingsDivider />
            <SettingsRow
              icon="share-social"
              iconBg="#64748B"
              iconColor={ICON_WHITE}
              title={isIt ? 'Condividi profilo allergie' : 'Share allergy profile'}
              subtitle={isIt ? 'Invia il profilo a contatti o utenti' : 'Send profile to contacts or users'}
              onPress={() => setShareTarget({ profileId: null, label: displayName })}
            />
            <SettingsDivider />
            <SettingsRow
              icon="information-circle"
              iconBg={colors.brand}
              iconColor={ICON_WHITE}
              title={isIt ? 'Info e supporto' : 'Info & support'}
              subtitle={isIt ? 'Termini, privacy, sicurezza e assistenza' : 'Terms, privacy, safety & support'}
              onPress={() => setInfoModalVisible(true)}
            />
          </Section>

          <Section title={isIt ? 'Account' : 'Account'}>
            <SettingsRow
              icon="person"
              iconBg="#4A5568"
              iconColor={ICON_WHITE}
              title={isIt ? 'Dati account' : 'Account details'}
              subtitle={isIt ? 'Nome, email e cambio password' : 'Name, email and change password'}
              onPress={() => router.push('/account-settings')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="card"
              iconBg={colors.brand}
              iconColor={ICON_WHITE}
              title={isIt ? 'Piano e abbonamento' : 'Plan & subscription'}
              subtitle={
                profile?.has_customer_plus
                  ? (isIt ? 'Plus Famiglia attivo' : 'Family Plus active')
                  : (isIt ? 'Piano gratuito · passa a Plus Famiglia' : 'Free plan · upgrade to Family Plus')
              }
              onPress={() => router.push('/subscription')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="log-out-outline"
              iconBg={ORANGE_SOFT}
              iconColor={ORANGE}
              title={isIt ? "Esci dall'account" : 'Log out'}
              subtitle={isIt ? 'Disconnetti questo dispositivo' : 'Sign out on this device'}
              titleColor={ORANGE}
              onPress={confirmLogout}
            />
            <SettingsDivider />
            <SettingsRow
              icon="trash"
              iconBg={colors.redSoft}
              iconColor={colors.onRed}
              title={isIt ? 'Elimina account e dati' : 'Delete account and data'}
              subtitle={isIt ? 'Rimuovi permanentemente il tuo profilo' : 'Permanently remove your profile'}
              danger
              onPress={confirmDeleteAccount}
            />
          </Section>

          <AppText style={styles.footerBrand}>
            ★ AllerTgy · v{appVersion} ★
          </AppText>
        </View>
      </GlassScreenScroll>

      <Modal visible={infoModalVisible} animationType="slide" onRequestClose={() => setInfoModalVisible(false)}>
        <Screen edges={false} ambient>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>
              {isIt ? 'Info e supporto' : 'Info & support'}
            </AppText>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Chiudi' : 'Close'}
            >
              <Ionicons name="close" size={24} color={colors.brandInk} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Section title={isIt ? 'Note legali e sicurezza' : 'Legal & safety'} card>
              <SettingsRow
                icon="document"
                title={isIt ? 'Termini e condizioni' : 'Terms and conditions'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=terms'); }}
              />
              <SettingsDivider />
              <SettingsRow
                icon="shield"
                title={isIt ? 'Privacy e dati sulla salute' : 'Privacy and health data'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=privacy'); }}
              />
              <SettingsDivider />
              <SettingsRow
                icon="warning"
                title={isIt ? 'Sicurezza e responsabilità' : 'Safety and disclaimer'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=safety'); }}
              />
            </Section>

            <Section title={isIt ? 'Assistenza clienti' : 'Customer support'} card>
              <SettingsRow
                icon="mail"
                title={isIt ? "Contatta l'assistenza" : 'Contact support'}
                subtitle="supporto@allertgy.it"
                onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20AllerTgy')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="information-circle"
                title={isIt ? 'Informazioni app' : 'App info'}
                subtitle={`AllerTgy · v${appVersion}`}
              />
            </Section>

            <View style={styles.disclaimer}>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.disclaimerText}>
                {isIt
                  ? 'AllerTgy confronta il tuo profilo con i dati dichiarati dal locale. Non sostituisce il parere medico: comunica sempre le tue allergie al personale.'
                  : 'AllerTgy compares your profile with venue data. It does not replace medical advice: always tell staff about your allergies.'}
              </AppText>
            </View>
          </ScrollView>
        </Screen>
      </Modal>

      {shareTarget ? (
        <ShareProfileModal
          visible={!!shareTarget}
          onClose={() => setShareTarget(null)}
          profileId={shareTarget.profileId}
          profileLabel={shareTarget.label}
          isIt={isIt}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: 'stretch',
  },
  identityBand: {
    width: '100%',
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  identityInner: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    gap: 6,
  },
  pressed: { opacity: 0.86 },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameHit: {
    alignSelf: 'center',
    maxWidth: '100%',
    paddingHorizontal: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  identityName: {
    color: colors.onSurface,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  headerInvite: {
    marginTop: 12,
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  body: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 12,
    paddingBottom: 130,
    gap: 18,
  },
  inviteActionRow: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCodeBadge: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteCodeText: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inviteIconBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingCode: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  warnBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6B100',
    borderWidth: 1,
    borderColor: '#F7CF63',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  warnBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  sectionCountBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(66, 61, 102, 0.20)',
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  sectionCountBadgeText: {
    color: colors.brandInk,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  footerBrand: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  disclaimer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  disclaimerText: {
    lineHeight: 17,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.brandInk,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  trustBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  trustBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
