import React, { useState, useEffect, useRef, useMemo } from 'react';
import { router } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../src/store/session';
import { api } from '../../src/api/client';
import { colors, radius, shadow, spacing, typography, semaforoColors } from '../../src/theme';
import { calcolaSemaforo, type PiattoAllergeni } from '../../src/engine/semaforo';
import { TRANSLATED_ALLERGENS } from '../../src/engine/translations';
import LanguageFlagsRow from '../../src/components/LanguageFlagsRow';
import { useTranslation } from '../../src/constants/translations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  status: 'verde' | 'giallo' | 'rosso';
  ingredients: string;
  match_contenuti: string[];
  match_tracce: string[];
  match_esclusi: string[];
  date: string;
}

// Mappatura dei tag allergeni di Open Food Facts sui codici AllerTgy
const OFF_ALLERGEN_MAP: Record<string, string[]> = {
  // Allergeni obbligatori UE
  'en:gluten': ['glutine'],
  'en:wheat': ['glutine'],
  'en:rye': ['glutine', 'segale'],
  'en:barley': ['glutine', 'orzo'],
  'en:oats': ['glutine', 'avena'],
  'en:spelt': ['glutine', 'farro'],
  'en:crustaceans': ['crostacei'],
  'en:eggs': ['uova'],
  'en:fish': ['pesce'],
  'en:peanuts': ['arachidi'],
  'en:soybeans': ['soia'],
  'en:milk': ['latte'],
  'en:lactose': ['latte'],
  'en:nuts': ['frutta_a_guscio'],
  'en:almond': ['frutta_a_guscio', 'mandorle'],
  'en:hazelnut': ['frutta_a_guscio', 'nocciole'],
  'en:walnut': ['frutta_a_guscio', 'noci'],
  'en:cashew': ['frutta_a_guscio', 'anacardi'],
  'en:pecan': ['frutta_a_guscio', 'noci_pecan'],
  'en:brazil-nut': ['frutta_a_guscio', 'noci_brasiliane'],
  'en:pistachio': ['frutta_a_guscio', 'pistacchi'],
  'en:macadamia': ['frutta_a_guscio', 'macadamia'],
  'en:celery': ['sedano'],
  'en:mustard': ['senape'],
  'en:sesame-seeds': ['sesamo'],
  'en:sulphur-dioxide-and-sulphites': ['solfiti'],
  'en:lupin': ['lupini'],
  'en:molluscs': ['molluschi'],

  // Ingredienti specifici (standardizzati come tag en: da OFF)
  'en:strawberry': ['fragole'],
  'en:kiwi': ['kiwi'],
  'en:apple': ['mela'],
  'en:peach': ['pesca'],
  'en:orange': ['arancia', 'agrumi'],
  'en:lemon': ['limone', 'agrumi'],
  'en:banana': ['banana'],
  'en:grape': ['uva'],
  'en:watermelon': ['anguria'],
  'en:melon': ['melone'],
  'en:pineapple': ['ananas'],
  'en:mango': ['mango'],
  'en:avocado': ['avocado'],
  'en:apricot': ['albicocca'],
  'en:cherry': ['ciliegia'],
  'en:pear': ['pera'],
  'en:plum': ['prugna'],
  'en:raspberry': ['lamponi'],
  'en:blueberry': ['mirtilli'],
  'en:coconut': ['cocco'],
  'en:tomato': ['pomodoro'],
  'en:garlic': ['aglio'],
  'en:onion': ['cipolla'],
  'en:carrot': ['carota'],
  'en:mushroom': ['funghi'],
  'en:corn': ['mais'],
  'en:chili-pepper': ['peperoncino'],
  'en:bell-pepper': ['peperone'],
  'en:eggplant': ['melanzana'],
  'en:zucchini': ['zucchina'],
  'en:spinach': ['spinaci'],
  'en:broccoli': ['broccoli'],
  'en:cauliflower': ['cavolfiore'],
  'en:cabbage': ['cavolo'],
  'en:potato': ['patata'],
  'en:peas': ['piselli'],
  'en:beans': ['fagioli'],
  'en:lentil': ['lenticchie'],
  'en:cucumber': ['cetriolo'],
  'en:lettuce': ['lattuga'],
  'en:arugula': ['rucola'],
  'en:beetroot': ['barbabietola'],
  'en:fennel': ['finocchio'],
  'en:asparagus': ['asparagi'],
  'en:artichoke': ['carciofi'],
  'en:leek': ['porri'],
  'en:rice': ['riso'],
  'en:quinoa': ['quinoa'],
  'en:buckwheat': ['grano_saraceno'],
  'en:teff': ['teff'],
  'en:amaranth': ['amaranto'],
  'en:cinnamon': ['cannella'],
  'en:vanilla': ['vaniglia'],
  'en:pepper': ['pepe'],
  'en:curry': ['curry'],
  'en:ginger': ['zenzero'],
  'en:nutmeg': ['noce_moscata'],
  'en:clove': ['chiodi_di_garofano'],
  'en:paprika': ['paprika'],
  'en:cumin': ['cumino'],
  'en:oregano': ['origano'],
  'en:rosemary': ['rosmarino'],
  'en:thyme': ['timo'],
  'en:sage': ['salvia'],
  'en:anise': ['anice'],
  'en:turmeric': ['curcuma'],
  'en:coriander': ['coriandolo'],
  'en:bay-leaf': ['alloro'],
  'en:caffeine': ['caffeina'],
  'en:alcohol': ['alcool'],
};

