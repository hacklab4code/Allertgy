import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { fetchAndAnalyzeBarcode, extractProductBarcode, analyzeFromLabelAi, type ScannedProduct } from '../src/services/barcodeScan';
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
import { AppText, DebossedInput, GlassCard, LiquidGlassView, MatchChip, PuffyButton, StatoVerdictPill } from '../src/components/ui';
import { colors, radius, spacing, puffyShadow, WIREFRAME_MODE, MIN_TOUCH_TARGET } from '../src/theme';
import { wireBox } from '../src/wireframe';

const CODE_LENGTH = 6;
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function parseQrCode(data: string): string | null {
  const code = data
    .replace(/^allertgy:\/?\/?/i, '')
    .replace(/^.*\/r\//i, '')
    .split(/[?#]/)[0]
    .trim();
  return /^\d{6}$/.test(code) ? code : null;
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
  const [manualCode, setManualCode] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ScannedProduct | null>(null);
  const [productFavorites, setProductFavorites] = useState<ScannedProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [manualExpanded, setManualExpanded] = useState(false);
  const [hasPlus, setHasPlus] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [labelCaptureMode, setLabelCaptureMode] = useState(false);
  const [analyzingLabel, setAnalyzingLabel] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const {
    allergie: primaryAllergies,
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

  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase().startsWith('it');
  const scanningDisabled = !isFocused || !!activeProduct || analyzingLabel || labelCaptureMode;
  const bottomInset = insets.bottom + spacing.md;
  const frameWidth = labelCaptureMode ? Math.min(SCREEN_WIDTH - 40, 350) : 264;
  const frameHeight = labelCaptureMode ? 210 : 264;

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
    setBarcodeError('');
  }, []);

  const handleProduct = useCallback(async (rawBarcode: string, opts?: { allowCache?: boolean }) => {
    const barcode = extractProductBarcode(rawBarcode);
    if (!barcode) {
      setInvalidHint(isIt ? 'Codice prodotto non valido' : 'Invalid product code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setInvalidHint(''), 2800);
      return;
    }
    if (scanned.current) return;

    scanned.current = true;
    setLoadingProduct(true);
    setInvalidHint('');
    setBarcodeError('');

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

      const product = await fetchAndAnalyzeBarcode(barcode, allergie, ingredientiEsclusi);
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
      setInvalidHint(isIt ? 'Prodotto non in database' : 'Product not in database');
      setBarcodeError(isIt ? 'Prodotto non trovato' : 'Product not found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingProduct(false);
    }
  }, [allergie, ingredientiEsclusi, isIt, openProductSheet, token]);

  const analyzeLabelPhoto = useCallback(async (uri: string, barcode: string) => {
    if (!token) {
      Alert.alert(
        isIt ? 'Accedi per continuare' : 'Sign in to continue',
        isIt
          ? 'L\'analisi AI delle etichette richiede un account con piano Plus Famiglia.'
          : 'AI label analysis requires a Plus Family account.',
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
  }, [allergie, ingredientiEsclusi, isIt, openProductSheet, token]);

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
      Alert.alert(
        isIt ? 'Plus Famiglia richiesto' : 'Plus Family required',
        isIt
          ? 'Quando un prodotto non è nel database, con Plus Famiglia puoi fotografare l\'etichetta e l\'AI legge gli ingredienti per il semaforo allergeni.'
          : 'When a product is missing from the database, Plus Family lets you photograph the label and AI reads ingredients for the allergen traffic light.',
        [
          { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
          { text: isIt ? 'Vai ad Account' : 'Go to Account', onPress: () => router.push('/(tabs)/account') },
        ],
      );
      return;
    }

    setInvalidHint('');
    setLabelCaptureMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hasPlus, isIt, notFoundBarcode, token]);

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

  const openMenu = async (rawCode?: string) => {
    const target = (rawCode ?? manualCode).trim();
    if (!/^\d{6}$/.test(target)) {
      setCodeError(t('code_invalid_format'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setCodeLoading(true);
    setCodeError('');
    try {
      await api.menu(target);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/menu/${target}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setCodeError(
        msg.includes('404') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('non trovato')
          ? t('code_not_found')
          : t('code_network_error'),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCodeLoading(false);
    }
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scanningDisabled || scanned.current || loadingProduct) return;

    const productBarcode = extractProductBarcode(data);
    if (productBarcode) {
      handleProduct(productBarcode);
      return;
    }

    const restaurantCode = parseQrCode(data);
    if (restaurantCode) {
      scanned.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/menu/${restaurantCode}`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setInvalidHint(t('scan_invalid_qr'));
    setTimeout(() => setInvalidHint(''), 2800);
  };

  const submitManualBarcode = () => {
    const barcode = extractProductBarcode(manualBarcode);
    if (!barcode) {
      setBarcodeError(isIt ? 'Inserisci un codice a barre valido (8-14 cifre)' : 'Enter a valid barcode (8-14 digits)');
      return;
    }
    handleProduct(barcode);
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
        <View style={[styles.iconWrap, puffyShadow(8)]}>
          <Ionicons name="scan" size={40} color={colors.brand} />
        </View>
        <AppText variant="h2" style={{ textAlign: 'center', marginTop: spacing.lg }}>
          {t('grocery_scanner_desc')}
        </AppText>
        <PuffyButton
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
        colors={['rgba(0,0,0,0.72)', 'transparent', 'transparent', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.24, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.topBtn} hitSlop={8}>
          <Ionicons name="close" size={23} color="#FFF" />
        </Pressable>
        <View style={styles.topTitle}>
          <AppText variant="bodyBold" color="#FFF">
            {isIt ? 'Scansiona' : 'Scan'}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.72)">
            {isIt ? 'Menù, prodotti ed etichette' : 'Menus, products and labels'}
          </AppText>
        </View>
        <Pressable onPress={() => setTorch((v) => !v)} style={styles.topBtn} hitSlop={8}>
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanIntro}>
          <AppText variant="h2" color="#FFF" style={styles.scanTitle}>
            {labelCaptureMode
              ? (isIt ? 'Inquadra la lista ingredienti' : 'Frame the ingredients list')
              : (isIt ? 'Inquadra il codice' : 'Frame the code')}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.74)" style={styles.scanSubtitle}>
            {labelCaptureMode
              ? (isIt ? 'Riempi il riquadro con il testo, senza riflessi' : 'Fill the frame with text, without glare')
              : (isIt ? 'Riconosciamo automaticamente menù e prodotti' : 'We automatically recognize menus and products')}
          </AppText>
        </View>
        <View
          style={[
            styles.frame,
            { width: frameWidth, height: frameHeight },
            labelCaptureMode && styles.frameProduct,
            WIREFRAME_MODE && wireBox({ dashed: true }),
            puffyShadow(12),
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
        {(invalidHint || labelCaptureMode) ? (
          <View style={[styles.scanBanner, invalidHint && styles.scanBannerError]}>
            <Ionicons
              name={invalidHint ? 'alert-circle' : 'document-text-outline'}
              size={18}
              color={invalidHint ? colors.onRed : colors.brandDark}
            />
            <View style={styles.scanBannerCopy}>
              <AppText variant="caption" style={[styles.scanBannerTitle, invalidHint && styles.hintTextError]}>
                {invalidHint || (isIt ? 'L’AI leggerà ingredienti, allergeni e tracce' : 'AI will read ingredients, allergens and traces')}
              </AppText>
              {!invalidHint ? (
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Verifica sempre l’etichetta fisica' : 'Always verify the physical label'}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}
        {loadingProduct && (
          <ActivityIndicator color="#FFF" size="large" style={{ marginTop: spacing.lg }} />
        )}
        {analyzingLabel && (
          <View style={styles.aiLoading}>
            <ActivityIndicator color="#FFF" size="small" />
            <AppText variant="caption" color="#FFF">
              {isIt ? 'Analisi etichetta con AI…' : 'Analyzing label with AI…'}
            </AppText>
          </View>
        )}
      </View>

      {!activeProduct && notFoundBarcode && !labelCaptureMode && (
        <View style={[styles.notFoundPanel, { bottom: bottomInset + 56, paddingBottom: spacing.md }]}>
          <LiquidGlassView
            glassStyle="regular"
            tintColor="rgba(255,255,255,0.72)"
            fallbackIntensity={82}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.notFoundBody}>
            <View style={styles.notFoundHeader}>
              <Ionicons name="help-circle" size={22} color={colors.brandDark} />
              <AppText variant="bodyBold" style={{ flex: 1 }}>
                {isIt ? 'Prodotto non in database' : 'Product not in database'}
              </AppText>
              <Pressable onPress={dismissNotFound} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            <AppText variant="caption" color={colors.onSurfaceMuted}>
              {isIt
                ? `Codice ${notFoundBarcode} — non presente su Open Food Facts.`
                : `Code ${notFoundBarcode} — not found on Open Food Facts.`}
            </AppText>
            {hasPlus ? (
              <>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: spacing.xs }}>
                  {isIt
                    ? 'Fotografa l\'etichetta (30/mese con Plus): i dati restano in archivio per tutti gli utenti.'
                    : 'Photograph the label (30/month with Plus): data is saved for all users.'}
                </AppText>
                <PuffyButton
                  label={isIt ? 'Inquadra ingredienti' : 'Frame ingredients'}
                  onPress={beginLabelCapture}
                  disabled={analyzingLabel}
                  icon="document-text"
                  style={{ marginTop: spacing.md }}
                />
              </>
            ) : (
              <>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: spacing.xs }}>
                  {isIt
                    ? 'Passa a Plus Famiglia per analizzare l\'etichetta con AI quando il prodotto manca nel database.'
                    : 'Upgrade to Plus Family to analyze labels with AI when the product is missing.'}
                </AppText>
                <PuffyButton
                  label={isIt ? 'Scopri Plus Famiglia' : 'Discover Plus Family'}
                  onPress={() => router.push('/(tabs)/account')}
                  variant="secondary"
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}
            <Pressable onPress={dismissNotFound} style={styles.retryLink}>
              <AppText variant="caption" color={colors.brand}>
                {isIt ? 'Riprova scansione' : 'Scan again'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      {!activeProduct && notFoundBarcode && labelCaptureMode && (
        <View style={[styles.labelCapturePanel, { bottom: bottomInset }]}>
          <Pressable
            onPress={() => {
              setLabelCaptureMode(false);
              setInvalidHint('');
            }}
            style={styles.labelCancelButton}
            disabled={analyzingLabel}
          >
            <Ionicons name="arrow-back" size={18} color="#FFF" />
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
              <Ionicons name="sparkles" size={20} color={colors.brandDark} />
            )}
            <AppText variant="bodyBold" color={colors.brandDark}>
              {analyzingLabel
                ? (isIt ? 'Analisi in corso…' : 'Analyzing…')
                : (isIt ? 'Analizza ingredienti' : 'Analyze ingredients')}
            </AppText>
          </Pressable>
        </View>
      )}

      {!activeProduct && !notFoundBarcode && !manualExpanded && scanHistory.length > 0 && (
        <View style={[styles.historyPanel, { bottom: bottomInset + 56 }]}>
          <AppText variant="caption" color="#FFF" style={{ marginBottom: spacing.xs }}>
            {t('scan_history_title')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {scanHistory.slice(0, 8).map((item) => (
              <Pressable key={item.barcode} style={styles.historyChip} onPress={() => openHistoryProduct(item)}>
                <AppText variant="caption" color="#FFF" numberOfLines={1}>{item.name}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!activeProduct && !notFoundBarcode && (
        <View
          style={[
            styles.bottomPanel,
            manualExpanded ? styles.bottomPanelExpanded : styles.bottomPanelCollapsed,
            {
              bottom: manualExpanded ? spacing.sm : bottomInset,
              paddingBottom: manualExpanded ? bottomInset : 0,
            },
          ]}
        >
          <LiquidGlassView
            glassStyle="regular"
            tintColor={manualExpanded ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.08)'}
            fallbackIntensity={manualExpanded ? 82 : 52}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => setManualExpanded((v) => !v)}
            style={styles.manualToggle}
          >
            <View style={styles.manualToggleLabel}>
              <Ionicons
                name="keypad-outline"
                size={19}
                color={manualExpanded ? colors.brandDark : '#FFF'}
              />
              <AppText variant="bodyBold" color={manualExpanded ? colors.onSurface : '#FFF'}>
                {isIt ? 'Inserisci un codice' : 'Enter a code'}
              </AppText>
            </View>
            <Ionicons
              name={manualExpanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={manualExpanded ? colors.onSurfaceMuted : '#FFF'}
            />
          </Pressable>
          {manualExpanded && (
            <View style={styles.manualBody}>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.manualIntro}>
                {isIt
                  ? 'Usa il codice numerico quando la fotocamera non riesce a leggerlo.'
                  : 'Use the numeric code when the camera cannot read it.'}
              </AppText>
              <View style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <DebossedInput
                    placeholder={isIt ? 'Codice a barre prodotto' : 'Product barcode'}
                    keyboardType="number-pad"
                    value={manualBarcode}
                    onChangeText={(v) => {
                      setManualBarcode(v.replace(/\D/g, '').slice(0, 14));
                      if (barcodeError) setBarcodeError('');
                    }}
                    maxLength={14}
                    onSubmitEditing={submitManualBarcode}
                    returnKeyType="go"
                    error={barcodeError || undefined}
                  />
                </View>
                <PuffyButton
                  label={loadingProduct ? '...' : (isIt ? 'Prodotto' : 'Product')}
                  onPress={submitManualBarcode}
                  disabled={manualBarcode.length < 8 || loadingProduct}
                  loading={loadingProduct}
                  fullWidth={false}
                  style={{ minWidth: 88 }}
                />
              </View>
              <View style={[styles.codeRow, { marginTop: spacing.sm }]}>
                <View style={{ flex: 1 }}>
                  <DebossedInput
                    placeholder={isIt ? 'Codice locale 6 cifre' : '6-digit venue code'}
                    keyboardType="number-pad"
                    value={manualCode}
                    onChangeText={(v) => {
                      setManualCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH));
                      if (codeError) setCodeError('');
                    }}
                    maxLength={CODE_LENGTH}
                    onSubmitEditing={() => openMenu()}
                    returnKeyType="go"
                    error={codeError || undefined}
                  />
                </View>
                <PuffyButton
                  label={codeLoading ? t('code_checking') : t('go_btn')}
                  onPress={() => openMenu()}
                  disabled={manualCode.length !== CODE_LENGTH || codeLoading}
                  loading={codeLoading}
                  fullWidth={false}
                  style={{ minWidth: 88 }}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {activeProduct && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <Pressable onPress={closeProductSheet} style={styles.sheetCloseBtn}>
              <AppText variant="bodyBold">✕</AppText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.productRow}>
              {activeProduct.image ? (
                <Image source={{ uri: activeProduct.image }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={28} color={colors.onSurfaceMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="title">{activeProduct.name}</AppText>
                <AppText variant="caption">{activeProduct.brand}</AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Codice' : 'Code'}: {activeProduct.barcode}
                </AppText>
              </View>
              <Pressable onPress={() => onToggleFavorite(activeProduct)} style={styles.favBtn} hitSlop={12}>
                <Ionicons
                  name={productFavorites.some((f) => f.barcode === activeProduct.barcode) ? 'heart' : 'heart-outline'}
                  size={25}
                  color={colors.brand}
                />
              </Pressable>
            </View>

            {(() => {
              const title = activeProduct.status === 'verde'
                ? (isIt ? 'SICURO' : 'SAFE')
                : activeProduct.status === 'giallo'
                  ? (isIt ? 'ATTENZIONE' : 'CAUTION')
                  : (isIt ? 'NON IDONEO' : 'NOT ELIGIBLE');
              const desc = activeProduct.status === 'verde'
                ? (isIt ? 'Nessun allergene del profilo rilevato.' : 'No profile allergens detected.')
                : activeProduct.status === 'giallo'
                  ? (isIt ? 'Possibili tracce: chiedi conferma.' : 'Possible traces: ask for confirmation.')
                  : (isIt ? 'Contiene allergeni incompatibili.' : 'Contains incompatible allergens.');
              const cardTint = activeProduct.status === 'verde' ? 'green'
                : activeProduct.status === 'giallo' ? 'yellow'
                : 'red';
              const accent = activeProduct.status === 'verde' ? colors.green
                : activeProduct.status === 'giallo' ? colors.amber
                : colors.red;
              return (
                <GlassCard tint={cardTint} accentColor={accent} style={styles.resultCard}>
                  <StatoVerdictPill stato={activeProduct.status} label={title} size="md" />
                  <AppText variant="caption" style={{ marginTop: spacing.sm }}>{desc}</AppText>
                  {activeProduct.source === 'ai_label' && (
                    <AppText variant="caption" style={{ marginTop: spacing.sm, opacity: 0.9 }}>
                      {activeProduct.aiNote || (isIt
                        ? 'Analisi AI dell\'etichetta — verifica sempre la confezione fisica.'
                        : 'AI label analysis — always verify the physical package.')}
                    </AppText>
                  )}
                  {activeProduct.source === 'community_cache' && (
                    <AppText variant="caption" style={{ marginTop: spacing.sm, opacity: 0.9 }}>
                      {activeProduct.aiNote || (isIt
                        ? 'Dati etichetta condivisi — verifica sempre la confezione fisica.'
                        : 'Shared label data — always verify the physical package.')}
                    </AppText>
                  )}
                </GlassCard>
              );
            })()}

            {activeProduct.status !== 'verde' && (
              <View style={styles.matchesBlock}>
                {activeProduct.match_contenuti.length > 0 && (
                  <View style={styles.matchRow}>
                    <AppText variant="caption" style={styles.matchLabel}>{isIt ? 'Contiene:' : 'Contains:'}</AppText>
                    <View style={styles.matchChips}>
                      {activeProduct.match_contenuti.map((code) => (
                        <MatchChip key={code} label={getAllergenLabel(code)} severity="red" />
                      ))}
                    </View>
                  </View>
                )}
                {activeProduct.match_tracce.length > 0 && (
                  <View style={styles.matchRow}>
                    <AppText variant="caption" style={styles.matchLabel}>{isIt ? 'Tracce:' : 'Traces:'}</AppText>
                    <View style={styles.matchChips}>
                      {activeProduct.match_tracce.map((code) => (
                        <MatchChip key={code} label={getAllergenLabel(code)} severity="yellow" />
                      ))}
                    </View>
                  </View>
                )}
                {activeProduct.match_esclusi.length > 0 && (
                  <View style={styles.matchRow}>
                    <AppText variant="caption" style={styles.matchLabel}>{isIt ? 'Esclusi:' : 'Excluded:'}</AppText>
                    <View style={styles.matchChips}>
                      {activeProduct.match_esclusi.map((ing) => (
                        <MatchChip key={ing} label={ing} severity="red" />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            <AppText variant="bodyBold" style={{ marginTop: spacing.md }}>
              {isIt ? 'Ingredienti' : 'Ingredients'}
            </AppText>
            <AppText variant="caption" style={{ marginTop: spacing.xs }}>
              {activeProduct.ingredients}
            </AppText>
          </ScrollView>
        </Animated.View>
      )}
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
    gap: spacing.sm,
  },
  topTitle: { flex: 1, alignItems: 'center', gap: 1 },
  topBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,18,18,0.46)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    transform: [{ translateY: -24 }],
  },
  scanIntro: { alignItems: 'center', gap: spacing.xs, maxWidth: 300 },
  scanTitle: { textAlign: 'center' },
  scanSubtitle: { textAlign: 'center' },
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  corner: { position: 'absolute', width: 38, height: 38, borderColor: '#FFF', zIndex: 2 },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.xl },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.xl },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.xl },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.xl },
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
    shadowOpacity: 0.9,
    shadowRadius: 8,
    zIndex: 1,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    width: '88%',
    minHeight: 54,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  scanBannerError: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  scanBannerCopy: {
    flex: 1,
    gap: 1,
  },
  scanBannerTitle: {
    color: colors.onSurface,
    fontFamily: 'Nunito-Bold',
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
    left: spacing.md,
    right: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    zIndex: 12,
    ...puffyShadow(14),
  },
  notFoundBody: { padding: spacing.md },
  notFoundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  retryLink: { alignSelf: 'center', marginTop: spacing.sm, paddingVertical: spacing.xs },
  labelCapturePanel: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 12,
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
    ...puffyShadow(10),
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
  historyRow: { gap: spacing.sm },
  historyChip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bottomPanel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    zIndex: 9,
  },
  bottomPanelCollapsed: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18,18,18,0.28)',
  },
  bottomPanelExpanded: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing.md,
    ...puffyShadow(14),
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  manualToggleLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  manualBody: { paddingTop: spacing.xs },
  manualIntro: { marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  favBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.62,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    zIndex: 20,
    ...puffyShadow(16),
  },
  sheetHeader: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetCloseBtn: { position: 'absolute', right: spacing.lg, top: spacing.sm },
  sheetScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  productImage: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: { marginBottom: spacing.xs },
  matchesBlock: { marginTop: spacing.md, gap: spacing.sm },
  matchRow: { gap: spacing.xs },
  matchLabel: { fontFamily: 'Nunito-Bold' },
  matchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
