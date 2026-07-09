import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { useOwner } from '../../src/store/owner';
import { WEB_URL, API } from '../../src/api/client';
import { useSession } from '../../src/store/session';

/** Scheda QR: codice del locale e QR da mostrare/stampare. */
export default function QR() {
  const { current, published } = useOwner();

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Prima seleziona o crea il tuo locale.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.buttonText}>Vai a "Locale"</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasMenu = published || !!current.menu_updated_at;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{current.name}</Text>
        {hasMenu
          ? <Text style={styles.ok}>Menù pubblicato ✓</Text>
          : <Text style={styles.warn}>Menù non ancora pubblicato — vai alla scheda "Menù"</Text>}

        <Text style={styles.label}>CODICE DEL LOCALE</Text>
        <Text style={styles.code}>{current.public_code}</Text>

        <Image
          style={styles.qr}
          source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(WEB_URL + '/r/' + current.public_code)}` }}
        />
        <Text style={styles.hint}>
          I clienti inquadrano questo QR con la fotocamera del cellulare per scoprire cosa possono mangiare da te. Funziona nel browser con semaforo guest e nell'app con il profilo salvato.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛡️ Esenzione Burocrazia e Validità</Text>
        <Text style={styles.stepDescription}>
          Il menù digitale di AllerTgy funge da Registro degli Allergeni ufficiale (Regolamento UE n. 1169/2011) ed esonera il locale dall'uso di fogli cartacei instabili.
        </Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Partita IVA:</Text>
          <Text style={styles.metaValue}>{(current as any).vat_number || 'Non inserita ⚠️'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Referente Allergeni:</Text>
          <Text style={styles.metaValue}>{(current as any).allergen_manager || 'Non inserito ⚠️'}</Text>
        </View>

        {!((current as any).vat_number && (current as any).allergen_manager) && (
          <Text style={styles.warningHint}>
            Completa Partita IVA e Referente Allergeni nella sezione "Locale" per garantire la validità legale ineccepibile del registro digitale.
          </Text>
        )}

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={() => {
            const token = useSession.getState().token;
            if (!token) return;
            const pdfUrl = `${API}/admin/restaurants/${current.id}/registry.pdf?token=${token}`;
            Linking.openURL(pdfUrl).catch((err) => {
              Alert.alert('Errore', 'Impossibile aprire il link del registro PDF.');
            });
          }}
        >
          <Text style={styles.pdfBtnText}>📥 Scarica Registro PDF Ufficiale</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Come usarlo</Text>
        <Text style={styles.step}>1 · Fai uno screenshot di questa schermata (o stampa il PDF dalla dashboard web).</Text>
        <Text style={styles.step}>2 · Stampa e posiziona il QR sui tavoli e alla cassa.</Text>
        <Text style={styles.step}>3 · Quando cambi piatti o ricette, aggiorna il menù nella scheda "Menù": il QR resta lo stesso.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  muted: { color: '#64748b', fontSize: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  ok: { color: '#047857', fontWeight: '700', marginTop: 4 },
  warn: { color: '#d97706', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginTop: 16 },
  code: { fontSize: 40, fontWeight: '800', color: '#065f46', letterSpacing: 6 },
  qr: { width: 220, height: 220, marginTop: 12, borderRadius: 8 },
  hint: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#1e293b', marginBottom: 8, alignSelf: 'flex-start' },
  stepDescription: { color: '#475569', fontSize: 12, lineHeight: 17, marginBottom: 12, alignSelf: 'flex-start' },
  step: { color: '#475569', fontSize: 13, lineHeight: 20, alignSelf: 'flex-start', marginBottom: 4 },
  button: { backgroundColor: '#059669', borderRadius: 12, padding: 14, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
  metaRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  metaLabel: { fontWeight: '700', fontSize: 12, color: '#64748b' },
  metaValue: { fontWeight: '700', fontSize: 12, color: '#0f172a' },
  warningHint: { color: '#b45309', fontSize: 11, fontStyle: 'italic', marginTop: 10, alignSelf: 'flex-start', lineHeight: 15 },
  pdfBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  pdfBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
