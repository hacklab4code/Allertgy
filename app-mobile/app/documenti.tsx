import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { api, type Extraction, type MedicalDocument } from '../src/api/client';
import { useSession } from '../src/store/session';
import { TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { expandAllergieCodes, toggleAllergieSelection } from '../src/engine/allergyLinks';
import { AppText, GlassScreenScroll, HeaderAddButton, PuffyButton, Screen, Section } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

/** Documenti medici: upload su storage privato, analisi AI con consenso
 * per-documento e conferma manuale obbligatoria prima di toccare il profilo. */
export default function Documenti() {
  const { setAllergie } = useSession();
  const [docs, setDocs] = useState<MedicalDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<{ docId: number; items: Extraction[]; note: string } | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const load = () => api.listMedicalDocuments().then(setDocs).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    // Consenso AI specifico e separato per QUESTO documento (art. 9 GDPR)
    Alert.alert(
      'Analisi automatica (AI)',
      'Autorizzi l\'analisi automatica di questo documento tramite intelligenza artificiale (Gemini Vision) ' +
      'per suggerire i tuoi allergeni?\n\nI risultati saranno solo suggerimenti: nulla viene aggiunto al ' +
      'profilo senza la tua conferma. Puoi anche caricare il documento senza analisi.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Carica senza analisi', onPress: () => upload(asset, false) },
        { text: 'Autorizzo l\'analisi AI', onPress: () => upload(asset, true) },
      ],
    );
  };

  const upload = async (asset: DocumentPicker.DocumentPickerAsset, aiConsent: boolean) => {
    setBusy(true); setError('');
    try {
      await api.uploadMedicalDocument(
        asset.uri,
        asset.name ?? 'documento.pdf',
        asset.mimeType ?? 'application/pdf',
        aiConsent,
      );
      await load();
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const extract = async (doc: MedicalDocument) => {
    setExtracting(doc.id); setError(''); setSuggestions(null);
    try {
      const res = await api.extractAllergens(doc.id);
      if (res.extractions.length === 0) {
        Alert.alert('Nessun allergene rilevato', res.note || 'Il documento non contiene allergeni riconoscibili. Puoi inserirli manualmente dal profilo.');
      } else {
        setSuggestions({ docId: doc.id, items: res.extractions, note: res.note });
        setSelectedCodes(expandAllergieCodes(res.extractions.map((e) => e.allergen_code)));
      }
      await load();
    } catch (e) { setError((e as Error).message); }
    setExtracting(null);
  };

  const confirm = async () => {
    if (!suggestions) return;
    setBusy(true); setError('');
    try {
      const updated = await api.confirmExtraction(suggestions.docId, expandAllergieCodes(selectedCodes));
      setAllergie(updated.map((a) => a.code));
      setSuggestions(null);
      Alert.alert('Profilo aggiornato', 'Gli allergeni confermati sono stati aggiunti al tuo profilo.');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const remove = (doc: MedicalDocument) =>
    Alert.alert(
      'Elimina documento',
      'Il file verrà cancellato definitivamente anche dallo storage. Continuare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMedicalDocument(doc.id);
              if (suggestions?.docId === doc.id) setSuggestions(null);
              await load();
            } catch (e) { setError((e as Error).message); }
          },
        },
      ],
    );

  const allergenLabel = (code: string) =>
    TRANSLATED_ALLERGENS[code]?.it ?? code.replace(/_/g, ' ');

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          title: 'Documenti sanitari',
          headerRight: () => (
            <HeaderAddButton onPress={pickAndUpload} accessibilityLabel="Carica documento" />
          ),
        }}
      />
      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        <AppText variant="subtitle" style={styles.tagline}>
          Carica referti allergologici (PDF o foto). Privati e cancellabili. Analisi AI facoltativa (max 5/mese).
        </AppText>

        {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}

        {suggestions ? (
          <Section title="Conferma suggerimenti AI" subtitle="Verifica gli allergeni rilevati prima di aggiungerli al profilo.">
            <View style={styles.suggestBox}>
              <AppText variant="bodyBold">🤖 Abbiamo rilevato questi allergeni</AppText>
              <AppText variant="caption">{suggestions.note}</AppText>
              <AppText variant="caption">Tocca per deselezionare quelli non corretti, poi conferma:</AppText>
              <View style={styles.chips}>
                {[...new Set([
                  ...suggestions.items.map((e) => e.allergen_code),
                  ...selectedCodes,
                ])].map((code) => {
                  const extraction = suggestions.items.find((e) => e.allergen_code === code);
                  const on = selectedCodes.includes(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => {
                        const next = toggleAllergieSelection(new Set(selectedCodes), code);
                        setSelectedCodes([...next]);
                      }}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {allergenLabel(code)}
                        {extraction?.confidence != null ? ` · ${Math.round(extraction.confidence * 100)}%` : ''}
                        {!extraction ? ' · correlato' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <PuffyButton
                label="Confermo: aggiungi al mio profilo"
                onPress={confirm}
                disabled={busy || selectedCodes.length === 0}
                fullWidth
              />
              <TouchableOpacity onPress={() => setSuggestions(null)}>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ textAlign: 'center' }}>Non ora</AppText>
              </TouchableOpacity>
            </View>
          </Section>
        ) : null}

        <Section
          title="I tuoi documenti"
          subtitle={docs.length === 0
            ? 'Tocca + in alto per caricare un referto.'
            : `${docs.length} documento${docs.length === 1 ? '' : 'i'} archiviato${docs.length === 1 ? '' : 'i'}.`}
        >
      {docs.length === 0 ? (
        <Text style={styles.empty}>Nessun documento caricato.</Text>
      ) : (
        docs.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {doc.mime_type === 'application/pdf' ? '📄' : '🖼️'} {doc.filename}
              </Text>
              <Text style={styles.docMeta}>
                {doc.uploaded_at.slice(0, 10)} · {doc.status === 'processed' ? 'Analizzato' : doc.status === 'failed' ? 'Analisi fallita' : 'Caricato'}
                {doc.ai_consent_at ? ' · consenso AI ✓' : ' · senza analisi AI'}
              </Text>
              <View style={styles.docActions}>
                {doc.ai_consent_at && (
                  <TouchableOpacity style={styles.smallBtn} disabled={extracting === doc.id} onPress={() => extract(doc)}>
                    {extracting === doc.id
                      ? <ActivityIndicator size="small" color="#0B5D4D" />
                      : <Text style={styles.smallBtnText}>🤖 Analizza</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={async () => {
                    try {
                      const d = await api.downloadMedicalDocument(doc.id);
                      if (d.url) Linking.openURL(d.url);
                    } catch (e) { setError((e as Error).message); }
                  }}
                >
                  <Text style={styles.smallBtnText}>👁️ Apri (5 min)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} onPress={() => remove(doc)}>
                  <Text style={[styles.smallBtnText, { color: '#dc2626' }]}>🗑️ Elimina</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
        )}
        </Section>

        <Section title="Privacy e sicurezza" subtitle="Come vengono conservati i tuoi documenti sanitari.">
          <AppText variant="caption" color={colors.onSurfaceMuted}>
            🔒 I documenti sono conservati su storage privato e ogni accesso viene registrato.
            L'AI può commettere errori: i suggerimenti vanno sempre verificati e nessun dato entra nel
            profilo senza la tua conferma esplicita.
          </AppText>
        </Section>
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  tagline: { color: colors.onSurfaceMuted, lineHeight: 20 },
  suggestBox: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F8A6A',
    borderRadius: 16, padding: 16, marginBottom: 16, gap: 10,
  },
  suggestTitle: { fontWeight: '800', fontSize: 15, color: '#10201B' },
  suggestNote: { color: '#596B63', fontSize: 12.5, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: '#DDE8E2', backgroundColor: '#F7FAF8',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipOn: { backgroundColor: '#DDF8EA', borderColor: '#0F8A6A' },
  chipText: { fontSize: 13, color: '#596B63', fontWeight: '600' },
  chipTextOn: { color: '#0B5D4D', fontWeight: '800' },
  cancelLink: { textAlign: 'center', color: '#596B63', fontWeight: '600', paddingVertical: 4 },
  empty: { color: '#8AA096', textAlign: 'center', marginVertical: 24, fontWeight: '600' },
  docCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row',
  },
  docName: { fontWeight: '700', fontSize: 14.5, color: '#10201B' },
  docMeta: { color: '#8AA096', fontSize: 12, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  smallBtn: {
    borderWidth: 1, borderColor: '#DDE8E2', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F7FAF8',
  },
  smallBtnText: { fontSize: 12.5, fontWeight: '700', color: '#0B5D4D' },
  privacyNote: { color: '#8AA096', fontSize: 11.5, lineHeight: 17, marginTop: 16 },
});
