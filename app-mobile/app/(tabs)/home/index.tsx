import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { api } from '../../../src/api/client';
import { calcolaCompatibilita } from '../../../src/engine/compatibility';
import RestaurantCard from '../../../src/components/RestaurantCard';
import HomeRestaurantSearch from '../../../src/components/HomeRestaurantSearch';
import { useSession } from '../../../src/store/session';
import { useProfileSheet } from '../../../src/store/profileSheet';
import {
  colors, font, puffyShadow, radius, spacing, statoToVerdict, verdictColor, type Verdict,
} from '../../../src/theme';
import { syncFavoritesFromServer, toggleRestaurantFavorite } from '../../../src/services/favorites';
import { avviaGeofencing, fermaGeofencing, trovaLocaleRecenteVicino } from '../../../src/services/geofencing';
import { useTranslation } from '../../../src/constants/translations';
import { loadScanHistory } from '../../../src/services/productStorage';
import type { ScannedProduct } from '../../../src/services/barcodeScan';
import type { RestaurantSummary } from '../../../src/types';
import { useActiveProfileAllergies } from '../../../src/hooks/useActiveProfileAllergies';
import { moodFromCompatPercentuale } from '../../../src/experience/moodPalette';
import { useExperienceMood } from '../../../src/store/experienceMood';
import {
  AllergyProfileBanner,
  AppText,
  ErrorStateCard,
  GlassCard,
  GlassScreenScroll,
  PuffyButton,
  Screen,
  Section,
  TrafficDot,
  VerdictPill,
} from '../../../src/components/ui';

type RecentItem =
  | { kind: 'restaurant'; code: string; name: string; visitedAt: string; verdict: Verdict }
  | { kind: 'product'; product: ScannedProduct };

function verdictFromCompat(percentuale: number | null | undefined, rosso?: number): Verdict {
  if (percentuale == null) return 'yellow';
  if (percentuale === 100) return 'green';
  if ((rosso ?? 0) > 0) return 'red';
  return 'yellow';
}

function recentTimestamp(item: RecentItem): number {
  const iso = item.kind === 'restaurant' ? item.visitedAt : item.product.date;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function formatRecentWhen(iso: string, isIt: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return isIt ? 'Adesso' : 'Just now';
  if (diffHours < 24) return isIt ? `${diffHours} ore fa` : `${diffHours}h ago`;
  if (diffDays === 1) return isIt ? 'Ieri' : 'Yesterday';
  if (diffDays < 7) return isIt ? `${diffDays} giorni fa` : `${diffDays} days ago`;
  return date.toLocaleDateString(isIt ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' });
}

function greetingWord(isIt: boolean): string {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 22) return isIt ? 'Buonanotte' : 'Good night';
  if (hour < 12) return isIt ? 'Buongiorno' : 'Good morning';
  if (hour < 18) return isIt ? 'Buon pomeriggio' : 'Good afternoon';
  return isIt ? 'Buonasera' : 'Good evening';
}

function enter(delayMs: number) {
  return FadeInDown.delay(delayMs).duration(380).springify().damping(20);
}

type HomeQuickTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
};

