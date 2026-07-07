import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';
import type { Allergen, PiattoIn } from '../../src/types';

const CATEGORIE = ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Pizza', 'Dolci', 'Bevande'];

/** Scheda Menù: crea/modifica i piatti con categorie e allergeni, poi pubblica. */
export default function MenuEditor() {
  const { current, piatti, setPiatti, setPublished } = useOwner();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [legalAck, setLegalAck] = useState(false);

  useEffect(() => {
    api.allergens().then(setAllergens).catch((e) => setError(e.message));
  }, []);

  // carica il menù già pubblicato come base di partenza
  useEffect(() => {
    if (!current || loaded) return;
    api.menu(current.public_code)
      .then((m) => {
        if (piatti.length === 0) {
          setPiatti(m.piatti.map(({ id, ...p }) => p));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedBig}>Prima seleziona o crea il tuo locale.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.buttonText}>Vai a "Locale"</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = current.subscription_status ?? 'free';
  const plan = current.business_plan ?? 'free';
  const hasMenuAccess = status === 'comped'
    || ((plan === 'pro' || plan === 'premium') && (status === 'trialing' || status === 'active'));

  if (!hasMenuAccess) {
    return (
      <ScrollView contentContainerStyle={styles.lockWrap}>
        <View style={styles.lockCard}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Il menù digitale è nel piano Pro</Text>
          <Text style={styles.lockText}>
            Con il piano Pro crei il menù con allergeni e tracce per ogni piatto, generi il QR per i
            tavoli e stampi il registro allergeni. Provalo <Text style={{ fontWeight: '800' }}>14 giorni gratis</Text>,
            senza carta.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(owner)/piano')}>
            <Text style={styles.buttonText}>Attiva la prova gratuita</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const update = (i: number, patch: Partial<PiattoIn>) =>
    setPiatti(piatti.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  /** cicla lo stato dell'allergene: assente → contiene → tracce → assente */
  const cycle = (i: number, code: string) => {
    const p = piatti[i];
    if (p.allergeni_contenuti.includes(code)) {
      update(i, {
        allergeni_contenuti: p.allergeni_contenuti.filter((c) => c !== code),
        allergeni_tracce: [...p.allergeni_tracce, code],
      });
    } else if (p.allergeni_tracce.includes(code)) {
      update(i, { allergeni_tracce: p.allergeni_tracce.filter((c) => c !== code) });
    } else {
      update(i, { allergeni_contenuti: [...p.allergeni_contenuti, code] });
    }
  };

  const addDish = (categoria?: string) =>
    setPiatti([...piatti, {
      nome_piatto: '', categoria: categoria ?? null,
      allergeni_contenuti: [], allergeni_tracce: [],
    }]);

  const removeDish = (i: number) =>
    Alert.alert('Elimina piatto', `Eliminare "${piatti[i].nome_piatto || 'piatto senza nome'}"?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setPiatti(piatti.filter((_, j) => j !== i)) },
    ]);

  const publish = async () => {
    const validi = piatti.filter((p) => p.nome_piatto.trim());
    if (validi.length === 0) { setError('Aggiungi almeno un piatto con un nome.'); return; }
    if (!legalAck) { setError('Conferma prima la responsabilità sui dati allergeni del menù.'); return; }
    setBusy(true); setError('');
    try {
      await api.saveMenu(current.id, validi);
      await api.approve(current.id, legalAck);
      setPublished(true);
      router.push('/(owner)/qr');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>
          {current.name} <Text style={styles.headerCode}>#{current.public_code}</Text>
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loaded && <ActivityIndicator style={{ marginVertical: 20 }} color="#059669" />}

        {piatti.map((p, i) => (
          <View key={i} style={styles.dish}>
            <View style={styles.dishTop}>
              <TextInput
                style={styles.dishName}
                placeholder="Nome del piatto"
                value={p.nome_piatto}
                onChangeText={(t) => update(i, { nome_piatto: t })}
              />
              <TouchableOpacity onPress={() => removeDish(i)}>
                <Text style={styles.trash}>🗑</Text>
              </TouchableOpacity>
            </View>

            {/* categoria */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.catRow}>
                {CATEGORIE.map((c) => {
                  const on = p.categoria === c;
                  return (
                    <TouchableOpacity key={c}
                      style={[styles.catChip, on && styles.catChipOn]}
                      onPress={() => update(i, { categoria: on ? null : c })}>
                      <Text style={[styles.catText, on && styles.catTextOn]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* prezzo */}
            <TextInput
              style={styles.price}
              placeholder="Prezzo € (opzionale)"
              keyboardType="decimal-pad"
              value={p.prezzo_cents != null ? String(p.prezzo_cents / 100) : ''}
              onChangeText={(t) => {
                const n = parseFloat(t.replace(',', '.'));
                update(i, { prezzo_cents: isNaN(n) ? null : Math.round(n * 100) });
              }}
            />

            {/* Foto URL */}
            <TextInput
              style={styles.imageInput}
              placeholder="URL Foto del piatto (es. link Unsplash/web, opzionale)"
              autoCapitalize="none"
              keyboardType="url"
              value={p.image_url ?? ''}
              onChangeText={(t) => update(i, { image_url: t || null })}
            />

            {/* allergeni: tocca per ciclare assente → contiene → tracce */}
            <Text style={styles.allLabel}>
              Allergeni — tocca: <Text style={{ color: '#dc2626' }}>contiene</Text> →{' '}
              <Text style={{ color: '#d97706' }}>tracce</Text> → assente
            </Text>
            <View style={styles.allGrid}>
              {allergens.filter((a) => !a.is_diet).map((a) => {
                const cont = p.allergeni_contenuti.includes(a.code);
                const trac = p.allergeni_tracce.includes(a.code);
                return (
                  <TouchableOpacity key={a.code}
                    style={[styles.allChip, cont && styles.allCont, trac && styles.allTrac]}
                    onPress={() => cycle(i, a.code)}>
                    <Text style={[styles.allText, (cont || trac) && styles.allTextOn]}>
                      {a.emoji} {a.name_it}{cont ? ' ●' : trac ? ' ◐' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.add} onPress={() => addDish()}>
          <Text style={styles.addText}>＋ Aggiungi piatto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalRow} onPress={() => setLegalAck(!legalAck)}>
          <View style={[styles.checkbox, legalAck && styles.checkboxOn]}>
            {legalAck ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.legalText}>
            Confermo di aver verificato ingredienti, allergeni contenuti e possibili tracce.
            So che le informazioni pubblicate sono sotto la responsabilità del locale.
          </Text>
        </TouchableOpacity>
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.publish, (busy || piatti.length === 0 || !legalAck) && { opacity: 0.4 }]}
        disabled={busy || piatti.length === 0 || !legalAck}
        onPress={publish}>
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.publishText}>✓ Approva e pubblica ({piatti.filter((p) => p.nome_piatto.trim()).length} piatti)</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  mutedBig: { color: '#64748b', fontSize: 16, textAlign: 'center' },
  lockWrap: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f6f8fa' },
  lockCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  lockEmoji: { fontSize: 40 },
  lockTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  lockText: { color: '#475569', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  header: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  headerCode: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  error: { color: '#dc2626', marginBottom: 10 },
  dish: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  dishTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dishName: {
    flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6,
  },
  trash: { fontSize: 18 },
  catRow: { flexDirection: 'row', gap: 6 },
  catChip: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 11, backgroundColor: '#f8fafc',
  },
  catChipOn: { borderColor: '#059669', backgroundColor: '#d1fae5' },
  catText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  catTextOn: { color: '#065f46' },
  price: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 10, marginTop: 10, fontSize: 14, width: 170,
  },
  imageInput: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 10, marginTop: 10, fontSize: 14,
  },
  allLabel: { fontSize: 11, color: '#64748b', marginTop: 12, marginBottom: 6, fontWeight: '600' },
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allChip: {
    borderWidth: 1.2, borderColor: '#e2e8f0', borderRadius: 999,
    paddingVertical: 4, paddingHorizontal: 9, backgroundColor: '#fff',
  },
  allCont: { borderColor: '#dc2626', backgroundColor: '#fee2e2' },
  allTrac: { borderColor: '#d97706', backgroundColor: '#fef3c7' },
  allText: { fontSize: 12, color: '#64748b' },
  allTextOn: { fontWeight: '700', color: '#1e293b' },
  add: {
    borderWidth: 1.5, borderColor: '#059669', borderStyle: 'dashed',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  addText: { color: '#047857', fontWeight: '700', fontSize: 15 },
  legalRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 14, padding: 12, marginTop: 12,
  },
  checkbox: {
    width: 23, height: 23, borderRadius: 6, borderWidth: 1.5,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#059669', borderColor: '#059669' },
  checkboxMark: { color: '#fff', fontWeight: '900', fontSize: 14 },
  legalText: { flex: 1, color: '#475569', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  publish: {
    position: 'absolute', bottom: 18, left: 16, right: 16,
    backgroundColor: '#059669', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  publishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  button: { backgroundColor: '#059669', borderRadius: 12, padding: 14, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
