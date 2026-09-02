import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { MatchChip, StatoVerdictPill } from './Traffic';
import { colors, radius, spacing } from '../../theme';
import { Piatto } from '../../types';

interface PaperMenuResultModalProps {
  visible: boolean;
  onClose: () => void;
  dishes: Piatto[];
  userAllergens: string[];
  userExcludedIngredients?: string[];
  isIt?: boolean;
}

export function PaperMenuResultModal({
  visible,
  onClose,
  dishes,
  userAllergens,
  userExcludedIngredients = [],
  isIt = true,
}: PaperMenuResultModalProps) {
  const [filter, setFilter] = useState<'all' | 'verde' | 'giallo' | 'rosso'>('all');

  const evaluatedDishes = useMemo(() => {
    return dishes.map((dish) => {
      const matchContenuti = (dish.allergeni_contenuti || []).filter((a) =>
        userAllergens.includes(a.toLowerCase())
      );
      const matchTracce = (dish.allergeni_tracce || []).filter((a) =>
        userAllergens.includes(a.toLowerCase())
      );

      let status: 'verde' | 'giallo' | 'rosso' = 'verde';
      let label = isIt ? 'Idoneo' : 'Eligible';

      if (matchContenuti.length > 0) {
        status = 'rosso';
        label = isIt ? 'Non Idoneo' : 'Not Eligible';
      } else if (matchTracce.length > 0) {
        status = 'giallo';
        label = isIt ? 'Attenzione Tracce' : 'Contains Traces';
      }

      return {
        ...dish,
        status,
        label,
        matchContenuti,
        matchTracce,
      };
    });
  }, [dishes, userAllergens, isIt]);

  const filteredDishes = useMemo(() => {
    if (filter === 'all') return evaluatedDishes;
    return evaluatedDishes.filter((d) => d.status === filter);
  }, [evaluatedDishes, filter]);

  const stats = useMemo(() => {
    const verde = evaluatedDishes.filter((d) => d.status === 'verde').length;
    const giallo = evaluatedDishes.filter((d) => d.status === 'giallo').length;
    const rosso = evaluatedDishes.filter((d) => d.status === 'rosso').length;
    return { verde, giallo, rosso, total: evaluatedDishes.length };
  }, [evaluatedDishes]);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sparkles-outline" size={24} color={colors.brand200} />
              <AppText variant="h2" style={styles.headerTitle}>
                {isIt ? 'Menù Scansionato AI' : 'AI Scanned Menu'}
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-outline" size={24} color={colors.onSurfaceMuted} />
            </TouchableOpacity>
          </View>

          {/* Subheader stats */}
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {isIt
                ? `Estratti ${stats.total} piatti con semaforo`
                : `Extracted ${stats.total} dishes with traffic lights`}
            </Text>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                onPress={() => setFilter(filter === 'verde' ? 'all' : 'verde')}
                style={[styles.statBadge, styles.badgeVerde, filter === 'verde' && styles.activeFilter]}
              >
                <Text style={styles.statBadgeText}>🟢 {stats.verde}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilter(filter === 'giallo' ? 'all' : 'giallo')}
                style={[styles.statBadge, styles.badgeGiallo, filter === 'giallo' && styles.activeFilter]}
              >
                <Text style={styles.statBadgeText}>🟡 {stats.giallo}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilter(filter === 'rosso' ? 'all' : 'rosso')}
                style={[styles.statBadge, styles.badgeRosso, filter === 'rosso' && styles.activeFilter]}
              >
                <Text style={styles.statBadgeText}>🔴 {stats.rosso}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dishes List */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filteredDishes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="restaurant-outline" size={48} color={colors.onSurfaceMuted} />
                <Text style={styles.emptyText}>
                  {isIt ? 'Nessun piatto trovato in questa categoria.' : 'No dishes found in this category.'}
                </Text>
              </View>
            ) : (
              filteredDishes.map((dish, idx) => (
                <GlassCard key={dish.id || idx} style={styles.dishCard}>
                  <View style={styles.dishHeader}>
                    <Text style={styles.dishName}>{dish.nome_piatto}</Text>
                    <StatoVerdictPill stato={dish.status} label={dish.label} />
                  </View>

                  {Boolean(dish.descrizione) && (
                    <Text style={styles.dishDesc}>{dish.descrizione}</Text>
                  )}

                  {dish.prezzo_cents != null && (
                    <Text style={styles.dishPrice}>€{(dish.prezzo_cents / 100).toFixed(2)}</Text>
                  )}

                  {/* Why Chips */}
                  <View style={styles.chipsRow}>
                    {dish.matchContenuti.map((a) => (
                      <MatchChip key={`cont-${a}`} label={a} severity="red" />
                    ))}
                    {dish.matchTracce.map((a) => (
                      <MatchChip key={`trac-${a}`} label={a} severity="yellow" />
                    ))}
                    {dish.status === 'verde' && (
                      <Text style={styles.safeNote}>
                        ✓ {isIt ? 'Nessun allergene dichiarato del tuo profilo' : 'No declared profile allergens'}
                      </Text>
                    )}
                  </View>
                </GlassCard>
              ))
            )}
          </ScrollView>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              {isIt
                ? '⚠️ Verificare sempre con lo staff del ristorante prima di ordinare.'
                : '⚠️ Always verify with restaurant staff before ordering.'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 9, 36, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.brand,
    fontWeight: '800',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  statsText: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  activeFilter: {
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  badgeVerde: { backgroundColor: '#D1FAE5' },
  badgeGiallo: { backgroundColor: '#FEF3C7' },
  badgeRosso: { backgroundColor: '#FEE2E2' },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.onSurfaceMuted,
    fontSize: 14,
  },
  dishCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
    flex: 1,
  },
  dishDesc: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  safeNote: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
});
