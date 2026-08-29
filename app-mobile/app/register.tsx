import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { colors, spacing, radius, MIN_TOUCH_TARGET } from '../src/theme';
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
      ? 'Impossibile connettersi al server. Verifica la tua connessione.'
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

  const [role, setRole] = useState<Role>(params.role || session.role || 'customer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptHealthOrOwner, setAcceptHealthOrOwner] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);
  const { ref: headingRef, ink: headingInk, onLayout: onHeadingLayout } = useAdaptiveMeshInk(true);

  const formOk =
    !!displayName.trim() &&
    !!email.trim() &&
    password.length >= 8 &&
    acceptLegal &&
    acceptHealthOrOwner;

  const pickRole = (next: Role) => {
    setRole(next);
    session.setRole(next);
    setAcceptHealthOrOwner(false);
  };

  const submit = async () => {
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
            <AppText variant="caption" color={headingInk.inkMuted} style={styles.stepLabel}>
              {role === 'customer'
                ? (isIt ? 'Passo 1 di 2 · Account' : 'Step 1 of 2 · Account')
                : (isIt ? 'Crea account ristoratore' : 'Create owner account')}
            </AppText>
            <AppText variant="h1" color={headingInk.ink}>
              {t('register_title')}
            </AppText>
            <AppText variant="subtitle" color={headingInk.inkMuted} style={styles.subtitleText}>
              {role === 'customer'
                ? t('register_subtitle')
                : (isIt
                  ? 'Crea l’account per gestire menù, allergeni e QR dei tavoli.'
                  : 'Create an account to manage menus, allergens and table QR codes.')}
            </AppText>
          </View>

          {/* Ruolo: riepilogo modificabile (scelta fatta in welcome) */}
          <View style={styles.roleRow}>
            <Pressable
              onPress={() => pickRole('customer')}
              style={[styles.roleChip, role === 'customer' && styles.roleChipOn]}
            >
              <Ionicons
                name={role === 'customer' ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={role === 'customer' ? colors.brand : colors.onSurfaceMuted}
              />
              <AppText
                variant="caption"
                color={role === 'customer' ? colors.brand : colors.onSurfaceMuted}
                style={{ fontWeight: role === 'customer' ? '800' : '600' }}
              >
                {t('role_customer_short')}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => pickRole('owner')}
              style={[styles.roleChip, role === 'owner' && styles.roleChipOnOwner]}
            >
              <Ionicons
                name={role === 'owner' ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={role === 'owner' ? colors.green : colors.onSurfaceMuted}
              />
              <AppText
                variant="caption"
                color={role === 'owner' ? colors.green : colors.onSurfaceMuted}
                style={{ fontWeight: role === 'owner' ? '800' : '600' }}
              >
                {t('role_owner_short')}
              </AppText>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AppText variant="bodyBold" color={colors.red}>
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={styles.field}>
            <AppText variant="caption">{t('name_label')}</AppText>
            <DebossedInput
              placeholder={isIt ? 'Il tuo nome' : 'Your name'}
              autoCapitalize="words"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

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

          <View style={styles.field}>
            <AppText variant="caption">{t('password_label')}</AppText>
            <DebossedInput
              placeholder={isIt ? 'Minimo 8 caratteri' : 'Minimum 8 characters'}
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
            <View style={styles.passwordHint}>
              <Ionicons
                name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={password.length >= 8 ? colors.green : colors.onSurfaceMuted}
              />
              <AppText
                variant="caption"
                color={password.length >= 8 ? colors.green : colors.onSurfaceMuted}
                style={{ fontWeight: password.length >= 8 ? '700' : '400' }}
              >
                {isIt ? 'Almeno 8 caratteri' : 'At least 8 characters'}
              </AppText>
            </View>
          </View>

          <View style={styles.consentBlock}>
            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.consentHeading}>
              {isIt ? 'Privacy e documenti legali' : 'Privacy and legal documents'}
            </AppText>

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

            <ConsentCard
              checked={acceptHealthOrOwner}
              onPress={() => setAcceptHealthOrOwner(!acceptHealthOrOwner)}
              label={role === 'customer' ? t('consent_health_label') : t('consent_owner_label')}
              sub={role === 'customer' ? t('consent_health_sub') : t('consent_owner_sub')}
              docs={role === 'customer' ? [{ label: t('legal_read_safety'), tab: 'safety' }] : undefined}
            />
          </View>
        </GlassScreenScroll>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <SurfaceButton
            label={isIt ? 'Crea account' : t('register_btn')}
            onPress={submit}
            disabled={busy || !formOk}
            loading={busy}
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
    <View style={[styles.consentCard, checked && styles.consentCardOn]}>
      <TouchableOpacity style={styles.consentMain} onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <Ionicons name="checkmark" size={14} color={colors.onBrand} /> : null}
        </View>
        <View style={styles.consentText}>
          <AppText
            variant="bodyBold"
            color={checked ? colors.onSurface : colors.onSurface}
            style={{ fontWeight: '700' }}
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
            >
              <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                {d.label} ›
              </AppText>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  heading: { gap: spacing.xs, marginBottom: spacing.md },
  stepLabel: { fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', fontSize: 11 },
  subtitleText: { lineHeight: 21 },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: MIN_TOUCH_TARGET,
  },
  roleChipOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  roleChipOnOwner: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  errorBanner: {
    backgroundColor: colors.redSoft ?? '#fee2e2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
  },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  consentBlock: { gap: spacing.sm, marginTop: spacing.xs },
  consentHeading: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
    marginBottom: 2,
  },
  consentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  consentCardOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  consentMain: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  consentText: { flex: 1, gap: 2 },
  consentSub: { lineHeight: 18 },
  docLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingLeft: 30,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm },
  switchButton: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
});
