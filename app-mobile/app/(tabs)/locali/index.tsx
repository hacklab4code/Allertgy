import { router } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
import { AppText, AllergyProfileBanner, EmptyStateCard, ErrorStateCard, GlassCard, GlassCarousel, GlassScreenScroll, Screen } from '../../../src/components/ui';
import { colors, font, radius, spacing, typography, CHIP_MIN_HEIGHT } from '../../../src/theme';
import type { RestaurantSummary } from '../../../src/types';

interface LocaleData {
  code: string;
  name: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  compatibility: CompatibilitaResult | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  boostActive?: boolean;
}

export default function Locali() {
  const {
    isFavorite, allergie: primaryAllergies, token,
    ingredientiEsclusi, language, subProfiles, setSubProfiles, activeProfileId, setActiveProfileId,
  } = useSession();

  // Find active profile
  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find(p => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) {
      return activeProfile.allergens.map(a => a.code);
    }
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const hasAllergie = allergie.length > 0;
  const headerTop = useHeaderFloatInset(spacing.sm);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [compatFilter, setCompatFilter] = useState<'all' | 'safe' | '80'>('all');
  const [cuisineFilter, setCuisineFilter] = useState<'all' | 'italiano' | 'sushi' | 'burger' | 'altro'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    if (compatFilter !== 'all' || cuisineFilter !== 'all') {
      setFiltersExpanded(true);
    }
  }, [compatFilter, cuisineFilter]);

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

    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
    }
  }, [token, loadRestaurants]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc);
      } catch (e) {
        console.log("Errore posizione:", e);
      }
    })();
  }, []);

  // Calcola compatibilità per ogni ristorante
  const locali = useMemo<LocaleData[]>(() => {
    return restaurants.map((r) => {
      const compat = r.piatti.length > 0
        ? calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi)
        : null;
      return {
        code: r.public_code,
        name: r.nome_ristorante,
        city: r.citta,
        latitude: r.latitude,
        longitude: r.longitude,
        imageUrl: null,
        compatibility: compat,
        boostActive: !!r.boost_active,
      };
    });
  }, [restaurants, allergie, ingredientiEsclusi]);

  const filteredLocali = useMemo(() => {
    return locali.filter((l) => {
      // 1. Filtro Ricerca Testo
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = l.name.toLowerCase().includes(query);
        const matchesCity = l.city?.toLowerCase().includes(query) ?? false;
        const matchesCode = l.code.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesCode) return false;
      }

      // 2. Filtro Compatibilità
      if (compatFilter === 'safe') {
        if (!l.compatibility || l.compatibility.percentuale !== 100) return false;
      } else if (compatFilter === '80') {
        if (!l.compatibility || l.compatibility.percentuale < 80) return false;
      }

      // 3. Filtro Cucina
      if (cuisineFilter !== 'all') {
        const rest = restaurants.find(r => r.public_code === l.code);
        const searchPool = `${l.name} ${rest?.nome_ristorante || ''} ${rest?.piatti.map(p => p.nome_piatto).join(' ') || ''}`.toLowerCase();
        if (cuisineFilter === 'italiano') {
          if (!searchPool.includes('pizza') && !searchPool.includes('pasta') && !searchPool.includes('trattoria') && !searchPool.includes('oster') && !searchPool.includes('italiana')) return false;
        } else if (cuisineFilter === 'sushi') {
          if (!searchPool.includes('sushi') && !searchPool.includes('giappo') && !searchPool.includes('cinese') && !searchPool.includes('asian') && !searchPool.includes('ramen')) return false;
        } else if (cuisineFilter === 'burger') {
          if (!searchPool.includes('burger') && !searchPool.includes('pub') && !searchPool.includes('panin') && !searchPool.includes('fast food')) return false;
        } else if (cuisineFilter === 'altro') {
          const isIt = searchPool.includes('pizza') || searchPool.includes('pasta') || searchPool.includes('trattoria') || searchPool.includes('oster') || searchPool.includes('italiana');
          const isSushi = searchPool.includes('sushi') || searchPool.includes('giappo') || searchPool.includes('cinese') || searchPool.includes('asian') || searchPool.includes('ramen');
          const isBurger = searchPool.includes('burger') || searchPool.includes('pub') || searchPool.includes('panin') || searchPool.includes('fast food');
          if (isIt || isSushi || isBurger) return false;
        }
      }

      return true;
    }).sort((a, b) => Number(!!b.boostActive) - Number(!!a.boostActive));
  }, [locali, searchQuery, compatFilter, cuisineFilter, restaurants]);

  const onToggle = (code: string, name: string) => {
    void toggleRestaurantFavorite(code, name);
  };

  const getMarkerColor = (compat: CompatibilitaResult | null) => {
    if (!compat) return colors.textMuted;
    if (compat.percentuale === 100) return colors.green;
    if (compat.rosso > 0) return colors.red;
    return colors.amber;
  };

  const mapRegion = useMemo(() => ({
    latitude: userLocation?.coords.latitude ?? 41.902782,
    longitude: userLocation?.coords.longitude ?? 12.496366,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }), [userLocation]);

  const sortedLocali = useMemo(() => {
    return [...filteredLocali].sort((a, b) => {
      const boost = Number(!!b.boostActive) - Number(!!a.boostActive);
      if (boost !== 0) return boost;
      return (b.compatibility?.percentuale ?? -1) - (a.compatibility?.percentuale ?? -1);
    });
  }, [filteredLocali]);

  const mapLocales = sortedLocali.filter((l) => l.latitude && l.longitude);
  const activeFilterCount = Number(compatFilter !== 'all') + Number(cuisineFilter !== 'all');
  const profileName = activeProfile?.name ?? (isIt ? 'il tuo profilo' : 'your profile');
  const compatibilityOptions = [
    { value: 'all', label: isIt ? 'Qualsiasi' : 'Any' },
    { value: 'safe', label: isIt ? 'Sicuri 100%' : '100% safe' },
    { value: '80', label: isIt ? 'Almeno 80%' : 'At least 80%' },
  ] as const;
  const cuisineOptions = [
    { value: 'all', label: isIt ? 'Tutte' : 'All' },
    { value: 'italiano', label: isIt ? 'Italiana' : 'Italian' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'burger', label: 'Burger' },
    { value: 'altro', label: isIt ? 'Altro' : 'Other' },
  ] as const;

  return (
    <Screen edges={false}>
      <View style={styles.mainContainer}>
        <View style={[styles.headerArea, { paddingTop: headerTop }]}>
          <View style={styles.intro}>
            <View style={styles.introCopy}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
                {isIt ? 'Esplora' : 'Explore'}
              </AppText>
              <AppText variant="h1">
                {isIt ? 'Ristoranti' : 'Restaurants'}
              </AppText>
              <View style={styles.contextRow}>
                <Ionicons
                  name={hasAllergie ? 'shield-checkmark' : 'restaurant-outline'}
                  size={14}
                  color={hasAllergie ? colors.brand : colors.onSurfaceMuted}
                />
                <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
                  {hasAllergie
                    ? (isIt ? `Compatibilità per ${profileName}` : `Compatibility for ${profileName}`)
                    : (isIt ? 'Esplora i menù dei ristoranti' : 'Explore restaurant menus')}
                </AppText>
              </View>
            </View>
            <View style={styles.countPill}>
              <AppText variant="bodyBold">{sortedLocali.length}</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>{isIt ? 'locali' : 'venues'}</AppText>
            </View>
          </View>

          <View style={styles.searchAndView}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color={colors.onSurfaceMuted} />
              <TextInput
                placeholder={isIt ? 'Nome o città' : 'Name or city'}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchField}
                returnKeyType="search"
                accessibilityLabel={isIt ? 'Cerca un ristorante' : 'Search for a restaurant'}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.onSurfaceMuted} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.viewSwitch}>
              <Pressable
                onPress={() => setViewMode('list')}
                style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                accessibilityLabel={t('list_view')}
              >
                <Ionicons name="list" size={19} color={viewMode === 'list' ? colors.white : colors.onSurfaceMuted} />
              </Pressable>
              <Pressable
                onPress={() => setViewMode('map')}
                style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
                accessibilityLabel={t('map_view')}
              >
                <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? colors.white : colors.onSurfaceMuted} />
              </Pressable>
            </View>
          </View>

          {!hasAllergie && (
            <AllergyProfileBanner hasAllergie={false} isIt={isIt} />
          )}

          <View style={styles.filterSummary}>
            <Pressable
              style={[styles.filterTrigger, activeFilterCount > 0 && styles.filterTriggerActive]}
              onPress={() => setFiltersExpanded((value) => !value)}
            >
              <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? colors.white : colors.onSurface} />
              <AppText
                variant="caption"
                color={activeFilterCount > 0 ? colors.white : colors.onSurface}
                style={styles.filterTriggerText}
              >
                {isIt ? 'Filtri' : 'Filters'}{activeFilterCount ? ` · ${activeFilterCount}` : ''}
              </AppText>
              <Ionicons
                name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={activeFilterCount > 0 ? colors.white : colors.onSurfaceMuted}
              />
            </Pressable>
            <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1} style={styles.orderHint}>
              {hasAllergie
                ? (isIt ? 'Più compatibili per primi' : 'Best matches first')
                : (isIt ? 'In evidenza per primi' : 'Featured first')}
            </AppText>
          </View>

          {filtersExpanded ? (
            <View style={styles.filtersPanel}>
              <View style={styles.filterGroup}>
                <AppText variant="eyebrow">{isIt ? 'Compatibilità' : 'Compatibility'}</AppText>
                <GlassCarousel contentContainerStyle={styles.filterScroll}>
                  {compatibilityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.filterChip, compatFilter === option.value && styles.filterChipActive]}
                      onPress={() => setCompatFilter(option.value)}
                    >
                      <Text style={[styles.filterChipText, compatFilter === option.value && styles.filterChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </GlassCarousel>
              </View>
              <View style={styles.filterGroup}>
                <AppText variant="eyebrow">{isIt ? 'Cucina' : 'Cuisine'}</AppText>
                <GlassCarousel contentContainerStyle={styles.filterScroll}>
                  {cuisineOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.filterChip, cuisineFilter === option.value && styles.filterChipActive]}
                      onPress={() => setCuisineFilter(option.value)}
                    >
                      <Text style={[styles.filterChipText, cuisineFilter === option.value && styles.filterChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </GlassCarousel>
              </View>
            </View>
          ) : null}
        </View>

      {viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          <MapWrapper
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={true}
            initialRegion={mapRegion}
            region={userLocation ? mapRegion : undefined}
          >
            {mapLocales.map((locale) => (
              <Marker
                key={locale.code}
                coordinate={{ latitude: locale.latitude!, longitude: locale.longitude! }}
                pinColor={getMarkerColor(locale.compatibility)}
              >
                <Callout onPress={() => router.push(`/menu/${locale.code}`)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{locale.name}</Text>
                    {locale.city ? <Text style={styles.calloutSub}>{locale.city}</Text> : null}
                    <Text style={styles.calloutSub}>
                      {locale.compatibility
                        ? `${locale.compatibility.percentuale}% ${isIt ? 'compatibile' : 'compatible'}`
                        : (isIt ? 'Menù non disponibile' : 'Menu unavailable')}
                    </Text>
                    <Text style={styles.calloutLink}>{isIt ? 'Apri menù ›' : 'Open menu ›'}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapWrapper>
          {mapLocales.length === 0 && !loading && (
            <View style={styles.mapEmptyOverlay} pointerEvents="none">
              <GlassCard style={styles.emptyBox}>
                <AppText variant="subtitle" style={{ textAlign: 'center' }}>
                  {isIt ? 'Nessun locale con coordinate per i filtri attuali.' : 'No venues with coordinates for current filters.'}
                </AppText>
              </GlassCard>
            </View>
          )}
        </View>
      ) : (
        <GlassScreenScroll contentContainerStyle={styles.container}>
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
              <>
                <View style={styles.resultsHeader}>
                  <AppText variant="title">
                    {activeFilterCount > 0
                      ? (isIt ? 'Risultati filtrati' : 'Filtered results')
                      : (isIt ? 'Ristoranti consigliati' : 'Recommended restaurants')}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {sortedLocali.length}
                  </AppText>
                </View>
                <View style={styles.cardList}>
                  {sortedLocali.map((item) => (
                    <RestaurantCard
                      key={item.code}
                      code={item.code}
                      name={item.name}
                      city={item.city}
                      compatibility={item.compatibility}
                      isFavorite={isFavorite(item.code)}
                      onToggleFavorite={() => onToggle(item.code, item.name)}
                      latitude={item.latitude}
                      longitude={item.longitude}
                      boostActive={item.boostActive}
                      compact
                    />
                  ))}
                </View>
              </>
            )}
        </GlassScreenScroll>
      )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
    gap: spacing.sm,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  introCopy: {
    flex: 1,
    gap: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchAndView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchField: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.onSurface,
  },
  viewSwitch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewButton: {
    width: 39,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.onSurface,
  },
  filterSummary: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterTrigger: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  filterTriggerActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterTriggerText: {
    fontFamily: font.bold,
  },
  orderHint: {
    flex: 1,
    textAlign: 'right',
  },
  filtersPanel: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  filterGroup: {
    gap: 4,
  },
  container: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  // Map
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
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
    marginBottom: 8,
  },
  calloutLink: {
    ...typography.caption,
    color: colors.brandDark,
    fontWeight: '600',
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardList: {
    gap: spacing.sm,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  filterScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: 2,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    minHeight: CHIP_MIN_HEIGHT,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
  },
  filterChipTextActive: {
    color: colors.brand,
    fontWeight: '800',
  },
});
