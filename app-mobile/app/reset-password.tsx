import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';
import {
  AppText,
  DebossedInput,
  GlassScreenScroll,
  SurfaceButton,
  Screen,
} from '../src/components/ui';
import { colors, spacing, radius, softShadow } from '../src/theme';

/** Aperta dal deep link allertgy://reset-password?token=... nell'email di recupero. */
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);

  const passwordsMatch = password.length > 0 && password === confirm;
  const isFormValid = !!token && password.length >= 8 && passwordsMatch;

  const submit = async () => {
    if (!passwordsMatch) {
      setError('Le due password non coincidono');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.resetPassword(token ?? '', password);
      setDone(true);
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
        {/* Header */}
        <View
          ref={headerRef}
          onLayout={onHeaderLayout}
          style={[styles.topHeaderBar, { paddingTop: Math.max(insets.top, 12) }]}
        >
          <TouchableOpacity
            onPress={() => router.replace('/login')}
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Badge & Title */}
          <View style={styles.heading}>
            <View style={styles.badgePill}>
              <Ionicons name="key-outline" size={13} color={colors.brand} />
              <AppText variant="caption" color={colors.brand} style={styles.badgePillText}>
                NUOVA PASSWORD
              </AppText>
            </View>

            <AppText variant="h1" style={styles.mainTitle}>
              Reimposta password
            </AppText>
            <AppText variant="subtitle" color={colors.onSurfaceMuted} style={styles.subtitle}>
              Inserisci la tua nuova password sicura per riaccedere al tuo profilo.
            </AppText>
          </View>

          {!token ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <AppText variant="bodyBold" color={colors.red} style={{ flex: 1, fontSize: 13 }}>
                Link di reimpostazione non valido o mancante del token. Richiedi un nuovo link di recupero.
              </AppText>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <AppText variant="bodyBold" color={colors.red} style={{ flex: 1, fontSize: 13 }}>
                {error}
              </AppText>
            </View>
          ) : null}

          {done ? (
            <View style={[styles.doneCard, softShadow(4)]}>
              <View style={styles.doneIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.green} />
              </View>
              <AppText variant="h2" style={{ textAlign: 'center', fontSize: 18 }}>
                Password aggiornata con successo!
              </AppText>
              <AppText variant="body" color={colors.onSurfaceMuted} style={{ textAlign: 'center', fontSize: 13 }}>
                Ora puoi accedere con la tua nuova password.
              </AppText>
              <SurfaceButton
                label="Vai all'accesso"
                onPress={() => router.replace('/login')}
                icon="arrow-forward-outline"
              />
            </View>
          ) : (
            <View style={[styles.formCard, softShadow(2)]}>
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="lock-closed-outline" size={15} color={colors.brand} />
                  <AppText variant="caption" style={styles.fieldLabel}>Nuova password</AppText>
                </View>
                <DebossedInput
                  placeholder="Minimo 8 caratteri"
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
                        size={20}
                        color={colors.onSurfaceMuted}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={colors.brand} />
                  <AppText variant="caption" style={styles.fieldLabel}>Conferma password</AppText>
                </View>
                <DebossedInput
                  placeholder="Ripeti la nuova password"
                  secureTextEntry={!showConfirm}
                  value={confirm}
                  onChangeText={setConfirm}
                  rightIcon={
                    confirm.length > 0 ? (
                      <Ionicons
                        name={passwordsMatch ? 'checkmark-circle-outline' : 'close-circle-outline'}
                        size={18}
                        color={passwordsMatch ? colors.green : colors.red}
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={() => setShowConfirm(!showConfirm)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.onSurfaceMuted}
                        />
                      </TouchableOpacity>
                    )
                  }
                />
                {confirm.length > 0 && !passwordsMatch && (
                  <AppText variant="caption" color={colors.red} style={{ fontSize: 11, marginTop: 2 }}>
                    Le password non coincidono.
                  </AppText>
                )}
              </View>

              <SurfaceButton
                label="Imposta nuova password"
                onPress={submit}
                disabled={busy || !isFormValid}
                loading={busy}
                icon="checkmark-outline"
              />
            </View>
          )}
        </GlassScreenScroll>
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
  heading: {
    gap: 6,
  },
  badgePill: {
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
  badgePillText: {
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  mainTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
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
  doneCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.md,
  },
  doneIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
