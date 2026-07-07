import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifStore } from '../src/store/notifications';
import type { AppNotification } from '../src/api/client';
import { colors, radius, shadow, spacing, typography } from '../src/theme';

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
    default:
      return { icon: '🔔', title: 'Notifica', body: n.type, code };
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

export default function Notifiche() {
  const { items, unread, loading, refresh, markRead, markAllRead } = useNotifStore();

  useEffect(() => { refresh(); }, [refresh]);

  const open = (n: AppNotification) => {
    const p = present(n);
    if (!n.read_at) markRead(n.id);
    if (p.code) router.push(`/menu/${p.code}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Indietro</Text>
        </TouchableOpacity>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Segna tutte come lette</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>🔔 Notifiche</Text>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Nessuna notifica</Text>
          <Text style={styles.emptyText}>
            {loading ? 'Caricamento…' : 'Qui arriveranno gli avvisi sui tuoi locali preferiti e le risposte alle tue recensioni.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((n) => {
            const p = present(n);
            const isUnread = !n.read_at;
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.item, isUnread && styles.itemUnread]}
                onPress={() => open(n)}
                activeOpacity={0.85}
              >
                <View style={styles.itemIconWrap}>
                  <Text style={styles.itemIcon}>{p.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle}>{p.title}</Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemBody}>{p.body}</Text>
                  <Text style={styles.itemTime}>{timeAgo(n.created_at)}</Text>
                </View>
                {p.code && <Text style={styles.itemArrow}>›</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: 48, backgroundColor: colors.bg, minHeight: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  back: { color: colors.brandDark, fontWeight: '700', fontSize: 15 },
  markAll: { color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  title: { ...typography.h1, color: colors.ink, marginBottom: spacing.lg },

  emptyBox: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.xxxl, marginTop: spacing.lg, gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.h3, color: colors.ink },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  itemUnread: { borderColor: colors.brand200, backgroundColor: colors.brand50 },
  itemIconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  itemIcon: { fontSize: 20 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTitle: { ...typography.h3, color: colors.ink, flexShrink: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  itemBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  itemTime: { color: colors.textMuted, fontSize: 11.5, fontWeight: '600', marginTop: 4 },
  itemArrow: { color: colors.textMuted, fontSize: 24, fontWeight: '300' },
});
