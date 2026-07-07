import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../src/api/client';
import { calcolaSemaforo } from '../../src/engine/semaforo';
import { useSession } from '../../src/store/session';
import { colors, radius, semaforoColors, shadow, spacing, typography } from '../../src/theme';
import type { Menu } from '../../src/types';

type SafetyStatus = 'verde' | 'giallo' | 'rosso' | 'grigio';

const STATUS_LABEL: Record<SafetyStatus, string> = {
  verde: 'Sicuro',
  giallo: 'Attenzione',
  rosso: 'A rischio',
  grigio: 'Menù vuoto',
};

interface CardData {
  code: string;
  name: string;
  city?: string | null;
  status?: SafetyStatus;
  green?: number;
  red?: number;
}

export default function Locali() {
  const { recents, favorites, toggleFavorite, isFavorite, allergie } = useSession();
  const [restaurants, setRestaurants] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.listRestaurants()
      .then(setRestaurants)
      .catch((e) => console.log('Errore di rete locali:', e))
      .finally(() => setLoading(false));
  }, []);

  const nearby = useMemo<CardData[]>(() => {
    return restaurants.map((r) => {
      const valutati = r.piatti.map((p) => calcolaSemaforo(allergie, p));
      const red = valutati.filter((e) => e.stato === 'rosso').length;
      const yellow = valutati.filter((e) => e.stato === 'giallo').length;
      const green = valutati.filter((e) => e.stato === 'verde').length;
      let status: SafetyStatus = 'verde';
      if (r.piatti.length === 0) status = 'grigio';
      else if (red > 0 && green === 0) status = 'rosso';
      else if (red > 0 || yellow > 0) status = 'giallo';
      return { code: r.public_code, name: r.nome_ristorante, city: r.citta, status, green, red };
    });
  }, [restaurants, allergie]);

  const Card = ({ item }: { item: CardData }) => {
    const sem = semaforoColors(item.status ?? 'grigio');
    const fav = isFavorite(item.code);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/menu/${item.code}`)} activeOpacity={0.85}>
        <View style={[styles.dot, { backgroundColor: sem.solid }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {item.city ? `${item.city} · ` : ''}#{item.code}
          </Text>
          {item.status && (
            <View style={styles.cardBadges}>
              <View style={[styles.badge, { backgroundColor: sem.bg, borderColor: sem.border }]}>
                <Text style={[styles.badgeText, { color: sem.text }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
              {item.status !== 'grigio' && (
                <Text style={styles.cardCounts}>
                  🟢 {item.green} · 🔴 {item.red}
                </Text>
              )}
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.code, item.name)}
          style={styles.star}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 22 }}>{fav ? '⭐️' : '☆'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{icon}  {title}</Text>
      {children}
    </View>
  );

  const recentsOnly = recents.filter((r) => !isFavorite(r.code));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section icon="📍" title="Consigliati vicino a te">
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.md }} />
        ) : nearby.length === 0 ? (
          <Text style={styles.muted}>Nessun locale trovato al momento.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {nearby.map((item) => <Card key={item.code} item={item} />)}
          </View>
        )}
      </Section>

      <Section icon="⭐️" title="Preferiti">
        {favorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Tocca la stellina su un locale per ritrovarlo qui e ricevere una notifica quando aggiorna il menù.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {favorites.map((f) => <Card key={f.code} item={{ code: f.code, name: f.name }} />)}
          </View>
        )}
      </Section>

      <Section icon="🕐" title="Visitati di recente">
        {recentsOnly.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Ancora nessuna visita. Scansiona un QR o inserisci un codice dalla scheda Cerca.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {recentsOnly.map((r) => <Card key={r.code} item={{ code: r.code, name: r.name }} />)}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.xxl, backgroundColor: colors.bg },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.ink },
  muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cardName: { ...typography.h3, color: colors.ink },
  cardMeta: { color: colors.textMuted, fontSize: 12.5, marginTop: 1 },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  badge: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 3 },
  badgeText: { fontSize: 11.5, fontWeight: '800' },
  cardCounts: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  star: { paddingLeft: spacing.sm },

  emptyBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', padding: spacing.lg,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
