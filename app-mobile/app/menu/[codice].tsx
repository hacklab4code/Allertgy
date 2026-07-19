import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { toggleRestaurantFavorite } from '../../src/services/favorites';
import DishCard from '../../src/components/DishCard';
import MenuAnnotationsSection from '../../src/components/menu/MenuAnnotationsSection';
import MenuMatchingWarnings from '../../src/components/menu/MenuMatchingWarnings';
import MenuReviewsSection from '../../src/components/menu/MenuReviewsSection';
import { calcolaCompatibilita, compatibilitaColor } from '../../src/engine/compatibility';
import { moodFromMenuContext } from '../../src/experience/moodPalette';
import { calcolaSemaforo, type EsitoSemaforo } from '../../src/engine/semaforo';
import { useMenuAnnotations } from '../../src/hooks/useMenuAnnotations';
import { useMenuReviews } from '../../src/hooks/useMenuReviews';
import { useSession } from '../../src/store/session';
import { useExperienceMood } from '../../src/store/experienceMood';
import type { Menu, Piatto } from '../../src/types';
import { t, tSummary, tSection } from '../../src/engine/translations';
import { getLocaleForLang } from '../../src/constants/languages';
import { colors, MIN_TOUCH_TARGET, spacing, TAB_BAR_CLEARANCE } from '../../src/theme';
import {
  CollapseSection,
  ErrorStateCard,
  GlassCard,
  GlassCarousel,
  GlassScreenScroll,
  GlassBackButton,
  LoadingBlock,
  LiquidGlassView,
  PuffyButton,
  Screen,
  VenueBottomBar,
  type VenueTab,
} from '../../src/components/ui';
import { parseOpenStatus } from '../../src/utils/openHours';

type Filtro = 'tutti' | 'verde' | 'giallo' | 'rosso';

interface Valutato { p: Piatto; esito: EsitoSemaforo }

