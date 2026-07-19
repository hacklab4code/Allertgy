import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Image, Linking, Platform, Pressable, Share, StyleSheet, Switch, View, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api, API } from '../../../src/api/client';
import { logoutAndCleanup } from '../../../src/services/authSession';
import { useSession } from '../../../src/store/session';
import { useAppearance } from '../../../src/store/appearance';
import type { Allergen, CustomerPlan, ReferralStats } from '../../../src/types';
import { getFlagEmoji, getLanguageLabel } from '../../../src/constants/languages';
import { t } from '../../../src/engine/translations';
import ShareProfileModal from '../../../src/components/ShareProfileModal';
import { useTranslation } from '../../../src/constants/translations';
import { colors, spacing, radius, puffyShadow } from '../../../src/theme';
import { puffRaised } from '../../../src/components/ui/puffSurface';
import {
  AppText,
  CollapseSection,
  DebossedInput,
  ErrorStateCard,
  GlassCard,
  GlassScreenScroll,
  PuffyButton,
  Screen,
  Section,
  SettingsRow,
  SettingsDivider,
} from '../../../src/components/ui';
import { useNativeLiquidGlass, canUseNativeLiquidGlass } from '../../../src/components/ui/useNativeLiquidGlass';
import { useProfileSheet } from '../../../src/store/profileSheet';
import { connectAppleHealth, disconnectAppleHealth, isAppleHealthAvailable } from '../../../src/services/appleHealth';

