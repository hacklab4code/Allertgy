import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import {
  generateReportText,
  shareMedicalReport,
  type MedicalReportData,
} from '../src/services/medicalReport';
import { getAllergenName } from '../src/engine/translations';

export default function MedicalDossierScreen() {
  const insets = useSafeAreaInsets();
  const {
    allergie: primaryAllergies,
    allergyIntensities: primaryIntensities = {},
    allergyCriteria: primaryCriteria = {},
    ingredientiEsclusi: primaryExcluded = [],
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
  const [reportType, setReportType] = useState<'school' | 'allergist'>('school');
  const [schoolName, setSchoolName] = useState('');
  const [classSection, setClassSection] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const profileName = useMemo(() => {
    if (activeProfile?.name) return activeProfile.name;
    if (email) {
      const namePart = email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Paziente';
  }, [activeProfile, email]);

  const activeAllergies = useMemo(() => {
    if (activeProfile) {
      return activeProfile.allergens.map((a) => ({
        code: a.code,
        intensity: (a.intensity || 'moderata') as 'lieve' | 'moderata' | 'grave',
        criterio: a.criterio as 'assoluto' | 'crudo' | 'cotto' | undefined,
      }));
    }
    return primaryAllergies.map((code) => ({
      code,
      intensity: (primaryIntensities[code] || 'moderata') as 'lieve' | 'moderata' | 'grave',
      criterio: primaryCriteria[code] as 'assoluto' | 'crudo' | 'cotto' | undefined,
    }));
  }, [activeProfile, primaryAllergies, primaryIntensities, primaryCriteria]);

  const activeExcluded = useMemo(() => {
    return primaryExcluded;
  }, [primaryExcluded]);

  const reportData: MedicalReportData = useMemo(() => ({
    patientName: profileName,
    allergies: activeAllergies,
    excludedIngredients: activeExcluded,
    emergencyMedicines: emergencyMedicines,
    emergencyContactName: emergencyContactName,
    emergencyContactPhone: emergencyContactPhone,
    doctorName: doctorName.trim() || undefined,
    doctorPhone: doctorPhone.trim() || undefined,
    schoolName: schoolName.trim() || undefined,
    classSection: classSection.trim() || undefined,
    reportType,
  }), [
    profileName,
    activeAllergies,
    activeExcluded,
    emergencyMedicines,
    emergencyContactName,
    emergencyContactPhone,
    doctorName,
    doctorPhone,
    schoolName,
    classSection,
    reportType,
  ]);

  const handleShare = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await shareMedicalReport(reportData, isIt);
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Fascicolo Medico PDF' : 'Medical Report PDF'}
        rightElement={
          <Pressable onPress={handleShare} hitSlop={8} style={styles.topActionBtn}>
            <Ionicons name="share-outline" size={18} color="#1E1B4B" />
          </Pressable>
        }
      />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
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
                <AppText style={[styles.profilePillText, !activeProfileId && styles.profilePillTextActive]}>
                  👤 {email ? email.split('@')[0] : 'Principale'}
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
                    <AppText style={[styles.profilePillText, isSelected && styles.profilePillTextActive]}>
                      👶 {p.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* TEMPLATE SWITCHER */}
          <View style={styles.tabSwitcher}>
            <Pressable
              style={[styles.tabBtn, reportType === 'school' && styles.tabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setReportType('school');
              }}
            >
              <Ionicons name="school-outline" size={16} color={reportType === 'school' ? '#1E1B4B' : '#6B6690'} />
              <AppText variant="bodyBold" style={[styles.tabBtnText, reportType === 'school' && styles.tabBtnTextActive]}>
                {isIt ? 'Scuola & Mensa' : 'School & Canteen'}
              </AppText>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, reportType === 'allergist' && styles.tabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setReportType('allergist');
              }}
            >
              <Ionicons name="fitness-outline" size={16} color={reportType === 'allergist' ? '#1E1B4B' : '#6B6690'} />
              <AppText variant="bodyBold" style={[styles.tabBtnText, reportType === 'allergist' && styles.tabBtnTextActive]}>
                {isIt ? 'Referto Allergologo' : 'Allergist Dossier'}
              </AppText>
            </Pressable>
          </View>

          {/* CONFIGURATION INPUTS */}
          <View style={styles.configCard}>
            {reportType === 'school' ? (
              <>
                <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Nome Istituto Scolastico / Asilo' : 'School Name'}</AppText>
                <TextInput
                  style={styles.input}
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder="es. I.C. Leonardo da Vinci"
                  placeholderTextColor="#94A3B8"
                />

                <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Classe e Sezione' : 'Class / Section'}</AppText>
                <TextInput
                  style={styles.input}
                  value={classSection}
                  onChangeText={setClassSection}
                  placeholder="es. 3ª B Primaria"
                  placeholderTextColor="#94A3B8"
                />
              </>
            ) : (
              <>
                <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Nome Allergologo / Specialista' : 'Doctor Name'}</AppText>
                <TextInput
                  style={styles.input}
                  value={doctorName}
                  onChangeText={setDoctorName}
                  placeholder="es. Dott.ssa Rossi (Allergologia)"
                  placeholderTextColor="#94A3B8"
                />

                <AppText variant="caption" style={styles.inputLabel}>{isIt ? 'Telefono Ambulatorio / Studio' : 'Clinic Phone'}</AppText>
                <TextInput
                  style={styles.input}
                  value={doctorPhone}
                  onChangeText={setDoctorPhone}
                  placeholder="es. +39 02 1234567"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </>
            )}
          </View>

          {/* PREVIEW CARD (PROFESSIONAL PAPER DESIGN) */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewLogoBadge}>
                <Ionicons name="document-text" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" style={styles.docTitle}>
                  {reportType === 'school' ? 'MODULO DIETA SPECIALE' : 'FASCICOLO ALLERGOLOGICO'}
                </AppText>
                <AppText variant="caption" color="#64748B">
                  {isIt ? 'Generato da AllerTgy Clinical Hub' : 'Generated by AllerTgy Clinical Hub'}
                </AppText>
              </View>
            </View>

            <View style={styles.docDivider} />

            <View style={styles.docSection}>
              <AppText variant="caption" style={styles.docSectionLabel}>{isIt ? 'PAZIENTE / ALUNNO' : 'PATIENT / STUDENT'}</AppText>
              <AppText variant="bodyBold" style={{ color: '#1E1B4B', fontSize: 16 }}>{profileName}</AppText>
              {schoolName ? <AppText variant="caption" color="#475569">{schoolName} {classSection ? `· ${classSection}` : ''}</AppText> : null}
            </View>

            <View style={styles.docSection}>
              <AppText variant="caption" style={styles.docSectionLabel}>{isIt ? 'ALLERGENI & INTOLLERANZE' : 'ALLERGENS & DIET'}</AppText>
              <View style={styles.allergenBadgeList}>
                {activeAllergies.map((a) => {
                  const isSevere = a.intensity === 'grave';
                  return (
                    <View key={a.code} style={[styles.allergenDocBadge, isSevere && styles.allergenDocBadgeSevere]}>
                      <AppText style={[styles.allergenDocText, isSevere && styles.allergenDocTextSevere]}>
                        {getAllergenName(a.code, isIt ? 'it' : 'en')} {isSevere ? '(GRAVE)' : `(${a.intensity})`}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.docSection}>
              <AppText variant="caption" style={styles.docSectionLabel}>{isIt ? 'FARMACI SALVAVITA IN DOTAZIONE' : 'EMERGENCY MEDICATIONS'}</AppText>
              <AppText variant="body" color="#1E1B4B">
                {emergencyMedicines || (isIt ? 'Autoiniettore Adrenalina / Antistaminico' : 'Adrenaline Auto-Injector')}
              </AppText>
            </View>

            <View style={styles.docSection}>
              <AppText variant="caption" style={styles.docSectionLabel}>{isIt ? 'REPERIBILITÀ GENITORI / EMERGENZA' : 'EMERGENCY CONTACTS'}</AppText>
              <AppText variant="bodyBold" color="#1E1B4B">
                {emergencyContactName || 'Referente Famiglia'} · {emergencyContactPhone || 'Tel. in anagrafica'}
              </AppText>
            </View>
          </View>

          {/* ACTION BUTTON */}
          <SurfaceButton
            label={isIt ? 'Esporta e Condividi Documento' : 'Export & Share Document'}
            onPress={handleShare}
            variant="primary"
            icon="share"
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  profileScroll: {
    marginBottom: 12,
  },
  profileScrollContent: {
    gap: 8,
  },
  profilePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profilePillActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  profilePillText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: '#4B5563',
  },
  profilePillTextActive: {
    color: '#FFFFFF',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#ECEAF8',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    color: '#6B6690',
  },
  tabBtnTextActive: {
    color: '#1E1B4B',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1E1B4B',
    fontFamily: font.regular,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewLogoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 15,
    color: '#1E1B4B',
    letterSpacing: 0.5,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  docSection: {
    gap: 3,
  },
  docSectionLabel: {
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  allergenBadgeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  allergenDocBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergenDocBadgeSevere: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  allergenDocText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  allergenDocTextSevere: {
    color: '#DC2626',
  },
});
