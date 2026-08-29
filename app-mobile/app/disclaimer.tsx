import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { AppText, GlassScreenScroll, SurfaceButton, Screen } from '../src/components/ui';
import { colors, spacing, MIN_TOUCH_TARGET } from '../src/theme';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';

export default function Disclaimer() {
  const [talkToStaff, setTalkToStaff] = useState(false);
  const [supportOnly, setSupportOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setDisclaimer, language } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const { ref: titleRef, ink: titleInk, onLayout: onTitleLayout } = useAdaptiveMeshInk(true);

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      await api.acceptDisclaimer();
      setDisclaimer(true);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message || (isIt ? 'Errore di rete. Riprova.' : 'Network error. Try again.'));
    }
    setBusy(false);
  };

  const ready = talkToStaff && supportOnly;

  return (
    <Screen edges={false} ambient>
      <Stack.Screen options={{ headerRight: () => <LanguageFlagsRow inHeader /> }} />

      <GlassScreenScroll headerFloat={false} showsVerticalScrollIndicator={false}>
        <View ref={titleRef} onLayout={onTitleLayout} style={styles.titleBlock}>
          <AppText variant="h1" style={styles.icon}>⚠️</AppText>
          <AppText variant="h2" color={titleInk.ink} style={styles.title}>{t('safety_title')}</AppText>
          <AppText variant="body" color={titleInk.inkMuted} style={styles.text}>
            {t('safety_intro')}
            {'\n\n'}
            <AppText variant="bodyBold" color={titleInk.ink}>{t('safety_alert')}</AppText>
          </AppText>
        </View>

        <View style={styles.checkBox}>
          <Check
            checked={talkToStaff}
            onPress={() => setTalkToStaff(!talkToStaff)}
            text={t('disclaimer_staff_promise')}
          />
          <Check
            checked={supportOnly}
            onPress={() => setSupportOnly(!supportOnly)}
            text={t('disclaimer_support_only')}
          />
        </View>

        {error ? <AppText variant="caption" color={colors.red} style={styles.errorText}>{error}</AppText> : null}
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <SurfaceButton
          label={t('disclaimer_confirm_btn')}
          onPress={accept}
          disabled={!ready || busy}
          loading={busy}
        />
      </View>
    </Screen>
  );
}

function Check({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <AppText variant="bodyBold" color={colors.onBrand}>✓</AppText> : null}
      </View>
      <AppText variant="caption" style={styles.checkText}>{text}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.md },
  titleBlock: { alignItems: 'center' },
  icon: { textAlign: 'center', marginBottom: spacing.sm },
  title: { textAlign: 'center', marginBottom: spacing.md },
  text: { textAlign: 'center', lineHeight: 23 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', minHeight: MIN_TOUCH_TARGET },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { flex: 1, lineHeight: 20 },
  errorText: { textAlign: 'center', marginTop: spacing.sm },
});
