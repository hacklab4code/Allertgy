import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppText } from './ui/AppText';
import { colors, radius } from '../theme';
import { loadScanHistory } from '../services/productStorage';
import type { ScannedProduct } from '../services/barcodeScan';

type Props = {
  isIt?: boolean;
};

export default function HomeRecentScansWidget({ isIt = true }: Props) {
  const [history, setHistory] = useState<ScannedProduct[]>([]);

  useEffect(() => {
    loadScanHistory()
      .then((items) => setHistory(items.slice(0, 3)))
      .catch(() => { });
  }, []);

  const handleOpenScanner = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/scanner');
  };

  const handleOpenPantry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/dispensa');
  };

  // Se la storia è vuota, mostriamo degli elementi dimostrativi realistici
  const displayItems = history.length > 0 ? history : [
    {
      barcode: '8001234567890',
      name: 'Biscotti Integrali Avena',
      brand: 'Mulino Bianco',
      status: 'verde',
      allergensFound: [],
    } as any,
    {
      barcode: '8009876543210',
      name: 'Salsa di Soia Tradizionale',
      brand: 'Kikkoman',
      status: 'giallo',
      allergensFound: ['Tracce di frumento'],
    } as any,
    {
      barcode: '8005556667778',
      name: 'Cioccolato Fondente 85%',
      brand: 'Lindt Excellence',
      status: 'verde',
      allergensFound: [],
    } as any,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="barcode-outline" size={20} color="#23212C" />
          <AppText variant="h2" style={styles.sectionTitle}>
            {isIt ? 'Spesa Sicura & Recenti' : 'Safe Grocery & Recent'}
          </AppText>
        </View>
        <Pressable onPress={handleOpenPantry} hitSlop={8}>
          <AppText style={styles.seeAll}>
            {isIt ? 'Vedi dispensa' : 'View pantry'}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.cardContainer}>
        {displayItems.map((item, index) => {
          const isSafe = item.status === 'verde' || item.status === 'safe';
          const isWarning = item.status === 'giallo' || item.status === 'warning';
          const isDanger = item.status === 'rosso' || item.status === 'danger';

          const iconColor = isSafe ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
          const badgeBg = isSafe ? '#ECFDF5' : isWarning ? '#FFFBEB' : '#FEF2F2';
          const badgeBorder = isSafe ? '#A7F3D0' : isWarning ? '#FDE68A' : '#FECACA';
          const badgeText = isSafe
            ? (isIt ? '🟢 Idoneo' : '🟢 Safe')
            : isWarning
            ? (isIt ? '🟡 Con Tracce' : '🟡 Traces')
            : (isIt ? '🔴 Non Idoneo' : '🔴 Avoid');
          const badgeTextColor = isSafe ? '#065F46' : isWarning ? '#92400E' : '#991B1B';

          return (
            <Pressable
              key={item.barcode || index}
              onPress={handleOpenScanner}
              style={({ pressed }) => [
                styles.itemRow,
                index < displayItems.length - 1 && styles.borderBottom,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconCircle, { backgroundColor: badgeBg }]}>
                  <Ionicons
                    name={isSafe ? 'checkmark-circle' : isWarning ? 'alert-circle' : 'close-circle'}
                    size={20}
                    color={iconColor}
                  />
                </View>
                <View style={styles.itemMeta}>
                  <AppText style={styles.productName} numberOfLines={1}>
                    {item.name || (isIt ? 'Prodotto scansionato' : 'Scanned product')}
                  </AppText>
                  <AppText style={styles.productBrand} numberOfLines={1}>
                    {item.brand ? `${item.brand} · ` : ''}
                    {isIt ? 'Scansione EAN' : 'EAN Scan'}
                  </AppText>
                </View>
              </View>

              <View style={styles.itemRight}>
                <View style={[styles.statusPill, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                  <AppText style={[styles.statusPillText, { color: badgeTextColor }]}>
                    {badgeText}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6366F1',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EDE8F5',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    gap: 8,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  productBrand: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
