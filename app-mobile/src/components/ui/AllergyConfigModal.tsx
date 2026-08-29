import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { SurfaceButton } from './SurfaceButton';
import { colors, radius, spacing } from '../../theme';
import type { AllergyCriterio, AllergyIntensity } from '../../types';

interface AllergyConfigModalProps {
  visible: boolean;
  onClose: () => void;
  allergenName: string;
  allergenEmoji?: string;
  isDiet?: boolean;
  intensity: AllergyIntensity;
  criterio: AllergyCriterio;
  onSave: (intensity: AllergyIntensity, criterio: AllergyCriterio) => void;
  isIt?: boolean;
}

export function AllergyConfigModal({
  visible,
  onClose,
  allergenName,
  allergenEmoji = '⚠️',
  isDiet = false,
  intensity: initialIntensity,
  criterio: initialCriterio,
  onSave,
  isIt = true,
}: AllergyConfigModalProps) {
  const [intensity, setIntensity] = useState<AllergyIntensity>(initialIntensity || 'moderata');
  const [criterio, setCriterio] = useState<AllergyCriterio>(initialCriterio || 'assoluto');

  useEffect(() => {
    if (visible) {
      setIntensity(initialIntensity || 'moderata');
      setCriterio(initialCriterio || 'assoluto');
    }
  }, [visible, initialIntensity, initialCriterio]);

  const hasChanges =
    intensity !== (initialIntensity || 'moderata') ||
    criterio !== (initialCriterio || 'assoluto');

  const handleCloseAttempt = () => {
    if (hasChanges) {
      Alert.alert(
        isIt ? 'Modifiche non salvate' : 'Unsaved changes',
        isIt
          ? 'Hai modificato i dettagli di questo allergene. Vuoi uscire senza salvare la configurazione?'
          : 'You modified settings for this allergen. Exit without saving?',
        [
          { text: isIt ? 'Continua' : 'Keep editing', style: 'cancel' },
          {
            text: isIt ? 'Esci senza salvare' : 'Exit without saving',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleSelectIntensity = (val: AllergyIntensity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIntensity(val);
  };

  const handleSelectCriterio = (val: AllergyCriterio) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCriterio(val);
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(intensity, criterio);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCloseAttempt}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleCloseAttempt} />
        
        <View style={styles.sheet}>
          {/* Handle indicator */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.emojiBadge}>
                <AppText style={styles.emojiText}>{allergenEmoji}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" style={styles.titleText} numberOfLines={1}>
                  {allergenName}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {isIt ? 'Personalizza l\'intensità e le regole per la tua salute' : 'Customize severity and safety rules'}
                </AppText>
              </View>
            </View>
            <Pressable onPress={handleCloseAttempt} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* SEVERITY SECTION */}
            <View style={styles.section}>
              <AppText variant="bodyBold" style={styles.sectionTitle}>
                {isIt ? 'Livello di Intensità' : 'Severity Level'}
              </AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.sectionDesc}>
                {isIt
                  ? 'Definisce la priorità dell\'avviso quando questo ingrediente viene rilevato nei piatti.'
                  : 'Defines the warning priority when this ingredient is found in dishes.'}
              </AppText>

              <View style={styles.optionsStack}>
                {/* LIEVE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCard,
                    intensity === 'lieve' && styles.optionCardLieve,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectIntensity('lieve')}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.dot, { backgroundColor: colors.yellow }]} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color={intensity === 'lieve' ? colors.onYellow : colors.ink}>
                        {isIt ? 'Lieve (Giallo)' : 'Mild (Yellow)'}
                      </AppText>
                      <AppText variant="caption" color={colors.onSurfaceMuted}>
                        {isIt
                          ? 'Reazione moderata o semplice fastidio. Mostra avviso di attenzione.'
                          : 'Mild reaction or discomfort. Displays a yellow warning.'}
                      </AppText>
                    </View>
                    {intensity === 'lieve' && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.amber} />
                    )}
                  </View>
                </Pressable>

                {/* MODERATA */}
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCard,
                    intensity === 'moderata' && styles.optionCardModerata,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectIntensity('moderata')}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color={intensity === 'moderata' ? colors.onYellow : colors.ink}>
                        {isIt ? 'Moderata (Standard)' : 'Moderate (Standard)'}
                      </AppText>
                      <AppText variant="caption" color={colors.onSurfaceMuted}>
                        {isIt
                          ? 'Sensibilità o intolleranza standard. Evidenzia nei filtri di ricerca.'
                          : 'Standard sensitivity or intolerance. Highlighted in search filters.'}
                      </AppText>
                    </View>
                    {intensity === 'moderata' && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.amber} />
                    )}
                  </View>
                </Pressable>

                {/* GRAVE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCard,
                    intensity === 'grave' && styles.optionCardGrave,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectIntensity('grave')}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.dot, { backgroundColor: colors.red }]} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color={intensity === 'grave' ? colors.onRed : colors.ink}>
                        {isIt ? 'Grave / Anafilassi (Rosso)' : 'Severe / Anaphylaxis (Red)'}
                      </AppText>
                      <AppText variant="caption" color={colors.onSurfaceMuted}>
                        {isIt
                          ? 'Alto rischio o choc anafilattico. Esclude categoricamente i piatti a rischio.'
                          : 'High risk or anaphylaxis. Strictly excludes non-compliant dishes.'}
                      </AppText>
                    </View>
                    {intensity === 'grave' && (
                      <Ionicons name="alert-circle" size={22} color={colors.red} />
                    )}
                  </View>
                </Pressable>
              </View>
            </View>

            {/* CRITERION SECTION (FORMA PREPARAZIONE) */}
            {!isDiet && (
              <View style={[styles.section, { marginTop: spacing.md }]}>
                <AppText variant="bodyBold" style={styles.sectionTitle}>
                  {isIt ? 'Forma e Preparazione' : 'Form & Preparation'}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.sectionDesc}>
                  {isIt
                    ? 'Alcuni alimenti vengono tollerati solo se cotti o crudi. Scegli quando attivare l\'avviso.'
                    : 'Some foods are tolerated only when cooked or raw. Select when to activate the alert.'}
                </AppText>

                <View style={styles.optionsStack}>
                  {/* ASSOLUTO */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionCard,
                      criterio === 'assoluto' && styles.optionCardActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleSelectCriterio('assoluto')}
                  >
                    <View style={styles.optionRow}>
                      <Ionicons name="ban-outline" size={20} color={criterio === 'assoluto' ? colors.brand : colors.onSurfaceMuted} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold" color={criterio === 'assoluto' ? colors.brand : colors.ink}>
                          {isIt ? 'Assoluto' : 'Absolute'}
                        </AppText>
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {isIt ? 'Evita sempre, in qualsiasi forma o tipo di cottura.' : 'Avoid always, in any form or preparation.'}
                        </AppText>
                      </View>
                      {criterio === 'assoluto' && (
                        <Ionicons name="checkmark" size={20} color={colors.brand} />
                      )}
                    </View>
                  </Pressable>

                  {/* CRUDO */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionCard,
                      criterio === 'crudo' && styles.optionCardActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleSelectCriterio('crudo')}
                  >
                    <View style={styles.optionRow}>
                      <Ionicons name="leaf-outline" size={20} color={criterio === 'crudo' ? colors.brand : colors.onSurfaceMuted} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold" color={criterio === 'crudo' ? colors.brand : colors.ink}>
                          {isIt ? 'Solo crudo' : 'Raw only'}
                        </AppText>
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {isIt
                            ? 'Problema solo se consumato crudo (es. uova fresche, frutta). Tollerato se cotto.'
                            : 'Only a problem if consumed raw. Tolerated when cooked.'}
                        </AppText>
                      </View>
                      {criterio === 'crudo' && (
                        <Ionicons name="checkmark" size={20} color={colors.brand} />
                      )}
                    </View>
                  </Pressable>

                  {/* COTTO */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionCard,
                      criterio === 'cotto' && styles.optionCardActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleSelectCriterio('cotto')}
                  >
                    <View style={styles.optionRow}>
                      <Ionicons name="flame-outline" size={20} color={criterio === 'cotto' ? colors.brand : colors.onSurfaceMuted} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold" color={criterio === 'cotto' ? colors.brand : colors.ink}>
                          {isIt ? 'Solo cotto' : 'Cooked only'}
                        </AppText>
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {isIt
                            ? 'Problema solo se cotto ad alte temperature. Tollerato se crudo.'
                            : 'Only a problem if cooked at high temperatures. Tolerated when raw.'}
                        </AppText>
                      </View>
                      {criterio === 'cotto' && (
                        <Ionicons name="checkmark" size={20} color={colors.brand} />
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.footer}>
            <SurfaceButton
              label={isIt ? 'Salva configurazione' : 'Save configuration'}
              onPress={handleSave}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
    elevation: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiText: {
    fontSize: 22,
  },
  titleText: {
    fontWeight: '800',
    color: colors.ink,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionDesc: {
    marginBottom: 8,
  },
  optionsStack: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardLieve: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.yellow,
  },
  optionCardModerata: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amberBorder,
  },
  optionCardGrave: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder,
  },
  optionCardActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand200,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