function HomeQuickTile({ icon, label, onPress, badge }: HomeQuickTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <Animated.View style={[styles.quickOuter, puffyShadow(6), animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showBadge ? `${label}, ${badge}` : label}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18, stiffness: 380 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 280 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={styles.quickBtn}
      >
        <View style={styles.quickInner}>
          <View style={styles.quickIcon}>
            <Ionicons name={icon} size={18} color={colors.brand} />
            {showBadge ? (
              <View style={styles.quickBadge}>
                <AppText style={styles.quickBadgeText}>
                  {badge > 9 ? '9+' : String(badge)}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText style={styles.quickLabel} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Home() {
  const {
    recents,
    favorites,
    token,
    ingredientiEsclusi,
    setSubProfiles,
    isFavorite,
  } = useSession();

  const openProfileSheet = useProfileSheet((s) => s.open);
  const [productRecents, setProductRecents] = useState<ScannedProduct[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [dismissedVenueCode, setDismissedVenueCode] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  const {
    allergie,
    hasAllergie,
    activeLabel,
    isIt,
  } = useActiveProfileAllergies({ selfName: userDisplayName });

  const { t } = useTranslation();

  const loadProductRecents = useCallback(async () => {
    const history = await loadScanHistory();
    setProductRecents(history.slice(0, 5));
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return null;
      }
      setLocationStatus('granted');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation(loc);
      return loc;
    } catch {
      setLocationStatus('error');
      return null;
    }
  }, []);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      await refreshLocation();
    } else {
      setLocationStatus('denied');
    }
  }, [refreshLocation]);

  const loadRestaurants = useCallback(() => {
    setLoadingRestaurants(true);
    setRestaurantsError(false);
    api.listRestaurantsSummary()
      .then((res) => {
        setRestaurants(res);
        avviaGeofencing(res).catch(() => { });
      })
      .catch(() => setRestaurantsError(true))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    loadRestaurants();
    return () => { fermaGeofencing(); };
  }, [loadRestaurants]);

  useEffect(() => {
    const timer = setTimeout(() => { requestLocation(); }, 400);
    return () => clearTimeout(timer);
  }, [requestLocation]);

  useFocusEffect(
    useCallback(() => {
      let locationSub: Location.LocationSubscription | null = null;

      loadProductRecents();
      refreshLocation().then(async (loc) => {
        if (!loc) return;
        try {
          locationSub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 40,
              timeInterval: 20000,
            },
            (position) => setUserLocation(position),
          );
        } catch {
          /* watch non disponibile */
        }
      });

      if (token) {
        syncFavoritesFromServer().catch(() => { });
        api.getSubProfiles().then(setSubProfiles).catch(() => { });
        api.getProfile()
          .then((profile) => setUserDisplayName(profile.display_name?.trim() || null))
          .catch(() => { });
      } else {
        setUserDisplayName(null);
      }

      return () => {
        locationSub?.remove();
      };
    }, [token, loadProductRecents, setSubProfiles, refreshLocation]),
  );

  useEffect(() => {
    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => { });
      syncFavoritesFromServer().catch(() => { });
      api.getProfile()
        .then((profile) => setUserDisplayName(profile.display_name?.trim() || null))
        .catch(() => { });
    } else {
      setUserDisplayName(null);
    }
    loadProductRecents();
  }, [token, setSubProfiles, loadProductRecents]);

  const restaurantCompat = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calcolaCompatibilita>>();
    for (const r of restaurants) {
      if (r.piatti.length > 0) {
        map.set(r.public_code, calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi));
      }
    }
    return map;
  }, [restaurants, allergie, ingredientiEsclusi]);

  const restaurantCoords = useMemo(() => {
    const map = new Map<string, { latitude: number; longitude: number }>();
    for (const r of restaurants) {
      if (r.latitude != null && r.longitude != null) {
        map.set(r.public_code, { latitude: r.latitude, longitude: r.longitude });
      }
    }
    return map;
  }, [restaurants]);

  const atRecentVenue = useMemo(() => {
    if (!userLocation || recents.length === 0 || locationStatus !== 'granted') return null;
    return trovaLocaleRecenteVicino(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      recents,
      restaurantCoords,
    );
  }, [userLocation, recents, restaurantCoords, locationStatus]);

  useEffect(() => {
    if (!atRecentVenue) {
      setDismissedVenueCode(null);
      return;
    }
    if (dismissedVenueCode && dismissedVenueCode !== atRecentVenue.code) {
      setDismissedVenueCode(null);
    }
  }, [atRecentVenue, dismissedVenueCode]);

  const showAtVenuePrompt = !!atRecentVenue && atRecentVenue.code !== dismissedVenueCode;
  const atVenueCompat = atRecentVenue ? restaurantCompat.get(atRecentVenue.code) : null;
  const atVenueMood = moodFromCompatPercentuale(atVenueCompat?.percentuale);
  const atVenueVerdict: Verdict = atVenueMood === 'brand' ? 'yellow' : atVenueMood;
  const setLiveMood = useExperienceMood((s) => s.setLiveMood);

  useEffect(() => {
    if (showAtVenuePrompt && atVenueCompat) {
      setLiveMood(atVenueMood === 'brand' ? null : atVenueMood);
      return;
    }
    setLiveMood(null);
  }, [showAtVenuePrompt, atVenueCompat, atVenueMood, setLiveMood]);

  const activityItems = useMemo<RecentItem[]>(() => {
    const venueItems: RecentItem[] = recents.map((r) => {
      const compat = restaurantCompat.get(r.code);
      return {
        kind: 'restaurant',
        code: r.code,
        name: r.name,
        visitedAt: r.visitedAt,
        verdict: verdictFromCompat(compat?.percentuale, compat?.rosso),
      };
    });
    const productItems: RecentItem[] = productRecents.map((p) => ({
      kind: 'product',
      product: p,
    }));
    const merged = [...venueItems, ...productItems].sort((a, b) => recentTimestamp(b) - recentTimestamp(a));
    const hiddenCodes = new Set<string>();
    if (showAtVenuePrompt && atRecentVenue) hiddenCodes.add(atRecentVenue.code);
    if (hiddenCodes.size === 0) return merged;
    return merged.filter((item) => item.kind !== 'restaurant' || !hiddenCodes.has(item.code));
  }, [recents, productRecents, restaurantCompat, showAtVenuePrompt, atRecentVenue]);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const nearbyRestaurants = useMemo(() => {
    if (!userLocation || restaurants.length === 0) return [];
    const userLat = userLocation.coords.latitude;
    const userLon = userLocation.coords.longitude;

    return restaurants
      .map((r) => {
        if (r.latitude == null || r.longitude == null) return null;
        const dist = getDistanceKm(userLat, userLon, r.latitude, r.longitude);
        const distanceLabel = dist < 1
          ? `${Math.round(dist * 1000)} m`
          : `${dist.toFixed(1)} km`;
        const compatibility = r.piatti.length > 0
          ? calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi)
          : null;
        return {
          code: r.public_code,
          name: r.nome_ristorante,
          city: r.citta,
          compatibility,
          distance: dist,
          distanceLabel,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [restaurants, userLocation, allergie, ingredientiEsclusi]);

  const openMenu = async (rawCode: string) => {
    const target = rawCode.trim();
    if (!/^\d{6}$/.test(target)) return;
    try {
      await api.menu(target);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/menu/${target}`);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const onRecentPress = (item: RecentItem) => {
    if (item.kind === 'restaurant') {
      openMenu(item.code);
    } else {
      router.push({ pathname: '/scanner', params: { barcode: item.product.barcode } });
    }
  };

  const onToggleFavorite = (code: string, name: string) => {
    void toggleRestaurantFavorite(code, name);
  };

  const openProfile = () => {
    void Haptics.selectionAsync();
    openProfileSheet();
  };

  const profileStatus = hasAllergie
    ? (isIt
      ? `${allergie.length} allergi${allergie.length === 1 ? 'a' : 'e'} · semaforo attivo`
      : `${allergie.length} allerg${allergie.length === 1 ? 'y' : 'ies'} · traffic light on`)
    : (isIt ? 'Profilo da completare' : 'Profile incomplete');

  const atVenueTint = atVenueVerdict === 'green'
    ? 'green'
    : atVenueVerdict === 'red'
      ? 'red'
      : 'yellow';

  const renderNearby = () => {
    if (restaurantsError) {
      return (
        <ErrorStateCard
          message={t('restaurants_load_error')}
          retryLabel={t('retry_btn')}
          onRetry={loadRestaurants}
        />
      );
    }
    if (loadingRestaurants || locationStatus === 'prompt') {
      return <ActivityIndicator color={colors.brand} style={styles.loader} />;
    }
    if (locationStatus === 'denied' || locationStatus === 'error') {
      return (
        <GlassCard onPress={requestLocation} tint="brand" style={styles.inlineCard}>
          <View style={styles.inlineCta}>
            <View style={styles.inlineIcon}>
              <Ionicons name="location-outline" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{t('enable_btn')}</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>{t('location_disabled_desc')}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
          </View>
        </GlassCard>
      );
    }
    if (nearbyRestaurants.length === 0) {
      return (
        <GlassCard onPress={() => router.push('/(tabs)/locali')} tint="brand" style={styles.inlineCard}>
          <View style={styles.inlineCta}>
            <View style={styles.inlineIcon}>
              <Ionicons name="restaurant-outline" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{t('view_all_restaurants')}</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>{t('no_nearby_restaurants_desc')}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
          </View>
        </GlassCard>
      );
    }
    return (
      <View style={styles.nearbyList}>
        {nearbyRestaurants.map((item) => (
          <RestaurantCard
            key={item.code}
            code={item.code}
            name={item.name}
            city={item.city}
            compatibility={item.compatibility}
            isFavorite={isFavorite(item.code)}
            onToggleFavorite={() => onToggleFavorite(item.code, item.name)}
            distanceLabel={item.distanceLabel}
            compact
          />
        ))}
      </View>
    );
  };

  const visibleRecents = activityItems.slice(0, 5);

  return (
    <Screen edges={false}>
      <GlassScreenScroll showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        {/* Header — solo saluto + nome, senza foto/avatar */}
        <Animated.View entering={enter(0)} style={styles.greeting}>
          <Pressable
            onPress={openProfile}
            style={({ pressed }) => [styles.profileHit, pressed && styles.profileHitPressed]}
            accessibilityRole="button"
            accessibilityLabel={isIt ? 'Cambia profilo attivo' : 'Switch active profile'}
          >
            <View style={styles.greetingCopy}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
                {greetingWord(isIt)}
              </AppText>
              <AppText variant="h1" style={styles.greetingTitle} numberOfLines={1}>
                {activeLabel}
              </AppText>
              <View style={styles.statusChip}>
                <View style={[styles.statusDot, { backgroundColor: hasAllergie ? colors.green : colors.yellow }]} />
                <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1} style={styles.statusText}>
                  {profileStatus}
                </AppText>
                <Ionicons name="chevron-down" size={14} color={colors.onSurfaceMuted} />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={enter(50)}>
          <HomeRestaurantSearch
            restaurants={restaurants}
            loading={loadingRestaurants}
            error={restaurantsError}
            onRetry={loadRestaurants}
            allergie={allergie}
            ingredientiEsclusi={ingredientiEsclusi}
            userLocation={userLocation}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            isIt={isIt}
          />
        </Animated.View>

        {!hasAllergie ? (
          <Animated.View entering={enter(80)}>
            <AllergyProfileBanner hasAllergie={false} isIt={isIt} />
          </Animated.View>
        ) : null}

        {showAtVenuePrompt && atRecentVenue ? (
          <Animated.View entering={enter(100)}>
            <GlassCard
              padded={false}
              tint={atVenueTint}
              accentColor={verdictColor[atVenueVerdict].border}
              style={styles.contextWrap}
            >
              <Pressable onPress={() => openMenu(atRecentVenue.code)} style={styles.contextRow}>
                <View style={[styles.contextIcon, { backgroundColor: verdictColor[atVenueVerdict].soft }]}>
                  <Ionicons name="navigate" size={20} color={verdictColor[atVenueVerdict].on} />
                </View>
                <View style={styles.contextBody}>
                  <AppText variant="eyebrow" color={verdictColor[atVenueVerdict].on}>
                    {isIt ? 'Sei qui adesso' : 'You are here now'}
                  </AppText>
                  <AppText variant="title" numberOfLines={1}>{atRecentVenue.name}</AppText>
                  <View style={styles.contextMeta}>
                    <AppText variant="caption" color={colors.onSurfaceMuted}>~{atRecentVenue.distanceM} m</AppText>
                    {atVenueCompat ? (
                      <>
                        <TrafficDot verdict={atVenueVerdict} size={9} />
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {atVenueCompat.percentuale}% {isIt ? 'compatibile' : 'compatible'}
                        </AppText>
                      </>
                    ) : null}
                  </View>
                </View>
                <View style={styles.contextAction}>
                  <AppText variant="caption" color={colors.brand} style={styles.contextActionLabel}>
                    {isIt ? 'Apri' : 'Open'}
                  </AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.brand} />
                </View>
              </Pressable>
              <Pressable onPress={() => setDismissedVenueCode(atRecentVenue.code)} style={styles.dismiss}>
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Non sono qui' : 'I am not here'}
                </AppText>
              </Pressable>
            </GlassCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={enter(130)} style={styles.actionsSection}>
          <PuffyButton
            label={isIt ? 'Scansiona menù o prodotto' : 'Scan menu or product'}
            icon="scan"
            onPress={() => router.push('/scanner')}
          />
          <View style={styles.quickRow}>
            <HomeQuickTile
              icon="map"
              label={isIt ? 'Mappa' : 'Map'}
              onPress={() => router.push('/(tabs)/locali')}
            />
            <HomeQuickTile
              icon="heart"
              label={isIt ? 'Preferiti' : 'Favorites'}
              badge={favorites.length}
              onPress={() => router.push('/preferiti')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={enter(170)}>
          <Section
            title={isIt ? 'Vicino a te' : 'Near you'}
            subtitle={
              nearbyRestaurants.length > 0
                ? (isIt ? 'Ordinati per distanza' : 'Sorted by distance')
                : (isIt ? 'Locali compatibili intorno a te' : 'Compatible venues around you')
            }
            action={(
              <Pressable onPress={() => router.push('/(tabs)/locali')} hitSlop={8} style={styles.seeAll}>
                <AppText variant="bodyBold" color={colors.brand}>
                  {isIt ? 'Vedi tutti' : 'See all'}
                </AppText>
              </Pressable>
            )}
          >
            {renderNearby()}
          </Section>
        </Animated.View>

        {visibleRecents.length > 0 ? (
          <Animated.View entering={enter(210)}>
            <Section
              title={isIt ? 'Recenti' : 'Recent'}
              subtitle={isIt ? 'Ultime consultazioni' : 'Latest activity'}
            >
              <GlassCard padded={false} style={styles.recentsCard}>
                {visibleRecents.map((item, index) => {
                  const key = item.kind === 'restaurant' ? item.code : item.product.barcode;
                  const verdict: Verdict = item.kind === 'product'
                    ? (() => {
                      const raw = statoToVerdict(item.product.status);
                      return raw === 'neutral' ? 'yellow' : raw;
                    })()
                    : item.verdict;
                  const title = item.kind === 'restaurant' ? item.name : item.product.name;
                  const when = formatRecentWhen(
                    item.kind === 'restaurant' ? item.visitedAt : item.product.date,
                    isIt,
                  );
                  const kindLabel = item.kind === 'restaurant'
                    ? (isIt ? 'Locale' : 'Venue')
                    : (isIt ? 'Prodotto' : 'Product');
                  const compat = item.kind === 'restaurant'
                    ? restaurantCompat.get(item.code)
                    : null;
                  const subtitle = [
                    kindLabel,
                    item.kind === 'product' ? item.product.brand : null,
                    when,
                    compat ? `${compat.percentuale}%` : null,
                  ].filter(Boolean).join(' · ');
                  const v = verdictColor[verdict];
                  const isLast = index === visibleRecents.length - 1;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => onRecentPress(item)}
                      style={({ pressed }) => [
                        styles.recentRow,
                        !isLast && styles.recentRowBorder,
                        pressed && styles.recentRowPressed,
                      ]}
                    >
                      <View style={[styles.recentIcon, { backgroundColor: v.soft }]}>
                        <Ionicons
                          name={item.kind === 'restaurant' ? 'restaurant' : 'barcode'}
                          size={18}
                          color={v.on}
                        />
                      </View>
                      <View style={styles.recentBody}>
                        <AppText style={styles.recentTitle} numberOfLines={1}>
                          {title}
                        </AppText>
                        <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
                          {subtitle}
                        </AppText>
                      </View>
                      <VerdictPill verdict={verdict} size="sm" uppercase={false} />
                    </Pressable>
                  );
                })}
              </GlassCard>
            </Section>
          </Animated.View>
        ) : null}
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg + 4,
    alignItems: 'stretch',
    paddingBottom: spacing.xl,
  },
  greeting: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  profileHit: {
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  profileHitPressed: {
    opacity: 0.82,
  },
  greetingCopy: {
    width: '100%',
    gap: 6,
  },
  greetingTitle: {
    letterSpacing: -0.9,
    fontSize: 34,
    lineHeight: 38,
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    flexShrink: 1,
  },
  actionsSection: {
    gap: spacing.sm + 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickOuter: {
    flex: 1,
    borderRadius: radius.pill,
  },
  quickBtn: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  quickInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand100,
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.surfaceSecondary,
  },
  quickBadgeText: {
    fontFamily: font.displayBold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.onBrand,
    textAlign: 'center',
  },
  quickLabel: {
    fontFamily: font.displaySemibold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.brandInk,
    letterSpacing: -0.2,
  },
  contextWrap: {
    gap: spacing.xs,
  },
  contextRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  contextIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  contextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  contextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  contextActionLabel: {
    fontFamily: font.bold,
  },
  dismiss: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  seeAll: {
    paddingBottom: 2,
  },
  nearbyList: {
    gap: spacing.sm,
  },
  inlineCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inlineCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  loader: { marginVertical: spacing.md },
  recentsCard: {
    overflow: 'hidden',
  },
  recentRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  recentRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentRowPressed: {
    backgroundColor: colors.brand50,
  },
  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  recentTitle: {
    fontFamily: font.displaySemibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.onSurface,
    letterSpacing: -0.15,
  },
});
