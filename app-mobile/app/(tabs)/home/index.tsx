import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/api/client';
import { calcolaCompatibilita } from '../../../src/engine/compatibility';
import RestaurantCard from '../../../src/components/RestaurantCard';
import { HomeTopHeader } from '../../../src/components/HomeTopHeader';
import { HomeProfileShieldCard } from '../../../src/components/HomeProfileShieldCard';
import HomeQuickActionHub from '../../../src/components/HomeQuickActionHub';
import HomeDietaryFilterBar, { type DietaryFilterId } from '../../../src/components/HomeDietaryFilterBar';
import HomeRecentScansWidget from '../../../src/components/HomeRecentScansWidget';
import HomeSafetyTipCard from '../../../src/components/HomeSafetyTipCard';
import { useSession } from '../../../src/store/session';
import { useProfileSheet } from '../../../src/store/profileSheet';
import { colors, radius, spacing } from '../../../src/theme';
import { syncFavoritesFromServer, toggleRestaurantFavorite } from '../../../src/services/favorites';
import { syncUserAllergensFromServer } from '../../../src/services/authSession';
import { avviaGeofencing, fermaGeofencing } from '../../../src/services/geofencing';
import { useTranslation } from '../../../src/constants/translations';
import type { RestaurantSummary } from '../../../src/types';
import { distanceKm, formatDistanceLabel } from '../../../src/utils/venueDistance';
import { useActiveProfileAllergies } from '../../../src/hooks/useActiveProfileAllergies';
import { useAdaptiveMeshInk } from '../../../src/hooks/useMeshInk';
import { useSectionTitle } from '../../../src/hooks/useSectionTitle';
import {
  AppText,
  ErrorStateCard,
  GlassCard,
  GlassScreenScroll,
  Screen,
} from '../../../src/components/ui';

type HomeVenue = {
  code: string;
  name: string;
  city: string | null;
  imageUrl?: string | null;
  compatibility: ReturnType<typeof calcolaCompatibilita> | null;
  menuAvailable: boolean;
  distance: number;
  distanceLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number | null;
  ratingCount: number;
};

