import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, type Role } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';
import { AppText, GlassCard, GlassScreenScroll, SurfaceButton, Screen } from '../src/components/ui';
import { colors, spacing, radius, softShadow } from '../src/theme';

export default function Welcome() {
  const [step, setStep] = useState<'select_role' | 'slides'>('select_role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [slide, setSlide] = useState(0);
  const { language, setRole, role: sessionRole } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const sessionRoleOrCustomer = (): Role => selectedRole || sessionRole || 'customer';

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);
  const { ref: headingRef, ink: headingInk, onLayout: onHeadingLayout } = useAdaptiveMeshInk(true);
  const { ref: slideRef, ink: slideInk, onLayout: onSlideLayout } = useAdaptiveMeshInk(true);

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
    <Screen edges={false} ambient style={styles.screen}>
      <View
        ref={headerRef}
        onLayout={onHeaderLayout}
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}
      >
        <AppText variant="h2" color={headerInk.ink} style={styles.brandTitle}>
          AllerTgy
        </AppText>
        <LanguageFlagsRow />
      </View>

      <GlassScreenScroll
        headerFloat={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {step === 'select_role' ? (
          <View style={styles.roleArea}>
            <View
              ref={headingRef}
              onLayout={onHeadingLayout}
              style={styles.headingBox}
            >
              <AppText variant="caption" color={headingInk.inkMuted} style={styles.stepLabel}>
                {language === 'it' ? '1 · Scelta account' : '1 · Account type'}
              </AppText>
              <AppText variant="h1" color={headingInk.ink}>{t('welcome')}</AppText>
              <AppText variant="subtitle" color={headingInk.inkMuted} style={styles.subtitleText}>
                {t('welcome_subtitle')}
              </AppText>
            </View>

            <GlassCard
              onPress={() => handleSelectRole('customer')}
              style={[styles.roleCard, selectedRole === 'customer' && styles.roleCardActive]}
            >
              <View style={[styles.roleIcon, selectedRole === 'customer' ? styles.roleIconActive : { backgroundColor: colors.brandTertiary }]}>
                <Ionicons
                  name="person"
                  size={26}
                  color={selectedRole === 'customer' ? colors.onBrand : colors.brand}
                />
              </View>
              <View style={styles.roleTextGroup}>
                <AppText
                  variant="title"
                  color={selectedRole === 'customer' ? colors.brand : colors.onSurface}
                  style={{ fontWeight: '700' }}
                >
                  {t('role_customer')}
                </AppText>
                <AppText variant="subtitle" style={styles.roleDescText}>{t('role_customer_desc')}</AppText>
              </View>
              <View style={styles.radioBadge}>
                {selectedRole === 'customer' ? (
                  <Ionicons name="checkmark-circle" size={28} color={colors.brand} />
                ) : (
                  <View style={styles.radioBadgeEmpty} />
                )}
              </View>
            </GlassCard>

            <GlassCard
              onPress={() => handleSelectRole('owner')}
              style={[styles.roleCard, selectedRole === 'owner' && styles.roleCardActive]}
            >
              <View style={[styles.roleIcon, selectedRole === 'owner' ? styles.roleIconActiveOwner : { backgroundColor: colors.greenSoft }]}>
                <Ionicons
                  name="restaurant"
                  size={26}
                  color={selectedRole === 'owner' ? '#ffffff' : colors.green}
                />
              </View>
              <View style={styles.roleTextGroup}>
                <AppText
                  variant="title"
                  color={selectedRole === 'owner' ? colors.green : colors.onSurface}
                  style={{ fontWeight: '700' }}
                >
                  {t('role_owner')}
                </AppText>
                <AppText variant="subtitle" style={styles.roleDescText}>{t('role_owner_desc')}</AppText>
              </View>
              <View style={styles.radioBadge}>
                {selectedRole === 'owner' ? (
                  <Ionicons name="checkmark-circle" size={28} color={colors.green} />
                ) : (
                  <View style={styles.radioBadgeEmpty} />
                )}
              </View>
            </GlassCard>
          </View>
        ) : (
          <View
            ref={slideRef}
            onLayout={onSlideLayout}
            style={styles.slideArea}
          >
            <TouchableOpacity
              onPress={() => {
                if (slide > 0) setSlide(slide - 1);
                else { setStep('select_role'); setSlide(0); }
              }}
              style={styles.changeRoleBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={slideInk.action} />
              <AppText variant="caption" color={slideInk.action} style={{ fontWeight: '700' }}>
                {slide > 0 ? t('back') : (language === 'it' ? 'Cambia account' : 'Change account')}
              </AppText>
            </TouchableOpacity>

            <AppText variant="caption" color={slideInk.inkMuted} style={styles.stepLabel}>
              {language === 'it'
                ? `2 · Come funziona · ${slide + 1}/${slides.length}`
                : `2 · How it works · ${slide + 1}/${slides.length}`}
            </AppText>

            <View style={[styles.slideHero, softShadow(8)]}>
              <Ionicons name={current.icon} size={56} color={colors.brand} />
            </View>

            <View style={styles.slideTextBox}>
              <AppText variant="h1" color={slideInk.ink} style={{ textAlign: 'center' }}>
                {current.title}
              </AppText>
              <AppText variant="body" color={slideInk.inkMuted} style={styles.slideText}>
                {current.text}
              </AppText>
            </View>

            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: slideInk.onDark ? 'rgba(255,255,255,0.35)' : colors.border },
                    i === slide && [
                      styles.dotActive,
                      { backgroundColor: slideInk.onDark ? '#FFFFFF' : colors.brand },
                    ],
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {step === 'select_role' ? (
          <>
            <SurfaceButton
              label={t('continue')}
              onPress={() => setStep('slides')}
              disabled={!selectedRole}
              icon="arrow-forward"
            />
            <SurfaceButton
              label={t('already_have_account')}
              onPress={() => {
                const targetRole = selectedRole || sessionRoleOrCustomer();
                router.push(`/login?role=${targetRole}` as any);
              }}
              variant="soft"
            />
          </>
        ) : (
          <>
            <SurfaceButton
              label={slide < slides.length - 1 ? t('next') : t('start')}
              onPress={() => {
                if (slide < slides.length - 1) {
                  setSlide(slide + 1);
                } else {
                  const targetRole = selectedRole || 'customer';
                  router.push(`/register?role=${targetRole}` as any);
                }
              }}
              icon="arrow-forward"
            />
            <SurfaceButton
              label={t('already_have_account')}
              onPress={() => {
                const targetRole = selectedRole || 'customer';
                router.push(`/login?role=${targetRole}` as any);
              }}
              variant="soft"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  brandTitle: { fontWeight: '800' },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  headingBox: { gap: spacing.xs, marginBottom: spacing.xs },
  stepLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: 11,
    alignSelf: 'flex-start',
  },
  subtitleText: { lineHeight: 20 },
  roleArea: { gap: spacing.md, marginTop: spacing.xs },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  roleCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconActive: {
    backgroundColor: colors.brand,
  },
  roleIconActiveOwner: {
    backgroundColor: colors.green,
  },
  roleTextGroup: { flex: 1, gap: 2 },
  roleDescText: { fontSize: 13, color: colors.onSurfaceMuted, lineHeight: 18 },
  radioBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBadgeEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.brandInk,
  },
  slideArea: { gap: spacing.lg, marginTop: spacing.sm, alignItems: 'center' },
  changeRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  slideHero: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  slideTextBox: { gap: spacing.xs, alignItems: 'center', paddingHorizontal: spacing.sm },
  slideText: { textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 8, marginTop: spacing.xs, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
