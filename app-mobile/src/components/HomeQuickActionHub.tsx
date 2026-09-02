import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './ui/AppText';
import { font } from '../theme';
import { useSession } from '../store/session';
import { useIsDarkMode } from '../hooks/useAppTheme';
import { OFFICIAL_FOOD_RECALLS, checkUserRecalls } from '../services/recalls';

type Props = {
  isIt?: boolean;
};

/**
 * 1. Griglia con le 4 Azioni Rapide armonizzate su Cosmic Dark (#23212C) + Vanilla (#F1FEC8) e Outline Icons
 */
export const HomeQuickActions = React.memo(function HomeQuickActions({ isIt = true }: Props) {
  const isDark = useIsDarkMode();
  const handleNav = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const actions = [
    {
      id: 'diario',
      title: isIt ? 'Diario' : 'Diary',
      sub: isIt ? 'Sintomi' : 'Symptoms',
      route: '/diario-reazioni',
      icon: 'book-outline' as const,
    },
    {
      id: 'passaporto',
      title: isIt ? 'Passaporto' : 'Passport',
      sub: isIt ? 'Chef Pass' : 'Chef Pass',
      route: '/allergy-card',
      icon: 'card-outline' as const,
    },
    {
      id: 'frasario',
      title: isIt ? 'Frasario' : 'Phrasebook',
      sub: isIt ? 'Offline' : 'Offline',
      route: '/travel-hub',
      icon: 'chatbubble-ellipses-outline' as const,
    },
    {
      id: 'spesa',
      title: isIt ? 'Lista Spesa' : 'Shopping',
      sub: isIt ? 'Semaforo' : 'Safe List',
      route: '/lista-spesa',
      icon: 'cart-outline' as const,
    },
  ];

  const renderActionCard = (act: (typeof actions)[0]) => (
    <Pressable
      key={act.id}
      onPress={() => handleNav(act.route)}
      style={({ pressed }) => [
        styles.actionCard,
        isDark && styles.actionCardDark,
        pressed && styles.actionCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={act.title}
    >
      <View style={styles.cardInner}>
        <View style={[styles.iconWrapper, isDark && styles.iconWrapperDark]}>
          <Ionicons name={act.icon} size={22} color="#F1FEC8" />
        </View>
        <View style={styles.cardTextBox}>
          <AppText
            style={[styles.actionLabel, isDark && styles.actionLabelDark]}
            numberOfLines={1}
          >
            {act.title}
          </AppText>
          <AppText
            style={[styles.actionSubLabel, isDark && styles.actionSubLabelDark]}
            numberOfLines={1}
          >
            {act.sub}
          </AppText>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.quickActionsContainer}>
      {/* Intestazione Sezione */}
      <View style={styles.headerRow}>
        <AppText style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          {isIt ? 'Azioni Rapide' : 'Quick Actions'}
        </AppText>
      </View>

      {/* Riga singola delle 4 Azioni Rapide con badge unificati Cosmic + Vanilla */}
      <View style={styles.singleRow}>
        {actions.map(renderActionCard)}
      </View>
    </View>
  );
});

/**
 * 2. Card Allerte & Richiami Alimentari Ministero della Salute & RASFF (Design Rosso / Cosmic)
 */
export const HomeFoodRecallsCard = React.memo(function HomeFoodRecallsCard({ isIt = true }: Props) {
  const isDark = useIsDarkMode();
  const allergie = useSession((s) => s.allergie);

  // Verifica se ci sono richiami urgenti corrispondenti agli allergeni dell'utente
  const urgentCount = useMemo(() => {
    if (!allergie || allergie.length === 0) return 0;
    const matches = checkUserRecalls(OFFICIAL_FOOD_RECALLS, allergie);
    return matches.filter((m) => m.matchedAllergen).length;
  }, [allergie]);

  const handleNav = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const gradientColors: [string, string, ...string[]] = isDark
    ? urgentCount > 0
      ? ['rgba(225, 29, 72, 0.35)', 'rgba(159, 18, 57, 0.45)']
      : ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.05)']
    : urgentCount > 0
      ? ['#FFF1F2', '#FFE4E6', '#FEE2E2']
      : ['#FFF5F5', '#FFEBEF', '#FEDFE7'];

  return (
    <View style={styles.recallCardContainer}>
      <Pressable
        onPress={() => handleNav('/recalls')}
        style={({ pressed }) => [
          styles.cardWrapper,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isIt
            ? `Allerte e Richiami Alimentari${urgentCount > 0 ? `, ${urgentCount} nuovi richiami rilevati` : ''}`
            : `Food Recalls and Alerts${urgentCount > 0 ? `, ${urgentCount} new recalls found` : ''}`
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.alertCardGradient,
            isDark && styles.alertCardGradientDark,
            urgentCount > 0 && styles.alertCardUrgentBorder,
          ]}
        >
          {/* Icona Allerta Outline */}
          <View style={[styles.alertIconWrapper, isDark && styles.alertIconWrapperDark]}>
            <Ionicons name="warning-outline" size={22} color={isDark ? '#FDA4AF' : '#E11D48'} />
          </View>

          {/* Testi Allerta & Richiami */}
          <View style={styles.alertTextBox}>
            <View style={styles.alertTitleRow}>
              <AppText style={[styles.alertTitle, isDark && styles.alertTitleDark]} numberOfLines={1}>
                {isIt ? 'Allerte & Richiami Cibo' : 'Food Recalls & Alerts'}
              </AppText>
              {urgentCount > 0 && (
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.alertCountBadge}
                >
                  <AppText style={styles.alertCountBadgeText}>
                    {urgentCount}
                  </AppText>
                </LinearGradient>
              )}
            </View>
            <AppText style={[styles.alertSubtitle, isDark && styles.alertSubtitleDark]} numberOfLines={1}>
              {urgentCount > 0
                ? (isIt
                  ? `${urgentCount} ${urgentCount === 1 ? 'allerta' : 'allerte'} sui tuoi allergeni!`
                  : `${urgentCount} ${urgentCount === 1 ? 'alert' : 'alerts'} for your allergens!`)
                : (isIt ? 'Nessun richiamo attivo per i tuoi cibi' : 'No active alerts for your foods')}
            </AppText>
          </View>

          {/* Freccia di Apertura */}
          <View style={[styles.chevronButton, isDark && styles.chevronButtonDark]}>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#FDA4AF' : '#E11D48'} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
});

