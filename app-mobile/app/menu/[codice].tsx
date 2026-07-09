import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { api, type Review } from '../../src/api/client';
import DishCard from '../../src/components/DishCard';
import { calcolaCompatibilita, compatibilitaColor } from '../../src/engine/compatibility';
import { calcolaSemaforo, type EsitoSemaforo } from '../../src/engine/semaforo';
import { useSession } from '../../src/store/session';
import type { Menu, Piatto, CustomerAnnotation, Allergen } from '../../src/types';
import { t, tSummary, tSection } from '../../src/engine/translations';
import { getLocaleForLang } from '../../src/constants/languages';
import DetailSection from '../../src/components/DetailSection';
import { colors } from '../../src/theme';

type Filtro = 'tutti' | 'verde' | 'giallo' | 'rosso';

interface Valutato { p: Piatto; esito: EsitoSemaforo }

const SEZIONI: { stato: 'verde' | 'giallo' | 'rosso' }[] = [
  { stato: 'verde' },
  { stato: 'giallo' },
  { stato: 'rosso' },
];

/**
 * Semplice parser per determinare se il locale è aperto ora.
 * Legge orari nel formato "Lun-Ven 12:00-15:00, 19:00-23:00" ecc.
 * Restituisce: 'open' | 'closed' | 'unknown'
 */
