import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, TextInput } from 'react-native';
import MapWrapper, { MarkerComponent as Marker, CalloutComponent as Callout } from '../../src/components/MapWrapper';
import * as Location from 'expo-location';
import { api } from '../../src/api/client';
import { calcolaCompatibilita, type CompatibilitaResult } from '../../src/engine/compatibility';
import RestaurantCard from '../../src/components/RestaurantCard';
import { useSession } from '../../src/store/session';
import LanguageFlagsRow from '../../src/components/LanguageFlagsRow';
import { useTranslation } from '../../src/constants/translations';

import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { Menu } from '../../src/types';

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
}

export default function Locali() {
  const { 
    recents, favorites, toggleFavorite, isFavorite, allergie: primaryAllergies, token, 
    ingredientiEsclusi, language, subProfiles, setSubProfiles, activeProfileId, setActiveProfileId 
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
  const [restaurants, setRestaurants] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [compatFilter, setCompatFilter] = useState<'all' | 'safe' | '80'>('all');
  const [cuisineFilter, setCuisineFilter] = useState<'all' | 'italiano' | 'sushi' | 'burger' | 'altro'>('all');

  useEffect(() => {
    setLoading(true);
    api.listRestaurants()
      .then(setRestaurants)
      .catch((e) => console.log('Errore di rete locali:', e))
      .finally(() => setLoading(false));

    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
    }
  }, [token]);

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
    });
  }, [locali, searchQuery, compatFilter, cuisineFilter, restaurants]);

  // Locali preferiti arricchiti con dati compatibilità
  const favoritesEnriched = useMemo<LocaleData[]>(() => {
    return favorites.map((f) => {
      const full = locali.find((l) => l.code === f.code);
      return full ?? { code: f.code, name: f.name, compatibility: null };
    });
  }, [favorites, locali]);

  // Recenti che non sono già nei preferiti
  const recentsOnly = useMemo(() => {
    const favCodes = new Set(favorites.map((f) => f.code));
    return recents
      .filter((r) => !favCodes.has(r.code))
      .map((r) => {
        const full = locali.find((l) => l.code === r.code);
        return full ?? { code: r.code, name: r.name, compatibility: null };
      });
  }, [recents, favorites, locali]);

  const onToggle = (code: string, name: string) => {
    const wasFav = isFavorite(code);
    toggleFavorite(code, name);
    if (token) {
      (wasFav ? api.removeFavorite(code) : api.addFavorite(code)).catch(() => {});
    }
  };

  // Stats aggregate per i preferiti
  const favStats = useMemo(() => {
    const withMenu = favoritesEnriched.filter((f) => f.compatibility && f.compatibility.totaleDishes > 0);
    if (withMenu.length === 0) return null;
    const avg = Math.round(withMenu.reduce((acc, f) => acc + (f.compatibility?.percentuale ?? 0), 0) / withMenu.length);
    return { count: withMenu.length, avgCompatibility: avg };
  }, [favoritesEnriched]);

  const getMarkerColor = (compat: CompatibilitaResult | null) => {
    if (!compat) return colors.textMuted;
    if (compat.percentuale === 100) return colors.green;
    if (compat.rosso > 0) return colors.red;
    return colors.amber;
  };

  const Section = ({ icon, title, subtitle, children, action }: {
    icon: string; title: string; subtitle?: string; children: React.ReactNode;
    action?: { label: string; onPress: () => void };
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{icon}  {title}</Text>
          {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
        </View>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={styles.sectionAction}>{action.label} ›</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LanguageFlagsRow />
      <View style={styles.mainContainer}>
        <View style={styles.headerArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{isIt ? "I tuoi locali" : "Your venues"}</Text>
            <Text style={styles.headerSub}>
              {isIt ? "Scopri quanto puoi mangiare in ogni ristorante in base al tuo profilo." : "Discover how much you can eat at each restaurant based on your profile."}
            </Text>
          </View>

          {/* Sottoprofili Switcher */}
          {token && subProfiles.length > 0 && (
            <View style={styles.profileSwitcherContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileSwitcherScroll}>
                <TouchableOpacity
                  style={[styles.profileSwitcherBtn, activeProfileId === null && styles.profileSwitcherBtnActive]}
                  onPress={() => setActiveProfileId(null)}
                >
                  <Text style={[styles.profileSwitcherText, activeProfileId === null && styles.profileSwitcherTextActive]}>
                    👤 {isIt ? 'Io' : 'Me'}
                  </Text>
                </TouchableOpacity>
                {subProfiles.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.profileSwitcherBtn, activeProfileId === p.id && styles.profileSwitcherBtnActive]}
                    onPress={() => setActiveProfileId(p.id)}
                  >
                    <Text style={[styles.profileSwitcherText, activeProfileId === p.id && styles.profileSwitcherTextActive]}>
                      👥 {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.profileSwitcherBtn, { borderColor: '#cbd5e1', borderStyle: 'dashed' }]}
                  onPress={() => router.push('/sub-profiles')}
                >
                  <Text style={[styles.profileSwitcherText, { color: '#64748b' }]}>
                    ＋ {isIt ? 'Gestisci' : 'Manage'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>{t('list_view')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>{t('map_view')}</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={isIt ? "Cerca per nome o città..." : "Search by name or city..."}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Horizontal Filters Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={{ marginTop: spacing.sm }}>
            <TouchableOpacity 
              style={[styles.filterChip, compatFilter === 'all' && styles.filterChipActive]}
              onPress={() => setCompatFilter('all')}
            >
              <Text style={[styles.filterChipText, compatFilter === 'all' && styles.filterChipTextActive]}>⚙️ {isIt ? 'Tutte' : 'All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, compatFilter === 'safe' && styles.filterChipActive]}
              onPress={() => setCompatFilter('safe')}
            >
              <Text style={[styles.filterChipText, compatFilter === 'safe' && styles.filterChipTextActive]}>🟢 {isIt ? 'Sicuro 100%' : '100% Safe'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, compatFilter === '80' && styles.filterChipActive]}
              onPress={() => setCompatFilter('80')}
            >
              <Text style={[styles.filterChipText, compatFilter === '80' && styles.filterChipTextActive]}>🟡 {isIt ? 'Compat. > 80%' : 'Compat. > 80%'}</Text>
            </TouchableOpacity>

            <View style={styles.filterDivider} />

            <TouchableOpacity 
              style={[styles.filterChip, cuisineFilter === 'all' && styles.filterChipActive]}
              onPress={() => setCuisineFilter('all')}
            >
              <Text style={[styles.filterChipText, cuisineFilter === 'all' && styles.filterChipTextActive]}>🍽️ {isIt ? 'Cucine' : 'Cuisines'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, cuisineFilter === 'italiano' && styles.filterChipActive]}
              onPress={() => setCuisineFilter('italiano')}
            >
              <Text style={[styles.filterChipText, cuisineFilter === 'italiano' && styles.filterChipTextActive]}>🍕 {isIt ? 'Italiano' : 'Italian'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, cuisineFilter === 'sushi' && styles.filterChipActive]}
              onPress={() => setCuisineFilter('sushi')}
            >
              <Text style={[styles.filterChipText, cuisineFilter === 'sushi' && styles.filterChipTextActive]}>🍣 Sushi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, cuisineFilter === 'burger' && styles.filterChipActive]}
              onPress={() => setCuisineFilter('burger')}
            >
              <Text style={[styles.filterChipText, cuisineFilter === 'burger' && styles.filterChipTextActive]}>🍔 Burger</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, cuisineFilter === 'altro' && styles.filterChipActive]}
              onPress={() => setCuisineFilter('altro')}
            >
              <Text style={[styles.filterChipText, cuisineFilter === 'altro' && styles.filterChipTextActive]}>✨ {isIt ? 'Altro' : 'Other'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

      {viewMode === 'map' ? (
        <MapWrapper
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={true}
          initialRegion={{
            latitude: userLocation?.coords.latitude ?? 41.902782, // Default: Rome
            longitude: userLocation?.coords.longitude ?? 12.496366,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {filteredLocali.filter(l => l.latitude && l.longitude).map(locale => (
            <Marker
              key={locale.code}
              coordinate={{ latitude: locale.latitude!, longitude: locale.longitude! }}
              pinColor={getMarkerColor(locale.compatibility)}
            >
              <Callout tooltip onPress={() => router.push(`/menu/${locale.code}`)}>
                <View style={{ width: 300 }}>
                  <RestaurantCard
                    code={locale.code}
                    name={locale.name}
                    city={locale.city}
                    compatibility={locale.compatibility}
                    isFavorite={isFavorite(locale.code)}
                    onToggleFavorite={() => onToggle(locale.code, locale.name)}
                    compact={true}
                    latitude={locale.latitude}
                    longitude={locale.longitude}
                  />
                </View>
              </Callout>
            </Marker>
          ))}
        </MapWrapper>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Statistiche preferiti */}
          {favStats && (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{favStats.count}</Text>
                <Text style={styles.statLabel}>{t('favorites_stats')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.green }]}>{favStats.avgCompatibility}%</Text>
                <Text style={styles.statLabel}>{t('avg_compat_stats')}</Text>
              </View>
            </View>
          )}

          {/* ⭐ Preferiti */}
          <Section
            icon="⭐️"
            title={isIt ? "Preferiti" : "Favorites"}
            subtitle={favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? (isIt ? 'locale salvato' : 'venue saved') : (isIt ? 'locali salvati' : 'venues saved')}`
              : undefined}
          >
            {favorites.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>⭐️</Text>
                <Text style={styles.emptyTitle}>{t('no_favorites_title')}</Text>
                <Text style={styles.emptyText}>
                  {t('no_favorites_desc')}
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {favoritesEnriched.map((item) => (
                  <RestaurantCard
                    key={item.code}
                    code={item.code}
                    name={item.name}
                    city={item.city}
                    compatibility={item.compatibility}
                    isFavorite={true}
                    onToggleFavorite={() => onToggle(item.code, item.name)}
                    latitude={item.latitude}
                    longitude={item.longitude}
                  />
                ))}
              </View>
            )}
          </Section>

          {/* 📍 Consigliati */}
          <Section
            icon="📍"
            title={t('all_restaurants_title')}
            subtitle={t('all_restaurants_sub')}
          >
            {loading ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.xl }} />
            ) : filteredLocali.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyTitle}>{isIt ? "Nessun locale trovato" : "No venues found"}</Text>
                <Text style={styles.emptyText}>
                  {isIt ? "Nessun ristorante corrisponde ai filtri impostati." : "No restaurants match the selected filters."}
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {[...filteredLocali]
                  .sort((a, b) => (b.compatibility?.percentuale ?? -1) - (a.compatibility?.percentuale ?? -1))
                  .map((item) => (
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
                    />
                  ))}
              </View>
            )}
          </Section>

          {/* 🕐 Visitati di recente */}
          {recentsOnly.length > 0 && (
            <Section icon="🕐" title={isIt ? "Visitati di recente" : "Visited recently"}>
              <View style={styles.cardList}>
                {recentsOnly.map((item) => (
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
                  />
                ))}
              </View>
            </Section>
          )}
        </ScrollView>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerArea: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    zIndex: 10,
  },
  container: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 48,
    gap: spacing.xxl,
  },

  // Header
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.ink,
  },
  headerSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Toggle Map/List
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  toggleBtnActive: {
    backgroundColor: colors.ink,
  },
  toggleText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
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

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Sezioni
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },

  // Card list
  cardList: {
    gap: spacing.sm,
  },

  // Empty state
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xxl,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: colors.textMuted,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    height: '100%',
  },
  filterScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: 4,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderStrong,
    marginHorizontal: 4,
  },
  profileSwitcherContainer: {
    marginTop: spacing.md,
    height: 40,
  },
  profileSwitcherScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    alignItems: 'center',
  },
  profileSwitcherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  profileSwitcherBtnActive: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdf4',
  },
  profileSwitcherText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  profileSwitcherTextActive: {
    color: colors.brand,
  },
});
