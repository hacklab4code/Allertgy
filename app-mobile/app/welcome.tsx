import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, type Role } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { AppText, GlassCard, GlassScreenScroll, PuffyButton, Screen } from '../src/components/ui';
import { colors, spacing, radius, font, puffyShadow } from '../src/theme';

export default function Welcome() {
  const [step, setStep] = useState<'select_role' | 'slides'>('select_role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [slide, setSlide] = useState(0);
  const { language, setRole } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const customerSlides = [
    { icon: 'restaurant' as const, title: t('slide_c1_title'), text: t('slide_c1_text') },
    { icon: 'shield-checkmark' as const, title: t('slide_c2_title'), text: t('slide_c2_text') },
    { icon: 'ellipse' as const, title: t('slide_c3_title'), text: t('slide_c3_text') },
  ];

  const ownerSlides = [
    { icon: 'clipboard' as const, title: t('slide_o1_title'), text: t('slide_o1_text') },
    { icon: 'happy' as const, title: t('slide_o2_title'), text: t('slide_o2_text') },
    { icon: 'stats-chart' as const, title: t('slide_o3_title'), text: t('slide_o3_text') },
  ];

  const slides = selectedRole === 'owner' ? ownerSlides : customerSlides;
  const current = slides[slide];

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRole(role);
  };

  return (
    <Screen edges={false} ambient>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <LanguageFlagsRow />
      </View>

      <GlassScreenScroll bounces={false} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" color={colors.brand}>{t('allertgyTitle')}</AppText>

        {step === 'select_role' ? (
          <View style={styles.roleArea}>
            <AppText variant="h1">{t('welcome')}</AppText>
            <AppText variant="subtitle">{t('welcome_subtitle')}</AppText>

            <GlassCard
              onPress={() => handleSelectRole('customer')}
              style={[styles.roleCard, selectedRole === 'customer' && styles.roleCardActive]}
            >
              <View style={[styles.roleIcon, { backgroundColor: colors.brandTertiary }]}>
                <Ionicons name="person" size={28} color={colors.brand} />
              </View>
              <AppText variant="title">{t('role_customer')}</AppText>
              <AppText variant="subtitle">{t('role_customer_desc')}</AppText>
            </GlassCard>

            <GlassCard
              onPress={() => handleSelectRole('owner')}
              style={[styles.roleCard, selectedRole === 'owner' && styles.roleCardActive]}
            >
              <View style={[styles.roleIcon, { backgroundColor: colors.greenSoft }]}>
                <Ionicons name="restaurant" size={28} color={colors.green} />
              </View>
              <AppText variant="title">{t('role_owner')}</AppText>
              <AppText variant="subtitle">{t('role_owner_desc')}</AppText>
            </GlassCard>
          </View>
        ) : (
          <View style={styles.slideArea}>
            <PuffyButton
              label={slide > 0 ? t('back') : (language === 'it' ? 'Cambia ruolo' : 'Change role')}
              onPress={() => {
                if (slide > 0) setSlide(slide - 1);
                else { setStep('select_role'); setSlide(0); }
              }}
              variant="soft"
              fullWidth={false}
              style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}
            />
            <View style={[styles.slideHero, puffyShadow(10)]}>
              <Ionicons name={current.icon} size={64} color={colors.brand} />
            </View>
            <AppText variant="h1">{current.title}</AppText>
            <AppText variant="body">{current.text}</AppText>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.xxl) }]}>
        {step === 'select_role' ? (
          <PuffyButton
            label={t('continue')}
            onPress={() => setStep('slides')}
            disabled={!selectedRole}
            icon="arrow-forward"
          />
        ) : (
          <>
            <PuffyButton
              label={slide < slides.length - 1 ? t('next') : t('start')}
              onPress={() => (slide < slides.length - 1 ? setSlide(slide + 1) : router.push('/login'))}
              icon="arrow-forward"
            />
            <PuffyButton
              label={t('already_have_account')}
              onPress={() => router.push('/login')}
              variant="soft"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { backgroundColor: colors.surface },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.lg },
  roleArea: { gap: spacing.lg, marginTop: spacing.md },
  roleCard: { gap: spacing.sm },
  roleCardActive: { borderColor: colors.brand, backgroundColor: colors.brand50 },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideArea: { gap: spacing.lg, marginTop: spacing.xl, alignItems: 'center' },
  slideHero: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.brand },
  bottomBar: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
