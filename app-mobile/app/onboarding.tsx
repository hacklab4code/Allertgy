import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { OnboardingSlides, type OnboardingSlide, Screen, ScreenTopHeader } from '../src/components/ui';
import { useTranslation } from '../src/constants/translations';
import { useSession } from '../src/store/session';
import { colors } from '../src/theme';

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { role, setTourCompleted } = useSession();
  const { t } = useTranslation();
  const isOwner = role === 'owner';

  const slides: OnboardingSlide[] = useMemo(() => {
    if (isOwner) {
      return [
        {
          icon: 'storefront-outline',
          iconColor: colors.green,
          iconBg: colors.greenSoft,
          badge: t('tour_owner_badge_1'),
          title: t('tour_owner_1_title'),
          text: t('tour_owner_1_text'),
        },
        {
          icon: 'restaurant-outline',
          iconColor: colors.brand,
          iconBg: colors.brand50,
          badge: t('tour_owner_badge_2'),
          title: t('tour_owner_2_title'),
          text: t('tour_owner_2_text'),
        },
        {
          icon: 'qr-code-outline',
          iconColor: colors.brand,
          iconBg: colors.brand100,
          badge: t('tour_owner_badge_3'),
          title: t('tour_owner_3_title'),
          text: t('tour_owner_3_text'),
        },
        {
          icon: 'rocket-outline',
          iconColor: colors.brand,
          iconBg: colors.brandTertiary,
          badge: t('tour_owner_badge_4'),
          title: t('tour_owner_4_title'),
          text: t('tour_owner_4_text'),
        },
      ];
    }
    return [
      {
        icon: 'home-outline',
        iconColor: colors.brand,
        iconBg: colors.brand50,
        badge: t('tour_customer_badge_1'),
        title: t('tour_customer_1_title'),
        text: t('tour_customer_1_text'),
      },
      {
        icon: 'map-outline',
        iconColor: colors.green,
        iconBg: colors.greenSoft,
        badge: t('tour_customer_badge_2'),
        title: t('tour_customer_2_title'),
        text: t('tour_customer_2_text'),
      },
      {
        icon: 'scan-outline',
        iconColor: colors.brand,
        iconBg: colors.brand100,
        badge: t('tour_customer_badge_3'),
        title: t('tour_customer_3_title'),
        text: t('tour_customer_3_text'),
      },
      {
        icon: 'person-circle-outline',
        iconColor: colors.brand,
        iconBg: colors.surfaceSecondary,
        badge: t('tour_customer_badge_4'),
        title: t('tour_customer_4_title'),
        text: t('tour_customer_4_text'),
      },
    ];
  }, [isOwner, t]);

  const finish = () => {
    setTourCompleted(true);
    router.replace(isOwner ? '/(owner)/locali' : '/(tabs)/home');
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isOwner ? t('tour_owner_header') : t('tour_customer_header')}
        showBack={false}
        rightElement={<LanguageFlagsRow inHeader />}
      />
      <OnboardingSlides
        slides={slides}
        step={step}
        onStepChange={setStep}
        onComplete={finish}
        onSkip={finish}
        backLabel={t('back')}
        nextLabel={t('next')}
        finishLabel={isOwner ? t('tour_owner_finish') : t('tour_customer_finish')}
        skipLabel={t('tour_skip')}
      />
    </Screen>
  );
}
