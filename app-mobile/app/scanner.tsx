import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  InputAccessoryView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { fetchAndAnalyzeBarcode, extractProductBarcode, analyzeFromLabelAi, getSourceBadgeInfo, type ScannedProduct } from '../src/services/barcodeScan';
import {
  findCachedProduct,
  loadProductFavorites,
  loadScanHistory,
  saveToScanHistory,
  toggleProductFavorite,
} from '../src/services/productStorage';
import { useSession } from '../src/store/session';
import { TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { useTranslation } from '../src/constants/translations';
import {
  AppText,
  MatchChip,
  SurfaceButton,
  PaperMenuResultModal,
  ProUpgradeModal,
  MenuScanModal,
} from '../src/components/ui';
import { colors, font, radius, spacing, softShadow, WIREFRAME_MODE, MIN_TOUCH_TARGET } from '../src/theme';
import { wireBox } from '../src/wireframe';

const CODE_LENGTH = 6;
const MANUAL_INPUT_ACCESSORY_ID = 'allertgy-manual-code-empty';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/** Termini da evidenziare negli ingredienti (codice allergene → varianti IT/EN). */
const INGREDIENT_HIGHLIGHTS: Record<string, string[]> = {
  uova: ['uova', 'uovo', 'egg', 'eggs'],
  latte: ['latte', 'lattosio', 'milk', 'lactose', 'whey', 'casein', 'caseina'],
  glutine: ['glutine', 'gluten', 'frumento', 'grano', 'wheat', 'orzo', 'barley', 'segale', 'rye', 'avena', 'oat'],
  soia: ['soia', 'soy', 'soya'],
  arachidi: ['arachidi', 'arachide', 'peanut', 'peanuts'],
  pesce: ['pesce', 'fish'],
  crostacei: ['crostacei', 'crustacean', 'gamberi', 'shrimp'],
  sesamo: ['sesamo', 'sesame'],
  senape: ['senape', 'mustard'],
  sedano: ['sedano', 'celery'],
  solfiti: ['solfiti', 'solfito', 'sulfite', 'sulphite', 'anidride solforosa'],
  molluschi: ['molluschi', 'mollusc', 'mollusk'],
  lupini: ['lupini', 'lupin'],
  frutta_a_guscio: ['frutta a guscio', 'nuts', 'mandorle', 'nocciole', 'noci', 'almond', 'hazelnut', 'walnut'],
};

function parseQrCode(data: string): string | null {
  const code = data
    .replace(/^allertgy:\/?\/?/i, '')
    .replace(/^.*\/r\//i, '')
    .split(/[?#]/)[0]
    .trim();
  return /^\d{6}$/.test(code) ? code : null;
}

function buildHighlightTerms(codes: string[], extra: string[] = []): string[] {
  const terms = new Set<string>();
  for (const code of codes) {
    for (const t of INGREDIENT_HIGHLIGHTS[code] || []) terms.add(t.toLowerCase());
    const trans = TRANSLATED_ALLERGENS[code];
    if (trans) {
      terms.add(trans.it.toLowerCase());
      terms.add(trans.en.toLowerCase());
    }
  }
  for (const e of extra) {
    if (e.trim()) terms.add(e.trim().toLowerCase());
  }
  return [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
}

function renderHighlightedIngredients(
  text: string,
  redTerms: string[],
  yellowTerms: string[],
): ReactNode {
  if (!text.trim()) return text;
  const all = [...new Set([...redTerms, ...yellowTerms])];
  if (all.length === 0) return text;

  const escaped = all.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  const redSet = new Set(redTerms.map((t) => t.toLowerCase()));
  const yellowSet = new Set(yellowTerms.map((t) => t.toLowerCase()));

  return parts.map((part, i) => {
    const key = part.toLowerCase();
    if (redSet.has(key)) {
      return (
        <Text key={`h-${i}`} style={styles.ingredientHitRed}>
          {part}
        </Text>
      );
    }
    if (yellowSet.has(key)) {
      return (
        <Text key={`h-${i}`} style={styles.ingredientHitYellow}>
          {part}
        </Text>
      );
    }
    return <Text key={`h-${i}`}>{part}</Text>;
  });
}

/** Scanner unificato: QR ristoranti + barcode supermercato + codice manuale. */
export default function Scanner() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams<{ barcode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);
  const handledBarcodeRef = useRef<string | null>(null);
  const [invalidHint, setInvalidHint] = useState('');
  const [torch, setTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ScannedProduct | null>(null);
  const [productFavorites, setProductFavorites] = useState<ScannedProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [manualExpanded, setManualExpanded] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasPlus, setHasPlus] = useState(false);
  const [scanMode, setScanMode] = useState<'single' | 'batch'>('single');
  const [batchItems, setBatchItems] = useState<ScannedProduct[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const lastBatchScanRef = useRef<{ barcode: string; time: number }>({ barcode: '', time: 0 });
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [labelCaptureMode, setLabelCaptureMode] = useState(false);
  const [paperMenuCaptureMode, setPaperMenuCaptureMode] = useState(false);
  const [analyzingLabel, setAnalyzingLabel] = useState(false);
  const [analyzingPaperMenu, setAnalyzingPaperMenu] = useState(false);
  const [paperMenuDishes, setPaperMenuDishes] = useState<any[]>([]);
  const [showPaperMenuModal, setShowPaperMenuModal] = useState(false);
  const [showMenuScanModal, setShowMenuScanModal] = useState(false);
  const [menuScanModalInitialMode, setMenuScanModalInitialMode] = useState<'select' | 'url'>('select');
  const [showProModal, setShowProModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState<'paper_menu' | 'label_scan'>('paper_menu');
  const cameraRef = useRef<CameraView | null>(null);

  const openProModal = useCallback((feature: 'paper_menu' | 'label_scan' = 'paper_menu') => {
    setProModalFeature(feature);
    setShowProModal(true);
  }, []);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const manualSheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const manualBackdropAnim = useRef(new Animated.Value(0)).current;

  const openManualSheet = useCallback(() => {
    void Haptics.selectionAsync();
    setManualError('');
    setManualExpanded(true);
    manualSheetAnim.setValue(SCREEN_HEIGHT * 0.28);
    manualBackdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(manualSheetAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 240,
        mass: 0.85,
        useNativeDriver: true,
      }),
      Animated.timing(manualBackdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [manualBackdropAnim, manualSheetAnim]);

  const closeManualSheet = useCallback(() => {
    Keyboard.dismiss();
    setManualError('');
    Animated.parallel([
      Animated.timing(manualSheetAnim, {
        toValue: SCREEN_HEIGHT * 0.35,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(manualBackdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setManualExpanded(false);
    });
  }, [manualBackdropAnim, manualSheetAnim]);

  useEffect(() => {
    if (!manualExpanded) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [manualExpanded]);

  const {
    allergie: primaryAllergies,
    allergyCriteria: primaryCriteria,
    ingredientiEsclusi,
    language,
    subProfiles,
    setSubProfiles,
    activeProfileId,
    setActiveProfileId,
    token,
  } = useSession();

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const allergie = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const allergyCriteria = useMemo(() => {
    if (activeProfile) {
      const map: Record<string, 'assoluto' | 'crudo' | 'cotto'> = {};
      for (const a of activeProfile.allergens) {
        map[a.code] = a.criterio || 'assoluto';
      }
      return map;
    }
    return primaryCriteria || {};
  }, [activeProfile, primaryCriteria]);

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase().startsWith('it');
  const scanningDisabled =
    !isFocused ||
    !!activeProduct ||
    analyzingLabel ||
    labelCaptureMode ||
    analyzingPaperMenu ||
    paperMenuCaptureMode ||
    manualExpanded;
  const bottomInset = insets.bottom + spacing.md;
  const frameWidth = paperMenuCaptureMode
    ? Math.min(SCREEN_WIDTH - 36, 360)
    : labelCaptureMode
    ? Math.min(SCREEN_WIDTH - 40, 350)
    : Math.min(SCREEN_WIDTH - 48, 320);
  const frameHeight = paperMenuCaptureMode
    ? Math.min(SCREEN_HEIGHT * 0.44, 360)
    : labelCaptureMode
    ? 210
    : Math.min(SCREEN_WIDTH - 48, 320);

  const applyPaperMenuResult = useCallback((res: { piatti?: any[]; note?: string } | null, emptyMessage: string) => {
    if (res?.piatti && res.piatti.length > 0) {
      setPaperMenuDishes(res.piatti);
      setShowPaperMenuModal(true);
      setPaperMenuCaptureMode(false);
      return;
    }
    Alert.alert(
      isIt ? 'Nessun piatto rilevato' : 'No dishes found',
      emptyMessage,
    );
  }, [isIt]);

  const analyzePaperMenuFromUri = useCallback(async (uri: string, filename = 'menu_paper.jpg') => {
    const formData = new FormData();
    const name = uri.split('/').pop() || filename;
    const match = /\.(\w+)$/.exec(name);
    const ext = (match?.[1] || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('file', {
      uri,
      name: name.includes('.') ? name : filename,
      type,
    } as any);

    const res = await api.analyzePaperMenu(formData);
    applyPaperMenuResult(
      res,
      isIt
        ? 'Non sono stati identificati piatti nella foto. Assicurati che il menù sia ben illuminato e a fuoco.'
        : 'No dishes were identified in the photo. Make sure the menu is well lit and in focus.',
    );
  }, [applyPaperMenuResult, isIt]);

  const capturePaperMenuPhoto = useCallback(async () => {
    if (!cameraRef.current || analyzingPaperMenu) return;
    try {
      setAnalyzingPaperMenu(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error(isIt ? 'Foto non acquisita' : 'Photo not captured');
      await analyzePaperMenuFromUri(photo.uri, 'menu_paper.jpg');
    } catch (err: any) {
      Alert.alert(
        isIt ? 'Errore scansione menù' : 'Menu scan error',
        err.message || (isIt ? 'Impossibile analizzare il menù' : 'Unable to analyze the menu'),
      );
    } finally {
      setAnalyzingPaperMenu(false);
    }
  }, [analyzePaperMenuFromUri, analyzingPaperMenu, isIt]);

  const pickPaperMenuFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isIt ? 'Permesso negato' : 'Permission denied',
          isIt
            ? 'Consenti l\'accesso alla galleria per caricare una foto del menù.'
            : 'Allow photo library access to upload a menu photo.',
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      setAnalyzingPaperMenu(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await analyzePaperMenuFromUri(res.assets[0].uri);
    } catch (err: any) {
      Alert.alert(
        isIt ? 'Errore scansione menù' : 'Menu scan error',
        err.message || (isIt ? 'Impossibile analizzare il menù' : 'Unable to analyze the menu'),
      );
    } finally {
      setAnalyzingPaperMenu(false);
    }
  }, [analyzePaperMenuFromUri, isIt]);

  const handlePaperMenuUrl = useCallback(
    async (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) return;
      const finalUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

      setShowMenuScanModal(false);
      try {
        setAnalyzingPaperMenu(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const res = await api.analyzePaperMenuUrl(finalUrl);
        applyPaperMenuResult(
          res,
          isIt
            ? 'Non sono stati identificati piatti da questo link. Prova un URL pubblico del menù o un PDF.'
            : 'No dishes were found from this link. Try a public menu URL or PDF.',
        );
      } catch (err: any) {
        Alert.alert(
          isIt ? 'Errore link menù' : 'Menu link error',
          err.message || (isIt ? 'Impossibile analizzare il menù online' : 'Unable to analyze the online menu'),
        );
      } finally {
        setAnalyzingPaperMenu(false);
      }
    },
    [applyPaperMenuResult, isIt],
  );

  const openPaperMenuOptions = useCallback(() => {
    if (!hasPlus) {
      openProModal('paper_menu');
      return;
    }
    void Haptics.selectionAsync();
    setMenuScanModalInitialMode('select');
    setShowMenuScanModal(true);
  }, [hasPlus, openProModal]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  const refreshLists = useCallback(async () => {
    const [favs, history] = await Promise.all([
      loadProductFavorites(),
      loadScanHistory(),
    ]);
    setProductFavorites(favs);
    setScanHistory(history);
  }, []);

  useEffect(() => {
    refreshLists();
    if (token) {
      api.getSubProfiles().then(setSubProfiles).catch(() => {});
      Promise.all([
        api.getProfile().catch(() => null),
        api.getReferralStats().catch(() => null),
      ]).then(([profile, referral]) => {
        setHasPlus(!!(profile?.has_customer_plus || referral?.has_plus));
      });
    } else {
      setHasPlus(false);
    }
  }, [token, refreshLists, setSubProfiles]);

  const openProductSheet = useCallback((product: ScannedProduct) => {
    setActiveProduct(product);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeProductSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveProduct(null);
      setNotFoundBarcode(null);
      scanned.current = false;
    });
  }, [slideAnim]);

  const dismissNotFound = useCallback(() => {
    setNotFoundBarcode(null);
    setLabelCaptureMode(false);
    scanned.current = false;
    setInvalidHint('');
  }, []);

  const handleProduct = useCallback(async (rawBarcode: string, opts?: { allowCache?: boolean }) => {
    const barcode = extractProductBarcode(rawBarcode);
    if (!barcode) {
      setInvalidHint(isIt ? 'Codice prodotto non valido' : 'Invalid product code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setInvalidHint(''), 2800);
      return;
    }

    if (scanMode === 'batch') {
      const now = Date.now();
      if (barcode === lastBatchScanRef.current.barcode && now - lastBatchScanRef.current.time < 2200) {
        return;
      }
      lastBatchScanRef.current = { barcode, time: now };
      try {
        const product = await fetchAndAnalyzeBarcode(barcode, allergie, ingredientiEsclusi, allergyCriteria);
        if (product.status === 'verde') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (product.status === 'giallo') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setBatchItems((prev) => [product, ...prev.filter((p) => p.barcode !== product.barcode)]);
        void saveToScanHistory(product);
      } catch {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setInvalidHint(isIt ? `Prodotto ${barcode} non in archivio` : `Product ${barcode} not found`);
        setTimeout(() => setInvalidHint(''), 2500);
      }
      return;
    }

    if (scanned.current) return;

    scanned.current = true;
    setLoadingProduct(true);
    setInvalidHint('');
    setManualError('');

    try {
      if (opts?.allowCache) {
        const cached = await findCachedProduct(barcode);
        if (cached) {
          openProductSheet(cached);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }
      }

      if (token) {
        try {
          await api.recordBarcodeScan();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : '';
          if (msg.includes('limite') || msg.includes('limit')) {
            setInvalidHint(msg);
            scanned.current = false;
            return;
          }
        }
      }

      const product = await fetchAndAnalyzeBarcode(barcode, allergie, ingredientiEsclusi, allergyCriteria);
      const history = await saveToScanHistory(product);
      setScanHistory(history);
      openProductSheet(product);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      if (token) {
        try {
          const cached = await api.getProductLabelCache(barcode);
          const product = analyzeFromLabelAi(
            {
              barcode: cached.barcode,
              product_name: cached.product_name,
              brand: cached.brand,
              ingredients: cached.ingredients,
              allergeni_contenuti: cached.allergeni_contenuti,
              allergeni_tracce: cached.allergeni_tracce,
            },
            allergie,
            ingredientiEsclusi,
            {
              source: 'community_cache',
              aiNote: isIt
                ? 'Etichetta già in archivio AllerTgy — nessuna analisi AI necessaria.'
                : 'Label already in AllerTgy archive — no AI analysis needed.',
            },
            allergyCriteria,
          );
          const history = await saveToScanHistory(product);
          setScanHistory(history);
          openProductSheet(product);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        } catch {
          // non in archivio server
        }
      }

      scanned.current = false;
      setNotFoundBarcode(barcode);
      setInvalidHint('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (!hasPlus) {
        openProModal('label_scan');
      }
    } finally {
      setLoadingProduct(false);
    }
  }, [allergie, allergyCriteria, hasPlus, ingredientiEsclusi, isIt, openProModal, openProductSheet, token]);

  const analyzeLabelPhoto = useCallback(async (uri: string, barcode: string) => {
    if (!token) {
      Alert.alert(
        isIt ? 'Accedi per continuare' : 'Sign in to continue',
        isIt
          ? 'L\'analisi AI delle etichette richiede un account Pro.'
          : 'AI label analysis requires a Pro account.',
      );
      return;
    }

    setAnalyzingLabel(true);
    setInvalidHint('');
    try {
      const filename = uri.split('/').pop() || 'etichetta.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match
        ? (match[1].toLowerCase() === 'png' ? 'image/png' : match[1].toLowerCase() === 'webp' ? 'image/webp' : 'image/jpeg')
        : 'image/jpeg';

      const result = await api.analyzeProductLabel(uri, barcode, mimeType);
      const product = analyzeFromLabelAi(
        {
          barcode: result.barcode || barcode,
          product_name: result.product_name,
          brand: result.brand,
          ingredients: result.ingredients,
          allergeni_contenuti: result.allergeni_contenuti,
          allergeni_tracce: result.allergeni_tracce,
          note: result.note,
        },
        allergie,
        ingredientiEsclusi,
        {
          source: result.from_cache ? 'community_cache' : 'ai_label',
          aiNote: result.note,
        },
        allergyCriteria,
      );
      const history = await saveToScanHistory(product);
      setScanHistory(history);
      setNotFoundBarcode(null);
      setLabelCaptureMode(false);
      openProductSheet(product);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (isIt ? 'Analisi etichetta fallita' : 'Label analysis failed');
      setInvalidHint(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setInvalidHint(''), 4000);
    } finally {
      setAnalyzingLabel(false);
    }
  }, [allergie, allergyCriteria, ingredientiEsclusi, isIt, openProductSheet, token]);

  const beginLabelCapture = useCallback(() => {
    if (!notFoundBarcode) return;

    if (!token) {
      Alert.alert(
        isIt ? 'Accedi per continuare' : 'Sign in to continue',
        isIt ? 'Crea un account per usare l\'analisi AI delle etichette.' : 'Create an account to use AI label analysis.',
        [
          { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
          { text: isIt ? 'Accedi' : 'Sign in', onPress: () => router.push('/login') },
        ],
      );
      return;
    }

    if (!hasPlus) {
      openProModal('label_scan');
      return;
    }

    setInvalidHint('');
    setLabelCaptureMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hasPlus, isIt, notFoundBarcode, openProModal, token]);

  const captureCurrentLabel = useCallback(async () => {
    if (!notFoundBarcode || !cameraRef.current || analyzingLabel) return;
    setAnalyzingLabel(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (!picture?.uri) throw new Error(isIt ? 'Immagine non disponibile' : 'Image unavailable');
      await analyzeLabelPhoto(picture.uri, notFoundBarcode);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (isIt ? 'Acquisizione fallita' : 'Capture failed');
      setInvalidHint(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAnalyzingLabel(false);
    }
  }, [analyzeLabelPhoto, analyzingLabel, isIt, notFoundBarcode]);

  const handleReportProduct = useCallback((product: ScannedProduct) => {
    Alert.alert(
      isIt ? 'Segnalazione o Riscansione' : 'Report or Re-scan',
      isIt
        ? 'Hai notato una ricetta diversa o ingredienti aggiornati su questa confezione?'
        : 'Did you notice a different recipe or updated ingredients on this package?',
      [
        {
          text: isIt ? 'Annulla' : 'Cancel',
          style: 'cancel',
        },
        {
          text: isIt ? 'Inquadra nuova etichetta (AI)' : 'Scan new label (AI)',
          onPress: () => {
            closeProductSheet();
            setNotFoundBarcode(product.barcode);
            if (!hasPlus) {
              openProModal('label_scan');
            } else {
              setLabelCaptureMode(true);
            }
          },
        },
        {
          text: isIt ? 'Segnala ricetta modificata' : 'Report modified recipe',
          onPress: async () => {
            try {
              if (token) {
                await api.reportBarcode(product.barcode, 'recipe_changed');
              }
              Alert.alert(
                isIt ? 'Grazie per la segnalazione' : 'Thank you for reporting',
                isIt
                  ? 'La tua segnalazione aiuta a mantenere aggiornato il database per tutta la community.'
                  : 'Your report helps keep the database updated for the whole community.',
              );
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              // ignore
            }
          },
        },
      ],
    );
  }, [closeProductSheet, hasPlus, isIt, openProModal, token]);


  useEffect(() => {
    const barcode = params.barcode ? String(params.barcode) : null;
    if (!barcode || !isFocused) return;
    if (handledBarcodeRef.current === barcode) return;
    handledBarcodeRef.current = barcode;
    handleProduct(barcode, { allowCache: true });
  }, [params.barcode, isFocused, handleProduct]);

  useFocusEffect(
    useCallback(() => () => {
      handledBarcodeRef.current = null;
    }, []),
  );

  const openMenu = async (rawCode: string) => {
    const target = rawCode.trim();
    if (!/^\d{6}$/.test(target)) {
      setManualError(t('code_invalid_format'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setCodeLoading(true);
    setManualError('');
    try {
      await api.menu(target);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeManualSheet();
      router.replace(`/menu/${target}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setManualError(
        msg.includes('404') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('non trovato')
          ? t('code_not_found')
          : t('code_network_error'),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCodeLoading(false);
    }
  };

  /** Un solo campo: 6 cifre = locale, 8–14 = barcode prodotto. */
  const submitManualCode = () => {
    const digits = manualInput.replace(/\D/g, '');
    if (digits.length === CODE_LENGTH) {
      void openMenu(digits);
      return;
    }
    const barcode = extractProductBarcode(digits);
    if (barcode) {
      setManualError('');
      closeManualSheet();
      handleProduct(barcode);
      return;
    }
    setManualError(
      isIt
        ? 'Inserisci 6 cifre (locale) oppure 8–14 cifre (prodotto)'
        : 'Enter 6 digits (venue) or 8–14 digits (product)',
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const manualHint = useMemo(() => {
    const len = manualInput.length;
    if (len === 0) {
      return isIt ? '6 cifre locale · oppure 8–14 barcode' : '6-digit venue · or 8–14 barcode';
    }
    if (len < CODE_LENGTH) {
      return isIt ? `Locale · ancora ${CODE_LENGTH - len}` : `Venue · ${CODE_LENGTH - len} left`;
    }
    if (len === CODE_LENGTH) {
      return isIt ? 'Codice locale riconosciuto' : 'Venue code recognized';
    }
    if (len < 8) {
      return isIt ? 'Barcode troppo corto (min. 8)' : 'Barcode too short (min. 8)';
    }
    return isIt ? 'Barcode prodotto riconosciuto' : 'Product barcode recognized';
  }, [isIt, manualInput.length]);

  const canSubmitManual = manualInput.length === CODE_LENGTH || (manualInput.length >= 8 && manualInput.length <= 14);
  const manualBusy = codeLoading || loadingProduct;

  /** Riconosce automaticamente QR locale e barcode prodotto. */
  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scanningDisabled || scanned.current || loadingProduct || analyzingPaperMenu) return;

    const restaurantCode = parseQrCode(data);
    if (restaurantCode) {
      scanned.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/menu/${restaurantCode}`);
      return;
    }

    const productBarcode = extractProductBarcode(data);
    if (productBarcode) {
      handleProduct(productBarcode);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setInvalidHint(t('scan_invalid_qr'));
    setTimeout(() => setInvalidHint(''), 2800);
  };

  const onToggleFavorite = async (prod: ScannedProduct) => {
    const updated = await toggleProductFavorite(prod);
    setProductFavorites(updated);
  };

  const getAllergenLabel = (code: string) => {
    const trans = TRANSLATED_ALLERGENS[code];
    if (trans) return isIt ? trans.it : trans.en;
    return code;
  };

  const openHistoryProduct = (product: ScannedProduct) => {
    scanned.current = true;
    openProductSheet(product);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.iconWrap, softShadow(8)]}>
          <Ionicons name="scan-outline" size={40} color={colors.brand} />
        </View>
        <AppText variant="h2" style={{ textAlign: 'center', marginTop: spacing.lg }}>
          {t('grocery_scanner_desc')}
        </AppText>
        <SurfaceButton
          label={t('allow_camera_btn')}
          onPress={requestPermission}
          icon="camera"
          style={{ marginTop: spacing.xl }}
        />
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          <AppText variant="bodyBold" color={colors.brand}>{t('close_btn')}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanningDisabled ? undefined : onBarcodeScanned}
      />

      {!isFocused && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111' }]} />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.16, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => {
            if (paperMenuCaptureMode) {
              void Haptics.selectionAsync();
              setPaperMenuCaptureMode(false);
            } else {
              router.back();
            }
          }}
          style={styles.topBtn}
          hitSlop={8}
          accessibilityLabel={isIt ? 'Chiudi' : 'Close'}
        >
          <Ionicons
            name={paperMenuCaptureMode ? 'arrow-back-outline' : 'close-outline'}
            size={22}
            color="#FFF"
          />
        </Pressable>

        {/* MODE SWITCHER OR TITLE */}
        {paperMenuCaptureMode ? (
          <View style={styles.menuCaptureTitleBadge}>
            <Ionicons name="restaurant-outline" size={15} color="#FFF" />
            <AppText variant="caption" color="#FFF" style={styles.menuCaptureTitleText}>
              {isIt ? 'Scatta Foto Menù' : 'Scan Menu Photo'}
            </AppText>
          </View>
        ) : (
          <View style={styles.modeSwitcherWrap}>
            <Pressable
              style={[styles.modeTabBtn, scanMode === 'single' && styles.modeTabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setScanMode('single');
              }}
            >
              <Ionicons name="scan-outline" size={13} color={scanMode === 'single' ? '#1E1B4B' : '#FFF'} />
              <AppText variant="caption" style={[styles.modeTabText, scanMode === 'single' && styles.modeTabTextActive]}>
                {isIt ? 'Singolo' : 'Single'}
              </AppText>
            </Pressable>
            <Pressable
              style={[styles.modeTabBtn, scanMode === 'batch' && styles.modeTabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setScanMode('batch');
              }}
            >
              <Ionicons name="cart-outline" size={13} color={scanMode === 'batch' ? '#1E1B4B' : '#FFF'} />
              <AppText variant="caption" style={[styles.modeTabText, scanMode === 'batch' && styles.modeTabTextActive]}>
                {isIt ? 'Spesa' : 'Batch'}
              </AppText>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => setTorch((v) => !v)}
          style={[styles.topBtn, torch && styles.topBtnOn]}
          hitSlop={8}
          accessibilityLabel={isIt ? 'Torcia' : 'Torch'}
        >
          <Ionicons
            name={torch ? 'flash-outline' : 'flash-off-outline'}
            size={20}
            color={torch ? colors.brandDark : '#FFF'}
          />
        </Pressable>
      </View>

      <View style={styles.overlay} pointerEvents="none">
        <View
          style={[
            styles.frame,
            { width: frameWidth, height: frameHeight },
            labelCaptureMode && styles.frameProduct,
            WIREFRAME_MODE && wireBox({ dashed: true }),
          ]}
        >
          {!WIREFRAME_MODE && (
            <>
              <View style={styles.frameGlass} />
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-frameHeight / 2 + 22, frameHeight / 2 - 22],
                      }),
                    }],
                  },
                ]}
              />
            </>
          )}
        </View>

        {(!notFoundBarcode || labelCaptureMode || paperMenuCaptureMode) ? (
          <>
            <AppText variant="bodyBold" color="#FFF" style={styles.scanHint}>
              {paperMenuCaptureMode
                ? (isIt ? 'Inquadra il menù cartaceo' : 'Frame the paper menu')
                : labelCaptureMode
                ? (isIt ? 'Lista ingredienti nel riquadro' : 'Ingredients list in the frame')
                : (isIt ? 'Inquadra QR o codice a barre' : 'Frame QR or barcode')}
            </AppText>
            {paperMenuCaptureMode ? (
              <AppText variant="caption" color="rgba(255,255,255,0.88)" style={styles.scanHintSub}>
                {isIt
                  ? 'Tocca il pulsante in basso per scattare la foto'
                  : 'Tap the button below to take a photo'}
              </AppText>
            ) : labelCaptureMode ? (
              <AppText variant="caption" color="rgba(255,255,255,0.82)" style={styles.scanHintSub}>
                {isIt
                  ? 'Verifica sempre l’etichetta fisica'
                  : 'Always verify the physical label'}
              </AppText>
            ) : null}
          </>
        ) : null}

        {invalidHint && !notFoundBarcode ? (
          <View style={[styles.scanBanner, styles.scanBannerError]}>
            <View style={styles.scanBannerIconError}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.onRed} />
            </View>
            <View style={styles.scanBannerCopy}>
              <AppText variant="bodyBold" style={[styles.scanBannerTitle, styles.hintTextError]}>
                {invalidHint}
              </AppText>
            </View>
          </View>
        ) : null}

        {loadingProduct && (
          <ActivityIndicator color="#FFF" size="large" style={{ marginTop: spacing.md }} />
        )}
        {analyzingLabel && (
          <View style={styles.aiLoading}>
            <ActivityIndicator color="#FFF" size="small" />
            <AppText variant="caption" color="#FFF">
              {isIt ? 'Analisi etichetta con AI…' : 'Analyzing label with AI…'}
            </AppText>
          </View>
        )}
        {analyzingPaperMenu && (
          <View style={styles.aiLoading}>
            <ActivityIndicator color="#FFF" size="small" />
            <AppText variant="caption" color="#FFF">
              {isIt ? 'Analisi menù con AI…' : 'Analyzing menu with AI…'}
            </AppText>
          </View>
        )}
      </View>

      {!activeProduct && notFoundBarcode && !labelCaptureMode && !showProModal && (
        <View style={[styles.notFoundPanel, { paddingBottom: Math.max(insets.bottom, spacing.md) + 8 }]}>
          <View style={styles.notFoundHandle} />
          <View style={styles.notFoundBody}>
            <View style={styles.notFoundTop}>
              <View style={styles.notFoundIconWrap}>
                <Ionicons name="scan-outline" size={22} color={colors.brand} />
              </View>
              <Pressable
                onPress={dismissNotFound}
                style={styles.notFoundClose}
                hitSlop={10}
                accessibilityLabel={isIt ? 'Chiudi' : 'Close'}
              >
                <Ionicons name="close-outline" size={18} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            <AppText variant="h2" color={colors.brandInk} style={styles.notFoundTitle}>
              {isIt ? 'Prodotto non presente' : 'Product not found'}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.notFoundSubtitle}>
              {isIt
                ? 'Questo codice non è ancora in AllerTgy.'
                : 'This code isn’t in AllerTgy yet.'}
            </AppText>

            <View style={styles.notFoundCodeRow}>
              <AppText variant="eyebrow" color={colors.onSurfaceMuted}>
                {isIt ? 'Codice' : 'Code'}
              </AppText>
              <Text style={styles.notFoundCode} numberOfLines={1}>
                {notFoundBarcode}
              </Text>
            </View>

            {hasPlus ? (
              <>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.notFoundHint}>
                  {isIt
                    ? 'Fotografa la lista ingredienti: l’AI fa il semaforo per te.'
                    : 'Photograph the ingredients list — AI runs the traffic light for you.'}
                </AppText>
                <SurfaceButton
                  label={isIt ? 'Inquadra ingredienti' : 'Frame ingredients'}
                  onPress={beginLabelCapture}
                  disabled={analyzingLabel}
                  icon="camera"
                  style={styles.notFoundCta}
                />
              </>
            ) : (
              <>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.notFoundHint}>
                  {isIt
                    ? 'Con Pro puoi analizzare l’etichetta con l’AI.'
                    : 'With Pro you can analyze the label with AI.'}
                </AppText>
                <SurfaceButton
                  label={isIt ? 'Attiva Pro per scansione AI' : 'Unlock Pro for AI scan'}
                  onPress={() => openProModal('label_scan')}
                  icon="sparkles"
                  style={styles.notFoundCta}
                />
              </>
            )}

            <Pressable onPress={dismissNotFound} style={styles.retryLink} hitSlop={8}>
              <AppText variant="label" color={colors.brand}>
                {isIt ? 'Riprova scansione' : 'Scan again'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      {!activeProduct && notFoundBarcode && labelCaptureMode && (
        <View style={[styles.labelCapturePanel, { bottom: bottomInset }]}>
          <View style={styles.labelCaptureRow}>
            <Pressable
              onPress={() => {
                setLabelCaptureMode(false);
                setInvalidHint('');
              }}
              style={styles.labelCancelButton}
              disabled={analyzingLabel}
            >
              <Ionicons name="arrow-back-outline" size={18} color="#FFF" />
              <AppText variant="caption" color="#FFF">
                {isIt ? 'Indietro' : 'Back'}
              </AppText>
            </Pressable>
            <Pressable
              onPress={captureCurrentLabel}
              style={[styles.labelAnalyzeButton, analyzingLabel && styles.labelAnalyzeButtonDisabled]}
              disabled={analyzingLabel}
            >
              {analyzingLabel ? (
                <ActivityIndicator color={colors.brandDark} size="small" />
              ) : (
                <Ionicons name="sparkles-outline" size={20} color={colors.brandDark} />
              )}
              <AppText variant="bodyBold" color={colors.brandDark}>
                {analyzingLabel
                  ? (isIt ? 'Analisi in corso…' : 'Analyzing…')
                  : (isIt ? 'Analizza ingredienti' : 'Analyze ingredients')}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      {!activeProduct && !notFoundBarcode && !manualExpanded && !paperMenuCaptureMode && scanHistory.length > 0 && (
        <View style={[styles.historyPanel, { bottom: bottomInset + 78 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {scanHistory.slice(0, 8).map((item) => (
              <Pressable
                key={item.barcode}
                style={styles.historyChip}
                onPress={() => openHistoryProduct(item)}
              >
                <AppText variant="caption" color="#FFF" numberOfLines={1} style={styles.historyChipText}>
                  {item.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* PAPER MENU PHOTO SHUTTER DOCK */}
      {!activeProduct && !notFoundBarcode && !labelCaptureMode && paperMenuCaptureMode && (
        <View style={[styles.shutterDock, { bottom: bottomInset }]}>
          <View style={styles.shutterRow}>
            {/* Gallery button */}
            <Pressable
              onPress={() => {
                void pickPaperMenuFromGallery();
              }}
              style={styles.shutterSideBtn}
              disabled={analyzingPaperMenu}
              accessibilityLabel={isIt ? 'Carica da galleria' : 'Upload from gallery'}
            >
              <View style={styles.shutterSideIconWrap}>
                <Ionicons name="images-outline" size={20} color="#FFF" />
              </View>
              <AppText variant="caption" color="#FFF" style={styles.shutterSideLabel}>
                {isIt ? 'Galleria' : 'Gallery'}
              </AppText>
            </Pressable>

            {/* Shutter Button (Tasto per scattare la foto) */}
            <Pressable
              onPress={() => {
                void capturePaperMenuPhoto();
              }}
              disabled={analyzingPaperMenu}
              style={({ pressed }) => [
                styles.shutterButtonOuter,
                pressed && !analyzingPaperMenu && styles.shutterButtonPressed,
                analyzingPaperMenu && styles.shutterButtonDisabled,
              ]}
              accessibilityLabel={isIt ? 'Scatta foto menù' : 'Take menu photo'}
              accessibilityRole="button"
            >
              <View style={styles.shutterButtonInner}>
                {analyzingPaperMenu ? (
                  <ActivityIndicator color={colors.brand} size="small" />
                ) : (
                  <Ionicons name="camera-outline" size={28} color={colors.brand} />
                )}
              </View>
            </Pressable>

            {/* Cancel / Close button */}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setPaperMenuCaptureMode(false);
              }}
              style={styles.shutterSideBtn}
              disabled={analyzingPaperMenu}
              accessibilityLabel={isIt ? 'Annulla' : 'Cancel'}
            >
              <View style={styles.shutterSideIconWrap}>
                <Ionicons name="close-outline" size={20} color="#FFF" />
              </View>
              <AppText variant="caption" color="#FFF" style={styles.shutterSideLabel}>
                {isIt ? 'Annulla' : 'Cancel'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      {!activeProduct && !notFoundBarcode && !labelCaptureMode && !paperMenuCaptureMode && (
        <>
          {!manualExpanded ? (
            <View style={[styles.bottomDock, { bottom: bottomInset }]}>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={openManualSheet}
                  style={styles.actionPill}
                  accessibilityLabel={isIt ? 'Inserisci codice' : 'Enter code'}
                >
                  <Ionicons name="keypad-outline" size={18} color={colors.brand} />
                  <Text style={styles.actionPillLabel}>
                    {isIt ? 'Codice' : 'Code'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={openPaperMenuOptions}
                  style={styles.actionPill}
                  disabled={analyzingPaperMenu}
                  accessibilityLabel={isIt ? 'Analizza menù con AI' : 'Analyze menu with AI'}
                >
                  {analyzingPaperMenu ? (
                    <ActivityIndicator color={colors.brand} size="small" />
                  ) : (
                    <Ionicons name="restaurant-outline" size={18} color={colors.brand} />
                  )}
                  <Text style={styles.actionPillLabel}>
                    {analyzingPaperMenu
                      ? (isIt ? 'Analisi…' : 'Analyzing…')
                      : (isIt ? 'Menù' : 'Menu')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.manualOverlay} pointerEvents="box-none">
              <Animated.View
                style={[
                  styles.manualBackdrop,
                  { opacity: manualBackdropAnim },
                ]}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeManualSheet} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.manualSheet,
                  {
                    bottom: 0,
                    paddingBottom: keyboardHeight > 0
                      ? keyboardHeight + spacing.xs
                      : Math.max(insets.bottom, spacing.md),
                    transform: [{ translateY: manualSheetAnim }],
                  },
                ]}
              >
                <View style={styles.manualSheetHeader}>
                  <View style={styles.sheetHandle} />
                  <View style={styles.manualSheetTitleRow}>
                    <AppText variant="bodyBold" color={colors.onSurface} style={{ flex: 1 }}>
                      {isIt ? 'Inserisci codice' : 'Enter code'}
                    </AppText>
                    <Pressable
                      onPress={closeManualSheet}
                      style={styles.manualCloseBtn}
                      hitSlop={10}
                      accessibilityLabel={isIt ? 'Chiudi' : 'Close'}
                    >
                      <Ionicons name="close-outline" size={18} color={colors.onSurfaceMuted} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.manualBody}>
                  <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.manualHint}>
                    {manualHint}
                  </AppText>
                  <TextInput
                    placeholder={isIt ? 'Codice locale o barcode' : 'Venue code or barcode'}
                    placeholderTextColor={colors.onSurfaceMuted}
                    keyboardType="number-pad"
                    value={manualInput}
                    onChangeText={(v) => {
                      setManualInput(v.replace(/\D/g, '').slice(0, 14));
                      if (manualError) setManualError('');
                    }}
                    maxLength={14}
                    autoFocus
                    style={styles.codeInput}
                    {...(Platform.OS === 'ios'
                      ? { inputAccessoryViewID: MANUAL_INPUT_ACCESSORY_ID }
                      : null)}
                  />
                  {manualError ? (
                    <AppText variant="caption" color={colors.red}>
                      {manualError}
                    </AppText>
                  ) : null}
                  <SurfaceButton
                    label={
                      manualBusy
                        ? (isIt ? 'Attendere…' : 'Please wait…')
                        : (isIt ? 'Invia' : 'Send')
                    }
                    onPress={submitManualCode}
                    disabled={!canSubmitManual || manualBusy}
                    loading={manualBusy}
                    icon="arrow-forward"
                    style={styles.manualSendBtn}
                  />
                </View>
              </Animated.View>

              {Platform.OS === 'ios' ? (
                <InputAccessoryView nativeID={MANUAL_INPUT_ACCESSORY_ID}>
                  <View style={styles.emptyAccessory} />
                </InputAccessoryView>
              ) : null}
            </View>
          )}
        </>
      )}

      {activeProduct && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {(() => {
            const isFav = productFavorites.some((f) => f.barcode === activeProduct.barcode);
            const title = activeProduct.status === 'verde'
              ? (isIt ? 'Idoneo' : 'Suitable')
              : activeProduct.status === 'giallo'
                ? (isIt ? 'Attenzione' : 'Caution')
                : (isIt ? 'Non idoneo' : 'Not suitable');
            const desc = activeProduct.status === 'verde'
              ? (isIt ? 'Nessun allergene del tuo profilo rilevato.' : 'No allergens from your profile detected.')
              : activeProduct.status === 'giallo'
                ? (isIt ? 'Possibili tracce: verifica sempre la confezione.' : 'Possible traces: always check the package.')
                : (isIt ? 'Contiene allergeni incompatibili con il tuo profilo.' : 'Contains allergens incompatible with your profile.');
            const solidBgColor = activeProduct.status === 'verde'
              ? '#E6F6EC'
              : activeProduct.status === 'giallo'
                ? '#FFF4DC'
                : '#FBE4E6';
            const verdictSolid = activeProduct.status === 'verde'
              ? colors.green
              : activeProduct.status === 'giallo'
                ? colors.amber
                : colors.red;
            const verdictOn = activeProduct.status === 'verde'
              ? colors.onGreen
              : activeProduct.status === 'giallo'
                ? colors.onYellow
                : colors.onRed;
            const sourceInfo = getSourceBadgeInfo(activeProduct.source, activeProduct.isCosmetic);
            const sourceLabel = activeProduct.sourceLabel || sourceInfo.label;

            const containsCodes = activeProduct.match_contenuti;
            const excluded = activeProduct.match_esclusi;
            const traces = activeProduct.match_tracce;
            const hasContains = containsCodes.length > 0 || excluded.length > 0;
            const hasTraces = traces.length > 0;
            const redTerms = buildHighlightTerms(containsCodes, excluded);
            const yellowTerms = buildHighlightTerms(traces);

            return (
              <>
                <View
                  style={[styles.productSheetGradient, { backgroundColor: solidBgColor }]}
                  pointerEvents="none"
                />

                <View style={styles.sheetHeader}>
                  <View style={styles.sheetHandle} />
                  <Pressable onPress={closeProductSheet} style={styles.sheetCloseBtn} hitSlop={10}>
                    <Ionicons name="close-outline" size={18} color={colors.onSurfaceMuted} />
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.sheetScroll}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={styles.productHero}>
                    <View style={[styles.productImageFrame, { borderColor: `${verdictSolid}33` }]}>
                      {activeProduct.image ? (
                        <Image source={{ uri: activeProduct.image }} style={styles.productImage} />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Ionicons name={activeProduct.isCosmetic ? 'sparkles-outline' : 'cube-outline'} size={28} color={colors.onSurfaceMuted} />
                        </View>
                      )}
                    </View>

                    <View style={styles.productMeta}>
                      <View style={styles.verdictLine}>
                        <View style={[styles.verdictDot, { backgroundColor: verdictSolid }]} />
                        <AppText variant="caption" color={verdictOn} style={styles.verdictEyebrow}>
                          {title}
                        </AppText>
                        <View style={[styles.sourceBadgeWrap, { backgroundColor: `${sourceInfo.color}18` }]}>
                          <Ionicons name={sourceInfo.icon as any} size={11} color={sourceInfo.color} />
                          <AppText variant="caption" style={[styles.sourceBadgeText, { color: sourceInfo.color }]}>
                            {sourceInfo.label}
                          </AppText>
                        </View>
                      </View>
                      <AppText variant="title" numberOfLines={2} style={styles.productName}>
                        {activeProduct.name}
                      </AppText>
                      {!!activeProduct.brand && (
                        <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
                          {activeProduct.brand}
                        </AppText>
                      )}
                      <View style={styles.productMetaRow}>
                        <AppText variant="caption" color={colors.textMuted} style={styles.barcodeText}>
                          {activeProduct.barcode}
                        </AppText>
                        <Pressable
                          onPress={() => onToggleFavorite(activeProduct)}
                          style={[styles.favOrb, isFav && styles.favOrbOn]}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={17}
                            color={isFav ? colors.red : colors.onSurfaceMuted}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  <AppText variant="caption" color={verdictOn} style={styles.verdictDesc}>
                    {desc}
                  </AppText>

                  {/* Box di Sicurezza Clinica AllerTgy */}
                  <View style={styles.safetyBox}>
                    <Ionicons name="shield-checkmark-outline" size={15} color={colors.brandDark} />
                    <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.safetyBoxText}>
                      {activeProduct.disclaimer || (isIt
                        ? 'Le formulazioni possono variare. Verifica sempre la confezione fisica prima del consumo.'
                        : 'Formulations may vary. Always check the physical package before consumption.')}
                    </AppText>
                  </View>

                  {(hasContains || hasTraces) && (
                    <View style={styles.matchesBlock}>
                      {hasContains && (
                        <View style={[styles.matchPanel, styles.matchPanelRed]}>
                          <View style={styles.matchPanelHead}>
                            <View style={[styles.matchAccent, { backgroundColor: colors.red }]} />
                            <AppText variant="caption" color={colors.redText} style={styles.matchLabel}>
                              {isIt ? 'Negli ingredienti' : 'In ingredients'}
                            </AppText>
                          </View>
                          <View style={styles.matchChips}>
                            {containsCodes.map((code) => (
                              <MatchChip key={code} label={getAllergenLabel(code)} severity="red" />
                            ))}
                            {excluded.map((ing) => (
                              <MatchChip key={ing} label={ing} severity="red" />
                            ))}
                          </View>
                        </View>
                      )}

                      {hasTraces && (
                        <View style={[styles.matchPanel, styles.matchPanelYellow]}>
                          <View style={styles.matchPanelHead}>
                            <View style={[styles.matchAccent, { backgroundColor: colors.amber }]} />
                            <AppText variant="caption" color={colors.amberText} style={styles.matchLabel}>
                              {isIt ? 'Può contenere' : 'May contain'}
                            </AppText>
                          </View>
                          <View style={styles.matchChips}>
                            {traces.map((code) => (
                              <MatchChip key={code} label={getAllergenLabel(code)} severity="yellow" />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.ingredientsBlock}>
                    <AppText variant="bodyBold" style={styles.sectionLabel}>
                      {isIt ? 'Ingredienti / Composizione' : 'Ingredients'}
                    </AppText>
                    <Text style={styles.ingredientsText}>
                      {activeProduct.ingredients
                        ? renderHighlightedIngredients(activeProduct.ingredients, redTerms, yellowTerms)
                        : (isIt ? 'Lista non disponibile' : 'List unavailable')}
                    </Text>
                    <AppText variant="caption" color={colors.textMuted} style={styles.sourceNote}>
                      {sourceLabel}
                      {activeProduct.aiNote ? ` · ${activeProduct.aiNote}` : ''}
                      {activeProduct.lastVerified ? ` · ${new Date(activeProduct.lastVerified).toLocaleDateString()}` : ''}
                    </AppText>
                  </View>

                  <View style={styles.productActionStack}>
                    <SurfaceButton
                      label={isIt ? 'Scansiona altro' : 'Scan another'}
                      onPress={closeProductSheet}
                      variant="primary"
                      icon="scan"
                    />
                    <Pressable
                      onPress={() => handleReportProduct(activeProduct)}
                      style={styles.reportProductBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                      <AppText variant="caption" color={colors.textMuted} style={styles.reportProductBtnText}>
                        {isIt ? 'Ricetta cambiata o errore? Segnala o aggiorna' : 'Recipe changed or error? Report or update'}
                      </AppText>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            );
          })()}
        </Animated.View>
      )}

      <PaperMenuResultModal
        visible={showPaperMenuModal}
        onClose={() => setShowPaperMenuModal(false)}
        dishes={paperMenuDishes}
        userAllergens={allergie}
        userExcludedIngredients={ingredientiEsclusi}
        isIt={isIt}
      />

      <MenuScanModal
        visible={showMenuScanModal}
        initialMode={menuScanModalInitialMode}
        onClose={() => setShowMenuScanModal(false)}
        onSelectPhoto={() => {
          setPaperMenuCaptureMode(true);
        }}
        onSelectGallery={() => { void pickPaperMenuFromGallery(); }}
        onAnalyzeUrl={(url) => { void handlePaperMenuUrl(url); }}
        analyzing={analyzingPaperMenu}
        isIt={isIt}
      />

      {/* BATCH FLOATING MINI-CART BAR */}
      {scanMode === 'batch' && batchItems.length > 0 && !activeProduct && (
        <Pressable
          style={[styles.batchFloatingBar, { bottom: insets.bottom + 92 }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowBatchModal(true);
          }}
        >
          <View style={styles.batchFloatingLeft}>
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
            <AppText variant="bodyBold" color="#FFFFFF" style={{ fontSize: 13.5 }}>
              {batchItems.length} {isIt ? 'prodotti' : 'items'}
            </AppText>
          </View>
          <View style={styles.batchFloatingCounts}>
            <View style={styles.batchCountPill}>
              <View style={[styles.statusDotSmall, { backgroundColor: '#10B981' }]} />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
                {batchItems.filter((b) => b.status === 'verde').length}
              </AppText>
            </View>
            <View style={styles.batchCountPill}>
              <View style={[styles.statusDotSmall, { backgroundColor: '#F59E0B' }]} />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
                {batchItems.filter((b) => b.status === 'giallo').length}
              </AppText>
            </View>
            <View style={styles.batchCountPill}>
              <View style={[styles.statusDotSmall, { backgroundColor: '#EF4444' }]} />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
                {batchItems.filter((b) => b.status === 'rosso').length}
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </Pressable>
      )}

      {/* BATCH CART SUMMARY MODAL */}
      <Modal visible={showBatchModal} animationType="slide" transparent onRequestClose={() => setShowBatchModal(false)}>
        <View style={styles.batchModalOverlay}>
          <View style={[styles.batchModalSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.batchModalHead}>
              <View>
                <AppText variant="title" style={{ color: '#1E1B4B' }}>
                  {isIt ? 'Carrello Spesa AllerTgy' : 'AllerTgy Shopping Cart'}
                </AppText>
                <AppText variant="caption" color="#6B6690">
                  {batchItems.length} {isIt ? 'articoli scansionati' : 'scanned items'}
                </AppText>
              </View>
              <Pressable
                onPress={() => {
                  setBatchItems([]);
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                hitSlop={8}
                style={styles.clearCartBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <AppText variant="caption" color="#EF4444" style={{ fontWeight: '700' }}>
                  {isIt ? 'Svuota' : 'Clear'}
                </AppText>
              </Pressable>
            </View>

            {batchItems.some((b) => b.status === 'rosso') && (
              <View style={styles.batchWarningBanner}>
                <Ionicons name="warning-outline" size={16} color="#DC2626" />
                <AppText variant="caption" color="#991B1B" style={{ fontWeight: '700', flex: 1 }}>
                  {isIt
                    ? 'Attenzione: ci sono prodotti nel carrello con allergeni vietati!'
                    : 'Warning: cart contains items with prohibited allergens!'}
                </AppText>
              </View>
            )}

            <ScrollView style={styles.batchItemList} showsVerticalScrollIndicator={false}>
              {batchItems.map((item) => {
                const dotColor = item.status === 'verde' ? '#10B981' : item.status === 'giallo' ? '#F59E0B' : '#EF4444';
                return (
                  <View key={item.barcode} style={styles.batchItemRow}>
                    <View style={[styles.batchItemDot, { backgroundColor: dotColor }]} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" numberOfLines={1} style={{ color: '#1E1B4B' }}>
                        {item.name}
                      </AppText>
                      <AppText variant="caption" color="#7C789B" numberOfLines={1}>
                        {item.brand || item.barcode}
                        {item.match_contenuti.length > 0 ? ` · ⚠️ ${item.match_contenuti.join(', ')}` : ''}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => {
                        setBatchItems((prev) => prev.filter((p) => p.barcode !== item.barcode));
                        void Haptics.selectionAsync();
                      }}
                      hitSlop={8}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            <SurfaceButton
              label={isIt ? 'Continua a Scansionare' : 'Continue Scanning'}
              onPress={() => setShowBatchModal(false)}
              variant="primary"
              icon="scan"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      <ProUpgradeModal
        visible={showProModal}
        onClose={() => setShowProModal(false)}
        onUpgrade={() => router.push('/(tabs)/account')}
        isIt={isIt}
        feature={proModalFeature}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  brandMark: {
    letterSpacing: 0.2,
  },
  topBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  topBtnOn: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(255,255,255,0.94)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    transform: [{ translateY: -36 }],
  },
  scanHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  scanHintSub: {
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  frame: {
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  frameProduct: {
    borderRadius: radius.lg,
  },
  frameGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: '#FFF', zIndex: 2 },
  tl: { top: 0, left: 0, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderTopLeftRadius: radius.xl },
  tr: { top: 0, right: 0, borderTopWidth: 3.5, borderRightWidth: 3.5, borderTopRightRadius: radius.xl },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderBottomLeftRadius: radius.xl },
  br: { bottom: 0, right: 0, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderBottomRightRadius: radius.xl },
  scanLine: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: '50%',
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    zIndex: 1,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    width: '90%',
    marginTop: spacing.sm,
  },
  scanBannerError: {
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.redBorder,
  },
  scanBannerIconError: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.18)',
  },
  scanBannerCopy: {
    flex: 1,
    gap: 2,
  },
  scanBannerTitle: {
    color: colors.brandInk,
    fontSize: 14,
    lineHeight: 18,
  },
  hintTextError: { color: colors.onRed },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  notFoundPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
  },
  notFoundHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  notFoundBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  notFoundTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  notFoundIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
  notFoundClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTertiary,
  },
  notFoundTitle: {
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  notFoundSubtitle: {
    marginBottom: spacing.md,
  },
  notFoundCodeRow: {
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand50,
    marginBottom: spacing.md,
  },
  notFoundCode: {
    fontFamily: font.displaySemibold,
    fontSize: 17,
    letterSpacing: 0.6,
    color: colors.brandInk,
  },
  notFoundHint: {
    marginBottom: spacing.sm,
  },
  notFoundCta: {
    marginTop: spacing.xs,
  },
  retryLink: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  labelCapturePanel: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 12,
  },
  shutterDock: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 15,
    alignItems: 'center',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  shutterButtonOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow(14),
  },
  shutterButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow(6),
  },
  shutterButtonPressed: {
    transform: [{ scale: 0.92 }],
    borderColor: '#FFFFFF',
  },
  shutterButtonDisabled: {
    opacity: 0.7,
  },
  shutterSideBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    gap: 4,
  },
  shutterSideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterSideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  menuCaptureTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  menuCaptureTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  labelCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelCancelButton: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,18,16,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  labelAnalyzeButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...softShadow(10),
  },
  labelAnalyzeButtonDisabled: {
    opacity: 0.72,
  },
  historyPanel: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 8,
  },
  historyRow: { gap: spacing.sm, paddingHorizontal: 2 },
  historyChip: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 148,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  historyChipText: {
    fontFamily: 'Nunito-Bold',
  },
  bottomDock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionPill: {
    flex: 1,
    minHeight: 54,
    overflow: 'hidden',
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(210, 195, 246, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    ...softShadow(10),
  },
  actionPillLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brand,
  },
  manualOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: 'flex-end',
  },
  manualBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  manualSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  manualSheetHeader: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  manualSheetTitleRow: {
    width: '100%',
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBody: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  manualHint: {
    marginBottom: 2,
  },
  emptyAccessory: {
    height: 0,
    width: '100%',
  },
  codeInput: {
    fontSize: 22,
    lineHeight: 28,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    letterSpacing: 1.2,
    color: colors.brandInk,
    fontFamily: font.displaySemibold,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  manualSendBtn: {
    marginTop: spacing.xs,
  },
  favOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  favOrbOn: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.72,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    zIndex: 20,
    ...softShadow(18),
  },
  productSheetGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHeader: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs, zIndex: 2 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetCloseBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  sheetScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    zIndex: 2,
  },
  productHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  productImageFrame: {
    width: 88,
    height: 88,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMeta: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  verdictLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verdictEyebrow: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 17,
    lineHeight: 21,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: spacing.sm,
  },
  barcodeText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  verdictDesc: {
    opacity: 0.88,
    lineHeight: 17,
    fontSize: 12,
    marginTop: -2,
  },
  sectionLabel: {
    marginBottom: 2,
  },
  matchesBlock: {
    gap: spacing.sm,
  },
  matchPanel: {
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  matchPanelRed: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: colors.redBorder,
  },
  matchPanelYellow: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: colors.amberBorder,
  },
  matchPanelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  matchLabel: {
    fontFamily: 'Nunito-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
    fontSize: 10,
  },
  matchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ingredientsBlock: {
    gap: 6,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  ingredientsText: {
    lineHeight: 19,
    fontSize: 12.5,
    color: colors.onSurfaceMuted,
    fontFamily: font.regular,
  },
  ingredientHitRed: {
    color: colors.redText,
    fontFamily: font.bold,
    backgroundColor: colors.redSoft,
  },
  ingredientHitYellow: {
    color: colors.amberText,
    fontFamily: font.bold,
    backgroundColor: colors.yellowSoft,
  },
  sourceNote: {
    marginTop: 4,
    lineHeight: 16,
  },
  paperMenuUrlOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  paperMenuUrlSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  paperMenuUrlInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.brandInk,
    fontFamily: font.regular,
    backgroundColor: colors.surfaceSecondary,
  },
  paperMenuUrlActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  paperMenuUrlCancel: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  paperMenuUrlConfirm: {
    minHeight: 44,
    minWidth: 108,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperMenuUrlConfirmDisabled: {
    opacity: 0.45,
  },
  sourceBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontFamily: font.bold,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 6,
  },
  safetyBoxText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  productActionStack: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  reportProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reportProductBtnText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  modeSwitcherWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill,
    padding: 3,
    gap: 4,
  },
  modeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  modeTabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#FFFFFF',
  },
  modeTabTextActive: {
    color: '#1E1B4B',
    fontFamily: font.bold,
  },
  batchFloatingBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#1E1B4B',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  batchFloatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchFloatingCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  batchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 41, 0.45)',
    justifyContent: 'flex-end',
  },
  batchModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  batchModalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FEF2F2',
  },
  batchWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  batchItemList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  batchItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  batchItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
