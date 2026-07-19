import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { CollapseSection, Screen } from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { TAB_BAR_CLEARANCE, colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Restaurant, VisibilityBoost } from '../../src/types';

function canPushNotify(locale: Restaurant | null) {
  if (!locale) return false;
  const plan = locale.business_plan ?? 'free';
  const status = locale.subscription_status ?? 'free';
  return plan === 'pro_notify' && ['trialing', 'active', 'comped'].includes(status);
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerCrescita() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const locale = current;
  const [boosts, setBoosts] = useState<VisibilityBoost[]>([]);
  const [followers, setFollowers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyBoost, setBusyBoost] = useState(false);
  const [busyPush, setBusyPush] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [pushExpanded, setPushExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!locale) return;
    setLoading(true);
    try {
      const [boostList, followerRes] = await Promise.all([
        api.listBoosts(locale.id),
        api.billingFollowersCount(locale.id),
      ]);
      setBoosts(boostList);
      setFollowers(followerRes.count);
    } catch (e) {
      console.log('Errore caricamento crescita:', e);
    }
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    if (restaurants.length === 0) {
      api.myRestaurants().then((rs) => {
        setRestaurants(rs);
        if (!current && rs[0]) setCurrent(rs[0]);
      }).catch(() => {});
    }
  }, [restaurants.length, current, setRestaurants, setCurrent]);

  useEffect(() => {
    load();
  }, [load]);

  const activeBoost = boosts.find((b) => {
    if (!b.expires_at) return false;
    return new Date(b.expires_at).getTime() > Date.now();
  });

  const activateBoost = async () => {
    if (!locale) return;
    setBusyBoost(true);
    try {
      const res = await api.billingBoost(locale.id);
      if (res.activated) {
        Alert.alert('Boost attivato', res.message || 'Il locale è in evidenza per 30 giorni.');
        await load();
      } else if (res.checkout_url) {
        await Linking.openURL(res.checkout_url);
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (/STRIPE|Pagamenti non ancora attivi/i.test(msg)) {
        Alert.alert(
          'Pagamenti in arrivo',
          'I pagamenti online saranno disponibili a breve. In ambiente di test il Boost si attiva subito se Stripe non è configurato.',
        );
      } else {
        Alert.alert('Errore', msg);
      }
    }
    setBusyBoost(false);
  };

  const sendPush = async () => {
    if (!locale) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Attenzione', 'Inserisci titolo e messaggio.');
      return;
    }
    setBusyPush(true);
    try {
      const res = await api.billingSendNotification(locale.id, title.trim(), body.trim());
      Alert.alert('Inviato', res.message || `Notifica inviata a ${res.sent_count} dispositivi.`);
      setTitle('');
      setBody('');
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setBusyPush(false);
  };

  if (!locale) {
    return (
      <Screen edges={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyTitle}>Seleziona un locale</Text>
          <Text style={styles.emptyText}>Vai alla scheda Attività e scegli il ristorante da promuovere.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(owner)/locali')}>
            <Text style={styles.primaryBtnText}>Vai ad Attività</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </Screen>
    );
  }

  const pushEnabled = canPushNotify(locale);

  return (
    <Screen edges={false}>
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: TAB_BAR_CLEARANCE }]}>
      {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />}

      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>Boost visibilità</Text>
        <Text style={styles.blockSub}>{locale.name} · €9,90 per 30 giorni in cima alla ricerca</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardEmoji}>🚀</Text>
        <Text style={styles.cardTitle}>Boost Visibilità · €9,90</Text>
        <Text style={styles.cardSub}>
          Metti il locale in cima alla ricerca clienti per 30 giorni. Pagamento una tantum, disponibile con qualsiasi piano.
        </Text>
        {activeBoost ? (
          <View style={styles.statusOk}>
            <Text style={styles.statusOkText}>✓ Boost attivo fino al {formatDate(activeBoost.expires_at)}</Text>
          </View>
        ) : (
          <Text style={styles.muted}>Nessun boost attivo al momento.</Text>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={activateBoost} disabled={busyBoost}>
          {busyBoost ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.primaryBtnText}>{activeBoost ? 'Rinnova Boost (+30 gg)' : 'Attiva Boost 30 giorni'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {boosts.length > 0 && (
        <CollapseSection
          icon="time"
          title="Storico boost"
          preview={`${boosts.length} attivazioni`}
          expanded={historyExpanded}
          onToggle={() => setHistoryExpanded((v) => !v)}
        >
        <View style={styles.card}>
          {boosts.map((b) => {
            const active = b.expires_at && new Date(b.expires_at).getTime() > Date.now();
            return (
              <View key={b.id} style={styles.boostRow}>
                <Text style={styles.muted}>
                  {formatDate(b.activated_at)} → {formatDate(b.expires_at)}
                </Text>
                <Text style={[styles.boostBadge, active ? styles.boostActive : styles.boostExpired]}>
                  {active ? 'Attivo' : 'Scaduto'}
                </Text>
              </View>
            );
          })}
        </View>
        </CollapseSection>
      )}

      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>Strumenti collegati</Text>
        <Text style={styles.blockSub}>Recensioni e statistiche sul menù digitale</Text>
      </View>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.quickEmoji}>⭐</Text>
          <Text style={styles.quickLabel}>Recensioni</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(owner)/statistiche')}>
          <Text style={styles.quickEmoji}>📊</Text>
          <Text style={styles.quickLabel}>Statistiche</Text>
        </TouchableOpacity>
      </View>

      <CollapseSection
        icon="notifications"
        title="Notifiche push"
        preview={pushEnabled ? `${followers ?? 0} follower` : 'Richiede piano Pro'}
        expanded={pushExpanded}
        onToggle={() => setPushExpanded((v) => !v)}
      >
      <View style={[styles.card, !pushEnabled && styles.cardLocked]}>
        <Text style={styles.cardEmoji}>🔔</Text>
        <Text style={styles.cardTitle}>Notifiche push · Piano Pro</Text>
        <Text style={styles.cardSub}>
          Invia promozioni e novità ai clienti che hanno salvato il locale nei preferiti.
        </Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Clienti fedeli</Text>
          <Text style={styles.statValue}>{followers ?? '—'}</Text>
        </View>

        {!pushEnabled ? (
          <>
            <Text style={styles.lockedText}>
              Attiva il piano Pro (€19/mese) per inviare notifiche push ai tuoi follower.
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(owner)/piano')}>
              <Text style={styles.secondaryBtnText}>Passa a Pro</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Titolo (es. Sconto 10% stasera)"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Messaggio per i clienti..."
              value={body}
              onChangeText={setBody}
              maxLength={500}
              multiline
            />
            <TouchableOpacity
              style={[styles.primaryBtn, styles.pushBtn]}
              onPress={sendPush}
              disabled={busyPush || !followers}
            >
              {busyPush ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.primaryBtnText}>
                  {followers ? 'Invia notifica push' : 'Nessun follower ancora'}
                </Text>
              )}
            </TouchableOpacity>
            {!followers && (
              <Text style={styles.muted}>
                Quando un cliente salva il tuo locale nei preferiti, potrai contattarlo da qui.
              </Text>
            )}
          </>
        )}
      </View>
      </CollapseSection>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.bg, gap: spacing.lg },
  blockHead: { gap: 2 },
  blockTitle: { ...typography.h2, color: colors.ink },
  blockSub: { color: colors.textSecondary, fontSize: 12 },
  heroTitle: { ...typography.h1, color: colors.ink },
  heroSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardLocked: { opacity: 0.95 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { ...typography.h2, color: colors.ink },
  cardSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  statusOk: {
    backgroundColor: colors.greenBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  statusOkText: { color: colors.greenText, fontWeight: '800', fontSize: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  statLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  statValue: { color: colors.brandDark, fontWeight: '900', fontSize: 18 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  pushBtn: { backgroundColor: '#7c3aed' },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand200,
    marginTop: spacing.sm,
  },
  secondaryBtnText: { color: colors.brandDark, fontWeight: '800', fontSize: 13 },
  lockedText: { color: colors.amberText, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  boostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  boostBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  boostActive: { backgroundColor: colors.greenBg, color: colors.greenText },
  boostExpired: { backgroundColor: colors.border, color: colors.textMuted },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    ...shadow.card,
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontWeight: '800', fontSize: 12, color: colors.ink },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxxl,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.h3, color: colors.ink },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontSize: 13 },
});
