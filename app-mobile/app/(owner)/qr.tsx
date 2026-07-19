import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { useOwner } from '../../src/store/owner';
import { WEB_URL, API } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import { CollapseSection, Screen } from '../../src/components/ui';
import { TAB_BAR_CLEARANCE, spacing } from '../../src/theme';

/** Scheda QR: codice del locale e QR da mostrare/stampare. */
export default function QR() {
  const { current, published } = useOwner();
  const [legalExpanded, setLegalExpanded] = useState(false);
  const [howToExpanded, setHowToExpanded] = useState(false);

  if (!current) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>Prima seleziona o crea il tuo locale.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.buttonText}>Vai ad Attività</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const hasMenu = published || !!current.menu_updated_at;
  const legalOk = !!(current as any).vat_number && !!(current as any).allergen_manager;

  return (
    <Screen edges={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Codice e QR tavolo</Text>
          <Text style={styles.blockSub}>Stampa o condividi — i clienti vedono il menù filtrato sulle allergie.</Text>
          <Text style={styles.title}>{current.name}</Text>
          {hasMenu
            ? <Text style={styles.ok}>Menù pubblicato ✓</Text>
            : <Text style={styles.warn}>Menù non pubblicato — vai alla scheda Menù</Text>}

          <Text style={styles.label}>CODICE DEL LOCALE</Text>
          <Text style={styles.code}>{current.public_code}</Text>

          <Image
            style={styles.qr}
            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(WEB_URL + '/r/' + current.public_code)}` }}
          />
          <Text style={styles.hint}>
            I clienti inquadrano il QR con la fotocamera per vedere cosa possono mangiare. Funziona nel browser e nell'app AllerTgy.
          </Text>
        </View>

        <CollapseSection
          icon="document-text"
          title="Validità legale"
          preview={legalOk ? 'Dati completi' : 'Dati da completare'}
          expanded={legalExpanded}
          onToggle={() => setLegalExpanded((v) => !v)}
          tint={legalOk ? undefined : 'yellow'}
        >
          <Text style={styles.stepDescription}>
            Il menù digitale funge da Registro degli Allergeni conforme al Reg. UE 1169/2011.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Partita IVA:</Text>
            <Text style={styles.metaValue}>{(current as any).vat_number || 'Non inserita'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Referente allergeni:</Text>
            <Text style={styles.metaValue}>{(current as any).allergen_manager || 'Non inserito'}</Text>
          </View>
          {!legalOk && (
            <Text style={styles.warningHint}>
              Completa P.IVA e referente in Attività per la validità legale del registro.
            </Text>
          )}
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => {
              const token = useSession.getState().token;
              if (!token) return;
              const pdfUrl = `${API}/admin/restaurants/${current.id}/registry.pdf?token=${token}`;
              Linking.openURL(pdfUrl).catch(() => {
                Alert.alert('Errore', 'Impossibile aprire il link del registro PDF.');
              });
            }}
          >
            <Text style={styles.pdfBtnText}>Scarica registro PDF ufficiale</Text>
          </TouchableOpacity>
        </CollapseSection>

        <CollapseSection
          icon="help-circle"
          title="Come usarlo"
          preview="3 passaggi in sala"
          expanded={howToExpanded}
          onToggle={() => setHowToExpanded((v) => !v)}
        >
          <Text style={styles.step}>1 · Screenshot o stampa del QR (o PDF dalla dashboard web).</Text>
          <Text style={styles.step}>2 · Posiziona il QR sui tavoli e alla cassa.</Text>
          <Text style={styles.step}>3 · Aggiorna il menù in Menù quando cambi piatti — il QR resta uguale.</Text>
        </CollapseSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  muted: { color: '#666', fontSize: 15, textAlign: 'center' },
  block: { gap: 6, alignItems: 'center' },
  blockTitle: { fontSize: 16, fontWeight: '800', alignSelf: 'flex-start' },
  blockSub: { fontSize: 12, color: '#666', alignSelf: 'flex-start', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  ok: { fontWeight: '700', marginTop: 4 },
  warn: { fontWeight: '700', marginTop: 4, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 1, marginTop: 16, alignSelf: 'flex-start' },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 4 },
  qr: { width: 220, height: 220, marginTop: 12, borderWidth: 1, borderColor: '#000' },
  hint: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  stepDescription: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  metaLabel: { fontWeight: '700', fontSize: 12, width: 130 },
  metaValue: { flex: 1, fontSize: 12 },
  warningHint: { fontSize: 12, color: '#666', marginTop: 4 },
  pdfBtn: { borderWidth: 1, borderColor: '#000', padding: 12, alignItems: 'center', marginTop: 8 },
  pdfBtnText: { fontWeight: '800', fontSize: 13 },
  step: { fontSize: 13, lineHeight: 20, paddingVertical: 4 },
  button: { borderWidth: 1, borderColor: '#000', padding: 14, paddingHorizontal: 24 },
  buttonText: { fontWeight: '700' },
});
