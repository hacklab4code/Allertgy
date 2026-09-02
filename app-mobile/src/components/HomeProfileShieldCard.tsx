import React, { useCallback, useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { AppText } from './ui/AppText';
import { BlurView } from 'expo-blur';
import { useProfileSheet } from '../store/profileSheet';
import { useSession } from '../store/session';
import { meshScrollY } from '../hooks/useMeshInk';
import { useIsDarkMode } from '../hooks/useAppTheme';
import { font, spacing } from '../theme';
import type { AllergyIntensity, AllergyCriterio } from '../types';
import { getAllergenName, TRANSLATED_ALLERGENS } from '../engine/translations';

const MATTEO_AVATAR_IMAGE = require('../../assets/avatar_matteo.png');
const COSMIC_NEBULA_IMAGE = require('../../assets/cosmic_nebula_bg.jpg');

const SHORT_NAMES_IT: Record<string, string> = {
  glutine: 'Glutine',
  latte: 'Latte',
  uova: 'Uova',
  arachidi: 'Arachidi',
  frutta_a_guscio: 'Frutta a guscio',
  crostacei: 'Crostacei',
  pesce: 'Pesce',
  soia: 'Soia',
  sedano: 'Sedano',
  senape: 'Senape',
  sesamo: 'Sesamo',
  solfiti: 'Solfiti',
  lupini: 'Lupini',
  molluschi: 'Molluschi',
  mandorle: 'Mandorle',
  nocciole: 'Nocciole',
  noci: 'Noci',
  pistacchi: 'Pistacchi',
  anacardi: 'Anacardi',
  pinoli: 'Pinoli',
  fragole: 'Fragole',
  pomodoro: 'Pomodoro',
  nichel: 'Nichel',
};

const SHORT_NAMES_EN: Record<string, string> = {
  glutine: 'Gluten',
  latte: 'Milk',
  uova: 'Eggs',
  arachidi: 'Peanuts',
  frutta_a_guscio: 'Tree Nuts',
  crostacei: 'Crustaceans',
  pesce: 'Fish',
  soia: 'Soy',
  sedano: 'Celery',
  senape: 'Mustard',
  sesamo: 'Sesame',
  solfiti: 'Sulfites',
  lupini: 'Lupins',
  molluschi: 'Molluscs',
};

function getDisplayAllergenName(code: string, isIt: boolean): string {
  const clean = (code || '').toLowerCase().trim();
  if (isIt && SHORT_NAMES_IT[clean]) return SHORT_NAMES_IT[clean];
  if (!isIt && SHORT_NAMES_EN[clean]) return SHORT_NAMES_EN[clean];
  return getAllergenName(clean, isIt ? 'it' : 'en');
}

function getSeverityInfo(intensity: AllergyIntensity | undefined, isIt: boolean) {
  switch (intensity) {
    case 'grave':
      return {
        color: '#EF4444',
        border: '#EF4444',
        circleBg: '#DC2626',
        glowColor: '#EF4444',
        label: isIt ? 'Grave' : 'Severe',
      };
    case 'lieve':
      return {
        color: '#EAB308',
        border: '#FACC15',
        circleBg: '#CA8A04',
        glowColor: '#EAB308',
        label: isIt ? 'Lieve' : 'Mild',
      };
    case 'moderata':
    default:
      return {
        color: '#F97316',
        border: '#FB923C',
        circleBg: '#EA580C',
        glowColor: '#F97316',
        label: isIt ? 'Media' : 'Moderate',
      };
  }
}

interface HomeProfileShieldCardProps {
  displayName: string | null;
  activeLabel: string;
  activeAvatar: any;
  activeProfileIndex: number;
  allergie: readonly string[];
  allergyIntensities?: Record<string, AllergyIntensity>;
  allergyCriteria?: Record<string, AllergyCriterio>;
  hasAllergie: boolean;
  isIt?: boolean;
}

export const HomeProfileShieldCard = React.memo(function HomeProfileShieldCard({
  displayName,
  activeLabel,
  activeAvatar,
  allergie = [],
  allergyIntensities = {},
  hasAllergie = false,
  isIt = true,
}: HomeProfileShieldCardProps) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDarkMode();
  const openProfileSheet = useProfileSheet((s) => s.open);
  const profilePhotoUrl = useSession((s) => s.profilePhotoUrl);
  const activeProfileId = useSession((s) => s.activeProfileId);

  const handleSwitchProfile = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openProfileSheet();
  }, [openProfileSheet]);

  const handleOpenAllergies = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/allergie');
  }, []);

  const profileName = activeLabel || displayName || (isIt ? 'Matteo' : 'Matteo');

  const isCustomEmojiAvatar =
    typeof activeAvatar === 'string' &&
    activeAvatar !== '' &&
    activeAvatar !== '🧔🏻‍♂️' &&
    activeAvatar !== '👤';

  const allergyCount = allergie.length;

  const contentFadeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      meshScrollY.value,
      [0, 95],
      [1, 0.15],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      meshScrollY.value,
      [0, 95],
      [0, -10],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.heroContainer}>
      <View
        style={[
          styles.heroCard,
          { paddingTop: insets.top + 68 },
        ]}
      >
        {/* 1. Base Traslucida: Vanilla (Giorno) o Deep Cosmic (Notte) */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(23, 20, 32, 0.45)', 'rgba(35, 33, 44, 0.55)', 'rgba(45, 40, 59, 0.50)']
              : ['rgba(241, 254, 200, 0.96)', 'rgba(238, 252, 192, 0.92)', 'rgba(230, 248, 175, 0.88)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Glow: Caldo Vanilla o Nebulare Viola/Indaco Notturno */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99, 102, 241, 0.22)', 'rgba(192, 132, 252, 0.16)', 'transparent']
              : ['rgba(255, 255, 255, 0.65)', 'rgba(241, 254, 200, 0.20)', 'transparent']
          }
          start={{ x: isDark ? 1 : 0.5, y: 0 }}
          end={{ x: isDark ? 0 : 0.5, y: isDark ? 0.8 : 0.9 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 3. Sfocatura Nativa BlurView (Glassmorphism da css.glass) */}
        <BlurView
          intensity={25}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* 4. Tinta Glass Trasparente */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(35, 33, 44, 0.28)', 'rgba(35, 33, 44, 0.45)']
              : ['rgba(241, 254, 200, 0.40)', 'rgba(232, 250, 180, 0.55)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* CONTENUTO HERO CON TRANSIZIONE FLUIDA IN SCROLL */}
        <Animated.View style={contentFadeStyle}>
          {/* RIGA 1: FOTO PROFILO A SINISTRA + "Ciao, Matteo!" A FIANCO */}
          <Pressable
            onPress={handleSwitchProfile}
            style={({ pressed }) => [
              styles.profilePressable,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isIt ? `Profilo di ${profileName}` : `Profile of ${profileName}`}
          >
            <View style={styles.profileRow}>
              {/* Foto profilo a sinistra */}
              <View
                style={[
                  styles.avatarContainer,
                  isDark && styles.avatarContainerDark,
                ]}
              >
                {activeProfileId === null && profilePhotoUrl ? (
                  <Image
                    source={{ uri: profilePhotoUrl }}
                    style={styles.avatarMatteoImage}
                    resizeMode="cover"
                  />
                ) : isCustomEmojiAvatar ? (
                  <Text style={styles.avatarEmojiText}>{typeof activeAvatar === 'string' ? activeAvatar : '👤'}</Text>
                ) : (
                  <Image
                    source={MATTEO_AVATAR_IMAGE}
                    style={styles.avatarMatteoImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Scritta Ciao, Matteo! + info profilo */}
              <View style={styles.greetingTextBox}>
                <Text
                  style={[
                    styles.greetingTitle,
                    isDark && styles.greetingTitleDark,
                  ]}
                  numberOfLines={1}
                >
                  {isIt ? `Ciao, ${profileName}!` : `Hello, ${profileName}!`}
                </Text>
                <View
                  style={[
                    styles.greetingSubtitleBadge,
                    isDark && styles.greetingSubtitleBadgeDark,
                  ]}
                >
                  <Text
                    style={[
                      styles.greetingSubtitle,
                      isDark && styles.greetingSubtitleDark,
                    ]}
                    numberOfLines={1}
                  >
                    {allergyCount > 0
                      ? isIt
                        ? `${allergyCount} ${allergyCount === 1 ? 'allergia attiva' : 'allergie attive'}`
                        : `${allergyCount} ${allergyCount === 1 ? 'active allergy' : 'active allergies'}`
                      : isIt
                        ? 'Nessuna allergia impostata'
                        : 'No allergies configured'}
                  </Text>
                </View>
              </View>

              {/* Icona freccia per cambiare profilo */}
              <View
                style={[
                  styles.profileSwitchIconBox,
                  isDark && styles.profileSwitchIconBoxDark,
                ]}
              >
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={isDark ? 'rgba(241, 254, 200, 0.85)' : '#23212C'}
                />
              </View>
            </View>
          </Pressable>

          {/* RIGA 3: ALLERGIE DEL SOGGETTO (LOGO IN CERCHIO COLORATO) */}
          <View style={styles.allergensContainer}>
            {allergyCount > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.allergensScroll}
              >
                {allergie.map((code) => {
                  const codeKey = (code || '').toLowerCase().trim();
                  const name = getDisplayAllergenName(codeKey, isIt);
                  const emoji = TRANSLATED_ALLERGENS[codeKey]?.emoji || '⚠️';
                  const intensity = allergyIntensities?.[codeKey] || 'moderata';
                  const sev = getSeverityInfo(intensity, isIt);

                  return (
                    <Pressable
                      key={codeKey}
                      onPress={handleOpenAllergies}
                      style={({ pressed }) => [
                        styles.allergenOrbItem,
                        pressed && styles.buttonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${name} (${sev.label})`}
                    >
                      {/* CERCHIO CON IL COLORE DELLA GRAVITÀ CHE RACCHIUDE IL LOGO/EMOJI */}
                      <View
                        style={[
                          styles.allergenCircleOrb,
                          {
                            borderColor: sev.border,
                            backgroundColor: sev.circleBg,
                            shadowColor: sev.glowColor,
                          },
                        ]}
                      >
                        <Text style={styles.allergenCircleEmoji}>{emoji}</Text>
                      </View>
                    </Pressable>
                  );
                })}

                {/* Pulsante rapido gestione allergie */}
                <Pressable
                  onPress={handleOpenAllergies}
                  style={({ pressed }) => [
                    styles.allergenOrbItem,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isIt ? 'Gestisci allergie' : 'Manage allergies'}
                >
                  <View
                    style={[
                      styles.manageCircleOrb,
                      isDark && styles.manageCircleOrbDark,
                    ]}
                  >
                    <Ionicons
                      name="options-outline"
                      size={16}
                      color={isDark ? '#FFFFFF' : '#23212C'}
                    />
                  </View>
                </Pressable>
              </ScrollView>
            ) : (
              <Pressable
                onPress={handleOpenAllergies}
                style={({ pressed }) => [
                  styles.emptyAllergensPill,
                  isDark && styles.emptyAllergensPillDark,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isIt ? 'Configura allergie' : 'Configure allergies'}
              >
                <Text style={styles.emptyAllergenEmoji}>🛡️</Text>
                <Text
                  style={[
                    styles.emptyAllergenText,
                    isDark && styles.emptyAllergenTextDark,
                  ]}
                >
                  {isIt ? 'Tocca per impostare le allergie del profilo' : 'Tap to configure profile allergies'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(35, 33, 44, 0.70)'}
                />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  heroContainer: {
    marginHorizontal: -spacing.lg,
    marginTop: 0,
    marginBottom: 16,
  },
  heroCard: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 18,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  profilePressable: {
    width: '100%',
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  profileRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(35, 33, 44, 0.25)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  avatarMatteoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarEmojiText: {
    fontSize: 26,
  },
  greetingTextBox: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontFamily: font.displayBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: '#23212C',
    fontWeight: '800',
  },
  greetingSubtitleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(35, 33, 44, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(35, 33, 44, 0.30)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 4,
  },
  greetingSubtitle: {
    fontFamily: font.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: '#23212C',
    fontWeight: '700',
  },
  profileSwitchIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(35, 33, 44, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(35, 33, 44, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  allergensContainer: {
    width: '100%',
    marginTop: 4,
  },
  allergensScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 2,
    paddingRight: 10,
  },
  allergenOrbItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergenCircleOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  allergenCircleEmoji: {
    fontSize: 18,
  },
  manageCircleOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: 'rgba(35, 33, 44, 0.50)',
    backgroundColor: 'rgba(35, 33, 44, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAllergensPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1.2,
    borderColor: 'rgba(35, 33, 44, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    width: '100%',
  },
  emptyAllergenEmoji: {
    fontSize: 18,
  },
  emptyAllergenText: {
    fontFamily: font.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: '#23212C',
    flex: 1,
  },
  greetingTitleDark: {
    color: '#FFFFFF',
  },
  greetingSubtitleBadgeDark: {
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    borderColor: 'rgba(241, 254, 200, 0.35)',
  },
  greetingSubtitleDark: {
    color: '#F1FEC8',
  },
  avatarContainerDark: {
    borderColor: 'rgba(241, 254, 200, 0.45)',
    backgroundColor: 'transparent',
  },
  profileSwitchIconBoxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  manageCircleOrbDark: {
    borderColor: 'rgba(241, 254, 200, 0.60)',
    backgroundColor: 'rgba(241, 254, 200, 0.12)',
  },
  emptyAllergensPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  emptyAllergenTextDark: {
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
