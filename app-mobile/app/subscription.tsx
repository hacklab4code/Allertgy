import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { api, type UserProfile } from '../src/api/client';
import {
  AppText,
  ErrorStateCard,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
} from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, radius, spacing } from '../src/theme';
import type { CustomerPlan } from '../src/types';

const STATUS_LABEL: Record<string, { it: string; en: string }> = {
  free: { it: 'Piano gratuito', en: 'Free plan' },
  trialing: { it: 'Prova in corso', en: 'Trial active' },
  active: { it: 'Abbonamento attivo', en: 'Subscription active' },
  past_due: { it: 'Pagamento da aggiornare', en: 'Payment needs attention' },
  canceled: { it: 'Abbonamento annullato', en: 'Subscription cancelled' },
  comped: { it: 'Piano omaggio attivo', en: 'Complimentary plan active' },
};

function priceLabel(cents: number, isIt: boolean) {
  if (cents === 0) return isIt ? 'Gratis' : 'Free';
  return `€${(cents / 100).toFixed(2).replace('.', ',')}${isIt ? '/mese' : '/month'}`;
}

export default function Subscription() {
  const { language } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const [plans, setPlans] = useState<CustomerPlan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [availablePlans, currentProfile] = await Promise.all([
        api.getCustomerPlans(),
        api.getProfile(),
      ]);
      setPlans(availablePlans);
      setProfile(currentProfile);
    } catch (e) {
      setError((e as Error).message || (isIt ? 'Impossibile caricare l’abbonamento.' : 'Could not load subscription.'));
    } finally {
      setLoading(false);
    }
  }, [isIt]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const openCheckout = async () => {
    setBusy('checkout');
    try {
      const { checkout_url } = await api.customerCheckout();
      await Linking.openURL(checkout_url);
    } catch (e) {
      Alert.alert(isIt ? 'Abbonamento' : 'Subscription', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    try {
      const { portal_url } = await api.customerPortal();
      await Linking.openURL(portal_url);
    } catch (e) {
      Alert.alert(isIt ? 'Gestione abbonamento' : 'Manage subscription', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const status = profile?.customer_subscription_status || 'free';
  const hasPlus = profile?.has_customer_plus ?? false;
  const currentPlan = profile?.customer_plan || 'customer_free';
  const statusLabel = STATUS_LABEL[status]?.[isIt ? 'it' : 'en'] ?? status;

  return (
    <GlassScreenScroll headerFloat={false}>
      <Stack.Screen options={{ title: isIt ? 'Piano e abbonamento' : 'Plan & subscription' }} />

      <View style={styles.heading}>
        <AppText variant="eyebrow" color={colors.textSecondary} style={styles.eyebrow}>
          {isIt ? 'IL TUO PIANO' : 'YOUR PLAN'}
        </AppText>
        <AppText variant="h2" style={styles.title}>
          {hasPlus ? 'Plus Famiglia' : (isIt ? 'Piano gratuito' : 'Free plan')}
        </AppText>
        <AppText variant="caption" color={colors.onSurfaceMuted}>
          {hasPlus
            ? (isIt ? 'Gestisci pagamento, rinnovo o disdetta.' : 'Manage payment, renewal or cancellation.')
            : (isIt ? 'Sblocca più profili e funzioni per la famiglia.' : 'Unlock more family profiles and features.')}
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={styles.loader} />
      ) : error ? (
        <ErrorStateCard
          message={error}
          retryLabel={isIt ? 'Riprova' : 'Retry'}
          onRetry={load}
        />
      ) : (
        <>
          <GlassCard style={styles.statusCard}>
            <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={styles.eyebrow}>
              {isIt ? 'STATO ABBONAMENTO' : 'SUBSCRIPTION STATUS'}
            </AppText>
            <View style={styles.statusRow}>
              <AppText variant="title" style={styles.statusName}>{statusLabel}</AppText>
              <View style={[styles.statusBadge, hasPlus ? styles.statusBadgeActive : styles.statusBadgeFree]}>
                <AppText variant="caption" color={hasPlus ? colors.onGreen : colors.onSurfaceMuted} style={styles.statusBadgeText}>
                  {hasPlus ? 'PLUS' : (isIt ? 'GRATIS' : 'FREE')}
                </AppText>
              </View>
            </View>
            {status === 'past_due' ? (
              <AppText variant="caption" color={colors.red} style={styles.notice}>
                {isIt ? 'Aggiorna il metodo di pagamento per mantenere Plus Famiglia.' : 'Update your payment method to keep Family Plus.'}
              </AppText>
            ) : null}
            {(status === 'active' || status === 'trialing' || status === 'past_due') ? (
              <View style={styles.action}>
                <SurfaceButton
                  label={busy === 'portal' ? (isIt ? 'Apro...' : 'Opening...') : (isIt ? 'Gestisci abbonamento' : 'Manage subscription')}
                  onPress={openPortal}
                  disabled={busy !== null}
                  loading={busy === 'portal'}
                />
              </View>
            ) : null}
          </GlassCard>

          <AppText variant="title" style={styles.sectionTitle}>
            {isIt ? 'Confronta i piani' : 'Compare plans'}
          </AppText>
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlan;
            const isPlus = plan.code === 'customer_plus';
            return (
              <GlassCard key={plan.code} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
                <View style={styles.planHead}>
                  <View style={styles.planText}>
                    <AppText variant="title" style={styles.planName}>{plan.name}</AppText>
                    <AppText variant="caption" color={colors.onSurfaceMuted}>{plan.tagline}</AppText>
                  </View>
                  <AppText variant="title" color={colors.brand} style={styles.price}>
                    {priceLabel(plan.price_cents, isIt)}
                  </AppText>
                </View>
                <View style={styles.features}>
                  {plan.features.map((feature) => (
                    <AppText key={feature} variant="caption" style={styles.feature}>
                      ✓ {feature}
                    </AppText>
                  ))}
                </View>
                {isCurrent ? (
                  <View style={styles.currentLabel}>
                    <AppText variant="caption" color={colors.onGreen} style={styles.currentLabelText}>
                      {isIt ? 'PIANO IN USO' : 'CURRENT PLAN'}
                    </AppText>
                  </View>
                ) : isPlus ? (
                  <View style={styles.action}>
                    <SurfaceButton
                      label={busy === 'checkout' ? (isIt ? 'Apro...' : 'Opening...') : (isIt ? 'Passa a Plus Famiglia' : 'Upgrade to Family Plus')}
                      onPress={openCheckout}
                      disabled={busy !== null}
                      loading={busy === 'checkout'}
                    />
                  </View>
                ) : null}
              </GlassCard>
            );
          })}

          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.footnote}>
            {isIt
              ? 'Plus Famiglia è un abbonamento mensile. Puoi gestirlo o disdirlo in qualsiasi momento dal portale di pagamento.'
              : 'Family Plus is a monthly subscription. You can manage or cancel it any time in the payment portal.'}
          </AppText>
        </>
      )}
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.md },
  eyebrow: { fontSize: 10, letterSpacing: 0.9, marginBottom: 4 },
  title: { fontSize: 22, marginBottom: 3 },
  loader: { marginTop: 56 },
  statusCard: { padding: spacing.md, marginBottom: spacing.lg, borderRadius: radius.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  statusName: { fontSize: 16, flex: 1 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeActive: { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder },
  statusBadgeFree: { backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  notice: { marginTop: spacing.sm, lineHeight: 17 },
  action: { marginTop: spacing.md },
  sectionTitle: { fontSize: 16, marginBottom: spacing.sm },
  planCard: { padding: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md },
  planCardCurrent: { borderWidth: 2, borderColor: colors.greenBorder },
  planHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planText: { flex: 1 },
  planName: { fontSize: 16, marginBottom: 2 },
  price: { fontSize: 15, textAlign: 'right' },
  features: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 4 },
  feature: { color: colors.onSurface, fontSize: 12, lineHeight: 17 },
  currentLabel: { marginTop: spacing.md, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder },
  currentLabelText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.45 },
  footnote: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 17, fontSize: 11 },
});
