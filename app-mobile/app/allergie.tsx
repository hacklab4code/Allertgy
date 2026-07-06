import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import type { Allergen } from '../src/types';

export default function Allergie() {
  const [all, setAll] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(useSession.getState().allergie),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setAllergie, setProfileCompleted } = useSession();

  useEffect(() => {
    api.allergens().then(setAll).catch((e) => setError(e.message));
  }, []);

  const toggle = (code: string) => {
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelected(next);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const codes = [...selected];
      await api.saveAllergens(codes); // salvataggio nel database remoto
      setAllergie(codes);
      setProfileCompleted(true);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const food = all.filter((a) => !a.is_diet);
  const diets = all.filter((a) => a.is_diet);

  const Chip = ({ a }: { a: Allergen }) => {
    const on = selected.has(a.code);
    const isDiet = a.is_diet;
    
    let btnStyle: StyleProp<ViewStyle> = styles.chip;
    let textStyle: StyleProp<TextStyle> = styles.chipText;
    
    if (on) {
      if (isDiet) {
        btnStyle = [styles.chip, styles.chipOnDiet];
        textStyle = [styles.chipText, styles.chipTextOnDiet];
      } else {
        btnStyle = [styles.chip, styles.chipOnAllergy];
        textStyle = [styles.chipText, styles.chipTextOnAllergy];
      }
    }

    return (
      <TouchableOpacity
        style={btnStyle}
        onPress={() => toggle(a.code)}
      >
        <Text style={textStyle}>
          {a.emoji} {a.name_it}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Seleziona le tue allergie e intolleranze</Text>
        <Text style={styles.subtitle}>
          Puoi selezionare i 14 allergeni previsti dal Reg. UE 1169/2011, preferenze alimentari,
          oppure continuare senza selezioni.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {all.length === 0 && !error ? <ActivityIndicator style={{ marginTop: 40 }} /> : null}

        <View style={styles.grid}>{food.map((a) => <Chip key={a.code} a={a} />)}</View>

        {diets.length > 0 && (
          <>
            <Text style={styles.section}>Preferenze alimentari</Text>
            <View style={styles.grid}>{diets.map((a) => <Chip key={a.code} a={a} />)}</View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.save, (busy || (all.length === 0 && !error)) && { opacity: 0.4 }]}
        disabled={busy || (all.length === 0 && !error)}
        onPress={save}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveText}>
              {selected.size === 0 ? 'Continua senza allergie' : `Salva profilo (${selected.size})`}
            </Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 21, fontWeight: '900', color: '#0f172a', letterSpacing: -0.4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 20 },
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 24, marginBottom: 10, letterSpacing: -0.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#ffffff',
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  chipOnAllergy: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  chipTextOnAllergy: { color: '#e11d48', fontWeight: '800' },
  chipOnDiet: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  chipTextOnDiet: { color: '#16a34a', fontWeight: '800' },
  chipText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  save: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: '#0f172a', borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  saveText: { color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  error: { color: '#dc2626', marginBottom: 8 },
});
