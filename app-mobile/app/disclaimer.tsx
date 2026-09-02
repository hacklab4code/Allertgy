import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { AppText, GlassScreenScroll, SurfaceButton, Screen, ScreenTopHeader } from '../src/components/ui';
import { colors, spacing, MIN_TOUCH_TARGET, radius, softShadow } from '../src/theme';
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
    <Screen edges={false} ambient style={styles.screen}>
      <ScreenTopHeader
        title={isIt ? 'Sicurezza a tavola' : 'Table Safety'}
        showBack={false}
        rightElement={<LanguageFlagsRow inHeader />}
      />

      <GlassScreenScroll headerFloat={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View ref={titleRef} onLayout={onTitleLayout} style={styles.titleBlock}>
          <View style={[styles.heroIconCircle, softShadow(6)]}>
            <Ionicons name="shield-checkmark-outline" size={44} color={colors.brand} />
          </View>

          <View style={styles.badgePill}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.brand} />
            <AppText variant="caption" color={colors.brand} style={styles.badgePillText}>
              {isIt ? 'IMPORTANTE PER LA TUA SALUTE' : 'IMPORTANT FOR YOUR HEALTH'}
            </AppText>
          </View>

          <AppText variant="h2" color={titleInk.ink} style={styles.title}>
            {t('safety_title')}
          </AppText>
          <AppText variant="body" color={titleInk.inkMuted} style={styles.text}>
            {t('safety_intro')}
          </AppText>

          <View style={styles.alertBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.amber} />
            <AppText variant="caption" color={colors.onSurface} style={styles.alertText}>
              {t('safety_alert')}
            </AppText>
          </View>
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

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
            <AppText variant="caption" color={colors.red} style={{ flex: 1 }}>
              {error}
            </AppText>
          </View>
        ) : null}
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <SurfaceButton
          label={t('disclaimer_confirm_btn')}
          onPress={accept}
          disabled={!ready || busy}
          loading={busy}
          icon="checkmark-outline"
        />
      </View>
    </Screen>
  );
}

function Check({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity
      style={[styles.checkRow, checked ? styles.checkRowActive : styles.checkRowInactive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Ionicons name="checkmark-outline" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText variant="caption" color={colors.onSurface} style={styles.checkText}>
        {text}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  titleBlock: { alignItems: 'center', gap: 8 },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand100,
    marginBottom: spacing.xs,
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
  },
  badgePillText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  text: { textAlign: 'center', lineHeight: 21, fontSize: 13 },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.amberBg ?? colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.amberBorder ?? colors.border,
    marginTop: spacing.xs,
  },
  alertText: { flex: 1, lineHeight: 17, fontSize: 12, fontWeight: '600' },
  checkBox: {
    gap: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  checkRowInactive: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  checkRowActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
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
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkText: { flex: 1, lineHeight: 18, fontSize: 12, fontWeight: '500' },
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
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
