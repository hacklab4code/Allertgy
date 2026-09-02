import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { SurfaceButton } from './SurfaceButton';
import { Screen } from './Screen';
import { colors, spacing, radius, softShadow } from '../../theme';

export type OnboardingSlide = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  text: string;
  badge?: string;
};

type Props = {
  slides: OnboardingSlide[];
  step: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onSkip?: () => void;
  backLabel: string;
  nextLabel: string;
  finishLabel: string;
  skipLabel?: string;
  busy?: boolean;
};

export function OnboardingSlides({
  slides,
  step,
  onStepChange,
  onComplete,
  onSkip,
  backLabel,
  nextLabel,
  finishLabel,
  skipLabel,
  busy,
}: Props) {
  const insets = useSafeAreaInsets();
  const current = slides[step];
  const isLast = step >= slides.length - 1;

  return (
    <Screen edges={false} ambient style={{ backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {onSkip && skipLabel ? (
          <SurfaceButton
            label={skipLabel}
            onPress={onSkip}
            variant="soft"
            fullWidth={false}
            style={styles.skipBtn}
          />
        ) : null}

        <View style={styles.progressRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === step ? styles.progressDotActive : i < step ? styles.progressDotPassed : undefined,
              ]}
            />
          ))}
        </View>

        <View style={styles.stepBadge}>
          <Ionicons name="sparkles-outline" size={12} color={colors.brand} />
          <AppText variant="caption" color={colors.brand} style={styles.stepLabel}>
            {step + 1} DI {slides.length}
          </AppText>
        </View>

        <View style={[styles.heroCard, softShadow(8)]}>
          <View style={[styles.iconCircle, { backgroundColor: current.iconBg ?? colors.brand50 }]}>
            <Ionicons name={current.icon} size={52} color={current.iconColor ?? colors.brand} />
          </View>

          {current.badge ? (
            <View style={styles.badge}>
              <AppText variant="caption" color={colors.brand} style={{ fontWeight: '800' }}>
                {current.badge}
              </AppText>
            </View>
          ) : null}

          <AppText variant="h1" style={styles.title}>{current.title}</AppText>
          <AppText variant="body" style={styles.text}>{current.text}</AppText>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.navRow}>
          {step > 0 ? (
            <SurfaceButton
              label={backLabel}
              onPress={() => onStepChange(step - 1)}
              variant="soft"
              fullWidth={false}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <SurfaceButton
            label={isLast ? finishLabel : nextLabel}
            onPress={() => (isLast ? onComplete() : onStepChange(step + 1))}
            icon="arrow-forward-outline"
            loading={busy}
            style={{ flex: 1.5 }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.md,
  },
  skipBtn: { alignSelf: 'flex-end' },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xs,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotPassed: {
    backgroundColor: colors.brand100,
  },
  progressDotActive: {
    width: 36,
    backgroundColor: colors.brand,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  stepLabel: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand100,
    marginBottom: spacing.xs,
  },
  badge: {
    backgroundColor: colors.brand50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  text: { textAlign: 'center', lineHeight: 22, maxWidth: 320, fontSize: 13 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
