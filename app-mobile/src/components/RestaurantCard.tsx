/**
 * RestaurantCard — foto stondata + cutout semaforo + gradiente sfumato verso il basso sul testo.
 * Il colore del semaforo sfuma fluidamente sia nello scavo sia verso il basso nella parte delle scritte.
 */
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { compatibilitaColor, type CompatibilitaResult } from '../engine/compatibility';
import { API } from '../api/client';
import { colors, font, softShadow, spacing, WIREFRAME_MODE } from '../theme';
import { wireBox } from '../wireframe';
import { CutoutOverlay } from './ui';
import { useSession } from '../store/session';

const FALLBACK =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';

const PHOTO_RADIUS = 18;

type Outline = 'white' | 'none' | 'glass';

export interface RestaurantCardProps {
  code: string;
  name: string;
  city?: string | null;
  imageUrl?: string | null;
  images?: string[];
  compatibility: CompatibilitaResult | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  compact?: boolean;
  outline?: Outline;
  distanceLabel?: string | null;
  deliveryTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  boostActive?: boolean;
  menuAvailable?: boolean;
  horizontalScroll?: boolean;
  grid?: boolean;
  square?: boolean;
  offerText?: string | null;
  topBadgeText?: string | null;
  safetyTag?: string | null;
  allergyTags?: string[];
  adBadge?: boolean;
  appBgColor?: string;
  onHide?: () => void;
}

