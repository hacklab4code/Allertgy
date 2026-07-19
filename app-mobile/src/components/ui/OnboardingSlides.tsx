import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { PuffyButton } from './PuffyButton';
import { Screen } from './Screen';
import { colors, spacing, radius, puffyShadow } from '../../theme';

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
    <Screen edges={false} style={{ backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {onSkip && skipLabel ? (
          <PuffyButton
            label={skipLabel}
            onPress={onSkip}
            variant="soft"
            fullWidth={false}
            style={styles.skipBtn}
          />
        ) : null}

        <View style={styles.progressRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>

        <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.stepLabel}>
          {step + 1} / {slides.length}
        </AppText>

        <View style={[styles.hero, puffyShadow(10), { backgroundColor: current.iconBg ?? colors.surfaceSecondary }]}>
          <Ionicons name={current.icon} size={64} color={current.iconColor ?? colors.brand} />
        </View>

        {current.badge ? (
          <View style={styles.badge}>
            <AppText variant="caption" color={colors.brand}>{current.badge}</AppText>
          </View>
        ) : null}

        <AppText variant="h1" style={styles.title}>{current.title}</AppText>
        <AppText variant="body" style={styles.text}>{current.text}</AppText>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.navRow}>
          {step > 0 ? (
            <PuffyButton
              label={backLabel}
              onPress={() => onStepChange(step - 1)}
              variant="soft"
              fullWidth={false}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <PuffyButton
            label={isLast ? finishLabel : nextLabel}
            onPress={() => (isLast ? onComplete() : onStepChange(step + 1))}
            icon="arrow-forward"
            loading={busy}
            style={{ flex: 1 }}
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
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  skipBtn: { alignSelf: 'flex-end' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.brand },
  stepLabel: { marginBottom: spacing.xs },
  hero: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: colors.brand50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
  },
  title: { textAlign: 'center' },
  text: { textAlign: 'center', lineHeight: 24, maxWidth: 340 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navRow: { flexDirection: 'row', gap: spacing.sm },
});
