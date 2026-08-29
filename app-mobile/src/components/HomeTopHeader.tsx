import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { LocationObject } from 'expo-location';
import { useNotifStore } from '../store/notifications';
import { colors, font, radius, spacing, type Verdict } from '../theme';
import { AppText, GlassCard, TrafficDot } from './ui';
import { SafeBlurView } from './ui/SafeBlurView';
import { calcolaCompatibilita, type CompatibilitaResult } from '../engine/compatibility';
import type { RestaurantSummary } from '../types';

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

interface HomeTopHeaderProps {
  scrollY: SharedValue<number>;
  restaurants: RestaurantSummary[];
  loadingRestaurants?: boolean;
  restaurantsError?: boolean;
  onRetryRestaurants?: () => void;
  allergie: readonly string[];
  ingredientiEsclusi: readonly string[];
  userLocation: LocationObject | null;
  isFavorite: (code: string) => boolean;
  onToggleFavorite: (code: string, name: string) => void;
  isIt?: boolean;
}

export function HomeTopHeader({
  scrollY,
  restaurants,
  loadingRestaurants = false,
  restaurantsError = false,
  onRetryRestaurants,
  allergie,
  ingredientiEsclusi,
  userLocation,
  isFavorite,
  onToggleFavorite,
  isIt = true,
}: HomeTopHeaderProps) {
  const insets = useSafeAreaInsets();
  const unreadNotifs = useNotifStore((s) => s.unread);
  const refreshNotifs = useNotifStore((s) => s.refresh);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const panelOpacity = useRef(new RNAnimated.Value(0)).current;
  const panelTranslate = useRef(new RNAnimated.Value(-6)).current;

  useEffect(() => {
    refreshNotifs();
  }, [refreshNotifs]);

  const trimmed = query.trim();
  const searchOpen = focused || trimmed.length > 0;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    RNAnimated.parallel([
      RNAnimated.timing(panelOpacity, {
        toValue: searchOpen ? 1 : 0,
        duration: searchOpen ? 180 : 120,
        useNativeDriver: true,
      }),
      RNAnimated.timing(panelTranslate, {
        toValue: searchOpen ? 0 : -6,
        duration: searchOpen ? 180 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [searchOpen, panelOpacity, panelTranslate]);

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

  const handleOpenEmergency = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/emergency');
  }, []);

  const handleOpenNotifications = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifiche');
  }, []);

  const clearSearch = () => {
    setQuery('');
    Keyboard.dismiss();
    setFocused(false);
  };

  const openMenu = (code: string) => {
    Keyboard.dismiss();
    void Haptics.selectionAsync();
    router.push(`/menu/${code}`);
  };

  // Frosted Backdrop Style on Scroll
  const backdropAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [10, 35], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const fullPlaceholder = isIt
    ? 'Cerca ristorante, città o codice a 6 cifre'
    : 'Search venue, city or 6-digit code';

  return (
    <View pointerEvents="box-none" style={styles.headerLayer}>
      {/* Frosted Glass Backdrop on Scroll */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <SafeBlurView
          intensity={90}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.backdropBorder} />
      </Animated.View>

      {/* Main Header Inner Content */}
      <View
        pointerEvents="box-none"
        style={[styles.headerInner, { paddingTop: insets.top + 8 }]}
      >
        {/* ROW: [ Tasto SOS ] ··· [ Barra di Ricerca sempre visibile ] ··· [ 🔔 Notifiche ] */}
        <View pointerEvents="box-none" style={styles.topRow}>
          {/* Left: Tasto SOS Circolare con icona 3D */}
          <Pressable
            onPress={handleOpenEmergency}
            accessibilityRole="button"
            accessibilityLabel={isIt ? 'SOS Emergenza' : 'SOS Emergency'}
            style={({ pressed }) => [
              styles.sosCircleButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <Image
              source={require('../../assets/header_sos.png')}
              style={styles.sosIconImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* Center: Search Bar (Sempre visibile in alto) */}
          <View style={styles.searchSlot}>
            <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
              <Ionicons name="search" size={17} color={focused ? colors.brand : '#9CA3AF'} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={fullPlaceholder}
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
              />
              {trimmed.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Right: Notification Bell Only */}
          <Pressable
            onPress={handleOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel={isIt ? 'Notifiche' : 'Notifications'}
            style={({ pressed }) => [
              styles.notifCircle,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <Image
              source={require('../../assets/header_notifiche.png')}
              style={styles.notifIconImage}
              resizeMode="contain"
            />
            {unreadNotifs > 0 ? <View style={styles.unreadBadge} /> : null}
          </Pressable>
        </View>
      </View>

      {/* Dropdown Search Results Overlay */}
      {searchOpen ? (
        <RNAnimated.View
          style={[
            styles.resultsPanelContainer,
            {
              top: insets.top + 64,
              opacity: panelOpacity,
              transform: [{ translateY: panelTranslate }],
            },
          ]}
        >
          <GlassCard padded={false} style={styles.resultsPanel}>
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

            {restaurantsError ? (
              <Pressable onPress={onRetryRestaurants} style={styles.stateRow}>
                <Ionicons name="cloud-offline-outline" size={20} color={colors.brand} />
                <View style={styles.stateCopy}>
                  <AppText variant="bodyBold">{isIt ? 'Impossibile caricare i locali' : 'Could not load venues'}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt ? 'Tocca per riprovare' : 'Tap to retry'}
                  </AppText>
                </View>
              </Pressable>
            ) : loadingRestaurants && restaurants.length === 0 ? (
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
                    {isIt ? 'Digita per cercare' : 'Type to search'}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt
                      ? 'Nome, città, codice o piatto'
                      : 'Name, city, code or dish'}
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
                            {isIt ? 'Nel menù: ' : 'On menu: '}
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
        </RNAnimated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  backdropBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerInner: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
    width: '100%',
  },
  sosCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sosIconImage: {
    width: 36,
    height: 36,
  },
  searchSlot: {
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#F9FAFB',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBoxFocused: {
    borderColor: colors.brand,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: font.regular,
    fontSize: 13.5,
    color: '#111827',
    paddingVertical: 0,
  },
  notifCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    flexShrink: 0,
  },
  notifIconImage: {
    width: 36,
    height: 36,
  },
  unreadBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  resultsPanelContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 120,
    elevation: 120,
    maxHeight: 380,
  },
  resultsPanel: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
  },
  resultRow: {
    minHeight: 64,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 14,
    color: '#111827',
  },
  boostPill: {
    backgroundColor: colors.brand50,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  resultAside: {
    alignItems: 'flex-end',
    gap: 4,
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
    padding: spacing.md,
  },
  stateCopy: {
    flex: 1,
  },
  hintIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintIconMuted: {
    backgroundColor: colors.surfaceSecondary,
  },
  loadingRow: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
