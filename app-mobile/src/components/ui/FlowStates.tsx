import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { PuffyButton } from './PuffyButton';
import { GlassCard } from './GlassCard';

type BaseProps = {
  style?: StyleProp<ViewStyle>;
};

type EmptyProps = BaseProps & {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

function StateIcon({
  icon,
  bg,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.iconBubble, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}

/** Card stato vuoto riutilizzabile in tutti i flussi. */
export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyProps) {
  return (
    <GlassCard style={[styles.row, style]} tint="brand">
      <StateIcon icon={icon} bg={colors.brand50} color={colors.brand} />
      <View style={styles.body}>
        <AppText variant="bodyBold">{title}</AppText>
        {description ? <AppText variant="caption">{description}</AppText> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText variant="bodyBold" color={colors.brand}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </GlassCard>
  );
}

type ErrorProps = BaseProps & {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

/** Card errore con retry opzionale. */
export function ErrorStateCard({ message, retryLabel, onRetry, style }: ErrorProps) {
  return (
    <GlassCard style={[styles.row, style]} tint="yellow" accentColor={colors.amberBorder}>
      <StateIcon icon="alert-circle" bg={colors.yellowSoft} color={colors.amberText} />
      <View style={styles.body}>
        <AppText variant="subtitle">{message}</AppText>
      </View>
      {retryLabel && onRetry ? (
        <PuffyButton label={retryLabel} onPress={onRetry} variant="soft" fullWidth={false} style={{ minWidth: 96 }} />
      ) : null}
    </GlassCard>
  );
}

type AllergyBannerProps = {
  hasAllergie: boolean;
  isIt?: boolean;
};

/** Banner quando il profilo allergie non è configurato — usato in Home, Locali, Preferiti. */
export function AllergyProfileBanner({ hasAllergie, isIt = true }: AllergyBannerProps) {
  if (hasAllergie) return null;
  return (
    <GlassCard
      onPress={() => router.push('/allergie')}
      style={styles.allergyBanner}
      tint="yellow"
      accentColor={colors.amberBorder}
    >
      <StateIcon icon="warning" bg={colors.yellowSoft} color={colors.amberText} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyBold" color={colors.onYellow}>
          {isIt ? 'Completa il profilo allergie' : 'Complete your allergy profile'}
        </AppText>
        <AppText variant="caption" color={colors.onYellow}>
          {isIt
            ? 'Serve per attivare il semaforo su menù e prodotti.'
            : 'Needed to activate the traffic light on menus and products.'}
        </AppText>
      </View>
      <AppText variant="bodyBold" color={colors.brand}>
        {isIt ? 'Imposta ›' : 'Set ›'}
      </AppText>
    </GlassCard>
  );
}

type LoadingProps = BaseProps & {
  label?: string;
};

/** Blocco loading centrato. */
export function LoadingBlock({ label, style }: LoadingProps) {
  return (
    <View style={[styles.loading, style]}>
      <ActivityIndicator color={colors.brand} size="large" />
      {label ? <AppText variant="caption" style={{ marginTop: spacing.sm }}>{label}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
