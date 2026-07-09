import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';
import { colors, radius, shadow, spacing, typography } from '../../src/theme';

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export default function OwnerStatistiche() {
  const { current } = useOwner();
  const locale = current;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    total_views: number;
    total_allergen_queries: number;
    distribution: { code: string; name: string; emoji: string; count: number }[];
    time_series: { date: string; count: number }[];
  } | null>(null);

  const load = useCallback(async () => {
    if (!locale) return;
    setLoading(true);
    try {
      const data = await api.getRestaurantAnalytics(locale.id);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (!locale) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Seleziona un locale dalla scheda Attività.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.btnText}>Vai ad Attività</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxSeries = analytics ? Math.max(...analytics.time_series.map((d) => d.count), 1) : 1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroTitle}>Statistiche</Text>
      <Text style={styles.heroSub}>{locale.name} · scansioni QR e filtri allergici</Text>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : !analytics ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Statistiche disponibili con piano Pro attivo. Passa a Pro per vedere scansioni e allergeni più cercati.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(owner)/piano')}>
            <Text style={styles.btnText}>Vedi piani</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <Text style={styles.kpiVal}>{analytics.total_views}</Text>
              <Text style={styles.kpiLabel}>Visualizzazioni menù</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={[styles.kpiVal, { color: colors.brand }]}>{analytics.total_allergen_queries}</Text>
              <Text style={styles.kpiLabel}>Filtri allergici</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Visite · ultimi 30 giorni</Text>
            <View style={styles.chart}>
              {analytics.time_series.map((point) => {
                const h = Math.max(4, Math.round((point.count / maxSeries) * 80));
                return (
                  <View key={point.date} style={styles.barCol}>
                    <View style={[styles.bar, { height: h }]} />
                    <Text style={styles.barLabel}>{dateLabel(point.date)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Allergeni più cercati</Text>
            {analytics.distribution.length === 0 ? (
              <Text style={styles.muted}>Nessun filtro applicato dai clienti.</Text>
            ) : (
              analytics.distribution.slice(0, 8).map((item) => {
                const pct = analytics.total_allergen_queries
                  ? Math.round((item.count / analytics.total_allergen_queries) * 100)
                  : 0;
                return (
                  <View key={item.code} style={styles.distRow}>
                    <Text style={styles.distName}>{item.emoji} {item.name}</Text>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBar, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.distPct}>{pct}%</Text>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.bg, gap: spacing.lg },
  heroTitle: { ...typography.h1, color: colors.ink },
  heroSub: { color: colors.textSecondary, fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
  kpiRow: { flexDirection: 'row', gap: spacing.md },
  kpi: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  kpiVal: { fontSize: 28, fontWeight: '900', color: colors.ink },
  kpiLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.card },
  cardTitle: { ...typography.h3, color: colors.ink },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100, marginTop: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '80%', backgroundColor: colors.brand, borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 7, color: colors.textMuted, marginTop: 4 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  distName: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  distBarBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  distBar: { height: '100%', backgroundColor: colors.brand, borderRadius: 3 },
  distPct: { width: 32, textAlign: 'right', fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  btn: { backgroundColor: colors.brand, borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