export default function Account() {
  const {
    email, allergie, allergyIntensities, logout, setEmergencyMedicines, language,
    ingredientiEsclusi, setIngredientiEsclusi, emergencyContactName, emergencyContactPhone,
    setEmergencyContact, subProfiles, setSubProfiles,
  } = useSession();
  const { t: tLocal } = useTranslation();
  const [all, setAll] = useState<Allergen[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [emergencyDraft, setEmergencyDraft] = useState('');
  const [contactNameDraft, setContactNameDraft] = useState('');
  const [contactPhoneDraft, setContactPhoneDraft] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ profileId: number | null; label: string } | null>(null);
  const [customerPlans, setCustomerPlans] = useState<CustomerPlan[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [sosExpanded, setSosExpanded] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const openProfileSheet = useProfileSheet((s) => s.open);
  const liquidGlassEnabled = useAppearance((s) => s.liquidGlassEnabled);
  const setLiquidGlassEnabled = useAppearance((s) => s.setLiquidGlassEnabled);
  const { reduceTransparency } = useNativeLiquidGlass();
  const appleNativeGlass = canUseNativeLiquidGlass(false, true);

  const mie = all.filter((a) => allergie.includes(a.code));
  const isIt = language === 'it';
  const liquidGlassSubtitle = (() => {
    if (!liquidGlassEnabled || reduceTransparency) {
      return isIt ? 'Superfici opache, senza vetro' : 'Opaque surfaces, no glass';
    }
    if (appleNativeGlass) {
      return isIt ? 'Vetro nativo Apple (Liquid Glass)' : 'Native Apple Liquid Glass';
    }
    if (Platform.OS === 'ios') {
      return isIt ? 'Effetto vetro (fallback iOS)' : 'Glass effect (iOS fallback)';
    }
    return isIt ? 'Effetto vetro per tutti i dispositivi' : 'Glass effect on all devices';
  })();

  const loadProfileData = async () => {
    setProfileError(false);
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
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.allergens().then(setAll).catch(() => { });
    api.getCustomerPlans().then(setCustomerPlans).catch(() => { });
    api.getReferralStats().then(setReferral).catch(() => { });
    loadProfileData();
    api.getSubProfiles().then(setSubProfiles).catch(() => { });
  }, []);

  useFocusEffect(
    useCallback(() => {
      api.getProfilePhoto().then((photo) => setPhotoUrl(photo?.photo_url ?? null)).catch(() => { });
      api.getSubProfiles().then(setSubProfiles).catch(() => { });
    }, [setSubProfiles]),
  );

  const purchasePlus = async () => {
    setLoading(true);
    try {
      const res = await api.customerCheckout();
      if (res.checkout_url) await Linking.openURL(res.checkout_url);
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
          onPress: async () => { await logoutAndCleanup(); router.replace('/welcome'); },
        },
      ],
    );

  const saveEmergencyMedicines = async () => {
    setLoading(true);
    try {
      const value = emergencyDraft.trim() || null;
      await api.updateAppleHealth(profile?.apple_health_connected ?? 0, value, emergencyContactName, emergencyContactPhone);
      setEmergencyMedicines(value);
      await loadProfileData();
      Alert.alert(t('saved', language), t('emergency_saved', language));
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
        phone,
      );
      setEmergencyContact(name, phone);
      await loadProfileData();
      Alert.alert(t('saved', language), t('contact_saved', language));
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

  const plusPlan = customerPlans.find((p) => p.code === 'customer_plus');
  const hasPlus = profile?.has_customer_plus || referral?.has_plus;
  const activePlan = hasPlus
    ? (plusPlan ?? customerPlans.find((p) => p.code === 'customer_plus'))
    : (customerPlans.find((p) => p.code === 'customer_free') ?? customerPlans[0]);

  const displayName = profile?.display_name || email || (isIt ? 'Utente' : 'User');
  const excludedCount = ingredientiEsclusi.filter((s) => s.length > 0).length;

  const allergiesMenuSubtitle = mie.length === 0 && excludedCount === 0
    ? (isIt ? 'Nessuna allergia o ingrediente escluso' : 'No allergies or excluded ingredients')
    : [
      mie.length > 0 ? `${allergie.length} ${isIt ? 'allergie' : 'allergies'}` : null,
      excludedCount > 0 ? `${excludedCount} ${isIt ? 'ingredienti esclusi' : 'excluded'}` : null,
    ].filter(Boolean).join(' · ');
  const familyMenuSubtitle = subProfiles.length > 0
    ? `${subProfiles.length} ${isIt ? 'sottoprofili attivi' : 'sub-profiles'}`
    : (isIt ? 'Solo profilo personale' : 'Personal profile only');
  const docsMenuSubtitle = documents.length > 0
    ? `${documents.length} ${isIt ? 'documenti caricati' : 'documents uploaded'}`
    : (isIt ? 'Nessun documento' : 'No documents');
  const sosMenuSubtitle = emergencyContactName || emergencyDraft.trim()
    ? (isIt ? 'SOS configurato' : 'SOS configured')
    : (isIt ? 'Da configurare' : 'Not set up');
  const planLabel = hasPlus
    ? (plusPlan?.name ?? (isIt ? 'Plus Famiglia' : 'Family Plus'))
    : (activePlan?.name ?? (isIt ? 'Cliente Gratis' : 'Free Customer'));

  return (
    <Screen edges={false}>
      <GlassScreenScroll
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero profilo — foto solo qui, non in Home */}
        <GlassCard padded={false}>
          <Pressable onPress={openProfileSheet} style={styles.hero}>
            <Pressable onPress={changePhoto} style={styles.avatarWrap}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <AppText variant="title" color={colors.onBrand}>{(email ?? 'A')[0].toUpperCase()}</AppText>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={11} color={colors.brand} />
              </View>
            </Pressable>
            <View style={styles.heroCopy}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
                {isIt ? 'Profilo' : 'Profile'}
              </AppText>
              <AppText variant="h2" style={styles.heroName} numberOfLines={1}>{displayName}</AppText>
              {email ? (
                <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
                  {email}
                </AppText>
              ) : null}
              <View style={styles.heroSwitch}>
                <AppText variant="caption" color={colors.brand}>
                  {isIt ? 'Cambia profilo attivo' : 'Switch active profile'}
                </AppText>
                <Ionicons name="chevron-forward" size={14} color={colors.brand} />
              </View>
            </View>
          </Pressable>
        </GlassCard>

        <Section title={isIt ? 'Il tuo profilo' : 'Your profile'} card padded={false}>
          <SettingsRow
            icon="shield-checkmark"
            iconBg={colors.greenSoft}
            iconColor={colors.onGreen}
            title={isIt ? 'Allergie e ingredienti' : 'Allergies & ingredients'}
            subtitle={allergiesMenuSubtitle}
            onPress={() => router.push('/allergie')}
          />
          <SettingsDivider />
          <SettingsRow
            icon="people"
            iconBg={colors.brand50}
            title={isIt ? 'Sottoprofili famiglia' : 'Family sub-profiles'}
            subtitle={familyMenuSubtitle}
            onPress={() => router.push('/sub-profiles')}
          />
          <SettingsDivider />
          <SettingsRow
            icon="heart"
            iconBg={colors.redSoft}
            iconColor={colors.onRed}
            title={isIt ? 'Preferiti' : 'Favorites'}
            subtitle={isIt ? 'Locali e prodotti salvati' : 'Saved venues and products'}
            onPress={() => router.push('/preferiti')}
          />
        </Section>

        <CollapseSection
          icon="medkit"
          iconBg={colors.redSoft}
          iconColor={colors.onRed}
          title={isIt ? 'Emergenza SOS' : 'SOS emergency'}
          preview={sosMenuSubtitle}
          expanded={sosExpanded}
          onToggle={() => setSosExpanded((v) => !v)}
          tint="red"
        >
          <View style={styles.formBlock}>
            <AppText variant="bodyBold">{isIt ? 'Farmaci e note di emergenza' : 'Emergency medicines and notes'}</AppText>
            <DebossedInput
              value={emergencyDraft}
              onChangeText={setEmergencyDraft}
              placeholder={isIt ? 'es. EpiPen nello zaino' : 'e.g. EpiPen in backpack'}
              multiline
              style={styles.multilineInput}
            />
            <PuffyButton
              label={isIt ? 'Salva note SOS' : 'Save SOS notes'}
              onPress={saveEmergencyMedicines}
              disabled={loading}
              fullWidth={false}
              style={styles.saveBtn}
            />
          </View>
          <View style={styles.formBlock}>
            <AppText variant="bodyBold">{isIt ? 'Contatto di emergenza' : 'Emergency contact'}</AppText>
            <View style={styles.contactRow}>
              <DebossedInput
                value={contactNameDraft}
                onChangeText={setContactNameDraft}
                placeholder={isIt ? 'Nome' : 'Name'}
                style={[styles.compactInput, { flex: 1 }]}
              />
              <DebossedInput
                value={contactPhoneDraft}
                onChangeText={setContactPhoneDraft}
                placeholder={isIt ? 'Telefono' : 'Phone'}
                keyboardType="phone-pad"
                style={[styles.compactInput, { flex: 1 }]}
              />
            </View>
            <PuffyButton
              label={isIt ? 'Salva contatto' : 'Save contact'}
              onPress={saveEmergencyContact}
              disabled={loading}
              fullWidth={false}
              style={styles.saveBtn}
            />
          </View>
          <View style={[styles.formBlock, { paddingTop: 0 }]}>
            <SettingsRow
              icon="medkit"
              iconBg={colors.redSoft}
              iconColor={colors.onRed}
              title={isIt ? 'Apri schermata SOS' : 'Open SOS screen'}
              onPress={() => router.push('/emergency')}
            />
          </View>
        </CollapseSection>

        {profileError && (
          <ErrorStateCard
            message={isIt ? 'Impossibile caricare il profilo. Controlla la connessione.' : 'Could not load profile. Check your connection.'}
            retryLabel={isIt ? 'Riprova' : 'Retry'}
            onRetry={loadProfileData}
          />
        )}

        {loading && <ActivityIndicator color={colors.brand} />}

        {/* SALUTE E ALLERGIE */}
        <Section title={isIt ? 'Salute e documenti' : 'Health & documents'} card padded={false}>
          <SettingsRow
            icon="document-text"
            iconBg={colors.yellowSoft}
            iconColor={colors.onYellow}
            title={isIt ? 'Documenti medici' : 'Medical documents'}
            subtitle={docsMenuSubtitle}
            onPress={() => router.push('/documenti')}
          />
          <SettingsDivider />
          <SettingsRow
            icon="card"
            title={isIt ? 'Pass allergeni' : 'Allergen pass'}
            subtitle={isIt ? 'Tesserino per il personale di sala' : 'Card for restaurant staff'}
            onPress={() => router.push('/allergy-card')}
          />
        </Section>

        {/* ABBONAMENTO */}
        <CollapseSection
          icon="diamond"
          iconBg={colors.brand50}
          title={isIt ? 'Abbonamento' : 'Subscription'}
          preview={planLabel}
          expanded={planExpanded}
          onToggle={() => setPlanExpanded((v) => !v)}
        >
          <View style={styles.planBlock}>
            {referral?.invite_code ? (
              <GlassCard style={[styles.referralCard, { borderLeftWidth: 3, borderLeftColor: colors.greenBorder }]}>
                <AppText variant="bodyBold" color={colors.onGreen}>
                  {isIt ? 'Invita un ristoratore' : 'Invite a restaurant'}
                </AppText>
                <AppText variant="caption" color={colors.onGreen}>
                  {isIt
                    ? 'Condividi il codice: sblocchi Plus Famiglia e regali 1 mese di Pro.'
                    : 'Share your code: unlock Family Plus and gift 1 month of Pro.'}
                </AppText>
                <View style={styles.inviteBox}>
                  <AppText variant="caption">{isIt ? 'Il tuo codice' : 'Your code'}</AppText>
                  <AppText variant="h2" color={colors.onGreen} style={styles.inviteCode}>
                    {referral.invite_code}
                  </AppText>
                </View>
                <PuffyButton
                  label={isIt ? 'Condividi codice invito' : 'Share invite code'}
                  onPress={() => {
                    const msg = isIt
                      ? `Registra il tuo locale su AllerTgy con il mio codice invito ${referral.invite_code}: tu ricevi 1 mese di Pro omaggio e io sblocco Plus Famiglia.`
                      : `Register your venue on AllerTgy with my invite code ${referral.invite_code}: you get 1 free month of Pro and I unlock Family Plus.`;
                    Share.share({ message: msg });
                  }}
                />
              </GlassCard>
            ) : null}

            <View style={styles.planHead}>
              <View style={{ flex: 1 }}>
                <AppText variant="title">
                  {hasPlus
                    ? (plusPlan?.name ?? (isIt ? 'Plus Famiglia' : 'Family Plus'))
                    : (activePlan?.name ?? (isIt ? 'Cliente Gratis' : 'Free Customer'))}
                </AppText>
                <AppText variant="caption" style={styles.rowSub}>
                  {hasPlus
                    ? (isIt ? 'Attivo in omaggio grazie ai tuoi inviti.' : 'Active for free thanks to your referrals.')
                    : (activePlan?.tagline ?? (isIt ? 'Semaforo, QR e profilo personale sempre gratuiti.' : 'Traffic light, QR and personal profile remain free.'))}
                </AppText>
              </View>
              <AppText variant="bodyBold" color={colors.brand}>
                {hasPlus && profile?.customer_subscription_status === 'comped'
                  ? (isIt ? 'Omaggio' : 'Free gift')
                  : activePlan?.price_cents
                    ? `€${(activePlan.price_cents / 100).toFixed(2).replace('.', ',')}`
                    : (isIt ? 'Gratis' : 'Free')}
              </AppText>
            </View>
            <View style={styles.planFeatures}>
              {((hasPlus ? plusPlan?.features : activePlan?.features) ?? [
                'Scansione QR ristorante e semaforo personalizzato',
                '1 profilo allergie personale',
                'Recensioni allergy-focused',
              ]).map((feature) => (
                <View key={feature} style={styles.planFeatureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                  <AppText variant="caption" style={{ flex: 1 }}>{feature}</AppText>
                </View>
              ))}
            </View>
            {!hasPlus && plusPlan ? (
              <View style={styles.planActions}>
                <Pressable style={styles.upgradeBox} onPress={purchasePlus}>
                  <AppText variant="bodyBold">
                    {isIt
                      ? `Attiva ${plusPlan.name} — €${(plusPlan.price_cents / 100).toFixed(2)}/mese`
                      : `Get ${plusPlan.name} — €${(plusPlan.price_cents / 100).toFixed(2)}/mo`}
                  </AppText>
                  <AppText variant="caption">{plusPlan.tagline}</AppText>
                </Pressable>
              </View>
            ) : null}
            {hasPlus && profile?.customer_subscription_status === 'active' ? (
              <PuffyButton
                label={isIt ? 'Gestisci abbonamento Plus' : 'Manage Plus subscription'}
                onPress={managePlus}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
              />
            ) : null}
          </View>
        </CollapseSection>

        {/* IMPOSTAZIONI */}
        <Section title={isIt ? 'Impostazioni' : 'Settings'} card padded={false}>
          <SettingsRow
            icon="language"
            title={tLocal('app_language_label')}
            subtitle={`${getFlagEmoji(language)} ${getLanguageLabel(language)}`}
            onPress={() => router.push('/language')}
          />
          <SettingsDivider />
          <SettingsRow
            icon="notifications"
            title={isIt ? 'Notifiche' : 'Notifications'}
            subtitle={isIt ? 'Avvisi locali e aggiornamenti menù' : 'Venue alerts and menu updates'}
            onPress={() => router.push('/notifiche')}
          />
          {isAppleHealthAvailable() && (
            <>
              <SettingsDivider />
              <View style={styles.healthRow}>
                <View style={[styles.rowIcon, { backgroundColor: colors.redSoft }]}>
                  <Ionicons name="heart" size={20} color={colors.onRed} />
                </View>
                <View style={styles.rowBody}>
                  <AppText variant="bodyBold">{tLocal('apple_health_title')}</AppText>
                  <AppText variant="caption">{tLocal('apple_health_sub')}</AppText>
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
            </>
          )}
          <SettingsDivider />
          <SettingsRow
            icon="share-social"
            title={isIt ? 'Condividi profilo allergie' : 'Share allergy profile'}
            subtitle={isIt ? 'Invia il profilo a contatti o utenti AllerTgy' : 'Send profile to contacts or users'}
            onPress={() => setShareTarget({ profileId: null, label: displayName })}
          />
        </Section>

        {/* STILE */}
        <Section title={isIt ? 'Stile' : 'Style'} card padded={false}>
          <View style={styles.healthRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.brand50 }]}>
              <Ionicons name="water" size={20} color={colors.brand} />
            </View>
            <View style={styles.rowBody}>
              <AppText variant="bodyBold">Liquid Glass</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>{liquidGlassSubtitle}</AppText>
            </View>
            <Switch
              value={liquidGlassEnabled}
              onValueChange={(on) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLiquidGlassEnabled(on);
              }}
              trackColor={{ false: colors.border, true: colors.brand200 }}
              thumbColor={liquidGlassEnabled ? colors.brand : colors.surface}
            />
          </View>
        </Section>

        <CollapseSection
          icon="help-circle"
          title={isIt ? 'Info e supporto' : 'Info & support'}
          preview={isIt ? 'Legale, assistenza, informazioni app' : 'Legal, support, app info'}
          expanded={supportExpanded}
          onToggle={() => setSupportExpanded((v) => !v)}
        >
          <SettingsRow icon="document" title={isIt ? 'Termini e condizioni' : 'Terms and conditions'} onPress={() => router.push('/legal-docs?tab=terms')} />
          <SettingsDivider />
          <SettingsRow icon="shield" title={isIt ? 'Privacy e dati sulla salute' : 'Privacy and health data'} onPress={() => router.push('/legal-docs?tab=privacy')} />
          <SettingsDivider />
          <SettingsRow
            icon="trash"
            iconBg={colors.redSoft}
            iconColor={colors.onRed}
            title={isIt ? 'Elimina account e dati' : 'Delete account and data'}
            onPress={confirmDeleteAccount}
          />
          <SettingsDivider />
          <SettingsRow icon="warning" title={isIt ? 'Sicurezza e responsabilità' : 'Safety and disclaimer'} onPress={() => router.push('/legal-docs?tab=safety')} />
          <SettingsDivider />
          <SettingsRow
            icon="mail"
            title={isIt ? 'Contatta l\'assistenza' : 'Contact support'}
            subtitle="supporto@allertgy.it"
            onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20AllerTgy')}
          />
          <SettingsDivider />
          <SettingsRow
            icon="information-circle"
            title={isIt ? 'Informazioni app' : 'App info'}
            subtitle={`AllerTgy v0.5 · ${API}`}
          />
        </CollapseSection>

        <GlassCard style={{ borderLeftWidth: 3, borderLeftColor: colors.greenBorder }}>
          <AppText variant="caption" color={colors.onGreen} style={styles.disclaimer}>
            {isIt
              ? 'AllerTgy confronta il tuo profilo con i dati dichiarati dal locale. Non sostituisce il parere medico: comunica sempre le tue allergie al personale.'
              : 'AllerTgy compares your profile with venue data. It does not replace medical advice: always tell staff about your allergies.'}
          </AppText>
        </GlassCard>

        <PuffyButton
          label={isIt ? 'Esci dall\'account' : 'Log out'}
          onPress={confirmLogout}
          variant="danger"
        />
      </GlassScreenScroll>

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
  planBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...puffyShadow(4),
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  heroName: {
    letterSpacing: -0.35,
  },
  heroSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowExpanded: { alignItems: 'flex-start' },
  rowPressed: { opacity: 0.85 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...puffRaised({ elevation: 3, r: radius.sm }),
  },
  rowBody: { flex: 1, gap: 2 },
  rowSub: { marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceTertiary,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  formBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  compactInput: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: { alignSelf: 'flex-start' },
  referralCard: { gap: spacing.sm, marginBottom: spacing.sm },
  inviteBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },
  inviteCode: { letterSpacing: 3 },
  planHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planFeatures: { gap: spacing.sm },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planActions: { gap: spacing.sm, marginTop: spacing.md },
  upgradeBox: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  disclaimer: { lineHeight: 18 },
});
