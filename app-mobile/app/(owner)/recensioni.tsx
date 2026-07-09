import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, type Review } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Restaurant } from '../../src/types';

function canReply(r: Restaurant | null) {
  if (!r) return false;
  const plan = r.business_plan ?? 'free';
  const status = r.subscription_status ?? 'free';
  return (
    status === 'comped' ||
    ((plan === 'base' || plan === 'pro_notify') && ['trialing', 'active'].includes(status))
  );
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerRecensioni() {
  const { current } = useOwner();
  const locale = current;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!locale) return;
    setLoading(true);
    try {
      const list = await api.listReviews(locale.public_code);
      setReviews(list);
      setReplyDrafts(Object.fromEntries(list.filter((r) => r.reply).map((r) => [r.id, r.reply ?? ''])));
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReply = async (reviewId: number) => {
    const reply = (replyDrafts[reviewId] ?? '').trim();
    if (!reply) return;
    setBusyId(reviewId);
    try {
      const updated = await api.replyToReview(reviewId, reply);
      setReviews((items) => items.map((r) => (r.id === updated.id ? updated : r)));
      Alert.alert('Pubblicata', 'La risposta è visibile al cliente.');
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setBusyId(null);
  };

  if (!locale) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Seleziona un locale dalla scheda Attività.</Text>
      </View>
    );
  }

  const replyEnabled = canReply(locale);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroTitle}>Recensioni</Text>
      <Text style={styles.heroSub}>{locale.name} · feedback dei clienti AllerTgy</Text>

      {!replyEnabled && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Attiva piano Base o Pro per rispondere pubblicamente alle recensioni.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : reviews.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Nessuna recensione ancora. Invita i clienti a lasciare un feedback dopo la cena.</Text>
        </View>
      ) : (
        reviews.map((rev) => (
          <View key={rev.id} style={styles.card}>
            <View style={styles.revHead}>
              <Text style={styles.author}>{rev.author_name}</Text>
              <Text style={styles.stars}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</Text>
            </View>
            <Text style={styles.date}>{dateLabel(rev.created_at)}</Text>
            {rev.comment ? <Text style={styles.comment}>{rev.comment}</Text> : null}
            {rev.reply ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyLabel}>La tua risposta</Text>
                <Text style={styles.replyText}>{rev.reply}</Text>
              </View>
            ) : null}
            {replyEnabled && (
              <>
                <TextInput
                  style={styles.input}
                  value={replyDrafts[rev.id] ?? ''}
                  onChangeText={(t) => setReplyDrafts((d) => ({ ...d, [rev.id]: t }))}
                  placeholder="Scrivi una risposta pubblica…"
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.btn, (!(replyDrafts[rev.id] ?? '').trim() || busyId === rev.id) && styles.btnDisabled]}
                  onPress={() => submitReply(rev.id)}
                  disabled={!(replyDrafts[rev.id] ?? '').trim() || busyId === rev.id}
                >
                  {busyId === rev.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{rev.reply ? 'Aggiorna risposta' : 'Pubblica risposta'}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.bg, gap: spacing.md },
  heroTitle: { ...typography.h1, color: colors.ink },
  heroSub: { color: colors.textSecondary, fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
  warnBox: { backgroundColor: colors.amberBg, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.amberBorder },
  warnText: { color: colors.amberText, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.card },
  revHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  stars: { color: colors.amberText, fontSize: 14 },
  date: { color: colors.textMuted, fontSize: 11 },
  comment: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  replyBox: { backgroundColor: colors.greenBg, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.greenBorder },
  replyLabel: { fontSize: 10, fontWeight: '800', color: colors.greenText, textTransform: 'uppercase' },
  replyText: { color: colors.greenText, fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, fontSize: 13, minHeight: 72, textAlignVertical: 'top', backgroundColor: colors.bg },
  btn: { backgroundColor: colors.brand, borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
