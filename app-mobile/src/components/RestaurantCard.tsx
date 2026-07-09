/**
 * RestaurantCard — Card premium con indicatore circolare di compatibilità %,
 * rating, preferiti animati e badge semaforo.
 * Usa un approccio View-based per l'anello (senza dipendenze SVG).
 */
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Linking, Platform } from 'react-native';
import { compatibilitaColor, type CompatibilitaResult } from '../engine/compatibility';
import { colors, radius, shadow, spacing, typography } from '../theme';

interface Props {
  code: string;
  name: string;
  city?: string | null;
  imageUrl?: string | null;
  compatibility: CompatibilitaResult | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  compact?: boolean;
  distanceLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const RING_SIZE = 62;

/** Semicerchio destro o sinistro (per comporre l'anello animato) */
function HalfRing({
  color,
  rotation,
}: {
  color: string;
  rotation: string;
}) {
  return (
    <View style={[halfRingStyles.wrap, { transform: [{ rotate: rotation }] }]}>
      <View
        style={[
          halfRingStyles.arc,
          { borderColor: color, borderRightColor: 'transparent', borderBottomColor: 'transparent' },
        ]}
      />
    </View>
  );
}

const halfRingStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  arc: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4.5,
  },
});

export default function RestaurantCard({
  code,
  name,
  city,
  compatibility,
  ratingAvg,
  ratingCount,
  isFavorite,
  onToggleFavorite,
  compact = false,
  distanceLabel,
  latitude,
  longitude,
}: Props) {
  const pct = compatibility?.percentuale ?? 0;
  const hasMenu = compatibility !== null && compatibility.totaleDishes > 0;
  const dominantColor = hasMenu ? compatibilitaColor(pct) : ('grigio' as const);
  const favScale = useRef(new Animated.Value(1)).current;

  const animateFav = () => {
    Animated.sequence([
      Animated.timing(favScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(favScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onToggleFavorite();
  };

  const ringColor = dominantColor === 'verde' ? colors.green
    : dominantColor === 'giallo' ? colors.amber
    : dominantColor === 'rosso' ? colors.red
    : colors.textMuted;

  const ringBg = dominantColor === 'verde' ? colors.greenBg
    : dominantColor === 'giallo' ? colors.amberBg
    : dominantColor === 'rosso' ? colors.redBg
    : colors.surfaceAlt;

  const statusLabel = dominantColor === 'verde' ? 'Sicuro'
    : dominantColor === 'giallo' ? 'Attenzione'
    : dominantColor === 'rosso' ? 'A rischio'
    : 'N/D';

  const statusBadgeBg = dominantColor === 'verde' ? colors.greenBg
    : dominantColor === 'giallo' ? colors.amberBg
    : dominantColor === 'rosso' ? colors.redBg
    : colors.surfaceAlt;

  const statusBadgeBorder = dominantColor === 'verde' ? colors.greenBorder
    : dominantColor === 'giallo' ? colors.amberBorder
    : dominantColor === 'rosso' ? colors.redBorder
    : colors.border;

  const statusBadgeText = dominantColor === 'verde' ? colors.greenText
    : dominantColor === 'giallo' ? colors.amberText
    : dominantColor === 'rosso' ? colors.redText
    : colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => router.push(`/menu/${code}`)}
      activeOpacity={0.85}
    >
      {/* Indicatore circolare compatibilità */}
      <View style={[styles.ringOuter, { backgroundColor: ringBg }]}>
        {/* Track di sfondo */}
        <View style={[styles.ringTrack, { borderColor: statusBadgeBorder }]} />
        {/* Archi di progresso — ruotati proporzionalmente alla % */}
        {hasMenu && pct > 0 && (
          <>
            <HalfRing color={ringColor} rotation="-135deg" />
            {pct > 25 && <HalfRing color={ringColor} rotation="-45deg" />}
            {pct > 50 && <HalfRing color={ringColor} rotation="45deg" />}
            {pct > 75 && <HalfRing color={ringColor} rotation="135deg" />}
          </>
        )}
        {/* Centro con percentuale */}
        <View style={[styles.ringInner, { backgroundColor: ringBg }]}>
          {hasMenu ? (
            <Text style={[styles.ringPct, { color: ringColor }]}>{pct}%</Text>
          ) : (
            <Text style={styles.ringNA}>—</Text>
          )}
        </View>
      </View>

      {/* Info ristorante */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {city ? `${city} · ` : ''}{distanceLabel ? `${distanceLabel} · ` : ''}#{code}
        </Text>

        {/* Badge semaforo + conteggio piatti */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: statusBadgeBg, borderColor: statusBadgeBorder }]}>
            <Text style={[styles.badgeText, { color: statusBadgeText }]}>{statusLabel}</Text>
          </View>
          {hasMenu && (
            <Text style={styles.dishCounts}>
              🟢{compatibility!.verde} · 🟡{compatibility!.giallo} · 🔴{compatibility!.rosso}
            </Text>
          )}
        </View>

        {/* Rating & Naviga */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 }}>
          {ratingAvg != null && ratingCount != null && ratingCount > 0 ? (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({ratingCount})</Text>
            </View>
          ) : null}
          
          {latitude && longitude ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
                const latLng = `${latitude},${longitude}`;
                const label = name;
                const url = Platform.select({
                  ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
                  android: `${scheme}${latLng}(${encodeURIComponent(label)})`
                });
                if (url) {
                  Linking.openURL(url).catch(() => {});
                }
              }}
              style={styles.navBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnText}>🗺️ Naviga</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Bottone preferito con animazione bounce */}
      <Animated.View style={{ transform: [{ scale: favScale }] }}>
        <TouchableOpacity
          onPress={animateFav}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.favBtn}
        >
          <Text style={styles.favEmoji}>{isFavorite ? '⭐️' : '☆'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardCompact: {
    padding: spacing.md,
  },

  // Anello
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4.5,
    opacity: 0.25,
  },
  ringInner: {
    width: RING_SIZE - 12,
    height: RING_SIZE - 12,
    borderRadius: (RING_SIZE - 12) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ringPct: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ringNA: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMuted,
  },

  // Info
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.h3,
    color: colors.ink,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dishCounts: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingStar: {
    fontSize: 12,
    color: '#f59e0b',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  ratingCount: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandDark,
  },

  // Preferito
  favBtn: {
    paddingLeft: spacing.xs,
  },
  favEmoji: {
    fontSize: 24,
  },
});
