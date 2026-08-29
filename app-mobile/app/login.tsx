import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, StyleSheet,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { useSession, type Role } from '../src/store/session';
import { useNotifStore } from '../src/store/notifications';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { syncFavoritesFromServer } from '../src/services/favorites';
import { resolveAuthenticatedRoute } from '../src/hooks/onboardingGuard';
import { AppText, DebossedInput, GlassScreenScroll, SurfaceButton, Screen } from '../src/components/ui';
import { colors, spacing, radius, softShadow, MIN_TOUCH_TARGET } from '../src/theme';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';

async function loadCustomerSessionData() {
  await syncFavoritesFromServer();
}

function navigateAfterLogin(route: string) {
  router.replace(route as any);
}

function humanizeError(errMsg: string, isIt: boolean): string {
  const msg = errMsg.toLowerCase();
  if (msg.includes('email_exists') || msg.includes('già registrat')) {
    return isIt
      ? 'Questa email è già registrata. Prova ad accedere.'
      : 'This email is already registered. Try logging in.';
  }
  if (msg.includes('invalid credentials') || msg.includes('credenziali') || msg.includes('401')) {
    return isIt
      ? 'Email o password non corrette. Riprova.'
      : 'Incorrect email or password. Try again.';
  }
  if (msg.includes('server non raggiungibile') || msg.includes('fetch')) {
    return isIt
      ? 'Impossibile connettersi al server. Verifica la tua connessione.'
      : 'Unable to connect to server. Please check your connection.';
  }
  return errMsg;
}

export default function Login() {
  const session = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: 'login' | 'register' | 'forgot'; role?: Role }>();
  const isIt = (session.language || 'it').toLowerCase() === 'it';
  const role = params.role || session.role || 'customer';

  useEffect(() => {
    // Legacy deep-link: /login?mode=register → schermata dedicata
    if (params.mode === 'register') {
      router.replace(`/register?role=${role}` as any);
    }
  }, [params.mode, role]);

  const [mode, setMode] = useState<'login' | 'forgot'>(
    params.mode === 'forgot' ? 'forgot' : 'login',
  );
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);
  const { ref: headingRef, ink: headingInk, onLayout: onHeadingLayout } = useAdaptiveMeshInk(true);

  const formOk = mode === 'forgot'
    ? !!email.trim()
    : !!email.trim() && password.length >= 8;

  const submit = async () => {
    setBusy(true);
    setError('');
    if (mode === 'forgot') {
      try {
        await api.forgotPassword(email.trim());
        setForgotSent(true);
      } catch (e) {
        setError(humanizeError((e as Error).message, isIt));
      }
      setBusy(false);
      return;
    }
    try {
      const res = await api.login(email.trim(), password);
      session.setToken(res.access_token);
      session.setEmail(email.trim());
      session.setRole(res.role === 'owner' ? 'owner' : 'customer');
      session.setTourCompleted(true);
      session.setRegisterAllergieStep(false);
      if (!useSession.getState().languageSelected) {
        session.setLanguage(useSession.getState().language || 'it');
      }
      if (res.role !== 'owner') {
        const profile = await api.getProfile();
        session.setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
        session.setProfileCompleted(profile.onboarding_completed);
        session.setDisclaimer(profile.disclaimer_accepted);
        session.setEmergencyMedicines(profile.emergency_medicines);
        session.setEmergencyContact(profile.emergency_contact_name ?? null, profile.emergency_contact_phone ?? null);
        const mine = await api.myAllergens().catch(() => []);
        const intensitiesMap: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
        const criteriaMap: Record<string, 'assoluto' | 'crudo' | 'cotto'> = {};
        mine.forEach((a) => {
          if (a.intensity) {
            intensitiesMap[a.code] = a.intensity as 'lieve' | 'moderata' | 'grave';
          }
          if (a.criterio) {
            criteriaMap[a.code] = a.criterio as 'assoluto' | 'crudo' | 'cotto';
          }
        });
        session.setAllergie(mine.map((a) => a.code), intensitiesMap, criteriaMap);
        await loadCustomerSessionData();
        useNotifStore.getState().refresh();
      } else {
        session.setLegalStatus(true, false);
      }
      navigateAfterLogin(resolveAuthenticatedRoute(useSession.getState()));
    } catch (e) {
      setError(humanizeError((e as Error).message, isIt));
    }
    setBusy(false);
  };

  return (
    <Screen edges={false} ambient style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <View
          ref={headerRef}
          onLayout={onHeaderLayout}
          style={[styles.topHeaderBar, { paddingTop: Math.max(insets.top, 12) }]}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/welcome');
            }}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>

          <AppText variant="h2" color={headerInk.ink} style={styles.brandTitle}>
            AllerTgy
          </AppText>

          <LanguageFlagsRow />
        </View>

        <GlassScreenScroll
          headerFloat={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View ref={headingRef} onLayout={onHeadingLayout} style={styles.heading}>
            <AppText variant="h1" color={headingInk.ink}>
              {mode === 'login' ? t('login_title') : t('forgot_title')}
            </AppText>
            <AppText variant="subtitle" color={headingInk.inkMuted} style={styles.subtitleText}>
              {mode === 'login' ? t('login_subtitle') : t('forgot_subtitle')}
            </AppText>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AppText variant="bodyBold" color={colors.red}>
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={styles.field}>
            <AppText variant="caption">{t('email_label')}</AppText>
            <DebossedInput
              placeholder="nome@email.it"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {mode !== 'forgot' && (
            <View style={styles.field}>
              <AppText variant="caption">{t('password_label')}</AppText>
              <DebossedInput
                placeholder={isIt ? 'La tua password' : 'Your password'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.onSurfaceMuted}
                    />
                  </TouchableOpacity>
                }
              />
              <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}>
                <AppText variant="caption" color={colors.brand} style={{ textAlign: 'right', marginTop: 4 }}>
                  {t('forgot_password_link')}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'forgot' && forgotSent && (
            <View style={[styles.infoBox, softShadow(4)]}>
              <AppText variant="body">
                {isIt
                  ? "Se l'indirizzo esiste, riceverai un'email con il link per reimpostare la password. Il link scade tra 30 minuti."
                  : 'If the email exists, you will receive a link to reset your password. The link expires in 30 minutes.'}
              </AppText>
            </View>
          )}
        </GlassScreenScroll>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <SurfaceButton
            label={mode === 'login' ? t('login_btn') : t('forgot_btn')}
            onPress={submit}
            disabled={busy || !formOk}
            loading={busy}
          />
          <Pressable
            style={styles.switchButton}
            onPress={() => {
              if (mode === 'forgot') {
                setMode('login');
                setError('');
                setForgotSent(false);
              } else {
                router.push(`/register?role=${role}` as any);
              }
            }}
          >
            <AppText variant="bodyBold" color={colors.brand} style={{ textAlign: 'center' }}>
              {mode === 'forgot' ? t('back_to_login_link') : t('no_account_prompt')}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTitle: { fontWeight: '800' },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  heading: { gap: spacing.xs, marginBottom: spacing.lg },
  subtitleText: { lineHeight: 20 },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  switchButton: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  errorBanner: {
    backgroundColor: colors.redSoft ?? '#fee2e2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
  },
  infoBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
