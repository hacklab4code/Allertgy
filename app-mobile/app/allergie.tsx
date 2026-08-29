import { Stack, router, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import {
  getSectionTitle,
  groupAllergensBySection,
  getLang,
  TRANSLATED_ALLERGENS,
} from '../src/engine/translations';
import type { Allergen, AllergyCriterio, AllergyIntensity } from '../src/types';
import ShareProfileModal from '../src/components/ShareProfileModal';
import { useTranslation } from '../src/constants/translations';
import {
  AppText,
  DebossedInput,
  GlassScreenScroll,
  Screen,
  SurfaceButton,
  AllergyChip,
  AllergyConfigModal,
  CATEGORY_ICONS,
} from '../src/components/ui';
import { font, spacing } from '../src/theme';

const CATEGORY_TABS = [
  { key: 'tutti', label_it: 'Tutti', label_en: 'All', icon: '✨' },
  { key: 'ue', label_it: 'UE', label_en: 'EU', icon: '🛡️' },
  { key: 'frutta_guscio', label_it: 'Noci', label_en: 'Nuts', icon: '🌰' },
  { key: 'frutta', label_it: 'Frutta', label_en: 'Fruit', icon: '🍓' },
  { key: 'verdura', label_it: 'Verdura', label_en: 'Veggie', icon: '🥦' },
  { key: 'cereali', label_it: 'Cereali', label_en: 'Grains', icon: '🌾' },
  { key: 'spezie', label_it: 'Spezie', label_en: 'Spices', icon: '🧂' },
  { key: 'intolleranze', label_it: 'Intolleranze', label_en: 'Intolerances', icon: '🥛' },
  { key: 'preferenze', label_it: 'Diete', label_en: 'Diets', icon: '🌱' },
];

export default function Allergie() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isSavingRef = useRef(false);

  const [all, setAll] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(useSession.getState().allergie)
  );
  const [intensities, setIntensities] = useState<Record<string, AllergyIntensity>>(
    useSession.getState().allergyIntensities || {}
  );
  const [criteria, setCriteria] = useState<Record<string, AllergyCriterio>>(
    useSession.getState().allergyCriteria || {}
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [configModalTarget, setConfigModalTarget] = useState<Allergen | null>(null);

  type FilterTab = 'tutti' | 'attivi' | 'grave' | 'moderata' | 'lieve' | 'diete';
  const [filterTab, setFilterTab] = useState<FilterTab>('tutti');
  const [categoryFilter, setCategoryFilter] = useState<string>('tutti');

  const { setAllergie, setProfileCompleted, language, token, email } = useSession();
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const lang = getLang(language);

  const hasUnsavedChanges = useMemo(() => {
    if (isSavingRef.current) return false;
    const savedAllergies = new Set(useSession.getState().allergie);
    const savedIntensities = useSession.getState().allergyIntensities || {};
    const savedCriteria = useSession.getState().allergyCriteria || {};

    if (selected.size !== savedAllergies.size) return true;
    for (const code of selected) {
      if (!savedAllergies.has(code)) return true;
      if ((intensities[code] || 'moderata') !== (savedIntensities[code] || 'moderata')) return true;
      if ((criteria[code] || 'assoluto') !== (savedCriteria[code] || 'assoluto')) return true;
    }
    return false;
  }, [selected, intensities, criteria]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges || isSavingRef.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        isIt ? 'Uscire senza salvare?' : 'Exit without saving?',
        isIt
          ? 'Hai apportato delle modifiche alle tue allergie. Se esci ora senza salvare, le modifiche andranno perse.'
          : 'You have unsaved changes to your allergies. If you exit now, they will be lost.',
        [
          {
            text: isIt ? 'Continua a modificare' : 'Keep Editing',
            style: 'cancel',
          },
          {
            text: isIt ? 'Esci senza salvare' : 'Exit without saving',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, isIt]);

  useEffect(() => {
    api.allergens().then(setAll).catch((e) => setError(e.message));
    api.myAllergens().then((mine) => {
      const intensitiesMap: Record<string, AllergyIntensity> = {};
      const criteriaMap: Record<string, AllergyCriterio> = {};
      mine.forEach((a) => {
        if (a.intensity) intensitiesMap[a.code] = a.intensity as AllergyIntensity;
        if (a.criterio) criteriaMap[a.code] = a.criterio as AllergyCriterio;
      });
      const codes = mine.map((a) => a.code);
      setSelected(new Set(codes));
      setIntensities(intensitiesMap);
      setCriteria(criteriaMap);
      setAllergie(codes, intensitiesMap, criteriaMap);
    }).catch(() => { });
  }, [setAllergie]);

  const sections = useMemo(() => {
    let filteredAll = all;
    if (filterTab === 'attivi') {
      filteredAll = filteredAll.filter((a) => selected.has(a.code));
    } else if (filterTab === 'grave') {
      filteredAll = filteredAll.filter((a) => selected.has(a.code) && !a.is_diet && intensities[a.code] === 'grave');
    } else if (filterTab === 'moderata') {
      filteredAll = filteredAll.filter(
        (a) => selected.has(a.code) && !a.is_diet && (intensities[a.code] === 'moderata' || !intensities[a.code])
      );
    } else if (filterTab === 'lieve') {
      filteredAll = filteredAll.filter((a) => selected.has(a.code) && !a.is_diet && intensities[a.code] === 'lieve');
    } else if (filterTab === 'diete') {
      filteredAll = filteredAll.filter((a) => selected.has(a.code) && a.is_diet);
    }

    let base = groupAllergensBySection(filteredAll);

    if (categoryFilter !== 'tutti') {
      base = base.filter((s) => s.key === categoryFilter);
    }

    if (!search.trim()) return base;
    const q = search.toLowerCase().trim();
    return base
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (a) =>
            a.name_it.toLowerCase().includes(q) ||
            (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en.toLowerCase().includes(q)) ||
            (a.code && a.code.toLowerCase().includes(q)) ||
            (a.emoji && a.emoji.includes(q))
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [all, selected, intensities, search, filterTab, categoryFilter]);

  const totalFiltered = useMemo(
    () => sections.reduce((acc, s) => acc + s.items.length, 0),
    [sections]
  );

  const stats = useMemo(() => {
    let grave = 0;
    let moderata = 0;
    let lieve = 0;
    let diete = 0;

    selected.forEach((code) => {
      const item = all.find((x) => x.code === code);
      if (item?.is_diet) {
        diete++;
      } else {
        const i = intensities[code] || 'moderata';
        if (i === 'grave') grave++;
        else if (i === 'lieve') lieve++;
        else moderata++;
      }
    });

    return { total: selected.size, grave, moderata, lieve, diete };
  }, [selected, intensities, all]);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) {
      next.delete(code);
      setIntensities((prev) => {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      });
      setCriteria((prev) => {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      });
    } else {
      next.add(code);
      setIntensities((prev) => ({ ...prev, [code]: prev[code] || 'moderata' }));
      setCriteria((prev) => ({ ...prev, [code]: prev[code] || 'assoluto' }));
    }
    setSelected(next);
  };

  const updateConfig = (code: string, intensity: AllergyIntensity, criterio: AllergyCriterio) => {
    if (!selected.has(code)) {
      const next = new Set(selected);
      next.add(code);
      setSelected(next);
    }
    setIntensities((prev) => ({ ...prev, [code]: intensity }));
    setCriteria((prev) => ({ ...prev, [code]: criterio }));
  };

  const save = async (options?: { silent?: boolean }) => {
    setBusy(true);
    setError('');
    try {
      const wasProfileCompleted = useSession.getState().profileCompleted;
      const codes = [...selected];
      await api.saveAllergens(codes, intensities, criteria);
      isSavingRef.current = true;
      setAllergie(codes, intensities, criteria);
      setProfileCompleted(true);
      if (!options?.silent) {
        // Durante l'onboarding l'utente prosegue alla home; da Profilo resta nel
        // suo flusso di gestione, invece di essere spostato senza contesto.
        router.replace(wasProfileCompleted ? '/(tabs)/account' : '/');
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const openShare = async () => {
    const saved = new Set(useSession.getState().allergie);
    const changed =
      selected.size !== saved.size ||
      [...selected].some((code) => !saved.has(code));
    if (changed) {
      setBusy(true);
      try {
        const codes = [...selected];
        await api.saveAllergens(codes, intensities, criteria);
        setAllergie(codes, intensities, criteria);
        setProfileCompleted(true);
      } catch (e) {
        Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setShareOpen(true);
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Allergie e intolleranze' : 'Allergies & Intolerances',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#322A63' },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  router.replace('/');
                }
              }}
              hitSlop={12}
              style={{ paddingRight: 12, paddingVertical: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#322A63" />
            </Pressable>
          ),
        }}
      />

      {/* FIXED HEADER BLOCK */}
      <View style={styles.fixedHeaderBlock}>
        {/* SUMMARY CARD CONTAINER */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardTop}>
            <Pressable
              style={({ pressed }) => [
                styles.summaryBadgeMain,
                filterTab === 'attivi' && styles.summaryBadgeMainActive,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterTab(filterTab === 'attivi' ? 'tutti' : 'attivi');
              }}
            >
              <View style={[
                styles.shieldIconWrap,
                filterTab === 'attivi' && styles.shieldIconWrapActive
              ]}>
                <Ionicons
                  name={stats.total > 0 ? "shield-checkmark" : "shield-outline"}
                  size={15}
                  color={filterTab === 'attivi' ? '#FFFFFF' : '#322A63'}
                />
              </View>
              <AppText style={[
                styles.summaryMainText,
                filterTab === 'attivi' && styles.summaryMainTextActive
              ]}>
                {stats.total}{' '}
                {isIt
                  ? stats.total === 1
                    ? 'allergene selezionato'
                    : 'allergeni selezionati'
                  : stats.total === 1
                  ? 'allergen selected'
                  : 'allergens selected'}
              </AppText>
              {filterTab === 'attivi' && (
                <Ionicons name="checkmark-circle" size={15} color="#322A63" style={{ marginLeft: 2 }} />
              )}
            </Pressable>

            {token && (
              <Pressable
                style={({ pressed }) => [styles.shareActionPill, pressed && styles.pressed]}
                onPress={openShare}
                hitSlop={8}
              >
                <Ionicons name="share-outline" size={15} color="#322A63" />
                <AppText style={styles.shareActionText}>{isIt ? 'Condividi' : 'Share'}</AppText>
              </Pressable>
            )}
          </View>

          {/* SEVERITY & DIET PILLS ROW */}
          {stats.total > 0 && (
            <View style={styles.severityPillsRow}>
              {stats.grave > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterTab(filterTab === 'grave' ? 'tutti' : 'grave');
                  }}
                  style={({ pressed }) => [
                    styles.severityPill,
                    styles.pillGrave,
                    filterTab === 'grave' && styles.pillGraveActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: '#E5484D' }]} />
                  <AppText style={[
                    styles.severityPillText,
                    { color: '#9E1C23' },
                    filterTab === 'grave' && styles.pillTextActiveGrave
                  ]}>
                    {stats.grave} {stats.grave === 1 ? (isIt ? 'Grave' : 'Severe') : (isIt ? 'Gravi' : 'Severe')}
                  </AppText>
                </Pressable>
              )}

              {stats.moderata > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterTab(filterTab === 'moderata' ? 'tutti' : 'moderata');
                  }}
                  style={({ pressed }) => [
                    styles.severityPill,
                    styles.pillModerata,
                    filterTab === 'moderata' && styles.pillModerataActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: '#F5A524' }]} />
                  <AppText style={[
                    styles.severityPillText,
                    { color: '#B45309' },
                    filterTab === 'moderata' && styles.pillTextActiveModerata
                  ]}>
                    {stats.moderata} {stats.moderata === 1 ? (isIt ? 'Moderato' : 'Moderate') : (isIt ? 'Moderati' : 'Moderate')}
                  </AppText>
                </Pressable>
              )}

              {stats.lieve > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterTab(filterTab === 'lieve' ? 'tutti' : 'lieve');
                  }}
                  style={({ pressed }) => [
                    styles.severityPill,
                    styles.pillLieve,
                    filterTab === 'lieve' && styles.pillLieveActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: '#EAB308' }]} />
                  <AppText style={[
                    styles.severityPillText,
                    { color: '#854D0E' },
                    filterTab === 'lieve' && styles.pillTextActiveLieve
                  ]}>
                    {stats.lieve} {stats.lieve === 1 ? (isIt ? 'Lieve' : 'Mild') : (isIt ? 'Lievi' : 'Mild')}
                  </AppText>
                </Pressable>
              )}

              {stats.diete > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterTab(filterTab === 'diete' ? 'tutti' : 'diete');
                  }}
                  style={({ pressed }) => [
                    styles.severityPill,
                    styles.pillDiete,
                    filterTab === 'diete' && styles.pillDieteActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.pillEmojiText}>🌱</AppText>
                  <AppText style={[
                    styles.severityPillText,
                    { color: '#15803D' },
                    filterTab === 'diete' && styles.pillTextActiveDiete
                  ]}>
                    {stats.diete} {stats.diete === 1 ? (isIt ? 'Dieta' : 'Diet') : (isIt ? 'Diete' : 'Diets')}
                  </AppText>
                </Pressable>
              )}

              {filterTab !== 'tutti' && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterTab('tutti');
                  }}
                  style={({ pressed }) => [styles.resetFilterPill, pressed && styles.pressed]}
                >
                  <Ionicons name="close-circle" size={14} color="#6B6690" />
                  <AppText style={styles.resetFilterText}>{isIt ? 'Mostra tutti' : 'Show all'}</AppText>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* SEARCH INPUT */}
        <View style={styles.searchWrap}>
          <DebossedInput
            value={search}
            onChangeText={setSearch}
            placeholder={isIt ? 'Cerca allergene (es. latte, glutine...)' : t('search_allergen_placeholder')}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            rightIcon={
              search.length > 0 ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearch('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color="#6B6690" />
                </Pressable>
              ) : (
                <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              )
            }
          />
        </View>

        {search.trim() !== '' && (
          <AppText variant="caption" color="#6B6690" style={styles.searchCount}>
            {totalFiltered > 0
              ? (isIt ? `${totalFiltered} trovati` : `${totalFiltered} found`)
              : (isIt ? `Nessun risultato per "${search}"` : `No results for "${search}"`)}
          </AppText>
        )}

        {/* STICKY CATEGORY NAV WITH RIGHT FADE */}
        <View style={styles.catnavWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catnavContent}
          >
            {CATEGORY_TABS.map((cat) => {
              const isActive = categoryFilter === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={({ pressed }) => [
                    styles.catPill,
                    isActive && styles.catPillActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategoryFilter(cat.key);
                  }}
                >
                  <AppText style={isActive ? styles.catTextActive : styles.catText}>
                    {cat.icon} {isIt ? cat.label_it : cat.label_en}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.catnavFade} pointerEvents="none" />
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <GlassScreenScroll
        insetBottom={150 + insets.bottom}
        headerFloat={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? <AppText variant="caption" color="#E5484D">{error}</AppText> : null}
        {all.length === 0 && !error ? <ActivityIndicator color="#4A3F8C" style={{ marginTop: 24 }} /> : null}

        {/* CARD CONTAINER WRAPPING ALL GROUPS */}
        {sections.length > 0 && (
          <View style={styles.listCard}>
            {sections.map((section, index) => {
              const sectionSelectedCount = section.items.filter((item) => selected.has(item.code)).length;
              const catIcon = CATEGORY_ICONS[section.key] || '🏷️';
              const isLastGroup = index === sections.length - 1;

              return (
                <View key={section.key} style={[styles.group, isLastGroup && styles.groupLast]}>
                  <View style={styles.groupHead}>
                    <View style={styles.groupTitleRow}>
                      <AppText style={styles.groupIconText}>{catIcon}</AppText>
                      <AppText style={styles.groupTitleText}>
                        {getSectionTitle(section.key, lang)}
                      </AppText>
                    </View>
                    {sectionSelectedCount > 0 ? (
                      <AppText style={styles.groupBadge}>
                        {sectionSelectedCount} {isIt ? 'attivi' : 'active'}
                      </AppText>
                    ) : null}
                  </View>

                  <View style={styles.chipGrid}>
                    {section.items.map((a) => (
                      <AllergyChip
                        key={a.code}
                        a={a}
                        selected={selected.has(a.code)}
                        intensity={intensities[a.code] || 'moderata'}
                        criterio={criteria[a.code] || 'assoluto'}
                        onToggle={() => toggle(a.code)}
                        onConfigure={() => setConfigModalTarget(a)}
                        isIt={isIt}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* BOTTOM CLEARANCE SO LIST NEVER COLLIDES WITH FLOATING CTA */}
        <View style={{ height: 140 + insets.bottom }} />
      </GlassScreenScroll>

      {/* CTA FOOTER WRAPPER */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <SurfaceButton
          label={
            busy
              ? (isIt ? 'Salvataggio...' : 'Saving...')
              : selected.size === 0
              ? (isIt ? 'Continua senza allergie' : 'Continue without allergies')
              : (isIt ? `Salva profilo (${selected.size} selezionati)` : `Save profile (${selected.size} selected)`)
          }
          onPress={() => save()}
          disabled={busy || (all.length === 0 && !error)}
          fullWidth
          style={styles.ctaButton}
        />
      </View>

      {/* CONFIGURATION MODAL */}
      {configModalTarget && (
        <AllergyConfigModal
          visible={Boolean(configModalTarget)}
          onClose={() => setConfigModalTarget(null)}
          allergenName={isIt ? configModalTarget.name_it : (TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.en || configModalTarget.name_it)}
          allergenEmoji={
            configModalTarget.emoji && configModalTarget.emoji !== '⚠️'
              ? configModalTarget.emoji
              : (TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.emoji || CATEGORY_ICONS[configModalTarget.category || 'ue'] || '⚠️')
          }
          isDiet={Boolean(configModalTarget.is_diet)}
          intensity={intensities[configModalTarget.code] || 'moderata'}
          criterio={criteria[configModalTarget.code] || 'assoluto'}
          onSave={(intensity, criterio) => updateConfig(configModalTarget.code, intensity, criterio)}
          isIt={isIt}
        />
      )}

      {/* SHARE PROFILE MODAL */}
      <ShareProfileModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        profileId={null}
        profileLabel={email?.split('@')[0] || (isIt ? 'Io' : 'Me')}
        isIt={isIt}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fixedHeaderBlock: {
    backgroundColor: '#F3F1FA',
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E0F5',
    zIndex: 20,
  },
  pressed: {
    opacity: 0.82,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E0F5',
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryBadgeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 7,
  },
  summaryBadgeMainActive: {
    backgroundColor: '#EAE6F8',
    borderColor: '#322A63',
    borderWidth: 1,
  },
  shieldIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAE6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconWrapActive: {
    backgroundColor: '#322A63',
  },
  summaryMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#322A63',
    fontFamily: font.bold,
    letterSpacing: -0.2,
  },
  summaryMainTextActive: {
    color: '#322A63',
  },
  shareActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E4E0F5',
  },
  shareActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#322A63',
    fontFamily: font.bold,
  },
  severityPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F1FA',
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillEmojiText: {
    fontSize: 11,
  },
  severityPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: font.bold,
  },
  // GRAVI
  pillGrave: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  pillGraveActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#E5484D',
  },
  pillTextActiveGrave: {
    fontWeight: '800',
  },
  // MODERATA
  pillModerata: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  pillModerataActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F5A524',
  },
  pillTextActiveModerata: {
    fontWeight: '800',
  },
  // LIEVE
  pillLieve: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  pillLieveActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#EAB308',
  },
  pillTextActiveLieve: {
    fontWeight: '800',
  },
  // DIETE
  pillDiete: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  pillDieteActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  pillTextActiveDiete: {
    fontWeight: '800',
  },
  // RESET FILTER
  resetFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE6F8',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    gap: 4,
  },
  resetFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B6690',
    fontFamily: font.bold,
  },
  helperBox: {
    backgroundColor: '#EAE6F8',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchCount: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  catnavWrap: {
    position: 'relative',
    paddingTop: 4,
    paddingBottom: 10,
  },
  catnavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  catnavFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 10,
    width: 36,
    backgroundColor: '#F3F1FA',
    opacity: 0.85,
  },
  catPill: {
    paddingBottom: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  catPillActive: {
    borderBottomColor: '#322A63',
  },
  catText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#6B6690',
    fontFamily: font.semibold,
  },
  catTextActive: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#322A63',
    fontFamily: font.bold,
  },

  // SCROLL CONTENT & CARD
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  group: {
    paddingTop: 22,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E0F5',
  },
  groupLast: {
    borderBottomWidth: 0,
    paddingBottom: 14,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupIconText: {
    fontSize: 14,
    textAlign: 'center',
  },
  groupTitleText: {
    fontSize: 12.5,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: '#6B6690',
    textTransform: 'uppercase',
    fontFamily: font.bold,
  },
  groupBadge: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#322A63',
    fontFamily: font.bold,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 14,
  },

  // CTA FOOTER
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F3F1FA',
    borderTopWidth: 1,
    borderTopColor: '#E4E0F5',
    elevation: 12,
  },
  ctaButton: {
    backgroundColor: '#322A63',
    borderRadius: 16,
  },
});
