import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapWrapper, { MarkerComponent as Marker, CalloutComponent as Callout } from '../../../src/components/MapWrapper';
import * as Location from 'expo-location';
import { api } from '../../../src/api/client';
import { toggleRestaurantFavorite } from '../../../src/services/favorites';
import { calcolaCompatibilita, type CompatibilitaResult } from '../../../src/engine/compatibility';
import RestaurantCard from '../../../src/components/RestaurantCard';
import { useSession } from '../../../src/store/session';
import { useTranslation } from '../../../src/constants/translations';
import { useHeaderFloatInset } from '../../../src/hooks/useHeaderFloatInset';
import { useSectionTitle } from '../../../src/hooks/useSectionTitle';
import {
  AppText,
  AllergyProfileBanner,
  DEFAULT_LOCALI_FILTERS,
  EmptyStateCard,
  ErrorStateCard,
  GlassIconButton,
  GlassScreenScroll,
  LocaliFilterSheet,
  Screen,
  ScrollEntry,
  ScrollFocusEndPad,
  SemaforoGeminiBorder,
  countActiveFilters,
  type LocaliFilters,
} from '../../../src/components/ui';
import { useFloatingHeader } from '../../../src/store/floatingHeader';
import { SEARCH_BAR_HEIGHT } from '../../../src/layoutConstants';
import { colors, font, radius, softShadow, spacing, typography } from '../../../src/theme';
import type { RestaurantSummary } from '../../../src/types';
import { CUISINE_OPTIONS, cuisineLabel, resolveCuisine, type CuisineCode } from '../../../src/utils/cuisine';
import { distanceKm, formatDistanceLabel } from '../../../src/utils/venueDistance';
import * as Haptics from 'expo-haptics';

interface LocaleData {
  code: string;
  name: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  compatibility: CompatibilitaResult | null;
  menuAvailable?: boolean;
  isVerified?: boolean;
  cuisine: CuisineCode;
  boostActive?: boolean;
  ratingAvg?: number | null;
  ratingCount?: number;
  distanceKm?: number | null;
  distanceLabel?: string | null;
}

