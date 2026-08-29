import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './ui/AppText';
import { radius, colors } from '../theme';

type Props = {
  isIt?: boolean;
};

export default function HomeQuickActionHub({ isIt = true }: Props) {
  const handleNav = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* 1. DUE GRANDI HERO CARDS D'AZIONE (Ristorante vs Spesa) */}
      <View style={styles.heroActionRow}>
        {/* Hero Card 1: Scanner Menù Ristorante */}
        <Pressable
          onPress={() => handleNav('/scanner')}
          style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isIt ? 'Scansiona menù ristorante' : 'Scan restaurant menu'}
        >
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Ionicons name="restaurant" size={12} color="#FFFFFF" />
                <AppText style={styles.heroTagText}>
                  {isIt ? 'Al Tavolo' : 'Venue'}
                </AppText>
              </View>
              <View style={styles.heroIconCircle}>
                <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroBody}>
              <AppText style={styles.heroTitle}>
                {isIt ? 'Menù Locale' : 'Venue Menu'}
              </AppText>
              <AppText style={styles.heroSubtitle} numberOfLines={2}>
                {isIt
                  ? 'QR o PIN a 6 cifre con semaforo istantaneo'
                  : 'QR or 6-digit PIN with live traffic lights'}
              </AppText>
            </View>

            <View style={styles.heroActionBtn}>
              <AppText style={styles.heroActionBtnText}>
                {isIt ? 'Scansiona QR' : 'Scan QR'}
              </AppText>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Hero Card 2: Scanner Barcode Spesa */}
        <Pressable
          onPress={() => handleNav('/scanner')}
          style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isIt ? 'Scansiona codice a barre spesa' : 'Scan grocery barcode'}
        >
          <LinearGradient
            colors={['#10B981', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Ionicons name="cart" size={12} color="#FFFFFF" />
                <AppText style={styles.heroTagText}>
                  {isIt ? 'Spesa' : 'Grocery'}
                </AppText>
              </View>
              <View style={styles.heroIconCircle}>
                <Ionicons name="barcode-outline" size={22} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroBody}>
              <AppText style={styles.heroTitle}>
                {isIt ? 'Scanner Spesa' : 'Barcode Scan'}
              </AppText>
              <AppText style={styles.heroSubtitle} numberOfLines={2}>
                {isIt
                  ? 'Verifica allergeni ed EAN al supermercato'
                  : 'Check allergens & ingredients at grocery'}
              </AppText>
            </View>

            <View style={styles.heroActionBtn}>
              <AppText style={styles.heroActionBtnText}>
                {isIt ? 'Scansiona EAN' : 'Scan EAN'}
              </AppText>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* 2. GRIGLIA 2x2 CARD SECONDARIE BEN SPAZIATE */}
      <View style={styles.secondaryGrid}>
        {/* Passaporto Chef */}
        <Pressable
          onPress={() => handleNav('/allergy-card')}
          style={({ pressed }) => [styles.smallCard, pressed && styles.pressed]}
        >
          <View style={[styles.smallIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="card-outline" size={20} color="#9333EA" />
          </View>
          <View style={styles.smallCardContent}>
            <AppText style={styles.smallCardTitle}>
              {isIt ? 'Chef Pass' : 'Chef Pass'}
            </AppText>
            <AppText style={styles.smallCardSub}>
              {isIt ? 'Tessera 5 lingue' : '5-Language card'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </Pressable>

        {/* Dispensa Casa */}
        <Pressable
          onPress={() => handleNav('/dispensa')}
          style={({ pressed }) => [styles.smallCard, pressed && styles.pressed]}
        >
          <View style={[styles.smallIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="cube-outline" size={20} color="#0284C7" />
          </View>
          <View style={styles.smallCardContent}>
            <AppText style={styles.smallCardTitle}>
              {isIt ? 'Dispensa Casa' : 'Safe Pantry'}
            </AppText>
            <AppText style={styles.smallCardSub}>
              {isIt ? 'Scorte verificate' : 'Verified pantry'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </Pressable>

        {/* Lista Spesa */}
        <Pressable
          onPress={() => handleNav('/lista-spesa')}
          style={({ pressed }) => [styles.smallCard, pressed && styles.pressed]}
        >
          <View style={[styles.smallIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cart-outline" size={20} color="#16A34A" />
          </View>
          <View style={styles.smallCardContent}>
            <AppText style={styles.smallCardTitle}>
              {isIt ? 'Lista Spesa' : 'Grocery List'}
            </AppText>
            <AppText style={styles.smallCardSub}>
              {isIt ? 'Cibi compatibili' : 'Safe items'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </Pressable>

        {/* Diario Reazioni */}
        <Pressable
          onPress={() => handleNav('/diario-reazioni')}
          style={({ pressed }) => [styles.smallCard, pressed && styles.pressed]}
        >
          <View style={[styles.smallIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="book-outline" size={20} color="#D97706" />
          </View>
          <View style={styles.smallCardContent}>
            <AppText style={styles.smallCardTitle}>
              {isIt ? 'Diario Reazioni' : 'Reaction Log'}
            </AppText>
            <AppText style={styles.smallCardSub}>
              {isIt ? 'Traccia sintomi' : 'Track symptoms'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </Pressable>
      </View>

      {/* 3. LIVE RECALLS BANNER (Richiami Ministeriali Cibo) */}
      <Pressable
        onPress={() => handleNav('/recalls')}
        style={({ pressed }) => [styles.recallsBanner, pressed && styles.pressed]}
      >
        <View style={styles.recallsLeft}>
          <View style={styles.recallIconWrapper}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
          </View>
          <View style={styles.recallsTextWrapper}>
            <AppText style={styles.recallsTitle}>
              {isIt ? 'Allerte & Richiami Alimentari' : 'Food Recalls & Alerts'}
            </AppText>
            <AppText style={styles.recallsSub}>
              {isIt ? 'Banca dati Ministero della Salute & RASFF' : 'Ministry of Health & RASFF live alerts'}
            </AppText>
          </View>
        </View>
        <View style={styles.recallsBadge}>
          <AppText style={styles.recallsBadgeText}>{isIt ? 'Verifica' : 'Check'}</AppText>
          <Ionicons name="chevron-forward" size={12} color="#DC2626" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 10,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroCardGradient: {
    padding: 13,
    minHeight: 146,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  heroTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    marginVertical: 6,
  },
  heroTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 11,
    lineHeight: 14.5,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  smallCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8F5',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  smallIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCardContent: {
    flex: 1,
  },
  smallCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  smallCardSub: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  recallsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  recallsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recallIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recallsTextWrapper: {
    flex: 1,
  },
  recallsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  recallsSub: {
    fontSize: 10,
    color: '#B91C1C',
    fontWeight: '500',
  },
  recallsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  recallsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
