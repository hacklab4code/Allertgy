import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { api } from '../../src/api/client';
import { toggleRestaurantFavorite } from '../../src/services/favorites';
import DishCard from '../../src/components/DishCard';
import MenuReviewsSection from '../../src/components/menu/MenuReviewsSection';
import { calcolaSemaforo, calcolaSemaforoTavolata, type EsitoSemaforo, type CommensaleProfile } from '../../src/engine/semaforo';
import { useMenuReviews } from '../../src/hooks/useMenuReviews';
import { useSession } from '../../src/store/session';
import type { Menu, Piatto, RestaurantPhoto } from '../../src/types';
import { t } from '../../src/engine/translations';
import { getLocaleForLang } from '../../src/constants/languages';
import { SCREEN_PADDING_H } from '../../src/layoutConstants';
import { colors, spacing, TAB_BAR_CLEARANCE } from '../../src/theme';
import {
  ErrorStateCard,
  GlassScreenScroll,
  GlassBackButton,
  LoadingBlock,
  MenuUnavailableCard,
  SurfaceButton,
  Screen,
  VenueBottomBar,
  VenueHero,
  type VenueTab,
} from '../../src/components/ui';
import { parseOpenStatus } from '../../src/utils/openHours';
import { openVenueInMaps } from '../../src/utils/openVenueInMaps';

type Filtro = 'verde' | 'giallo' | 'rosso';
const SEMAFORO_ORDER: Filtro[] = ['verde', 'giallo', 'rosso'];

interface Valutato {
  p: Piatto;
  esito: EsitoSemaforo;
  tavolataInfo?: {
    idonei: string[];
    nonIdonei: string[];
  };
}

