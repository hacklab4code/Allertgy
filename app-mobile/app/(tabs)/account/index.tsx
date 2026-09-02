import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api, resolveApiMediaUrl } from '../../../src/api/client';
import { logoutAndCleanup, syncUserAllergensFromServer } from '../../../src/services/authSession';
import { useSession } from '../../../src/store/session';
import type { Allergen, ReferralStats } from '../../../src/types';
import { getFlagEmoji, getLanguageLabel } from '../../../src/constants/languages';
import { t } from '../../../src/engine/translations';
import ShareProfileModal from '../../../src/components/ShareProfileModal';
import { useAppearance, type ThemeMode } from '../../../src/store/appearance';
import { useIsDarkMode } from '../../../src/hooks/useAppTheme';
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

const ORANGE = colors.amber;

function SectionCountBadge({ count }: { count: number }) {
  const isDark = useIsDarkMode();
  return (
    <View
      style={[
        styles.sectionCountBadge,
        isDark && {
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderColor: 'rgba(255, 255, 255, 0.35)',
        },
      ]}
    >
      <AppText
        style={[
          styles.sectionCountBadgeText,
          isDark && { color: '#FFFFFF' },
        ]}
      >
        {count}
      </AppText>
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

  const openProfileSheet = useProfileSheet((s) => s.open);

  const mie = all.filter((a) => allergie.includes(a.code));
  const isIt = language === 'it';
  useSectionTitle(isIt ? 'Profilo' : 'Profile');
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const isDark = useIsDarkMode();
  const themeMode = useAppearance((s) => s.themeMode);
  const setThemeMode = useAppearance((s) => s.setThemeMode);

  const cycleTheme = () => {
    Haptics.selectionAsync().catch(() => {});
    if (themeMode === 'system') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('dark');
    else setThemeMode('system');
  };

  const themeLabel =
    themeMode === 'dark'
      ? (isIt ? 'Cosmic (Notte)' : 'Cosmic (Night)')
      : themeMode === 'light'
        ? (isIt ? 'Vanilla (Giorno)' : 'Vanilla (Day)')
        : (isIt ? 'Automatico (Sistema)' : 'Automatic (System)');

  const themeIcon: keyof typeof Ionicons.glyphMap =
    themeMode === 'dark'
      ? 'moon-outline'
      : themeMode === 'light'
        ? 'sunny-outline'
        : 'contrast-outline';

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
      const url = resolveApiMediaUrl(photo?.photo_url) ?? null;
      setPhotoUrl(url);
      setProfilePhotoUrl(url);
    } catch (e) {
      console.log('Errore caricamento profilo mobile:', e);
      setProfileError(true);
    }
  };

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        isIt ? 'Permesso negato' : 'Permission denied',
        isIt
          ? 'Abilita l\'accesso alla libreria foto nelle impostazioni del dispositivo per cambiare la foto profilo.'
          : 'Enable photo library access in device settings to change your profile photo.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setLoading(true);
    try {
      const res = await api.uploadProfilePhoto(asset.uri, asset.mimeType ?? undefined);
      const url = resolveApiMediaUrl(res.photo_url) ?? res.photo_url;
      setPhotoUrl(url);
      setProfilePhotoUrl(url);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        isIt ? 'Foto profilo aggiornata' : 'Profile photo updated',
        isIt ? 'La tua nuova foto profilo è stata impostata con successo.' : 'Your new profile photo has been updated successfully.',
      );
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
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
      syncUserAllergensFromServer().catch(() => { });
      api.getDocuments().then(setDocuments).catch(() => { });
      api.getProfilePhoto().then((photo) => {
        const url = resolveApiMediaUrl(photo?.photo_url) ?? null;
        setPhotoUrl(url);
        setProfilePhotoUrl(url);
      }).catch(() => { });
      api.getSubProfiles().then(setSubProfiles).catch(() => { });
    }, [setSubProfiles, setProfilePhotoUrl, isIt]),
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

  const formatDateJoined = (dateStr?: string | null) => {
    if (!dateStr) return isIt ? 'Membro AllerTgy' : 'AllerTgy Member';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return isIt ? 'Membro AllerTgy' : 'AllerTgy Member';
      const monthNamesIt = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate();
      const month = isIt ? monthNamesIt[d.getMonth()] : monthNamesEn[d.getMonth()];
      const year = d.getFullYear();
      return isIt ? `Iscritto il ${day} ${month} ${year}` : `Joined ${month} ${day}, ${year}`;
    } catch {
      return isIt ? 'Membro AllerTgy' : 'AllerTgy Member';
    }
  };

  const displayName = profile?.display_name || email || (isIt ? 'Utente' : 'User');
  const memberSinceText = formatDateJoined(profile?.terms_accepted_at || profile?.onboarding_completed_at);
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <GlassScreenScroll
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        headerFloat
        contentContainerStyle={[styles.scroll, { paddingTop: 0, paddingHorizontal: 0, gap: 0 }]}
      >
        {/* Header Identità con Avatar circolare, Nome e Matita modifica a destra */}
        <View style={[styles.headerCard, { paddingTop: insets.top + 76 }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={changePhoto}
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Cambia foto profilo' : 'Change profile photo'}
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, isDark && styles.avatarDark]}>
                  <AppText style={[styles.avatarLetter, isDark && { color: '#F1FEC8' }]}>
                    {(displayName ?? email ?? 'A')[0].toUpperCase()}
                  </AppText>
                </View>
              )}
              <View style={[styles.avatarBadge, isDark && { backgroundColor: '#F1FEC8' }]}>
                <Ionicons name="camera-outline" size={11} color={isDark ? '#23212C' : colors.brand} />
              </View>
            </Pressable>

            <Pressable
              onPress={openProfileSheet}
              style={({ pressed }) => [styles.nameContainer, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Cambia profilo attivo' : 'Switch active profile'}
            >
              <View style={styles.nameRow}>
                <AppText style={[styles.identityName, isDark && { color: '#FFFFFF' }]} numberOfLines={1}>
                  {displayName}
                </AppText>
                <Ionicons name="chevron-down" size={16} color={isDark ? '#F1FEC8' : colors.onSurfaceMuted} />
              </View>
              <AppText style={[styles.identitySubtitle, isDark && { color: '#94A3B8' }]} numberOfLines={1}>
                {memberSinceText}
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => router.push('/account-settings')}
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Modifica profilo' : 'Edit profile'}
            >
              <Ionicons name="pencil-outline" size={22} color={isDark ? '#FFFFFF' : '#1E293B'} />
            </Pressable>
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

          {/* 1. SEZIONE ACCOUNT */}
          <Section title={isIt ? 'Account' : 'Account'} card>
            <SettingsRow
              icon="person-outline"
              title={isIt ? 'Dati personali' : 'Personal details'}
              subtitle={isIt ? 'Nome, email e cambio password' : 'Name, email and password'}
              onPress={() => router.push('/account-settings')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="information-circle-outline"
              title={isIt ? 'Informazioni e consensi' : 'Information & permissions'}
              subtitle={isIt ? 'Termini, privacy, sicurezza e note legali' : 'Terms, privacy, safety & legal notes'}
              onPress={() => setInfoModalVisible(true)}
            />
            <SettingsDivider />
            <SettingsRow
              icon="star-outline"
              title={isIt ? 'Abbonamenti e piani' : 'Subscriptions'}
              subtitle={
                profile?.has_customer_plus
                  ? (isIt ? 'Plus Famiglia attivo' : 'Family Plus active')
                  : (isIt ? 'Piano gratuito · passa a Plus Famiglia' : 'Free plan · upgrade to Family Plus')
              }
              onPress={() => router.push('/subscription')}
            />
          </Section>

          {/* 2. SEZIONE SALUTE & ALLERGIE */}
          <Section title={isIt ? 'Salute & Allergie' : 'Health & Allergies'} card>
            <SettingsRow
              icon="shield-checkmark-outline"
              title={isIt ? 'Allergie e ingredienti' : 'Allergies & ingredients'}
              subtitle={mie.length > 0 ? `${mie.length} ${isIt ? 'allergie attive' : 'active allergies'}` : (isIt ? 'Nessuna allergia' : 'No allergies')}
              onPress={() => router.push('/allergie')}
              right={mie.length > 0 ? <SectionCountBadge count={mie.length} /> : undefined}
            />
            <SettingsDivider />
            <SettingsRow
              icon="card-outline"
              title={isIt ? 'Pass allergeni al tavolo' : 'Allergen pass'}
              subtitle={isIt ? 'Mostra le allergie al personale di sala' : 'Show your allergies to staff'}
              onPress={() => router.push('/allergy-card')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="people-outline"
              title={isIt ? 'Sottoprofili Famiglia' : 'Family Sub-Profiles'}
              subtitle={familyMenuSubtitle}
              onPress={() => router.push('/sub-profiles')}
              right={<SectionCountBadge count={subProfiles.length} />}
            />
            <SettingsDivider />
            <SettingsRow
              icon="warning-outline"
              title={isIt ? 'SOS e contatti emergenza' : 'SOS & emergency contacts'}
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
              icon="document-text-outline"
              title={isIt ? 'Documenti sanitari & referti' : 'Medical documents'}
              subtitle={docsMenuSubtitle}
              onPress={() => router.push('/documenti')}
            />
          </Section>

          {/* 3. SEZIONE STRUMENTI CLINICI & QUOTIDIANO */}
          <Section title={isIt ? 'Strumenti Clinici & Casa' : 'Clinical & Home Tools'} card>
            <SettingsRow
              icon="print-outline"
              title={isIt ? 'Fascicolo Medico & Modulo Scuola' : 'Medical & School Report'}
              subtitle={isIt ? 'Esporta PDF per mensa o allergologo' : 'Export PDF for school or doctor'}
              onPress={() => router.push('/medical-dossier')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="book-outline"
              title={isIt ? 'Diario delle Reazioni' : 'Reaction Tracker'}
              subtitle={isIt ? 'Traccia sintomi e farmaci assunti' : 'Log symptoms and emergency meds'}
              onPress={() => router.push('/diario-reazioni')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="cube-outline"
              title={isIt ? 'Dispensa & Scadenze Farmaci' : 'Safe Pantry & Meds'}
              subtitle={isIt ? 'Cibi approvati e promemoria EpiPen' : 'Approved foods & EpiPen expiry'}
              onPress={() => router.push('/dispensa')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="cart-outline"
              title={isIt ? 'Lista della Spesa Sicura' : 'Safe Grocery List'}
              subtitle={isIt ? 'Con verifica preventiva allergeni' : 'With real-time allergen check'}
              onPress={() => router.push('/lista-spesa')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="shield-checkmark-outline"
              title={isIt ? 'Richiami Ministero Salute' : 'Food Recalls Feed'}
              subtitle={isIt ? 'Avvisi lotti contaminati' : 'Contaminated lots alerts'}
              onPress={() => router.push('/recalls')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="phone-portrait-outline"
              title={isIt ? 'Sfondo Blocco Schermo ICE' : 'Lock Screen ICE Wallpaper'}
              subtitle={isIt ? 'Visibile ai soccorritori a telefono bloccato' : 'Visible on lockscreen for medics'}
              onPress={() => router.push('/lockscreen-ice')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="flower-outline"
              title={isIt ? 'Allergie Crociate & Pollini' : 'Pollen-Food Cross Allergies'}
              subtitle={isIt ? 'Sindrome Orale Allergica (OAS) & LTP' : 'OAS and crossed foods'}
              onPress={() => router.push('/allergie-crociate')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="airplane-outline"
              title={isIt ? 'Frasario Viaggi Offline' : 'Traveler Safe Hub'}
              subtitle={isIt ? '10 lingue per ristoranti ed emergenze' : '10 languages for travel'}
              onPress={() => router.push('/travel-hub')}
            />
          </Section>

          {/* 4. SEZIONE IMPOSTAZIONI */}
          <Section title={isIt ? 'Impostazioni' : 'Settings'} card>
            <SettingsRow
              icon="lock-closed-outline"
              title={isIt ? 'Privacy account e dati sanitari' : 'Account privacy'}
              subtitle={isIt ? 'Gestione consensi e protezione salute' : 'Consent & health data management'}
              onPress={() => router.push('/legal-docs?tab=privacy')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="notifications-outline"
              title={isIt ? 'Notifiche' : 'Notifications'}
              subtitle={isIt ? 'Avvisi, richieste e aggiornamenti' : 'Alerts, requests and updates'}
              onPress={() => router.push('/notifiche')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="language-outline"
              title={tLocal('app_language_label')}
              subtitle={`${getFlagEmoji(language)} ${getLanguageLabel(language)}`}
              onPress={() => router.push('/language')}
              right={<AppText style={styles.trailingCode}>{langCode}</AppText>}
            />
            <SettingsDivider />
            <SettingsRow
              icon={themeIcon}
              title={isIt ? 'Tema e Aspetto' : 'Theme & Appearance'}
              subtitle={themeLabel}
              onPress={cycleTheme}
              right={<AppText style={styles.trailingCode}>{themeMode.toUpperCase()}</AppText>}
            />
            <SettingsDivider />
            <SettingsRow
              icon="share-social-outline"
              title={isIt ? 'Condividi profilo allergie' : 'Share allergy profile'}
              subtitle={isIt ? 'Invia il profilo a contatti o utenti' : 'Send profile to contacts or users'}
              onPress={() => setShareTarget({ profileId: null, label: displayName })}
            />
            <SettingsDivider />
            <SettingsRow
              icon="document-text-outline"
              title={isIt ? 'Esporta riepilogo allergie' : 'Export allergy summary'}
              subtitle={isIt ? 'Condividi con medico o contatto fidato' : 'Share with a doctor or trusted contact'}
              onPress={exportAllergySummary}
            />
          </Section>

          {/* 5. INVITO AMICI (SE PRESENTE CODICE) */}
          {referral?.invite_code ? (
            <View style={[styles.inviteCard, isDark && styles.inviteCardDark]}>
              <View style={styles.inviteHeader}>
                <Ionicons name="gift-outline" size={20} color={colors.brand} />
                <AppText style={[styles.inviteTitle, isDark && { color: '#FFFFFF' }]}>
                  {isIt ? 'Invita un amico o locale' : 'Invite a friend or venue'}
                </AppText>
              </View>
              <View style={styles.inviteActionRow}>
                <Pressable
                  onPress={copyInviteCode}
                  style={({ pressed }) => [
                    styles.inviteCodeBadge,
                    isDark && styles.inviteCodeBadgeDark,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isIt ? 'Copia codice' : 'Copy code'}
                >
                  <AppText style={[styles.inviteCodeText, isDark && { color: '#FFFFFF' }]}>
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
                  <Ionicons name="share-outline" size={20} color={isDark ? '#F1FEC8' : colors.brand} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* 6. SESSIONE & AZIONI CRITICHE */}
          <Section title={isIt ? 'Sessione' : 'Session'} card>
            <SettingsRow
              icon="log-out-outline"
              iconColor={ORANGE}
              title={isIt ? "Esci dall'account" : 'Log out'}
              subtitle={isIt ? 'Disconnetti questo dispositivo' : 'Sign out on this device'}
              titleColor={ORANGE}
              onPress={confirmLogout}
            />
            <SettingsDivider />
            <SettingsRow
              icon="trash-outline"
              title={isIt ? 'Elimina account e dati' : 'Delete account and data'}
              subtitle={isIt ? 'Rimuovi permanentemente il tuo profilo' : 'Permanently remove your profile'}
              danger
              onPress={confirmDeleteAccount}
            />
          </Section>

          <View style={{ alignItems: 'center', gap: 4, marginTop: 12, marginBottom: 8 }}>
            <AppText style={styles.footerBrand}>
              AllerTgy · v{appVersion}
            </AppText>
            <Pressable
              onPress={() => Linking.openURL('https://hacklab.digital')}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700', fontSize: 11 }}>
                {isIt ? 'Ideata e creata da hacklab.digital' : 'Crafted by hacklab.digital'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </GlassScreenScroll>

      {/* Modal Informazioni e Supporto Legale */}
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
              <Ionicons name="close-outline" size={24} color={colors.brandInk} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Section title={isIt ? 'Note legali e sicurezza' : 'Legal & safety'} card>
              <SettingsRow
                icon="document-text-outline"
                title={isIt ? 'Termini e condizioni' : 'Terms and conditions'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=terms'); }}
              />
              <SettingsDivider />
              <SettingsRow
                icon="shield-checkmark-outline"
                title={isIt ? 'Privacy e dati sulla salute' : 'Privacy and health data'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=privacy'); }}
              />
              <SettingsDivider />
              <SettingsRow
                icon="warning-outline"
                title={isIt ? 'Sicurezza e responsabilità' : 'Safety and disclaimer'}
                onPress={() => { setInfoModalVisible(false); router.push('/legal-docs?tab=safety'); }}
              />
            </Section>

            <Section title={isIt ? 'Assistenza clienti' : 'Customer support'} card>
              <SettingsRow
                icon="mail-outline"
                title={isIt ? "Contatta l'assistenza" : 'Contact support'}
                subtitle="supporto@allertgy.it"
                onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20AllerTgy')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="information-circle-outline"
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
  headerCard: {
    width: '100%',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 14,
  },
  pressed: { opacity: 0.8 },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDark: {
    borderColor: 'rgba(241, 254, 200, 0.50)',
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarLetter: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: '700',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  identityName: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  identitySubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 8,
    paddingBottom: 170,
    gap: 20,
  },
  inviteCard: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  inviteCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
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
    paddingVertical: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteCodeBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inviteCodeText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inviteIconBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 36,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F6B100',
    borderWidth: 1,
    borderColor: '#F7CF63',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  warnBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  sectionCountBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(66, 61, 102, 0.20)',
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  sectionCountBadgeText: {
    color: colors.brandInk,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  footerBrand: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
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
});