function parseOpenStatus(orari: string | null | undefined): 'open' | 'closed' | 'unknown' {
  if (!orari || orari.trim() === '') return 'unknown';

  const now = new Date();
  const dayNames = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const dayNamesEn = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDayIt = dayNames[now.getDay()];
  const currentDayEn = dayNamesEn[now.getDay()];
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const toMin = (hhmm: string) => {
    const parts = hhmm.trim().split(':');
    if (parts.length < 2) return -1;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  // Cerca tutte le fasce orarie "HH:MM-HH:MM" nel testo
  const timeRangeRegex = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

  // Controlla se la riga/blocco di testo si riferisce al giorno corrente
  const lowerOrari = orari.toLowerCase();
  const relevantLines = orari.split(/[\n,;]+/).filter(line => {
    const low = line.toLowerCase();
    return (
      low.includes(currentDayIt) ||
      low.includes(currentDayEn) ||
      // Se non ci sono riferimenti a giorni specifici, include tutto
      (!/lun|mar|mer|gio|ven|sab|dom|mon|tue|wed|thu|fri|sat|sun/.test(low))
    );
  });

  const textToCheck = relevantLines.length > 0 ? relevantLines.join(' ') : orari;

  let match;
  const regex = new RegExp(timeRangeRegex.source, 'g');
  while ((match = regex.exec(textToCheck)) !== null) {
    const start = toMin(match[1]);
    const end = toMin(match[2]);
    if (start < 0 || end < 0) continue;
    // Gestisce fasce a cavallo della mezzanotte (es. 22:00-02:00)
    if (end < start) {
      if (currentMin >= start || currentMin <= end) return 'open';
    } else {
      if (currentMin >= start && currentMin <= end) return 'open';
    }
  }

  // Se abbiamo trovato orari ma nessuna fascia attiva → chiuso
  const hasAnyTime = /\d{1,2}:\d{2}/.test(textToCheck);
  if (hasAnyTime) return 'closed';
  return 'unknown';
}



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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [externalReviews, setExternalReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myRatingStaff, setMyRatingStaff] = useState(5);
  const [myRatingMenu, setMyRatingMenu] = useState(5);
  const [myRatingSafety, setMyRatingSafety] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewTab, setReviewTab] = useState<'allertgy' | 'google' | 'tripadvisor'>('allertgy');
  const canReview = !!token && role === 'customer';

  // Stati per annotazioni / warning dei clienti
  const [annotations, setAnnotations] = useState<CustomerAnnotation[]>([]);
  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  const [customAllergenSearch, setCustomAllergenSearch] = useState('');
  const [showAllAllergensDropdown, setShowAllAllergensDropdown] = useState(false);
  const [annotIngredient, setAnnotIngredient] = useState('');
  const [annotNotes, setAnnotNotes] = useState('');
  const [annotBusy, setAnnotBusy] = useState(false);

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

  useEffect(() => {
    if (!codice) return;
    api.listReviews(codice)
      .then((rs) => {
        setReviews(rs);
        const mine = rs.find((r) => r.is_mine);
        if (mine) {
          setMyRating(mine.rating);
          setMyRatingStaff(mine.rating_staff ?? 5);
          setMyRatingMenu(mine.rating_menu ?? 5);
          setMyRatingSafety(mine.rating_safety ?? 5);
          setMyComment(mine.comment ?? '');
        }
      })
      .catch(() => {});
    api.listExternalReviews(codice)
      .then(setExternalReviews)
      .catch(() => {});
    api.listAnnotations(codice)
      .then(setAnnotations)
      .catch(() => {});
    api.allergens()
      .then(setAllAllergens)
      .catch(() => {});
  }, [codice]);

  const submitAnnotation = async () => {
    if (!codice || !selectedAllergen || !annotNotes.trim()) return;
    setAnnotBusy(true);
    try {
      await api.createAnnotation(
        codice,
        selectedAllergen.id,
        annotIngredient.trim() || null,
        annotNotes.trim()
      );
      setAnnotations(await api.listAnnotations(codice));
      setAnnotIngredient('');
      setAnnotNotes('');
      setSelectedAllergen(null);
      Alert.alert(
        "Segnalazione inviata",
        "Grazie per aver condiviso questo warning! La tua annotazione aiuterà gli altri clienti con la stessa allergia."
      );
    } catch (e) {
      Alert.alert("Errore", (e as Error).message);
    }
    setAnnotBusy(false);
  };

  const matchingWarnings = useMemo(() => {
    return annotations.filter((a) => allergie.includes(a.allergen_code));
  }, [annotations, allergie]);

  const myAllergenList = useMemo(() => {
    return allAllergens.filter((a) => allergie.includes(a.code));
  }, [allAllergens, allergie]);

  const filteredAllAllergens = useMemo(() => {
    const q = customAllergenSearch.toLowerCase().trim();
    if (!q) return allAllergens;
    return allAllergens.filter((a) => a.name_it.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
  }, [allAllergens, customAllergenSearch]);

  const submitReview = async () => {
    if (!codice) return;
    setReviewBusy(true);
    try {
      const avg = Math.round((myRatingStaff + myRatingMenu + myRatingSafety) / 3);
      await api.upsertReview(codice, avg, myComment.trim(), myRatingStaff, myRatingMenu, myRatingSafety);
      setReviews(await api.listReviews(codice));
      Alert.alert(
        t('thank_you', language),
        t('review_published', language),
      );
    } catch (e) {
      Alert.alert(t('error', language), (e as Error).message);
    }
    setReviewBusy(false);
  };

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

          {/* Warning di altri clienti con le tue stesse allergie */}
          {matchingWarnings.length > 0 && (
            <View style={styles.matchingWarningsBox}>
              <Text style={styles.matchingWarningsHeader}>
                ⚠️ ATTENZIONE: Warning dai Clienti ({matchingWarnings.length})
              </Text>
              {matchingWarnings.map((w) => (
                <View key={w.id} style={styles.matchingWarningCard}>
                  <Text style={styles.matchingWarningTitle}>
                    {w.allergen_emoji} Allergia correlata: {w.allergen_name_it}
                  </Text>
                  {w.ingredient ? (
                    <Text style={styles.matchingWarningIngredient}>
                      Ingrediente: <Text style={{ fontWeight: '800', color: colors.redText }}>{w.ingredient}</Text>
                    </Text>
                  ) : null}
                  <Text style={styles.matchingWarningNotes}>"{w.notes}"</Text>
                  <Text style={styles.matchingWarningMeta}>
                    Segnalato da {w.author_name} il {new Date(w.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
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

        {/* Annotazioni dei Clienti */}
        <DetailSection
          title={language === 'it' ? 'COMMUNITY E SICUREZZA' : 'COMMUNITY & SAFETY'}
          subtitle={language === 'it' ? 'Segnalazioni di altri clienti e invio di nuovi warning.' : 'Reports from other customers and submitting new warnings.'}
          card={false}
        />
        <View style={styles.annotationsBox}>
          <View style={styles.annotationsHeader}>
            <Text style={styles.annotationsTitle}>
              ⚠️ Warning e Annotazioni Clienti ({annotations.length})
            </Text>
          </View>
          <Text style={styles.annotationsSubtitle}>
            Segnalazioni degli utenti su ingredienti non dichiarati o problematici per allergie specifiche.
          </Text>

          {annotations.map((ann) => {
            const matchesMyAllergy = allergie.includes(ann.allergen_code);
            return (
              <View key={ann.id} style={[styles.annotationCard, matchesMyAllergy && styles.annotationCardHighlight]}>
                <View style={styles.annotationCardHead}>
                  <Text style={styles.annotationAllergen}>
                    {ann.allergen_emoji} {ann.allergen_name_it}
                  </Text>
                  {matchesMyAllergy && (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>Tua Allergia</Text>
                    </View>
                  )}
                </View>
                {ann.ingredient ? (
                  <Text style={styles.annotationIngredient}>
                    Ingrediente critico: <Text style={{ fontWeight: '800', color: colors.redText }}>{ann.ingredient}</Text>
                  </Text>
                ) : null}
                <Text style={styles.annotationNotes}>"{ann.notes}"</Text>
                <View style={styles.annotationMeta}>
                  <Text style={styles.annotationMetaText}>
                    Inviato da {ann.author_name} · {new Date(ann.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          })}

          {annotations.length === 0 && (
            <View style={styles.annotationEmptyBox}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🛡️</Text>
              <Text style={styles.annotationEmptyText}>Nessuna segnalazione di ingredienti per questo locale.</Text>
            </View>
          )}

          {/* Modulo di inserimento segnalazione (solo per clienti loggati) */}
          {canReview && (
            <View style={styles.annotationForm}>
              <View style={styles.annotationFormHeader}>
                <Text style={styles.annotationFormTitle}>📢 Segnala un ingrediente critico</Text>
              </View>
              <Text style={styles.annotationFormSub}>
                Se hai riscontrato ingredienti non indicati o pericolosi per una specifica allergia in questo locale, segnalalo per avvisare gli altri utenti.
              </Text>

              {/* Selezione Allergia */}
              <Text style={styles.formLabel}>1. Seleziona l'allergia correlata:</Text>
              
              {/* Chips rapide delle proprie allergie */}
              <View style={styles.quickAllergensGrid}>
                {myAllergenList.map((a) => {
                  const isSelected = selectedAllergen?.code === a.code;
                  return (
                    <TouchableOpacity
                      key={a.code}
                      onPress={() => {
                        setSelectedAllergen(a);
                        setShowAllAllergensDropdown(false);
                      }}
                      style={[styles.quickAllergenChip, isSelected && styles.quickAllergenChipActive]}
                    >
                      <Text style={[styles.quickAllergenChipText, isSelected && styles.quickAllergenChipTextActive]}>
                        {a.emoji} {a.name_it}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                <TouchableOpacity
                  onPress={() => setShowAllAllergensDropdown(!showAllAllergensDropdown)}
                  style={[styles.quickAllergenChip, showAllAllergensDropdown && styles.quickAllergenChipActive, { backgroundColor: '#f1f5f9' }]}
                >
                  <Text style={styles.quickAllergenChipText}>
                    🔍 Altro allergene...
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Selettore esteso (se cliccato "Altro allergene") */}
              {showAllAllergensDropdown && (
                <View style={styles.dropdownContainer}>
                  <TextInput
                    style={styles.dropdownSearch}
                    placeholder="Cerca allergene..."
                    value={customAllergenSearch}
                    onChangeText={setCustomAllergenSearch}
                    placeholderTextColor="#94a3b8"
                  />
                  <ScrollView style={[styles.dropdownList, { maxHeight: 150 }]} nestedScrollEnabled={true}>
                    {filteredAllAllergens.map((a) => (
                      <TouchableOpacity
                        key={a.code}
                        onPress={() => {
                          setSelectedAllergen(a);
                          setShowAllAllergensDropdown(false);
                          setCustomAllergenSearch('');
                        }}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownItemText}>{a.emoji} {a.name_it}</Text>
                      </TouchableOpacity>
                    ))}
                    {filteredAllAllergens.length === 0 && (
                      <Text style={styles.dropdownEmpty}>Nessun allergene trovato</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {selectedAllergen && (
                <View style={styles.selectedAllergenAlert}>
                  <Text style={styles.selectedAllergenAlertText}>
                    Selezionato: <Text style={{ fontWeight: '800' }}>{selectedAllergen.emoji} {selectedAllergen.name_it}</Text>
                  </Text>
                </View>
              )}

              {/* Input Ingrediente */}
              <Text style={styles.formLabel}>2. Ingrediente problematico (es. latte in polvere):</Text>
              <TextInput
                style={styles.formInput}
                value={annotIngredient}
                onChangeText={setAnnotIngredient}
                placeholder="Quale ingrediente ti ha dato fastidio?"
                placeholderTextColor="#94a3b8"
              />

              {/* Input Note */}
              <Text style={styles.formLabel}>3. Descrivi cosa è successo o dove si trova:</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                value={annotNotes}
                onChangeText={setAnnotNotes}
                multiline
                placeholder="es. Trovato nelle patatine fritte anche se non segnalato dal menù. Il cameriere ha poi confermato la presenza di tracce."
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[styles.annotationSubmit, (annotBusy || !selectedAllergen || !annotNotes.trim()) && { opacity: 0.5 }]}
                disabled={annotBusy || !selectedAllergen || !annotNotes.trim()}
                onPress={submitAnnotation}
              >
                {annotBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.annotationSubmitText}>Invia Warning di Sicurezza</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recensioni — sezione premium */}
        <DetailSection
          title={language === 'it' ? 'RECENSIONI' : 'REVIEWS'}
          subtitle={language === 'it' ? 'Opinioni AllerTgy, Google e TripAdvisor sul locale.' : 'AllerTgy, Google, and TripAdvisor ratings for this venue.'}
          card={false}
        />
        <View style={styles.reviewsBox}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>
              ⭐ {t('reviews', language)}
            </Text>
            {reviews.length > 0 && (
              <View style={styles.reviewsAvg}>
                <Text style={styles.reviewsAvgStar}>★</Text>
                <Text style={styles.reviewsAvgText}>
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Badge valutazioni esterne */}
          {menu && (menu.google_rating || menu.tripadvisor_rating) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {menu.google_rating ? (
                <View style={styles.externalBadge}>
                  <Text style={styles.externalBadgeLabel}>🌐 Google</Text>
                  <Text style={styles.externalBadgeRating}>{menu.google_rating}★</Text>
                  <Text style={styles.externalBadgeCount}>({menu.google_reviews_count})</Text>
                </View>
              ) : null}
              {menu.tripadvisor_rating ? (
                <View style={[styles.externalBadge, { borderColor: '#10b981' }]}>
                  <Text style={[styles.externalBadgeLabel, { color: '#059669' }]}>🦉 TripAdvisor</Text>
                  <Text style={[styles.externalBadgeRating, { color: '#059669' }]}>{menu.tripadvisor_rating}★</Text>
                  <Text style={styles.externalBadgeCount}>({menu.tripadvisor_reviews_count})</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Tab sorgenti recensioni */}
          <View style={styles.reviewTabsRow}>
            <TouchableOpacity
              style={[styles.reviewTabBtn, reviewTab === 'allertgy' && styles.reviewTabBtnActive]}
              onPress={() => setReviewTab('allertgy')}
            >
              <Text style={[styles.reviewTabText, reviewTab === 'allertgy' && styles.reviewTabTextActive]}>
                🥗 AllerTgy ({reviews.length})
              </Text>
            </TouchableOpacity>
            {menu?.google_rating ? (
              <TouchableOpacity
                style={[styles.reviewTabBtn, reviewTab === 'google' && { ...styles.reviewTabBtnActive, borderBottomColor: '#3b82f6' }]}
                onPress={() => setReviewTab('google')}
              >
                <Text style={[styles.reviewTabText, reviewTab === 'google' && { ...styles.reviewTabTextActive, color: '#2563eb' }]}>
                  🌐 Google
                </Text>
              </TouchableOpacity>
            ) : null}
            {menu?.tripadvisor_rating ? (
              <TouchableOpacity
                style={[styles.reviewTabBtn, reviewTab === 'tripadvisor' && { ...styles.reviewTabBtnActive, borderBottomColor: '#10b981' }]}
                onPress={() => setReviewTab('tripadvisor')}
              >
                <Text style={[styles.reviewTabText, reviewTab === 'tripadvisor' && { ...styles.reviewTabTextActive, color: '#059669' }]}>
                  🦉 TripAdvisor
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* AllerTgy tab */}
          {reviewTab === 'allertgy' && (
            <>
              {reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={styles.reviewAuthorWrap}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {(r.author_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.reviewAuthor}>
                          {r.author_name}{r.is_mine ? t('you', language) : ''}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {new Date(r.created_at).toLocaleDateString(getLocaleForLang(language), { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStarsWrap}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Text key={n} style={[styles.reviewStarIcon, n > r.rating && styles.reviewStarOff]}>★</Text>
                      ))}
                    </View>
                  </View>
                  {/* Breakdown allergie */}
                  {(r.rating_staff || r.rating_menu || r.rating_safety) ? (
                    <View style={styles.ratingBreakdown}>
                      {r.rating_staff ? <Text style={styles.ratingBreakdownItem}>👤 Staff: {r.rating_staff}★</Text> : null}
                      {r.rating_menu ? <Text style={styles.ratingBreakdownItem}>📋 Menù: {r.rating_menu}★</Text> : null}
                      {r.rating_safety ? <Text style={styles.ratingBreakdownItem}>🛡️ Sicurezza: {r.rating_safety}★</Text> : null}
                    </View>
                  ) : null}
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                  {r.reply ? (
                    <View style={styles.replyBox}>
                      <Text style={styles.replyLabel}>💬 {t('restaurant_reply', language)}</Text>
                      <Text style={styles.reviewComment}>{r.reply}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {reviews.length === 0 && (
                <View style={styles.reviewEmptyBox}>
                  <Text style={styles.reviewEmptyEmoji}>💬</Text>
                  <Text style={styles.reviewEmpty}>{t('no_reviews', language)}</Text>
                  <Text style={styles.reviewEmptySub}>{t('be_first_review', language)}</Text>
                </View>
              )}

              {canReview && (
                <View style={styles.reviewForm}>
                  <View style={styles.reviewFormHeader}>
                    <Text style={styles.reviewFormEmoji}>✍️</Text>
                    <Text style={styles.reviewFormLabel}>La tua esperienza allergie</Text>
                  </View>
                  <Text style={styles.reviewFormSub}>Valuta i 3 aspetti chiave per la sicurezza alimentare</Text>

                  {/* 3 domande allergie */}
                  <View style={styles.allergyQBox}>
                    <View style={styles.allergyQRow}>
                      <Text style={styles.allergyQLabel}>👤 Attenzione Staff</Text>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map((n) => (
                          <TouchableOpacity key={n} onPress={() => setMyRatingStaff(n)}>
                            <Text style={[styles.starBtn, n > myRatingStaff && styles.starOff]}>⭐</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.allergyQRow}>
                      <Text style={styles.allergyQLabel}>📋 Chiarezza Menù</Text>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map((n) => (
                          <TouchableOpacity key={n} onPress={() => setMyRatingMenu(n)}>
                            <Text style={[styles.starBtn, n > myRatingMenu && styles.starOff]}>⭐</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.allergyQRow}>
                      <Text style={styles.allergyQLabel}>🛡️ Sicurezza Pasto</Text>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map((n) => (
                          <TouchableOpacity key={n} onPress={() => setMyRatingSafety(n)}>
                            <Text style={[styles.starBtn, n > myRatingSafety && styles.starOff]}>⭐</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TextInput
                    style={styles.reviewInput}
                    value={myComment}
                    onChangeText={setMyComment}
                    multiline
                    placeholder="Descrivi la tua esperienza con le allergie..."
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity
                    style={[styles.reviewSubmit, reviewBusy && { opacity: 0.4 }]}
                    disabled={reviewBusy}
                    onPress={submitReview}
                  >
                    {reviewBusy
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.reviewSubmitText}>Pubblica recensione AllerTgy</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Google / TripAdvisor tab */}
          {reviewTab !== 'allertgy' && (
            <>
              {externalReviews.filter(r => r.source === reviewTab).length === 0 ? (
                <View style={styles.reviewEmptyBox}>
                  <Text style={styles.reviewEmptyEmoji}>🌐</Text>
                  <Text style={styles.reviewEmpty}>Nessuna recensione esterna disponibile</Text>
                </View>
              ) : (
                externalReviews.filter(r => r.source === reviewTab).map((r, idx) => (
                  <View key={idx} style={[styles.reviewCard, { backgroundColor: '#f8fafc' }]}>
                    <View style={styles.reviewHead}>
                      <View style={styles.reviewAuthorWrap}>
                        <View style={[styles.reviewAvatar, { backgroundColor: reviewTab === 'google' ? '#3b82f6' : '#10b981' }]}>
                          <Text style={styles.reviewAvatarText}>
                            {(r.author_name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                          <Text style={styles.reviewDate}>
                            {new Date(r.created_at).toLocaleDateString(getLocaleForLang(language), { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewStarsWrap}>
                        {[1,2,3,4,5].map((n) => (
                          <Text key={n} style={[styles.reviewStarIcon, n > r.rating && styles.reviewStarOff]}>★</Text>
                        ))}
                      </View>
                    </View>
                    {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                  </View>
                ))
              )}
            </>
          )}
        </View>
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

  // Recensioni
  reviewsBox: { marginTop: 24, gap: 10 },

  reviewsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewsTitle: { fontSize: 18, fontWeight: '900', color: '#10201B', letterSpacing: -0.3 },
  reviewsBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  reviewsBadgeText: { fontSize: 12, fontWeight: '800', color: '#047857' },
  reviewsAvg: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto',
  },
  reviewsAvgStar: { fontSize: 14, color: '#f59e0b' },
  reviewsAvgText: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  reviewCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 16, padding: 14, gap: 8,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewAuthorWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#a7f3d0',
  },
  reviewAvatarText: { fontSize: 15, fontWeight: '800', color: '#047857' },
  reviewAuthor: { fontWeight: '700', fontSize: 13, color: '#1e293b' },
  reviewDate: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  reviewStarsWrap: { flexDirection: 'row', gap: 1 },
  reviewStarIcon: { fontSize: 14, color: '#f59e0b' },
  reviewStarOff: { color: '#e2e8f0' },
  reviewComment: { color: '#475569', fontSize: 13, lineHeight: 19 },
  replyBox: {
    marginTop: 4, marginLeft: 8, padding: 10, backgroundColor: '#f0fdf4',
    borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', gap: 4,
  },
  replyLabel: { fontSize: 10, fontWeight: '800', color: '#047857', textTransform: 'uppercase' },
  reviewEmptyBox: {
    alignItems: 'center', padding: 24, gap: 6,
    backgroundColor: '#f8fafc', borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  reviewEmptyEmoji: { fontSize: 28 },
  reviewEmpty: { color: '#64748b', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  reviewEmptySub: { color: '#94a3b8', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  reviewForm: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 16, padding: 16, gap: 10, marginTop: 6,
  },
  reviewFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewFormEmoji: { fontSize: 18 },
  reviewFormLabel: { fontWeight: '800', fontSize: 15, color: '#1e293b' },
  reviewFormSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: -4 },
  starsRow: { flexDirection: 'row', gap: 6 },
  starBtn: { fontSize: 28 },
  starOff: { opacity: 0.2 },
  reviewInput: {
    minHeight: 80, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 14, padding: 12, fontSize: 14, color: '#10201B', textAlignVertical: 'top',
    lineHeight: 20,
  },
  reviewSubmit: {
    height: 48, backgroundColor: '#059669', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  reviewSubmitText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Badge valutazioni esterne (Google / TripAdvisor)
  externalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#3b82f6', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#eff6ff',
  },
  externalBadgeLabel: { fontSize: 11, fontWeight: '800', color: '#1d4ed8' },
  externalBadgeRating: { fontSize: 13, fontWeight: '900', color: '#1d4ed8' },
  externalBadgeCount: { fontSize: 10, color: '#64748b', fontWeight: '600' },

  // Tab sorgenti recensioni
  reviewTabsRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 8,
  },
  reviewTabBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1,
  },
  reviewTabBtnActive: { borderBottomColor: '#059669' },
  reviewTabText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  reviewTabTextActive: { color: '#059669' },

  // 3 domande allergie nel form recensione
  allergyQBox: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 14, padding: 12, gap: 12,
  },
  allergyQRow: { gap: 4 },
  allergyQLabel: { fontSize: 12, fontWeight: '800', color: '#475569' },

  // Breakdown valutazioni allergie nelle recensioni esistenti
  ratingBreakdown: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  ratingBreakdownItem: { fontSize: 11, fontWeight: '700', color: '#047857' },
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
  
  // --- Stili per Matching Warnings ---
  matchingWarningsBox: {
    marginTop: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  matchingWarningsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchingWarningCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  matchingWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
  },
  matchingWarningIngredient: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
  },
  matchingWarningNotes: {
    fontSize: 12.5,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  matchingWarningMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },

  // --- Stili per Annotations Box ---
  annotationsBox: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  annotationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  annotationsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  annotationsSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    marginTop: -8,
  },
  annotationCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  annotationCardHighlight: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  annotationCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  annotationAllergen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  matchBadge: {
    backgroundColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  matchBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#b91c1c',
    textTransform: 'uppercase',
  },
  annotationIngredient: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  annotationNotes: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  annotationMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
    marginTop: 2,
  },
  annotationMetaText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  annotationEmptyBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  annotationEmptyText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  // --- Stili per Form Annotazione ---
  annotationForm: {
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    gap: 10,
    marginTop: 6,
  },
  annotationFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  annotationFormTitle: {
    fontWeight: '800',
    fontSize: 14.5,
    color: '#0f172a',
  },
  annotationFormSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginTop: 4,
  },
  quickAllergensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAllergenChip: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  quickAllergenChipActive: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  quickAllergenChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickAllergenChipTextActive: {
    color: '#e11d48',
    fontWeight: '800',
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    fontSize: 13.5,
    color: '#0f172a',
  },
  annotationSubmit: {
    height: 44,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  annotationSubmitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  // --- Stili Dropdown Allergene ---
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownSearch: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  dropdownList: {
    maxHeight: 140,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  dropdownEmpty: {
    paddingVertical: 12,
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedAllergenAlert: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  selectedAllergenAlertText: {
    fontSize: 12.5,
    color: '#b45309',
    fontWeight: '600',
  },
});
