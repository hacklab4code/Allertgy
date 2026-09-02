import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../../src/api/client';
import { calcolaCompatibilita } from '../../../src/engine/compatibility';
import RestaurantCard from '../../../src/components/RestaurantCard';
import { ProductFavoriteCard } from '../../../src/components/ProductFavoriteCard';
import { useSession } from '../../../src/store/session';
import { syncFavoritesFromServer, toggleRestaurantFavorite } from '../../../src/services/favorites';
import { useTranslation } from '../../../src/constants/translations';
import { useActiveProfileAllergies } from '../../../src/hooks/useActiveProfileAllergies';
import { useSectionTitle } from '../../../src/hooks/useSectionTitle';
import {
  AllergyProfileBanner,
  AppText,
  CollapseSection,
  EmptyStateCard,
  ErrorStateCard,
  GlassScreenScroll,
  PillToggle,
  Screen,
  ScrollEntry,
  ScrollFocusEndPad,
  GlassCard,
} from '../../../src/components/ui';
import {
  loadProductFavorites,
  loadScanHistory,
  toggleProductFavorite,
} from '../../../src/services/productStorage';
import type { ScannedProduct } from '../../../src/services/barcodeScan';
import { loadDishFavorites, toggleDishFavorite, type FavoriteDish } from '../../../src/services/dishFavorites';
import { colors, spacing } from '../../../src/theme';
import type { RestaurantSummary } from '../../../src/types';
import { distanceKm, formatDistanceLabel } from '../../../src/utils/venueDistance';
import { resolveDishImageUrl } from '../../../src/utils/dishImage';

type TabMode = 'venues' | 'products' | 'dishes';

