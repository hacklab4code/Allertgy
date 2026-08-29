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
import {
  criterioShortLabel,
  intensityShortLabel,
  promptAllergyConfig,
} from '../src/engine/allergyConfig';
import type { Allergen, AllergyCriterio, AllergyIntensity } from '../src/types';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import {
  AppText,
  DebossedInput,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
  Screen,
  Section,
  AllergyChip,
  AllergyConfigModal,
} from '../src/components/ui';
import { colors, spacing, CHIP_MIN_HEIGHT, radius } from '../src/theme';
import { useAdaptiveMeshInk } from '../src/hooks/useMeshInk';

export default function RegisterAllergiesScreen() {
  const { token, language, setAllergie, setProfileCompleted, setRegisterAllergieStep } = useSession();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const lang = getLang(language);

  const { ref: introRef, ink: introInk, onLayout: onIntroLayout } = useAdaptiveMeshInk(true);

  const [all, setAll] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [intensities, setIntensities] = useState<Record<string, AllergyIntensity>>({});
  const [criteria, setCriteria] = useState<Record<string, AllergyCriterio>>({});
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [error, setError] = useState('');
  const [configModalTarget, setConfigModalTarget] = useState<Allergen | null>(null);

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
    setCriteria((prev) => {
      const copy = { ...prev };
      if (selected.has(code)) {
        for (const c of selected) {
          if (!next.has(c)) delete copy[c];
        }
      } else {
        for (const c of next) {
          if (!selected.has(c) && !copy[c]) copy[c] = 'assoluto';
        }
      }
      return copy;
    });
  };

  const updateIntensity = (code: string, level: AllergyIntensity) => {
    const next = new Set(selected);
    next.add(code);
    setSelected(next);
    setIntensities((prev) => ({ ...prev, [code]: level }));
    setCriteria((prev) => ({ ...prev, [code]: prev[code] || 'assoluto' }));
  };

  const updateCriterio = (code: string, criterio: AllergyCriterio) => {
    const next = new Set(selected);
    next.add(code);
    setSelected(next);
    setCriteria((prev) => ({ ...prev, [code]: criterio }));
    setIntensities((prev) => ({ ...prev, [code]: prev[code] || 'moderata' }));
  };

  const onLongPress = (code: string, name: string) => {
    promptAllergyConfig({
      name,
      isIt,
      onIntensity: (level) => updateIntensity(code, level),
      onCriterio: (criterio) => updateCriterio(code, criterio),
    });
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
    setCriteria((prev) => {
      const next = { ...prev };
      for (const c of expanded) {
        if (!next[c]) next[c] = 'assoluto';
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
      await api.saveAllergens(codes, intensities, criteria);
      setAllergie(codes, intensities, criteria);
      setProfileCompleted(true);
      setRegisterAllergieStep(false);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
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
        headerFloat={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View ref={introRef} onLayout={onIntroLayout} style={styles.introBlock}>
          <AppText variant="h2" color={introInk.ink} style={styles.step}>
            {isIt ? 'Passo 2 di 2' : 'Step 2 of 2'}
          </AppText>
          <AppText variant="subtitle" color={introInk.inkMuted} style={styles.intro}>
            {isIt
              ? 'Carica un referto per compilare in automatico, oppure cerca e seleziona le tue allergie.'
              : 'Upload a medical report for automatic filling, or search and select your allergies.'}
          </AppText>
        </View>

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
          <SurfaceButton
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
                ? 'Tocca una pillola per selezionarla. Tieni premuta per personalizzare l\'intensità.'
                : 'Tap a chip to select. Press & hold to customize severity.'}
            >
              <DebossedInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('search_allergen_placeholder')}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.trim() !== '' && (
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: 4 }}>
                  {totalFiltered > 0
                    ? (isIt ? `${totalFiltered} trovati` : `${totalFiltered} found`)
                    : (isIt ? 'Nessun risultato' : 'No results')}
                </AppText>
              )}
            </Section>

            {sections.map((section) => (
              <Section key={section.key} title={getSectionTitle(section.key, lang)} card={false}>
                <View style={styles.grid}>
                  {section.items.map((a) => (
                    <AllergyChip
                      key={a.code}
                      a={a}
                      selected={selected.has(a.code)}
                      intensity={intensities[a.code] || 'moderata'}
                      criterio={criteria[a.code] || 'assoluto'}
                      onToggle={() => toggle(a.code)}
                      onConfigure={() => setConfigModalTarget(a)}
                      isIt={isIt}
                    />
                  ))}
                </View>
              </Section>
            ))}
          </>
        ) : null}

        <View style={{ height: 100 + insets.bottom }} />
      </GlassScreenScroll>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <SurfaceButton
          label={busy ? (isIt ? 'Salvataggio…' : 'Saving…') : finishLabel}
          onPress={finish}
          disabled={busy || uploading || (all.length === 0 && !error)}
          fullWidth
        />
      </View>

      {configModalTarget && (
        <AllergyConfigModal
          visible={Boolean(configModalTarget)}
          onClose={() => setConfigModalTarget(null)}
          allergenName={isIt ? configModalTarget.name_it : (TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.en || configModalTarget.name_it)}
          allergenEmoji={configModalTarget.emoji ?? undefined}
          isDiet={Boolean(configModalTarget.is_diet)}
          intensity={intensities[configModalTarget.code] || 'moderata'}
          criterio={criteria[configModalTarget.code] || 'assoluto'}
          onSave={(intensity, criterio) => {
            if (!selected.has(configModalTarget.code)) {
              const next = new Set(selected);
              next.add(configModalTarget.code);
              setSelected(next);
            }
            setIntensities((prev) => ({ ...prev, [configModalTarget.code]: intensity }));
            setCriteria((prev) => ({ ...prev, [configModalTarget.code]: criterio }));
          }}
          isIt={isIt}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  introBlock: { gap: 6, marginBottom: spacing.md },
  step: { marginBottom: 2 },
  intro: { marginBottom: spacing.sm },
  uploadCard: { gap: spacing.sm, marginBottom: spacing.md },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSub: { marginBottom: 4 },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: CHIP_MIN_HEIGHT,
    justifyContent: 'center',
  },
  chipOnLieve: {
    borderColor: colors.yellow,
    backgroundColor: colors.yellowSoft,
  },
  chipTextOnLieve: {
    color: colors.onYellow,
    fontWeight: '700',
  },
  chipOnModerata: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  chipTextOnModerata: {
    color: colors.onYellow,
    fontWeight: '700',
  },
  chipOnGrave: {
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
  },
  chipTextOnGrave: {
    color: colors.onRed,
    fontWeight: '700',
  },
  chipOnDiet: {
    borderColor: colors.greenBorder,
    backgroundColor: colors.greenSoft,
  },
  chipTextOnDiet: {
    color: colors.onGreen,
    fontWeight: '700',
  },
  chipText: {
    color: colors.brandInk,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