// Parole chiave in italiano per ciascun allergene (per evidenziarle negli ingredienti testuali)
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  glutine: ['glutine', 'frumento', 'grano', 'orzo', 'avena', 'segale', 'farro', 'saraceno', 'kamut', 'spelta', 'cereali', 'malto'],
  latte: ['latte', 'lattosio', 'burro', 'panna', 'formaggio', 'casein', 'lattico', 'lattica', 'yogurt', 'siero'],
  uova: ['uova', 'uovo', 'albume', 'tuorlo', 'maionese'],
  arachidi: ['arachid', 'spagnolette'],
  soia: ['soia', 'lecitina de soia', 'lecitina di soia'],
  frutta_a_guscio: ['mandorl', 'nocciol', 'nocin', 'noci', 'anacard', 'pecan', 'pistacchio', 'pistacchi', 'macadamia', 'pinoli', 'castagne', 'anacardo'],
  crostacei: ['gamber', 'scamp', 'aragost', 'astice', 'mancora', 'granchio', 'crostacei'],
  pesce: ['pesce', 'tonno', 'salmone', 'merluzzo', 'acciug', 'alici', 'pesci'],
  sedano: ['sedano'],
  senape: ['senape'],
  sesamo: ['sesamo'],
  solfiti: ['solfiti', 'anidride solforosa', 'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228'],
  lupini: ['lupin'],
  molluschi: ['cozz', 'vongol', 'polpo', 'seppi', 'calamar', 'molluschi', 'ostric', 'lumach'],
  pomodoro: ['pomodor'],
  aglio: ['aglio'],
  cipolla: ['cipolla'],
  fragole: ['fragol'],
  kiwi: ['kiwi'],
  mela: ['mel'],
  pesca: ['pesc'],
  arancia: ['aranci'],
  limone: ['limon'],
  banana: ['banan'],
  carota: ['carot'],
  funghi: ['fungh', 'champignon', 'porcin'],
  mais: ['mais', 'granturco'],
  peperoncino: ['peperoncin'],
  peperone: ['peperon'],
  melanzana: ['melanzan'],
  zucchina: ['zucchin'],
  spinaci: ['spinac'],
  broccoli: ['broccol'],
  cavolfiore: ['cavolfior'],
  cavolo: ['cavol'],
  patata: ['patat'],
  piselli: ['pisell'],
  fagioli: ['fagiol'],
  lenticchie: ['lenticch'],
  cetriolo: ['cetriol'],
  lattuga: ['lattug', 'insalat'],
  rucola: ['rucol'],
  barbabietola: ['barbabietol'],
  finocchio: ['finocch'],
  asparagi: ['asparag'],
  carciofi: ['carciof'],
  porri: ['porr'],
  riso: ['riso'],
  quinoa: ['quinoa'],
  cinnamon: ['cannell'],
  vaniglia: ['vanigl'],
  pepe: ['pepe'],
  curry: ['curry'],
  zenzero: ['zenzer'],
  caffeina: ['caffein', 'caffè'],
  alcool: ['alcool', 'alcol', 'etilico'],
};

