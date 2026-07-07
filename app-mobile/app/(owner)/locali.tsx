import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';

/** Scheda Locale: seleziona o crea il ristorante. */
export default function Locali() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.myRestaurants()
      .then((rs) => {
        setRestaurants(rs);
        if (rs.length === 1) setCurrent(rs[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    setBusy(true); setError('');
    try {
      const r = await api.createRestaurant(name.trim(), city.trim());
      const firstLocale = restaurants.length === 0;
      setRestaurants([...restaurants, r]);
      setCurrent(r);
      setName(''); setCity('');
      // Il menù digitale richiede un piano: al primo locale porta alla prova gratuita
      router.push(firstLocale ? '/(owner)/piano' : '/(owner)/menu');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#059669" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {restaurants.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>I tuoi locali</Text>
          {restaurants.map((r) => {
            const active = current?.id === r.id;
            return (
              <TouchableOpacity key={r.id}
                style={[styles.place, active && styles.placeOn]}
                onPress={() => setCurrent(r)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{r.name}</Text>
                  <Text style={styles.placeSub}>
                    {r.city ? `${r.city} · ` : ''}codice {r.public_code}
                    {r.menu_updated_at ? ' · menù pubblicato ✓' : ' · menù da pubblicare'}
                  </Text>
                </View>
                {active && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          {current && (
            <TouchableOpacity style={styles.cta} onPress={() => router.push('/(owner)/menu')}>
              <Text style={styles.ctaText}>Gestisci il menù di {current.name} →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {restaurants.length === 0 ? 'Registra il tuo locale' : 'Aggiungi un altro locale'}
        </Text>
        <Text style={styles.muted}>
          Riceverai un codice a 6 cifre: i clienti lo useranno per vedere il tuo menù
          filtrato sulle loro allergie.
        </Text>
        <TextInput style={styles.input} placeholder="Nome del locale (es. Trattoria da Mario)"
          value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Città" value={city} onChangeText={setCity} />
        <TouchableOpacity
          style={[styles.button, (!name.trim() || busy) && { opacity: 0.4 }]}
          disabled={!name.trim() || busy}
          onPress={create}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crea locale</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  error: { color: '#dc2626', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#1e293b', marginBottom: 8 },
  muted: { color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  place: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  placeOn: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  placeName: { fontWeight: '700', color: '#1e293b' },
  placeSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  check: { color: '#059669', fontWeight: '800', fontSize: 18 },
  cta: { marginTop: 6, alignItems: 'center', padding: 10 },
  ctaText: { color: '#047857', fontWeight: '700' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 13, marginBottom: 10, fontSize: 15,
  },
  button: {
    backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
