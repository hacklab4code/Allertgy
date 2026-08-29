import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import {
  AppText,
  CollapseSection,
  GlassCard,
  GlassScreenScroll,
  MetricTile,
  SurfaceButton,
  Screen,
} from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { colors, radius, spacing } from '../../src/theme';

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export default function OwnerStatistiche() {
  const { current } = useOwner();
  const locale = current;
  const [loading, setLoading] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [allergensExpanded, setAllergensExpanded] = useState(false);
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
      <Screen edges={false}>
        <View style={styles.empty}>
          <AppText variant="eyebrow">Statistiche</AppText>
          <AppText variant="h1" style={styles.emptyTitle}>Prima scegli un locale</AppText>
          <AppText variant="body" color={colors.onSurfaceMuted} style={styles.emptyText}>
            Seleziona l’attività di cui vuoi leggere andamento e preferenze.
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </View>
      </Screen>
    );
  }

  const maxSeries = analytics ? Math.max(...analytics.time_series.map((d) => d.count), 1) : 1;
  const bestDay = analytics?.time_series.reduce(
    (best, point) => (point.count > best.count ? point : best),
    analytics.time_series[0] ?? { date: '', count: 0 },
  );

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Statistiche"
        subtitle={`${locale.name} · QR e filtri allergici`}
      />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : !analytics ? (
        <GlassCard style={{ borderLeftWidth: 3, borderLeftColor: colors.brand }}>
          <AppText variant="eyebrow" color={colors.brandDark}>Piano Pro</AppText>
          <AppText variant="h2">I numeri che fanno crescere il menù</AppText>
          <AppText variant="body" color={colors.onSurfaceMuted}>
              Statistiche disponibili con piano Pro attivo. Passa a Pro per vedere scansioni e allergeni più cercati.
          </AppText>
          <SurfaceButton label="Scopri i piani" onPress={() => router.push('/(owner)/piano')} />
        </GlassCard>
      ) : (
        <>
          <View style={styles.sectionHead}>
            <View>
              <AppText variant="eyebrow">Panoramica</AppText>
              <AppText variant="h2">In breve</AppText>
            </View>
            <AppText variant="caption" color={colors.onSurfaceMuted}>Ultimi 30 giorni</AppText>
          </View>

          <View style={styles.kpiRow}>
            <MetricTile
              style={styles.kpi}
              value={analytics.total_views}
              label="Visualizzazioni menù"
              detail="totali"
              accent={colors.onSurface}
            />
            <MetricTile
              style={styles.kpi}
              value={analytics.total_allergen_queries}
              label="Filtri allergici"
              detail="ricerche"
              tint="brand"
              accent={colors.brandDark}
            />
          </View>

          <CollapseSection
            icon="bar-chart"
            title="Andamento visite"
            preview={bestDay?.count ? `Picco: ${bestDay.count} visite` : 'Ultimi 30 giorni'}
            expanded={chartExpanded}
            onToggle={() => setChartExpanded((v) => !v)}
          >
          <View style={styles.panelBody}>
            <View style={styles.chartHead}>
              <View>
                <AppText variant="eyebrow">Volume giornaliero</AppText>
                <AppText variant="title">Visite al menù</AppText>
              </View>
              <AppText variant="metric" color={colors.brandDark}>{maxSeries}</AppText>
            </View>
            <View style={styles.chart}>
              {analytics.time_series.map((point, index) => {
                const h = Math.max(4, Math.round((point.count / maxSeries) * 80));
                const showLabel = index === 0
                  || index === analytics.time_series.length - 1
                  || index % 7 === 0;
                return (
                  <View key={point.date} style={styles.barCol}>
                    <View style={[styles.bar, { height: h }]} />
                    <AppText variant="caption" style={styles.barLabel}>
                      {showLabel ? dateLabel(point.date) : ''}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
          </CollapseSection>

          <CollapseSection
            icon="nutrition"
            title="Allergeni più cercati"
            preview={`${analytics.distribution.length} allergeni`}
            expanded={allergensExpanded}
            onToggle={() => setAllergensExpanded((v) => !v)}
          >
          <View style={styles.panelBody}>
            {analytics.distribution.length === 0 ? (
              <AppText variant="body" color={colors.onSurfaceMuted}>
                Nessun filtro applicato dai clienti.
              </AppText>
            ) : (
              analytics.distribution.slice(0, 8).map((item, index) => {
                const pct = analytics.total_allergen_queries
                  ? Math.round((item.count / analytics.total_allergen_queries) * 100)
                  : 0;
                return (
                  <View key={item.code} style={styles.distRow}>
                    <AppText variant="eyebrow" style={styles.distRank}>
                      {String(index + 1).padStart(2, '0')}
                    </AppText>
                    <View style={styles.distBody}>
                      <View style={styles.distMeta}>
                        <AppText variant="bodyBold" numberOfLines={1}>{item.name}</AppText>
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {item.count} ricerche
                        </AppText>
                      </View>
                      <View style={styles.distBarBg}>
                        <View style={[styles.distBar, { width: `${Math.max(4, pct)}%` }]} />
                      </View>
                    </View>
                    <AppText variant="bodyBold" color={colors.brandDark} style={styles.distPct}>
                      {pct}%
                    </AppText>
                  </View>
                );
              })
            )}
          </View>
          </CollapseSection>
        </>
      )}
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  pageHead: { gap: spacing.xs, paddingBottom: spacing.sm },
  loader: { marginVertical: spacing.xl },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { textAlign: 'center' },
  emptyText: { textAlign: 'center', maxWidth: 300 },
  upgradeCard: { gap: spacing.md, paddingVertical: spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 2,
  },
  kpiRow: { flexDirection: 'row', gap: spacing.md },
  kpi: { flex: 1 },
  panelBody: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
  chartHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 112,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTertiary,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '74%', backgroundColor: colors.brand, borderRadius: radius.pill, minHeight: 4 },
  barLabel: { fontSize: 8, lineHeight: 12, minHeight: 14, marginTop: 4 },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  distRank: { width: 22 },
  distBody: { flex: 1, gap: spacing.sm },
  distMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  distBarBg: {
    height: 7,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  distBar: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill },
  distPct: { width: 38, textAlign: 'right' },
});