export default function Spesa() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  // Stati di scansione e API
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ScannedProduct | null>(null);

  // Cronologia
  const [history, setHistory] = useState<ScannedProduct[]>([]);
  const [productFavorites, setProductFavorites] = useState<ScannedProduct[]>([]);
  const [listMode, setListMode] = useState<'history' | 'favorites'>('history');

  // Dati utente dallo store
  const { 
    allergie: primaryAllergies, ingredientiEsclusi, language, 
    subProfiles, setSubProfiles, activeProfileId, setActiveProfileId, token 
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

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';

  // Animazioni
  const scanAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Carica la cronologia locale all'avvio
  useEffect(() => {
    loadHistory();
    loadProductFavorites();
    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
    }
  }, [token]);

  // Animazione laser linea scansione
  useEffect(() => {
    if (isFocused && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isFocused, scanned]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('allertgy-scan-history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Errore caricamento cronologia', e);
    }
  };

  const saveToHistory = async (prod: ScannedProduct) => {
    try {
      const updated = [prod, ...history.filter((h) => h.barcode !== prod.barcode)].slice(0, 15);
      setHistory(updated);
      await AsyncStorage.setItem('allertgy-scan-history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Errore salvataggio cronologia', e);
    }
  };

  const clearHistory = async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem('allertgy-scan-history');
    } catch (e) {
      console.warn('Errore pulizia cronologia', e);
    }
  };

  const loadProductFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('allertgy-product-favorites');
      if (stored) {
        setProductFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Errore caricamento preferiti spesa', e);
    }
  };

  const toggleProductFavorite = async (prod: ScannedProduct) => {
    try {
      const isFav = productFavorites.some((f) => f.barcode === prod.barcode);
      let updated;
      if (isFav) {
        updated = productFavorites.filter((f) => f.barcode !== prod.barcode);
      } else {
        updated = [prod, ...productFavorites];
      }
      setProductFavorites(updated);
      await AsyncStorage.setItem('allertgy-product-favorites', JSON.stringify(updated));
    } catch (e) {
      console.warn('Errore salvataggio preferiti spesa', e);
    }
  };

  // Funzione che gestisce la lettura del codice a barre
  const handleBarcodeScanned = async (barcode: string) => {
    if (scanned || loading || activeProduct) return;
    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        headers: { 'User-Agent': 'AllerTgyApp/1.0 (contact@allertgy.com)' },
      });
      const data = await response.json();

      if (data.status !== 1 || !data.product) {
        throw new Error('Prodotto non trovato nel database di Open Food Facts');
      }

      const prod = data.product;
      const name = prod.product_name_it || prod.product_name || 'Prodotto sconosciuto';
      const brand = prod.brands || 'Marca non specificata';
      const image = prod.image_front_url || prod.image_url || null;
      const ingredientsText = prod.ingredients_text_it || prod.ingredients_text || 'Lista ingredienti non disponibile';

      // 1. Estrazione allergeni e tracce
      const allergeniContenuti = new Set<string>();
      const allergeniTracce = new Set<string>();

      const offAllergens = prod.allergens_tags || [];
      for (const tag of offAllergens) {
        const mapped = OFF_ALLERGEN_MAP[tag.toLowerCase()];
        if (mapped) mapped.forEach((code) => allergeniContenuti.add(code));
      }

      const offTraces = prod.traces_tags || [];
      for (const tag of offTraces) {
        const mapped = OFF_ALLERGEN_MAP[tag.toLowerCase()];
        if (mapped) mapped.forEach((code) => allergeniTracce.add(code));
      }

      // 2. Controllo diete
      const analysisTags = prod.ingredients_analysis_tags || [];
      const isVegan = analysisTags.includes('en:vegan');
      const isVegetarian = analysisTags.includes('en:vegetarian') || isVegan;
      if (isVegan) {
        allergeniContenuti.add('vegano');
        allergeniContenuti.add('vegetariano');
      } else if (isVegetarian) {
        allergeniContenuti.add('vegetariano');
      }

      // Controllo certificati di etichetta
      const labelsTags = prod.labels_tags || [];
      if (labelsTags.includes('en:gluten-free')) {
        allergeniContenuti.add('senza_glutine');
      }
      if (labelsTags.includes('en:lactose-free')) {
        allergeniContenuti.add('senza_lattosio');
      }

      // 3. Controllo ingredienti specifici dell'albero ingredienti
      const ingredients = prod.ingredients || [];
      for (const ing of ingredients) {
        const ingId = (ing.id || '').toLowerCase();
        const mapped = OFF_ALLERGEN_MAP[ingId];
        if (mapped) mapped.forEach((code) => allergeniContenuti.add(code));
      }

      // 4. Mappatura preferenze speciali dell'utente (senza_glutine e senza_lattosio)
      const activeAllergies = [...allergie];
      if (allergie.includes('senza_glutine') && !activeAllergies.includes('glutine')) {
        activeAllergies.push('glutine');
      }
      if (allergie.includes('senza_lattosio') && !activeAllergies.includes('latte')) {
        activeAllergies.push('latte');
      }

      // 5. Esegui il calcolo semaforo
      const piatto: PiattoAllergeni = {
        nome_piatto: name,
        descrizione: ingredientsText,
        allergeni_contenuti: Array.from(allergeniContenuti),
        allergeni_tracce: Array.from(allergeniTracce),
      };

      const esito = calcolaSemaforo(activeAllergies, piatto, ingredientiEsclusi);

      // Crea il prodotto scansionato finale
      const scannedProduct: ScannedProduct = {
        barcode,
        name,
        brand,
        image,
        status: esito.stato,
        ingredients: ingredientsText,
        match_contenuti: esito.match_contenuti || [],
        match_tracce: esito.match_tracce || [],
        match_esclusi: esito.match_esclusi || [],
        date: new Date().toISOString(),
      };

      setActiveProduct(scannedProduct);
      saveToHistory(scannedProduct);
      openBottomSheet();
    } catch (e: any) {
      setError(e.message || 'Errore durante la scansione. Riprova.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per animare l'apertura del bottom sheet
  const openBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // Funzione per chiudere il bottom sheet e riattivare la fotocamera
  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveProduct(null);
      setScanned(false);
      setError(null);
    });
  };

  const selectProductFromHistory = (prod: ScannedProduct) => {
    setActiveProduct(prod);
    openBottomSheet();
  };

  // Traduzioni degli allergeni per la UI
  const getTranslation = (code: string) => {
    const trans = TRANSLATED_ALLERGENS[code];
    if (trans) {
      return `${trans.emoji} ${isIt ? trans.it : trans.en}`;
    }
    return code;
  };

  // Funzione per evidenziare le parole chiave associate alle allergie dell'utente nel testo ingredienti
  const renderHighlightedIngredients = (text: string) => {
    const noIngsMsg = isIt ? 'Lista ingredienti non disponibile' : 'Ingredients list not available';
    if (!text || text === 'Lista ingredienti non disponibile' || text === 'Ingredients list not available') {
      return <Text style={styles.ingredientsText}>{noIngsMsg}</Text>;
    }

    const activeAllergies = [...allergie];
    if (allergie.includes('senza_glutine') && !activeAllergies.includes('glutine')) {
      activeAllergies.push('glutine');
    }
    if (allergie.includes('senza_lattosio') && !activeAllergies.push('latte')) {
      activeAllergies.push('latte');
    }

    // Costruisce la lista di tutte le parole chiave collegate alle allergie dell'utente + ingredienti esclusi
    const keywords: string[] = [];
    for (const allergy of activeAllergies) {
      const kws = ALLERGEN_KEYWORDS[allergy];
      if (kws) keywords.push(...kws);
    }
    keywords.push(...ingredientiEsclusi);

    // Rimuove eventuali duplicati o stringhe vuote ed effettua l'escape per la RegExp
    const cleanKeywords = Array.from(new Set(keywords))
      .filter(Boolean)
      .map((kw) => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    if (cleanKeywords.length === 0) {
      return <Text style={styles.ingredientsText}>{text}</Text>;
    }

    // Crea un pattern regex case-insensitive
    const regex = new RegExp(`(${cleanKeywords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text style={styles.ingredientsText}>
        {parts.map((part, i) => {
          const isMatch = cleanKeywords.some((kw) => new RegExp(`^${kw}`, 'i').test(part));
          return (
            <Text
              key={i}
              style={isMatch ? { color: colors.red, fontWeight: '800', backgroundColor: colors.redBg } : null}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  // Posizionamento verticale della linea laser
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 270],
  });

  if (!permission) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.brand} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LanguageFlagsRow />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>🛒</Text>
          <Text style={styles.permissionTitle}>{t('grocery_scanner_title')}</Text>
          <Text style={styles.permissionText}>{t('grocery_scanner_desc')}</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>{t('allow_camera_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LanguageFlagsRow />
      <View style={styles.container}>
      {/* 1. SEZIONE FOTOCAMERA (TOP 60%) */}
      <View style={styles.cameraFrame}>
        {isFocused && !activeProduct ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            enableTorch={torch}
            onBarcodeScanned={({ data }) => {
              if (data && !scanned) {
                handleBarcodeScanned(data);
              }
            }}
          >
            {/* Overlay Maschera Mirino */}
            <View style={styles.maskContainer}>
              <View style={styles.maskRow} />
              <View style={[styles.maskRow, styles.maskRowMiddle]}>
                <View style={styles.maskSide} />
                <View style={styles.viewfinder}>
                  {/* Angoli del mirino */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Linea Laser Animata */}
                  {!scanned && (
                    <Animated.View style={[styles.laser, { transform: [{ translateY }] }]} />
                  )}
                </View>
                <View style={styles.maskSide} />
              </View>
              <View style={styles.maskRow} />
            </View>

            {/* Pulsanti floating sulla fotocamera */}
            <View style={styles.floatingControls}>
              <TouchableOpacity
                style={[styles.floatingBtn, torch && styles.floatingBtnActive]}
                onPress={() => setTorch(!torch)}
              >
                <Text style={styles.floatingBtnText}>{torch ? (isIt ? '🔦 Acceso' : '🔦 On') : (isIt ? '🔦 Torcia' : '🔦 Flashlight')}</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          <View style={styles.cameraPaused}>
            <Text style={{ fontSize: 44 }}>🛒</Text>
            <Text style={styles.pausedText}>{isIt ? 'Scansione in pausa' : 'Scan paused'}</Text>
          </View>
        )}

        {/* Overlay di Caricamento API */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={styles.loadingText}>{isIt ? 'Interrogazione Open Food Facts...' : 'Querying Open Food Facts...'}</Text>
          </View>
        )}

        {/* Messaggio di errore temporaneo */}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.errorBtn} onPress={() => setError(null)}>
              <Text style={styles.errorBtnText}>{isIt ? 'Riprova' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. SEZIONE CRONOLOGIA / STATO (BOTTOM 40%) */}
      <View style={styles.historyContainer}>
        {/* Sottoprofili Switcher */}
        {token && subProfiles.length > 0 && (
          <View style={styles.profileSwitcherContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileSwitcherScroll}>
              <TouchableOpacity
                style={[styles.profileSwitcherBtn, activeProfileId === null && styles.profileSwitcherBtnActive]}
                onPress={() => setActiveProfileId(null)}
              >
                <Text style={[styles.profileSwitcherText, activeProfileId === null && styles.profileSwitcherTextActive]}>
                  👤 {isIt ? 'Io' : 'Me'}
                </Text>
              </TouchableOpacity>
              {subProfiles.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profileSwitcherBtn, activeProfileId === p.id && styles.profileSwitcherBtnActive]}
                  onPress={() => setActiveProfileId(p.id)}
                >
                  <Text style={[styles.profileSwitcherText, activeProfileId === p.id && styles.profileSwitcherTextActive]}>
                    👥 {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.profileSwitcherBtn, { borderColor: '#cbd5e1', borderStyle: 'dashed' }]}
                onPress={() => router.push('/sub-profiles')}
              >
                <Text style={[styles.profileSwitcherText, { color: '#64748b' }]}>
                  ＋ {isIt ? 'Gestisci' : 'Manage'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.historyHeader}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, listMode === 'history' && styles.tabBtnActive]}
              onPress={() => setListMode('history')}
            >
              <Text style={[styles.tabText, listMode === 'history' && styles.tabTextActive]}>
                {isIt ? 'Cronologia' : 'History'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, listMode === 'favorites' && styles.tabBtnActive]}
              onPress={() => setListMode('favorites')}
            >
              <Text style={[styles.tabText, listMode === 'favorites' && styles.tabTextActive]}>
                {isIt ? 'Preferiti' : 'Favorites'}
              </Text>
            </TouchableOpacity>
          </View>
          {listMode === 'history' && history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearHistoryBtn}>{isIt ? 'Cancella' : 'Clear'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {listMode === 'history' ? (
          history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyEmoji}>🥫</Text>
              <Text style={styles.emptyText}>{t('no_products_scanned_title')}</Text>
              <Text style={styles.emptySubText}>
                {isIt ? 'Inquadra un codice a barre per controllare gli allergeni' : 'Scan a barcode to check allergens'}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
            >
              {history.map((item, idx) => {
                const semColors = semaforoColors(item.status);
                return (
                  <TouchableOpacity
                    key={`${item.barcode}-${idx}`}
                    style={styles.historyCard}
                    onPress={() => selectProductFromHistory(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyCardPlaceholder}>
                      <Text style={{ fontSize: 16 }}>🥫</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.historyCardBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeDot,
                        { backgroundColor: semColors.solid, borderColor: semColors.border },
                      ]}
                    />
                    <Text style={styles.historyCardArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )
        ) : (
          productFavorites.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyEmoji}>⭐</Text>
              <Text style={styles.emptyText}>{isIt ? 'Nessun preferito' : 'No favorites'}</Text>
              <Text style={styles.emptySubText}>
                {isIt ? 'Tocca la stella nella scheda di un prodotto per salvarlo nei preferiti.' : 'Tap the star on a product details sheet to save it to favorites.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
            >
              {productFavorites.map((item, idx) => {
                const semColors = semaforoColors(item.status);
                return (
                  <TouchableOpacity
                    key={`${item.barcode}-${idx}`}
                    style={styles.historyCard}
                    onPress={() => selectProductFromHistory(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyCardPlaceholder}>
                      <Text style={{ fontSize: 16 }}>🥫</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.historyCardBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeDot,
                        { backgroundColor: semColors.solid, borderColor: semColors.border },
                      ]}
                    />
                    <Text style={styles.historyCardArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )
        )}
      </View>

      {/* 3. BOTTOM SHEET RISULTATO SCANSIONE */}
      {activeProduct && (
        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header del Bottom Sheet */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeBottomSheet}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Principali Prodotto */}
            <View style={styles.productMainRow}>
              <View style={styles.productImagePlaceholder}>
                <Text style={{ fontSize: 32 }}>🥫</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{activeProduct.name}</Text>
                <Text style={styles.productBrand}>{activeProduct.brand}</Text>
                <Text style={styles.productBarcode}>{isIt ? 'Codice' : 'Code'}: {activeProduct.barcode}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleProductFavorite(activeProduct)}
                style={styles.sheetFavBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.sheetFavEmoji}>
                  {productFavorites.some((f) => f.barcode === activeProduct.barcode) ? '⭐️' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Badge Semaforo Grande */}
            {(() => {
              const semColors = semaforoColors(activeProduct.status);
              let title = '';
              let desc = '';
              if (activeProduct.status === 'verde') {
                title = isIt ? '🟢 SICURO' : '🟢 SAFE';
                desc = isIt ? 'Nessuno dei tuoi allergeni o ingredienti esclusi è presente in questo prodotto.' : 'None of your allergens or excluded ingredients are present in this product.';
              } else if (activeProduct.status === 'giallo') {
                title = isIt ? '🟡 ATTENZIONE' : '🟡 CAUTION';
                desc = isIt ? 'Il prodotto potrebbe contenere tracce di tuoi allergeni.' : 'The product may contain traces of your allergens.';
              } else {
                title = isIt ? '🔴 NON IDONEO' : '🔴 NOT ELIGIBLE';
                desc = isIt ? 'Il prodotto contiene allergeni incompatibili con il tuo profilo.' : 'The product contains allergens incompatible with your profile.';
              }

              return (
                <View
                  style={[
                    styles.resultCard,
                    { backgroundColor: semColors.bg, borderColor: semColors.border },
                  ]}
                >
                  <Text style={[styles.resultTitle, { color: semColors.text }]}>{title}</Text>
                  <Text style={[styles.resultText, { color: semColors.text }]}>{desc}</Text>
                </View>
              );
            })()}

            {/* Dettagli Allergeni Rilevati */}
            {activeProduct.status !== 'verde' && (
              <View style={styles.matchesSection}>
                <Text style={styles.sectionTitle}>{isIt ? 'Allergeni Critici Rilevati' : 'Critical Allergens Detected'}</Text>

                {activeProduct.match_contenuti.length > 0 && (
                  <View style={styles.matchItemRow}>
                    <Text style={styles.matchItemLabel}>{isIt ? 'Contiene:' : 'Contains:'}</Text>
                    <View style={styles.matchBadgeContainer}>
                      {activeProduct.match_contenuti.map((code) => (
                        <View key={code} style={[styles.allergenBadge, styles.badgeRed]}>
                          <Text style={styles.allergenBadgeText}>{getTranslation(code)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {activeProduct.match_tracce.length > 0 && (
                  <View style={styles.matchItemRow}>
                    <Text style={styles.matchItemLabel}>{isIt ? 'Può contenere tracce:' : 'May contain traces:'}</Text>
                    <View style={styles.matchBadgeContainer}>
                      {activeProduct.match_tracce.map((code) => (
                        <View key={code} style={[styles.allergenBadge, styles.badgeYellow]}>
                          <Text style={styles.allergenBadgeText}>{getTranslation(code)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {activeProduct.match_esclusi.length > 0 && (
                  <View style={styles.matchItemRow}>
                    <Text style={styles.matchItemLabel}>{isIt ? 'Ingredienti Esclusi:' : 'Excluded Ingredients:'}</Text>
                    <View style={styles.matchBadgeContainer}>
                      {activeProduct.match_esclusi.map((ing) => (
                        <View key={ing} style={[styles.allergenBadge, styles.badgeRed]}>
                          <Text style={styles.allergenBadgeText}>🚫 {ing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Lista Ingredienti Completa */}
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionTitle}>{isIt ? 'Ingredienti del Prodotto' : 'Product Ingredients'}</Text>
              <View style={styles.ingredientsBox}>
                {renderHighlightedIngredients(activeProduct.ingredients)}
              </View>
              <Text style={styles.disclaimerText}>
                {isIt 
                  ? "* Le informazioni derivano dal database pubblico Open Food Facts e potrebbero subire variazioni. Controlla sempre l'etichetta fisica prima del consumo." 
                  : "* Information is sourced from the public Open Food Facts database and may vary. Always check the physical label before consuming."}
              </Text>
            </View>

            <TouchableOpacity style={styles.sheetActionButton} onPress={closeBottomSheet}>
              <Text style={styles.sheetActionText}>{isIt ? 'Scansiona altro' : 'Scan more'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Schermata di richiesta permessi
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bg,
  },
  permissionIcon: { fontSize: 64, marginBottom: spacing.lg },
  permissionTitle: { ...typography.h1, color: colors.ink, marginBottom: spacing.md },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    ...shadow.raised,
  },
  permissionBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  // Frame della Fotocamera
  cameraFrame: {
    height: '48%',
    backgroundColor: colors.ink,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  cameraPaused: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  pausedText: { ...typography.h3, color: colors.textMuted, marginTop: spacing.md },

  // Maschera e Mirino
  maskContainer: { flex: 1, backgroundColor: 'transparent' },
  maskRow: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  maskRowMiddle: { flex: 1, flexDirection: 'row', height: 280 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  viewfinder: {
    width: 280,
    height: 280,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  // Angoli grafici del mirino
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.white,
    borderWidth: 0.2, // fine border backup
  },
  topLeft: { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4, borderColor: colors.brand300 },
  topRight: { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4, borderColor: colors.brand300 },
  bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: colors.brand300 },
  bottomRight: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4, borderColor: colors.brand300 },

  // Linea Laser di Scansione
  laser: {
    height: 3,
    backgroundColor: '#34d399',
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },

  // Controlli floating della fotocamera
  floatingControls: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  floatingBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  floatingBtnActive: {
    backgroundColor: colors.brandDark,
    borderColor: colors.brand300,
  },
  floatingBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  // Caricamento overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: { ...typography.h3, color: colors.inkSoft, marginTop: spacing.md },

  // Errore overlay
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.redText,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  errorBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  errorBtnText: { color: colors.white, fontWeight: '800' },

  // Sezione Cronologia
  historyContainer: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyTitle: { ...typography.h2, color: colors.ink },
  clearHistoryBtn: { color: colors.redText, fontWeight: '700', fontSize: 13 },
  emptyHistory: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md, opacity: 0.7 },
  emptyText: { ...typography.h3, color: colors.textSecondary, textAlign: 'center' },
  emptySubText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  historyList: { gap: spacing.sm, paddingBottom: 24 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  historyCardImage: { width: 44, height: 44, borderRadius: radius.sm, resizeMode: 'contain' },
  historyCardPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardName: { ...typography.h3, color: colors.ink },
  historyCardBrand: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  statusBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  historyCardArrow: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },

  // BOTTOM SHEET DETTAGLI PRODOTTO
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: colors.borderStrong },
  sheetCloseBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm + 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },

  sheetContent: { flex: 1 },
  sheetScroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },

  productMainRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: radius.md, resizeMode: 'contain' },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { ...typography.h2, color: colors.ink },
  productBrand: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  productBarcode: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }) },

  // Scheda Risultato Semaforo
  resultCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  resultTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  resultText: { ...typography.body, lineHeight: 20 },

  // Mappatura Allergeni Trovati
  matchesSection: { gap: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.ink, fontWeight: '800' },
  matchItemRow: { flexDirection: 'column', gap: spacing.xs, marginTop: spacing.xs },
  matchItemLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  matchBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },

  allergenBadge: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeRed: { backgroundColor: colors.redBg, borderColor: colors.redBorder },
  badgeYellow: { backgroundColor: colors.amberBg, borderColor: colors.amberBorder },
  allergenBadgeText: { fontSize: 12, fontWeight: '800', color: colors.inkSoft },

  // Lista Ingredienti Completa
  ingredientsSection: { gap: spacing.sm },
  ingredientsBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientsText: { ...typography.body, color: colors.inkSoft, lineHeight: 22 },
  disclaimerText: { fontSize: 11, color: colors.textMuted, lineHeight: 15, marginTop: spacing.sm },

  // Bottone chiusura sheet
  sheetActionButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sheetActionText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.ink,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  sheetFavBtn: {
    padding: spacing.sm,
  },
  sheetFavEmoji: {
    fontSize: 24,
  },
  profileSwitcherContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  profileSwitcherScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    alignItems: 'center',
  },
  profileSwitcherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  profileSwitcherBtnActive: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdf4',
  },
  profileSwitcherText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  profileSwitcherTextActive: {
    color: colors.brand,
  },
});
