import { Stack, router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNotifStore } from '../src/store/notifications';
import type { AppNotification } from '../src/api/client';
import { AppText, ErrorStateCard, GlassScreenScroll, Screen, Section } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, spacing } from '../src/theme';

interface Presented { icon: string; title: string; body: string; code?: string }

function present(n: AppNotification): Presented {
  let payload: any = {};
  try { payload = n.payload_json ? JSON.parse(n.payload_json) : {}; } catch { /* ignore */ }
  const code = payload.public_code as string | undefined;
  switch (n.type) {
    case 'menu_updated':
      return { icon: '🍽️', title: 'Menù aggiornato', body: 'Un locale tra i tuoi preferiti ha pubblicato un nuovo menù. Controlla il semaforo!', code };
    case 'review_reply':
      return { icon: '💬', title: 'Risposta alla tua recensione', body: 'Il ristoratore ha risposto alla tua recensione.', code };
    case 'review_received':
      return {
        icon: '⭐',
        title: 'Nuova recensione',
        body: payload.author_name
          ? `${payload.author_name} ha lasciato una recensione sul tuo locale.`
          : 'Hai ricevuto una nuova recensione sul tuo locale.',
        code,
      };
    case 'promo':
    case 'broadcast':
      return {
        icon: '📢',
        title: payload.title || 'Novità dal locale',
        body: payload.body || 'Hai una nuova comunicazione.',
        code: payload.public_code || code
      };
    case 'profile_share':
      return {
        icon: '🔗',
        title: 'Profilo allergie condiviso',
        body: `${payload.owner_display_name || 'Un contatto'} ha condiviso il profilo «${payload.label || 'Allergie'}».`,
        code: payload.token as string | undefined,
      };
    case 'referral_reward':
      return {
        icon: '🎁',
        title: 'Plus Famiglia omaggio!',
        body: payload.restaurant_name
          ? `Hai portato ${payload.restaurant_name} su AllerTgy: il piano Plus Famiglia è attivo gratis per te.`
          : 'Hai portato un ristoratore su AllerTgy: il piano Plus Famiglia è attivo gratis per te.',
      };
    case 'referral_welcome_pro':
      return {
        icon: '🚀',
        title: 'Pro omaggio 30 giorni!',
        body: payload.restaurant_name
          ? `${payload.restaurant_name} ha il piano Pro gratis per 30 giorni grazie al codice invito.`
          : 'Il tuo locale ha il piano Pro gratis per 30 giorni grazie al codice invito.',
      };
    default:
      return {
        icon: '🔔',
        title: payload.title || 'Notifica',
        body: payload.body || n.type,
        code
      };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h fa`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function NotifRow({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const p = present(n);
  const isUnread = !n.read_at;
  return (
    <Pressable
      style={[styles.item, isUnread && styles.itemUnread]}
      onPress={() => onOpen(n)}
    >
      <View style={styles.itemIconWrap}>
        <AppText variant="title">{p.icon}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.itemTop}>
          <AppText variant="bodyBold" style={{ flexShrink: 1 }}>{p.title}</AppText>
          {isUnread ? <View style={styles.unreadDot} /> : null}
        </View>
        <AppText variant="caption">{p.body}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
          {timeAgo(n.created_at)}
        </AppText>
      </View>
      {p.code ? <AppText variant="h2" color={colors.textMuted}>›</AppText> : null}
    </Pressable>
  );
}

export default function Notifiche() {
  const { items, unread, loading, error, refresh, markRead, markAllRead } = useNotifStore();
  const { role } = useSession();

  useEffect(() => { refresh(); }, [refresh]);

  const { unreadItems, readItems } = useMemo(() => ({
    unreadItems: items.filter((n) => !n.read_at),
    readItems: items.filter((n) => !!n.read_at),
  }), [items]);

  const open = (n: AppNotification) => {
    const p = present(n);
    if (!n.read_at) markRead(n.id);
    if (n.type === 'profile_share' && p.code) {
      router.push(`/shared-profile/${p.code}`);
      return;
    }
    if (n.type === 'referral_reward') {
      router.push('/(tabs)/account');
      return;
    }
    if (n.type === 'referral_welcome_pro') {
      if (role === 'owner') router.push('/(owner)/piano');
      else router.push('/(tabs)/account');
      return;
    }
    if (n.type === 'review_received' && role === 'owner') {
      router.push('/(owner)/recensioni');
      return;
    }
    if (p.code) {
      if (n.type === 'promo' || n.type === 'broadcast') {
        router.push({
          pathname: `/menu/${p.code}`,
          params: { promoTitle: p.title, promoBody: p.body }
        });
      } else {
        router.push(`/menu/${p.code}`);
      }
    }
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          title: 'Notifiche',
          headerRight: unread > 0
            ? () => (
              <Pressable onPress={markAllRead} hitSlop={8} style={styles.markAllBtn}>
                <AppText variant="caption" color={colors.brand}>Segna lette</AppText>
              </Pressable>
            )
            : undefined,
        }}
      />

      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
        ) : error ? (
          <ErrorStateCard
            message="Impossibile caricare le notifiche. Controlla la connessione."
            retryLabel="Riprova"
            onRetry={refresh}
            style={{ marginTop: spacing.lg }}
          />
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppText variant="h1">📭</AppText>
            <AppText variant="title">Nessuna notifica</AppText>
            <AppText variant="subtitle" style={{ textAlign: 'center' }}>
              Qui arriveranno gli avvisi sui tuoi locali preferiti e le risposte alle tue recensioni.
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {unreadItems.length > 0 ? (
              <Section title="Non lette" subtitle={`${unreadItems.length} da leggere`} card padded={false}>
                {unreadItems.map((n) => <NotifRow key={n.id} n={n} onOpen={open} />)}
              </Section>
            ) : null}
            {readItems.length > 0 ? (
              <Section title="Lette" subtitle={`${readItems.length} in archivio`} card padded={false}>
                {readItems.map((n) => <NotifRow key={n.id} n={n} onOpen={open} />)}
              </Section>
            ) : null}
          </View>
        )}
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  markAllBtn: { paddingHorizontal: spacing.sm, minHeight: 44, justifyContent: 'center' },
  list: { gap: spacing.lg },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    marginBottom: spacing.sm,
  },
  itemUnread: { borderColor: colors.brand200, backgroundColor: colors.brand50 },
  itemIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
});