function resolveImage(url?: string | null): string {
  if (!url) return FALLBACK;
  if (url.startsWith('http')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Palette testo semaforo ad alto contrasto e massima leggibilità */
function compatPalette(hasMenu: boolean, dominant: 'verde' | 'giallo' | 'rosso' | null) {
  if (!hasMenu || !dominant) {
    return {
      dot: '#948E9C',
      text: '#475569',
    };
  }
  if (dominant === 'verde') {
    return {
      dot: '#16A34A',
      text: '#15803D',
    };
  }
  if (dominant === 'giallo') {
    return {
      dot: '#EAB308',
      text: '#B45309',
    };
  }
  return {
    dot: '#EF4444',
    text: '#B91C1C',
  };
}

function getRatingBgColor(avg: number): string {
  if (avg >= 4.0) return '#16a34a';
  if (avg >= 3.0) return '#eab308';
  return '#ef4444';
}

export default React.memo(function RestaurantCard({
  code,
  name,
  city,
  imageUrl,
  images,
  compatibility,
  ratingAvg,
  ratingCount,
  isFavorite,
  onToggleFavorite,
  compact = false,
  outline = 'none',
  distanceLabel,
  deliveryTime,
  boostActive = false,
  menuAvailable,
  horizontalScroll = false,
  grid = false,
  square = false,
  offerText,
  topBadgeText,
  safetyTag,
  allergyTags,
  adBadge,
  appBgColor,
  onHide,
}: RestaurantCardProps) {
  const language = useSession((s) => s.language);
  const isIt = (language || 'it').toLowerCase().startsWith('it');

  const isWhiteCard = outline === 'white';
  const cardBg = isWhiteCard ? '#FFFFFF' : (appBgColor || colors.surface || '#F6F2FC');

  const hasMenu =
    menuAvailable !== false &&
    compatibility !== null &&
    compatibility.totaleDishes > 0;
  const pct = compatibility?.percentuale ?? 0;
  const dominant = hasMenu ? compatibilitaColor(pct) : null;
  const verdictLabel = hasMenu ? `${pct}%` : 'N/D';
  const palette = compatPalette(hasMenu, dominant);
  const hasRating = ratingAvg != null && ratingAvg > 0;
  const ratingValue = hasRating ? ratingAvg!.toFixed(1) : null;
  const small = horizontalScroll || grid || compact;

  if (WIREFRAME_MODE) {
    return (
      <Pressable style={[wireBox(), styles.wfCard]} onPress={() => router.push(`/menu/${code}`)}>
        <Text style={styles.wfTitle}>{name}</Text>
      </Pressable>
    );
  }

  const reviewsLabel =
    ratingCount && ratingCount > 0
      ? isIt
        ? `${ratingCount} recensioni`
        : `${ratingCount} reviews`
      : null;

  const uri = resolveImage(imageUrl);

  const displaySafetyTag = safetyTag || (allergyTags && allergyTags.length > 0 ? allergyTags[0] : null);

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/menu/${code}`);
  };

  const toggleFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleFavorite();
  };

  return (
    <Pressable
      onPress={openMenu}
      accessibilityRole="button"
      accessibilityLabel={`${name}${city ? `, ${city}` : ''}, ${verdictLabel}`}
      style={({ pressed }) => [
        styles.card,
        horizontalScroll && styles.cardHorizontalScroll,
        grid && styles.cardGrid,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: cardBg },
          isWhiteCard && styles.cardContainerWhite,
          square && styles.cardContainerSquare,
        ]}
      >
        {/* FOTO & CUTOUT COMPATTO */}
        <View
          style={[
            styles.imageContainer,
            compact && !grid && !square && styles.imageContainerCompact,
            horizontalScroll && !square && styles.imageContainerHorizontal,
            grid && !square && styles.imageContainerGrid,
            square && styles.imageContainerInSquareCard,
          ]}
        >
          <View style={styles.imageShell}>
            <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />

            {/* Top Left Badge */}
            {(topBadgeText || (boostActive && !small)) ? (
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>
                  {topBadgeText || (isIt ? 'IN EVIDENZA' : 'FEATURED')}
                </Text>
              </View>
            ) : null}

            {/* Top Right Actions (Cuore preferiti) */}
            <View style={styles.topRightActions}>
              {onHide ? (
                <Pressable
                  onPress={onHide}
                  style={styles.actionButton}
                  hitSlop={6}
                >
                  <Ionicons name="eye-off-outline" size={14} color="#FFFFFF" />
                </Pressable>
              ) : null}

              <Pressable
                onPress={toggleFav}
                style={[styles.actionButton, styles.favoriteButton]}
                hitSlop={6}
                accessibilityLabel="Preferito"
              >
                <Ionicons
                  name="heart-outline"
                  size={small ? 15 : 17}
                  color={isFavorite ? '#FF5252' : '#FFFFFF'}
                />
              </Pressable>
            </View>

            <View style={[styles.cutoutWrapper, small && styles.cutoutWrapperSmall]} pointerEvents="none">
              <CutoutOverlay
                color={cardBg}
                width={small ? 92 : 106}
                height={small ? 32 : 38}
              />
              <View
                style={[styles.cutoutTextWrapper, small && styles.cutoutTextWrapperSmall]}
                accessibilityLabel={hasMenu ? `${pct}% idoneità` : 'Dati non disponibili'}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.compatPct, small && styles.compatPctSmall, { color: palette.text }]}
                >
                  {verdictLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* DETTAGLI TIPOGRAFICI PULITI SOTTO LA FOTO */}
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: cardBg },
            small && styles.infoContainerSmall,
            square && styles.infoContainerSquare,
            isWhiteCard && styles.infoContainerWhite,
          ]}
        >
          {/* Nome Locale (fino a 2 righe per massima leggibilità senza troncamenti) */}
          <Text
            style={[
              styles.name,
              small && styles.nameSmall,
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>

          {/* Rating & Recensioni (Stelle a destra, recensioni a sinistra) */}
          {(hasRating || reviewsLabel || deliveryTime) ? (
            <View style={styles.metaRow}>
              {reviewsLabel || deliveryTime ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {[deliveryTime, reviewsLabel].filter(Boolean).join(' • ')}
                </Text>
              ) : <View />}

              {hasRating && ratingAvg != null ? (
                <View style={styles.ratingInline}>
                  <Ionicons name="star-outline" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{ratingValue}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Offerta o Tag Sicurezza Minimale */}
          {offerText ? (
            <View style={styles.offerTag}>
              <Ionicons name="pricetag-outline" size={10} color="#2563EB" />
              <Text style={styles.offerTagText} numberOfLines={1}>
                {offerText}
              </Text>
            </View>
          ) : displaySafetyTag ? (
            <View style={styles.safetyTag}>
              <Ionicons name="shield-checkmark-outline" size={10} color="#059669" />
              <Text style={styles.safetyTagText} numberOfLines={1}>
                {displaySafetyTag}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wfCard: { padding: spacing.md, marginBottom: spacing.sm },
  wfTitle: { fontSize: 14, fontWeight: '700', color: '#000' },

  card: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: 'transparent',
  },
  cardHorizontalScroll: {
    width: 160,
    alignSelf: 'auto',
  },
  cardGrid: {
    width: '100%',
    alignSelf: 'stretch',
  },
  pressed: { opacity: 0.94 },

  cardContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: PHOTO_RADIUS,
    overflow: 'hidden',
    ...softShadow(4),
  },
  cardContainerSquare: {
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  cardContainerWhite: {
    borderRadius: PHOTO_RADIUS,
    paddingBottom: 10,
    ...softShadow(6),
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 10,
  },
  imageContainerInSquareCard: {
    width: '100%',
    flex: 1,
    height: '62%',
    aspectRatio: undefined,
  },
  imageContainerCompact: {
    aspectRatio: 16 / 11,
  },
  imageContainerHorizontal: {
    aspectRatio: 4 / 3,
  },
  imageContainerGrid: {
    aspectRatio: 1,
  },
  imageShell: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  topBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  topBadgeText: {
    fontFamily: font.displayBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  topRightActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {},

  cutoutWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 106,
    height: 38,
  },
  cutoutWrapperSmall: {
    width: 92,
    height: 32,
  },

  cutoutTextWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 8,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutoutTextWrapperSmall: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatPct: {
    fontFamily: font.displayBold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.4,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  compatPctSmall: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.3,
  },

  infoContainer: {
    paddingTop: 7,
    paddingHorizontal: 6,
    paddingBottom: 4,
    gap: 2,
  },
  infoContainerSmall: {
    paddingTop: 5,
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 2,
  },
  infoContainerSquare: {
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 8,
    gap: 2,
  },
  infoContainerWhite: {
    paddingHorizontal: 10,
  },

  name: {
    fontFamily: font.displayBold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.3,
    color: colors.brandInk,
    fontWeight: '800',
  },
  nameSmall: {
    fontSize: 13.5,
    lineHeight: 17,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    lineHeight: 15,
    color: colors.brandInk,
    fontWeight: '800',
  },
  metaDot: {
    fontSize: 11,
    color: colors.textSecondary,
    marginHorizontal: 1,
  },
  meta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontFamily: font.semibold,
    fontWeight: '600',
  },

  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  offerTagText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },

  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  safetyTagText: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
});
