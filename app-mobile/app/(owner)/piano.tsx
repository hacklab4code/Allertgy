import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { BusinessPlan, Plan, Restaurant } from '../../src/types';

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

export default function OwnerPiano() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<{ id: number; amount_cents: number; status: string; pdf_url: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusinessPlan | 'portal' | null>(null);

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
          if (!current) setCurrent(rs[0]);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!locale?.id) return;
    api.billingInvoices(locale.id).then(setInvoices).catch(() => setInvoices([]));
  }, [locale?.id]);

  const applyUpdated = (updated: Restaurant) => {
    setRestaurants(restaurants.map((r) => (r.id === updated.id ? updated : r)));
    setCurrent(updated);
  };

  const status = locale?.subscription_status ?? 'free';
  const currentPlan = locale?.business_plan ?? 'free';
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || status === 'comped';
  const canTrial = status === 'free'; // il backend blocca comunque una seconda prova
  const daysLeft = trialDaysLeft(locale?.trial_ends_at);

  const startTrial = async (plan: BusinessPlan) => {
    if (!locale) return;
    setBusy(plan);
    try {
      const updated = await api.startTrial(locale.id, plan);
      applyUpdated(updated);
      Alert.alert(
        '🎉 Prova attivata!',
        `Hai 14 giorni gratis del piano ${plan === 'base' ? 'Base' : plan === 'pro_notify' ? 'Pro' : plan}. Ora puoi creare il menù digitale con gli allergeni.`,
        [{ text: 'Crea il menù', onPress: () => router.push('/(owner)/menu') }, { text: 'Ok' }],
      );
    } catch (e) {
      Alert.alert('Ops', (e as Error).message);
    }
    setBusy(null);
  };

  const activatePaid = async (plan: BusinessPlan) => {
    if (!locale) return;
    setBusy(plan);
    try {
      const { checkout_url } = await api.billingCheckout(locale.id, plan);
      Linking.openURL(checkout_url);
    } catch (e) {
      const msg = (e as Error).message;
      if (/STRIPE|Pagamenti non ancora attivi|non installato/i.test(msg)) {
        Alert.alert(
          'Pagamenti non ancora attivi',
          'Il pagamento con carta sarà disponibile a breve. Nel frattempo puoi usare la prova gratuita o scrivere a supporto@allertgy.it.',
        );
      } else {
        Alert.alert('Ops', msg);
      }
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
      const msg = (e as Error).message;
      Alert.alert(
        'Gestione abbonamento',
        /STRIPE|Pagamenti|abbonamento attivo|non installato/i.test(msg)
          ? 'La gestione online sarà disponibile con l\'attivazione dei pagamenti. Per modifiche scrivi a supporto@allertgy.it.'
          : msg,
      );
    }
    setBusy(null);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.brand} />;

  if (!locale) {
    const hasRestaurants = restaurants.length > 0;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyTitle}>
            {hasRestaurants ? 'Seleziona un locale' : 'Prima crea il tuo locale'}
          </Text>
          <Text style={styles.emptyText}>
            {hasRestaurants
              ? 'Seleziona uno dei tuoi locali nella scheda "Locale" per gestirne il piano e l\'abbonamento.'
              : 'Registra il ristorante dalla scheda "Locale", poi torna qui per attivare la prova gratuita.'}
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(owner)/locali')}>
            <Text style={styles.emptyBtnText}>Vai a "Locale"</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Stato piano corrente */}
      <View style={[styles.statusCard, isTrialing && styles.statusTrial, isActive && styles.statusActive]}>
        <Text style={styles.statusFor}>{locale.name}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusPlan}>
            {currentPlan === 'free' ? 'Piano Gratis' : `Piano ${plans.find((p) => p.code === currentPlan)?.name ?? currentPlan}`}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{STATUS_LABEL[status] ?? status}</Text>
          </View>
        </View>
        {isTrialing && daysLeft != null && (
          <Text style={styles.trialCountdown}>
            ⏳ {daysLeft === 0 ? 'Ultimo giorno di prova' : `${daysLeft} ${daysLeft === 1 ? 'giorno rimanente' : 'giorni rimanenti'}`}
          </Text>
        )}
        {(isActive || isTrialing || status === 'past_due') && (
          <TouchableOpacity onPress={openPortal} disabled={busy === 'portal'} style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>
              {busy === 'portal' ? 'Apro…' : 'Gestisci abbonamento'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CTA prova gratuita in evidenza per chi non ha ancora un piano */}
      {canTrial && (
        <View style={styles.trialHero}>
          <Text style={styles.trialHeroEmoji}>🎁</Text>
          <Text style={styles.trialHeroTitle}>14 giorni di Base, gratis</Text>
          <Text style={styles.trialHeroText}>
            Sblocca semaforo clienti, QR al tavolo e registro allergeni PDF.
            Nessuna carta richiesta, nessun addebito automatico.
          </Text>
          <TouchableOpacity
            style={styles.trialHeroBtn}
            onPress={() => startTrial('base')}
            disabled={busy === 'base'}
          >
            {busy === 'base'
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.trialHeroBtnText}>Inizia la prova gratuita</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Confronto piani con specifiche */}
      <Text style={styles.sectionTitle}>Tutti i piani</Text>
      <Text style={styles.sectionSub}>Puoi cambiare o disdire in qualsiasi momento.</Text>

      {plans.map((plan) => {
        const isCurrent = plan.code === currentPlan && status !== 'free';
        const isFree = plan.code === 'free';
        return (
          <View key={plan.code} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
            <View style={styles.planHead}>
              <View style={{ flex: 1 }}>
                <View style={styles.planNameRow}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {isCurrent && <View style={styles.currentPill}><Text style={styles.currentPillText}>Attuale</Text></View>}
                  {plan.code === 'pro_notify' && !isCurrent && <View style={styles.popularPill}><Text style={styles.popularPillText}>Consigliato</Text></View>}
                </View>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>{euro(plan.price_cents)}</Text>
                {plan.price_cents > 0 && <Text style={styles.planPer}>/ mese</Text>}
              </View>
            </View>

            {/* Specifiche chiave */}
            <View style={styles.specs}>
              <Spec ok={plan.photo_limit > 0} label={`Galleria foto: ${plan.photo_limit}`} />
              <Spec ok={plan.has_menu} label="Menù digitale con allergeni per piatto" />
              <Spec ok={plan.has_menu} label="QR code e registro allergeni PDF" />
              <Spec ok={plan.has_review_reply} label="Rispondi alle recensioni" />
              <Spec ok={plan.has_priority} label="Priorità nei risultati di ricerca" />
            </View>

            {/* CTA per piano */}
            {isCurrent ? (
              <View style={styles.currentBanner}><Text style={styles.currentBannerText}>✓ È il tuo piano attuale</Text></View>
            ) : isFree ? null : canTrial ? (
              <TouchableOpacity style={styles.planBtn} onPress={() => startTrial(plan.code)} disabled={busy === plan.code}>
                {busy === plan.code
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.planBtnText}>Prova 14 giorni gratis</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.planBtn, styles.planBtnAlt]} onPress={() => activatePaid(plan.code)} disabled={busy === plan.code}>
                {busy === plan.code
                  ? <ActivityIndicator color={colors.brandDark} />
                  : <Text style={styles.planBtnAltText}>Attiva {plan.name}</Text>}
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {invoices.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Storico fatture</Text>
          {invoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceRow}>
              <View>
                <Text style={styles.invoiceAmount}>{euro(inv.amount_cents)}</Text>
                <Text style={styles.invoiceDate}>
                  {new Date(inv.created_at).toLocaleDateString('it-IT')}
                </Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceStatus}>{inv.status}</Text>
                {inv.pdf_url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(inv.pdf_url!)}>
                    <Text style={styles.invoicePdf}>PDF</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={styles.footnote}>
        La prova gratuita non richiede metodi di pagamento. I piani a pagamento sono mensili,
        con fatturazione elettronica, disdicibili in qualsiasi momento.
      </Text>
    </ScrollView>
  );
}

function Spec({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={[styles.specMark, { color: ok ? colors.green : colors.textMuted }]}>{ok ? '✓' : '—'}</Text>
      <Text style={[styles.specLabel, !ok && styles.specLabelOff]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.bg, gap: spacing.lg },

  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  statusTrial: { borderColor: colors.amberBorder, backgroundColor: colors.amberBg },
  statusActive: { borderColor: colors.greenBorder, backgroundColor: colors.greenBg },
  statusFor: { ...typography.caption, color: colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusPlan: { ...typography.h2, color: colors.ink },
  statusBadge: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: spacing.md, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: colors.inkSoft },
  trialCountdown: { marginTop: spacing.sm, fontWeight: '800', color: colors.amberText, fontSize: 13 },
  manageBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  manageBtnText: { color: colors.brandDark, fontWeight: '800', fontSize: 13 },

  trialHero: {
    backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl, ...shadow.raised,
  },
  trialHeroEmoji: { fontSize: 30 },
  trialHeroTitle: { color: colors.white, fontWeight: '800', fontSize: 20, marginTop: spacing.sm },
  trialHeroText: { color: colors.brand100, fontSize: 13.5, lineHeight: 20, marginTop: spacing.sm },
  trialHeroBtn: {
    backgroundColor: colors.white, borderRadius: radius.md, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  trialHeroBtnText: { color: colors.brandDarker, fontWeight: '800', fontSize: 15 },

  sectionTitle: { ...typography.h2, color: colors.ink },
  sectionSub: { color: colors.textSecondary, fontSize: 13, marginTop: -spacing.sm },

  planCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadow.card,
  },
  planCardCurrent: { borderColor: colors.brand, borderWidth: 2 },
  planHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  planName: { ...typography.h2, color: colors.ink },
  planTagline: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  planPrice: { ...typography.h1, color: colors.brandDark },
  planPer: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  currentPill: { backgroundColor: colors.brand50, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  currentPillText: { color: colors.brandDark, fontSize: 10, fontWeight: '800' },
  popularPill: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  popularPillText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  specs: { gap: spacing.sm },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  specMark: { fontSize: 14, fontWeight: '900', width: 16 },
  specLabel: { flex: 1, color: colors.inkSoft, fontSize: 13.5 },
  specLabelOff: { color: colors.textMuted },

  planBtn: {
    backgroundColor: colors.brand, borderRadius: radius.md, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  planBtnText: { color: colors.white, fontWeight: '800', fontSize: 14.5 },
  planBtnAlt: { backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand200 },
  planBtnAltText: { color: colors.brandDark, fontWeight: '800', fontSize: 14.5 },
  currentBanner: { backgroundColor: colors.greenBg, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  currentBannerText: { color: colors.greenText, fontWeight: '800', fontSize: 13 },

  footnote: { color: colors.textMuted, fontSize: 11.5, lineHeight: 17, marginTop: spacing.sm },
  invoiceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  invoiceAmount: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  invoiceDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceStatus: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase' },
  invoicePdf: { color: colors.brand, fontWeight: '800', fontSize: 12 },

  emptyBox: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.xxxl, gap: spacing.sm, marginTop: spacing.xl,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.h3, color: colors.ink },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.sm, backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { color: colors.white, fontWeight: '800' },
});