export default function Locali() {
  const {
    isFavorite, allergie: primaryAllergies, allergyCriteria: primaryCriteria, token,
    ingredientiEsclusi, language, subProfiles, setSubProfiles, activeProfileId,
  } = useSession();

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const allergyCriteria = useMemo(() => {
    if (activeProfile) {
      const map: Record<string, 'assoluto' | 'crudo' | 'cotto'> = {};
      for (const a of activeProfile.allergens) {
        map[a.code] = a.criterio || 'assoluto';
      }
      return map;
    }
    return primaryCriteria || {};
  }, [activeProfile, primaryCriteria]);

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const hasAllergie = allergie.length > 0;
  const headerTop = useHeaderFloatInset(spacing.sm);
  useSectionTitle(isIt ? 'Ristoranti' : 'Restaurants');
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const showFloatingChrome = useFloatingHeader((s) => s.show);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filters, setFilters] = useState<LocaliFilters>(DEFAULT_LOCALI_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'list' ? 'map' : 'list'));
    showFloatingChrome();
  };

  const loadRestaurants = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    api.listRestaurantsSummary()
      .then(setRestaurants)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRestaurants();
    if (token) api.getSubProfiles().then(setSubProfiles).catch(() => {});
  }, [token, loadRestaurants, setSubProfiles]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc);
      } catch (e) {
        console.log('Errore posizione:', e);
      }
    })();
  }, []);

  const locali = useMemo<LocaleData[]>(() => {
    const userLat = userLocation?.coords.latitude;
    const userLon = userLocation?.coords.longitude;
    return restaurants.map((r) => {
      const published = r.menu_available ?? r.piatti.length > 0;
      const compat = hasAllergie && published && r.piatti.length > 0
        ? calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi, allergyCriteria)
        : null;
      let distKm: number | null = null;
      let distanceLabel: string | null = null;
      if (
        userLat != null
        && userLon != null
        && r.latitude != null
        && r.longitude != null
      ) {
        distKm = distanceKm(userLat, userLon, r.latitude, r.longitude);
        distanceLabel = formatDistanceLabel(distKm);
      }
      return {
        code: r.public_code,
        name: r.nome_ristorante,
        city: r.citta,
        latitude: r.latitude,
        longitude: r.longitude,
        imageUrl: r.image_url ?? null,
        compatibility: compat,
        menuAvailable: published,
        isVerified: !!r.is_verified,
        cuisine: resolveCuisine(r.cuisine, r.nome_ristorante),
        boostActive: !!r.boost_active,
        ratingAvg: r.google_rating ?? null,
        ratingCount: r.google_reviews_count ?? 0,
        distanceKm: distKm,
        distanceLabel,
      };
    });
  }, [restaurants, allergie, ingredientiEsclusi, allergyCriteria, hasAllergie, userLocation]);

  const filteredLocali = useMemo(() => {
    return locali.filter((l) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = l.name.toLowerCase().includes(query);
        const matchesCity = l.city?.toLowerCase().includes(query) ?? false;
        const matchesCode = l.code.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesCode) return false;
      }
      if (filters.onlyMenu && !l.menuAvailable) return false;
      if (filters.onlyFavorites && !isFavorite(l.code)) return false;
      if (filters.verified === 'yes' && !l.isVerified) return false;
      if (filters.verified === 'no' && l.isVerified) return false;
      if (filters.cuisines.length > 0 && !filters.cuisines.includes(l.cuisine)) return false;
      if (filters.maxDistanceKm > 0) {
        if (l.distanceKm == null || l.distanceKm > filters.maxDistanceKm) return false;
      }
      if (hasAllergie && filters.minCompat > 0) {
        if (!l.compatibility || l.compatibility.percentuale < filters.minCompat) return false;
      }
      return true;
    });
  }, [locali, searchQuery, filters, hasAllergie, isFavorite]);

  const availableCuisines = useMemo(() => {
    const set = new Set<CuisineCode>();
    for (const l of locali) set.add(l.cuisine);
    return [...set];
  }, [locali]);

  const onToggle = (code: string, name: string) => {
    void toggleRestaurantFavorite(code, name);
  };

  const getMarkerColor = (compat: CompatibilitaResult | null) => {
    if (!compat) return colors.textMuted;
    if (compat.percentuale === 100) return colors.green;
    if (compat.rosso > 0) return colors.red;
    return colors.amber;
  };

  const mapRegion = useMemo(() => {
    if (userLocation) {
      const { latitude: lat, longitude: lon } = userLocation.coords;
      if (lat >= 35 && lat <= 47 && lon >= 6 && lon <= 19) {
        return {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
      }
    }
    return {
      latitude: 42.5,
      longitude: 12.5,
      latitudeDelta: 6.5,
      longitudeDelta: 6.5,
    };
  }, [userLocation]);

  const sortedLocali = useMemo(() => {
    return [...filteredLocali].sort((a, b) => {
      const boost = Number(!!b.boostActive) - Number(!!a.boostActive);
      if (boost !== 0) return boost;

      switch (filters.sortBy) {
        case 'distance': {
          const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
          return da - db;
        }
        case 'name':
          return a.name.localeCompare(b.name, isIt ? 'it' : 'en');
        case 'rating': {
          const ra = a.ratingAvg ?? -1;
          const rb = b.ratingAvg ?? -1;
          return rb - ra;
        }
        case 'compat':
        default:
          return (b.compatibility?.percentuale ?? -1) - (a.compatibility?.percentuale ?? -1);
      }
    });
  }, [filteredLocali, filters.sortBy, isIt]);

  const mapLocales = sortedLocali.filter((l) => l.latitude && l.longitude);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters, hasAllergie),
    [filters, hasAllergie],
  );

  const filterSummary = useMemo(() => {
    if (activeFilterCount === 0) {
      return isIt ? 'Cucina, verifica, sicurezza' : 'Cuisine, trust, safety';
    }
    const bits: string[] = [];
    if (filters.cuisines.length === 1) {
      bits.push(cuisineLabel(filters.cuisines[0], isIt));
    } else if (filters.cuisines.length > 1) {
      bits.push(isIt ? `${filters.cuisines.length} cucine` : `${filters.cuisines.length} cuisines`);
    }
    if (filters.verified === 'yes') bits.push(isIt ? 'Verificati' : 'Verified');
    if (filters.verified === 'no') bits.push(isIt ? 'Non verificati' : 'Unverified');
    if (filters.onlyMenu) bits.push(isIt ? 'Menù allergeni' : 'Allergen menus');
    if (filters.onlyFavorites) bits.push(isIt ? 'Preferiti' : 'Favorites');
    if (hasAllergie && filters.minCompat > 0) bits.push(`${filters.minCompat}%+`);
    if (filters.maxDistanceKm > 0) bits.push(`≤${filters.maxDistanceKm} km`);
    if (filters.sortBy === 'distance') bits.push(isIt ? 'Per distanza' : 'By distance');
    if (filters.sortBy === 'name') bits.push(isIt ? 'Per nome' : 'By name');
    if (filters.sortBy === 'rating') bits.push(isIt ? 'Per voto' : 'By rating');
    return bits.join(' · ');
  }, [activeFilterCount, filters, hasAllergie, isIt]);

  const openFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFiltersOpen(true);
  }, []);

  const toggleCuisineChip = useCallback((code: CuisineCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFilters((prev) => {
      const exists = prev.cuisines.includes(code);
      return {
        ...prev,
        cuisines: exists
          ? prev.cuisines.filter((c) => c !== code)
          : [...prev.cuisines, code],
      };
    });
  }, []);

  const toggleVerifiedChip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFilters((prev) => ({
      ...prev,
      verified: prev.verified === 'yes' ? 'all' : 'yes',
    }));
  }, []);

  const controls = (onMap: boolean) => (
    <View style={[styles.controls, onMap && styles.controlsOnMap]}>
      {/* Barra di ricerca con Icona Mappa PNG 3D ALL'INTERNO A DESTRA */}
      <View style={styles.searchRow}>
        <SemaforoGeminiBorder
          kind="semaforo"
          active={searchFocused || searchQuery.length > 0}
          borderRadius={radius.md}
          borderWidth={2.5}
          pauseMs={4000}
          passMs={1200}
          fill={onMap ? 'rgba(255,255,255,0.96)' : colors.surfaceSecondary}
          style={[styles.searchBorder, onMap && styles.searchBorderOnMap]}
          contentStyle={styles.searchBorderContent}
        >
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.onSurfaceMuted} />
            <TextInput
              placeholder={isIt ? 'Nome o città' : 'Name or city'}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={styles.searchField}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10} style={{ marginRight: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.onSurfaceMuted} />
              </Pressable>
            ) : null}

            {/* Icona Mappa PNG 3D all'interno a destra della barra */}
            <Pressable
              onPress={toggleViewMode}
              style={({ pressed }) => [styles.mapInsideBar, pressed && { opacity: 0.8 }]}
              accessibilityLabel={
                onMap
                  ? (isIt ? 'Mostra lista' : 'Show list')
                  : (isIt ? 'Mostra mappa' : 'Show map')
              }
            >
              <Image
                source={require('../../../assets/icon_mappa.png')}
                style={styles.mapIconImg}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </SemaforoGeminiBorder>
      </View>

      {/* SOTTO LA BARRA DI RICERCA: Filtri a Pillola Orizzontali (Airbnb / Uber Eats Style) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipScroll}
        style={styles.filterChipContainer}
      >
        {/* Main Filter Modal Button */}
        <Pressable
          onPress={openFilters}
          style={({ pressed }) => [
            styles.filterChip,
            activeFilterCount > 0 && styles.filterChipActive,
            pressed && styles.filterChipPressed,
          ]}
          accessibilityLabel={isIt ? 'Apri tutti i filtri' : 'Open all filters'}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={activeFilterCount > 0 ? '#FFFFFF' : colors.brandInk}
          />
          <Text
            style={[
              styles.filterChipText,
              activeFilterCount > 0 && styles.filterChipTextActive,
            ]}
          >
            {isIt ? 'Filtri' : 'Filters'}
          </Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>

        {/* Toggle Verificati Chip */}
        <Pressable
          onPress={toggleVerifiedChip}
          style={({ pressed }) => [
            styles.filterChip,
            filters.verified === 'yes' && styles.filterChipActive,
            pressed && styles.filterChipPressed,
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              filters.verified === 'yes' && styles.filterChipTextActive,
            ]}
          >
            🛡️ {isIt ? 'Verificati' : 'Verified'}
          </Text>
        </Pressable>

        {/* Quick Cuisine Chips */}
        {CUISINE_OPTIONS.slice(0, 6).map((opt) => {
          const isSelected = filters.cuisines.includes(opt.code);
          return (
            <Pressable
              key={opt.code}
              onPress={() => toggleCuisineChip(opt.code)}
              style={({ pressed }) => [
                styles.filterChip,
                isSelected && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {opt.emoji} {isIt ? opt.it : opt.en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!hasAllergie && !onMap ? <AllergyProfileBanner hasAllergie={false} isIt={isIt} /> : null}

      {activeFilterCount > 0 ? (
        <Pressable
          onPress={openFilters}
          style={({ pressed }) => [
            styles.filterSummaryChip,
            onMap && styles.filterSummaryChipOnMap,
            pressed && styles.filterSummaryChipPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isIt ? 'Modifica filtri' : 'Edit filters'}
        >
          <AppText style={styles.filterSummary} numberOfLines={1}>
            {filterSummary}
          </AppText>
          <AppText style={styles.filterCount}>{filteredLocali.length}</AppText>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen edges={false}>
      <View style={styles.mainContainer}>
        {viewMode === 'map' ? (
          <View style={styles.mapStage}>
            <MapWrapper
              style={StyleSheet.absoluteFill}
              showsUserLocation
              showsMyLocationButton={false}
              initialRegion={mapRegion}
              region={userLocation ? mapRegion : undefined}
            >
              {mapLocales.map((locale) => {
                const pct = locale.compatibility?.percentuale ?? null;
                const markerBg = pct === null ? '#F1F5F9' : pct >= 70 ? '#ECFDF5' : pct >= 40 ? '#FFFBEB' : '#FEF2F2';
                const markerBorder = pct === null ? '#CBD5E1' : pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
                const markerDotColor = pct === null ? '#94A3B8' : pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
                const markerTextColor = pct === null ? '#64748B' : pct >= 70 ? '#065F46' : pct >= 40 ? '#92400E' : '#991B1B';

                return (
                  <Marker
                    key={locale.code}
                    coordinate={{ latitude: locale.latitude!, longitude: locale.longitude! }}
                    pinColor={getMarkerColor(locale.compatibility)}
                    onCalloutPress={() => router.push(`/menu/${locale.code}`)}
                  >
                    <View style={[styles.customMarkerPill, { backgroundColor: markerBg, borderColor: markerBorder }]}>
                      <View style={[styles.markerDot, { backgroundColor: markerDotColor }]} />
                      <Text style={[styles.markerPercentText, { color: markerTextColor }]}>
                        {pct !== null ? `${pct}%` : '—'}
                      </Text>
                    </View>
                    <Callout>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{locale.name}</Text>
                        {locale.city ? <Text style={styles.calloutSub}>{locale.city}</Text> : null}
                        <Text style={styles.calloutSub}>
                          {locale.compatibility
                            ? `${locale.compatibility.percentuale}% ${isIt ? 'idoneo per te' : 'suitable'}`
                            : (isIt ? 'Dati allergeni non pubblicati' : 'Allergen data not published')}
                        </Text>
                        <Text style={styles.calloutLink}>
                          {locale.compatibility
                            ? (isIt ? 'Apri menù ›' : 'Open menu ›')
                            : (isIt ? 'Apri scheda ›' : 'Open venue ›')}
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapWrapper>

            <View pointerEvents="box-none" style={[styles.mapOverlay, { paddingTop: headerTop }]}>
              {controls(true)}
            </View>

            {mapLocales.length === 0 && !loading ? (
              <View style={styles.mapEmptyOverlay} pointerEvents="none">
                <View style={styles.mapEmptyCard}>
                  <AppText variant="bodyBold" style={{ textAlign: 'center' }}>
                    {isIt ? 'Nessun locale sulla mappa' : 'No venues on the map'}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted} style={{ textAlign: 'center' }}>
                    {isIt ? 'Prova a cambiare i filtri' : 'Try changing the filters'}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <GlassScreenScroll
            headerFloat
            trackFloatingChrome
            contentContainerStyle={styles.container}
          >
            {controls(false)}

            {loadError ? (
              <ErrorStateCard
                message={t('restaurants_load_error')}
                retryLabel={t('retry_btn')}
                onRetry={loadRestaurants}
              />
            ) : loading ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.xl }} />
            ) : filteredLocali.length === 0 ? (
              <EmptyStateCard
                icon="search-outline"
                title={isIt ? 'Nessun locale trovato' : 'No venues found'}
                description={isIt ? 'Nessun ristorante corrisponde ai filtri impostati.' : 'No restaurants match the selected filters.'}
              />
            ) : (
              <View style={styles.cardList}>
                {sortedLocali.map((item, index) => (
                  <ScrollEntry
                    key={item.code}
                    animation="send-and-receive"
                    edge={
                      sortedLocali.length === 1
                        ? 'both'
                        : index === 0
                          ? 'first'
                          : index === sortedLocali.length - 1
                            ? 'last'
                            : undefined
                    }
                  >
                    <RestaurantCard
                      code={item.code}
                      name={item.name}
                      city={item.city}
                      imageUrl={item.imageUrl}
                      compatibility={item.compatibility}
                      menuAvailable={item.menuAvailable}
                      isFavorite={isFavorite(item.code)}
                      onToggleFavorite={() => onToggle(item.code, item.name)}
                      latitude={item.latitude}
                      longitude={item.longitude}
                      boostActive={item.boostActive}
                      ratingAvg={item.ratingAvg}
                      ratingCount={item.ratingCount}
                      distanceLabel={item.distanceLabel}
                      outline={index % 2 === 1 ? 'glass' : 'white'}
                    />
                  </ScrollEntry>
                ))}
                <ScrollFocusEndPad />
              </View>
            )}
          </GlassScreenScroll>
        )}
      </View>

      <LocaliFilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
        isIt={isIt}
        hasAllergie={hasAllergie}
        hasLocation={!!userLocation}
        resultCount={filteredLocali.length}
        availableCuisines={availableCuisines}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapStage: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  controls: {
    gap: 10,
    alignSelf: 'stretch',
    width: '100%',
  },
  controlsOnMap: {
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    height: SEARCH_BAR_HEIGHT,
    overflow: 'visible',
  },
  filterChipContainer: {
    marginHorizontal: -spacing.lg,
  },
  filterChipScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...softShadow(3),
  },
  filterChipActive: {
    backgroundColor: colors.brandInk,
    borderColor: colors.brandInk,
  },
  filterChipPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  filterChipText: {
    fontFamily: font.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.brandInk,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBadgeCount: {
    backgroundColor: colors.brand,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: 6,
    borderRadius: radius.md - 2,
    backgroundColor: 'transparent',
  },
  mapInsideBar: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIconImg: {
    width: 36,
    height: 36,
  },
  searchBorder: {
    flex: 1,
    height: SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
  },
  searchBorderContent: {
    flex: 1,
  },
  searchBorderOnMap: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchField: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.onSurface,
  },
  filterSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  filterSummaryChipOnMap: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: colors.brand,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  filterSummaryChipPressed: {
    opacity: 0.88,
  },
  filterSummary: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.onSurfaceMuted,
    minWidth: 0,
  },
  filterCount: {
    fontFamily: font.displaySemibold,
    fontSize: 14,
    color: colors.brandInk,
    letterSpacing: -0.2,
  },
  container: {
    gap: spacing.md,
  },
  cardList: {
    gap: spacing.lg,
    overflow: 'visible',
  },
  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mapEmptyCard: {
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 280,
  },
  callout: {
    padding: spacing.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  calloutTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  calloutSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calloutLink: {
    ...typography.caption,
    color: colors.brandDark,
    fontWeight: '600',
  },
  customMarkerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  markerPercentText: {
    fontSize: 11,
    fontFamily: font.bold,
  },
});
