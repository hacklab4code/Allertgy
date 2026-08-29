import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, type Review } from '../../api/client';
import { CollapseSection } from '../ui';
import { colors, radius, shadow, spacing } from '../../theme';
import type { Restaurant } from '../../types';

export function canOwnerReply(r: Restaurant | null) {
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

function ReviewCard({
  rev,
  replyEnabled,
  replyDrafts,
  setReplyDrafts,
  busyId,
  onSubmit,
}: {
  rev: Review;
  replyEnabled: boolean;
  replyDrafts: Record<number, string>;
  setReplyDrafts: (fn: (prev: Record<number, string>) => Record<number, string>) => void;
  busyId: number | null;
  onSubmit: (id: number) => void;
}) {
  return (
    <View style={styles.card}>
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
            placeholder={rev.reply ? 'Aggiorna la risposta…' : 'Scrivi una risposta pubblica…'}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.btn, (!(replyDrafts[rev.id] ?? '').trim() || busyId === rev.id) && styles.btnDisabled]}
            onPress={() => onSubmit(rev.id)}
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
  );
}

type Props = {
  locale: Restaurant | null;
  /** Aggiorna badge/preview nel genitore (es. CollapseSection su Attività). */
  onStats?: (stats: { total: number; pending: number }) => void;
  /** Carica solo le stats (niente lista UI) — utile per badge sull'hub Attività. */
  statsOnly?: boolean;
};

export function OwnerReviewsPanel({ locale, onStats, statsOnly }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [repliedExpanded, setRepliedExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!locale) {
      setReviews([]);
      onStats?.({ total: 0, pending: 0 });
      return;
    }
    setLoading(true);
    try {
      const list = await api.listReviews(locale.public_code);
      setReviews(list);
      setReplyDrafts(Object.fromEntries(list.filter((r) => r.reply).map((r) => [r.id, r.reply ?? ''])));
      onStats?.({
        total: list.length,
        pending: list.filter((r) => !r.reply).length,
      });
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setLoading(false);
  }, [locale, onStats]);

  useEffect(() => {
    load();
  }, [load]);

  const { pending, replied } = useMemo(() => ({
    pending: reviews.filter((r) => !r.reply),
    replied: reviews.filter((r) => !!r.reply),
  }), [reviews]);

  const submitReply = async (reviewId: number) => {
    const reply = (replyDrafts[reviewId] ?? '').trim();
    if (!reply) return;
    setBusyId(reviewId);
    try {
      const updated = await api.replyToReview(reviewId, reply);
      const next = reviews.map((r) => (r.id === updated.id ? updated : r));
      setReviews(next);
      onStats?.({
        total: next.length,
        pending: next.filter((r) => !r.reply).length,
      });
      Alert.alert('Pubblicata', 'La risposta è visibile al cliente.');
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setBusyId(null);
  };

  if (statsOnly) return null;

  if (!locale) {
    return <Text style={styles.muted}>Seleziona un locale per vedere le recensioni.</Text>;
  }

  const replyEnabled = canOwnerReply(locale);

  return (
    <View style={styles.wrap}>
      {!replyEnabled ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Attiva piano Base o Pro per rispondere pubblicamente alle recensioni.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.md }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.muted}>
          Nessuna recensione ancora. Invita i clienti a lasciare un feedback dopo la cena.
        </Text>
      ) : (
        <>
          {pending.length > 0 ? (
            <CollapseSection
              icon="chatbubble-ellipses"
              title="Da rispondere"
              preview={`${pending.length} in attesa`}
              badge={pending.length}
              expanded={pendingExpanded}
              onToggle={() => setPendingExpanded((v) => !v)}
              tint="yellow"
            >
              {pending.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  rev={rev}
                  replyEnabled={replyEnabled}
                  replyDrafts={replyDrafts}
                  setReplyDrafts={setReplyDrafts}
                  busyId={busyId}
                  onSubmit={submitReply}
                />
              ))}
            </CollapseSection>
          ) : null}

          {replied.length > 0 ? (
            <CollapseSection
              icon="checkmark-done"
              title="Già risposte"
              preview={`${replied.length} recensioni`}
              badge={replied.length}
              expanded={repliedExpanded}
              onToggle={() => setRepliedExpanded((v) => !v)}
              tint="green"
            >
              {replied.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  rev={rev}
                  replyEnabled={replyEnabled}
                  replyDrafts={replyDrafts}
                  setReplyDrafts={setReplyDrafts}
                  busyId={busyId}
                  onSubmit={submitReply}
                />
              ))}
            </CollapseSection>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: spacing.sm },
  warnBox: {
    backgroundColor: colors.amberBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  warnText: { color: colors.amberText, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.card,
    marginBottom: spacing.sm,
  },
  revHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  stars: { color: colors.amberText, fontSize: 14 },
  date: { color: colors.textMuted, fontSize: 11 },
  comment: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  replyBox: {
    backgroundColor: colors.greenBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  replyLabel: { fontSize: 10, fontWeight: '800', color: colors.greenText, textTransform: 'uppercase' },
  replyText: { color: colors.greenText, fontSize: 13, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 13,
    minHeight: 72,
    textAlignVertical: 'top',
    backgroundColor: colors.bg,
  },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
