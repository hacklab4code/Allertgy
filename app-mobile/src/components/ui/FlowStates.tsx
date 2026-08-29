import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { SurfaceButton } from './SurfaceButton';
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
    <GlassCard style={[styles.card, style]} tint="none">
      <View style={styles.row}>
        <StateIcon icon={icon} bg={colors.brand50} color={colors.brand} />
        <View style={styles.body}>
          <AppText variant="bodyBold">{title}</AppText>
          {description ? <AppText variant="caption">{description}</AppText> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <AppText variant="bodyBold" color={colors.brand}>{actionLabel}</AppText>
          </Pressable>
        ) : null}
      </View>
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
    <GlassCard style={[styles.card, style]} tint="none">
      <View style={styles.row}>
        <StateIcon icon="alert-circle" bg={colors.yellowSoft} color={colors.amberText} />
        <View style={styles.body}>
          <AppText variant="subtitle">{message}</AppText>
        </View>
        {retryLabel && onRetry ? (
          <SurfaceButton label={retryLabel} onPress={onRetry} variant="soft" fullWidth={false} style={{ minWidth: 96 }} />
        ) : null}
      </View>
    </GlassCard>
  );
}

type AllergyBannerProps = {
  hasAllergie: boolean;
  isIt?: boolean;
  /** Conteggio allergeni quando il profilo è già impostato. */
  allergenCount?: number;
};

/** Banner profilo allergie — avviso se manca, stato attivo se presente. */
export function AllergyProfileBanner({
  hasAllergie,
  isIt = true,
  allergenCount,
}: AllergyBannerProps) {
  if (hasAllergie) {
    const countLabel = allergenCount != null
      ? (isIt
        ? `${allergenCount} allergen${allergenCount === 1 ? 'e' : 'i'} nel profilo`
        : `${allergenCount} allergen${allergenCount === 1 ? '' : 's'} in profile`)
      : (isIt ? 'Profilo allergie attivo' : 'Allergy profile active');

    return (
      <GlassCard
        onPress={() => router.push('/allergie')}
        style={styles.card}
        tint="none"
      >
        <View style={styles.row}>
          <StateIcon icon="checkmark-circle" bg={colors.greenSoft} color={colors.onGreen} />
          <View style={styles.body}>
            <AppText variant="bodyBold" color={colors.brandInk}>
              {isIt ? 'Semaforo attivo' : 'Traffic light on'}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted}>
              {countLabel}
            </AppText>
          </View>
          <AppText variant="bodyBold" color={colors.brand}>
            {isIt ? 'Modifica ›' : 'Edit ›'}
          </AppText>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      onPress={() => router.push('/allergie')}
      style={styles.card}
      tint="none"
    >
      <View style={styles.row}>
        <StateIcon icon="warning" bg={colors.yellowSoft} color={colors.amberText} />
        <View style={styles.body}>
          <AppText variant="bodyBold" color={colors.brandInk}>
            {isIt ? 'Completa il profilo allergie' : 'Complete your allergy profile'}
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceMuted}>
            {isIt
              ? 'Serve per attivare il semaforo su menù e prodotti.'
              : 'Needed to activate the traffic light on menus and products.'}
          </AppText>
        </View>
        <AppText variant="bodyBold" color={colors.brand}>
          {isIt ? 'Imposta ›' : 'Set ›'}
        </AppText>
      </View>
    </GlassCard>
  );
}

type MenuUnavailableProps = BaseProps & {
  isIt?: boolean;
  venueName?: string;
  onCallStaff?: () => void;
};

/**
 * Stato neutro: locale senza dati allergeni pubblicati.
 * Non montare filtri semaforo né “Nessun piatto qui”.
 */
export function MenuUnavailableCard({
  isIt = true,
  venueName,
  onCallStaff,
  style,
}: MenuUnavailableProps) {
  return (
    <GlassCard style={[styles.card, style]} tint="none">
      <View style={styles.unavailableCol}>
        <StateIcon icon="document-text-outline" bg={colors.brand50} color={colors.brand} />
        <AppText variant="bodyBold" style={{ textAlign: 'center' }}>
          {isIt ? 'Dati allergeni non pubblicati' : 'Allergen data not published'}
        </AppText>
        <AppText variant="caption" color={colors.onSurfaceMuted} style={{ textAlign: 'center' }}>
          {isIt
            ? `${venueName ? `${venueName} non ha` : 'Questo locale non ha'} ancora un menù digitale con allergeni. Chiedi conferma allo staff prima di ordinare.`
            : `${venueName ? `${venueName} has` : 'This venue has'} not published an allergen menu yet. Always confirm with staff before ordering.`}
        </AppText>
        {onCallStaff ? (
          <SurfaceButton
            label={isIt ? 'Chiedi allo staff' : 'Ask staff'}
            onPress={onCallStaff}
            variant="soft"
            fullWidth={false}
            style={{ marginTop: spacing.xs, minWidth: 140 }}
          />
        ) : null}
      </View>
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
  card: {
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  unavailableCol: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
