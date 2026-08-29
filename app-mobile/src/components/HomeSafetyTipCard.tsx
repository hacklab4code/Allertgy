import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './ui/AppText';
import { radius } from '../theme';

type Props = {
  isIt?: boolean;
};

const TIPS_IT = [
  {
    tag: 'Regola d’Oro al Ristorante',
    title: 'Avvisa sempre lo staff prima di ordinare',
    desc: 'Comunica la gravità della tua allergia al cameriere anche nei locali abituali: le ricette o i fornitori possono cambiare senza preavviso.',
    icon: 'shield-checkmark',
    color: '#3B82F6',
  },
  {
    tag: 'Contaminazione Crociata',
    title: 'Attenzione a fritture e taglieri',
    desc: 'Chiedi se le patatine fritte o le pietanze senza glutine condividono la stessa friggitrice o superficie di lavoro.',
    icon: 'restaurant',
    color: '#8B5CF6',
  },
  {
    tag: 'Farmaci Salvavita',
    title: 'Controlla la scadenza di EpiPen & Antistaminici',
    desc: 'Tieni sempre il piano di emergenza aggiornato nella sezione SOS e verifica che gli autoiniettori non siano esposti a fonti di calore.',
    icon: 'medical',
    color: '#EF4444',
  },
];

const TIPS_EN = [
  {
    tag: 'Golden Rule at Dining',
    title: 'Always inform staff before ordering',
    desc: 'Share your allergy severity with the waitstaff even in regular spots: ingredients or kitchen suppliers can change without notice.',
    icon: 'shield-checkmark',
    color: '#3B82F6',
  },
  {
    tag: 'Cross-Contamination',
    title: 'Watch out for shared fryers & prep boards',
    desc: 'Always verify if gluten-free or allergen-safe items share frying oil or prep stations with unsafe dishes.',
    icon: 'restaurant',
    color: '#8B5CF6',
  },
  {
    tag: 'Life-Saving Medications',
    title: 'Check EpiPen & Antihistamine expiry dates',
    desc: 'Keep your emergency contact list up to date in the SOS hub and ensure auto-injectors are stored away from extreme heat.',
    icon: 'medical',
    color: '#EF4444',
  },
];

export default function HomeSafetyTipCard({ isIt = true }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = isIt ? TIPS_IT : TIPS_EN;
  const currentTip = tips[tipIndex % tips.length];

  const handleNextTip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  return (
    <Pressable onPress={handleNextTip} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <LinearGradient
        colors={['#F0FDF4', '#EEF2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Ionicons name={currentTip.icon as any} size={13} color="#4F46E5" />
            <AppText style={styles.badgeText}>{currentTip.tag}</AppText>
          </View>

          <View style={styles.dotsRow}>
            {tips.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === (tipIndex % tips.length) && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <AppText style={styles.title}>{currentTip.title}</AppText>
        <AppText style={styles.desc}>{currentTip.desc}</AppText>

        <View style={styles.footerRow}>
          <AppText style={styles.footerHint}>
            {isIt ? 'Tocca per il prossimo consiglio' : 'Tap for next safety tip'}
          </AppText>
          <Ionicons name="swap-horizontal" size={13} color="#6366F1" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C7D2FE',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#4F46E5',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#374151',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
  },
  footerHint: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6366F1',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
