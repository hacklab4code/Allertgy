import { Stack, router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppText, GlassScreenScroll, PuffyButton, Screen, Section } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { getAllergenName, t } from '../src/engine/translations';
import { colors, spacing, MIN_TOUCH_TARGET } from '../src/theme';

export default function EmergencyScreen() {
  const {
    allergie: primaryAllergies,
    emergencyMedicines,
    language,
    emergencyContactName,
    emergencyContactPhone,
    subProfiles,
    activeProfileId,
    email,
  } = useSession();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const profileLabel = activeProfile?.name
    ?? (email ? email.split('@')[0] : (isIt ? 'Profilo personale' : 'Personal profile'));

  const handleCall112 = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL('tel:112').catch(() => {
      alert(isIt ? 'Chiamata non supportata su questo dispositivo.' : 'Calls not supported on this device.');
    });
  };

  const handleCallContact = () => {
    if (!emergencyContactPhone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${emergencyContactPhone}`).catch(() => {
      alert(isIt ? 'Chiamata non supportata su questo dispositivo.' : 'Calls not supported on this device.');
    });
  };

  const handleSendSMS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const listAllergie = allergie.map((a) => getAllergenName(a, language)).join(', ');
    const listMedicines = emergencyMedicines || t('none_declared', language);
    const bodyText = `${t('sos_message_prefix', language)} ${listAllergie}. ${t('sos_medicines_label', language)} ${listMedicines}.`;
    const smsUrl = emergencyContactPhone
      ? `sms:${emergencyContactPhone}?body=${encodeURIComponent(bodyText)}`
      : `sms:?body=${encodeURIComponent(bodyText)}`;

    Linking.openURL(smsUrl).catch(() => {
      alert(isIt ? 'SMS non supportato su questo dispositivo.' : 'SMS not supported on this device.');
    });
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          title: t('emergency_title', language),
          headerStyle: { backgroundColor: '#b91c1c' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '900' },
        }}
      />

      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        <View style={styles.alertCard}>
          <AppText variant="h1" color="#FFFFFF">🚨</AppText>
          <AppText variant="title" color="#FFFFFF" style={{ textAlign: 'center' }}>
            {t('emergency_banner', language)}
          </AppText>
          <AppText variant="caption" style={{ textAlign: 'center', color: '#fee2e2' }}>
            {t('emergency_show', language)}
          </AppText>
          <AppText variant="caption" style={styles.profileHint}>
            {isIt ? `Profilo attivo: ${profileLabel}` : `Active profile: ${profileLabel}`}
          </AppText>
        </View>

        <Section
          title={isIt ? 'Allergie attive' : 'Active allergies'}
          subtitle={isIt ? 'Mostra allo staff in caso di emergenza' : 'Show staff in an emergency'}
        >
          {allergie.length === 0 ? (
            <View style={styles.card}>
              <AppText variant="subtitle">{t('no_allergies', language)}</AppText>
              <PuffyButton
                label={isIt ? 'Configura allergie' : 'Set up allergies'}
                onPress={() => router.push('/allergie')}
                variant="soft"
              />
            </View>
          ) : (
            <View style={styles.badgeWrap}>
              {allergie.map((code) => (
                <View key={code} style={styles.allergenBadge}>
                  <AppText variant="caption" style={styles.allergenBadgeText}>
                    ⚠️ {getAllergenName(code, language).toUpperCase()}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section
          title={isIt ? 'Farmaci SOS' : 'Emergency medication'}
          subtitle={isIt ? 'Dal tuo profilo AllerTgy' : 'From your AllerTgy profile'}
        >
          <View style={[styles.card, styles.medsCard]}>
            <AppText variant="bodyBold" color="#991b1b">
              {emergencyMedicines || t('no_drugs', language)}
            </AppText>
            {!emergencyMedicines && (
              <PuffyButton
                label={isIt ? 'Aggiungi nel profilo' : 'Add in profile'}
                onPress={() => router.push('/(tabs)/account')}
                variant="soft"
                style={{ marginTop: spacing.sm }}
              />
            )}
            {emergencyMedicines ? (
              <AppText variant="caption" color="#7f1d1d" style={{ marginTop: spacing.xs }}>
                {t('drug_warning', language)}
              </AppText>
            ) : null}
          </View>
        </Section>
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {emergencyContactPhone ? (
          <Pressable style={[styles.sosBtn, styles.contactBtn]} onPress={handleCallContact}>
            <AppText variant="h2">📞</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color="#FFFFFF">
                {t('call_contact', language)} {emergencyContactName?.toUpperCase() || ''}
              </AppText>
              <AppText variant="caption" color="#d1fae5">{emergencyContactPhone}</AppText>
            </View>
          </Pressable>
        ) : (
          <PuffyButton
            label={isIt ? 'Configura contatto emergenza' : 'Set emergency contact'}
            onPress={() => router.push('/(tabs)/account')}
            variant="secondary"
          />
        )}

        <Pressable style={styles.sosBtn} onPress={handleCall112}>
          <AppText variant="h2">🚑</AppText>
          <View>
            <AppText variant="bodyBold" color="#FFFFFF">{t('call_emergency', language)}</AppText>
            <AppText variant="caption" color="#fca5a5">{t('call_emergency_sub', language)}</AppText>
          </View>
        </Pressable>

        <Pressable style={[styles.sosBtn, styles.smsBtn]} onPress={handleSendSMS}>
          <AppText variant="h2">💬</AppText>
          <View>
            <AppText variant="bodyBold" color="#FFFFFF">{t('send_sos', language)}</AppText>
            <AppText variant="caption" color="#cbd5e1">{t('send_sos_sub', language)}</AppText>
          </View>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <AppText variant="bodyBold" color={colors.onSurfaceMuted}>{t('close_back', language)}</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  alertCard: {
    backgroundColor: '#b91c1c',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileHint: {
    textAlign: 'center',
    color: '#fecaca',
    marginTop: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  medsCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  allergenBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  allergenBadgeText: { color: '#b91c1c', fontWeight: '800' },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#dc2626',
    padding: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 8,
  },
  contactBtn: { backgroundColor: '#059669' },
  smsBtn: { backgroundColor: '#475569' },
  closeBtn: { alignItems: 'center', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});
