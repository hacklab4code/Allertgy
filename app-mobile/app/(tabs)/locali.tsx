import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '../../src/api/client';
import { calcolaCompatibilita, type CompatibilitaResult } from '../../src/engine/compatibility';
import RestaurantCard from '../../src/components/RestaurantCard';
import { useSession } from '../../src/store/session';
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
  const { recents, favorites, toggleFavorite, isFavorite, allergie, token, ingredientiEsclusi } = useSession();
  const [restaurants, setRestaurants] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    setLoading(true);
    api.listRestaurants()
      .then(setRestaurants)
      .catch((e) => console.log('Errore di rete locali:', e))
      .finally(() => setLoading(false));
  }, []);

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
    if (compat.hasRosso) return colors.red;
    return colors.yellow;
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
    <View style={styles.mainContainer}>
      <View style={styles.headerArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>I tuoi locali</Text>
          <Text style={styles.headerSub}>
            Scopri quanto puoi mangiare in ogni ristorante in base al tuo profilo.
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>📄 Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>🗺️ Mappa</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <MapView
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
          {locali.filter(l => l.latitude && l.longitude).map(locale => (
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
                  />
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Statistiche preferiti */}
          {favStats && (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{favStats.count}</Text>
                <Text style={styles.statLabel}>Preferiti</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.green }]}>{favStats.avgCompatibility}%</Text>
                <Text style={styles.statLabel}>Compatibilità media</Text>
              </View>
            </View>
          )}

          {/* ⭐ Preferiti */}
          <Section
            icon="⭐️"
            title="Preferiti"
            subtitle={favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? 'locale salvato' : 'locali salvati'}`
              : undefined}
          >
            {favorites.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>⭐️</Text>
                <Text style={styles.emptyTitle}>Nessun preferito</Text>
                <Text style={styles.emptyText}>
                  Tocca la stellina su un locale per ritrovarlo qui e ricevere una notifica quando aggiorna il menù.
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
                  />
                ))}
              </View>
            )}
          </Section>

          {/* 📍 Consigliati */}
          <Section
            icon="📍"
            title="Tutti i locali"
            subtitle="Ordinati per compatibilità con il tuo profilo"
          >
            {loading ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.xl }} />
            ) : locali.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyTitle}>Nessun locale trovato</Text>
                <Text style={styles.emptyText}>
                  Non ci sono ancora ristoranti registrati. Scansiona un QR o inserisci un codice dalla scheda Cerca.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {[...locali]
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
                    />
                  ))}
              </View>
            )}
          </Section>

          {/* 🕐 Visitati di recente */}
          {recentsOnly.length > 0 && (
            <Section icon="🕐" title="Visitati di recente">
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
                  />
                ))}
              </View>
            </Section>
          )}
        </ScrollView>
      )}
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
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.full,
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
});
