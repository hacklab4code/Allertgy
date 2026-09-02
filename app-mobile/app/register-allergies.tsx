import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import { getSectionTitle, groupAllergensBySection, getLang, TRANSLATED_ALLERGENS } from '../src/engine/translations';
import { toggleAllergieSelectionWithIntensities, expandAllergieCodes } from '../src/engine/allergyLinks';
import {
  promptAllergyConfig,
} from '../src/engine/allergyConfig';
import type { Allergen, AllergyCriterio, AllergyIntensity } from '../src/types';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';
import {
  AppText,
  DebossedInput,
  GlassScreenScroll,
  SurfaceButton,
  Screen,
  ScreenTopHeader,
  Section,
  AllergyChip,
  AllergyConfigModal,
} from '../src/components/ui';
import { colors, spacing, radius, softShadow } from '../src/theme';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Categories for quick filter tabs
  const categoryTabs = useMemo(() => [
    { key: 'all', label: isIt ? 'Tutti gli allergeni' : 'All allergens' },
    { key: 'ue14', label: isIt ? 'I 14 Allergeni UE' : '14 EU Allergens' },
    { key: 'frutta_secca', label: isIt ? 'Frutta a guscio' : 'Nuts & Seeds' },
    { key: 'glutine_cereali', label: isIt ? 'Cereali & Glutine' : 'Gluten & Grains' },
    { key: 'latticini_uova', label: isIt ? 'Latticini & Uova' : 'Dairy & Eggs' },
    { key: 'pesce_crostacei', label: isIt ? 'Pesce & Mare' : 'Fish & Seafood' },
  ], [isIt]);

  const sections = useMemo(() => {
    let base = groupAllergensBySection(all);

    // Filter by quick category tab
    if (selectedCategory === 'ue14') {
      const ueCodes = new Set([
        'glutine', 'crostacei', 'uova', 'pesce', 'arachidi', 'soia', 'latte',
        'frutta_guscio', 'sedano', 'senape', 'sesamo', 'solfiti', 'lupini', 'molluschi'
      ]);
      base = base.map((s) => ({
        ...s,
        items: s.items.filter((a) => ueCodes.has(a.code.toLowerCase())),
      })).filter((s) => s.items.length > 0);
    } else if (selectedCategory !== 'all') {
      base = base.filter((s) => s.key === selectedCategory);
    }

    // Filter by search query
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
  }, [all, search, selectedCategory]);

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
          ? `Aggiunti ${expanded.length} allergeni dal referto con correlazioni cliniche. Verifica la selezione.`
          : `${expanded.length} allergens added from report with clinical correlations.`),
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
              ? 'Non abbiamo trovato allergeni nel documento. Puoi selezionarli comodamente a mano qui sotto.'
              : 'We could not find allergens in the document. You can select them manually below.'),
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
    : (isIt ? `Continua (${selected.size} allergie selezionate)` : `Continue (${selected.size} selected)`);

  return (
    <Screen edges={false} ambient style={styles.screen}>
      <ScreenTopHeader
        title={isIt ? 'Le tue allergie' : 'Your allergies'}
        showBack={false}
        rightElement={<LanguageFlagsRow inHeader />}
      />

      <GlassScreenScroll
        headerFloat={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Bar Header */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <View style={styles.stepBadge}>
              <Ionicons name="sparkles-outline" size={13} color={colors.brand} />
              <AppText variant="caption" color={colors.brand} style={styles.stepBadgeText}>
                {isIt ? 'PASSO 2 DI 2 · ALLERGENI' : 'STEP 2 OF 2 · ALLERGENS'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.brand} style={styles.progressPercent}>
              100%
            </AppText>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Intro */}
        <View ref={introRef} onLayout={onIntroLayout} style={styles.introBlock}>
          <AppText variant="h1" color={introInk.ink} style={styles.mainHeading}>
            {isIt ? 'Configura il tuo profilo' : 'Configure your profile'}
          </AppText>
          <AppText variant="subtitle" color={introInk.inkMuted} style={styles.introSubtitle}>
            {isIt
              ? 'Carica il tuo referto medico per l\'auto-compilazione istantanea con AI, oppure seleziona le tue intolleranze ed allergie.'
              : 'Upload your medical report for instant AI auto-fill, or select your allergies and intolerances.'}
          </AppText>
        </View>

        {/* AI Medical Report Hero Card */}
        <View style={[styles.uploadCard, softShadow(6)]}>
          <View style={styles.uploadHeaderRow}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.brand} />
            </View>
            <View style={styles.uploadTitleGroup}>
              <View style={styles.uploadBadgeRow}>
                <AppText variant="title" style={styles.uploadCardTitle}>
                  {isIt ? 'Referto con AI' : 'Medical Report AI'}
                </AppText>
                <View style={styles.aiPillBadge}>
                  <Ionicons name="sparkles-outline" size={11} color={colors.brand} />
                  <AppText variant="caption" color={colors.brand} style={styles.aiPillText}>
                    {isIt ? 'Automatico' : 'Instant AI'}
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.uploadSub}>
                {isIt
                  ? 'Foto o PDF del referto: l\'AI legge e compila le tue allergie in 3 secondi.'
                  : 'Photo or PDF report: AI parses and selects your allergens automatically.'}
              </AppText>
            </View>
          </View>

          <SurfaceButton
            label={uploading
              ? (isIt ? 'Analisi referto in corso…' : 'Analyzing report…')
              : (isIt ? 'Carica referto (PDF o Foto)' : 'Upload report (PDF / Photo)')}
            onPress={pickAndAnalyze}
            disabled={uploading || busy}
            loading={uploading}
            icon="cloud-upload-outline"
            variant="soft"
          />
        </View>

        {aiNote ? (
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles-outline" size={18} color={colors.brand} />
            <AppText variant="caption" color={colors.brandDarker} style={{ flex: 1, lineHeight: 17 }}>
              {aiNote}
            </AppText>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
            <AppText variant="caption" color={colors.red} style={{ flex: 1 }}>
              {error}
            </AppText>
          </View>
        ) : null}

        {all.length === 0 && !error ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
        ) : null}

        {all.length > 0 ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchSection}>
              <View style={styles.searchHeader}>
                <Ionicons name="search-outline" size={15} color={colors.brand} />
                <AppText variant="caption" style={styles.searchTitle}>
                  {isIt ? 'Cerca o filtra per categoria' : 'Search or filter by category'}
                </AppText>
                {selected.size > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Ionicons name="checkmark-circle-outline" size={13} color={colors.brand} />
                    <AppText variant="caption" color={colors.brand} style={{ fontWeight: '800', fontSize: 11 }}>
                      {selected.size} {isIt ? 'selezionati' : 'selected'}
                    </AppText>
                  </View>
                )}
              </View>

              <DebossedInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('search_allergen_placeholder')}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                rightIcon={
                  search ? (
                    <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-outline" size={18} color={colors.onSurfaceMuted} />
                    </TouchableOpacity>
                  ) : undefined
                }
              />
            </View>

            {/* Category Quick Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categoryTabs.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setSelectedCategory(cat.key)}
                    style={[styles.catPill, active && styles.catPillActive]}
                  >
                    <AppText
                      variant="caption"
                      color={active ? colors.brand : colors.onSurfaceMuted}
                      style={[styles.catPillText, active && styles.catPillTextActive]}
                    >
                      {cat.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Results */}
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

            {sections.length === 0 && search.trim() !== '' && (
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={32} color={colors.onSurfaceMuted} />
                <AppText variant="body" color={colors.onSurfaceMuted}>
                  {isIt ? 'Nessun allergene trovato per questa ricerca' : 'No allergens found for this query'}
                </AppText>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 100 + insets.bottom }} />
      </GlassScreenScroll>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <SurfaceButton
          label={busy ? (isIt ? 'Salvataggio profilo…' : 'Saving profile…') : finishLabel}
          onPress={finish}
          disabled={busy || uploading || (all.length === 0 && !error)}
          icon="arrow-forward-outline"
          fullWidth
        />
      </View>

      {/* Severity & Criteria Modal */}
      {configModalTarget && (
        <AllergyConfigModal
          visible={Boolean(configModalTarget)}
          onClose={() => setConfigModalTarget(null)}
          allergenName={isIt ? configModalTarget.name_it : (TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.en || configModalTarget.name_it)}
          allergenEmoji={configModalTarget.emoji ?? undefined}
          isDiet={Boolean(configModalTarget.is_diet)}
          intensity={intensities[configModalTarget.code] || 'moderata'}
          criterio={criteria[configModalTarget.code] || 'assoluto'}
          onSave={(intensity: AllergyIntensity, criterio: AllergyCriterio) => {
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
  screen: { flex: 1, backgroundColor: colors.surface },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  progressContainer: {
    marginBottom: spacing.md,
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  stepBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  progressPercent: {
    fontWeight: '800',
    fontSize: 12,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: 2,
  },
  introBlock: {
    gap: 6,
    marginBottom: spacing.md,
  },
  mainHeading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  uploadCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  uploadTitleGroup: {
    flex: 1,
    gap: 2,
  },
  uploadBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadCardTitle: {
    fontWeight: '800',
    fontSize: 15,
  },
  aiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  aiPillText: {
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  uploadSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redSoft ?? '#fee2e2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
  },
  searchSection: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchTitle: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  selectedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  catPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catPillTextActive: {
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
