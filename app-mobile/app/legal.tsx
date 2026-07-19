import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { AppText, GlassScreenScroll, PuffyButton, Screen, Section } from '../src/components/ui';
import { colors, spacing, MIN_TOUCH_TARGET } from '../src/theme';

function Check({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <Pressable style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <AppText variant="bodyBold" color="#fff">✓</AppText> : null}
      </View>
      <AppText variant="caption" style={styles.checkText}>{text}</AppText>
    </Pressable>
  );
}

function DocLink({ label, tab }: { label: string; tab: string }) {
  return (
    <Pressable onPress={() => router.push(`/legal-docs?tab=${tab}` as '/legal-docs')}>
      <AppText variant="caption" color={colors.brand} style={styles.docLink}>
        {label} ›
      </AppText>
    </Pressable>
  );
}

export default function LegalScreen() {
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [health, setHealth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setLegalStatus, language } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = await api.acceptLegalConsents(health);
      setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const ready = age && terms && privacy && health;

  return (
    <Screen edges={false} ambient>
      <Stack.Screen options={{ headerRight: () => <LanguageFlagsRow inHeader /> }} />

      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        <AppText variant="h1" style={styles.icon}>⚖️</AppText>
        <AppText variant="h2" style={styles.title}>{t('legal_title')}</AppText>
        <AppText variant="body" style={styles.text}>{t('legal_intro')}</AppText>

        <Section title={t('legal_read_before')} card>
          <View style={styles.docLinks}>
            <DocLink label={t('legal_read_terms')} tab="terms" />
            <DocLink label={t('legal_read_privacy')} tab="privacy" />
            <DocLink label={t('legal_read_safety')} tab="safety" />
          </View>
        </Section>

        {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}

        <Section title={isIt ? 'Consensi richiesti' : 'Required consents'} card>
          <Check checked={age} onPress={() => setAge(!age)} text={t('legal_age')} />
          <Check checked={terms} onPress={() => setTerms(!terms)} text={t('legal_accept_terms')} />
          <Check checked={privacy} onPress={() => setPrivacy(!privacy)} text={t('legal_accept_privacy')} />
          <Check checked={health} onPress={() => setHealth(!health)} text={t('legal_accept_health')} />
        </Section>
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <PuffyButton
          label={busy ? (isIt ? 'Salvataggio…' : 'Saving…') : t('accept_continue')}
          onPress={accept}
          disabled={!ready || busy}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  icon: { textAlign: 'center' },
  title: { textAlign: 'center' },
  text: { textAlign: 'center', color: colors.onSurfaceMuted, lineHeight: 22 },
  docLinks: { gap: spacing.sm },
  docLink: { fontWeight: '700', lineHeight: 22 },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', minHeight: MIN_TOUCH_TARGET },
  checkbox: {
    width: 24, height: 24, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkText: { flex: 1, color: colors.onSurfaceMuted, lineHeight: 19 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
