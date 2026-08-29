import React, { useEffect, useMemo } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, font, radius, spacing } from '../../theme';
import { CUISINE_OPTIONS, type CuisineCode } from '../../utils/cuisine';
import { AppText } from './AppText';
import { CompatPercentSlider } from './CompatPercentSlider';

const SHEET_H = Math.round(Dimensions.get('window').height * 0.86);

export type LocaliSortKey = 'compat' | 'distance' | 'name' | 'rating';
export type LocaliDistanceKey = 0 | 1 | 5 | 10;
export type VerifiedFilter = 'all' | 'yes' | 'no';

export type LocaliFilters = {
  minCompat: number;
  onlyMenu: boolean;
  onlyFavorites: boolean;
  verified: VerifiedFilter;
  cuisines: CuisineCode[];
  sortBy: LocaliSortKey;
  maxDistanceKm: LocaliDistanceKey;
};

export const DEFAULT_LOCALI_FILTERS: LocaliFilters = {
  minCompat: 0,
  onlyMenu: false,
  onlyFavorites: false,
  verified: 'all',
  cuisines: [],
  sortBy: 'compat',
  maxDistanceKm: 0,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  value: LocaliFilters;
  onChange: (next: LocaliFilters) => void;
  isIt?: boolean;
  hasAllergie?: boolean;
  hasLocation?: boolean;
  resultCount?: number;
  availableCuisines?: CuisineCode[];
};

const SORT_OPTS: { key: LocaliSortKey; it: string; en: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'compat', it: 'Compatibilità', en: 'Compatibility', icon: 'shield-checkmark-outline' },
  { key: 'distance', it: 'Distanza', en: 'Distance', icon: 'navigate-outline' },
  { key: 'name', it: 'Nome', en: 'Name', icon: 'text-outline' },
  { key: 'rating', it: 'Voto', en: 'Rating', icon: 'star-outline' },
];

const DIST_OPTS: { key: LocaliDistanceKey; it: string; en: string }[] = [
  { key: 0, it: 'Tutti', en: 'Any' },
  { key: 1, it: '1 km', en: '1 km' },
  { key: 5, it: '5 km', en: '5 km' },
  { key: 10, it: '10 km', en: '10 km' },
];

const VERIFIED_OPTS: { key: VerifiedFilter; it: string; en: string }[] = [
  { key: 'all', it: 'Tutti', en: 'All' },
  { key: 'yes', it: 'Verificato', en: 'Verified' },
  { key: 'no', it: 'Non verificato', en: 'Unverified' },
];

