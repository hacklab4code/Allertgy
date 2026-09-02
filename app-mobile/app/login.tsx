import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, StyleSheet,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
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
      ? 'Email o password non corrette. Verifica e riprova.'
      : 'Incorrect email or password. Please verify and try again.';
  }
  if (msg.includes('server non raggiungibile') || msg.includes('fetch')) {
    return isIt
      ? 'Impossibile connettersi al server. Verifica la tua connessione Wi-Fi o dati.'
      : 'Unable to connect to server. Please check your connection.';
  }
  return errMsg;
}

export default function Login() {
  const session = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: 'login' | 'register' | 'forgot' }>();
  const isIt = (session.language || 'it').toLowerCase() === 'it';

  useEffect(() => {
    // Legacy deep-link: /login?mode=register → schermata dedicata
    if (params.mode === 'register') {
      router.replace('/register' as any);
    }
  }, [params.mode]);

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

  // Email format validation check
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const formOk = mode === 'forgot'
    ? isEmailValid
    : isEmailValid && password.length >= 8;

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

        {/* Top Header */}
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
            <Ionicons name="arrow-back-outline" size={20} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.brandGroup}>
            <AppText variant="h2" color={headerInk.ink} style={styles.brandTitle}>
              AllerTgy
            </AppText>
            <View style={styles.brandDot} />
          </View>

          <LanguageFlagsRow />
        </View>

        <GlassScreenScroll
          headerFloat={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Segmented Switcher (Accedi / Registrati) */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.segmentBtn, styles.segmentBtnActive]}
            >
              <Ionicons name="log-in-outline" size={15} color={colors.brand} />
              <AppText variant="bodyBold" color={colors.brand} style={styles.segmentText}>
                {isIt ? 'Accedi' : 'Log in'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.replace('/register' as any)}
              style={styles.segmentBtn}
            >
              <Ionicons name="person-add-outline" size={15} color={colors.onSurfaceMuted} />
              <AppText variant="bodyBold" color={colors.onSurfaceMuted} style={styles.segmentText}>
                {isIt ? 'Registrati' : 'Sign up'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View ref={headingRef} onLayout={onHeadingLayout} style={styles.heading}>
            <View style={styles.modeBadge}>
              <Ionicons
                name={mode === 'login' ? 'key-outline' : 'mail-unread-outline'}
                size={13}
                color={colors.brand}
              />
              <AppText variant="caption" color={colors.brand} style={styles.modeBadgeText}>
                {mode === 'login'
                  ? (isIt ? 'ACCESSO ACCOUNT' : 'ACCOUNT LOGIN')
                  : (isIt ? 'RECUPERO PASSWORD' : 'PASSWORD RECOVERY')}
              </AppText>
            </View>

            <AppText variant="h1" color={headingInk.ink} style={styles.mainHeading}>
              {mode === 'login' ? t('login_title') : t('forgot_title')}
            </AppText>
            <AppText variant="subtitle" color={headingInk.inkMuted} style={styles.subtitleText}>
              {mode === 'login' ? t('login_subtitle') : t('forgot_subtitle')}
            </AppText>
          </View>

          {/* Error Banner with helpful direct actions */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyBold" color={colors.red} style={{ fontSize: 13 }}>
                  {error}
                </AppText>
                {mode === 'login' && error.includes('password') && (
                  <TouchableOpacity
                    onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  >
                    <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
                      {isIt ? 'Hai dimenticato la password? Clicca qui per recuperarla' : 'Forgot password? Click here to recover'}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          {/* Form Fields Card */}
          <View style={[styles.formCard, softShadow(2)]}>
            {/* Email Field */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Ionicons name="mail-outline" size={15} color={colors.brand} />
                <AppText variant="caption" style={styles.fieldLabel}>{t('email_label')}</AppText>
              </View>
              <DebossedInput
                placeholder="nome@email.it"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                rightIcon={
                  isEmailValid ? (
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.green} />
                  ) : undefined
                }
              />
            </View>

            {/* Password Field (Login Mode Only) */}
            {mode !== 'forgot' && (
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="lock-closed-outline" size={15} color={colors.brand} />
                  <AppText variant="caption" style={styles.fieldLabel}>{t('password_label')}</AppText>
                </View>
                <DebossedInput
                  placeholder={isIt ? 'La tua password' : 'Your password'}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.onSurfaceMuted}
                      />
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity
                  onPress={() => { setMode('forgot'); setError(''); setForgotSent(false); }}
                  style={{ alignSelf: 'flex-end', marginTop: 4 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                    {t('forgot_password_link')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Forgot Confirmation Box */}
            {mode === 'forgot' && forgotSent && (
              <View style={[styles.infoBox, softShadow(4)]}>
                <Ionicons name="mail-unread-outline" size={24} color={colors.brand} />
                <AppText variant="body" style={{ flex: 1, fontSize: 13, lineHeight: 18 }}>
                  {isIt
                    ? "Se l'indirizzo esiste, riceverai un'email con il link per reimpostare la password. Il link scade tra 30 minuti."
                    : 'If the email exists, you will receive a link to reset your password. The link expires in 30 minutes.'}
                </AppText>
              </View>
            )}
          </View>
        </GlassScreenScroll>

        {/* Sticky Bottom Actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <SurfaceButton
            label={mode === 'login' ? t('login_btn') : t('forgot_btn')}
            onPress={submit}
            disabled={busy || !formOk}
            loading={busy}
            icon="arrow-forward-outline"
          />
          <Pressable
            style={styles.switchButton}
            onPress={() => {
              if (mode === 'forgot') {
                setMode('login');
                setError('');
                setForgotSent(false);
              } else {
                router.push('/register' as any);
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
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
    fontSize: 22,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.brand,
    marginTop: 3,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heading: {
    gap: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
    alignSelf: 'flex-start',
  },
  modeBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  mainHeading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redSoft ?? '#fee2e2',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.red,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