export default function Preferiti() {
  const {
    favorites,
    token,
    ingredientiEsclusi,
    language,
    setSubProfiles,
  } = useSession();

  const { allergie, allergyCriteria, hasAllergie } = useActiveProfileAllergies();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [productFavorites, setProductFavorites] = useState<ScannedProduct[]>([]);
  const [dishFavorites, setDishFavorites] = useState<FavoriteDish[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [tab, setTab] = useState<TabMode>('venues');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase().startsWith('it');
  useSectionTitle(isIt ? 'Preferiti' : 'Favorites');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [rests, prods, history, dishes] = await Promise.all([
        api.listRestaurantsSummary(),
        loadProductFavorites(),
        loadScanHistory(),
        loadDishFavorites(),
      ]);
      setRestaurants(rests);
      setProductFavorites(prods);
      setScanHistory(history);
      setDishFavorites(dishes);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
      syncFavoritesFromServer().catch(() => {});
    }
  }, [token, setSubProfiles]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc);
      } catch {
        // posizione opzionale: senza GPS mostriamo solo la città
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      if (token) syncFavoritesFromServer().catch(() => {});
    }, [loadData, token]),
  );

  const favoritesEnriched = useMemo(() => {
    const userLat = userLocation?.coords.latitude;
    const userLon = userLocation?.coords.longitude;
    return favorites
      .map((f) => {
        const full = restaurants.find((r) => r.public_code === f.code);
        const published = full
          ? (full.menu_available ?? full.piatti.length > 0)
          : false;
        const compatibility = hasAllergie && published && full && full.piatti.length > 0
          ? calcolaCompatibilita(allergie, full.piatti, ingredientiEsclusi, allergyCriteria)
          : null;
        let distanceLabel: string | null = null;
        if (
          userLat != null
          && userLon != null
          && full?.latitude != null
          && full?.longitude != null
        ) {
          distanceLabel = formatDistanceLabel(
            distanceKm(userLat, userLon, full.latitude, full.longitude),
          );
        }
        return {
          code: f.code,
          name: f.name,
          city: full?.citta,
          imageUrl: full?.image_url ?? null,
          compatibility,
          menuAvailable: published,
          latitude: full?.latitude,
          longitude: full?.longitude,
          boostActive: !!full?.boost_active,
          ratingAvg: full?.google_rating ?? null,
          ratingCount: full?.google_reviews_count ?? 0,
          distanceLabel,
        };
      })
      .sort((a, b) => (b.compatibility?.percentuale ?? -1) - (a.compatibility?.percentuale ?? -1));
  }, [favorites, restaurants, allergie, ingredientiEsclusi, allergyCriteria, hasAllergie, userLocation]);

  const historyNotFav = useMemo(() => {
    const favCodes = new Set(productFavorites.map((p) => p.barcode));
    return scanHistory.filter((p) => !favCodes.has(p.barcode));
  }, [scanHistory, productFavorites]);

  const onToggleVenue = (code: string, name: string) => {
    void toggleRestaurantFavorite(code, name);
  };

  const onToggleProduct = async (product: ScannedProduct) => {
    const updated = await toggleProductFavorite(product);
    setProductFavorites(updated);
  };

  const onToggleDish = async (favorite: FavoriteDish) => {
    const updated = await toggleDishFavorite(
      favorite.dish,
      favorite.restaurantCode,
      favorite.restaurantName,
    );
    setDishFavorites(updated);
  };

  const openProduct = (barcode: string) => {
    router.push({ pathname: '/scanner', params: { barcode } });
  };

  const venueCount = favoritesEnriched.length;
  const productCount = productFavorites.length;
  const dishCount = dishFavorites.length;

  return (
    <Screen edges={false}>
      <GlassScreenScroll contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasAllergie && (
          <AllergyProfileBanner hasAllergie={false} isIt={isIt} />
        )}

        <PillToggle
          options={[
            { value: 'venues', label: isIt ? `Locali · ${venueCount}` : `Venues · ${venueCount}` },
            { value: 'products', label: isIt ? `Prodotti · ${productCount}` : `Products · ${productCount}` },
            { value: 'dishes', label: isIt ? `Piatti · ${dishCount}` : `Dishes · ${dishCount}` },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loadError ? (
          <ErrorStateCard
            message={t('restaurants_load_error')}
            retryLabel={t('retry_btn')}
            onRetry={loadData}
          />
        ) : loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : tab === 'venues' ? (
          venueCount === 0 ? (
            <EmptyStateCard
              icon="heart-outline"
              title={t('no_favorites_title')}
              description={t('no_favorites_desc')}
              actionLabel={isIt ? 'Cerca locali' : 'Find venues'}
              onAction={() => router.push('/(tabs)/locali')}
            />
          ) : (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <AppText variant="h2">{isIt ? 'I tuoi locali' : 'Your venues'}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Ordinati per compatibilità' : 'Sorted by compatibility'}
                </AppText>
              </View>
              <View style={styles.cardGrid}>
                {favoritesEnriched.map((item, index) => (
                  <View key={item.code} style={styles.gridItem}>
                    <ScrollEntry
                      animation="send-and-receive"
                      edge={
                        favoritesEnriched.length === 1
                          ? 'both'
                          : index === 0
                            ? 'first'
                            : index === favoritesEnriched.length - 1
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
                        isFavorite
                        onToggleFavorite={() => onToggleVenue(item.code, item.name)}
                        latitude={item.latitude}
                        longitude={item.longitude}
                        boostActive={item.boostActive}
                        ratingAvg={item.ratingAvg}
                        ratingCount={item.ratingCount}
                        distanceLabel={item.distanceLabel}
                        compact
                        grid
                        square
                        outline={index % 2 === 1 ? 'glass' : 'white'}
                      />
                    </ScrollEntry>
                  </View>
                ))}
                <ScrollFocusEndPad />
              </View>
            </View>
          )
        ) : tab === 'dishes' ? (
          dishCount === 0 ? (
            <EmptyStateCard
              icon="star-outline"
              title={isIt ? 'Nessun piatto salvato' : 'No saved dishes'}
              description={isIt
                ? 'Apri un piatto dal menù e tocca la stella per ritrovarlo qui.'
                : 'Open a menu dish and tap the star to find it here.'}
            />
          ) : (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <AppText variant="h2">{isIt ? 'Piatti salvati' : 'Saved dishes'}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Tocca per riaprire i dettagli' : 'Tap to reopen the details'}
                </AppText>
              </View>
              {dishFavorites.map((favorite) => (
                <FavoriteDishCard
                  key={`${favorite.restaurantCode}-${favorite.dish.id}`}
                  favorite={favorite}
                  onPress={() => router.push(`/menu/${favorite.restaurantCode}/dish/${favorite.dish.id}`)}
                  onToggle={() => onToggleDish(favorite)}
                />
              ))}
            </View>
          )
        ) : productCount === 0 && historyNotFav.length === 0 ? (
          <EmptyStateCard
            icon="barcode-outline"
            title={isIt ? 'Nessun prodotto salvato' : 'No saved products'}
            description={isIt
              ? 'I prodotti scansionati dalla spesa appariranno qui. Usa Scan in basso.'
              : 'Scanned grocery products will appear here. Use Scan below.'}
          />
        ) : (
          <>
            {productCount > 0 && (
              <View style={styles.block}>
                <View style={styles.blockHeader}>
                  <AppText variant="h2">{isIt ? 'Prodotti abituali' : 'Usual products'}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt ? 'Tocca per riaprire la scheda prodotto' : 'Tap to reopen product details'}
                  </AppText>
                </View>
                {productFavorites.map((item) => (
                  <ProductFavoriteCard
                    key={item.barcode}
                    product={item}
                    isIt={isIt}
                    isFavorite
                    onPress={() => openProduct(item.barcode)}
                    onToggleFavorite={() => onToggleProduct(item)}
                  />
                ))}
              </View>
            )}

            {historyNotFav.length > 0 && (
              <CollapseSection
                icon="time"
                iconBg={colors.brand50}
                iconColor={colors.brand}
                title={t('scan_history_title')}
                preview={`${historyNotFav.length} ${isIt ? 'scansioni recenti' : 'recent scans'}`}
                badge={historyNotFav.length}
                expanded={historyExpanded}
                onToggle={() => setHistoryExpanded((v) => !v)}
                tint="brand"
              >
                {historyNotFav.slice(0, 10).map((item) => (
                  <ProductFavoriteCard
                    key={item.barcode}
                    product={item}
                    isIt={isIt}
                    compact
                    onPress={() => openProduct(item.barcode)}
                    onToggleFavorite={() => onToggleProduct(item)}
                  />
                ))}
              </CollapseSection>
            )}
          </>
        )}
      </GlassScreenScroll>
    </Screen>
  );
}

