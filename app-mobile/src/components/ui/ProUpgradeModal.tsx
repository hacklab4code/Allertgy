import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { SurfaceButton } from './SurfaceButton';

export type ProUpgradeFeature = 'paper_menu' | 'label_scan';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  isIt?: boolean;
  /** Contesto: menù cartaceo (default) o scansione AI etichetta prodotto. */
  feature?: ProUpgradeFeature;
}

export function ProUpgradeModal({
  visible,
  onClose,
  onUpgrade,
  isIt = true,
  feature = 'paper_menu',
}: ProUpgradeModalProps) {
  const insets = useSafeAreaInsets();
  const isLabelScan = feature === 'label_scan';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View
            style={[styles.headerGradient, { backgroundColor: '#2D124D' }]}
          >
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close-outline" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={styles.badgeRow}>
              <Ionicons name="sparkles-outline" size={20} color="#FFD700" />
              <Text style={styles.proBadgeText}>ALLERTGY PRO</Text>
            </View>

            <Text style={styles.title}>
              {isLabelScan
                ? (isIt ? 'Sblocca la scansione AI' : 'Unlock AI scanning')
                : (isIt ? 'Sblocca lo Scanner Menù AI' : 'Unlock AI Menu Scanner')}
            </Text>
            <Text style={styles.subtitle}>
              {isLabelScan
                ? (isIt
                  ? 'Quando un prodotto non è in sistema, fotografa l’etichetta e l’AI legge ingredienti e allergeni.'
                  : 'When a product isn’t in the system, photograph the label and AI reads ingredients and allergens.')
                : (isIt
                  ? 'Analizza menù cartacei, foto già scattate o link online col semaforo in tempo reale.'
                  : 'Analyze paper menus, existing photos, or online links with real-time traffic lights.')}
            </Text>
          </View>

          <View style={styles.body}>
            {(isLabelScan
              ? [
                  {
                    icon: 'scan' as const,
                    title: isIt ? 'Analisi etichetta AI' : 'AI label analysis',
                    desc: isIt
                      ? 'Inquadra gli ingredienti e ottieni subito il semaforo per il tuo profilo.'
                      : 'Frame the ingredients and get an instant traffic light for your profile.',
                  },
                  {
                    icon: 'camera' as const,
                    title: isIt ? 'Scanner Menù Cartaceo AI' : 'AI Paper Menu Scanner',
                    desc: isIt
                      ? 'Scatta una foto al menù cartaceo in qualsiasi ristorante.'
                      : 'Photograph paper menus in any restaurant.',
                  },
                  {
                    icon: 'airplane' as const,
                    title: isIt ? 'Pass Viaggio Multilingua' : 'Multi-Language Travel Pass',
                    desc: isIt
                      ? 'Presenta le tue allergie in 10 lingue ovunque nel mondo.'
                      : 'Present your allergies in 10 languages anywhere in the world.',
                  },
                ]
              : [
                  {
                    icon: 'restaurant' as const,
                    title: isIt ? 'Scanner Menù AI' : 'AI Menu Scanner',
                    desc: isIt
                      ? 'Scatta, carica una foto già fatta o incolla il link del menù online.'
                      : 'Take a photo, upload an existing one, or paste an online menu link.',
                  },
                  {
                    icon: 'document-text' as const,
                    title: isIt ? 'Estrazione Referti Medici AI' : 'AI Medical Report Extraction',
                    desc: isIt
                      ? 'Estrai automaticamente le tue allergie da test prick o esami del sangue.'
                      : 'Automatically extract allergens from prick tests or lab reports.',
                  },
                  {
                    icon: 'airplane' as const,
                    title: isIt ? 'Pass Viaggio Multilingua' : 'Multi-Language Travel Pass',
                    desc: isIt
                      ? 'Presenta le tue allergie in 10 lingue ovunque nel mondo.'
                      : 'Present your allergies in 10 languages anywhere in the world.',
                  },
                ]
            ).map((item) => (
              <View key={item.title} style={styles.featureItem}>
                <Ionicons name={item.icon} size={24} color={colors.brand} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

            <SurfaceButton
              label={isIt ? 'Passa ad AllerTgy PRO' : 'Upgrade to AllerTgy PRO'}
              onPress={() => {
                onClose();
                if (onUpgrade) onUpgrade();
              }}
              style={styles.ctaButton}
            />

            <Pressable onPress={onClose} style={styles.maybeLater}>
              <Text style={styles.maybeLaterText}>
                {isIt ? 'Più tardi' : 'Maybe later'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 9, 36, 0.72)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingRight: spacing.xl + spacing.md,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    padding: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  proBadgeText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: '#E8DDF8',
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  featureDesc: {
    fontSize: 13,
    color: '#5C5C5C',
    marginTop: 2,
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: colors.brand,
    marginTop: spacing.sm,
  },
  maybeLater: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  maybeLaterText: {
    color: '#5C5C5C',
    fontSize: 13,
    fontWeight: '600',
  },
});
