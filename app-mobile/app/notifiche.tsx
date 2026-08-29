import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useNotifStore } from '../src/store/notifications';
import type { AppNotification } from '../src/api/client';
import { AppText, ErrorStateCard, GlassScreenScroll, Screen } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, radius, spacing } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface NotificationTheme {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  code?: string;
  categoryLabel: string;
  gradientColors: [string, string];
  iconColor: string;
  accentBorderColor: string;
  actionLabel?: string;
}

function present(n: AppNotification): NotificationTheme {
  let payload: any = {};
  try {
    payload = n.payload_json ? JSON.parse(n.payload_json) : {};
  } catch {
    /* ignore */
  }
  const code = payload.public_code as string | undefined;

  switch (n.type) {
    case 'menu_updated':
      return {
        icon: 'restaurant',
        title: 'Menù aggiornato',
        body: 'Un locale tra i tuoi preferiti ha pubblicato un nuovo menù. Controlla il semaforo!',
        code,
        categoryLabel: 'MENÙ',
        gradientColors: ['#FFF3E0', '#FFE0B2'],
        iconColor: '#E65100',
        accentBorderColor: '#FF9800',
        actionLabel: 'Vedi Menù',
      };
    case 'review_reply':
      return {
        icon: 'chatbubbles',
        title: 'Risposta alla tua recensione',
        body: 'Il ristoratore ha risposto alla tua recensione.',
        code,
        categoryLabel: 'RECENSIONE',
        gradientColors: ['#E3F2FD', '#BBDEFB'],
        iconColor: '#1565C0',
        accentBorderColor: '#2196F3',
        actionLabel: 'Leggi risposta',
      };
    case 'review_received':
      return {
        icon: 'star',
        title: 'Nuova recensione',
        body: payload.author_name
          ? `${payload.author_name} ha lasciato una recensione sul tuo locale.`
          : 'Hai ricevuto una nuova recensione sul tuo locale.',
        code,
        categoryLabel: 'RECENSIONE',
        gradientColors: ['#FFF8E1', '#FFECB3'],
        iconColor: '#F57F17',
        accentBorderColor: '#FFC107',
        actionLabel: 'Vedi recensioni',
      };
    case 'promo':
    case 'broadcast':
      return {
        icon: 'megaphone',
        title: payload.title || 'Novità dal locale',
        body: payload.body || 'Hai una nuova comunicazione.',
        code: payload.public_code || code,
        categoryLabel: 'PROMO',
        gradientColors: ['#F3E5F5', '#E1BEE7'],
        iconColor: '#6A1B9A',
        accentBorderColor: '#AB47BC',
        actionLabel: 'Scopri offerta',
      };
    case 'profile_share':
      return {
        icon: 'share-social',
        title: 'Profilo allergie condiviso',
        body: `${payload.owner_display_name || 'Un contatto'} ha condiviso il profilo «${payload.label || 'Allergie'}».`,
        code: payload.token as string | undefined,
        categoryLabel: 'PROFILO',
        gradientColors: ['#EDE7F6', '#D1C4E9'],
        iconColor: '#4527A0',
        accentBorderColor: '#7E57C2',
        actionLabel: 'Vedi profilo',
      };
    case 'referral_reward':
      return {
        icon: 'gift',
        title: 'Plus Famiglia omaggio!',
        body: payload.restaurant_name
          ? `Hai portato ${payload.restaurant_name} su AllerTgy: il piano Plus Famiglia è attivo gratis per te.`
          : 'Hai portato un ristoratore su AllerTgy: il piano Plus Famiglia è attivo gratis per te.',
        categoryLabel: 'PREMIO',
        gradientColors: ['#E8F5E9', '#C8E6C9'],
        iconColor: '#2E7D32',
        accentBorderColor: '#66BB6A',
        actionLabel: 'Il tuo account',
      };
    case 'referral_welcome_pro':
      return {
        icon: 'rocket',
        title: 'Pro omaggio 30 giorni!',
        body: payload.restaurant_name
          ? `${payload.restaurant_name} ha il piano Pro gratis per 30 giorni grazie al codice invito.`
          : 'Il tuo locale ha il piano Pro gratis per 30 giorni grazie al codice invito.',
        categoryLabel: 'PRO 30G',
        gradientColors: ['#FBE9E7', '#FFCCBC'],
        iconColor: '#D84315',
        accentBorderColor: '#FF7043',
        actionLabel: 'Gestisci piano',
      };
    default:
      return {
        icon: 'notifications',
        title: payload.title || 'Notifica',
        body: payload.body || n.type,
        code,
        categoryLabel: 'NOTIFICA',
        gradientColors: ['#F0F0FF', '#E0E0FF'],
        iconColor: colors.brand,
        accentBorderColor: colors.brand,
        actionLabel: 'Dettagli',
      };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min}m fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

type FilterMode = 'all' | 'unread' | 'read';

function NotifRow({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const p = present(n);
  const isUnread = !n.read_at;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        isUnread ? styles.cardUnread : styles.cardRead,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onOpen(n)}
    >
      {isUnread && <View style={[styles.unreadAccentBar, { backgroundColor: p.accentBorderColor }]} />}

      <View style={styles.cardContent}>
        {/* Icon Avatar Gradient */}
        <LinearGradient
          colors={p.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <Ionicons name={p.icon} size={22} color={p.iconColor} />
        </LinearGradient>

        {/* Text & Meta */}
        <View style={styles.cardMain}>
          <View style={styles.rowTop}>
            <View style={[styles.categoryBadge, { backgroundColor: `${p.iconColor}14` }]}>
              <AppText
                variant="caption"
                style={{ color: p.iconColor, fontWeight: '700', fontSize: 10, letterSpacing: 0.4 }}
              >
                {p.categoryLabel}
              </AppText>
            </View>

            <View style={styles.timeAgoWrap}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                {timeAgo(n.created_at)}
              </AppText>
            </View>

            {isUnread && <View style={[styles.unreadBadgeDot, { backgroundColor: p.iconColor }]} />}
          </View>

          <AppText variant="bodyBold" style={[styles.titleText, isUnread && styles.titleUnread]}>
            {p.title}
          </AppText>

          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.bodyText} numberOfLines={3}>
            {p.body}
          </AppText>

          {p.actionLabel && (
            <View style={styles.actionRow}>
              <AppText variant="caption" style={{ color: p.iconColor, fontWeight: '700', fontSize: 12 }}>
                {p.actionLabel}
              </AppText>
              <Ionicons name="chevron-forward" size={13} color={p.iconColor} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function Notifiche() {
  const { items, unread, loading, error, refresh, markRead, markAllRead } = useNotifStore();
  const { role } = useSession();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const { unreadItems, readItems } = useMemo(
    () => ({
      unreadItems: items.filter((n) => !n.read_at),
      readItems: items.filter((n) => !!n.read_at),
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === 'unread') return unreadItems;
    if (filter === 'read') return readItems;
    return items;
  }, [filter, items, readItems, unreadItems]);

  const open = (n: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          params: { promoTitle: p.title, promoBody: p.body },
        });
      } else {
        router.push(`/menu/${p.code}`);
      }
    }
  };

  const setFilterMode = (mode: FilterMode) => {
    Haptics.selectionAsync();
    setFilter(mode);
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          title: 'Notifiche',
          headerBackTitle: 'Indietro',
          headerRight:
            unread > 0
              ? () => (
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      markAllRead();
                    }}
                    hitSlop={10}
                    style={styles.markAllBtn}
                  >
                    <Ionicons name="checkmark-done-outline" size={15} color={colors.brand} />
                    <AppText variant="caption" color={colors.brand} style={styles.markAllText}>
                      Segna lette
                    </AppText>
                  </Pressable>
                )
              : undefined,
        }}
      />

      <GlassScreenScroll
        headerFloat={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {/* Filter Pills */}
        {items.length > 0 && (
          <View style={styles.filterBar}>
            <Pressable
              onPress={() => setFilterMode('all')}
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            >
              <AppText
                variant="caption"
                style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
              >
                Tutte
              </AppText>
              <View style={[styles.filterBadge, filter === 'all' && styles.filterBadgeActive]}>
                <AppText
                  variant="caption"
                  style={[styles.filterBadgeText, filter === 'all' && styles.filterBadgeTextActive]}
                >
                  {items.length}
                </AppText>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setFilterMode('unread')}
              style={[styles.filterPill, filter === 'unread' && styles.filterPillActive]}
            >
              <AppText
                variant="caption"
                style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}
              >
                Non lette
              </AppText>
              {unreadItems.length > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    styles.unreadFilterBadge,
                    filter === 'unread' && styles.filterBadgeActive,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={[styles.filterBadgeText, filter === 'unread' && styles.filterBadgeTextActive]}
                  >
                    {unreadItems.length}
                  </AppText>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setFilterMode('read')}
              style={[styles.filterPill, filter === 'read' && styles.filterPillActive]}
            >
              <AppText
                variant="caption"
                style={[styles.filterText, filter === 'read' && styles.filterTextActive]}
              >
                Archivio
              </AppText>
              <View style={[styles.filterBadge, filter === 'read' && styles.filterBadgeActive]}>
                <AppText
                  variant="caption"
                  style={[styles.filterBadgeText, filter === 'read' && styles.filterBadgeTextActive]}
                >
                  {readItems.length}
                </AppText>
              </View>
            </Pressable>
          </View>
        )}

        {/* Content list */}
        {loading && items.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.brand} size="large" />
            <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: spacing.xs }}>
              Caricamento notifiche...
            </AppText>
          </View>
        ) : error ? (
          <ErrorStateCard
            message="Impossibile caricare le notifiche. Controlla la connessione."
            retryLabel="Riprova"
            onRetry={refresh}
            style={{ marginTop: spacing.lg }}
          />
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={['#F3E8FF', '#E9D5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconWrap}
            >
              <Ionicons name="notifications-off-outline" size={36} color={colors.brand} />
            </LinearGradient>
            <AppText variant="title" style={{ textAlign: 'center' }}>
              {filter === 'unread'
                ? 'Nessuna notifica non letta'
                : filter === 'read'
                ? 'Nessuna notifica in archivio'
                : 'Nessuna notifica'}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.emptySubtext}>
              {filter === 'unread'
                ? 'Sei perfettamente in pari! Tutte le comunicazioni importanti sono state lette.'
                : 'Qui troverai gli avvisi sui tuoi locali preferiti, aggiornamenti dei menù e novità dal tuo profilo.'}
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((n) => (
              <NotifRow key={n.id} n={n} onOpen={open} />
            ))}
          </View>
        )}
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 32,
    gap: spacing.md,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginRight: 4,
  },
  markAllText: {
    fontWeight: '700',
    fontSize: 12,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterText: {
    fontWeight: '600',
    color: colors.onSurfaceMuted,
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  unreadFilterBadge: {
    backgroundColor: colors.brand50,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceMuted,
  },
  filterBadgeTextActive: {
    color: colors.white,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  list: {
    gap: 12,
  },
  cardContainer: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(109, 40, 217, 0.25)',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  cardRead: {
    opacity: 0.92,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.88,
  },
  unreadAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  avatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardMain: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  timeAgoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  unreadBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleText: {
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: '800',
    color: colors.ink,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
