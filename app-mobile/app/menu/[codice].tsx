import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { api } from '../../src/api/client';
import DishCard from '../../src/components/DishCard';
import MenuAnnotationsSection from '../../src/components/menu/MenuAnnotationsSection';
import MenuMatchingWarnings from '../../src/components/menu/MenuMatchingWarnings';
import MenuReviewsSection from '../../src/components/menu/MenuReviewsSection';
import { calcolaCompatibilita, compatibilitaColor } from '../../src/engine/compatibility';
import { calcolaSemaforo, type EsitoSemaforo } from '../../src/engine/semaforo';
import { useMenuAnnotations } from '../../src/hooks/useMenuAnnotations';
import { useMenuReviews } from '../../src/hooks/useMenuReviews';
import { useSession } from '../../src/store/session';
import type { Menu, Piatto } from '../../src/types';
import { t, tSummary, tSection } from '../../src/engine/translations';
import { getLocaleForLang } from '../../src/constants/languages';
import DetailSection from '../../src/components/DetailSection';
import { colors } from '../../src/theme';

import { parseOpenStatus } from '../../src/utils/openHours';

type Filtro = 'tutti' | 'verde' | 'giallo' | 'rosso';

interface Valutato { p: Piatto; esito: EsitoSemaforo }

const SEZIONI: { stato: 'verde' | 'giallo' | 'rosso' }[] = [
  { stato: 'verde' },
  { stato: 'giallo' },
  { stato: 'rosso' },
];