export default function MenuScreen() {
  const { codice, promoTitle, promoBody } = useLocalSearchParams<{ codice: string; promoTitle?: string; promoBody?: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [venuePhotos, setVenuePhotos] = useState<RestaurantPhoto[]>([]);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('verde');
  const semaforoPagerRef = useRef<GHScrollView>(null);
  const pagerScrollingRef = useRef(false);
  const [activeVenueTab, setActiveVenueTab] = useState<VenueTab>('menu');
  const [showPromo, setShowPromo] = useState(!!(promoTitle && promoBody));
  const [isOffline, setIsOffline] = useState(false);
  const semaforoPageWidth = windowWidth;

  const {
    allergie: primaryAllergies, addRecent, favorites, language,
    ingredientiEsclusi, token, role, subProfiles, activeProfileId, email,
  } = useSession();
  const isIt = (language || 'it').toLowerCase().startsWith('it');

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const isFav = !!codice && favorites.some((f) => f.code === codice);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('tutte');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [tavolataActiveIds, setTavolataActiveIds] = useState<string[]>([]);
  const canReview = !!token && role === 'customer';

  const reviewState = useMenuReviews(codice, language);

  const onToggleFavorite = () => {
    if (!codice || !menu) return;
    void toggleRestaurantFavorite(codice, menu.nome_ristorante);
  };

  const loadMenu = useCallback(async () => {
    if (!codice) return;
    setError('');
    try {
      const m = await api.menu(codice);
      setMenu(m);
      setVenuePhotos(m.photos || []);
      AsyncStorage.setItem(`menu_cache_${codice}`, JSON.stringify(m)).catch(() => {});
      addRecent(codice, m.nome_ristorante);
      setIsOffline(false);
    } catch (e) {
      try {
        const cachedJson = await AsyncStorage.getItem(`menu_cache_${codice}`);
        if (cachedJson) {
          const cached = JSON.parse(cachedJson) as Menu;
          setMenu(cached);
          setVenuePhotos(cached.photos || []);
          setIsOffline(true);
          return;
        }
      } catch (cacheErr) {
        console.warn('Errore lettura cache locale:', cacheErr);
      }
      setError((e as Error).message);
    }
  }, [codice, addRecent]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu, language]);

  useEffect(() => {
    if (menu && menu.menus && menu.menus.length > 0) {
      if (!activeMenuId || !menu.menus.some((x) => x.id === activeMenuId)) {
        setActiveMenuId(menu.menus[0].id);
      }
    } else {
      setActiveMenuId(null);
    }
  }, [menu, activeMenuId]);

  const availableCommensali: CommensaleProfile[] = useMemo(() => {
    const list: CommensaleProfile[] = [
      {
        id: 'primary',
        name: email ? email.split('@')[0] : (isIt ? 'Io' : 'Me'),
        allergie: primaryAllergies,
        ingredientiEsclusi: ingredientiEsclusi,
      },
    ];
    subProfiles.forEach((p) => {
      list.push({
        id: String(p.id),
        name: p.name,
        allergie: p.allergens.map((a) => a.code),
        ingredientiEsclusi: [],
      });
    });
    return list;
  }, [email, isIt, primaryAllergies, ingredientiEsclusi, subProfiles]);

  const activeCommensali = useMemo(() => {
    if (tavolataActiveIds.length === 0) {
      if (activeProfile) {
        return [
          {
            id: String(activeProfile.id),
            name: activeProfile.name,
            allergie: activeProfile.allergens.map((a) => a.code),
            ingredientiEsclusi: [],
          },
        ];
      }
      return availableCommensali.filter((c) => c.id === 'primary');
    }
    return availableCommensali.filter((c) => tavolataActiveIds.includes(String(c.id)));
  }, [activeProfile, availableCommensali, tavolataActiveIds]);

  const valutati: Valutato[] = useMemo(() => {
    if (!menu) return [];
    const filteredPiatti = activeMenuId
      ? menu.piatti.filter((p) => p.menu_id === activeMenuId)
      : menu.piatti;

    if (activeCommensali.length > 1) {
      return filteredPiatti.map((p) => {
        const tavolata = calcolaSemaforoTavolata(activeCommensali, p);
        return {
          p,
          esito: {
            stato: tavolata.statoGlobale,
            match_contenuti: [],
            match_tracce: [],
            match_esclusi: [],
          },
          tavolataInfo: {
            idonei: tavolata.commensaliIdonei,
            nonIdonei: tavolata.commensaliNonIdonei,
          },
        };
      });
    }

    const currentAllergies = activeCommensali[0]?.allergie || allergie;
    const currentExcluded = activeCommensali[0]?.ingredientiEsclusi || ingredientiEsclusi;
    return filteredPiatti.map((p) => ({
      p,
      esito: calcolaSemaforo(currentAllergies, p, currentExcluded),
    }));
  }, [menu, activeMenuId, activeCommensali, allergie, ingredientiEsclusi]);

  const menuGroups = useMemo(() => {
    if (!menu) return [];
    const filteredPiatti = activeMenuId
      ? menu.piatti.filter((p) => p.menu_id === activeMenuId)
      : menu.piatti;
    return Array.from(new Set(filteredPiatti.map((p) => p.menu_group || 'Principale')));
  }, [menu, activeMenuId]);

  useEffect(() => {
    if (menu && menuGroups.length > 0) {
      if (!selectedGroup || !menuGroups.includes(selectedGroup)) {
        setSelectedGroup(menuGroups[0]);
      }
    }
  }, [menu, menuGroups, selectedGroup]);

  const valutatiFiltrati = useMemo(() => {
    if (menuGroups.length <= 1) return valutati;
    return valutati.filter((v) => (v.p.menu_group || 'Principale') === selectedGroup);
  }, [valutati, selectedGroup, menuGroups]);

  const dishCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of valutatiFiltrati) {
      const nome = v.p.categoria?.trim() || t('other', language);
      map.set(nome, (map.get(nome) || 0) + 1);
    }
    return Array.from(map.entries()).map(([nome, count]) => ({ nome, count }));
  }, [valutatiFiltrati, language]);

  useEffect(() => {
    if (selectedCategory === 'tutte') return;
    if (!dishCategories.some((c) => c.nome === selectedCategory)) {
      setSelectedCategory('tutte');
    }
  }, [dishCategories, selectedCategory]);

  const conta = (s: Filtro) => {
    let items = valutatiFiltrati.filter((v) => v.esito.stato === s);
    if (selectedCategory !== 'tutte') {
      items = items.filter((v) => {
        const nome = v.p.categoria?.trim() || t('other', language);
        return nome === selectedCategory;
      });
    }
    return items.length;
  };

  const scrollSemaforoTo = useCallback((f: Filtro, animated = true) => {
    const idx = SEMAFORO_ORDER.indexOf(f);
    if (idx < 0 || semaforoPageWidth <= 0) return;
    pagerScrollingRef.current = true;
    semaforoPagerRef.current?.scrollTo({ x: idx * semaforoPageWidth, animated });
    setTimeout(() => { pagerScrollingRef.current = false; }, animated ? 380 : 40);
  }, [semaforoPageWidth]);

  const handleFiltroChange = useCallback((f: Filtro) => {
    if (f === filtro) return;
    setFiltro(f);
    scrollSemaforoTo(f, true);
  }, [filtro, scrollSemaforoTo]);

  const onSemaforoPagerScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pagerScrollingRef.current || semaforoPageWidth <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / semaforoPageWidth);
    const next = SEMAFORO_ORDER[Math.max(0, Math.min(SEMAFORO_ORDER.length - 1, idx))];
    if (next && next !== filtro) {
      void Haptics.selectionAsync();
      setFiltro(next);
    }
  }, [filtro, semaforoPageWidth]);

  useEffect(() => {
    scrollSemaforoTo(filtro, false);
  }, [semaforoPageWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const allergensPublished = menu?.menu_available !== false && (menu?.piatti?.length ?? 0) > 0;

  const openMaps = () => {
    if (!menu) return;
    openVenueInMaps({
      latitude: menu.latitude,
      longitude: menu.longitude,
      name: menu.nome_ristorante,
      address: menu.indirizzo && menu.citta
        ? `${menu.indirizzo}, ${menu.citta}`
        : (menu.indirizzo || menu.citta || null),
    });
  };

  const renderVenueInfo = () => {
    if (!menu) return null;
    const openStatus = parseOpenStatus(menu.orari_apertura);
    const openColor = openStatus === 'open' ? colors.green
      : openStatus === 'closed' ? colors.red
      : colors.textMuted;
    const openBg = openStatus === 'open' ? colors.greenSoft
      : openStatus === 'closed' ? colors.redSoft
      : colors.surfaceTertiary;
    const openBorder = openStatus === 'open' ? colors.greenBorder
      : openStatus === 'closed' ? colors.redBorder
      : colors.border;
    const address = menu.indirizzo
      ? `${menu.indirizzo}${menu.citta ? `, ${menu.citta}` : ''}`
      : menu.citta;

    return (
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>{isIt ? 'Informazioni' : 'Information'}</Text>
          {openStatus !== 'unknown' && (
            <View style={[styles.openBadge, { backgroundColor: openBg, borderColor: openBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: openColor }]} />
              <Text style={[styles.openBadgeText, { color: openColor }]}>
                {openStatus === 'open' ? t('open_now', language) : t('closed_now', language)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoList}>
          {address ? (
            <>
              <View style={[styles.infoRow, styles.infoAddressRow]}>
                <Ionicons name="location-outline" size={21} color={colors.brandDark} style={styles.infoLeadingIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('address', language)}</Text>
                  <Text style={styles.infoValue}>{address}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.mapsButton} activeOpacity={0.8} onPress={openMaps}>
                <Ionicons name="navigate-outline" size={16} color={colors.onBrand} />
                <Text style={styles.mapsButtonText}>{isIt ? 'Apri in Maps' : 'Open in Maps'}</Text>
                <Ionicons name="arrow-forward-outline" size={17} color={colors.onBrand} />
              </TouchableOpacity>
              <View style={styles.infoDivider} />
            </>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.brandDark} style={styles.infoLeadingIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('opening_hours', language)}</Text>
              <Text style={[styles.infoValue, !menu.orari_apertura && styles.infoMuted]}>
                {menu.orari_apertura || t('hours_unknown', language)}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={19} color={colors.brandDark} style={styles.infoLeadingIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('phone', language)}</Text>
              {menu.telefono ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${menu.telefono}`)}>
                  <Text style={[styles.infoValue, styles.infoLink]}>{menu.telefono}</Text>
                </TouchableOpacity>
              ) : <Text style={[styles.infoValue, styles.infoMuted]}>—</Text>}
            </View>
          </View>

          {menu.email_contatto ? (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.brandDark} style={styles.infoLeadingIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${menu.email_contatto}`)}>
                    <Text style={[styles.infoValue, styles.infoLink]}>{menu.email_contatto}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {menu.aggiornato_il ? (
          <View style={styles.infoFooter}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.onSurfaceMuted} />
            <Text style={styles.infoFooterText}>
              {isIt ? 'Informazioni verificate il ' : 'Information verified on '}
              {new Date(menu.aggiornato_il).toLocaleDateString(getLocaleForLang(language), {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (error && !menu) {
    return (
      <Screen edges={false} style={styles.page}>
        <GlassBackButton />
        <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
          <ErrorStateCard
            message={error}
            retryLabel={isIt ? 'Riprova' : 'Retry'}
            onRetry={loadMenu}
          />
          <SurfaceButton
            label={isIt ? 'Torna indietro' : 'Go back'}
            onPress={() => router.back()}
            variant="soft"
          />
        </View>
      </Screen>
    );
  }

  if (!menu) {
    return (
      <Screen edges={false} style={styles.page}>
        <GlassBackButton />
        <LoadingBlock label={isIt ? 'Caricamento menù…' : 'Loading menu…'} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  const filterItems = (stato: Filtro) => {
    let items = valutatiFiltrati.filter((v) => v.esito.stato === stato);
    if (selectedCategory !== 'tutte') {
      items = items.filter((v) => {
        const nome = v.p.categoria?.trim() || t('other', language);
        return nome === selectedCategory;
      });
    }
    return items;
  };

  const renderDishGroups = (items: Valutato[]) => {
    const categorie: { nome: string; piatti: Valutato[] }[] = [];
    for (const it of items) {
      const nome = it.p.categoria?.trim() || t('other', language);
      const g = categorie.find((c) => c.nome === nome);
      g ? g.piatti.push(it) : categorie.push({ nome, piatti: [it] });
    }
    return categorie.map((cat) => (
      <View key={cat.nome} style={styles.categorySection}>
        {(categorie.length > 1 || selectedCategory === 'tutte') ? (
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryHeaderTitle}>{cat.nome}</Text>
          </View>
        ) : null}
        <View style={styles.categoryDishes}>
          {cat.piatti.map(({ p, esito, tavolataInfo }) => (
            <DishCard
              key={p.id}
              piatto={p}
              esito={esito}
              restaurantCode={codice}
              tavolataInfo={tavolataInfo}
            />
          ))}
        </View>
      </View>
    ));
  };

  const renderEmpty = (stato: Filtro) => (
    <View style={styles.emptyWrap}>
      <Ionicons name="restaurant-outline" size={28} color={colors.onSurfaceMuted} />
      <Text style={styles.emptyTitle}>{isIt ? 'Nessun piatto qui' : 'No dishes here'}</Text>
      <Text style={styles.empty}>
        {isIt
          ? 'Scorri a destra o sinistra per le altre sezioni, o cambia categoria.'
          : 'Swipe left or right for other sections, or change category.'}
      </Text>
      {stato !== 'verde' ? (
        <Pressable
          onPress={() => {
            setSelectedCategory('tutte');
            handleFiltroChange('verde');
          }}
          style={styles.emptyReset}
          hitSlop={8}
        >
          <Text style={styles.emptyResetText}>{isIt ? 'Mostra idonei' : 'Show suitable'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen edges={false} style={styles.page}>
      {showPromo && promoTitle && promoBody ? (
        <View style={styles.promoOverlay}>
          <View style={styles.promoCard}>
            <Text style={styles.promoIcon}>📢</Text>
            <Text style={styles.promoBadge}>Comunicazione del locale</Text>
            <Text style={styles.promoTitle}>{promoTitle}</Text>
            <Text style={styles.promoBodyText}>{promoBody}</Text>
            <TouchableOpacity style={styles.promoCloseButton} onPress={() => setShowPromo(false)}>
              <Text style={styles.promoCloseButtonText}>Ho capito</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('offline_warning', language)}</Text>
        </View>
      ) : null}

      <GlassScreenScroll
        headerFloat={false}
        showsVerticalScrollIndicator={false}
        insetBottom={90}
        contentContainerStyle={styles.scrollContent}
      >
        <VenueHero
          name={menu.nome_ristorante}
          city={menu.citta}
          imageUrl={menu.image_url}
          photos={venuePhotos}
          menuAvailable={allergensPublished}
          isFavorite={isFav}
          onToggleFavorite={onToggleFavorite}
          onOpenMaps={
            (menu.latitude != null && menu.longitude != null) || menu.indirizzo || menu.citta
              ? openMaps
              : null
          }
          language={language || 'it'}
          showMenuControls={activeVenueTab === 'menu'}
          showFilters={activeVenueTab === 'menu' && allergensPublished}
          allergiesEmpty={allergie.length === 0}
          onSetAllergies={() => router.push('/allergie')}
          filtro={filtro}
          onFiltroChange={handleFiltroChange}
          counts={{ verde: conta('verde'), giallo: conta('giallo'), rosso: conta('rosso') }}
          menuTabs={menu.menus}
          activeMenuId={activeMenuId}
          onMenuChange={setActiveMenuId}
          categories={dishCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          backHint={activeVenueTab !== 'menu'}
          onPressTitle={() => setActiveVenueTab('menu')}
        />

        {activeVenueTab === 'menu' && (
          <>
            {/* TAVOLATA FAMIGLIA MULTI-COMMENSALI */}
            {subProfiles.length > 0 && (
              <View style={styles.tavolataBar}>
                <View style={styles.tavolataHead}>
                  <Ionicons name="people-outline" size={16} color={colors.brandDark} />
                  <Text style={styles.tavolataTitle}>
                    {isIt ? 'Tavolata Famiglia (Filtro Incrociato)' : 'Family Table (Cross Filter)'}
                  </Text>
                </View>
                <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tavolataScroll}>
                  {availableCommensali.map((comm) => {
                    const isSelected = activeCommensali.some((c) => String(c.id) === String(comm.id));
                    return (
                      <Pressable
                        key={String(comm.id)}
                        style={[styles.commensaleChip, isSelected && styles.commensaleChipActive]}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setTavolataActiveIds((prev) => {
                            const current = prev.length === 0 ? [String(activeCommensali[0]?.id || 'primary')] : prev;
                            const idStr = String(comm.id);
                            if (current.includes(idStr)) {
                              if (current.length === 1) return current;
                              return current.filter((x) => x !== idStr);
                            }
                            return [...current, idStr];
                          });
                        }}
                      >
                        <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={13} color={isSelected ? "#FFF" : "#6B6690"} />
                        <Text style={[styles.commensaleText, isSelected && styles.commensaleTextActive]}>
                          {comm.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </GHScrollView>
              </View>
            )}

            {menuGroups.length > 1 ? (
              <View style={styles.menuGroupRow}>
                {menuGroups.map((g) => {
                  const active = selectedGroup === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setSelectedGroup(g)}
                      style={[styles.menuGroupChip, active && styles.menuGroupChipOn]}
                      activeOpacity={0.88}
                    >
                      <Text style={[styles.menuGroupChipText, active && styles.menuGroupChipTextOn]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {!allergensPublished ? (
              <MenuUnavailableCard
                isIt={isIt}
                venueName={menu.nome_ristorante}
                onCallStaff={menu.telefono ? () => Linking.openURL(`tel:${menu.telefono}`) : undefined}
              />
            ) : (
              <View style={styles.semaforoPagerBleed}>
                <GHScrollView
                  ref={semaforoPagerRef}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  directionalLockEnabled
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onMomentumScrollEnd={onSemaforoPagerScrollEnd}
                  onScrollEndDrag={onSemaforoPagerScrollEnd}
                  style={styles.semaforoPager}
                >
                  {SEMAFORO_ORDER.map((stato) => {
                    const items = filterItems(stato);
                    return (
                      <View
                        key={stato}
                        style={[styles.semaforoPage, { width: semaforoPageWidth }]}
                      >
                        {stato === 'giallo' ? (
                          <View style={styles.staffHintRow}>
                            <Ionicons name="hand-left-outline" size={18} color={colors.amberText} />
                            <Text style={styles.staffHintText}>
                              {isIt
                                ? 'Giallo = possibili tracce. Chiedi sempre conferma allo staff prima di ordinare.'
                                : 'Yellow = possible traces. Always ask staff before ordering.'}
                            </Text>
                          </View>
                        ) : null}
                        {items.length === 0 ? (
                          renderEmpty(stato)
                        ) : (
                          <View style={styles.menuList}>
                            {renderDishGroups(items)}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </GHScrollView>
              </View>
            )}
          </>
        )}

        {activeVenueTab === 'info' && (
          <View style={{ gap: spacing.md }}>
            {renderVenueInfo()}
            <MenuReviewsSection
              menu={menu}
              language={language}
              canSubmit={canReview}
              state={reviewState}
            />
          </View>
        )}
      </GlassScreenScroll>

      <VenueBottomBar
        active={activeVenueTab}
        onChange={setActiveVenueTab}
        language={language}
        activeStatus={allergensPublished ? filtro : null}
        onStatusChange={(s) => {
          if (!allergensPublished) return;
          handleFiltroChange(s);
          if (activeVenueTab !== 'menu') setActiveVenueTab('menu');
        }}
        counts={{
          verde: conta('verde'),
          giallo: conta('giallo'),
          rosso: conta('rosso'),
        }}
        venueName={menu.nome_ristorante}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 90,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  semaforoPagerBleed: {
    alignSelf: 'stretch',
    marginHorizontal: -SCREEN_PADDING_H,
  },
  semaforoPager: {
    width: '100%',
  },
  semaforoPage: {
    paddingHorizontal: SCREEN_PADDING_H,
    gap: spacing.sm,
  },
  menuList: {
    gap: 16,
  },
  categorySection: {
    gap: 8,
  },
  categoryHeader: {
    gap: 8,
    paddingHorizontal: spacing.md + 2,
    paddingTop: 16,
    paddingBottom: 4,
  },
  categoryHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  categoryDishes: {
    gap: 10,
  },
  staffHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  staffHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.amberText,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
  },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.onSurfaceMuted,
  },
  emptyReset: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.greenSoft,
  },
  emptyResetText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.green,
  },
  menuGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuGroupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuGroupChipOn: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand200,
  },
  menuGroupChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceMuted,
  },
  menuGroupChipTextOn: {
    color: colors.brandDark,
  },
  infoSection: {
    gap: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 2,
    paddingBottom: 7,
  },
  infoTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.onSurface,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoList: {
    backgroundColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingHorizontal: 2,
    paddingVertical: 9,
  },
  infoAddressRow: {
    paddingBottom: 7,
  },
  infoLeadingIcon: {
    width: 21,
    marginLeft: 5,
  },
  infoContent: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 20,
  },
  infoLink: {
    color: colors.brandDark,
    textDecorationLine: 'underline',
    textDecorationColor: colors.brand200,
  },
  infoMuted: {
    color: colors.onSurfaceMuted,
  },
  infoDivider: {
    height: 1,
    marginLeft: 42,
    backgroundColor: colors.border,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.brand,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onBrand,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
    lineHeight: 17,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: 'rgba(18,10,36,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promoCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  promoIcon: { fontSize: 28 },
  promoBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand,
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
  },
  promoBodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceMuted,
  },
  promoCloseButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: colors.brand,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promoCloseButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  offlineBanner: {
    backgroundColor: colors.amberBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amberText,
    textAlign: 'center',
  },
  tavolataBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tavolataHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tavolataTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.onSurface,
  },
  tavolataScroll: {
    gap: 8,
  },
  commensaleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  commensaleChipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  commensaleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  commensaleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
