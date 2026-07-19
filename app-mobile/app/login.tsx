import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, StyleSheet,
  TextInput, TouchableOpacity, View, InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { useSession, type Role } from '../src/store/session';
import { useNotifStore } from '../src/store/notifications';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { syncFavoritesFromServer } from '../src/services/favorites';
import { resolveAuthenticatedRoute } from '../src/hooks/onboardingGuard';
import { AppText, DebossedInput, GlassCard, GlassScreenScroll, PuffyButton, Screen } from '../src/components/ui';
import { colors, spacing, radius, puffyShadow, MIN_TOUCH_TARGET } from '../src/theme';

async function loadCustomerSessionData() {
  await syncFavoritesFromServer();
  const profiles = await api.getSubProfiles().catch(() => []);
  useSession.getState().setSubProfiles(profiles);
}

function navigateAfterLogin(href: string) {
  InteractionManager.runAfterInteractions(() => {
    router.replace(href as '/');
  });
}

export default function Login() {
  const session = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (session.language || 'it').toLowerCase() === 'it';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotSent, setForgotSent] = useState(false);
  const [role, setRole] = useState<Role>(session.role || 'customer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);
  const [acceptOwnerResponsibility, setAcceptOwnerResponsibility] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const legalOk = mode !== 'register' || (
    acceptTerms &&
    acceptPrivacy &&
    (role === 'customer' ? acceptHealthData : acceptOwnerResponsibility)
  );
  const formOk = mode === 'forgot'
    ? !!email.trim()
    : !!email.trim() && password.length >= 8 && legalOk && (mode === 'login' || !!displayName.trim());

  const submit = async () => {
    setBusy(true);
    setError('');
    if (mode === 'forgot') {
      try {
        await api.forgotPassword(email.trim());
        setForgotSent(true);
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(false);
      return;
    }
    try {
      const res = mode === 'login'
        ? await api.login(email.trim(), password)
        : await api.register(email.trim(), password, role, displayName.trim(), {
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
            accept_health_data: role === 'customer' ? acceptHealthData : false,
            accept_owner_responsibility: role === 'owner' ? acceptOwnerResponsibility : false,
          });
      session.setToken(res.access_token);
      session.setEmail(email.trim());
      session.setRole(res.role === 'owner' ? 'owner' : 'customer');
      session.setTourCompleted(mode === 'login');
      if (mode === 'login') session.setRegisterAllergieStep(false);
      if (!useSession.getState().languageSelected) {
        session.setLanguage(useSession.getState().language || 'it');
      }
      if (res.role !== 'owner') {
        if (mode === 'register') {
          session.setLegalStatus(true, true);
          session.setProfileCompleted(false);
          session.setRegisterAllergieStep(true);
          session.setDisclaimer(false);
          session.setEmergencyMedicines(null);
          await loadCustomerSessionData();
          useNotifStore.getState().refresh();
          navigateAfterLogin('/register-allergies');
          setBusy(false);
          return;
        } else {
          const profile = await api.getProfile();
          session.setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
          session.setProfileCompleted(profile.onboarding_completed);
          session.setDisclaimer(profile.disclaimer_accepted);
          session.setEmergencyMedicines(profile.emergency_medicines);
          session.setEmergencyContact(profile.emergency_contact_name ?? null, profile.emergency_contact_phone ?? null);
          const mine = await api.myAllergens().catch(() => []);
          const intensitiesMap: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
          mine.forEach((a) => {
            if (a.intensity) {
              intensitiesMap[a.code] = a.intensity as 'lieve' | 'moderata' | 'grave';
            }
          });
          session.setAllergie(mine.map((a) => a.code), intensitiesMap);
        }
        await loadCustomerSessionData();
        useNotifStore.getState().refresh();
      } else {
        session.setLegalStatus(true, false);
      }
      navigateAfterLogin(resolveAuthenticatedRoute(useSession.getState()));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Screen edges={false} ambient style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Stack.Screen options={{ headerRight: () => <LanguageFlagsRow inHeader /> }} />

        <GlassScreenScroll
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <AppText variant="h2" color={colors.brand}>AllerTgy</AppText>
        <View style={styles.heading}>
          <AppText variant="h1">
            {mode === 'login' ? t('login_title')
              : mode === 'forgot' ? t('forgot_title')
              : t('register_title')}
          </AppText>
          <AppText variant="subtitle">
            {mode === 'login'
              ? t('login_subtitle')
              : mode === 'forgot'
              ? t('forgot_subtitle')
              : role === 'customer'
              ? (isIt ? 'Passo 1 di 2: account. Nel passo successivo imposterai le allergie.' : 'Step 1 of 2: account. Next you will set up your allergies.')
              : t('register_subtitle')}
          </AppText>
        </View>

        {mode === 'register' && (
          <View style={styles.roles}>
            <GlassCard
              onPress={() => setRole('customer')}
              style={[styles.roleCard, role === 'customer' && styles.roleOn]}
            >
              <AppText style={{ fontSize: 24 }}>🙋</AppText>
              <AppText variant="bodyBold" color={role === 'customer' ? colors.brand : colors.onSurface}>
                {isIt ? 'Sono un cliente' : 'I am a customer'}
              </AppText>
            </GlassCard>
            <GlassCard
              onPress={() => setRole('owner')}
              style={[styles.roleCard, role === 'owner' && styles.roleOn]}
            >
              <AppText style={{ fontSize: 24 }}>👨‍🍳</AppText>
              <AppText variant="bodyBold" color={role === 'owner' ? colors.brand : colors.onSurface}>
                {isIt ? 'Ho un ristorante' : 'I own a restaurant'}
              </AppText>
            </GlassCard>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.field}>
            <AppText variant="caption">{t('name_label')}</AppText>
            <DebossedInput
              placeholder={isIt ? 'Il tuo nome' : 'Your name'}
              autoCapitalize="words"
              value={displayName}
              onChangeText={setDisplayName}
              style={{ letterSpacing: 0 }}
            />
          </View>
        )}

        <View style={styles.field}>
          <AppText variant="caption">{t('email_label')}</AppText>
          <DebossedInput
            placeholder="nome@email.it"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{ letterSpacing: 0 }}
          />
        </View>
        {mode !== 'forgot' && (
          <View style={styles.field}>
            <AppText variant="caption">{t('password_label')}</AppText>
            <DebossedInput
              placeholder={isIt ? 'Minimo 8 caratteri' : 'Minimum 8 characters'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ letterSpacing: 0 }}
            />
            {mode === 'login' && (
              <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}>
                <AppText variant="caption" color={colors.brand} style={{ textAlign: 'right', marginTop: 4 }}>
                  {t('forgot_password_link')}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {mode === 'forgot' && forgotSent && (
          <View style={[styles.legalBox, puffyShadow(4)]}>
            <AppText variant="body">
              📧 {isIt
                ? "Se l'indirizzo esiste, riceverai un'email con il link per reimpostare la password. Il link scade tra 30 minuti."
                : 'If the email exists, you will receive a link to reset your password. The link expires in 30 minutes.'}
            </AppText>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.legalBox}>
            <CheckRow
              checked={acceptTerms}
              onPress={() => setAcceptTerms(!acceptTerms)}
              text={isIt ? "Accetto i Termini di servizio di AllerTgy." : "I accept the AllerTgy Terms of Service."}
            />
            <CheckRow
              checked={acceptPrivacy}
              onPress={() => setAcceptPrivacy(!acceptPrivacy)}
              text={isIt ? "Ho letto l'Informativa Privacy." : "I have read the Privacy Policy."}
            />
            {role === 'customer' ? (
              <CheckRow
                checked={acceptHealthData}
                onPress={() => setAcceptHealthData(!acceptHealthData)}
                text={isIt 
                  ? "Acconsento al trattamento dei dati su allergie, intolleranze e preferenze alimentari per personalizzare il menù." 
                  : "I consent to the processing of data on allergies, intolerances and dietary preferences to customize the menu."}
              />
            ) : (
              <CheckRow
                checked={acceptOwnerResponsibility}
                onPress={() => setAcceptOwnerResponsibility(!acceptOwnerResponsibility)}
                text={isIt 
                  ? "Dichiaro di essere autorizzato a gestire il locale e di pubblicare informazioni allergeni verificate." 
                  : "I declare that I am authorized to manage the venue and to publish verified allergen info."}
              />
            )}
          </View>
        )}

        {error ? <AppText variant="caption" color={colors.red} style={{ marginTop: spacing.sm }}>{error}</AppText> : null}
        </GlassScreenScroll>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PuffyButton
            label={mode === 'login' ? t('login_btn') : mode === 'forgot' ? t('forgot_btn') : t('register_btn')}
            onPress={submit}
            disabled={busy || !formOk}
            loading={busy}
          />
          <Pressable
            style={styles.switchButton}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForgotSent(false); }}
          >
            <AppText variant="bodyBold" color={colors.brand} style={{ textAlign: 'center' }}>
              {mode === 'login' ? t('no_account_prompt')
                : mode === 'forgot' ? t('back_to_login_link')
                : t('have_account_prompt')}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CheckRow({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <AppText style={styles.checkboxMark}>✓</AppText> : null}
      </View>
      <AppText variant="caption" style={{ flex: 1 }}>{text}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  container: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.md },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  heading: { gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.md },
  roles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleCard: { flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  roleOn: { borderColor: colors.brand, backgroundColor: colors.brand50 },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  switchButton: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  legalBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 22, height: 22, borderRadius: 8, borderWidth: 1.5,
    borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkboxMark: { color: colors.onBrand, fontWeight: '900', fontSize: 14 },
});
