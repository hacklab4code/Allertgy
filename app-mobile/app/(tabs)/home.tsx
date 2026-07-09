import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../src/api/client';
import { calcolaCompatibilita } from '../../src/engine/compatibility';
import RestaurantCard from '../../src/components/RestaurantCard';
import { useSession } from '../../src/store/session';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';
import type { RestaurantSummary } from '../../src/types';
import { avviaGeofencing, fermaGeofencing } from '../../src/services/geofencing';
import { syncFavoritesFromServer } from '../../src/services/favorites';
import { useTranslation } from '../../src/constants/translations';

/**
 * Home del cliente. Tre sezioni prioritarie:
 * 1. QR / codice locale (azione principale)
 * 2. Stato profilo (allergie o alert)
 * 3. Locali vicini + ultimo visitato (compresso)
 */
export default function Home() {
  const [code, setCode] = useState('');
  const {
    allergie: primaryAllergies,
    recents,
    email,
    toggleFavorite,
    isFavorite,
    token,
    ingredientiEsclusi,
    language,
    subProfiles,
    setSubProfiles,
    activeProfileId,
    setActiveProfileId,
  } = useSession();

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find(p => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map(a => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const hasAllergie = allergie.length > 0;
  const firstName = activeProfile ? activeProfile.name : ((email ?? '').split('@')[0] || 'benvenuto');

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationStatus('granted');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc);
      } else {
        setLocationStatus('denied');
      }
    } catch (e) {
      console.log("Errore posizione:", e);
      setLocationStatus('error');
    }
  };

  useEffect(() => {
    setLoadingRestaurants(true);
    api.listRestaurantsSummary()
      .then((res) => {
        setRestaurants(res);
        avviaGeofencing(res).catch((err) => console.log('Errore geofencing:', err));
      })
      .catch((e) => console.log('Errore rete:', e))
      .finally(() => setLoadingRestaurants(false));

    requestLocation();

    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
      syncFavoritesFromServer().catch(() => {});
    }

    return () => fermaGeofencing();
  }, [token]);

  const onToggle = (code: string, name: string) => {
    const wasFav = isFavorite(code);
    toggleFavorite(code, name);
    if (token) {
      (wasFav ? api.removeFavorite(code) : api.addFavorite(code)).catch(() => {});
    }
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
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
        return { code: r.public_code, name: r.nome_ristorante, city: r.citta, compatibility, distance: dist, distanceLabel };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [restaurants, userLocation, allergie, ingredientiEsclusi]);

  const go = (c?: string) => {
    const target = (c ?? code).trim();
    if (target.length >= 4) router.push(`/menu/${target}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Benvenuto + sottoprofili */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>{t('hello_user')} {firstName}</Text>
          <Text style={styles.headline}>{t('where_eating')}</Text>

          {token && subProfiles.length > 0 && (
            <View style={styles.profileRow}>
              {[{ id: null, name: isIt ? 'Io' : 'Me' }, ...subProfiles].map((p) => {
                const isActive = (activeProfileId === null && p.id === null) || activeProfileId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id ?? '__self'}
                    style={[styles.profileChip, isActive && styles.profileChipActive]}
                    onPress={() => setActiveProfileId(p.id)}
                  >
                    <Text style={[styles.profileChipText, isActive && styles.profileChipTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.profileChipAdd} onPress={() => router.push('/sub-profiles')}>
                <Text style={styles.profileChipAddText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Blocco unico: trova ristorante */}
        <View style={styles.findCard}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scanner')} activeOpacity={0.9}>
            <View style={styles.scanIconWrap}>
              <Text style={styles.scanIcon}>📷</Text>
            </View>
            <View style={styles.scanTextWrap}>
              <Text style={styles.scanLabel}>{t('scan_qr_btn')}</Text>
              <Text style={styles.scanSub}>{t('fastest_way')}</Text>
            </View>
            <Text style={styles.scanArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or_separator')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.codeRow}>
            <TextInput
              style={styles.codeInput}
              placeholder={t('code_input_placeholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              onSubmitEditing={() => go()}
              returnKeyType="go"
            />
            <TouchableOpacity
              style={[styles.codeGo, code.trim().length < 4 && styles.codeGoDisabled]}
              disabled={code.trim().length < 4}
              onPress={() => go()}
            >
              <Text style={styles.codeGoText}>{t('go_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stato profilo allergie */}
        {hasAllergie ? (
          <TouchableOpacity style={styles.statusOk} onPress={() => router.push('/allergie')} activeOpacity={0.85}>
            <Text style={styles.statusDot}>🛡</Text>
            <Text style={styles.statusOkText}>
              {allergie.length} {allergie.length === 1 ? t('profile_active_desc_one') : t('profile_active_desc_many')}
            </Text>
            <Text style={styles.statusEdit}>{t('edit')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.statusWarn} onPress={() => router.push('/allergie')} activeOpacity={0.85}>
            <Text style={styles.statusDot}>⚠️</Text>
            <Text style={styles.statusWarnText}>{t('set_allergies_warn_desc')}</Text>
            <Text style={styles.statusSet}>{t('set_btn')}</Text>
          </TouchableOpacity>
        )}

        {/* Ultimo visitato */}
        {recents.length > 0 && (
          <TouchableOpacity style={styles.recentCard} onPress={() => go(recents[0].code)} activeOpacity={0.85}>
            <View style={styles.recentIcon}><Text style={styles.recentIconText}>🍽</Text></View>
            <View style={styles.recentTextWrap}>
              <Text style={styles.recentLabel}>{isIt ? 'Riprendi' : 'Resume'}</Text>
              <Text style={styles.recentName}>{recents[0].name}</Text>
            </View>
            <Text style={styles.recentCode}>#{recents[0].code}</Text>
            <Text style={styles.recentArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Locali vicini */}
        <View style={styles.nearbySection}>
          <View style={styles.nearbyHead}>
            <Text style={styles.nearbyTitle}>{t('nearby_restaurants_title')}</Text>
            {locationStatus === 'granted' && nearbyRestaurants.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/locali')}>
                <Text style={styles.nearbyMore}>{isIt ? 'Mappa' : 'Map'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingRestaurants ? (
            <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} />
          ) : locationStatus === 'granted' ? (
            nearbyRestaurants.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyText}>{t('no_nearby_restaurants_desc')}</Text>
              </View>
            ) : (
              <View style={styles.nearbyList}>
                {nearbyRestaurants.map((item) => (
                  <RestaurantCard
                    key={item.code}
                    code={item.code}
                    name={item.name}
                    city={item.city}
                    compatibility={item.compatibility}
                    isFavorite={isFavorite(item.code)}
                    onToggleFavorite={() => onToggle(item.code, item.name)}
                    distanceLabel={item.distanceLabel}
                  />
                ))}
              </View>
            )
          ) : locationStatus === 'denied' || locationStatus === 'error' ? (
            <TouchableOpacity style={styles.locationPrompt} onPress={requestLocation} activeOpacity={0.9}>
              <Text style={styles.locationPromptEmoji}>📍</Text>
              <Text style={styles.locationPromptText}>{t('location_disabled_desc')}</Text>
              <Text style={styles.locationPromptAction}>{t('enable_btn')}</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 48 },

  /* Hero */
  hero: { marginBottom: spacing.lg },
  greeting: { ...typography.caption, color: colors.brandDark, marginBottom: 2 },
  headline: { ...typography.h1, color: colors.ink, marginBottom: spacing.sm },

  /* Profilo switcher */
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  profileChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  profileChipActive: { borderColor: colors.brand, backgroundColor: colors.brand50 },
  profileChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  profileChipTextActive: { color: colors.brandDark },
  profileChipAdd: {
    width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  profileChipAddText: { fontSize: 16, fontWeight: '700', color: colors.textMuted, lineHeight: 18 },

  /* Carta unica find */
  findCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.brand, borderRadius: radius.md, padding: spacing.lg,
  },
  scanIconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  scanIcon: { fontSize: 22 },
  scanLabel: { color: colors.white, fontWeight: '800', fontSize: 16 },
  scanSub: { color: colors.brand100, fontSize: 11, marginTop: 1, fontWeight: '600' },
  scanTextWrap: { flex: 1 },
  scanArrow: { color: colors.white, fontSize: 26, fontWeight: '300', opacity: 0.8 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },

  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeInput: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 48, fontSize: 17,
    letterSpacing: 3, color: colors.ink, fontWeight: '700',
  },
  codeGo: {
    width: 64, height: 48, borderRadius: radius.md, backgroundColor: colors.brandDark,
    alignItems: 'center', justifyContent: 'center',
  },
  codeGoDisabled: { backgroundColor: colors.borderStrong },
  codeGoText: { color: colors.white, fontWeight: '800', fontSize: 14 },

  /* Stato allergie */
  statusOk: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.greenBg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.greenBorder,
  },
  statusWarn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.amberBg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.amberBorder,
  },
  statusDot: { fontSize: 18 },
  statusOkText: { flex: 1, color: colors.greenText, fontSize: 13, fontWeight: '600' },
  statusWarnText: { flex: 1, color: colors.amberText, fontSize: 13, fontWeight: '600' },
  statusEdit: { color: colors.brandDark, fontWeight: '800', fontSize: 12 },
  statusSet: { color: colors.amberText, fontWeight: '800', fontSize: 12 },

  /* Recent */
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm,
  },
  recentIcon: {
    width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.brand50,
    alignItems: 'center', justifyContent: 'center',
  },
  recentIconText: { fontSize: 18 },
  recentTextWrap: { flex: 1 },
  recentLabel: { ...typography.label, color: colors.textMuted },
  recentName: { color: colors.ink, fontWeight: '700', fontSize: 14, marginTop: 1 },
  recentCode: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  recentArrow: { color: colors.textMuted, fontSize: 22, fontWeight: '300' },

  /* Locali vicini */
  nearbySection: { marginTop: spacing.xl },
  nearbyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  nearbyTitle: { ...typography.h2, color: colors.ink },
  nearbyMore: { color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  nearbyList: { gap: spacing.xs },

  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyEmoji: { fontSize: 22 },
  emptyText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

  locationPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  locationPromptEmoji: { fontSize: 22 },
  locationPromptText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  locationPromptAction: { color: colors.brandDark, fontWeight: '800', fontSize: 13 },
});