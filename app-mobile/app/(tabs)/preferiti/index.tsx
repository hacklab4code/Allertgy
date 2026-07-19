import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '../../../src/api/client';
import { calcolaCompatibilita } from '../../../src/engine/compatibility';
import RestaurantCard from '../../../src/components/RestaurantCard';
import { ProductFavoriteCard } from '../../../src/components/ProductFavoriteCard';
import { useSession } from '../../../src/store/session';
import { syncFavoritesFromServer, toggleRestaurantFavorite } from '../../../src/services/favorites';
import { useTranslation } from '../../../src/constants/translations';
import { useActiveProfileAllergies } from '../../../src/hooks/useActiveProfileAllergies';
import {
  AllergyProfileBanner,
  AppText,
  CollapseSection,
  CountBadge,
  EmptyStateCard,
  ErrorStateCard,
  GlassScreenScroll,
  PillToggle,
  Screen,
} from '../../../src/components/ui';
import {
  loadProductFavorites,
  loadScanHistory,
  toggleProductFavorite,
} from '../../../src/services/productStorage';
import type { ScannedProduct } from '../../../src/services/barcodeScan';
import { colors, spacing } from '../../../src/theme';
import type { RestaurantSummary } from '../../../src/types';

type TabMode = 'venues' | 'products';

export default function Preferiti() {
  const {
    favorites,
    token,
    ingredientiEsclusi,
    language,
    setSubProfiles,
  } = useSession();

  const { allergie, hasAllergie } = useActiveProfileAllergies();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [productFavorites, setProductFavorites] = useState<ScannedProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [tab, setTab] = useState<TabMode>('venues');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase().startsWith('it');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [rests, prods, history] = await Promise.all([
        api.listRestaurantsSummary(),
        loadProductFavorites(),
        loadScanHistory(),
      ]);
      setRestaurants(rests);
      setProductFavorites(prods);
      setScanHistory(history);
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

  useFocusEffect(
    useCallback(() => {
      loadData();
      if (token) syncFavoritesFromServer().catch(() => {});
    }, [loadData, token]),
  );

  const favoritesEnriched = useMemo(() => {
    return favorites
      .map((f) => {
        const full = restaurants.find((r) => r.public_code === f.code);
        const compatibility = full && full.piatti.length > 0
          ? calcolaCompatibilita(allergie, full.piatti, ingredientiEsclusi)
          : null;
        return {
          code: f.code,
          name: f.name,
          city: full?.citta,
          compatibility,
          latitude: full?.latitude,
          longitude: full?.longitude,
          boostActive: !!full?.boost_active,
        };
      })
      .sort((a, b) => (b.compatibility?.percentuale ?? -1) - (a.compatibility?.percentuale ?? -1));
  }, [favorites, restaurants, allergie, ingredientiEsclusi]);

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

  const openProduct = (barcode: string) => {
    router.push({ pathname: '/scanner', params: { barcode } });
  };

  const venueCount = favoritesEnriched.length;
  const productCount = productFavorites.length;

  return (
    <Screen edges={false}>
      <GlassScreenScroll contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
              {isIt ? 'Salvati' : 'Saved'}
            </AppText>
            <AppText variant="h1">{isIt ? 'Preferiti' : 'Favorites'}</AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted}>
              {tab === 'venues'
                ? (isIt
                  ? 'Locali con semaforo sul tuo profilo'
                  : 'Venues with traffic light for your profile')
                : (isIt
                  ? 'Prodotti che compri spesso'
                  : 'Products you buy often')}
            </AppText>
          </View>
          <CountBadge
            count={tab === 'venues' ? venueCount : productCount}
            tint={tab === 'venues' ? 'brand' : 'green'}
          />
        </View>

        {!hasAllergie && (
          <AllergyProfileBanner hasAllergie={false} isIt={isIt} />
        )}

        <PillToggle
          options={[
            { value: 'venues', label: isIt ? `Locali (${venueCount})` : `Venues (${venueCount})` },
            { value: 'products', label: isIt ? `Prodotti (${productCount})` : `Products (${productCount})` },
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
              <View style={styles.cardList}>
                {favoritesEnriched.map((item) => (
                  <RestaurantCard
                    key={item.code}
                    code={item.code}
                    name={item.name}
                    city={item.city}
                    compatibility={item.compatibility}
                    isFavorite
                    onToggleFavorite={() => onToggleVenue(item.code, item.name)}
                    latitude={item.latitude}
                    longitude={item.longitude}
                    boostActive={item.boostActive}
                    compact
                  />
                ))}
              </View>
            </View>
          )
        ) : productCount === 0 && historyNotFav.length === 0 ? (
          <EmptyStateCard
            icon="barcode-outline"
            title={isIt ? 'Nessun prodotto salvato' : 'No saved products'}
            description={t('no_products_scanned_desc')}
            actionLabel={isIt ? 'Scansiona' : 'Scan'}
            onAction={() => router.push('/scanner')}
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  block: {
    gap: spacing.sm,
  },
  blockHeader: {
    gap: 2,
    paddingHorizontal: 2,
  },
  cardList: {
    gap: spacing.sm,
  },
});