/** Sheet filtri — canvas calmo, sezioni editoriali, chrome minimo. */
export function LocaliFilterSheet({
  visible,
  onClose,
  value,
  onChange,
  isIt = true,
  hasAllergie = true,
  hasLocation = false,
  resultCount,
  availableCuisines,
}: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(false);
  const expand = useSharedValue(0);
  const panY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      panY.value = 0;
      expand.value = withSpring(1, { damping: 26, stiffness: 280, mass: 0.72 });
    } else if (mounted) {
      panY.value = 0;
      expand.value = withTiming(0, { duration: 170 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const cuisineList = useMemo(() => {
    if (!availableCuisines?.length) return CUISINE_OPTIONS;
    const preferred = new Set(availableCuisines);
    return [
      ...CUISINE_OPTIONS.filter((o) => preferred.has(o.code)),
      ...CUISINE_OPTIONS.filter((o) => !preferred.has(o.code)),
    ];
  }, [availableCuisines]);

  const activeCount = useMemo(() => countActiveFilters(value, hasAllergie), [value, hasAllergie]);

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const patch = (partial: Partial<LocaliFilters>) => {
    onChange({ ...value, ...partial });
  };

  const clearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange({ ...DEFAULT_LOCALI_FILTERS });
  };

  const toggleCuisine = (code: CuisineCode) => {
    Haptics.selectionAsync().catch(() => {});
    const next = value.cuisines.includes(code)
      ? value.cuisines.filter((c) => c !== code)
      : [...value.cuisines, code];
    patch({ cuisines: next });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) panY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 56 || e.velocityY > 650) {
        runOnJS(handleClose)();
      } else {
        panY.value = withSpring(0);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0, 1], [0, 0.38], Extrapolation.CLAMP),
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const lift = interpolate(expand.value, [0, 1], [40, 0], Extrapolation.CLAMP);
    return {
      opacity: interpolate(expand.value, [0, 0.15, 1], [0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: lift + Math.max(0, panY.value) }],
    };
  });

  if (!mounted) return null;

  const resultsLabel =
    resultCount == null
      ? null
      : resultCount === 1
        ? (isIt ? '1 locale' : '1 venue')
        : (isIt ? `${resultCount} locali` : `${resultCount} venues`);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.portal}>
        <View style={styles.portal} pointerEvents="box-none">
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_H },
              sheetStyle,
            ]}
          >
            <View style={[styles.sheetBody, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.dragZone}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <AppText style={styles.title}>
                  {isIt ? 'Filtri' : 'Filters'}
                </AppText>
                {activeCount > 0 ? (
                  <View style={styles.activeBadge}>
                    <AppText style={styles.activeBadgeText}>{activeCount}</AppText>
                  </View>
                ) : null}
              </View>
              {activeCount > 0 ? (
                <Pressable onPress={clearAll} hitSlop={10} accessibilityRole="button">
                  <AppText style={styles.clearLink}>
                    {isIt ? 'Azzera tutto' : 'Clear all'}
                  </AppText>
                </Pressable>
              ) : (
                <AppText style={styles.headerHint}>
                  {isIt ? 'Affina i risultati' : 'Refine results'}
                </AppText>
              )}
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={styles.scroll}
            >
              {/* Cucina — rail orizzontale */}
              <View style={styles.block}>
                <AppText style={styles.blockTitle}>
                  {isIt ? 'Cucina' : 'Cuisine'}
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cuisineRail}
                  decelerationRate="fast"
                >
                  {cuisineList.map((opt) => {
                    const active = value.cuisines.includes(opt.code);
                    return (
                      <Pressable
                        key={opt.code}
                        onPress={() => toggleCuisine(opt.code)}
                        style={[styles.cuisineChip, active && styles.cuisineChipOn]}
                      >
                        <AppText style={styles.cuisineEmoji}>{opt.emoji}</AppText>
                        <AppText style={[styles.cuisineLabel, active && styles.cuisineLabelOn]}>
                          {isIt ? opt.it : opt.en}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.rule} />

              {/* Affidabilità */}
              <View style={styles.block}>
                <AppText style={styles.blockTitle}>
                  {isIt ? 'Affidabilità' : 'Trust'}
                </AppText>
                <AppText style={styles.blockCaption}>
                  {isIt ? 'Menù verificato AllerTgy' : 'AllerTgy verified menu'}
                </AppText>
                <View style={styles.segment}>
                  {VERIFIED_OPTS.map((opt) => {
                    const active = value.verified === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          patch({ verified: opt.key });
                        }}
                        style={[styles.segmentItem, active && styles.segmentItemOn]}
                      >
                        <AppText style={[styles.segmentText, active && styles.segmentTextOn]}>
                          {isIt ? opt.it : opt.en}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.toggleList}>
                  <FilterToggle
                    title={isIt ? 'Menù allergeni' : 'Allergen menu'}
                    subtitle={isIt ? 'Solo dati pubblicati' : 'Published data only'}
                    value={value.onlyMenu}
                    onValueChange={(onlyMenu) => patch({ onlyMenu })}
                  />
                  <View style={styles.innerRule} />
                  <FilterToggle
                    title={isIt ? 'Preferiti' : 'Favorites'}
                    subtitle={isIt ? 'Locali salvati' : 'Saved venues'}
                    value={value.onlyFavorites}
                    onValueChange={(onlyFavorites) => patch({ onlyFavorites })}
                  />
                </View>
              </View>

              {hasAllergie ? (
                <>
                  <View style={styles.rule} />
                  <View style={styles.block}>
                    <AppText style={styles.blockTitle}>
                      {isIt ? 'Compatibilità' : 'Compatibility'}
                    </AppText>
                    <CompatPercentSlider
                      value={value.minCompat}
                      onChange={(minCompat) => patch({ minCompat })}
                      isIt={isIt}
                    />
                  </View>
                </>
              ) : null}

              <View style={styles.rule} />

              {/* Ordine / distanza */}
              <View style={styles.block}>
                <AppText style={styles.blockTitle}>
                  {isIt ? 'Ordine' : 'Sort'}
                </AppText>
                <View style={styles.choiceRow}>
                  {SORT_OPTS.map((opt) => {
                    const active = value.sortBy === opt.key;
                    const disabled = opt.key === 'distance' && !hasLocation;
                    return (
                      <Pressable
                        key={opt.key}
                        disabled={disabled}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          patch({ sortBy: opt.key });
                        }}
                        style={[
                          styles.choice,
                          active && styles.choiceOn,
                          disabled && styles.choiceOff,
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={14}
                          color={active ? colors.white : colors.onSurfaceMuted}
                        />
                        <AppText style={[styles.choiceText, active && styles.choiceTextOn]}>
                          {isIt ? opt.it : opt.en}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                {hasLocation ? (
                  <View style={styles.distBlock}>
                    <AppText style={styles.blockCaption}>
                      {isIt ? 'Raggio' : 'Radius'}
                    </AppText>
                    <View style={styles.segment}>
                      {DIST_OPTS.map((opt) => {
                        const active = value.maxDistanceKm === opt.key;
                        return (
                          <Pressable
                            key={opt.key}
                            onPress={() => {
                              Haptics.selectionAsync().catch(() => {});
                              patch({ maxDistanceKm: opt.key });
                            }}
                            style={[styles.segmentItem, active && styles.segmentItemOn]}
                          >
                            <AppText style={[styles.segmentText, active && styles.segmentTextOn]}>
                              {isIt ? opt.it : opt.en}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerMeta}>
                {resultsLabel
                  ? (isIt ? `${resultsLabel} in elenco` : `${resultsLabel} listed`)
                  : (isIt ? 'Nessun risultato' : 'No results')}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  handleClose();
                }}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed && styles.confirmBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isIt ? 'Conferma filtri' : 'Confirm filters'}
              >
                <Text style={styles.confirmLabel}>
                  {isIt ? 'Conferma' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
            </View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function countActiveFilters(value: LocaliFilters, hasAllergie = true): number {
  let n = 0;
  if (hasAllergie && value.minCompat > 0) n += 1;
  if (value.onlyMenu) n += 1;
  if (value.onlyFavorites) n += 1;
  if (value.verified !== 'all') n += 1;
  if (value.cuisines.length > 0) n += 1;
  if (value.maxDistanceKm > 0) n += 1;
  if (value.sortBy !== 'compat') n += 1;
  return n;
}

function FilterToggle({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <AppText style={styles.toggleTitle}>{title}</AppText>
        <AppText style={styles.toggleSub}>{subtitle}</AppText>
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onValueChange(next);
        }}
        trackColor={{ false: colors.border, true: colors.brand200 }}
        thumbColor={value ? colors.brand : '#FFFFFF'}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brandDarker,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dragZone: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
    flexShrink: 0,
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 26,
    lineHeight: 30,
    color: colors.brandInk,
    letterSpacing: -0.6,
  },
  activeBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.onBrand,
  },
  clearLink: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.brand,
  },
  headerHint: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 8,
  },
  block: {
    gap: 10,
    paddingVertical: 14,
  },
  blockTitle: {
    fontFamily: font.displaySemibold,
    fontSize: 15,
    color: colors.brandInk,
    letterSpacing: -0.2,
  },
  blockCaption: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: -4,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  cuisineRail: {
    gap: 8,
    paddingRight: 8,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cuisineChipOn: {
    backgroundColor: colors.brandInk,
    borderColor: colors.brandInk,
  },
  cuisineEmoji: {
    fontSize: 14,
  },
  cuisineLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  cuisineLabelOn: {
    color: colors.white,
    fontFamily: font.bold,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentItemOn: {
    backgroundColor: colors.brand50,
  },
  segmentText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  segmentTextOn: {
    color: colors.brandInk,
    fontFamily: font.bold,
  },
  toggleList: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  toggleTitle: {
    fontFamily: font.displaySemibold,
    fontSize: 14.5,
    color: colors.brandInk,
    letterSpacing: -0.2,
  },
  toggleSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  innerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 14,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  choiceOff: {
    opacity: 0.35,
  },
  choiceText: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    color: colors.onSurfaceMuted,
  },
  choiceTextOn: {
    color: colors.white,
    fontFamily: font.bold,
  },
  distBlock: {
    gap: 8,
    marginTop: 4,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  footerMeta: {
    textAlign: 'center',
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#6B6575',
  },
  confirmBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#36255C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPressed: {
    opacity: 0.88,
    backgroundColor: '#2A1C48',
  },
  confirmLabel: {
    fontFamily: font.displaySemibold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
