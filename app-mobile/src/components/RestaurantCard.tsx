/**
 * RestaurantCard — Card premium con indicatore circolare di compatibilità %,
 * rating, preferiti animati e badge semaforo.
 */
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { compatibilitaColor, type CompatibilitaResult } from '../engine/compatibility';
import { colors, font, radius, spacing, typography, WIREFRAME_MODE } from '../theme';
import { wireBox } from '../wireframe';
import { GlassCard } from './ui/GlassCard';
import { StatoVerdictPill } from './ui/Traffic';

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
  boostActive?: boolean;
}

function CompatibilityRing({
  percentage,
  color,
  trackColor,
  hasMenu,
  compact,
}: {
  percentage: number;
  color: string;
  trackColor: string;
  hasMenu: boolean;
  compact: boolean;
}) {
  const size = compact ? 62 : 70;
  const strokeWidth = compact ? 5 : 6;
  const circleRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * circleRadius;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const dashOffset = circumference * (1 - normalizedPercentage / 100);

  return (
    <View
      style={[styles.ringWrap, { width: size, height: size, backgroundColor: trackColor }]}
      accessibilityLabel={hasMenu ? `Compatibilità ${normalizedPercentage} percento` : 'Compatibilità non disponibile'}
    >
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={circleRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {hasMenu ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={circleRadius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter}>
        <View style={styles.percentageRow}>
          <Text
            style={[
              styles.percentageValue,
              compact && styles.percentageValueCompact,
              { color: hasMenu ? color : colors.textMuted },
            ]}
          >
            {hasMenu ? normalizedPercentage : '—'}
          </Text>
          {hasMenu ? <Text style={[styles.percentageSymbol, { color }]}>%</Text> : null}
        </View>
        <Text style={styles.percentageLabel}>{hasMenu ? 'MATCH' : 'N/D'}</Text>
      </View>
    </View>
  );
}

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
  boostActive = false,
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

  const statusLabel = dominantColor === 'verde' ? 'Alta compatibilità'
    : dominantColor === 'giallo' ? 'Compatibilità parziale'
    : dominantColor === 'rosso' ? 'Bassa compatibilità'
    : 'Non calcolata';

  const cardTint = dominantColor === 'verde' ? 'green'
    : dominantColor === 'giallo' ? 'yellow'
    : dominantColor === 'rosso' ? 'red'
    : 'none';

  if (WIREFRAME_MODE) {
    return (
      <TouchableOpacity
        style={[wireBox(), styles.wfCard]}
        onPress={() => router.push(`/menu/${code}`)}
        activeOpacity={0.7}
      >
        <Text style={styles.wfTitle}>{name}</Text>
        <Text style={styles.wfMeta}>
          {city ? `${city} · ` : ''}#{code}
          {distanceLabel ? ` · ${distanceLabel}` : ''}
          {hasMenu ? ` · ${pct}%` : ''}
        </Text>
        <TouchableOpacity onPress={animateFav}>
          <Text style={styles.wfMeta}>{isFavorite ? '[★ fav]' : '[☆]'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  const openDirections = () => {
    if (!latitude || !longitude) return;
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${encodeURIComponent(name)}@${latLng}`,
      android: `${scheme}${latLng}(${encodeURIComponent(name)})`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/menu/${code}`)}
    >
      <GlassCard
        padded={false}
        tint={cardTint}
        accentColor={hasMenu ? ringColor : undefined}
        cardRadius={radius.lg}
        style={[styles.card, compact && styles.cardCompact]}
      >
      <View style={styles.cardInner}>
        <CompatibilityRing
          percentage={pct}
          color={ringColor}
          trackColor={ringBg}
          hasMenu={hasMenu}
          compact={compact}
        />

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {boostActive ? (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>✨ In evidenza</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.onSurfaceMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {[city, distanceLabel].filter(Boolean).join(' · ') || `Codice ${code}`}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <StatoVerdictPill
              stato={dominantColor}
              label={statusLabel}
              size="sm"
            />
            {hasMenu ? (
              <Text style={styles.menuMeta}>
                {compatibility!.totaleDishes} {compatibility!.totaleDishes === 1 ? 'piatto' : 'piatti'} analizzati
              </Text>
            ) : (
              <Text style={styles.menuMeta}>Menù non disponibile</Text>
            )}
            {ratingAvg != null && ratingCount != null && ratingCount > 0 ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {!compact && latitude && longitude ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                openDirections();
              }}
              style={styles.iconButton}
              hitSlop={8}
            >
              <Ionicons name="navigate" size={18} color={colors.onSurface} />
            </TouchableOpacity>
          ) : null}
          <Animated.View style={{ transform: [{ scale: favScale }] }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                animateFav();
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? colors.red : colors.onSurface}
              />
            </TouchableOpacity>
          </Animated.View>
          <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceMuted} />
        </View>
      </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wfCard: { padding: spacing.md, gap: 4, marginBottom: spacing.sm },
  wfTitle: { fontSize: 14, fontWeight: '700', color: '#000' },
  wfMeta: { fontSize: 12, color: '#444' },
  card: {
    marginBottom: spacing.sm,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  cardCompact: {
    paddingVertical: 0,
  },
  ringWrap: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ringSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  percentageValue: {
    fontFamily: font.displayBold,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  percentageValueCompact: {
    fontSize: 19,
    lineHeight: 21,
  },
  percentageSymbol: {
    fontFamily: font.bold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    marginLeft: 1,
  },
  percentageLabel: {
    fontFamily: font.bold,
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.onSurfaceMuted,
    marginTop: 1,
  },
  info: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.ink,
    flexShrink: 1,
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.onSurface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  meta: {
    color: colors.onSurfaceMuted,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  menuMeta: {
    fontSize: 10.5,
    color: colors.onSurfaceMuted,
    fontWeight: '600',
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  ratingStar: { fontSize: 11 },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  actions: {
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
