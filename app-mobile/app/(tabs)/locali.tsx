import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { api } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import { calcolaSemaforo } from '../../src/engine/semaforo';
import type { Menu } from '../../src/types';

type SafetyStatus = 'verde' | 'giallo' | 'rosso' | 'grigio';

export default function Locali() {
  const { recents, favorites, toggleFavorite, isFavorite, allergie } = useSession();
  const [restaurants, setRestaurants] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);

  // Carica i locali disponibili
  useEffect(() => {
    setLoading(true);
    api.listRestaurants()
      .then(setRestaurants)
      .catch((e) => console.log('Errore di rete locali:', e))
      .finally(() => setLoading(false));
  }, []);

  // Calcola la compatibilità di ciascun locale con le allergie dell'utente
  const restaurantsWithSafety = useMemo(() => {
    return restaurants.map((r) => {
      const valutati = r.piatti.map((p) => calcolaSemaforo(allergie, p));
      const red = valutati.filter(e => e.stato === 'rosso').length;
      const yellow = valutati.filter(e => e.stato === 'giallo').length;
      const green = valutati.filter(e => e.stato === 'verde').length;

      let status: SafetyStatus = 'verde';
      if (r.piatti.length === 0) status = 'grigio';
      else if (red > 0 && green === 0) status = 'rosso';
      else if (red > 0 || yellow > 0) status = 'giallo';

      return {
        ...r,
        green,
        red,
        status,
        label: status === 'verde' ? 'SICURO 🟢' : status === 'giallo' ? 'ATTENZIONE 🟡' : status === 'rosso' ? 'A RISCHIO 🔴' : 'VUOTO ⚪'
      };
    });
  }, [restaurants, allergie]);

  const Row = ({ code, name, safetyLabel }: { code: string; name: string; safetyLabel?: string }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={() => router.push(`/menu/${code}`)}>
        <View>
          <Text style={styles.rowName}>🍽 {name}</Text>
          {safetyLabel && <Text style={styles.rowSafety}>{safetyLabel}</Text>}
        </View>
        <Text style={styles.rowCode}>#{code}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleFavorite(code, name)} style={styles.star}>
        <Text style={{ fontSize: 20 }}>{isFavorite(code) ? '⭐️' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  );

  const recentsOnly = recents.filter((r) => !isFavorite(r.code));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Ristoranti Adiacenti con calcolo Semaforo locale */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Locali Consigliati nelle Vicinanze</Text>
        {loading ? (
          <ActivityIndicator color="#059669" style={{ marginVertical: 10 }} />
        ) : restaurantsWithSafety.length === 0 ? (
          <Text style={styles.muted}>Nessun locale nelle vicinanze trovato.</Text>
        ) : (
          restaurantsWithSafety.map((r) => (
            <Row 
              key={r.restaurant_id} 
              code={r.public_code}
              name={r.nome_ristorante} 
              safetyLabel={`${r.label} (${r.green} piatti sicuri • ${r.red} non idonei)`}
            />
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⭐️ Preferiti</Text>
        {favorites.length === 0 ? (
          <Text style={styles.muted}>
            Nessun preferito. Tocca la stellina accanto a un locale per salvarlo qui.
          </Text>
        ) : favorites.map((f) => <Row key={f.code} code={f.code} name={f.name} />)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕐 Visitati di recente</Text>
        {recentsOnly.length === 0 ? (
          <Text style={styles.muted}>
            Ancora nessuna visita. Scansiona un QR o inserisci un codice dalla scheda Cerca.
          </Text>
        ) : recentsOnly.map((r) => <Row key={r.code} code={r.code} name={r.name} />)}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#1e293b', marginBottom: 8 },
  muted: { color: '#64748b', fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    paddingVertical: 10,
  },
  rowMain: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: { color: '#1e293b', fontWeight: '700', fontSize: 14 },
  rowSafety: { color: '#64748b', fontSize: 11, marginTop: 2 },
  rowCode: { color: '#94a3b8', fontWeight: '500' },
  star: { paddingLeft: 12, paddingVertical: 8 },
});
