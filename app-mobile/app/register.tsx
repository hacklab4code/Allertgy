import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
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

function humanizeError(errMsg: string, isIt: boolean): string {
  const msg = errMsg.toLowerCase();
  if (msg.includes('email_exists') || msg.includes('già registrat')) {
    return isIt
      ? 'Questa email è già registrata. Prova ad accedere.'
      : 'This email is already registered. Try logging in.';
  }
  if (msg.includes('server non raggiungibile') || msg.includes('fetch')) {
    return isIt
      ? 'Impossibile connettersi al server. Verifica la tua connessione Wi-Fi o dati.'
      : 'Unable to connect to server. Please check your connection.';
  }
  return errMsg;
}

export default function Register() {
  const session = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: Role }>();
  const isIt = (session.language || 'it').toLowerCase() === 'it';

  const role: Role = params.role || session.role || 'customer';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptHealthOrOwner, setAcceptHealthOrOwner] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);
  const { ref: headingRef, ink: headingInk, onLayout: onHeadingLayout } = useAdaptiveMeshInk(true);

  // Email format validation check
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumberOrSymbol = /\d/.test(password) || /[^A-Za-z0-9]/.test(password);

  // Password strength calculation (0 to 3)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpperAndLower) score += 1;
    if (hasNumberOrSymbol) score += 1;
    return score;
  }, [password, hasMinLength, hasUpperAndLower, hasNumberOrSymbol]);

  // Passwords matching check
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Form validity
  const formOk =
    !!displayName.trim() &&
    isEmailValid &&
    hasMinLength &&
    passwordsMatch &&
    acceptLegal &&
    acceptHealthOrOwner;

  const toggleAcceptAll = () => {
    const allChecked = acceptLegal && acceptHealthOrOwner;
    setAcceptLegal(!allChecked);
    setAcceptHealthOrOwner(!allChecked);
  };

  const submit = async () => {
    if (!passwordsMatch) {
      setError(isIt ? 'Le password inserite non corrispondono.' : 'Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await api.register(email.trim(), password, role, displayName.trim(), {
        accept_terms: acceptLegal,
        accept_privacy: acceptLegal,
        accept_health_data: role === 'customer' ? acceptHealthOrOwner : false,
        accept_owner_responsibility: role === 'owner' ? acceptHealthOrOwner : false,
      });
      session.setToken(res.access_token);
      session.setEmail(email.trim());
      session.setRole(res.role === 'owner' ? 'owner' : 'customer');
      session.setTourCompleted(false);
      if (!useSession.getState().languageSelected) {
        session.setLanguage(useSession.getState().language || 'it');
      }

      if (res.role !== 'owner') {
        session.setLegalStatus(true, true);
        session.setProfileCompleted(false);
        session.setRegisterAllergieStep(true);
        session.setDisclaimer(false);
        session.setEmergencyMedicines(null);
        await syncFavoritesFromServer();
        useNotifStore.getState().refresh();
        router.replace('/register-allergies' as any);
      } else {
        session.setLegalStatus(true, false);
        router.replace(resolveAuthenticatedRoute(useSession.getState()) as any);
      }
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
              activeOpacity={0.8}
              onPress={() => router.replace(`/login?role=${role}` as any)}
              style={styles.segmentBtn}
            >
              <Ionicons name="log-in-outline" size={15} color={colors.onSurfaceMuted} />
              <AppText variant="bodyBold" color={colors.onSurfaceMuted} style={styles.segmentText}>
                {isIt ? 'Accedi' : 'Log in'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.segmentBtn, styles.segmentBtnActive]}
            >
              <Ionicons name="person-add-outline" size={15} color={colors.brand} />
              <AppText variant="bodyBold" color={colors.brand} style={styles.segmentText}>
                {isIt ? 'Registrati' : 'Sign up'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Progress Bar Header */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <View style={styles.stepBadge}>
                <Ionicons
                  name={role === 'customer' ? 'person-outline' : 'restaurant-outline'}
                  size={13}
                  color={role === 'customer' ? colors.brand : colors.green}
                />
                <AppText
                  variant="caption"
                  color={role === 'customer' ? colors.brand : colors.green}
                  style={styles.stepBadgeText}
                >
                  {role === 'customer'
                    ? (isIt ? 'PASSO 1 DI 2 · DATI ACCOUNT' : 'STEP 1 OF 2 · ACCOUNT DETAILS')
                    : (isIt ? 'ACCOUNT RISTORATORE' : 'OWNER ACCOUNT')}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.progressPercent}>
                {role === 'customer' ? '50%' : '100%'}
              </AppText>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: role === 'customer' ? '50%' : '100%' },
                  role === 'owner' && { backgroundColor: colors.green },
                ]}
              />
            </View>
          </View>

          {/* Heading */}
          <View ref={headingRef} onLayout={onHeadingLayout} style={styles.heading}>
            <AppText variant="h1" color={headingInk.ink} style={styles.mainHeading}>
              {role === 'customer'
                ? t('register_title')
                : (isIt ? 'Crea account Ristoratore' : 'Create Owner Account')}
            </AppText>
            <AppText variant="subtitle" color={headingInk.inkMuted} style={styles.subtitleText}>
              {role === 'customer'
                ? t('register_subtitle')
                : (isIt
                  ? 'Configura il tuo profilo locale per gestire menù, tavoli e conformità allergeni.'
                  : 'Configure your venue profile to start managing menus, table QRs and allergen safety.')}
            </AppText>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <AppText variant="bodyBold" color={colors.red} style={{ flex: 1, fontSize: 13 }}>
                {error}
              </AppText>
            </View>
          ) : null}

          {/* Input Form Card */}
          <View style={[styles.formCard, softShadow(2)]}>
            {/* Name Input */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Ionicons
                  name={role === 'customer' ? 'person-outline' : 'restaurant-outline'}
                  size={15}
                  color={role === 'customer' ? colors.brand : colors.green}
                />
                <AppText variant="caption" style={styles.fieldLabel}>
                  {role === 'customer' ? t('name_label') : (isIt ? 'Nome Locale / Attività' : 'Venue Name')}
                </AppText>
              </View>
              <DebossedInput
                placeholder={isIt ? (role === 'customer' ? 'Mario Rossi' : 'Nome del Ristorante') : (role === 'customer' ? 'John Doe' : 'Restaurant Name')}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            {/* Email Input */}
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

            {/* Password Input */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Ionicons name="lock-closed-outline" size={15} color={colors.brand} />
                <AppText variant="caption" style={styles.fieldLabel}>{t('password_label')}</AppText>
              </View>
              <DebossedInput
                placeholder={isIt ? 'Minimo 8 caratteri' : 'Minimum 8 characters'}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                textContentType="newPassword"
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

              {/* Password Strength Meter & Live Checklist */}
              {password.length > 0 && (
                <View style={styles.strengthBlock}>
                  <View style={styles.strengthBars}>
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength >= 1 && { backgroundColor: passwordStrength === 1 ? colors.red : passwordStrength === 2 ? colors.amber : colors.green },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength >= 2 && { backgroundColor: passwordStrength === 2 ? colors.amber : colors.green },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength >= 3 && { backgroundColor: colors.green },
                      ]}
                    />
                  </View>

                  <View style={styles.checklistContainer}>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        name={hasMinLength ? 'checkmark-circle-outline' : 'ellipse-outline'}
                        size={13}
                        color={hasMinLength ? colors.green : colors.onSurfaceMuted}
                      />
                      <AppText
                        variant="caption"
                        color={hasMinLength ? colors.green : colors.onSurfaceMuted}
                        style={styles.checklistText}
                      >
                        {isIt ? 'Almeno 8 caratteri' : 'At least 8 characters'}
                      </AppText>
                    </View>

                    <View style={styles.checklistItem}>
                      <Ionicons
                        name={hasUpperAndLower ? 'checkmark-circle-outline' : 'ellipse-outline'}
                        size={13}
                        color={hasUpperAndLower ? colors.green : colors.onSurfaceMuted}
                      />
                      <AppText
                        variant="caption"
                        color={hasUpperAndLower ? colors.green : colors.onSurfaceMuted}
                        style={styles.checklistText}
                      >
                        {isIt ? 'Maiuscole e minuscole' : 'Upper & lowercase'}
                      </AppText>
                    </View>

                    <View style={styles.checklistItem}>
                      <Ionicons
                        name={hasNumberOrSymbol ? 'checkmark-circle-outline' : 'ellipse-outline'}
                        size={13}
                        color={hasNumberOrSymbol ? colors.green : colors.onSurfaceMuted}
                      />
                      <AppText
                        variant="caption"
                        color={hasNumberOrSymbol ? colors.green : colors.onSurfaceMuted}
                        style={styles.checklistText}
                      >
                        {isIt ? 'Numeri o simboli' : 'Numbers or symbols'}
                      </AppText>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.brand} />
                <AppText variant="caption" style={styles.fieldLabel}>
                  {isIt ? 'Conferma Password' : 'Confirm Password'}
                </AppText>
              </View>
              <DebossedInput
                placeholder={isIt ? 'Ripeti la tua password' : 'Repeat your password'}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                textContentType="newPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                rightIcon={
                  confirmPassword.length > 0 ? (
                    <Ionicons
                      name={passwordsMatch ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      size={18}
                      color={passwordsMatch ? colors.green : colors.red}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.onSurfaceMuted}
                      />
                    </TouchableOpacity>
                  )
                }
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <AppText variant="caption" color={colors.red} style={{ fontSize: 11, marginTop: 2 }}>
                  {isIt ? 'Le password non coincidono.' : 'Passwords do not match.'}
                </AppText>
              )}
            </View>
          </View>

          {/* Legal Consents Block */}
          <View style={styles.consentBlock}>
            <View style={styles.consentHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="document-text-outline" size={15} color={colors.onSurfaceMuted} />
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.consentHeading}>
                  {isIt ? 'Privacy e consensi legali' : 'Privacy & legal consents'}
                </AppText>
              </View>

              {/* 1-Tap Toggle All Consents */}
              <TouchableOpacity
                onPress={toggleAcceptAll}
                style={styles.acceptAllPill}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={acceptLegal && acceptHealthOrOwner ? 'checkbox-outline' : 'square-outline'}
                  size={14}
                  color={colors.brand}
                />
                <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700', fontSize: 11 }}>
                  {isIt ? 'Accetta tutti' : 'Accept all'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Consent Card 1: Terms & Privacy */}
            <ConsentCard
              checked={acceptLegal}
              onPress={() => setAcceptLegal(!acceptLegal)}
              label={t('consent_legal_label')}
              sub={t('consent_legal_sub')}
              docs={[
                { label: t('legal_read_terms'), tab: 'terms' },
                { label: t('legal_read_privacy'), tab: 'privacy' },
              ]}
            />

            {/* Consent Card 2: Health / Owner Responsibility */}
            <ConsentCard
              checked={acceptHealthOrOwner}
              onPress={() => setAcceptHealthOrOwner(!acceptHealthOrOwner)}
              label={role === 'customer' ? t('consent_health_label') : t('consent_owner_label')}
              sub={role === 'customer' ? t('consent_health_sub') : t('consent_owner_sub')}
              docs={role === 'customer' ? [{ label: t('legal_read_safety'), tab: 'safety' }] : undefined}
            />
          </View>
        </GlassScreenScroll>

        {/* Sticky Bottom Actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <SurfaceButton
            label={role === 'customer' ? (isIt ? 'Continua al passo 2' : 'Continue to step 2') : (isIt ? 'Crea account Ristoratore' : 'Create Owner Account')}
            onPress={submit}
            disabled={busy || !formOk}
            loading={busy}
            icon="arrow-forward-outline"
          />
          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.footerNote}>
            {t('consent_both_required')}
          </AppText>
          <Pressable
            style={styles.switchButton}
            onPress={() => router.replace(`/login?role=${role}` as any)}
          >
            <AppText variant="bodyBold" color={colors.brand} style={{ textAlign: 'center' }}>
              {t('have_account_prompt')}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ConsentCard({
  checked,
  onPress,
  label,
  sub,
  docs,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  sub: string;
  docs?: { label: string; tab: string }[];
}) {
  return (
    <View style={[styles.consentCard, checked ? styles.consentCardOn : styles.consentCardOff]}>
      <TouchableOpacity style={styles.consentMain} onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <Ionicons name="checkmark-outline" size={14} color="#FFFFFF" /> : null}
        </View>
        <View style={styles.consentText}>
          <AppText
            variant="bodyBold"
            color={checked ? colors.onSurface : colors.onSurface}
            style={{ fontWeight: '700', fontSize: 13 }}
          >
            {label}
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.consentSub}>
            {sub}
          </AppText>
        </View>
      </TouchableOpacity>
      {docs?.length ? (
        <View style={styles.docLinks}>
          {docs.map((d) => (
            <TouchableOpacity
              key={d.tab}
              onPress={() => router.push(`/legal-docs?tab=${d.tab}` as '/legal-docs')}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={styles.docLinkPill}
            >
              <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700', fontSize: 11 }}>
                {d.label}
              </AppText>
              <Ionicons name="chevron-forward-outline" size={12} color={colors.brand} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
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
  progressContainer: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  stepBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  progressPercent: {
    fontWeight: '700',
    fontSize: 12,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: 2,
  },
  heading: {
    gap: 6,
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
  strengthBlock: {
    gap: 6,
    marginTop: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  strengthBar: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 1.5,
  },
  checklistContainer: {
    gap: 4,
    marginTop: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistText: {
    fontSize: 11,
    fontWeight: '500',
  },
  consentBlock: {
    gap: spacing.sm,
  },
  consentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  consentHeading: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  acceptAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  consentCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1.5,
  },
  consentCardOff: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  consentCardOn: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
  },
  consentMain: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  consentText: {
    flex: 1,
    gap: 2,
  },
  consentSub: {
    lineHeight: 16,
    fontSize: 11,
  },
  docLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingLeft: 30,
  },
  docLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerNote: {
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 11,
    paddingHorizontal: spacing.sm,
  },
  switchButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
