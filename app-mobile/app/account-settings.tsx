import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api, resolveApiMediaUrl } from '../src/api/client';
import {
  AppText,
  DebossedInput,
  GlassScreenScroll,
  Screen,
  ScreenTopHeader,
  Section,
  SurfaceButton,
} from '../src/components/ui';
import { useSession } from '../src/store/session';
import { useIsDarkMode } from '../src/hooks/useAppTheme';
import { colors, radius, spacing } from '../src/theme';

/** Dati account: nome, email (sola lettura), cambio password, cancellazione account GDPR. */
export default function AccountSettings() {
  const { email, language, logout } = useSession();
  const profilePhotoUrl = useSession((s) => s.profilePhotoUrl);
  const setProfilePhotoUrl = useSession((s) => s.setProfilePhotoUrl);
  const isIt = (language || 'it').toLowerCase() === 'it';
  const isDark = useIsDarkMode();

  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState(email ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(profilePhotoUrl);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setPhotoUrl(profilePhotoUrl);
  }, [profilePhotoUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.getProfile();
        if (cancelled) return;
        setDisplayName(p.display_name?.trim() || '');
        setProfileEmail(p.email || email || '');
        const photo = await api.getProfilePhoto().catch(() => null);
        if (!cancelled && photo?.photo_url) {
          const resolved = resolveApiMediaUrl(photo.photo_url);
          setPhotoUrl(resolved);
          setProfilePhotoUrl(resolved);
        }
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
  }, [email, isIt, setProfilePhotoUrl]);

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        isIt ? 'Permesso negato' : 'Permission denied',
        isIt
          ? 'Abilita l\'accesso alla libreria foto nelle impostazioni per cambiare la foto profilo.'
          : 'Enable photo library access in settings to change your profile photo.',
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
    setUploadingPhoto(true);
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
      setUploadingPhoto(false);
    }
  };

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

  const handleDeleteAccount = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      isIt ? 'Eliminare definitivamente l\'account?' : 'Permanently delete account?',
      isIt
        ? 'Questa operazione è irreversibile e immediata. Verranno cancellati per sempre il tuo account, il profilo allergenico, i profili familiari, il diario reazioni, la dispensa e tutti i documenti sanitari caricati.'
        : 'This action is irreversible and immediate. Your account, allergy profile, family sub-profiles, reaction logs, pantry and all uploaded medical files will be permanently deleted.',
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? 'Elimina definitivamente' : 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await api.deleteAccount();
              logout();
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert(
                isIt ? 'Account eliminato' : 'Account deleted',
                isIt
                  ? 'Il tuo account e tutti i dati correlati sono stati eliminati definitivamente.'
                  : 'Your account and all related data have been permanently erased.',
              );
              router.replace('/welcome');
            } catch (e) {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
              Alert.alert(
                isIt ? 'Errore' : 'Error',
                (e as Error).message || (isIt ? 'Impossibile eliminare l\'account. Riprova più tardi.' : 'Failed to delete account. Try again later.'),
              );
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader title={isIt ? 'Dati account' : 'Account details'} />
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
            {/* Foto profilo */}
            <View style={styles.avatarSection}>
              <Pressable
                onPress={changePhoto}
                style={({ pressed }) => [styles.avatarWrap, pressed && styles.avatarPressed]}
                accessibilityRole="button"
                accessibilityLabel={isIt ? 'Cambia foto profilo' : 'Change profile photo'}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarFallback, isDark && styles.avatarDark]}>
                    <AppText style={[styles.avatarLetter, isDark && { color: '#F1FEC8' }]}>
                      {(displayName || email || 'A')[0].toUpperCase()}
                    </AppText>
                  </View>
                )}
                <View style={[styles.avatarBadge, isDark && { backgroundColor: '#F1FEC8' }]}>
                  <Ionicons name="camera-outline" size={12} color={isDark ? '#23212C' : colors.brand} />
                </View>
              </Pressable>
              <Pressable onPress={changePhoto} hitSlop={8}>
                <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                  {uploadingPhoto
                    ? (isIt ? 'Caricamento foto...' : 'Uploading photo...')
                    : (isIt ? 'Tocca per cambiare foto' : 'Tap to change photo')}
                </AppText>
              </Pressable>
            </View>

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

          {/* Sezione GDPR & Eliminazione Account conforme Apple Guideline 5.1.1(v) */}
          <Section title={isIt ? 'Gestione dati e privacy (GDPR)' : 'Data & Privacy (GDPR)'} card>
            <View style={styles.dangerBlock}>
              <View style={styles.dangerHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
                <AppText variant="caption" style={styles.dangerHeaderText}>
                  {isIt
                    ? 'Conformità GDPR e Linee Guida Apple'
                    : 'GDPR & Apple Guidelines Compliance'}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.dangerDesc}>
                {isIt
                  ? 'Hai il pieno controllo dei tuoi dati. Puoi eliminare definitivamente l\'account, i referti medici e ogni informazione allergenica associata.'
                  : 'You have full control of your data. You can permanently erase your account, medical documents, and all associated allergen information.'}
              </AppText>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.deleteBtnPressed,
                  deletingAccount && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isIt ? 'Elimina account e dati sanitari' : 'Delete account and health data'}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color={colors.red} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                    <AppText style={styles.deleteBtnText}>
                      {isIt ? 'Elimina account e dati sanitari' : 'Delete account and health data'}
                    </AppText>
                  </>
                )}
              </Pressable>
            </View>
          </Section>
        </GlassScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  avatarLetter: {
    color: colors.brand,
    fontSize: 28,
    fontWeight: '700',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  field: { gap: spacing.xs, marginBottom: spacing.md },
  dangerBlock: {
    gap: spacing.sm,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerHeaderText: {
    fontWeight: '700',
    color: colors.onSurface,
  },
  dangerDesc: {
    lineHeight: 18,
    fontSize: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.red,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    marginTop: spacing.xs,
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    transform: [{ scale: 0.98 }],
  },
  deleteBtnText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
});
