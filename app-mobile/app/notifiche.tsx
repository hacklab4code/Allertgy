import { Stack, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNotifStore } from '../src/store/notifications';
import type { AppNotification } from '../src/api/client';
import { AppText, ErrorStateCard, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, font, radius } from '../src/theme';

interface NotificationTheme {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  code?: string;
  categoryLabel: string;
  iconBg: string;
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
        icon: 'restaurant-outline',
        title: 'Menù aggiornato',
        body: 'Un locale tra i tuoi preferiti ha pubblicato un nuovo menù. Controlla il semaforo allergeni!',
        code,
        categoryLabel: 'MENÙ',
        iconBg: '#FFFBEB',
        iconColor: '#D97706',
        accentBorderColor: '#FDE68A',
        actionLabel: 'Vedi Menù',
      };
    case 'review_reply':
      return {
        icon: 'chatbubbles-outline',
        title: 'Risposta alla tua recensione',
        body: 'Il ristoratore ha risposto alla tua recensione sul locale.',
        code,
        categoryLabel: 'RECENSIONE',
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        accentBorderColor: '#BFDBFE',
        actionLabel: 'Leggi risposta',
      };
    case 'review_received':
      return {
        icon: 'star-outline',
        title: 'Nuova recensione ricevuta',
        body: payload.author_name
          ? `${payload.author_name} ha lasciato una recensione sul tuo locale.`
          : 'Hai ricevuto una nuova recensione sul tuo locale.',
        code,
        categoryLabel: 'RECENSIONE',
        iconBg: '#FEF3C7',
        iconColor: '#B45309',
        accentBorderColor: '#FDE68A',
        actionLabel: 'Vedi recensioni',
      };
    case 'promo':
    case 'broadcast':
      return {
        icon: 'megaphone-outline',
        title: payload.title || 'Novità dal locale',
        body: payload.body || 'Hai una nuova comunicazione importante dal ristorante.',
        code: payload.public_code || code,
        categoryLabel: 'COMUNICAZIONE',
        iconBg: '#F5F3FF',
        iconColor: '#7C3AED',
        accentBorderColor: '#DDD6FE',
        actionLabel: 'Scopri offerta',
      };
    case 'profile_share':
      return {
        icon: 'share-social-outline',
        title: 'Profilo allergie condiviso',
        body: `${payload.owner_display_name || 'Un contatto'} ha condiviso con te il profilo «${payload.label || 'Allergie'}».`,
        code: payload.token as string | undefined,
        categoryLabel: 'PROFILO',
        iconBg: '#F1FEC8',
        iconColor: '#23212C',
        accentBorderColor: '#E2F4A6',
        actionLabel: 'Vedi profilo',
      };
    case 'referral_reward':
      return {
        icon: 'gift-outline',
        title: 'Plus Famiglia in omaggio!',
        body: payload.restaurant_name
          ? `Hai portato ${payload.restaurant_name} su AllerTgy: il piano Plus Famiglia è attivo gratis per te.`
          : 'Hai portato un ristoratore su AllerTgy: il piano Plus Famiglia è attivo gratis per te.',
        categoryLabel: 'PREMIO',
        iconBg: '#ECFDF5',
        iconColor: '#059669',
        accentBorderColor: '#A7F3D0',
        actionLabel: 'Il tuo account',
      };
    case 'referral_welcome_pro':
      return {
        icon: 'rocket-outline',
        title: 'Pro omaggio 30 giorni!',
        body: payload.restaurant_name
          ? `${payload.restaurant_name} ha il piano Pro gratis per 30 giorni grazie al codice invito.`
          : 'Il tuo locale ha il piano Pro gratis per 30 giorni grazie al codice invito.',
        categoryLabel: 'PRO',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
        accentBorderColor: '#FED7AA',
        actionLabel: 'Gestisci piano',
      };
    default:
      return {
        icon: 'notifications-outline',
        title: payload.title || 'Nuovo Avviso',
        body: payload.body || n.type,
        code,
        categoryLabel: 'AVVISO',
        iconBg: '#F8FAFC',
        iconColor: '#23212C',
        accentBorderColor: '#E2E8F0',
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
      <View style={styles.cardContent}>
        {/* Icon Avatar Box */}
        <View style={[styles.avatarBox, { backgroundColor: p.iconBg, borderColor: p.accentBorderColor }]}>
          <Ionicons name={p.icon} size={20} color={p.iconColor} />
        </View>

        {/* Text & Meta */}
        <View style={styles.cardMain}>
          <View style={styles.rowTop}>
            <View style={[styles.categoryBadge, { backgroundColor: p.iconBg, borderColor: p.accentBorderColor }]}>
              <AppText variant="caption" style={[styles.categoryBadgeText, { color: p.iconColor }]}>
                {p.categoryLabel}
              </AppText>
            </View>

            <View style={styles.timeAgoWrap}>
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <AppText variant="caption" color="#94A3B8" style={styles.timeAgoText}>
                {timeAgo(n.created_at)}
              </AppText>
            </View>

            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <AppText variant="bodyBold" style={[styles.titleText, isUnread && styles.titleUnread]}>
            {p.title}
          </AppText>

          <AppText variant="caption" color="#64748B" style={styles.bodyText} numberOfLines={3}>
            {p.body}
          </AppText>

          {p.actionLabel && (
            <View style={styles.actionRow}>
              <AppText variant="caption" style={[styles.actionLabelText, { color: p.iconColor }]}>
                {p.actionLabel}
              </AppText>
              <Ionicons name="chevron-forward-outline" size={13} color={p.iconColor} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificheScreen() {
  const insets = useSafeAreaInsets();
  const { items, unread, loading, error, refresh, markRead, markAllRead } = useNotifStore();
  const { role } = useSession();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    void Haptics.selectionAsync();
    setFilter(mode);
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title="Centro Notifiche"
        rightElement={
          unread > 0 ? (
            <Pressable
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                markAllRead();
              }}
              hitSlop={10}
              style={styles.markAllBtn}
            >
              <Ionicons name="checkmark-done-outline" size={15} color="#23212C" />
              <AppText variant="caption" style={styles.markAllText}>
                Segna lette
              </AppText>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#23212C"
              colors={['#23212C']}
            />
          }
        >
          {/* 1. HERO SUMMARY CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="notifications-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  Avvisi & Aggiornamenti
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  Novità su menù preferiti, recensioni e profili condivisi.
                </AppText>
              </View>
            </View>

            {/* QUICK STATS */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Ionicons name="mail-unread-outline" size={14} color="#F1FEC8" />
                <AppText variant="caption" style={styles.statLabel}>
                  Non lette: <AppText variant="caption" style={styles.statValue}>{unread}</AppText>
                </AppText>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="documents-outline" size={14} color="rgba(255,255,255,0.7)" />
                <AppText variant="caption" style={styles.statLabel}>
                  Totale: <AppText variant="caption" style={styles.statValue}>{items.length}</AppText>
                </AppText>
              </View>

              {unread > 0 && (
                <Pressable
                  style={styles.heroActionBtn}
                  onPress={() => {
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    markAllRead();
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={14} color="#23212C" />
                  <AppText variant="caption" style={styles.heroActionBtnText}>
                    Segna tutte lette
                  </AppText>
                </Pressable>
              )}
            </View>
          </View>

          {/* 2. FILTER PILLS BAR */}
          {items.length > 0 && (
            <View style={styles.filterBar}>
              <Pressable
                onPress={() => setFilterMode('all')}
                style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              >
                <Ionicons
                  name="albums-outline"
                  size={13}
                  color={filter === 'all' ? '#F1FEC8' : '#64748B'}
                />
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
                <Ionicons
                  name="mail-unread-outline"
                  size={13}
                  color={filter === 'unread' ? '#F1FEC8' : '#64748B'}
                />
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
                <Ionicons
                  name="archive-outline"
                  size={13}
                  color={filter === 'read' ? '#F1FEC8' : '#64748B'}
                />
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

          {/* 3. CONTENT / LISTA NOTIFICHE */}
          {loading && items.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#23212C" size="large" />
              <AppText variant="caption" color="#64748B" style={{ marginTop: 8 }}>
                Caricamento notifiche in corso...
              </AppText>
            </View>
          ) : error ? (
            <ErrorStateCard
              message="Impossibile caricare le notifiche. Controlla la connessione."
              retryLabel="Riprova"
              onRetry={refresh}
              style={{ marginTop: 12 }}
            />
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={38} color="#23212C" />
              </View>
              <AppText variant="title" style={styles.emptyTitle}>
                {filter === 'unread'
                  ? 'Nessuna notifica non letta'
                  : filter === 'read'
                  ? 'Nessuna notifica in archivio'
                  : 'Nessuna notifica presente'}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.emptySubtext}>
                {filter === 'unread'
                  ? 'Tutto in ordine! Tutte le comunicazioni importanti sono state lette.'
                  : 'Qui troverai gli avvisi sui locali preferiti, aggiornamenti dei menù e novità dal tuo profilo.'}
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredItems.map((n) => (
                <NotifRow key={n.id} n={n} onOpen={open} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    gap: 14,
    paddingTop: 4,
  },
  navBackBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: 4,
  },
  markAllText: {
    fontWeight: '800',
    fontSize: 11.5,
    color: '#23212C',
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#23212C',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.2)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.3)',
  },
  heroTextContainer: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statLabel: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statValue: {
    fontWeight: '700',
    color: '#F1FEC8',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1FEC8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginLeft: 'auto',
  },
  heroActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#23212C',
  },

  // FILTER BAR
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  filterText: {
    fontWeight: '600',
    color: '#64748B',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  unreadFilterBadge: {
    backgroundColor: '#F1FEC8',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(241, 254, 200, 0.25)',
  },
  filterBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: '#F1FEC8',
  },

  // NOTIFICATION CARDS
  list: {
    gap: 12,
  },
  cardContainer: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardRead: {
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.88,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  timeAgoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  timeAgoText: {
    fontSize: 11,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#23212C',
    marginLeft: 2,
  },
  titleText: {
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 19,
  },
  titleUnread: {
    fontWeight: '800',
    color: '#23212C',
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  actionLabelText: {
    fontWeight: '700',
    fontSize: 11.5,
  },

  // LOADING & EMPTY STATES
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#23212C',
    fontSize: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    fontSize: 12.5,
  },
});
