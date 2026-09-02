import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import {
  WALLPAPER_THEMES,
  shareIceCardText,
  type IceWallpaperData,
} from '../src/services/iceWallpaper';
import { getAllergenName } from '../src/engine/translations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LockscreenIceScreen() {
  const insets = useSafeAreaInsets();
  const {
    allergie: primaryAllergies,
    subProfiles,
    activeProfileId,
    setActiveProfileId,
    emergencyMedicines,
    emergencyContactName,
    emergencyContactPhone,
    language,
    email,
  } = useSession();

  const isIt = (language || 'it').toLowerCase() === 'it';

  const [selectedTheme, setSelectedTheme] = useState<'emergency_red' | 'midnight_dark' | 'neon_contrast'>('emergency_red');
  const [adrenalineLocation, setAdrenalineLocation] = useState('Nello zaino / Tasca anteriore');
  const [bloodType, setBloodType] = useState('0+');

  const themeConfig = WALLPAPER_THEMES[selectedTheme];

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const profileName = useMemo(() => {
    if (activeProfile?.name) return activeProfile.name;
    if (email) {
      const part = email.split('@')[0];
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return 'Paziente';
  }, [activeProfile, email]);

  const activeAllergies = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const iceData: IceWallpaperData = useMemo(() => ({
    name: profileName,
    allergies: activeAllergies,
    bloodType: bloodType.trim() || undefined,
    adrenalineLocation: adrenalineLocation.trim() || undefined,
    iceContactName: emergencyContactName || 'Referente Famiglia',
    iceContactPhone: emergencyContactPhone || 'Tel. registrato',
    theme: selectedTheme,
  }), [
    profileName,
    activeAllergies,
    bloodType,
    adrenalineLocation,
    emergencyContactName,
    emergencyContactPhone,
    selectedTheme,
  ]);

  const handleShare = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await shareIceCardText(iceData, isIt);
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Sfondo Schermata di Blocco ICE' : 'Lock Screen ICE Wallpaper'}
        rightElement={
          <Pressable onPress={handleShare} hitSlop={8} style={styles.topActionBtn}>
            <Ionicons name="share-outline" size={18} color="#23212C" />
          </Pressable>
        }
      />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* HERO SUMMARY CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="phone-portrait-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {isIt ? 'Schermata di Blocco ICE' : 'Lock Screen ICE Wallpaper'}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? 'Crea un wallpaper di sicurezza con contatti e posizione adrenalina visibile ai soccorritori anche a telefono bloccato.'
                    : 'Create a medical lock screen wallpaper visible to first responders even when device is locked.'}
                </AppText>
              </View>
            </View>
          </View>

          {/* PROFILE SELECTOR */}
          {subProfiles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroll} contentContainerStyle={styles.profileScrollContent}>
              <Pressable
                style={[styles.profilePill, !activeProfileId && styles.profilePillActive]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveProfileId(null);
                }}
              >
                <Ionicons name="person-outline" size={13} color={!activeProfileId ? '#F1FEC8' : '#64748B'} />
                <AppText style={[styles.profilePillText, !activeProfileId && styles.profilePillTextActive]}>
                  {email ? email.split('@')[0] : 'Io'}
                </AppText>
              </Pressable>
              {subProfiles.map((p) => {
                const isSelected = activeProfileId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.profilePill, isSelected && styles.profilePillActive]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setActiveProfileId(p.id);
                    }}
                  >
                    <Ionicons name="person-outline" size={13} color={isSelected ? '#F1FEC8' : '#64748B'} />
                    <AppText style={[styles.profilePillText, isSelected && styles.profilePillTextActive]}>
                      {p.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* THEME PICKER */}
          <View style={styles.themeRow}>
            {Object.values(WALLPAPER_THEMES).map((th) => {
              const isSel = selectedTheme === th.id;
              return (
                <Pressable
                  key={th.id}
                  style={[styles.themeBtn, isSel && styles.themeBtnActive, { borderColor: th.border }]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedTheme(th.id as any);
                  }}
                >
                  <View style={[styles.themeDot, { backgroundColor: th.headerColor }]} />
                  <AppText variant="caption" style={[styles.themeText, isSel && styles.themeTextActive]}>
                    {th.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* CUSTOMIZATION CARD */}
          <View style={styles.configCard}>
            <AppText variant="caption" style={styles.inputLabel}>
              {isIt ? 'Posizione Adrenalina / Farmaci (es. Zaino, borsa)' : 'Adrenaline / Meds Location'}
            </AppText>
            <TextInput
              style={styles.input}
              value={adrenalineLocation}
              onChangeText={setAdrenalineLocation}
              placeholder="es. Nello zaino / Tasca destra"
              placeholderTextColor="#94A3B8"
            />

            <AppText variant="caption" style={styles.inputLabel}>
              {isIt ? 'Gruppo Sanguigno (opzionale)' : 'Blood Type (optional)'}
            </AppText>
            <TextInput
              style={styles.input}
              value={bloodType}
              onChangeText={setBloodType}
              placeholder="es. 0+, A+, B+, 0-"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* PHONE LOCKSCREEN MOCKUP PREVIEW */}
          <View style={[styles.phoneMockup, { backgroundColor: themeConfig.bgColor, borderColor: themeConfig.border }]}>
            {/* Status & Clock area (simulating lockscreen layout) */}
            <View style={styles.clockArea}>
              <Ionicons name="lock-closed-outline" size={16} color={themeConfig.headerColor} />
              <Text style={[styles.mockTime, { color: themeConfig.textColor }]}>09:41</Text>
              <Text style={[styles.mockDate, { color: themeConfig.textMuted }]}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>

            {/* HIGH-CONTRAST ICE CARD IN THE LOWER ZONE */}
            <View style={[styles.iceCard, { backgroundColor: themeConfig.cardBg, borderColor: themeConfig.border }]}>
              <View style={styles.iceCardHead}>
                <View style={[styles.sosBadge, { backgroundColor: themeConfig.accentBadge }]}>
                  <Ionicons name="medical-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.sosBadgeText}>ICE · SOCCORSO MEDICO</Text>
                </View>
                {bloodType ? (
                  <View style={styles.bloodBadge}>
                    <Text style={[styles.bloodText, { color: themeConfig.headerColor }]}>{bloodType}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.icePatientName, { color: themeConfig.textColor }]}>
                {profileName.toUpperCase()}
              </Text>

              <View style={styles.iceDivider} />

              <View style={styles.iceSection}>
                <Text style={[styles.iceSectionLabel, { color: themeConfig.headerColor }]}>
                  ALLERGIE GRAVI / RISCHIO ANAFILASSI:
                </Text>
                <View style={styles.allergenPillWrap}>
                  {activeAllergies.length > 0 ? (
                    activeAllergies.map((a) => (
                      <View key={a} style={[styles.allergenPill, { backgroundColor: themeConfig.accentBadge }]}>
                        <Text style={[styles.allergenPillText, { color: themeConfig.textColor }]}>
                          {getAllergenName(a, isIt ? 'it' : 'en').toUpperCase()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: themeConfig.textMuted, fontSize: 12 }}>Nessuna allergia grave registrata</Text>
                  )}
                </View>
              </View>

              <View style={styles.iceSection}>
                <Text style={[styles.iceSectionLabel, { color: themeConfig.headerColor }]}>
                  AUTOINIETTORE ADRENALINA:
                </Text>
                <Text style={[styles.iceValue, { color: themeConfig.textColor }]}>
                  {adrenalineLocation || 'Nello zaino / borsa'}
                </Text>
              </View>

              <View style={styles.iceSection}>
                <Text style={[styles.iceSectionLabel, { color: themeConfig.headerColor }]}>
                  CONTATTO D'EMERGENZA:
                </Text>
                <Text style={[styles.iceValueBold, { color: themeConfig.textColor }]}>
                  {emergencyContactName || 'Referente Famiglia'} · {emergencyContactPhone || 'Tel. registrato'}
                </Text>
              </View>
            </View>

            <Text style={[styles.bottomHint, { color: themeConfig.textMuted }]}>
              Visibile ai soccorritori anche a telefono bloccato
            </Text>
          </View>

          {/* ACTION BUTTON */}
          <Pressable style={styles.shareCtaBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#23212C" />
            <AppText variant="bodyBold" color="#23212C">
              {isIt ? 'Condividi o Salva Sfondo' : 'Share or Save Wallpaper'}
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    gap: 14,
    paddingTop: 4,
  },
  navBackBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  topActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // HERO SUMMARY CARD COSMIC + VANILLA
  heroCard: {
    backgroundColor: '#23212C',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.2)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.3)',
  },
  heroTextContainer: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
  },

  profileScroll: {
    marginBottom: 2,
  },
  profileScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profilePillActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  profilePillText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#475569',
  },
  profilePillTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  themeBtnActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeText: {
    fontSize: 11,
    color: '#475569',
  },
  themeTextActive: {
    color: '#F1FEC8',
    fontWeight: '700',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#23212C',
    fontFamily: font.regular,
  },
  phoneMockup: {
    borderRadius: 32,
    borderWidth: 2,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    gap: 16,
  },
  clockArea: {
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  mockTime: {
    fontSize: 52,
    fontWeight: '200',
    letterSpacing: -1,
  },
  mockDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  iceCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  iceCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sosBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bloodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bloodText: {
    fontSize: 12,
    fontWeight: '800',
  },
  icePatientName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  iceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  iceSection: {
    gap: 3,
  },
  iceSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  allergenPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  allergenPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergenPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  iceValue: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  iceValueBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomHint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  shareCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#F1FEC8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
