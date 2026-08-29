import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import { AppText, CollapseSection, GlassCard, GlassScreenScroll, SurfaceButton } from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { colors, radius, spacing } from '../../src/theme';
import type { BusinessPlan, Plan } from '../../src/types';

const STATUS_LABEL: Record<string, string> = {
  free: 'Nessun piano attivo',
  trialing: 'Prova gratuita in corso',
  active: 'Abbonamento attivo',
  past_due: 'Pagamento in sospeso',
  canceled: 'Abbonamento annullato',
  comped: 'Piano omaggio',
};

function euro(cents: number): string {
  if (!cents) return 'Gratis';
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function trialDaysLeft(iso?: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

/** Piano & Fatturazione Ristoratore — Dimensioni ed elementi bilanciati. */
export default function OwnerPiano() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<{ id: number; amount_cents: number; status: string; pdf_url: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusinessPlan | 'portal' | null>(null);
  const [invoicesExpanded, setInvoicesExpanded] = useState(false);

  const locale = current;

  useEffect(() => {
    Promise.all([
      api.getPlans(),
      restaurants.length === 0 ? api.myRestaurants().catch(() => []) : Promise.resolve(restaurants),
    ])
      .then(([p, rs]) => {
        setPlans(p);
        if (rs.length && restaurants.length === 0) {
          setRestaurants(rs);
          setCurrent(rs[0]);
        }
      })
      .catch((e) => Alert.alert('Errore', (e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (locale) {
      api.billingInvoices(locale.id).then(setInvoices).catch(() => setInvoices([]));
    }
  }, [locale]);

  const currentPlan = locale?.business_plan ?? 'free';
  const status = locale?.subscription_status ?? 'free';
  const trialEnd = locale?.trial_ends_at;
  const daysLeft = trialDaysLeft(trialEnd);
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || status === 'comped';

  const selectPlan = async (code: BusinessPlan) => {
    if (!locale) return;
    if (code === 'free' && currentPlan === 'free') return;
    setBusy(code);
    try {
      const res = await api.billingCheckout(locale.id, code);
      if (res.checkout_url) {
        await Linking.openURL(res.checkout_url);
      } else {
        const updated = await api.myRestaurants();
        setRestaurants(updated);
        const match = updated.find((r) => r.id === locale.id);
        if (match) setCurrent(match);
      }
    } catch (e) {
      Alert.alert('Abbonamento', (e as Error).message);
    }
    setBusy(null);
  };

  const openPortal = async () => {
    if (!locale) return;
    setBusy('portal');
    try {
      const { portal_url } = await api.billingPortal(locale.id);
      Linking.openURL(portal_url);
    } catch (e) {
      Alert.alert('Gestione abbonamento', (e as Error).message);
    }
    setBusy(null);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.brand} />;

  if (!locale) {
    return (
      <GlassScreenScroll headerFloat>
        <GlassCard style={styles.centerCard}>
          <AppText variant="h2" style={{ fontSize: 16 }}>Nessun locale selezionato</AppText>
          <AppText variant="caption" style={{ textAlign: 'center', marginTop: 2, marginBottom: spacing.sm, fontSize: 12 }}>
            Seleziona o crea la tua attività prima di attivare un piano.
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Piano e fatturazione"
        subtitle="Abbonamento e ricevute"
      />

      {/* Piano Attuale */}
      <GlassCard style={styles.currentPlanCard}>
        <AppText variant="eyebrow" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>STABILE ATTIVO</AppText>
        <AppText variant="h2" color={colors.brandInk} style={{ fontSize: 18, marginVertical: 2 }}>{locale.name}</AppText>

        <View style={styles.statusRow}>
          <AppText variant="title" style={{ fontSize: 14 }}>
            {currentPlan === 'free' ? 'Piano Gratis' : `Piano ${plans.find((p) => p.code === currentPlan)?.name ?? currentPlan}`}
          </AppText>
          <View style={styles.statusBadgeViolet}>
            <AppText variant="caption" color={colors.brandInk} style={{ fontWeight: '800', fontSize: 10 }}>
              {STATUS_LABEL[status] ?? status}
            </AppText>
          </View>
        </View>

        {isTrialing && daysLeft != null && (
          <AppText variant="caption" color={colors.onYellow} style={{ fontWeight: '700', marginTop: 4, fontSize: 10 }}>
            ⏳ {daysLeft === 0 ? 'Ultimo giorno di prova' : `${daysLeft} giorni di prova rimanenti`}
          </AppText>
        )}

        {(isActive || isTrialing || status === 'past_due') && (
          <View style={{ marginTop: spacing.sm }}>
            <SurfaceButton
              label={busy === 'portal' ? 'Apro...' : '⚙️ Gestisci Abbonamento & Fatture'}
              onPress={openPortal}
              disabled={busy === 'portal'}
            />
          </View>
        )}
      </GlassCard>

      {/* Griglia Piani */}
      <View style={styles.plansSectionHead}>
        <AppText variant="title" style={{ fontSize: 15 }}>Scegli un Piano</AppText>
      </View>

      {plans.map((p) => {
        const isCurrent = currentPlan === p.code;
        return (
          <GlassCard key={p.code} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
            {isCurrent && (
              <View style={styles.currentBadgeTop}>
                <AppText variant="caption" color="#FFFFFF" style={{ fontSize: 8, fontWeight: '800', letterSpacing: 0.6 }}>
                  PIANO ATTIVATO
                </AppText>
              </View>
            )}

            <View style={styles.planCardHead}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={colors.brandInk} style={{ fontSize: 15 }}>{p.name}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 11 }}>{p.tagline}</AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="h1" color={colors.brand} style={{ fontSize: 20, lineHeight: 24 }}>{euro(p.price_cents)}</AppText>
                {p.price_cents > 0 ? <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 9 }}>/mese</AppText> : null}
              </View>
            </View>

            <View style={styles.featuresList}>
              {p.features.map((feat, idx) => (
                <AppText key={idx} variant="caption" color={colors.brandInk} style={{ fontSize: 11, fontWeight: '700' }}>✓ {feat}</AppText>
              ))}
            </View>

            <View style={{ marginTop: spacing.sm }}>
              <SurfaceButton
                label={isCurrent ? 'Piano In Uso' : `Scegli ${p.name}`}
                onPress={() => selectPlan(p.code as BusinessPlan)}
                disabled={isCurrent || busy === p.code}
              />
            </View>
          </GlassCard>
        );
      })}

      {/* Storico Fatture */}
      {invoices.length > 0 && (
        <CollapseSection
          icon="receipt"
          title="Fatture & Ricevute"
          preview={`${invoices.length} ricevute`}
          expanded={invoicesExpanded}
          onToggle={() => setInvoicesExpanded((v) => !v)}
        >
          {invoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceRow}>
              <View>
                <AppText variant="bodyBold" style={{ fontSize: 12 }}>{euro(inv.amount_cents)}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 10 }}>{new Date(inv.created_at).toLocaleDateString('it-IT')}</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <AppText variant="caption" style={{ fontWeight: '700', fontSize: 10 }}>{inv.status}</AppText>
                {inv.pdf_url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(inv.pdf_url!)} style={styles.pdfPillBtn}>
                    <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800', fontSize: 10 }}>PDF</AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </CollapseSection>
      )}

      <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.footnote}>
        Tutti i piani a pagamento sono mensili, fatturati elettronicamente, disdicibili in qualsiasi momento senza penali.
      </AppText>
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  headerHead: {
    marginBottom: spacing.xs,
  },
  centerCard: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: radius.md,
  },
  currentPlanCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusBadgeViolet: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  plansSectionHead: {
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  planCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
    borderRadius: radius.md,
  },
  planCardCurrent: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  currentBadgeTop: {
    position: 'absolute',
    top: -9,
    right: 16,
    backgroundColor: colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  planCardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  featuresList: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 3,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pdfPillBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  footnote: {
    textAlign: 'center',
    marginVertical: spacing.md,
    lineHeight: 14,
    fontSize: 10,
  },
});
