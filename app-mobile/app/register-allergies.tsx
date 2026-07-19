import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import { getSectionTitle, groupAllergensBySection, getLang, TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { toggleAllergieSelectionWithIntensities, expandAllergieCodes } from '../src/engine/allergyLinks';
import type { Allergen } from '../src/types';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import {
  AppText,
  DebossedInput,
  GlassCard,
  GlassScreenScroll,
  PuffyButton,
  Screen,
  Section,
} from '../src/components/ui';
import { colors, spacing, CHIP_MIN_HEIGHT, radius } from '../src/theme';

export default function RegisterAllergiesScreen() {
  const { token, language, setAllergie, setProfileCompleted, setRegisterAllergieStep } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const lang = getLang(language);

  const [all, setAll] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [intensities, setIntensities] = useState<Record<string, 'lieve' | 'moderata' | 'grave'>>({});
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    api.allergens().then(setAll).catch((e) => setError(e.message));
  }, [token]);

  const sections = useMemo(() => {
    const base = groupAllergensBySection(all);
    if (!search.trim()) return base;
    const q = search.toLowerCase().trim();
    return base
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (a) =>
            a.name_it.toLowerCase().includes(q) ||
            (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en.toLowerCase().includes(q)) ||
            a.code.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [all, search]);

  const totalFiltered = useMemo(
    () => sections.reduce((acc, s) => acc + s.items.length, 0),
    [sections],
  );

  const toggle = (code: string) => {
    const { selected: next, intensities: nextIntensities } = toggleAllergieSelectionWithIntensities(
      selected,
      intensities,
      code,
    );
    setSelected(next);
    setIntensities(nextIntensities);
  };

  const updateIntensity = (code: string, level: 'lieve' | 'moderata' | 'grave') => {
    const next = new Set(selected);
    next.add(code);
    setSelected(next);
    setIntensities((prev) => ({ ...prev, [code]: level }));
  };

  const onLongPress = (code: string, name: string) => {
    Alert.alert(
      isIt ? `Intensità: ${name}` : `Severity: ${name}`,
      isIt ? 'Imposta quanto è grave questa allergia:' : 'Set how severe this allergy is:',
      [
        { text: isIt ? 'Lieve' : 'Mild', onPress: () => updateIntensity(code, 'lieve') },
        { text: isIt ? 'Moderata' : 'Moderate', onPress: () => updateIntensity(code, 'moderata') },
        { text: isIt ? 'Grave/Anafilassi' : 'Severe/Anaphylaxis', onPress: () => updateIntensity(code, 'grave'), style: 'destructive' },
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
      ],
    );
  };

  const applyExtractedCodes = (codes: string[], note?: string) => {
    if (codes.length === 0) return;
    const expanded = expandAllergieCodes(codes);
    setSelected((prev) => {
      const next = new Set(prev);
      expanded.forEach((c) => next.add(c));
      return next;
    });
    setIntensities((prev) => {
      const next = { ...prev };
      for (const c of expanded) {
        if (!next[c]) next[c] = 'moderata';
      }
      return next;
    });
    setAiNote(
      note
        || (isIt
          ? `Aggiunti ${expanded.length} allergeni dal referto (inclusi correlati). Verifica la selezione.`
          : `${expanded.length} allergens added from report (including related ones). Please verify your selection.`),
    );
  };

  const pickAndAnalyze = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setError('');
    setAiNote('');

    try {
      const doc = await api.uploadMedicalDocument(
        asset.uri,
        asset.name ?? 'referto.pdf',
        asset.mimeType ?? 'application/pdf',
        true,
      );
      const res = await api.extractAllergens(doc.id);
      const codes = res.extractions.map((e) => e.allergen_code);

      if (codes.length === 0) {
        Alert.alert(
          isIt ? 'Nessun allergene rilevato' : 'No allergens detected',
          res.note
            || (isIt
              ? 'Non abbiamo trovato allergeni nel documento. Puoi selezionarli manualmente.'
              : 'We could not find allergens in the document. You can select them manually.'),
        );
      } else {
        applyExtractedCodes(codes, res.note);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      const codes = [...selected];
      await api.saveAllergens(codes, intensities);
      setAllergie(codes, intensities);
      setProfileCompleted(true);
      setRegisterAllergieStep(false);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const Chip = ({ a }: { a: Allergen }) => {
    const on = selected.has(a.code);
    const isDiet = a.is_diet;
    const label = isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it);
    const intensitySuffix = on && intensities[a.code] === 'lieve' ? (isIt ? ' (Lieve)' : ' (Mild)')
      : on && intensities[a.code] === 'grave' ? (isIt ? ' (Grave)' : ' (Severe)')
      : on ? ' (Mod.)' : '';

    return (
      <Pressable
        onPress={() => toggle(a.code)}
        onLongPress={() => onLongPress(a.code, label)}
        delayLongPress={300}
        style={[styles.chip, on && (isDiet ? styles.chipOnDiet : styles.chipOnAllergy)]}
      >
        <AppText
          variant="caption"
          style={on ? (isDiet ? styles.chipTextOnDiet : styles.chipTextOnAllergy) : styles.chipText}
        >
          {a.emoji} {label}{intensitySuffix}
        </AppText>
      </Pressable>
    );
  };

  const finishLabel = selected.size === 0
    ? (isIt ? 'Continua senza allergie' : 'Continue without allergies')
    : (isIt ? `Continua (${selected.size} allergie)` : `Continue (${selected.size} allergies)`);

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          title: isIt ? 'Le tue allergie' : 'Your allergies',
          headerBackVisible: false,
          headerRight: () => <LanguageFlagsRow inHeader />,
        }}
      />

      <GlassScreenScroll
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2" style={styles.step}>
          {isIt ? 'Passo 2 di 2' : 'Step 2 of 2'}
        </AppText>
        <AppText variant="subtitle" style={styles.intro}>
          {isIt
            ? 'Carica un referto per compilare in automatico, oppure cerca e seleziona le tue allergie.'
            : 'Upload a medical report for automatic filling, or search and select your allergies.'}
        </AppText>

        <GlassCard style={styles.uploadCard}>
          <View style={styles.uploadIcon}>
            <Ionicons name="document-text" size={28} color={colors.brand} />
          </View>
          <AppText variant="title">
            {isIt ? 'Carica referto allergologico' : 'Upload allergy report'}
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.uploadSub}>
            {isIt
              ? 'PDF o foto: l\'AI legge il documento e seleziona le allergie per te in automatico.'
              : 'PDF or photo: AI reads the document and selects allergies for you automatically.'}
          </AppText>
          <PuffyButton
            label={uploading
              ? (isIt ? 'Analisi in corso…' : 'Analyzing…')
              : (isIt ? 'Carica e analizza' : 'Upload & analyze')}
            onPress={pickAndAnalyze}
            disabled={uploading || busy}
            loading={uploading}
            icon="cloud-upload-outline"
            variant="secondary"
          />
        </GlassCard>

        {aiNote ? (
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={18} color={colors.brand} />
            <AppText variant="caption" style={{ flex: 1 }}>{aiNote}</AppText>
          </View>
        ) : null}

        {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}
        {all.length === 0 && !error ? <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} /> : null}

        {all.length > 0 ? (
          <>
            <Section
              title={isIt ? 'Cerca e seleziona' : 'Search & select'}
              subtitle={isIt
                ? 'Tocca per selezionare. Gli allergeni correlati si aggiungono in automatico. Tieni premuto per la gravità.'
                : 'Tap to select. Related allergens are added automatically. Long press for severity.'}
            >
              <DebossedInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('search_allergen_placeholder')}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.trim() !== '' ? (
                <AppText variant="caption" color={colors.onSurfaceMuted}>
                  {totalFiltered > 0
                    ? (isIt ? `${totalFiltered} risultati` : `${totalFiltered} results`)
                    : (isIt ? 'Nessun risultato' : 'No results')}
                </AppText>
              ) : null}
            </Section>

            {sections.map((section) => (
              <Section
                key={section.key}
                title={getSectionTitle(section.key, lang)}
                subtitle={section.key === 'preferenze'
                  ? (isIt ? 'Preferenze alimentari' : 'Dietary preferences')
                  : (isIt ? 'Allergeni obbligatori UE' : 'Mandatory EU allergens')}
              >
                <View style={styles.grid}>
                  {section.items.map((a) => <Chip key={a.code} a={a} />)}
                </View>
              </Section>
            ))}
          </>
        ) : null}
      </GlassScreenScroll>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <PuffyButton
          label={busy ? (isIt ? 'Salvataggio…' : 'Saving…') : finishLabel}
          onPress={finish}
          disabled={busy || uploading || (all.length === 0 && !error)}
          icon="arrow-forward"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  step: { color: colors.brand, textAlign: 'center' },
  intro: { color: colors.onSurfaceMuted, textAlign: 'center', lineHeight: 22 },
  uploadCard: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.lg },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSub: { textAlign: 'center', lineHeight: 18, marginBottom: spacing.xs },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: CHIP_MIN_HEIGHT,
    justifyContent: 'center',
  },
  chipOnAllergy: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  chipTextOnAllergy: { color: '#e11d48', fontWeight: '800' },
  chipOnDiet: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  chipTextOnDiet: { color: '#16a34a', fontWeight: '800' },
  chipText: { color: colors.onSurfaceMuted, fontWeight: '600' },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
