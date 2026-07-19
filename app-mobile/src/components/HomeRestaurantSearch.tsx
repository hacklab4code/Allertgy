import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { LocationObject } from 'expo-location';
import * as Haptics from 'expo-haptics';
import type { CompatibilitaResult } from '../engine/compatibility';
import { calcolaCompatibilita } from '../engine/compatibility';
import type { RestaurantSummary } from '../types';
import { colors, font, radius, spacing, type Verdict } from '../theme';
import { AppText, GlassCard, TrafficDot } from './ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SearchHit = {
  code: string;
  name: string;
  city: string | null;
  compatibility: CompatibilitaResult | null;
  boostActive: boolean;
  distanceLabel: string | null;
  matchedDish: string | null;
  score: number;
};

type Props = {
  restaurants: RestaurantSummary[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  allergie: readonly string[];
  ingredientiEsclusi: readonly string[];
  userLocation: LocationObject | null;
  isFavorite: (code: string) => boolean;
  onToggleFavorite: (code: string, name: string) => void;
  isIt: boolean;
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
      * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function verdictFromCompat(compat: CompatibilitaResult | null): Verdict {
  if (!compat || compat.totaleDishes === 0) return 'yellow';
  if (compat.percentuale === 100) return 'green';
  if (compat.rosso > 0) return 'red';
  return 'yellow';
}

export default function HomeRestaurantSearch({
  restaurants,
  loading = false,
  error = false,
  onRetry,
  allergie,
  ingredientiEsclusi,
  userLocation,
  isFavorite,
  onToggleFavorite,
  isIt,
}: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslate = useRef(new Animated.Value(-6)).current;

  const trimmed = query.trim();
  const open = focused || trimmed.length > 0;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 180 : 120,
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslate, {
        toValue: open ? 0 : -6,
        duration: open ? 180 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, panelOpacity, panelTranslate]);

  const hits = useMemo<SearchHit[]>(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    const userLat = userLocation?.coords.latitude;
    const userLon = userLocation?.coords.longitude;

    const results: SearchHit[] = [];
    for (const r of restaurants) {
      const name = r.nome_ristorante;
      const city = r.citta;
      const nameLower = name.toLowerCase();
      const cityLower = city?.toLowerCase() ?? '';
      const codeLower = r.public_code.toLowerCase();

      let matchedDish: string | null = null;
      let score = 0;

      if (nameLower.startsWith(q)) score += 100;
      else if (nameLower.includes(q)) score += 70;
      if (cityLower.startsWith(q)) score += 40;
      else if (cityLower.includes(q)) score += 25;
      if (codeLower.includes(q)) score += 50;

      if (score === 0) {
        for (const p of r.piatti) {
          const dish = p.nome_piatto.toLowerCase();
          if (dish.includes(q)) {
            matchedDish = p.nome_piatto;
            score += 20;
            break;
          }
        }
      }

      if (score === 0) continue;

      const compatibility = r.piatti.length > 0
        ? calcolaCompatibilita(allergie, r.piatti, ingredientiEsclusi)
        : null;

      let distanceLabel: string | null = null;
      if (
        userLat != null
        && userLon != null
        && r.latitude != null
        && r.longitude != null
      ) {
        const dist = distanceKm(userLat, userLon, r.latitude, r.longitude);
        distanceLabel = formatDistance(dist);
        score += Math.max(0, 15 - Math.min(dist, 15));
      }
      if (r.boost_active) score += 8;
      if (compatibility?.percentuale === 100) score += 6;

      results.push({
        code: r.public_code,
        name,
        city,
        compatibility,
        boostActive: !!r.boost_active,
        distanceLabel,
        matchedDish,
        score,
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [trimmed, restaurants, allergie, ingredientiEsclusi, userLocation]);

  const clear = () => {
    setQuery('');
    Keyboard.dismiss();
    setFocused(false);
  };

  const openMenu = (code: string) => {
    Keyboard.dismiss();
    void Haptics.selectionAsync();
    router.push(`/menu/${code}`);
  };

  const placeholder = isIt ? 'Cerca ristorante, città o piatto' : 'Search restaurant, city or dish';

  return (
    <View style={styles.wrap}>
      <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
        <Ionicons name="search" size={19} color={focused ? colors.brand : colors.onSurfaceMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.searchField}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          accessibilityLabel={isIt ? 'Cerca un ristorante' : 'Search for a restaurant'}
        />
        {trimmed ? (
          <Pressable onPress={clear} hitSlop={10} accessibilityLabel={isIt ? 'Cancella ricerca' : 'Clear search'}>
            <Ionicons name="close-circle" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <Animated.View
          style={[
            styles.panelAnim,
            { opacity: panelOpacity, transform: [{ translateY: panelTranslate }] },
          ]}
        >
          <GlassCard padded={false} style={styles.panel}>
            <View style={styles.panelHeader}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
                {trimmed
                  ? (isIt ? 'RISULTATI' : 'RESULTS')
                  : (isIt ? 'CERCA UN LOCALE' : 'SEARCH A VENUE')}
              </AppText>
              {trimmed ? (
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {hits.length === 1
                    ? (isIt ? '1 locale' : '1 venue')
                    : (isIt ? `${hits.length} locali` : `${hits.length} venues`)}
                </AppText>
              ) : null}
            </View>

            {error ? (
              <Pressable onPress={onRetry} style={styles.stateRow}>
                <Ionicons name="cloud-offline-outline" size={20} color={colors.brand} />
                <View style={styles.stateCopy}>
                  <AppText variant="bodyBold">{isIt ? 'Impossibile caricare i locali' : 'Could not load venues'}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt ? 'Tocca per riprovare' : 'Tap to retry'}
                  </AppText>
                </View>
              </Pressable>
            ) : loading && restaurants.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : !trimmed ? (
              <View style={styles.stateRow}>
                <View style={styles.hintIcon}>
                  <Ionicons name="restaurant-outline" size={18} color={colors.brand} />
                </View>
                <View style={styles.stateCopy}>
                  <AppText variant="bodyBold">
                    {isIt ? 'Digita per aprire i risultati' : 'Type to open results'}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt
                      ? 'Nome, città, codice o un piatto del menù'
                      : 'Name, city, code, or a dish from the menu'}
                  </AppText>
                </View>
              </View>
            ) : hits.length === 0 ? (
              <View style={styles.stateRow}>
                <View style={[styles.hintIcon, styles.hintIconMuted]}>
                  <Ionicons name="search-outline" size={18} color={colors.onSurfaceMuted} />
                </View>
                <View style={styles.stateCopy}>
                  <AppText variant="bodyBold">
                    {isIt ? 'Nessun risultato' : 'No results'}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt
                      ? `Nessun locale trovato per “${trimmed}”`
                      : `No venues found for “${trimmed}”`}
                  </AppText>
                </View>
              </View>
            ) : (
              <View>
                {hits.map((hit, index) => {
                  const verdict = verdictFromCompat(hit.compatibility);
                  const favorite = isFavorite(hit.code);
                  const meta = [
                    hit.city,
                    hit.distanceLabel,
                    hit.compatibility && hit.compatibility.totaleDishes > 0
                      ? `${hit.compatibility.percentuale}%`
                      : null,
                  ].filter(Boolean).join(' · ');

                  return (
                    <Pressable
                      key={hit.code}
                      onPress={() => openMenu(hit.code)}
                      style={({ pressed }) => [
                        styles.resultRow,
                        index > 0 && styles.resultRowBorder,
                        pressed && styles.resultRowPressed,
                      ]}
                    >
                      <View style={styles.resultIcon}>
                        <Ionicons name="restaurant-outline" size={18} color={colors.brand} />
                      </View>
                      <View style={styles.resultBody}>
                        <View style={styles.resultTitleRow}>
                          <AppText variant="bodyBold" numberOfLines={1} style={styles.resultTitle}>
                            {hit.name}
                          </AppText>
                          {hit.boostActive ? (
                            <View style={styles.boostPill}>
                              <AppText variant="caption" color={colors.brand}>
                                {isIt ? 'Top' : 'Top'}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                        {meta ? (
                          <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
                            {meta}
                          </AppText>
                        ) : null}
                        {hit.matchedDish ? (
                          <AppText variant="caption" color={colors.brand} numberOfLines={1}>
                            {isIt ? 'Nel menù: ' : 'On the menu: '}
                            {hit.matchedDish}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={styles.resultAside}>
                        {hit.compatibility && hit.compatibility.totaleDishes > 0 ? (
                          <View style={styles.matchChip}>
                            <TrafficDot verdict={verdict} size={8} />
                            <AppText variant="caption" color={colors.onSurfaceMuted}>
                              {hit.compatibility.percentuale}%
                            </AppText>
                          </View>
                        ) : null}
                        <Pressable
                          onPress={() => onToggleFavorite(hit.code, hit.name)}
                          hitSlop={10}
                          accessibilityLabel={favorite
                            ? (isIt ? 'Rimuovi dai preferiti' : 'Remove from favorites')
                            : (isIt ? 'Aggiungi ai preferiti' : 'Add to favorites')}
                        >
                          <Ionicons
                            name={favorite ? 'heart' : 'heart-outline'}
                            size={18}
                            color={favorite ? colors.brand : colors.onSurfaceMuted}
                          />
                        </Pressable>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceMuted} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    zIndex: 2,
  },
  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBoxFocused: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
  },
  searchField: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.onSurface,
  },
  panelAnim: {
    width: '100%',
  },
  panel: {
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resultRowPressed: {
    backgroundColor: colors.brand50,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
  resultBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    flexShrink: 1,
  },
  boostPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
  },
  resultAside: {
    alignItems: 'flex-end',
    gap: 6,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  stateCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  hintIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
  hintIconMuted: {
    backgroundColor: colors.surfaceTertiary,
  },
  loadingRow: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