export default function MenuScreen() {
  const { codice, promoTitle, promoBody } = useLocalSearchParams<{ codice: string; promoTitle?: string; promoBody?: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('tutti');
  const [showPromo, setShowPromo] = useState(!!(promoTitle && promoBody));
  const [isOffline, setIsOffline] = useState(false);
  const { 
    allergie: primaryAllergies, addRecent, toggleFavorite, favorites, language, 
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

  const onToggleFavorite = () => {
    if (!codice || !menu) return;
    const wasFav = isFav;
    toggleFavorite(codice, menu.nome_ristorante);
    // Sincronizza col server (best-effort): abilita le notifiche "menù aggiornato"
    if (token) {
      (wasFav ? api.removeFavorite(codice) : api.addFavorite(codice)).catch(() => {});
    }
  };

  useEffect(() => {
    if (!codice) return;
    api.menu(codice)
      .then((m) => {
        setMenu(m);
        AsyncStorage.setItem(`menu_cache_${codice}`, JSON.stringify(m)).catch(() => {});
        addRecent(codice, m.nome_ristorante);
        setIsOffline(false);
      })
      .catch(async (e) => {
        try {
          const cachedJson = await AsyncStorage.getItem(`menu_cache_${codice}`);
          if (cachedJson) {
            const cachedMenu = JSON.parse(cachedJson);
            setMenu(cachedMenu);
            setIsOffline(true);
            return;
          }
        } catch (cacheErr) {
          console.warn("Errore lettura cache locale:", cacheErr);
        }
        setError(e.message);
      });
  }, [codice, language]);

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

  const FilterChip = ({ f, label }: { f: Filtro; label: string }) => (
    <TouchableOpacity
      style={[styles.fchip, filtro === f && styles.fchipOn]}
      onPress={() => setFiltro(f)}
    >
      <Text style={[styles.fchipText, filtro === f && styles.fchipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!menu) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#059669" />;

  return (
    <>
      <Stack.Screen options={{ title: menu.nome_ristorante }} />
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
      <ScrollView contentContainerStyle={styles.container} stickyHeaderIndices={[menuGroups.length > 1 ? 2 : 1]}>
        {/* Riepilogo con percentuale compatibilità */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>{menu.nome_ristorante}{menu.citta ? ` · ${menu.citta}` : ''}</Text>
            <TouchableOpacity onPress={onToggleFavorite}>
              <Text style={{ fontSize: 22 }}>{isFav ? '⭐️' : '☆'}</Text>
            </TouchableOpacity>
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

          {/* Selettore Multi-menù */}
          {menu.menus && menu.menus.length > 0 && (
            <>
              <Text style={styles.contextLabel}>{language === 'it' ? 'Scegli menu' : 'Choose menu'}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
                    >
                      <Text style={[styles.menuTabButtonText, isActive && styles.menuTabButtonTextActive]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Indicatore % compatibilità */}
          {compat && (
            <View style={styles.compatSection}>
              <Text style={styles.contextLabel}>{language === 'it' ? 'Riepilogo sicurezza' : 'Safety summary'}</Text>
              <View style={[styles.compatBadge, { backgroundColor: compatRingBg, borderColor: compatRingColor }]}>
                <Text style={[styles.compatPct, { color: compatRingColor }]}>{compat.percentuale}%</Text>
                <Text style={[styles.compatLabel, { color: compatRingColor }]}>
                  {t('compatible', language)}
                </Text>
              </View>
              {/* Barra proporzionale verde/giallo/rosso */}
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

          <MenuMatchingWarnings warnings={annotationState.matchingWarnings} />
        </View>

        {/* ── Info Locale ── */}
        <DetailSection
          title={language === 'it' ? 'INFO LOCALE' : 'VENUE INFO'}
          subtitle={language === 'it' ? 'Contatti, posizione e orari del ristorante.' : 'Venue contact details, location, and opening hours.'}
          card={false}
        />
        {(() => {
          const openStatus = parseOpenStatus(menu.orari_apertura);
          const openColor = openStatus === 'open' ? '#16a34a'
            : openStatus === 'closed' ? '#dc2626'
            : '#94a3b8';
          const openBg = openStatus === 'open' ? '#f0fdf4'
            : openStatus === 'closed' ? '#fef2f2'
            : '#f8fafc';
          const openBorder = openStatus === 'open' ? '#bbf7d0'
            : openStatus === 'closed' ? '#fecaca'
            : '#e2e8f0';
          return (
            <View style={styles.infoCard}>
              {/* Header sezione */}
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

              {/* Città (sempre presente) */}
              {menu.citta && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🌆</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('address', language)}</Text>
                    <Text style={styles.infoValue}>{menu.indirizzo ? `${menu.indirizzo}, ${menu.citta}` : menu.citta}</Text>
                  </View>
                </View>
              )}

              {/* Indirizzo cliccabile su maps (solo se diverso dalla città) */}
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

              {/* Link Google Maps se abbiamo indirizzo + città */}
              {menu.indirizzo && menu.citta && (
                <TouchableOpacity
                  style={styles.mapsBtn}
                  onPress={() => Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(`${menu.indirizzo}, ${menu.citta}`)}`
                  )}
                >
                  <Text style={styles.mapsBtnText}>🗺️ Apri in Maps</Text>
                </TouchableOpacity>
              )}

              {/* Orari */}
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

              {/* Telefono */}
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

              {/* Email */}
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

              {/* Data ultimo aggiornamento menù */}
              {menu.aggiornato_il && (
                <View style={[styles.infoRow, { marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                  <Text style={styles.infoIcon}>🔄</Text>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: '#94a3b8' }]}>
                      {t('last_update', language)}{' '}
                      {new Date(menu.aggiornato_il).toLocaleDateString(getLocaleForLang(language), {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })()}


        {/* Separatore sezione menù */}
        {menu.piatti.length > 0 && (
          <View style={styles.menuSectionHeader}>
            <Text style={styles.menuSectionTitle}>🍽️ {t('menu_section', language)}</Text>
          </View>
        )}

        {/* Schede Gruppi Menù (se multipli) */}
        {menuGroups.length > 1 && (
          <View style={styles.groupTabsContainer}>
            <Text style={styles.groupTabsLabel}>{language === 'it' ? 'Categorie del menu' : 'Menu categories'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupTabsScroll}>
              {menuGroups.map((g) => {
                const active = selectedGroup === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setSelectedGroup(g)}
                    style={[styles.groupTab, active && styles.groupTabActive]}
                  >
                    <Text style={[styles.groupTabText, active && styles.groupTabTextActive]}>
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Filtri (sticky) */}
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>{language === 'it' ? 'Filtra per semaforo' : 'Filter by traffic light'}</Text>
          <FilterChip f="tutti" label={`${t('all', language)} (${valutatiFiltrati.length})`} />
          <FilterChip f="verde" label={`🟢 ${t('yes', language)} (${conta('verde')})`} />
          <FilterChip f="giallo" label={`🟡 (${conta('giallo')})`} />
          <FilterChip f="rosso" label={`🔴 ${t('no', language)} (${conta('rosso')})`} />
        </View>


        {/* Sezioni: cosa puoi / attenzione / cosa non puoi, divise per categoria */}
        {SEZIONI.filter((s) => filtro === 'tutti' || filtro === s.stato).map((sez) => {
          const items = valutatiFiltrati.filter((v) => v.esito.stato === sez.stato);
          if (items.length === 0) return null;

          // raggruppa per categoria (antipasti, primi, ...) mantenendo l'ordine del menù
          const categorie: { nome: string; piatti: Valutato[] }[] = [];
          for (const it of items) {
            const nome = it.p.categoria?.trim() || t('other', language);
            const g = categorie.find((c) => c.nome === nome);
            g ? g.piatti.push(it) : categorie.push({ nome, piatti: [it] });
          }

          return (
            <View key={sez.stato} style={styles.section}>
              <Text style={styles.sectionTitle}>{tSection(sez.stato, 'title', language)} ({items.length})</Text>
              <Text style={styles.sectionSub}>{tSection(sez.stato, 'sub', language)}</Text>
              {categorie.map((cat) => (
                <View key={cat.nome}>
                  {(categorie.length > 1 || (cat.nome !== 'Altro' && cat.nome !== 'Other')) && (
                    <Text style={styles.catTitle}>{cat.nome.toUpperCase()}</Text>
                  )}
                  {cat.piatti.map(({ p, esito }) => (
                    <DishCard key={p.id} piatto={p} esito={esito} />
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        {valutatiFiltrati.length === 0 && (
          <Text style={styles.empty}>{t('empty_menu', language)}</Text>
        )}

        <MenuAnnotationsSection
          language={language}
          allergie={allergie}
          canSubmit={canReview}
          state={annotationState}
        />

        <MenuReviewsSection
          menu={menu}
          language={language}
          canSubmit={canReview}
          state={reviewState}
        />

      </ScrollView>
    </>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  menuTabButtonActive: {
    backgroundColor: '#0F8A6A',
    borderColor: '#0F8A6A',
  },
  menuTabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#596B63',
  },
  menuTabButtonTextActive: {
    color: '#FFFFFF',
  },
  // Compatibilità
  compatSection: {
    marginTop: 12,
    gap: 8,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 10,
  },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  compatPct: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    backgroundColor: '#e2e8f0',
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
    color: '#64748b',
  },

  // Info Locale
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
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
    color: '#10201B',
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
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 19,
  },
  infoLink: {
    color: '#059669',
    textDecorationLine: 'underline',
  },
  infoMuted: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  mapsBtn: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  menuSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  menuSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10201B',
    letterSpacing: -0.3,
  },

  offlineBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#dc2626', textAlign: 'center', fontSize: 16 },
  summary: {
    backgroundColor: '#f0fdf4', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#bbf7d0',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontWeight: '900', fontSize: 18, color: '#166534', flex: 1, letterSpacing: -0.3 },
  emptyProfileWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
  },
  emptyProfileIcon: { fontSize: 18 },
  emptyProfileTitle: { color: '#92400e', fontWeight: '900', fontSize: 12 },
  emptyProfileText: { color: '#b45309', fontWeight: '600', fontSize: 11, marginTop: 2, lineHeight: 15 },
  emptyProfileAction: { color: '#92400e', fontWeight: '900', fontSize: 12 },
  catTitle: {
    fontSize: 12, fontWeight: '800', color: '#94a3b8',
    letterSpacing: 1, marginTop: 16, marginBottom: 8,
  },
  summaryText: { color: '#14532d', marginTop: 6, lineHeight: 20, fontSize: 13, fontWeight: '500' },
  reminder: { fontSize: 12, color: '#15803d', marginTop: 8, fontWeight: '700' },
  filters: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  filterLabel: {
    width: '100%',
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  fchip: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  fchipOn: { borderColor: '#10b981', backgroundColor: '#e8f8ee' },
  fchipText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  fchipTextOn: { color: '#15803d', fontWeight: '800' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#64748b', marginBottom: 10, marginTop: 3 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  groupTabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  groupTabsLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  groupTabActive: {
    backgroundColor: '#e8f8ee',
    borderColor: '#22c55e',
  },
  groupTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  groupTabTextActive: {
    color: '#15803d',
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
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#6d28d9',
    backgroundColor: '#f5f3ff',
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
    color: '#0f172a',
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
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  promoCloseButton: {
    width: '100%',
    backgroundColor: '#10b981',
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
