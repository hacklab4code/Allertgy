import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, type Role } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';
import { AppText, GlassScreenScroll, SurfaceButton, Screen } from '../src/components/ui';
import { colors, spacing, radius, softShadow, MIN_TOUCH_TARGET } from '../src/theme';

export default function Welcome() {
  const [selectedRole, setSelectedRole] = useState<Role>('customer');
  const [slide, setSlide] = useState(0);
  const { language, setRole } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const { ref: headerRef, ink: headerInk, onLayout: onHeaderLayout } = useAdaptiveMeshInk(true);
  const { ref: slideRef, ink: slideInk, onLayout: onSlideLayout } = useAdaptiveMeshInk(true);

  const customerSlides = [
    {
      icon: 'scan-outline' as const,
      badge: isIt ? 'Scansione Istantanea' : 'Instant Scan',
      title: t('slide_c1_title'),
      text: t('slide_c1_text'),
      featureTag: isIt ? '1. QR al tavolo' : '1. Table QR',
    },
    {
      icon: 'sparkles-outline' as const,
      badge: isIt ? 'Semaforo Intelligente' : 'Smart Traffic Light',
      title: t('slide_c3_title'),
      text: t('slide_c3_text'),
      featureTag: isIt ? '2. Filtro su misura' : '2. Custom Filter',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      badge: isIt ? 'Sicurezza & Famiglia' : 'Safety & Family',
      title: t('slide_c2_title'),
      text: t('slide_c2_text'),
      featureTag: isIt ? '3. Sempre con te' : '3. Always with you',
    },
  ];

  const ownerSlides = [
    {
      icon: 'clipboard-outline' as const,
      badge: isIt ? 'Menù Digitale & AI' : 'Digital Menu & AI',
      title: t('slide_o1_title'),
      text: t('slide_o1_text'),
      featureTag: isIt ? '1. Regolamento UE 1169' : '1. EU 1169 Ready',
    },
    {
      icon: 'stats-chart-outline' as const,
      badge: isIt ? 'QR Tavoli & Controllo' : 'Table QRs & Control',
      title: t('slide_o3_title'),
      text: t('slide_o3_text'),
      featureTag: isIt ? '2. Stampa facile QR' : '2. Easy QR Print',
    },
    {
      icon: 'happy-outline' as const,
      badge: isIt ? 'Clienti Soddisfatti' : 'Happy Customers',
      title: t('slide_o2_title'),
      text: t('slide_o2_text'),
      featureTag: isIt ? '3. Trasparenza totale' : '3. Total Transparency',
    },
  ];

  const slides = selectedRole === 'owner' ? ownerSlides : customerSlides;
  const current = slides[slide] || slides[0];

  const handleSelectRole = (r: Role) => {
    setSelectedRole(r);
    setRole(r);
    setSlide(0);
  };

  const handleStartRegister = () => {
    setRole(selectedRole);
    router.push(`/register?role=${selectedRole}` as any);
  };

  const handleGoLogin = () => {
    setRole(selectedRole);
    router.push('/login' as any);
  };

  return (
    <Screen edges={false} ambient style={styles.screen}>
      {/* Top Header Bar */}
      <View
        ref={headerRef}
        onLayout={onHeaderLayout}
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}
      >
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
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Role Switcher Pill Bar (Choose Role Once) */}
        <View style={styles.rolePickerBox}>
          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.rolePickerLabel}>
            {isIt ? 'SCOPRI ALLERTGY PER:' : 'DISCOVER ALLERTGY FOR:'}
          </AppText>

          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              onPress={() => handleSelectRole('customer')}
              activeOpacity={0.85}
              style={[
                styles.roleTab,
                selectedRole === 'customer' && styles.roleTabActive,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={15}
                color={selectedRole === 'customer' ? colors.brand : colors.onSurfaceMuted}
              />
              <AppText
                variant="caption"
                color={selectedRole === 'customer' ? colors.brand : colors.onSurfaceMuted}
                style={[styles.roleTabText, selectedRole === 'customer' && styles.roleTabTextActive]}
              >
                {isIt ? 'Cliente / Famiglia' : 'User / Family'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectRole('owner')}
              activeOpacity={0.85}
              style={[
                styles.roleTab,
                selectedRole === 'owner' && styles.roleTabActiveOwner,
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={15}
                color={selectedRole === 'owner' ? colors.green : colors.onSurfaceMuted}
              />
              <AppText
                variant="caption"
                color={selectedRole === 'owner' ? colors.green : colors.onSurfaceMuted}
                style={[styles.roleTabText, selectedRole === 'owner' && styles.roleTabTextActiveOwner]}
              >
                {isIt ? 'Ristoratore' : 'Restaurant'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guided "Come Funziona" Presentation Card */}
        <View ref={slideRef} onLayout={onSlideLayout} style={styles.slideArea}>
          <View style={styles.stepBadgeRow}>
            <View style={[styles.stepBadge, selectedRole === 'owner' && styles.stepBadgeOwner]}>
              <Ionicons
                name="sparkles-outline"
                size={13}
                color={selectedRole === 'owner' ? colors.green : colors.brand}
              />
              <AppText
                variant="caption"
                color={selectedRole === 'owner' ? colors.green : colors.brand}
                style={styles.stepBadgeText}
              >
                {isIt
                  ? `COME FUNZIONA · ${slide + 1} DI ${slides.length}`
                  : `HOW IT WORKS · ${slide + 1} OF ${slides.length}`}
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleStartRegister}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontWeight: '600' }}>
                {isIt ? 'Salta introduzione' : 'Skip intro'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Hero Showcase Card */}
          <View
            style={[
              styles.slideCard,
              selectedRole === 'owner' ? styles.slideCardOwner : styles.slideCardCustomer,
              softShadow(6),
            ]}
          >
            {/* Hero Icon */}
            <View
              style={[
                styles.slideIconCircle,
                selectedRole === 'owner' ? styles.slideIconCircleOwner : styles.slideIconCircleCustomer,
              ]}
            >
              <Ionicons
                name={current.icon}
                size={48}
                color={selectedRole === 'owner' ? colors.green : colors.brand}
              />
            </View>

            {/* Feature Tag */}
            <View
              style={[
                styles.slideFeatureTag,
                selectedRole === 'owner' && styles.slideFeatureTagOwner,
              ]}
            >
              <AppText
                variant="caption"
                color={selectedRole === 'owner' ? colors.green : colors.brand}
                style={styles.featureTagText}
              >
                {current.badge}
              </AppText>
            </View>

            {/* Title & Description */}
            <AppText variant="h2" color={slideInk.ink} style={styles.slideTitle}>
              {current.title}
            </AppText>
            <AppText variant="body" color={slideInk.inkMuted} style={styles.slideText}>
              {current.text}
            </AppText>
          </View>

          {/* Dots Indicator & Step Navigation */}
          <View style={styles.dotsRow}>
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSlide(i)}
                style={[
                  styles.dot,
                  i === slide && (selectedRole === 'owner' ? styles.dotActiveOwner : styles.dotActive),
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              />
            ))}
          </View>
        </View>
      </GlassScreenScroll>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <SurfaceButton
          label={
            slide < slides.length - 1
              ? t('next')
              : selectedRole === 'customer'
                ? (isIt ? 'Inizia subito come Cliente' : 'Get started as User')
                : (isIt ? 'Inizia subito come Ristoratore' : 'Get started as Restaurant')
          }
          onPress={() => {
            if (slide < slides.length - 1) {
              setSlide(slide + 1);
            } else {
              handleStartRegister();
            }
          }}
          icon="arrow-forward-outline"
        />
        <SurfaceButton
          label={t('already_have_account')}
          onPress={handleGoLogin}
          variant="soft"
          icon="log-in-outline"
        />
        <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.creatorNote}>
          {isIt ? 'Progetto ideato e creato da hacklab.digital' : 'Crafted by hacklab.digital'}
        </AppText>
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
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
    fontSize: 24,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  rolePickerBox: {
    gap: 6,
    marginBottom: spacing.xs,
  },
  rolePickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  roleTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand100,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabActiveOwner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleTabTextActive: {
    fontWeight: '800',
    color: colors.brand,
  },
  roleTabTextActiveOwner: {
    fontWeight: '800',
    color: colors.green,
  },
  slideArea: {
    gap: spacing.md,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stepBadge: {
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
  stepBadgeOwner: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  stepBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  slideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
  },
  slideCardCustomer: {
    borderColor: colors.brand100,
  },
  slideCardOwner: {
    borderColor: colors.greenBorder,
  },
  slideIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: spacing.xs,
  },
  slideIconCircleCustomer: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand100,
  },
  slideIconCircleOwner: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  slideFeatureTag: {
    backgroundColor: colors.brand50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  slideFeatureTagOwner: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  featureTagText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  slideTitle: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  slideText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand,
  },
  dotActiveOwner: {
    width: 24,
    backgroundColor: colors.green,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  creatorNote: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    paddingTop: 2,
  },
});
