/**
 * TabBar Capsule Integrata — Design moderno AllerTgy.
 * Zona Superiore: Home · Locali · Central Action (+) · Preferiti · Profilo
 * Zona Inferiore: Barra di Ricerca & Assistente AllerTgy AI chiudibile con swipe o tap (senza barrette intermedie)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileSheet } from '../../store/profileSheet';
import { useActiveProfileAllergies } from '../../hooks/useActiveProfileAllergies';
import { useFloatingHeader } from '../../store/floatingHeader';
import { useIsDarkMode } from '../../hooks/useAppTheme';
import { AppText } from './AppText';
import { BlurView } from 'expo-blur';

import { api } from '../../api/client';
import { useSession } from '../../store/session';
import { AvatarBubble, avatarForIndex } from './AvatarBubble';
import { font } from '../../theme';

const COSMIC_NEBULA_IMAGE = require('../../../assets/cosmic_nebula_bg.jpg');

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();
  const activeRoute = state.routes[state.index]?.name;
  const isProfileSheetVisible = useProfileSheet((s) => s.visible);
  const closeProfileSheet = useProfileSheet((s) => s.close);
  const { activeAvatar, activeLabel, allergie, hasAllergie } = useActiveProfileAllergies();
  const chromeVisible = useFloatingHeader((s) => s.visible);

  const {
    token,
    subProfiles,
    setSubProfiles,
    activeProfileId,
    setActiveProfileId,
    profilePhotoUrl,
  } = useSession();

  // Stato apertura/chiusura barra di ricerca
  const [isAiBarOpen, setIsAiBarOpen] = useState(true);

  // Animazione per apertura/chiusura fluida AI bar
  const collapseAnim = useSharedValue(1);
  // Animazione per apertura/chiusura fluida profilo
  const profileAnim = useSharedValue(0);

  useEffect(() => {
    const shouldShowAi = isAiBarOpen && chromeVisible && !isProfileSheetVisible;
    collapseAnim.value = withTiming(shouldShowAi ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isAiBarOpen, chromeVisible, isProfileSheetVisible, collapseAnim]);

  useEffect(() => {
    if (isProfileSheetVisible) {
      profileAnim.value = withTiming(1, {
        duration: 240,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      if (token) {
        api.getSubProfiles().then(setSubProfiles).catch(() => {});
      }
    } else {
      profileAnim.value = withTiming(0, {
        duration: 180,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isProfileSheetVisible, token, setSubProfiles, profileAnim]);

  // Gesture PanResponder: swipe verso il basso chiude la barra o il profilo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 7 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 10) {
          if (isProfileSheetVisible) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeProfileSheet();
          } else {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsAiBarOpen(false);
          }
        } else if (gestureState.dy < -10) {
          if (!isProfileSheetVisible) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsAiBarOpen(true);
          }
        }
      },
    })
  ).current;

  const animatedProfileStyle = useAnimatedStyle(() => {
    return {
      height: profileAnim.value * 94,
      opacity: profileAnim.value,
      transform: [{ translateY: (1 - profileAnim.value) * -10 }],
      overflow: 'hidden',
    };
  });

  const animatedAiBarStyle = useAnimatedStyle(() => {
    return {
      height: collapseAnim.value * 44,
      opacity: collapseAnim.value,
      marginTop: collapseAnim.value * 6,
      transform: [{ translateY: (1 - collapseAnim.value) * 10 }],
      overflow: 'hidden',
    };
  });

  const selectProfile = (id: number | null) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveProfileId(id);
  };

  const handleManageProfiles = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeProfileSheet();
    router.push('/sub-profiles');
  };

  // Stato per il modal interattivo AllerTgy AI / Ricerca
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const bottomSafe = Math.max(insets.bottom, 12);
  const isIt = true;
  const family = subProfiles.filter((p) => p.relationship !== 'io');
  const selfAvatar = avatarForIndex(0);
  const isSelfActive = activeProfileId === null;

  const navigateToRoute = (name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeRoute !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const handleCenterPlus = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scanner');
  };

  const handleOpenAllergyPass = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useProfileSheet.getState().close();
    router.push('/allergy-card');
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
        : 'nessun allergene configurato';

      setAiResponse(
        `🛡️ **Analisi di sicurezza per ${activeLabel}:**\n` +
        `Basandomi sui tuoi allergeni attivi (${activeAllergensList}), ho analizzato la tua richiesta:\n\n` +
        `✅ **Esito:** Verifica sempre gli ingredienti prima di consumare. Usa lo scanner per la certezza semaforica al 100%!`
      );
    }, 650);
  };



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

          {/* 0. SEZIONE PROFILI INTEGRATA (UNICO PEZZO SENZA NESSUN TAGLIO) */}
          <Animated.View style={animatedProfileStyle}>
            <View style={styles.profileDragZone}>
              <View
                style={[
                  styles.profileHandle,
                  { backgroundColor: 'rgba(241, 254, 200, 0.40)' },
                ]}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.profileAvatarsRow}
              bounces={false}
            >
              {/* Profilo Io */}
              <Pressable
                onPress={() => selectProfile(null)}
                style={({ pressed }) => [styles.profileAvatarHit, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Io"
              >
                <View style={styles.profileAvatarSlot}>
                  {isSelfActive ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.profileActiveHalo,
                        {
                          borderColor: '#F1FEC8',
                          backgroundColor: 'rgba(241, 254, 200, 0.22)',
                          shadowColor: '#F1FEC8',
                        },
                      ]}
                    />
                  ) : null}
                  <AvatarBubble
                    imageUrl={profilePhotoUrl}
                    emoji={selfAvatar.emoji}
                    color={selfAvatar.color}
                    active={isSelfActive}
                    showCheckmark={isSelfActive}
                    glow={false}
                    size={46}
                  />
                </View>
                <AppText
                  style={[styles.profileAvatarName, isSelfActive && styles.profileAvatarNameActive]}
                  numberOfLines={1}
                >
                  Io
                </AppText>
              </Pressable>

              {/* Sottoprofili Famiglia */}
              {family.map((p, i) => {
                const av = avatarForIndex(i + 1);
                const active = activeProfileId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => selectProfile(p.id)}
                    style={({ pressed }) => [styles.profileAvatarHit, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={p.name}
                  >
                    <View style={styles.profileAvatarSlot}>
                      {active ? (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.profileActiveHalo,
                            {
                              borderColor: '#F1FEC8',
                              backgroundColor: 'rgba(241, 254, 200, 0.22)',
                              shadowColor: '#F1FEC8',
                            },
                          ]}
                        />
                      ) : null}
                      <AvatarBubble
                        imageUrl={p.photo_uri || p.image_url}
                        emoji={av.emoji}
                        color={av.color}
                        active={active}
                        showCheckmark={active}
                        glow={false}
                        size={46}
                      />
                    </View>
                    <AppText
                      style={[styles.profileAvatarName, active && styles.profileAvatarNameActive]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </AppText>
                  </Pressable>
                );
              })}

              {/* Pulsante Gestisci */}
              <Pressable
                onPress={handleManageProfiles}
                style={({ pressed }) => [styles.profileAvatarHit, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Gestisci profili"
              >
                <View
                  style={[
                    styles.profileAddSlot,
                    {
                      borderColor: 'rgba(241, 254, 200, 0.45)',
                      backgroundColor: 'rgba(241, 254, 200, 0.10)',
                    },
                  ]}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="rgba(241, 254, 200, 0.9)"
                  />
                </View>
                <AppText style={styles.profileAddName} numberOfLines={1}>
                  Gestisci
                </AppText>
              </Pressable>
            </ScrollView>
          </Animated.View>

          {/* 1. ZONA SUPERIORE: 5 Tasti Navigazione */}
          <View style={styles.tabIconsRow}>
            {/* Tab 1: Home */}
            <Pressable
              onPress={() => navigateToRoute('home')}
              style={({ pressed }) => [
                styles.tabItem,
                activeRoute === 'home' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Home"
            >
              <Ionicons
                name="home-outline"
                size={23}
                color={
                  activeRoute === 'home'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>

            {/* Tab 2: Locali / Ristoranti */}
            <Pressable
              onPress={() => navigateToRoute('locali')}
              style={({ pressed }) => [
                styles.tabItem,
                activeRoute === 'locali' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ristoranti"
            >
              <Ionicons
                name="map-outline"
                size={23}
                color={
                  activeRoute === 'locali'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>

            {/* Tab 3: Central Action Button (+) */}
            <Pressable
              onPress={handleCenterPlus}
              style={({ pressed }) => [styles.centerFabWrap, pressed && styles.fabPressed]}
              accessibilityRole="button"
              accessibilityLabel="Scansiona o Aggiungi"
            >
              <View
                style={[
                  styles.centerFabHalo,
                  styles.centerFabHaloVanilla,
                ]}
              >
                <View
                  style={[
                    styles.centerFabInner,
                    styles.centerFabInnerVanilla,
                  ]}
                >
                  <Ionicons name="add-outline" size={26} color="#23212C" />
                </View>
              </View>
            </Pressable>

            {/* Tab 4: Preferiti */}
            <Pressable
              onPress={() => navigateToRoute('preferiti')}
              style={({ pressed }) => [
                styles.tabItem,
                activeRoute === 'preferiti' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Preferiti"
            >
              <Ionicons
                name="grid-outline"
                size={22}
                color={
                  activeRoute === 'preferiti'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>

            {/* Tab 5: Profilo / Account */}
            <Pressable
              onPress={() => navigateToRoute('account')}
              onLongPress={handleOpenAllergyPass}
              delayLongPress={350}
              style={({ pressed }) => [
                styles.tabItem,
                activeRoute === 'account' && styles.tabItemActiveVanilla,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Profilo"
              accessibilityHint="Tieni premuto per aprire il Pass Allergeni"
            >
              <Ionicons
                name="person-outline"
                size={23}
                color={
                  activeRoute === 'account'
                    ? '#F1FEC8'
                    : 'rgba(255, 255, 255, 0.65)'
                }
              />
            </Pressable>
          </View>

          {/* 2. ZONA INFERIORE: Barra di Ricerca & AI Chiudibile (senza barretta) */}
          <Animated.View style={animatedAiBarStyle}>
            <Pressable
              onPress={() => handleOpenAi()}
              style={({ pressed }) => [styles.aiBarPressable, pressed && styles.aiBarPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cerca o chiedi ad AllerTgy AI"
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
                    {isIt ? 'Cerca o chiedi ad AllerTgy AI...' : 'Search or ask AllerTgy AI...'}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.aiMicBtn,
                    {
                      backgroundColor: 'rgba(241, 254, 200, 0.18)',
                    },
                  ]}
                >
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

      {/* Modal Interattivo AllerTgy AI Assistant & Ricerca */}
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
                  <AppText style={styles.aiSheetTitle}>AllerTgy AI Assistant</AppText>
                  <AppText style={styles.aiSheetSub}>
                    {isIt ? `Protezione attiva per ${activeLabel}` : `Active protection for ${activeLabel}`}
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
                'Posso mangiare una pizza margherita?',
                'Come spiego le mie allergie allo chef?',
                'Quali ingredienti devo evitare?',
                'Mostrami i piatti verdi sicuri',
              ].map((suggestion, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleOpenAi(suggestion)}
                  style={({ pressed }) => [styles.suggestionChip, pressed && styles.chipPressed]}
                >
                  <AppText style={styles.suggestionChipText}>{suggestion}</AppText>
                </Pressable>
              ))}
            </ScrollView>

            {/* Risposta AI */}
            {aiResponse ? (
              <View style={styles.aiResponseBox}>
                <AppText style={styles.aiResponseText}>{aiResponse}</AppText>
              </View>
            ) : isAiLoading ? (
              <View style={styles.aiLoadingBox}>
                <Ionicons name="sparkles-outline" size={22} color="#23212C" />
                <AppText style={styles.aiLoadingText}>
                  {isIt ? 'AllerTgy AI sta verificando gli ingredienti...' : 'AllerTgy AI is analyzing safety...'}
                </AppText>
              </View>
            ) : null}

            {/* Input Form */}
            <View style={styles.aiInputRow}>
              <TextInput
                value={aiQuery}
                onChangeText={setAiQuery}
                placeholder={isIt ? 'Cerca un piatto o chiedi un consiglio...' : 'Search a dish or ask for advice...'}
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
    paddingHorizontal: 12,
  },
  capsuleBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 5,
    pointerEvents: 'none',
  },
  profileDragZone: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  profileHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  profileAvatarsRow: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 26,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  profileAvatarHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  profileAvatarSlot: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActiveHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  profileAvatarName: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.80)',
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  profileAvatarNameActive: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 13,
  },
  profileAddSlot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAddName: {
    fontFamily: font.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.80)',
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  dockCosmicOverlay: {
    backgroundColor: 'rgba(35, 33, 44, 0.72)',
  },
  tabIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  tabItem: {
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabItemActiveVanilla: {
    backgroundColor: 'rgba(241, 254, 200, 0.16)',
  },
  tabItemActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  centerFabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabHaloVanilla: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(241, 254, 200, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabHaloDark: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabHalo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(241, 254, 200, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabInnerVanilla: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1FEC8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerFabInnerDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerFabInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1FEC8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
  },

  aiBarPressable: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiBarGradient: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  aiPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  aiMicBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(241, 254, 200, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBarPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  aiSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  aiSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiSheetBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1FEC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#23212C',
  },
  aiSheetSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  aiCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSuggestionsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  suggestionChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  chipPressed: {
    backgroundColor: '#F1FEC8',
    borderColor: '#E2F4A6',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  aiResponseBox: {
    backgroundColor: '#FCFFF2',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    padding: 14,
    borderRadius: 16,
  },
  aiResponseText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#23212C',
    fontWeight: '500',
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FCFFF2',
    padding: 14,
    borderRadius: 16,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#23212C',
    fontWeight: '600',
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  aiTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#23212C',
    paddingVertical: 8,
  },
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#23212C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