export default function Home() {
  const {
    token,
    ingredientiEsclusi,
    setSubProfiles,
    subProfiles,
    activeProfileId,
    isFavorite,
  } = useSession();

  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<DietaryFilterId>('all');

  const activeProfileIndex = useMemo(() => {
    if (activeProfileId === null) return 1; // Sofia / default avatar
    const idx = subProfiles.findIndex((p) => p.id === activeProfileId);
    return idx >= 0 ? idx + 1 : 1;
  }, [activeProfileId, subProfiles]);

  const {
    allergie,
    allergyIntensities,
    allergyCriteria,
    hasAllergie,
    activeLabel,
    activeAvatar,
    isIt,
  } = useActiveProfileAllergies({ selfName: userDisplayName });

  const { t } = useTranslation();
  useSectionTitle('');

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
    if (status === 'granted') await refreshLocation();
    else setLocationStatus('denied');
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
      refreshLocation().then(async (loc) => {
        if (!loc) return;
        try {
          locationSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 40, timeInterval: 20000 },
            (position) => setUserLocation(position),
          );
        } catch { /* */ }
      });
      if (token) {
        syncFavoritesFromServer().catch(() => { });
        syncUserAllergensFromServer().catch(() => { });
        api.getSubProfiles().then(setSubProfiles).catch(() => { });
        api.getProfile()
          .then((p) => setUserDisplayName(p.display_name?.trim() || null))
          .catch(() => { });
      } else {
        setUserDisplayName(null);
      }
      return () => { locationSub?.remove(); };
    }, [token, setSubProfiles, refreshLocation]),
  );

  useEffect(() => {
    if (!token) {
      setUserDisplayName(null);
      return;
    }
    syncUserAllergensFromServer().catch(() => { });
    api.getSubProfiles().then(setSubProfiles).catch(() => { });
    syncFavoritesFromServer().catch(() => { });
    api.getProfile()
      .then((p) => setUserDisplayName(p.display_name?.trim() || null))
      .catch(() => { });
  }, [token, setSubProfiles]);

  const enrich = useCallback((r: RestaurantSummary, dist?: number): HomeVenue => {
    const published = r.menu_available ?? (r.piatti && r.piatti.length > 0);
    const canScore = published && r.piatti && r.piatti.length > 0;
    const compatibility = canScore
      ? calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi, allergyCriteria)
      : null;
    const distanceLabel = formatDistanceLabel(dist);
    return {
      code: r.public_code,
      name: r.nome_ristorante,
      city: r.citta,
      imageUrl: r.image_url,
      compatibility,
      menuAvailable: published,
      distance: dist ?? Number.POSITIVE_INFINITY,
      distanceLabel,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      ratingAvg: r.google_rating ?? null,
      ratingCount: r.google_reviews_count ?? 0,
    };
  }, [allergie, ingredientiEsclusi, allergyCriteria]);

  const rankedVenues = useMemo(() => {
    if (restaurants.length === 0) return [] as HomeVenue[];

    // Deduplica per codice locale univoco
    const seen = new Set<string>();
    const uniquePool: RestaurantSummary[] = [];
    for (const r of restaurants) {
      if (!seen.has(r.public_code)) {
        seen.add(r.public_code);
        uniquePool.push(r);
      }
    }

    const pool = uniquePool.map((r) => {
      let dist: number | undefined;
      if (userLocation && r.latitude != null && r.longitude != null) {
        dist = distanceKm(userLocation.coords.latitude, userLocation.coords.longitude, r.latitude, r.longitude);
      }
      return enrich(r, dist);
    });

    let filtered = pool;
    if (selectedFilter === 'safe100') {
      const safeOnly = pool.filter((v) => (v.compatibility?.percentuale ?? 0) === 100);
      if (safeOnly.length > 0) filtered = safeOnly;
    } else if (selectedFilter === 'gluten_free') {
      const gfOnly = pool.filter((v) =>
        v.name.toLowerCase().includes('gluten') ||
        v.name.toLowerCase().includes('senza glutine') ||
        (v.compatibility?.percentuale ?? 0) >= 70,
      );
      if (gfOnly.length > 0) filtered = gfOnly;
    } else if (selectedFilter === 'lactose_free') {
      const lfOnly = pool.filter((v) =>
        (v.compatibility?.percentuale ?? 0) >= 70,
      );
      if (lfOnly.length > 0) filtered = lfOnly;
    } else if (selectedFilter === 'pizza') {
      const pizzaOnly = pool.filter((v) =>
        v.name.toLowerCase().includes('pizz') || v.name.toLowerCase().includes('pizzeria'),
      );
      if (pizzaOnly.length > 0) filtered = pizzaOnly;
    } else if (selectedFilter === 'sushi') {
      const sushiOnly = pool.filter((v) =>
        v.name.toLowerCase().includes('sushi') ||
        v.name.toLowerCase().includes('giapponese') ||
        v.name.toLowerCase().includes('ramen'),
      );
      if (sushiOnly.length > 0) filtered = sushiOnly;
    }

    return filtered
      .slice()
      .sort((a, b) => {
        if (hasAllergie) {
          const aMenu = a.menuAvailable && (a.compatibility?.totaleDishes ?? 0) > 0 ? 1 : 0;
          const bMenu = b.menuAvailable && (b.compatibility?.totaleDishes ?? 0) > 0 ? 1 : 0;
          if (bMenu !== aMenu) return bMenu - aMenu;
          const aPct = a.compatibility?.percentuale ?? -1;
          const bPct = b.compatibility?.percentuale ?? -1;
          if (bPct !== aPct) return bPct - aPct;
        } else {
          const aPub = a.menuAvailable ? 1 : 0;
          const bPub = b.menuAvailable ? 1 : 0;
          if (bPub !== aPub) return bPub - aPub;
        }
        return a.distance - b.distance;
      })
      .slice(0, 12);
  }, [restaurants, userLocation, enrich, hasAllergie, selectedFilter]);

  const onToggleFavorite = (code: string, name: string) => {
    void toggleRestaurantFavorite(code, name);
  };

  const renderCard = (item: HomeVenue) => (
    <View key={item.code} style={styles.horizontalCardItem}>
      <RestaurantCard
        code={item.code}
        name={item.name}
        city={item.city}
        imageUrl={item.imageUrl}
        compatibility={item.compatibility}
        menuAvailable={item.menuAvailable}
        compact
        horizontalScroll
        square
        outline="white"
        isFavorite={isFavorite(item.code)}
        onToggleFavorite={() => onToggleFavorite(item.code, item.name)}
        distanceLabel={item.distanceLabel}
        latitude={item.latitude}
        longitude={item.longitude}
        ratingAvg={item.ratingAvg}
        ratingCount={item.ratingCount}
      />
    </View>
  );

  const renderPicks = (venuesList = rankedVenues) => {
    if (restaurantsError) {
      return (
        <ErrorStateCard
          message={t('restaurants_load_error')}
          retryLabel={t('retry_btn')}
          onRetry={loadRestaurants}
        />
      );
    }
    if (loadingRestaurants) {
      return <ActivityIndicator color={colors.brand} style={styles.loader} />;
    }
    if (venuesList.length === 0) {
      return (
        <GlassCard onPress={() => router.push('/(tabs)/locali')} tint="none">
          <View style={styles.emptyRow}>
            <View style={styles.emptyIcon}>
              <Ionicons name="restaurant-outline" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{t('view_all_restaurants')}</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>
                {t('no_nearby_restaurants_desc')}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
          </View>
        </GlassCard>
      );
    }
    return (
      <View style={styles.picks}>
        {(locationStatus === 'denied' || locationStatus === 'error') ? (
          <Pressable onPress={requestLocation} style={styles.locationHint} hitSlop={6}>
            <Ionicons name="location-outline" size={14} color={colors.brand} />
            <AppText variant="caption" color={colors.brand}>
              {isIt ? 'Attiva la posizione per vedere i locali più vicini' : 'Enable location to view closest venues'}
            </AppText>
          </Pressable>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {venuesList.map((item) => renderCard(item))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Screen edges={false} style={styles.screen}>
      <HomeTopHeader
        scrollY={scrollY}
        restaurants={restaurants}
        loadingRestaurants={loadingRestaurants}
        restaurantsError={restaurantsError}
        onRetryRestaurants={loadRestaurants}
        allergie={allergie}
        ingredientiEsclusi={ingredientiEsclusi}
        userLocation={userLocation}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        isIt={isIt}
      />
      <GlassScreenScroll
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        externalScrollY={scrollY}
        topPaddingOverride={insets.top + 60}
        headerFloat={false}
      >
        {/* 1. HERO CARD IN ALTO: IDENTITÀ, PROFILO ATTIVO & SCUDO ALLERGENI */}
        <HomeProfileShieldCard
          displayName={userDisplayName}
          activeLabel={activeLabel}
          activeAvatar={activeAvatar}
          activeProfileIndex={activeProfileIndex}
          allergie={allergie}
          allergyIntensities={allergyIntensities}
          hasAllergie={hasAllergie}
          isIt={isIt}
        />

        {/* 2. QUICK ACTION HUB (2 GRANDI HERO ACTIONS + 2x2 TOOLS + LIVE RECALLS) */}
        <HomeQuickActionHub isIt={isIt} />

        {/* 3. CAROSELLO LOCALI PIÙ COMPATIBILI VICINO A TE */}
        <View style={styles.carouselBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="compass-outline" size={20} color="#23212C" />
              <AppText variant="h2" style={styles.sectionTitle}>
                {isIt ? 'Locali più compatibili vicino a te' : 'Most compatible near you'}
              </AppText>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/locali')} hitSlop={8}>
              <AppText style={styles.seeAllBtn}>
                {isIt ? 'Vedi tutti' : 'See all'}
              </AppText>
            </Pressable>
          </View>

          {/* Filtri rapidi per il carosello */}
          <HomeDietaryFilterBar
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            isIt={isIt}
          />

          {renderPicks(rankedVenues)}
        </View>

        {/* 4. WIDGET SPESA SICURA & RECENTI */}
        <HomeRecentScansWidget isIt={isIt} />

        {/* 5. TIP DI SICUREZZA INTERATTIVO ROTANTE */}
        <HomeSafetyTipCard isIt={isIt} />
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    gap: 4,
  },
  carouselBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    color: '#1F2937',
  },
  seeAllBtn: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6366F1',
  },
  picks: {
    gap: spacing.sm,
  },
  horizontalScrollView: {
    marginHorizontal: -spacing.lg,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  horizontalCardItem: {
    width: 178,
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: { marginVertical: spacing.md },
});
