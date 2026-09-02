import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveApiMediaUrl } from '../../api/client';
import type { RestaurantPhoto } from '../../types';
import { SCREEN_PADDING_H } from '../../layoutConstants';
import { colors, font, radius } from '../../theme';
import { GlassIconButton } from './GlassIconButton';
import { SemaforoFilterBar, type SemaforoFilterKind } from './SemaforoFilterBar';
import { VenuePhotoLightbox } from './VenuePhotoLightbox';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
const CHROME_BTN = 44;
const GALLERY_GAP = 10;
const GALLERY_PAD = 12;
const TILE_RADIUS = 22;
const MOSAIC_H = 228;
/** Spazio minimo sopra le foto — sotto back/indietro */
const VENUE_GRADIENT_HEAD = 52;
const MOSAIC_CHUNK = 3;
const BIG_FRAC = 0.58;
const SMALL_FRAC = 0.28;

function chunkPhotos(uris: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < uris.length; i += size) {
    chunks.push(uris.slice(i, i + size));
  }
  return chunks;
}

function MosaicTile({
  uri,
  onPress,
  label,
  style,
  children,
}: {
  uri: string;
  onPress: () => void;
  label: string;
  style?: object;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      style={[styles.mosaicTile, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Image source={{ uri }} style={styles.mosaicImage} resizeMode="cover" />
      {children}
    </Pressable>
  );
}

function MosaicModule({
  chunk,
  baseIndex,
  bigW,
  smallW,
  moduleH,
  language,
  onOpen,
}: {
  chunk: string[];
  baseIndex: number;
  bigW: number;
  smallW: number;
  moduleH: number;
  language: string;
  onOpen: (index: number) => void;
}) {
  const isIt = language.toLowerCase().startsWith('it');

  return (
    <View style={[styles.mosaicModule, { height: moduleH, gap: GALLERY_GAP }]}>
      <MosaicTile
        uri={chunk[0]}
        onPress={() => onOpen(baseIndex)}
        label={isIt ? `Foto ${baseIndex + 1}` : `Photo ${baseIndex + 1}`}
        style={{ width: bigW, height: moduleH }}
      />

      {chunk.length > 1 ? (
        <View style={[styles.mosaicStack, { width: smallW, height: moduleH, gap: GALLERY_GAP }]}>
          <MosaicTile
            uri={chunk[1]}
            onPress={() => onOpen(baseIndex + 1)}
            label={isIt ? `Foto ${baseIndex + 2}` : `Photo ${baseIndex + 2}`}
            style={chunk.length === 2
              ? { width: smallW, height: moduleH }
              : { width: smallW, height: (moduleH - GALLERY_GAP) / 2 }}
          />

          {chunk.length > 2 ? (
            <MosaicTile
              uri={chunk[2]}
              onPress={() => onOpen(baseIndex + 2)}
              label={isIt ? `Foto ${baseIndex + 3}` : `Photo ${baseIndex + 3}`}
              style={{ width: smallW, height: (moduleH - GALLERY_GAP) / 2 }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type CategoryTab = { nome: string; count?: number };

type Props = {
  name: string;
  city?: string | null;
  imageUrl?: string | null;
  photos?: RestaurantPhoto[];
  /** False = non mostrare filtri semaforo. */
  menuAvailable?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenMaps?: (() => void) | null;
  language: string;
  showMenuControls?: boolean;
  showFilters?: boolean;
  allergiesEmpty?: boolean;
  onSetAllergies?: () => void;
  filtro: SemaforoFilterKind;
  onFiltroChange: (f: SemaforoFilterKind) => void;
  counts: { verde: number; giallo: number; rosso: number };
  menuTabs?: { id: number; name: string }[];
  activeMenuId?: number | null;
  onMenuChange?: (id: number) => void;
  /** Categorie piatto (Tutte / Antipasti…) — in alto sotto la foto */
  categories?: CategoryTab[];
  selectedCategory?: string;
  onCategoryChange?: (nome: string) => void;
  backHint?: boolean;
  onPressTitle?: () => void;
};

/** Hero locale: galleria stile TheFork + categorie + filtri semaforo. */
export function VenueHero({
  name,
  city,
  imageUrl,
  photos = [],
  menuAvailable = true,
  isFavorite,
  onToggleFavorite,
  onOpenMaps,
  language,
  showMenuControls = true,
  showFilters: showFiltersProp = true,
  allergiesEmpty = false,
  onSetAllergies,
  filtro,
  onFiltroChange,
  counts,
  menuTabs,
  activeMenuId,
  onMenuChange,
  categories,
  selectedCategory = 'tutte',
  onCategoryChange,
  backHint = false,
  onPressTitle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isIt = (language || 'it').toLowerCase().startsWith('it');

  const uris = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (raw?: string | null) => {
      const resolved = resolveApiMediaUrl(raw);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        out.push(resolved);
      }
    };

    photos
      .slice()
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .forEach((p) => add(p.url));

    add(imageUrl);

    if (out.length === 0) out.push(FALLBACK_COVER);
    return out;
  }, [photos, imageUrl]);

  const contentW = winW - GALLERY_PAD * 2;
  const bigW = Math.round(contentW * BIG_FRAC);
  const smallW = Math.round(contentW * SMALL_FRAC);
  const mosaicChunks = useMemo(() => chunkPhotos(uris, MOSAIC_CHUNK), [uris]);
  const showMosaic = uris.length >= 2;
  const stripH = MOSAIC_H;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const photoStrip = showMosaic ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      style={{ height: stripH }}
      contentContainerStyle={[styles.mosaicScroll, { height: stripH }]}
    >
      {mosaicChunks.map((chunk, panelIndex) => {
        const baseIndex = panelIndex * MOSAIC_CHUNK;
        return (
          <MosaicModule
            key={`module-${baseIndex}`}
            chunk={chunk}
            baseIndex={baseIndex}
            bigW={bigW}
            smallW={smallW}
            moduleH={stripH}
            language={language || 'it'}
            onOpen={openLightbox}
          />
        );
      })}
    </ScrollView>
  ) : (
    <View style={[styles.singlePhotoFrame, { height: stripH }]}>
      <MosaicTile
        uri={uris[0]}
        onPress={() => openLightbox(0)}
        label={isIt ? 'Apri foto a schermo intero' : 'Open photo fullscreen'}
        style={{ width: '100%', height: stripH }}
      />
    </View>
  );

  const showFilters = showMenuControls && menuAvailable && showFiltersProp;
  const showCategories = showMenuControls
    && !!onCategoryChange
    && !!categories
    && categories.length > 1;

  return (
    <View style={styles.root}>
      {/* Foto + titolo sopra AmbientMesh (scroll trasparente) — niente sfondo opaco */}
      <View style={styles.hero}>
        <View
          style={[styles.chromeHeader, { paddingTop: insets.top + 4 }]}
          pointerEvents="box-none"
        >
          <View style={styles.chromeRow}>
            {backHint ? (
              <TouchableOpacity
                style={styles.backHintTop}
                onPress={onPressTitle}
                disabled={!onPressTitle}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isIt ? 'Torna al menù' : 'Back to menu'}
              >
                <Text style={styles.backHintTopText}>
                  {isIt ? '← Torna al menù' : '← Back to menu'}
                </Text>
              </TouchableOpacity>
            ) : (
              <GlassIconButton
                variant="solid"
                size={CHROME_BTN}
                icon="chevron-back"
                onPress={() => router.back()}
                accessibilityLabel={isIt ? 'Indietro' : 'Back'}
              />
            )}
            {onToggleFavorite ? (
              <GlassIconButton
                variant="solid"
                size={CHROME_BTN}
                icon={isFavorite ? 'heart' : 'heart-outline'}
                iconColor={isFavorite ? '#FF3B30' : colors.brandInk}
                isFavorite={isFavorite}
                onPress={onToggleFavorite}
                accessibilityLabel={isIt ? 'Preferito' : 'Favorite'}
              />
            ) : null}
          </View>
        </View>

        <View style={[styles.photoGallery, { marginTop: insets.top + VENUE_GRADIENT_HEAD }]}>
          <View style={[styles.photoStrip, { height: stripH }]}>
            {photoStrip}
          </View>
        </View>

        <View style={styles.nameBlock}>
          <TouchableOpacity
            onPress={onPressTitle}
            activeOpacity={onPressTitle ? 0.85 : 1}
            disabled={!onPressTitle}
          >
            <Text style={styles.nameOnMedia} numberOfLines={2}>{name}</Text>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            {city ? (
              <TouchableOpacity
                style={styles.metaItemOnMedia}
                onPress={onOpenMaps ?? undefined}
                activeOpacity={onOpenMaps ? 0.85 : 1}
                disabled={!onOpenMaps}
                accessibilityRole={onOpenMaps ? 'button' : undefined}
                accessibilityLabel={
                  onOpenMaps
                    ? (isIt ? `Apri ${city} in Maps` : `Open ${city} in Maps`)
                    : undefined
                }
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#FFFFFF"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.metaTextOnMedia} numberOfLines={1}>{city}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

        </View>

        <View style={styles.belowMedia}>
        {showCategories ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
            style={styles.categoryBlock}
          >
            <TouchableOpacity
              onPress={() => onCategoryChange!('tutte')}
              style={[styles.categoryTab, selectedCategory === 'tutte' && styles.categoryTabOn]}
              activeOpacity={0.88}
            >
              <Text style={[styles.categoryTabText, selectedCategory === 'tutte' && styles.categoryTabTextOn]}>
                {isIt ? 'Tutte' : 'All'}
              </Text>
            </TouchableOpacity>
            {categories!.map((c) => {
              const active = selectedCategory === c.nome;
              return (
                <TouchableOpacity
                  key={c.nome}
                  onPress={() => onCategoryChange!(c.nome)}
                  style={[styles.categoryTab, active && styles.categoryTabOn]}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.categoryTabText, active && styles.categoryTabTextOn]}>
                    {c.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {showMenuControls && allergiesEmpty && onSetAllergies ? (
          <TouchableOpacity style={styles.allergyWarn} onPress={onSetAllergies} activeOpacity={0.9}>
            <Ionicons name="warning-outline" size={16} color={colors.amberText} />
            <Text style={styles.allergyWarnText} numberOfLines={2}>
              {isIt ? 'Imposta le allergie per un semaforo personale' : 'Set allergies for a personal traffic light'}
            </Text>
            <Text style={styles.allergyWarnAction}>{isIt ? 'Imposta' : 'Set'}</Text>
          </TouchableOpacity>
        ) : null}

        {showMenuControls && menuAvailable && menuTabs && menuTabs.length > 1 && onMenuChange ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuTabs}
            style={styles.menuTabsBlock}
          >
            {menuTabs.map((m) => {
              const active = activeMenuId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => onMenuChange(m.id)}
                  style={[styles.menuTab, active && styles.menuTabOn]}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.menuTabText, active && styles.menuTabTextOn]}>{m.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {showFilters ? (
          <SemaforoFilterBar
            filtro={filtro}
            onFiltroChange={onFiltroChange}
            counts={counts}
            language={language}
          />
        ) : null}
        </View>
      </View>

      <VenuePhotoLightbox
        visible={lightboxOpen}
        uris={uris}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    marginHorizontal: -SCREEN_PADDING_H,
  },
  hero: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  photoGallery: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  chromeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingBottom: 10,
  },
  chromeRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backHintTop: {
    minHeight: CHROME_BTN,
    paddingHorizontal: 16,
    borderRadius: CHROME_BTN / 2,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E143A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  backHintTopText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandInk,
  },
  photoStrip: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  nameBlock: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 6,
    backgroundColor: 'transparent',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaSpacer: {
    flex: 1,
  },
  mosaicScroll: {
    flexDirection: 'row',
    gap: GALLERY_GAP,
    paddingHorizontal: GALLERY_PAD,
  },
  mosaicModule: {
    flexDirection: 'row',
  },
  mosaicTile: {
    overflow: 'hidden',
    borderRadius: TILE_RADIUS,
    backgroundColor: colors.surfaceTertiary,
  },
  mosaicStack: {
    flexDirection: 'column',
  },
  mosaicImage: {
    width: '100%',
    height: '100%',
  },
  singlePhotoFrame: {
    paddingHorizontal: GALLERY_PAD,
  },
  moreBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,10,36,0.58)',
  },
  moreBadgeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  belowMedia: {
    gap: 10,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  nameOnMedia: {
    fontFamily: font.displayBold,
    fontSize: 34,
    fontWeight: '800',
    color: colors.onSurface,
    lineHeight: 38,
    letterSpacing: -0.9,
  },
  metaItemOnMedia: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  cityPin: {
    width: 36,
    height: 36,
  },
  metaTextOnMedia: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 18,
    flexShrink: 1,
  },
  categoryBlock: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingBottom: 2,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabOn: {
    borderBottomColor: colors.brand,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
  },
  categoryTabTextOn: {
    fontWeight: '800',
    color: colors.brandInk,
  },
  allergyWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SCREEN_PADDING_H,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    alignSelf: 'stretch',
  },
  allergyWarnText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.amberText,
    lineHeight: 16,
  },
  allergyWarnAction: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.amberText,
  },
  menuTabsBlock: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  menuTabs: {
    gap: 8,
    paddingHorizontal: SCREEN_PADDING_H,
    justifyContent: 'center',
  },
  menuTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuTabOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  menuTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceMuted,
  },
  menuTabTextOn: {
    color: '#FFFFFF',
  },
});
