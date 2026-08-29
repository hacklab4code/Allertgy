import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { api } from '../src/api/client';
import {
  AppText,
  DebossedInput,
  GlassScreenScroll,
  Screen,
  Section,
  SurfaceButton,
} from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, spacing } from '../src/theme';

/** Dati account: nome, email (sola lettura), cambio password. */
export default function AccountSettings() {
  const { email, language } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState(email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.getProfile();
        if (cancelled) return;
        setDisplayName(p.display_name?.trim() || '');
        setProfileEmail(p.email || email || '');
      } catch (e) {
        if (!cancelled) {
          Alert.alert(
            isIt ? 'Errore' : 'Error',
            (e as Error).message || (isIt ? 'Impossibile caricare i dati account.' : 'Could not load account data.'),
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, [email, isIt]);

  const saveName = async () => {
    const name = displayName.trim();
    if (!name) {
      setNameError(isIt ? 'Inserisci un nome' : 'Enter a name');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const p = await api.updateProfile(name);
      setDisplayName(p.display_name?.trim() || name);
      Alert.alert(
        isIt ? 'Salvato' : 'Saved',
        isIt ? 'Nome aggiornato.' : 'Name updated.',
      );
    } catch (e) {
      setNameError((e as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword) {
      setPasswordError(isIt ? 'Inserisci la password attuale' : 'Enter current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(isIt ? 'La nuova password deve avere almeno 8 caratteri' : 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(isIt ? 'Le due password non coincidono' : 'Passwords do not match');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(
        isIt ? 'Password aggiornata' : 'Password updated',
        isIt ? 'Usa la nuova password al prossimo accesso.' : 'Use the new password next time you sign in.',
      );
    } catch (e) {
      setPasswordError((e as Error).message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen options={{ title: isIt ? 'Dati account' : 'Account details' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <GlassScreenScroll headerFloat={false} keyboardShouldPersistTaps="handled">
          <AppText variant="subtitle" style={styles.intro}>
            {isIt
              ? 'Modifica il nome visualizzato e la password. L’email di accesso non si può cambiare da qui.'
              : 'Update your display name and password. Sign-in email cannot be changed here.'}
          </AppText>

          <Section title={isIt ? 'Profilo' : 'Profile'} card>
            <View style={styles.field}>
              <AppText variant="caption">{isIt ? 'Nome' : 'Name'}</AppText>
              <DebossedInput
                placeholder={isIt ? 'Il tuo nome' : 'Your name'}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                editable={!loadingProfile && !savingName}
              />
            </View>
            <View style={styles.field}>
              <AppText variant="caption">Email</AppText>
              <DebossedInput
                value={profileEmail}
                editable={false}
                selectTextOnFocus={false}
              />
              <AppText variant="caption" color={colors.onSurfaceMuted}>
                {isIt
                  ? 'Per cambiare email contatta supporto@allertgy.it'
                  : 'To change email contact supporto@allertgy.it'}
              </AppText>
            </View>
            {nameError ? (
              <AppText variant="caption" color={colors.red}>{nameError}</AppText>
            ) : null}
            <SurfaceButton
              label={isIt ? 'Salva nome' : 'Save name'}
              onPress={saveName}
              disabled={loadingProfile || savingName || !displayName.trim()}
              loading={savingName}
            />
          </Section>

          <Section title={isIt ? 'Cambia password' : 'Change password'} card>
            <View style={styles.field}>
              <AppText variant="caption">{isIt ? 'Password attuale' : 'Current password'}</AppText>
              <DebossedInput
                placeholder="••••••••"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
                editable={!savingPassword}
              />
            </View>
            <View style={styles.field}>
              <AppText variant="caption">{isIt ? 'Nuova password' : 'New password'}</AppText>
              <DebossedInput
                placeholder={isIt ? 'Min. 8 caratteri, maiuscole e numeri' : 'Min. 8 chars, upper & digits'}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                editable={!savingPassword}
              />
            </View>
            <View style={styles.field}>
              <AppText variant="caption">{isIt ? 'Conferma nuova password' : 'Confirm new password'}</AppText>
              <DebossedInput
                placeholder={isIt ? 'Ripeti la nuova password' : 'Repeat new password'}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                editable={!savingPassword}
              />
            </View>
            {passwordError ? (
              <AppText variant="caption" color={colors.red}>{passwordError}</AppText>
            ) : null}
            <SurfaceButton
              label={isIt ? 'Aggiorna password' : 'Update password'}
              onPress={savePassword}
              disabled={savingPassword || !currentPassword || newPassword.length < 8}
              loading={savingPassword}
            />
          </Section>
        </GlassScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },
  field: { gap: spacing.xs, marginBottom: spacing.md },
});
