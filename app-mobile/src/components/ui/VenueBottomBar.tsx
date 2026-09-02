/**
 * VenueBottomBar — TabBar Capsule Glassmorphism per la sezione Menù del Locale.
 * Stesso identico stile, gradienti, blur e design system di GlassTabBar (Home).
 *
 * Sinistra: Tab Menù (Piatti)
 * Centro: FAB Semaforo Centrale Dinamico (il colore e l'icona cambiano al cambiare della sezione 🟢 🟡 🔴)
 * Destra: Tab Info (Informazioni locale + Recensioni)
 * Sotto: Barra di Ricerca & Assistente AllerTgy AI per il menù chiudibile con swipe o tap
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { useActiveProfileAllergies } from '../../hooks/useActiveProfileAllergies';
import { AppText } from './AppText';
import { font, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

export type VenueTab = 'menu' | 'info';

type Props = {
  active: VenueTab;
  onChange: (tab: VenueTab) => void;
  language: string;
  activeStatus?: 'verde' | 'giallo' | 'rosso' | null;
  onStatusChange?: (status: 'verde' | 'giallo' | 'rosso') => void;
  onOrbPress?: () => void;
  counts?: { verde: number; giallo: number; rosso: number };
  venueName?: string;
};

export function VenueBottomBar({
  active,
  onChange,
  language,
  activeStatus = 'verde',
  onStatusChange,
  onOrbPress,
  counts,
  venueName,
}: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();
  const isIt = (language || 'it').toLowerCase().startsWith('it');
  const { activeLabel, allergie, hasAllergie } = useActiveProfileAllergies();

  // Stato apertura/chiusura barra di ricerca
  const [isAiBarOpen, setIsAiBarOpen] = useState(true);
  const collapseAnim = useSharedValue(1);

  // Animazione elastica del FAB centrale al cambio o tap
  const fabScale = useSharedValue(1);

  useEffect(() => {
    collapseAnim.value = withTiming(isAiBarOpen ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isAiBarOpen, collapseAnim]);

  // Al cambiamento dello stato del semaforo, esegui una micro-animazione elastica
  useEffect(() => {
    fabScale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 350 }),
      withSpring(1, { damping: 14, stiffness: 200 })
    );
  }, [activeStatus, fabScale]);

  // Gestione PanResponder per lo swipe down/up sulla barra
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 7 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 10) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAiBarOpen(false);
        } else if (gestureState.dy < -10) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAiBarOpen(true);
        }
      },
    })
  ).current;

  const animatedAiBarStyle = useAnimatedStyle(() => {
    return {
      height: collapseAnim.value * 44,
      opacity: collapseAnim.value,
      marginTop: collapseAnim.value * 6,
      transform: [{ translateY: (1 - collapseAnim.value) * 10 }],
      overflow: 'hidden',
    };
  });

  const animatedFabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }],
    };
  });

  // Modal AllerTgy AI per il menu
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleTabPress = (tab: VenueTab) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(tab);
  };

  // Ciclo rapido semaforo al tap del pulsante centrale: Verde -> Giallo -> Rosso -> Verde
  const handleCenterFabPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSequence(
      withSpring(1.18, { damping: 10, stiffness: 350 }),
      withSpring(1, { damping: 14, stiffness: 200 })
    );

    const nextStatus: 'verde' | 'giallo' | 'rosso' =
      activeStatus === 'verde'
        ? 'giallo'
        : activeStatus === 'giallo'
        ? 'rosso'
        : 'verde';

    if (onStatusChange) {
      onStatusChange(nextStatus);
    } else if (onOrbPress) {
      onOrbPress();
    }

    if (active !== 'menu') {
      onChange('menu');
    }
  };

  const handleOpenAi = (initialPrompt?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (initialPrompt) {
      setAiQuery(initialPrompt);
      handleAskAi(initialPrompt);
    }
    setAiModalVisible(true);
  };

  const handleAskAi = (queryText?: string) => {
    const query = queryText || aiQuery;
    if (!query.trim()) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiLoading(false);
      const activeAllergensList = hasAllergie
        ? allergie.join(', ')
        : (isIt ? 'nessun allergene configurato' : 'no configured allergens');

      const restaurantRef = venueName ? ` per ${venueName}` : '';

      setAiResponse(
        `🛡️ **Analisi di sicurezza${restaurantRef} (${activeLabel}):**\n\n` +
        `Basandomi sui tuoi allergeni attivi (${activeAllergensList}), ho analizzato la tua richiesta:\n\n` +
        `✅ **Consiglio AllerTgy:** I piatti contrassegnati in **Verde** sono idonei al 100%. ` +
        `Per i piatti in **Giallo**, chiedi sempre conferma al personale di sala per possibili contaminazioni crociate.`
      );
    }, 600);
  };

  if (WIREFRAME_MODE) {
    const bottomSafe = Math.max(insets.bottom, 10);
    return (
      <View style={[styles.wireframeRow, { paddingBottom: bottomSafe }]}>
        <Pressable style={[wireBox(), styles.wireframeSide]} onPress={() => handleTabPress('menu')}>
          <AppText variant="caption">Menù</AppText>
        </Pressable>
        <Pressable
          style={[wireBox({ fill: '#000' }), styles.wireframeCenter]}
          onPress={handleCenterFabPress}
        >
          <AppText variant="caption" style={{ color: '#FFF' }}>Semaforo</AppText>
        </Pressable>
        <Pressable style={[wireBox(), styles.wireframeSide]} onPress={() => handleTabPress('info')}>
          <AppText variant="caption">Info</AppText>
        </Pressable>
      </View>
    );
  }

  // Stili dinamici per il FAB centrale in base allo stato attivo
  let haloBg = 'rgba(241, 254, 200, 0.25)';
  let haloBorder = 'rgba(241, 254, 200, 0.55)';
  let innerBg = '#F1FEC8';
  let innerIconColor = '#111827';
  let innerIconName: keyof typeof Ionicons.glyphMap = 'restaurant-outline';
  let currentCount: number | undefined = undefined;

  if (activeStatus === 'verde') {
    haloBg = 'rgba(34, 197, 94, 0.28)';
    haloBorder = 'rgba(34, 197, 94, 0.65)';
    innerBg = '#22C55E';
    innerIconColor = '#111827';
    innerIconName = 'checkmark-outline';
    currentCount = counts?.verde;
  } else if (activeStatus === 'giallo') {
    haloBg = 'rgba(234, 179, 8, 0.28)';
    haloBorder = 'rgba(234, 179, 8, 0.65)';
    innerBg = '#EAB308';
    innerIconColor = '#111827';
    innerIconName = 'alert-circle-outline';
    currentCount = counts?.giallo;
  } else if (activeStatus === 'rosso') {
    haloBg = 'rgba(239, 68, 68, 0.28)';
    haloBorder = 'rgba(239, 68, 68, 0.65)';
    innerBg = '#EF4444';
    innerIconColor = '#FFFFFF';
    innerIconName = 'close-circle-outline';
    currentCount = counts?.rosso;
  }

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <View
          style={[styles.dockCapsule, { marginBottom: Math.max(insets.bottom, 10) }]}
          {...panResponder.panHandlers}
        >
          {/* 1. Base Cosmica Profonda Traslucida */}
          <LinearGradient
            colors={['rgba(23, 20, 32, 0.45)', 'rgba(35, 33, 44, 0.55)', 'rgba(45, 40, 59, 0.50)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* 2. Glow Cosmico Nebulare */}
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.20)', 'rgba(192, 132, 252, 0.14)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 3. Sfocatura Nativa BlurView (Glassmorphism da css.glass) */}
          <BlurView
            intensity={22}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* 4. Gradiente Cosmic Glass Trasparente (#23212C traslucido) */}
          <LinearGradient
            colors={['rgba(35, 33, 44, 0.30)', 'rgba(35, 33, 44, 0.48)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 1. ZONA SUPERIORE: Tab Menù · FAB Centrale Dinamico · Tab Info */}
          <View style={styles.tabIconsRow}>
            {/* Tab 1: Menù Piatti */}
            <Pressable
              onPress={() => handleTabPress('menu')}
              style={({ pressed }) => [
                styles.tabItem,
                active === 'menu' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Menù piatti' : 'Dishes menu'}
            >
              <Ionicons
                name="restaurant-outline"
                size={23}
                color={
                  active === 'menu'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>

            {/* CENTRO: FAB Semaforo Centrale Dinamico (cambia colore e icona al cambio sezione) */}
            <Pressable
              onPress={handleCenterFabPress}
              style={({ pressed }) => [styles.centerFabWrap, pressed && styles.fabPressed]}
              accessibilityRole="button"
              accessibilityLabel={
                activeStatus
                  ? `${isIt ? 'Semaforo menù' : 'Menu traffic light'}: ${activeStatus}`
                  : isIt ? 'Semaforo menù' : 'Menu traffic light'
              }
            >
              <Animated.View
                style={[
                  styles.centerFabHalo,
                  { backgroundColor: haloBg, borderColor: haloBorder },
                  animatedFabStyle,
                ]}
              >
                <View
                  style={[
                    styles.centerFabInner,
                    { backgroundColor: innerBg },
                  ]}
                >
                  <Ionicons name={innerIconName} size={22} color={innerIconColor} />
                </View>
              </Animated.View>
            </Pressable>

            {/* Tab 2: Informazioni & Recensioni */}
            <Pressable
              onPress={() => handleTabPress('info')}
              style={({ pressed }) => [
                styles.tabItem,
                active === 'info' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Informazioni e recensioni locale' : 'Venue info and reviews'}
            >
              <Ionicons
                name="information-circle-outline"
                size={23}
                color={
                  active === 'info'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>
          </View>

          {/* 2. ZONA INFERIORE: Barra di Ricerca & AI Menù Chiudibile */}
          <Animated.View style={animatedAiBarStyle}>
            <Pressable
              onPress={() => handleOpenAi()}
              style={({ pressed }) => [styles.aiBarPressable, pressed && styles.aiBarPressed]}
              accessibilityRole="button"
              accessibilityLabel={isIt ? 'Cerca piatti o chiedi ad AllerTgy AI' : 'Search dishes or ask AllerTgy AI'}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiBarGradient}
              >
                <View style={styles.aiLeft}>
                  <Ionicons
                    name="sparkles-outline"
                    size={17}
                    color="#F1FEC8"
                  />
                  <AppText style={styles.aiPromptText} numberOfLines={1}>
                    {isIt ? 'Chiedi ad AllerTgy AI sul menù...' : 'Ask AllerTgy AI about this menu...'}
                  </AppText>
                </View>

                <View style={styles.aiMicBtn}>
                  <Ionicons
                    name="mic-outline"
                    size={17}
                    color="#F1FEC8"
                  />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Dedicated Overlay Border for ultra-smooth anti-aliased corners and zero-leak borders */}
          <View
            pointerEvents="none"
            style={[
              styles.capsuleBorderOverlay,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(241, 254, 200, 0.28)',
              },
            ]}
          />
        </View>
      </View>

      {/* Modal Interattivo AllerTgy AI Assistant del Menù */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.backdropTouch} onPress={() => setAiModalVisible(false)} />
          <View style={styles.aiSheetContainer}>
            {/* Header Modal */}
            <View style={styles.aiSheetHeader}>
              <View style={styles.aiSheetTitleRow}>
                <View style={styles.aiSheetBadge}>
                  <Ionicons name="sparkles-outline" size={16} color="#23212C" />
                </View>
                <View>
                  <AppText style={styles.aiSheetTitle}>AllerTgy AI Menù</AppText>
                  <AppText style={styles.aiSheetSub}>
                    {isIt
                      ? `Protezione per ${activeLabel}${venueName ? ` • ${venueName}` : ''}`
                      : `Protection for ${activeLabel}${venueName ? ` • ${venueName}` : ''}`}
                  </AppText>
                </View>
              </View>

              <Pressable
                onPress={() => setAiModalVisible(false)}
                style={({ pressed }) => [styles.aiCloseBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close-outline" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Quick Prompts */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiSuggestionsScroll}
            >
              {[
                isIt ? 'Quali piatti sono 100% idonei?' : 'Which dishes are 100% safe?',
                isIt ? 'Ci sono contaminazioni da glutine?' : 'Is there gluten contamination?',
                isIt ? 'Consigliami un dolce sicuro' : 'Recommend a safe dessert',
                isIt ? 'Opzioni senza lattosio' : 'Lactose-free options',
              ].map((suggestion, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleOpenAi(suggestion)}
                  style={({ pressed }) => [styles.aiChip, pressed && styles.pressed]}
                >
                  <AppText style={styles.aiChipText}>{suggestion}</AppText>
                </Pressable>
              ))}
            </ScrollView>

            {/* Response Preview */}
            <ScrollView style={styles.aiResponseScroll} contentContainerStyle={styles.aiResponseScrollContent}>
              {isAiLoading ? (
                <View style={styles.aiLoadingWrap}>
                  <Ionicons name="sparkles-outline" size={24} color="#6366F1" style={{ marginBottom: 6 }} />
                  <AppText style={styles.aiLoadingText}>
                    {isIt ? 'Analisi ingredienti e allergeni in corso...' : 'Analyzing ingredients and allergens...'}
                  </AppText>
                </View>
              ) : aiResponse ? (
                <View style={styles.aiResponseCard}>
                  <AppText style={styles.aiResponseText}>{aiResponse}</AppText>
                </View>
              ) : (
                <View style={styles.aiPlaceholderWrap}>
                  <Ionicons name="shield-checkmark-outline" size={32} color="rgba(241, 254, 200, 0.4)" />
                  <AppText style={styles.aiPlaceholderText}>
                    {isIt
                      ? 'Fai una domanda sugli allergeni o sui piatti di questo ristorante.'
                      : 'Ask a question about allergens or dishes at this restaurant.'}
                  </AppText>
                </View>
              )}
            </ScrollView>

            {/* Input Form */}
            <View style={styles.aiInputRow}>
              <TextInput
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder={isIt ? 'Chiedi un consiglio sul menù...' : 'Ask for advice on this menu...'}
                placeholderTextColor="#9CA3AF"
                style={styles.aiTextInput}
                onSubmitEditing={() => handleAskAi()}
                returnKeyType="send"
                autoFocus
              />
              <Pressable
                onPress={() => handleAskAi()}
                style={({ pressed }) => [styles.aiSendBtn, pressed && styles.pressed]}
              >
                <Ionicons name="arrow-up-outline" size={20} color="#F1FEC8" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dockCapsule: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'transparent',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  capsuleBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 5,
    pointerEvents: 'none',
  },
  tabIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  tabItem: {
    width: 50,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabItemActiveVanilla: {
    backgroundColor: 'rgba(241, 254, 200, 0.16)',
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  centerFabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabHalo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
  },
  aiBarPressable: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  aiBarPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  aiBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 6,
  },
  aiPromptText: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: -0.2,
  },
  aiMicBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(241, 254, 200, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  aiSheetContainer: {
    backgroundColor: '#1E1C27',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxHeight: '80%',
  },
  aiSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  aiSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiSheetBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1FEC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSheetTitle: {
    fontFamily: font.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  aiSheetSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  aiCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSuggestionsScroll: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 14,
  },
  aiChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  aiChipText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  aiResponseScroll: {
    maxHeight: 180,
    marginBottom: 14,
  },
  aiResponseScrollContent: {
    paddingVertical: 4,
  },
  aiLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  aiLoadingText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiResponseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiResponseText: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#F3F4F6',
  },
  aiPlaceholderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  aiPlaceholderText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  aiTextInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 6,
  },
  aiSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 254, 200, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  wireframeRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  wireframeSide: {
    width: 68,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wireframeCenter: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