/**
 * Hub completo Azioni Rapide + Richiami Cibo
 */
export default function HomeQuickActionHub({ isIt = true }: Props) {
  return (
    <View style={styles.container}>
      <HomeQuickActions isIt={isIt} />
      <HomeFoodRecallsCard isIt={isIt} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 12,
  },
  quickActionsContainer: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 18,
    gap: 10,
  },
  recallCardContainer: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#23212C',
    fontFamily: font.bold,
    letterSpacing: -0.3,
  },
  singleRow: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'stretch',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
  cardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#23212C',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
    gap: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#23212C',
    fontFamily: font.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  actionSubLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },

  /* Action Card Styling - Red Tinted Premium Design */
  cardWrapper: {
    borderRadius: 22,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  alertCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  alertCardUrgentBorder: {
    borderColor: '#FDA4AF',
    shadowColor: '#DC2626',
    shadowOpacity: 0.16,
  },
  alertIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextBox: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#23212C',
    fontFamily: font.bold,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  alertCountBadge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  alertCountBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },
  alertSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  /* Dark Mode Modifiers */
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  actionCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowOpacity: 0.15,
  },
  iconWrapperDark: {
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    borderColor: 'rgba(241, 254, 200, 0.35)',
  },
  actionLabelDark: {
    color: '#FFFFFF',
  },
  actionSubLabelDark: {
    color: '#94A3B8',
  },
  alertCardGradientDark: {
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  alertIconWrapperDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    borderColor: 'rgba(253, 164, 175, 0.40)',
  },
  alertTitleDark: {
    color: '#FFFFFF',
  },
  alertSubtitleDark: {
    color: '#CBD5E1',
  },
  chevronButtonDark: {
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    borderColor: 'rgba(253, 164, 175, 0.35)',
  },
});