const SEZIONI: { stato: 'verde' | 'giallo' | 'rosso' }[] = [
  { stato: 'verde' },
  { stato: 'giallo' },
  { stato: 'rosso' },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { codice, promoTitle, promoBody } = useLocalSearchParams<{ codice: string; promoTitle?: string; promoBody?: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('tutti');
  const [activeVenueTab, setActiveVenueTab] = useState<VenueTab>('menu');
  const [semaforoExpanded, setSemaforoExpanded] = useState<Record<'verde' | 'giallo' | 'rosso', boolean>>({
    verde: true,
    giallo: false,
    rosso: false,
  });
  const [showPromo, setShowPromo] = useState(!!(promoTitle && promoBody));
  const [isOffline, setIsOffline] = useState(false);
  const { 
    allergie: primaryAllergies, addRecent, favorites, language, 
    ingredientiEsclusi, token, role, subProfiles, activeProfileId 
  } = useSession();

  // Find active profile
  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find(p => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) {
      return activeProfile.allergens.map(a => a.code);
    }
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);
  const isFav = !!codice && favorites.some((f) => f.code === codice);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const canReview = !!token && role === 'customer';

  const annotationState = useMenuAnnotations(codice, allergie);
  const reviewState = useMenuReviews(codice, language);
  const setLiveMood = useExperienceMood((s) => s.setLiveMood);

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
      AsyncStorage.setItem(`menu_cache_${codice}`, JSON.stringify(m)).catch(() => {});
      addRecent(codice, m.nome_ristorante);
      setIsOffline(false);
    } catch (e) {
      try {
        const cachedJson = await AsyncStorage.getItem(`menu_cache_${codice}`);
        if (cachedJson) {
          setMenu(JSON.parse(cachedJson));
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

  // Seleziona il primo menù quando cambia ristorante
  useEffect(() => {
    if (menu && menu.menus && menu.menus.length > 0) {
      if (!activeMenuId || !menu.menus.some(x => x.id === activeMenuId)) {
        setActiveMenuId(menu.menus[0].id);
      }
    } else {
      setActiveMenuId(null);
    }
  }, [menu]);

  const valutati: Valutato[] = useMemo(() => {
    if (!menu) return [];
    const filteredPiatti = activeMenuId
      ? menu.piatti.filter((p) => p.menu_id === activeMenuId)
      : menu.piatti;
    return filteredPiatti.map((p) => ({ p, esito: calcolaSemaforo(allergie, p, ingredientiEsclusi) }));
  }, [menu, activeMenuId, allergie, ingredientiEsclusi]);

  // Calcolo percentuale compatibilità
  const compat = useMemo(() => {
    if (!menu || menu.piatti.length === 0) return null;
    const filteredPiatti = activeMenuId
      ? menu.piatti.filter((p) => p.menu_id === activeMenuId)
      : menu.piatti;
    return calcolaCompatibilita(allergie, filteredPiatti, ingredientiEsclusi);
  }, [menu, activeMenuId, allergie, ingredientiEsclusi]);

  const compatColor = compat ? compatibilitaColor(compat.percentuale) : 'grigio';
  const compatRingColor = compatColor === 'verde' ? colors.green
    : compatColor === 'giallo' ? colors.amber
    : compatColor === 'rosso' ? colors.red
    : colors.textMuted;
  const compatRingBg = compatColor === 'verde' ? colors.greenBg
    : compatColor === 'giallo' ? colors.amberBg
    : compatColor === 'rosso' ? colors.redBg
    : colors.surfaceAlt;

  const menuAtmosphere = useMemo(
    () => moodFromMenuContext({
      filtro,
      percentuale: compat?.percentuale,
      expandedSections: semaforoExpanded,
    }),
    [filtro, compat?.percentuale, semaforoExpanded],
  );

  useEffect(() => {
    if (!menu) return;
    setLiveMood(menuAtmosphere === 'brand' ? null : menuAtmosphere);
    return () => setLiveMood(null);
  }, [menu, menuAtmosphere, setLiveMood]);

  const menuGroups = useMemo(() => {
    if (!menu) return [];
    const filteredPiatti = activeMenuId
      ? menu.piatti.filter((p) => p.menu_id === activeMenuId)
      : menu.piatti;
    const groups = Array.from(new Set(filteredPiatti.map((p) => p.menu_group || 'Principale')));
    return groups;
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

  const conta = (s: 'verde' | 'giallo' | 'rosso') =>
    valutatiFiltrati.filter((v) => v.esito.stato === s).length;

  const piattiConFiltro = useMemo(() => {
    if (filtro === 'tutti') return valutatiFiltrati;
    return valutatiFiltrati.filter((v) => v.esito.stato === filtro);
  }, [valutatiFiltrati, filtro]);

  const filterStickyIndex = useMemo(() => {
    let idx = 2;
    if (menu && menu.piatti.length > 0) idx += 1;
    if (menuGroups.length > 1) idx += 1;
    return idx;
  }, [menu, menuGroups.length]);

  const warningCount = annotationState.matchingWarnings.length + annotationState.annotations.length;

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
    return (
      <GlassCard padded={false}>
        <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>🏠 {t('restaurant_info', language)}</Text>
          {openStatus !== 'unknown' && (
            <View style={[styles.openBadge, { backgroundColor: openBg, borderColor: openBorder }]}>
              <Text style={[styles.openBadgeText, { color: openColor }]}>
                {openStatus === 'open' ? t('open_now', language) : t('closed_now', language)}
              </Text>
            </View>
          )}
        </View>

        {menu.citta && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🌆</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('address', language)}</Text>
              <Text style={styles.infoValue}>{menu.indirizzo ? `${menu.indirizzo}, ${menu.citta}` : menu.citta}</Text>
            </View>
          </View>
        )}

        {menu.indirizzo && !menu.citta && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('address', language)}</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(
                  `https://maps.google.com/?q=${encodeURIComponent(menu.indirizzo!)}`
                )}
              >
                <Text style={[styles.infoValue, styles.infoLink]}>{menu.indirizzo}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {menu.indirizzo && menu.citta && (
          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={() => Linking.openURL(
              `https://maps.google.com/?q=${encodeURIComponent(`${menu.indirizzo}, ${menu.citta}`)}`
            )}
          >
            <Text style={styles.mapsBtnText}>🗺️ {language === 'it' ? 'Apri in Maps' : 'Open in Maps'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('opening_hours', language)}</Text>
            {menu.orari_apertura ? (
              <Text style={styles.infoValue}>{menu.orari_apertura}</Text>
            ) : (
              <Text style={[styles.infoValue, styles.infoMuted]}>{t('hours_unknown', language)}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('phone', language)}</Text>
            {menu.telefono ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${menu.telefono}`)}>
                <Text style={[styles.infoValue, styles.infoLink]}>{menu.telefono}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoValue, styles.infoMuted]}>—</Text>
            )}
          </View>
        </View>

        {menu.email_contatto && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${menu.email_contatto}`)}>
                <Text style={[styles.infoValue, styles.infoLink]}>{menu.email_contatto}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {menu.aggiornato_il && (
          <View style={[styles.infoRow, { marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={styles.infoIcon}>🔄</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {t('last_update', language)}{' '}
                {new Date(menu.aggiornato_il).toLocaleDateString(getLocaleForLang(language), {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}
        </View>
      </GlassCard>
    );
  };

  const FilterChip = ({ f, label }: { f: Filtro; label: string }) => {
    const active = filtro === f;
    const dotColor = f === 'verde' ? colors.green
      : f === 'giallo' ? colors.amber
      : f === 'rosso' ? colors.red
      : null;
    return (
      <TouchableOpacity
        style={[styles.fchip, active && styles.fchipOn]}
        onPress={() => setFiltro(f)}
        activeOpacity={0.85}
      >
        <LiquidGlassView
          glassStyle={active ? 'regular' : 'clear'}
          tintColor={active ? 'rgba(210, 195, 246, 0.30)' : 'rgba(255,255,255,0.38)'}
          fallbackIntensity={active ? 74 : 62}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.fchipInner}>
          {dotColor ? <View style={[styles.fchipDot, { backgroundColor: dotColor }]} /> : null}
          <Text style={[styles.fchipText, active && styles.fchipTextOn]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (error && !menu) {
    const isIt = (language || 'it').toLowerCase() === 'it';
    return (
      <Screen edges={false} ambient style={styles.page}>
        <GlassBackButton />
        <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
          <ErrorStateCard
            message={error}
            retryLabel={isIt ? 'Riprova' : 'Retry'}
            onRetry={loadMenu}
          />
          <PuffyButton
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
      <Screen edges={false} ambient style={styles.page}>
        <GlassBackButton />
        <LoadingBlock label={language === 'it' ? 'Caricamento menù…' : 'Loading menu…'} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  return (
    <Screen edges={false} ambient style={styles.page}>
      <GlassBackButton />
      {showPromo && promoTitle && promoBody && (
        <View style={styles.promoOverlay}>
          <View style={styles.promoCard}>
            <Text style={styles.promoIcon}>📢</Text>
            <Text style={styles.promoBadge}>Comunicazione del locale</Text>
            <Text style={styles.promoTitle}>{promoTitle}</Text>
            <ScrollView style={styles.promoBodyScroll} contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={styles.promoBodyText}>{promoBody}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.promoCloseButton} onPress={() => setShowPromo(false)}>
              <Text style={styles.promoCloseButtonText}>Ho capito</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {t('offline_warning', language)}
          </Text>
        </View>
      )}
      <GlassScreenScroll
        headerFloat={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_CLEARANCE,
          paddingTop: insets.top + 52,
        }}
        stickyHeaderIndices={activeVenueTab === 'menu' ? [filterStickyIndex] : undefined}
      >
        <GlassCard padded={false}>
        <View style={styles.compactHeader}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setActiveVenueTab('menu')}
            activeOpacity={activeVenueTab === 'menu' ? 1 : 0.75}
          >
            <Text style={styles.venueEyebrow}>
              {language === 'it' ? 'RISTORANTE' : 'RESTAURANT'}
            </Text>
            <Text style={styles.summaryTitle}>{menu.nome_ristorante}</Text>
            {menu.citta ? (
              <View style={styles.locationLine}>
                <Ionicons name="location-outline" size={14} color={colors.onSurfaceMuted} />
                <Text style={styles.compactSub}>{menu.citta}</Text>
              </View>
            ) : null}
            {activeVenueTab !== 'menu' ? (
              <Text style={styles.backToMenuHint}>
                {language === 'it' ? '← Torna al menù' : '← Back to menu'}
              </Text>
            ) : null}
          </TouchableOpacity>
          {compat ? (
            <View style={[styles.compatBadge, { backgroundColor: compatRingBg, borderColor: compatRingColor }]}>
              <Text style={[styles.compatPct, { color: compatRingColor, fontSize: 18 }]}>{compat.percentuale}%</Text>
              <Text style={[styles.compatBadgeLabel, { color: compatRingColor }]}>
                {language === 'it' ? 'compatibile' : 'compatible'}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favBtn} hitSlop={8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? colors.red : colors.onSurface}
            />
          </TouchableOpacity>
        </View>
        </GlassCard>

        {activeVenueTab === 'menu' && (
          <>
            <GlassCard padded={false}>
            <View style={styles.safetyBlock}>
              {menu.safety_notice ? (
                <View style={styles.safetyNoticeBanner}>
                  <Text style={styles.safetyNoticeText}>⚠️ {menu.safety_notice}</Text>
                </View>
              ) : null}
              <View style={styles.safetyTitleRow}>
                <View style={styles.safetyIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyTitle}>
                    {language === 'it' ? 'Il tuo semaforo' : 'Your safety overview'}
                  </Text>
                  <Text style={styles.safetySubtitle}>
                    {language === 'it'
                      ? 'Calcolato sul profilo allergie attivo'
                      : 'Calculated from your active allergy profile'}
                  </Text>
                </View>
              </View>
              {allergie.length === 0 && (
                <TouchableOpacity
                  style={styles.emptyProfileWarning}
                  onPress={() => router.push('/allergie')}
                  activeOpacity={0.9}
                >
                  <Text style={styles.emptyProfileIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyProfileTitle}>
                      {language === 'it' ? 'Imposta allergie per vedere il vero semaforo' : 'Set allergies to see the real traffic light'}
                    </Text>
                    <Text style={styles.emptyProfileText}>
                      {language === 'it'
                        ? 'Senza profilo, il verde indica solo che non hai ancora selezionato cosa evitare.'
                        : 'Without a profile, green only means you have not selected what to avoid yet.'}
                    </Text>
                  </View>
                  <Text style={styles.emptyProfileAction}>{language === 'it' ? 'Imposta' : 'Set'}</Text>
                </TouchableOpacity>
              )}

              {menu.menus && menu.menus.length > 0 && (
                <>
                  <Text style={styles.contextLabel}>{language === 'it' ? 'Scegli menu' : 'Choose menu'}</Text>
                  <GlassCarousel
                    contentContainerStyle={styles.menuTabsContainer}
                    style={{ marginVertical: 8 }}
                  >
                    {menu.menus.map((m) => {
                      const isActive = activeMenuId === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setActiveMenuId(m.id)}
                          style={[styles.menuTabButton, isActive && styles.menuTabButtonActive]}
                          activeOpacity={0.85}
                        >
                          <LiquidGlassView
                            glassStyle={isActive ? 'regular' : 'clear'}
                            tintColor={isActive ? 'rgba(210, 195, 246, 0.34)' : 'rgba(255,255,255,0.42)'}
                            fallbackIntensity={isActive ? 76 : 64}
                            style={StyleSheet.absoluteFill}
                          />
                          <Text style={[styles.menuTabButtonText, isActive && styles.menuTabButtonTextActive]}>
                            {m.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </GlassCarousel>
                </>
              )}

              {compat && (
                <View style={styles.compatSection}>
                  <Text style={styles.contextLabel}>{language === 'it' ? 'Riepilogo sicurezza' : 'Safety summary'}</Text>
                  <View style={styles.compatBar}>
                    {compat.verde > 0 && (
                      <View style={[
                        styles.compatBarSegment,
                        { flex: compat.verde, backgroundColor: colors.green, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, ...(compat.giallo === 0 && compat.rosso === 0 ? { borderTopRightRadius: 6, borderBottomRightRadius: 6 } : {}) },
                      ]} />
                    )}
                    {compat.giallo > 0 && (
                      <View style={[
                        styles.compatBarSegment,
                        { flex: compat.giallo, backgroundColor: colors.amber, ...(compat.verde === 0 ? { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 } : {}), ...(compat.rosso === 0 ? { borderTopRightRadius: 6, borderBottomRightRadius: 6 } : {}) },
                      ]} />
                    )}
                    {compat.rosso > 0 && (
                      <View style={[
                        styles.compatBarSegment,
                        { flex: compat.rosso, backgroundColor: colors.red, borderTopRightRadius: 6, borderBottomRightRadius: 6, ...(compat.verde === 0 && compat.giallo === 0 ? { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 } : {}) },
                      ]} />
                    )}
                  </View>
                  <View style={styles.compatLegend}>
                    <Text style={styles.compatLegendItem}>🟢 {compat.verde} {t('safe_dishes', language)}</Text>
                    <Text style={styles.compatLegendItem}>🟡 {compat.giallo} {t('traces_dishes', language)}</Text>
                    <Text style={styles.compatLegendItem}>🔴 {compat.rosso} {t('avoid_dishes', language)}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.summaryText}>
                {tSummary(language, conta('verde'), conta('giallo'), conta('rosso'))}
              </Text>
              <Text style={styles.reminder}>{t('reminder', language)}</Text>
            </View>
            </GlassCard>

            {menu.piatti.length > 0 && (
              <View style={styles.menuSectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="restaurant-outline" size={18} color={colors.brand} />
                </View>
                <Text style={styles.menuSectionTitle}>{t('menu_section', language)}</Text>
              </View>
            )}

            {menuGroups.length > 1 && (
              <GlassCard padded={false}>
              <View style={styles.groupTabsContainer}>
                <Text style={styles.groupTabsLabel}>{language === 'it' ? 'Categorie del menu' : 'Menu categories'}</Text>
                <GlassCarousel contentContainerStyle={styles.groupTabsScroll}>
                  {menuGroups.map((g) => {
                    const active = selectedGroup === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setSelectedGroup(g)}
                        style={[styles.groupTab, active && styles.groupTabActive]}
                        activeOpacity={0.85}
                      >
                        {active ? (
                          <LiquidGlassView
                            glassStyle="regular"
                            tintColor="rgba(210, 195, 246, 0.24)"
                            fallbackIntensity={70}
                            style={StyleSheet.absoluteFill}
                          />
                        ) : null}
                        <Text style={[styles.groupTabText, active && styles.groupTabTextActive]}>
                          {g.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </GlassCarousel>
              </View>
              </GlassCard>
            )}

            <GlassCard padded={false} style={styles.filtersCard}>
              <View style={styles.filters}>
                <Text style={styles.filterLabel}>{language === 'it' ? 'Filtra per semaforo' : 'Filter by traffic light'}</Text>
                <FilterChip f="tutti" label={`${t('all', language)} (${valutatiFiltrati.length})`} />
                <FilterChip f="verde" label={`${t('yes', language)} (${conta('verde')})`} />
                <FilterChip f="giallo" label={`${conta('giallo')}`} />
                <FilterChip f="rosso" label={`${t('no', language)} (${conta('rosso')})`} />
              </View>
            </GlassCard>

            {SEZIONI.filter((s) => filtro === 'tutti' || filtro === s.stato).map((sez) => {
              const items = valutatiFiltrati.filter((v) => v.esito.stato === sez.stato);
              if (items.length === 0) return null;

              const categorie: { nome: string; piatti: Valutato[] }[] = [];
              for (const it of items) {
                const nome = it.p.categoria?.trim() || t('other', language);
                const g = categorie.find((c) => c.nome === nome);
                g ? g.piatti.push(it) : categorie.push({ nome, piatti: [it] });
              }

              const icon = sez.stato === 'verde' ? 'checkmark-circle' as const
                : sez.stato === 'giallo' ? 'warning' as const
                : 'close-circle' as const;
              const iconBg = sez.stato === 'verde' ? colors.greenBg
                : sez.stato === 'giallo' ? colors.amberBg
                : colors.redBg;
              const iconColor = sez.stato === 'verde' ? colors.green
                : sez.stato === 'giallo' ? colors.amber
                : colors.red;
              return (
                <CollapseSection
                  key={sez.stato}
                  icon={icon}
                  iconBg={iconBg}
                  iconColor={iconColor}
                  tint={sez.stato === 'verde' ? 'green' : sez.stato === 'giallo' ? 'yellow' : 'red'}
                  title={tSection(sez.stato, 'title', language)}
                  preview={tSection(sez.stato, 'sub', language)}
                  badge={items.length}
                  expanded={semaforoExpanded[sez.stato]}
                  onToggle={() => setSemaforoExpanded((prev) => ({ ...prev, [sez.stato]: !prev[sez.stato] }))}
                >
                  {categorie.map((cat) => (
                    <View key={cat.nome} style={styles.catBlock}>
                      {(categorie.length > 1 || (cat.nome !== 'Altro' && cat.nome !== 'Other')) && (
                        <Text style={styles.catTitle}>{cat.nome.toUpperCase()}</Text>
                      )}
                      {cat.piatti.map(({ p, esito }) => (
                        <DishCard key={p.id} piatto={p} esito={esito} />
                      ))}
                    </View>
                  ))}
                </CollapseSection>
              );
            })}

            {piattiConFiltro.length === 0 && (
              <Text style={styles.empty}>
                {filtro === 'tutti'
                  ? t('empty_menu', language)
                  : filtro === 'verde'
                    ? (language === 'it' ? 'Nessun piatto compatibile al 100% in questa categoria.' : 'No fully compatible dishes in this category.')
                    : filtro === 'giallo'
                      ? (language === 'it' ? 'Nessun piatto con sole tracce in questa categoria.' : 'No trace-only dishes in this category.')
                      : (language === 'it' ? 'Nessun piatto non idoneo in questa categoria.' : 'No unsuitable dishes in this category.')}
              </Text>
            )}
          </>
        )}

        {activeVenueTab === 'warning' && (
          <>
            <GlassCard padded={false}>
            <View style={styles.safetyBlock}>
              {menu.safety_notice ? (
                <View style={styles.safetyNoticeBanner}>
                  <Text style={styles.safetyNoticeText}>⚠️ {menu.safety_notice}</Text>
                </View>
              ) : null}
              {compat && (
                <View style={styles.compatSection}>
                  <Text style={styles.contextLabel}>{language === 'it' ? 'Riepilogo sicurezza' : 'Safety summary'}</Text>
                  <View style={styles.compatLegend}>
                    <Text style={styles.compatLegendItem}>🟢 {compat.verde} {t('safe_dishes', language)}</Text>
                    <Text style={styles.compatLegendItem}>🟡 {compat.giallo} {t('traces_dishes', language)}</Text>
                    <Text style={styles.compatLegendItem}>🔴 {compat.rosso} {t('avoid_dishes', language)}</Text>
                  </View>
                </View>
              )}
              <Text style={styles.reminder}>{t('reminder', language)}</Text>
              <MenuMatchingWarnings warnings={annotationState.matchingWarnings} language={language} />
            </View>
            </GlassCard>
            <MenuAnnotationsSection
              language={language}
              allergie={allergie}
              canSubmit={canReview}
              state={annotationState}
            />
          </>
        )}

        {activeVenueTab === 'esperienza' && (
          <MenuReviewsSection
            menu={menu}
            language={language}
            canSubmit={canReview}
            state={reviewState}
          />
        )}

        {activeVenueTab === 'info' && renderVenueInfo()}
      </GlassScreenScroll>

      <VenueBottomBar
        active={activeVenueTab}
        onChange={setActiveVenueTab}
        language={language}
        warningCount={warningCount}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  menuTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuTabButton: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(210, 195, 246, 0.55)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  menuTabButtonActive: {
    borderColor: 'rgba(54, 37, 92, 0.32)',
  },
  menuTabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceMuted,
    zIndex: 2,
  },
  menuTabButtonTextActive: {
    color: colors.brandDark,
  },
  // Compatibilità
  compatSection: {
    marginTop: 12,
    gap: 8,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.brandDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 10,
  },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  compatPct: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  compatBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  compatLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  compatBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  compatBarSegment: {
    height: 8,
  },
  compatLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  compatLegendItem: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Info Locale
  infoCard: {
    padding: 16,
    gap: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  openBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 17,
    marginTop: 1,
    width: 24,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: '600',
    lineHeight: 19,
  },
  infoLink: {
    color: colors.brand,
    textDecorationLine: 'underline',
  },
  infoMuted: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  mapsBtn: {
    backgroundColor: colors.brand50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand200,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandDark,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: 12,
  },
  menuSectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },

  offlineBanner: {
    backgroundColor: colors.yellowSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.amberBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: colors.amberText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: {
    paddingBottom: 40,
  },
  page: { flex: 1, backgroundColor: 'transparent' },
  backToMenuHint: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
    marginTop: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
  },
  venueEyebrow: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  compactSub: { fontSize: 13, color: colors.onSurfaceMuted, fontWeight: '600' },
  favBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: colors.red, textAlign: 'center', fontSize: 16 },
  safetyBlock: {
    padding: 18,
    gap: 12,
  },
  safetyNoticeBanner: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 12,
    padding: 12,
  },
  safetyNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amberText,
    lineHeight: 17,
  },
  safetyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  safetyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
  safetyTitle: { fontSize: 16, fontWeight: '900', color: colors.onSurface },
  safetySubtitle: { fontSize: 11, fontWeight: '600', color: colors.onSurfaceMuted, marginTop: 1 },
  summary: {
    backgroundColor: colors.surfaceSecondary, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontWeight: '900', fontSize: 22, color: colors.onSurface, flex: 1, letterSpacing: -0.5 },
  emptyProfileWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 14,
    padding: 12,
  },
  emptyProfileIcon: { fontSize: 18 },
  emptyProfileTitle: { color: colors.amberText, fontWeight: '900', fontSize: 12 },
  emptyProfileText: { color: colors.amberText, fontWeight: '600', fontSize: 11, marginTop: 2, lineHeight: 15 },
  emptyProfileAction: { color: colors.amberText, fontWeight: '900', fontSize: 12 },
  catBlock: { gap: 8 },
  catTitle: {
    fontSize: 11, fontWeight: '900', color: colors.textMuted,
    letterSpacing: 1, marginTop: 16, marginBottom: 8,
  },
  summaryText: { color: colors.inkSoft, marginTop: 4, lineHeight: 20, fontSize: 13, fontWeight: '600' },
  reminder: { fontSize: 12, color: colors.onSurfaceMuted, marginTop: 2, fontWeight: '600', lineHeight: 17 },
  filtersCard: {
    marginHorizontal: 0,
    backgroundColor: colors.surface,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  filterLabel: {
    width: '100%',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
    zIndex: 2,
  },
  fchip: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(210, 195, 246, 0.70)',
    borderRadius: 999,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  fchipOn: { borderColor: 'rgba(54, 37, 92, 0.34)' },
  fchipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
    paddingHorizontal: 4,
  },
  fchipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fchipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  fchipTextOn: { color: colors.brandDark, fontWeight: '800' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: colors.onSurfaceMuted, marginBottom: 10, marginTop: 3 },
  empty: { textAlign: 'center', color: colors.onSurfaceMuted, marginTop: 40 },
  groupTabsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  groupTabsLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  groupTabsScroll: {
    paddingHorizontal: 8,
    gap: 8,
  },
  groupTab: {
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(210, 195, 246, 0.55)',
  },
  groupTabActive: {
    borderColor: 'rgba(54, 37, 92, 0.30)',
    backgroundColor: 'transparent',
  },
  groupTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    zIndex: 2,
  },
  groupTabTextActive: {
    color: colors.brandDark,
  },
  // Overlay Promozionale
  promoOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  promoCard: {
    width: '105%',
    maxWidth: 340,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '80%',
  },
  promoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  promoBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandDark,
    backgroundColor: colors.brand50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 24,
  },
  promoBodyScroll: {
    width: '100%',
    marginBottom: 20,
  },
  promoBodyText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  promoCloseButton: {
    width: '100%',
    backgroundColor: colors.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  promoCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  




});
