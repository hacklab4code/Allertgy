import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './ui/AppText';
import { AvatarBubble } from './ui/AvatarBubble';
import { colors, radius, spacing, font } from '../theme';
import { useProfileSheet } from '../store/profileSheet';
import { TRANSLATED_ALLERGENS } from '../engine/translations';
import type { AllergyIntensity } from '../types';

interface HomeProfileShieldCardProps {
  displayName: string | null;
  activeLabel: string;
  activeAvatar: string;
  activeProfileIndex: number;
  allergie: readonly string[];
  allergyIntensities?: Record<string, AllergyIntensity>;
  hasAllergie: boolean;
  isIt?: boolean;
}

export function HomeProfileShieldCard({
  displayName,
  activeLabel,
  activeAvatar,
  activeProfileIndex,
  allergie,
  allergyIntensities = {},
  hasAllergie,
  isIt = true,
}: HomeProfileShieldCardProps) {
  const openProfileSheet = useProfileSheet((s) => s.open);

  const handleSwitchProfile = () => {
    void Haptics.selectionAsync();
    openProfileSheet();
  };

  const handleOpenAllergyManager = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/allergie');
  };

  const handleOpenChefPass = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/allergy-card');
  };

  const handleOpenEmergency = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/emergency');
  };

  const handleOpenDossier = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/medical-dossier');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FAF8FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top Bar: Profile Identity & Profile Switcher */}
        <View style={styles.topRow}>
          <Pressable
            onPress={handleSwitchProfile}
            style={({ pressed }) => [styles.profileSelector, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isIt ? 'Cambia profilo attivo' : 'Switch active profile'}
          >
            <View style={styles.avatarWrapper}>
              <AvatarBubble
                index={activeProfileIndex}
                size={38}
                customEmoji={activeAvatar}
              />
              <View style={styles.activeDotBadge} />
            </View>

            <View style={styles.profileTextInfo}>
              <View style={styles.nameRow}>
                <AppText style={styles.profileName} numberOfLines={1}>
                  {activeLabel}
                </AppText>
                <Ionicons name="chevron-down" size={14} color="#6B7280" />
              </View>
              <AppText style={styles.profileSubtitle}>
                {isIt ? 'Profilo attivo' : 'Active profile'}
              </AppText>
            </View>
          </Pressable>

          {/* Shield Status Badge */}
          <View style={[styles.shieldStatusBadge, hasAllergie ? styles.shieldActive : styles.shieldSetup]}>
            <View style={[styles.pulseDot, hasAllergie ? styles.pulseGreen : styles.pulseAmber]} />
            <AppText style={[styles.shieldStatusText, hasAllergie ? styles.textGreen : styles.textAmber]}>
              {hasAllergie
                ? isIt
                  ? `${allergie.length} ${allergie.length === 1 ? 'allergia' : 'allergeni'}`
                  : `${allergie.length} ${allergie.length === 1 ? 'allergen' : 'allergens'}`
                : isIt
                ? 'Nessuna allergia'
                : 'No allergens'}
            </AppText>
          </View>
        </View>

        {/* Middle Row: Active Allergens Tag Cloud */}
        <View style={styles.allergensSection}>
          {hasAllergie ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.allergenChipsScroll}
            >
              {allergie.map((code) => {
                const info = TRANSLATED_ALLERGENS[code] || {
                  it: code.replace(/_/g, ' '),
                  en: code.replace(/_/g, ' '),
                  emoji: '⚠️',
                };
                const intensity = allergyIntensities[code];
                const isSevere = intensity === 'grave';

                return (
                  <Pressable
                    key={code}
                    onPress={handleOpenAllergyManager}
                    style={({ pressed }) => [
                      styles.allergenChip,
                      isSevere && styles.severeChip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText style={styles.allergenEmoji}>{info.emoji}</AppText>
                    <AppText style={[styles.allergenName, isSevere && styles.severeText]} numberOfLines={1}>
                      {isIt ? info.it : info.en}
                    </AppText>
                    {isSevere ? (
                      <View style={styles.severeBadge}>
                        <AppText style={styles.severeBadgeText}>
                          {isIt ? 'Grave' : 'Severe'}
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={handleOpenAllergyManager}
                style={({ pressed }) => [styles.addChip, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={14} color="#6366F1" />
                <AppText style={styles.addChipText}>{isIt ? 'Modifica' : 'Edit'}</AppText>
              </Pressable>
            </ScrollView>
          ) : (
            <Pressable
              onPress={handleOpenAllergyManager}
              style={({ pressed }) => [styles.emptyAllergensBanner, pressed && styles.pressed]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#6366F1" />
              <AppText style={styles.emptyAllergensText}>
                {isIt
                  ? 'Configura le tue allergie per attivare il semaforo sicuro'
                  : 'Configure your allergies to activate safe traffic lights'}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color="#6366F1" />
            </Pressable>
          )}
        </View>

        {/* Bottom Quick Tools Bar */}
        <View style={styles.toolsBar}>
          <Pressable
            onPress={handleOpenChefPass}
            style={({ pressed }) => [styles.toolButton, styles.chefPassBtn, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chefPassGradient}
            >
              <Ionicons name="card" size={16} color="#FFFFFF" />
              <AppText style={styles.chefPassText}>
                {isIt ? 'Chef Pass 🪪' : 'Chef Pass 🪪'}
              </AppText>
              <View style={styles.langPill}>
                <AppText style={styles.langPillText}>5 LINGUE</AppText>
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleOpenDossier}
            style={({ pressed }) => [styles.toolButton, styles.secondaryToolBtn, pressed && styles.pressed]}
          >
            <Ionicons name="document-text-outline" size={15} color="#4B5563" />
            <AppText style={styles.secondaryToolText}>
              {isIt ? 'Referti AI' : 'Medical PDF'}
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleOpenEmergency}
            style={({ pressed }) => [styles.toolButton, styles.sosToolBtn, pressed && styles.pressed]}
          >
            <Ionicons name="medical" size={14} color="#EF4444" />
            <AppText style={styles.sosToolText}>SOS</AppText>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E2F2',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  activeDotBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextInfo: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  shieldStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  shieldActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  shieldSetup: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pulseGreen: {
    backgroundColor: '#10B981',
  },
  pulseAmber: {
    backgroundColor: '#F59E0B',
  },
  shieldStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textGreen: {
    color: '#065F46',
  },
  textAmber: {
    color: '#92400E',
  },
  allergensSection: {
    marginBottom: 12,
  },
  allergenChipsScroll: {
    gap: 6,
    paddingRight: 4,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F0FA',
    borderWidth: 1,
    borderColor: '#E3DCF2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  severeChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  allergenEmoji: {
    fontSize: 13,
  },
  allergenName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  severeText: {
    color: '#991B1B',
  },
  severeBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  severeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptyAllergensBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  emptyAllergensText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#3730A3',
    fontWeight: '500',
  },
  toolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F0FA',
  },
  toolButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  chefPassBtn: {
    flex: 1.4,
  },
  chefPassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  chefPassText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  langPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  secondaryToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  secondaryToolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  sosToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  sosToolText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
