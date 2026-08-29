import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View,
} from 'react-native';
import { api, type Extraction, type MedicalDocument } from '../src/api/client';
import { useSession } from '../src/store/session';
import { TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { expandAllergieCodes, toggleAllergieSelection } from '../src/engine/allergyLinks';
import { AppText, GlassScreenScroll, HeaderAddButton, SurfaceButton, Screen, Section } from '../src/components/ui';
import { colors, radius, spacing } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Profilo aggiornato', 'Gli allergeni confermati sono stati aggiunti al tuo profilo.');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const remove = (doc: MedicalDocument) =>
    Alert.alert(
      'Elimina documento',
      'Il file verrà cancellato definitivamente dallo storage. Continuare?',
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
      <GlassScreenScroll headerFloat={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Section title="Documentazione medica" subtitle="Carica referti allergologici (PDF o immagini). Privati e decifrabili su richiesta.">
          <SurfaceButton
            label="Carica nuovo documento"
            onPress={pickAndUpload}
            fullWidth
          />
        </Section>

        {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}

        {suggestions ? (
          <Section title="Conferma suggerimenti AI" subtitle="Verifica gli allergeni rilevati prima di aggiungerli al profilo.">
            <View style={styles.suggestBox}>
              <AppText variant="bodyBold">🤖 Allergeni rilevati</AppText>
              <AppText variant="caption">{suggestions.note}</AppText>
              <AppText variant="caption" color={colors.onSurfaceMuted}>Tocca per deselezionare quelli non corretti:</AppText>
              <View style={styles.chips}>
                {[...new Set([
                  ...suggestions.items.map((e) => e.allergen_code),
                  ...selectedCodes,
                ])].map((code) => {
                  const extraction = suggestions.items.find((e) => e.allergen_code === code);
                  const on = selectedCodes.includes(code);
                  return (
                    <Pressable
                      key={code}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => {
                        const next = toggleAllergieSelection(new Set(selectedCodes), code);
                        setSelectedCodes([...next]);
                      }}
                    >
                      <AppText style={[styles.chipText, on && styles.chipTextOn]}>
                        {allergenLabel(code)}
                        {extraction?.confidence != null ? ` · ${Math.round(extraction.confidence * 100)}%` : ''}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              <SurfaceButton
                label="Confermo: aggiungi al profilo"
                onPress={confirm}
                disabled={busy || selectedCodes.length === 0}
                fullWidth
              />
              <Pressable onPress={() => setSuggestions(null)} style={{ alignSelf: 'center', paddingVertical: 4 }}>
                <AppText variant="caption" color={colors.onSurfaceMuted}>Non ora</AppText>
              </Pressable>
            </View>
          </Section>
        ) : null}

        <Section
          title="I tuoi documenti"
          subtitle={docs.length === 0
            ? 'Nessun documento caricato'
            : `${docs.length} documento${docs.length === 1 ? '' : 'i'} in archivio`}
        >
          {docs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={32} color={colors.borderStrong} />
              <AppText variant="caption" color={colors.onSurfaceMuted}>
                Nessun referto medico caricato. Tocca in alto a destra per aggiungerne uno.
              </AppText>
            </View>
          ) : (
            docs.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docIconWrap}>
                  <Ionicons
                    name={doc.mime_type === 'application/pdf' ? 'document-text' : 'image'}
                    size={22}
                    color={colors.brand}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyBold" numberOfLines={1}>
                    {doc.filename}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {doc.uploaded_at.slice(0, 10)} · {doc.status === 'processed' ? 'Analizzato' : 'Caricato'}
                    {doc.ai_consent_at ? ' · AI ✓' : ''}
                  </AppText>
                  <View style={styles.docActions}>
                    {doc.ai_consent_at && (
                      <Pressable
                        style={styles.actionBtn}
                        disabled={extracting === doc.id}
                        onPress={() => extract(doc)}
                      >
                        {extracting === doc.id
                          ? <ActivityIndicator size="small" color={colors.brand} />
                          : <AppText variant="caption" color={colors.brand} style={styles.actionText}>🤖 Analizza</AppText>}
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.actionBtn}
                      onPress={async () => {
                        try {
                          const d = await api.downloadMedicalDocument(doc.id);
                          if (d.url) Linking.openURL(d.url);
                        } catch (e) { setError((e as Error).message); }
                      }}
                    >
                      <AppText variant="caption" color={colors.brandInk} style={styles.actionText}>👁️ Apri</AppText>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => remove(doc)}>
                      <AppText variant="caption" color={colors.red} style={styles.actionText}>🗑️ Elimina</AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </Section>

        <Section title="Privacy & Sicurezza" subtitle="Gestione riservata dei dati sulla salute (GDPR)">
          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.privacyNote}>
            🔒 I tuoi documenti medici sono archiviati su server sicuri con crittografia. Ogni analisi AI è facoltativa e nessun allergene viene salvato sul profilo senza la tua approvazione esplicita.
          </AppText>
        </Section>
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  suggestBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  chipText: { fontSize: 13, color: colors.brandInk },
  chipTextOn: { color: colors.onGreen, fontWeight: '700' },
  emptyCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 10,
  },
  docCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 12,
  },
  privacyNote: {
    lineHeight: 18,
  },
});