function FavoriteDishCard({
  favorite,
  onPress,
  onToggle,
}: {
  favorite: FavoriteDish;
  onPress: () => void;
  onToggle: () => void;
}) {
  const imageUri = resolveDishImageUrl(
    favorite.dish.image_url,
    favorite.dish.nome_piatto,
    favorite.dish.categoria,
  );
  return (
    <GlassCard padded={false} style={styles.dishCard}>
      <Pressable style={styles.dishMain} onPress={onPress}>
        <Image source={{ uri: imageUri }} style={styles.dishImage} />
        <View style={styles.dishBody}>
          <AppText variant="bodyBold" numberOfLines={2}>{favorite.dish.nome_piatto}</AppText>
          <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
            {favorite.restaurantName}
          </AppText>
          {favorite.dish.prezzo_cents != null ? (
            <AppText variant="caption" color={colors.brandDark}>
              {(favorite.dish.prezzo_cents / 100).toFixed(2)} €
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} style={styles.dishStar} accessibilityLabel="Rimuovi dai preferiti">
        <Ionicons name="star-outline" size={20} color={colors.amberText} />
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    alignSelf: 'stretch',
    width: '100%',
  },
  loader: {
    marginVertical: spacing.xl,
  },
  block: {
    gap: spacing.sm,
    width: '100%',
  },
  blockHeader: {
    gap: 2,
    paddingHorizontal: 2,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 14,
    width: '100%',
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '46%',
    maxWidth: '48.5%',
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  dishMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
  },
  dishBody: { flex: 1, gap: 3 },
  dishStar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberBg,
  },
});
