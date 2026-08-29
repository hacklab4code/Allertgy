import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import {
  AppText,
  DebossedInput,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
  Screen,
} from '../src/components/ui';
import { colors, spacing } from '../src/theme';

/** Aperta dal deep link allertgy://reset-password?token=... nell'email di recupero. */
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const submit = async () => {
    if (password !== confirm) {
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
    <Screen edges={false} ambient>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <GlassScreenScroll keyboardShouldPersistTaps="handled">
          <AppText variant="h2" color={colors.brand}>AllerTgy</AppText>
          <View style={styles.heading}>
            <AppText variant="h1">Nuova password</AppText>
            <AppText variant="subtitle">
              Scegli una nuova password per il tuo account.
            </AppText>
          </View>

          {!token ? (
            <AppText variant="caption" color={colors.red}>
              Link non valido: manca il token. Richiedi un nuovo link.
            </AppText>
          ) : null}
          {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}

          {done ? (
            <GlassCard style={styles.doneCard}>
              <AppText variant="body" color={colors.brand}>
                Password aggiornata. Ora puoi accedere.
              </AppText>
              <SurfaceButton label="Vai all'accesso" onPress={() => router.replace('/login')} />
            </GlassCard>
          ) : (
            <GlassCard style={styles.formCard}>
              <View style={styles.field}>
                <AppText variant="caption">Nuova password</AppText>
                <DebossedInput
                  placeholder="Minimo 8 caratteri, maiuscole e numeri"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <View style={styles.field}>
                <AppText variant="caption">Conferma password</AppText>
                <DebossedInput
                  placeholder="Ripeti la nuova password"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
              <SurfaceButton
                label="Imposta password"
                onPress={submit}
                disabled={busy || !token || password.length < 8}
                loading={busy}
              />
            </GlassCard>
          )}
        </GlassScreenScroll>
      </KeyboardAvoidingView>
      <View style={{ height: Math.max(insets.bottom, spacing.md) }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.md },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  formCard: { gap: spacing.sm },
  doneCard: { gap: spacing.md },
});
