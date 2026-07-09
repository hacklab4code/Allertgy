import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleProp, StyleSheet, Text,
  TextInput, TextStyle, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import { getSectionTitle, groupAllergensBySection, getLang, TRANSLATED_ALLERGENS } from '../src/engine/translations';
import type { Allergen } from '../src/types';
import ShareProfileModal from '../src/components/ShareProfileModal';
import { useTranslation } from '../src/constants/translations';

export default function Allergie() {
  const [all, setAll] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(useSession.getState().allergie),
  );
  const [intensities, setIntensities] = useState<Record<string, 'lieve' | 'moderata' | 'grave'>>(
    useSession.getState().allergyIntensities || {}
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const { setAllergie, setProfileCompleted, language, token, email } = useSession();
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const lang = getLang(language);

  useEffect(() => {
    api.allergens().then(setAll).catch((e) => setError(e.message));
  }, []);

  // Filtra le sezioni in base alla ricerca
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
            (a.code && a.code.toLowerCase().includes(q)) ||
            (a.emoji && a.emoji.includes(q))
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [all, search]);

  const totalFiltered = useMemo(
    () => sections.reduce((acc, s) => acc + s.items.length, 0),
    [sections]
  );

  const toggle = (code: string) => {
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelected(next);
  };

  const updateIntensity = (code: string, level: 'lieve' | 'moderata' | 'grave') => {
    if (!selected.has(code)) {
      const next = new Set(selected);
      next.add(code);
      setSelected(next);
    }
    setIntensities((prev) => ({ ...prev, [code]: level }));
  };

  const onLongPress = (code: string, name: string) => {
    Alert.alert(
      isIt ? `Intensità: ${name}` : `Severity: ${name}`,
      isIt ? `Imposta quanto è grave questa allergia:` : `Set how severe this allergy is:`,
      [
        { text: isIt ? 'Lieve' : 'Mild', onPress: () => updateIntensity(code, 'lieve') },
        { text: isIt ? 'Moderata' : 'Moderate', onPress: () => updateIntensity(code, 'moderata') },
        { text: isIt ? 'Grave/Anafilassi' : 'Severe/Anaphylaxis', onPress: () => updateIntensity(code, 'grave'), style: 'destructive' },
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const save = async (options?: { silent?: boolean }) => {
    setBusy(true);
    setError('');
    try {
      const codes = [...selected];
      await api.saveAllergens(codes, intensities);
      setAllergie(codes, intensities);
      setProfileCompleted(true);
      if (!options?.silent) router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const openShare = async () => {
    const saved = new Set(useSession.getState().allergie);
    const changed =
      selected.size !== saved.size ||
      [...selected].some((code) => !saved.has(code));
    if (changed) {
      setBusy(true);
      try {
        const codes = [...selected];
        await api.saveAllergens(codes, intensities);
        setAllergie(codes, intensities);
        setProfileCompleted(true);
      } catch (e) {
        Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setShareOpen(true);
  };

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
        onLongPress={() => onLongPress(a.code, isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it))}
        delayLongPress={300}
      >
        <Text style={textStyle}>
          {a.emoji} {isIt ? a.name_it : (TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en || a.name_it)}
          {on && intensities[a.code] === 'lieve' && (isIt ? ' (Lieve)' : ' (Mild)')}
          {on && (!intensities[a.code] || intensities[a.code] === 'moderata') && ' (Mod.)'}
          {on && intensities[a.code] === 'grave' && (isIt ? ' (Grave)' : ' (Severe)')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Stack.Screen options={{ headerRight: undefined }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('select_allergies_title')}</Text>
        <Text style={styles.subtitle}>{t('select_allergies_subtitle')}</Text>

        {token && (
          <TouchableOpacity style={styles.shareCard} onPress={openShare}>
            <Text style={styles.shareCardIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareCardTitle}>
                {isIt ? 'Condividi le mie allergie' : 'Share my allergies'}
              </Text>
              <Text style={styles.shareCardSub}>
                {isIt
                  ? 'Invia il profilo a contatti del telefono o utenti AllerTgy (24h o per sempre).'
                  : 'Send your profile to phone contacts or AllerTgy users (24h or permanent).'}
              </Text>
            </View>
            <Text style={styles.shareChevron}>›</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {all.length === 0 && !error ? <ActivityIndicator style={{ marginTop: 40 }} /> : null}

        {/* Barra di ricerca */}
        {all.length > 0 && (
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_allergen_placeholder')}
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Counter risultati ricerca */}
        {search.trim() !== '' && (
          <Text style={styles.searchCount}>
            {totalFiltered > 0
              ? (isIt ? `${totalFiltered} risultati per "${search}"` : `${totalFiltered} results for "${search}"`)
              : (isIt ? `Nessun risultato per "${search}"` : `No results for "${search}"`)}
          </Text>
        )}

        {sections.map((section) => (
          <View key={section.key} style={styles.sectionBlock}>
            <Text style={[
              styles.section,
              section.key === 'preferenze' && styles.sectionDiet,
            ]}>
              {getSectionTitle(section.key, lang)}
            </Text>
            <View style={styles.grid}>
              {section.items.map((a) => <Chip key={a.code} a={a} />)}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.save, (busy || (all.length === 0 && !error)) && { opacity: 0.4 }]}
        disabled={busy || (all.length === 0 && !error)}
        onPress={() => save()}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveText}>
              {selected.size === 0 
                ? (isIt ? 'Continua senza allergie' : 'Continue without allergies') 
                : (isIt ? `Salva profilo (${selected.size} selezionati)` : `Save profile (${selected.size} selected)`)}
            </Text>}
      </TouchableOpacity>

      <ShareProfileModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        profileId={null}
        profileLabel={email?.split('@')[0] || (isIt ? 'Io' : 'Me')}
        isIt={isIt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 21, fontWeight: '900', color: '#0f172a', letterSpacing: -0.4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 12, lineHeight: 19 },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  shareCardIcon: { fontSize: 22 },
  shareCardTitle: { fontWeight: '800', color: '#065f46', fontSize: 14 },
  shareCardSub: { color: '#047857', fontSize: 12, marginTop: 2, lineHeight: 17 },
  shareChevron: { fontSize: 22, color: '#059669', fontWeight: '600' },
  // --- Search bar ---
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    padding: 0,
  },
  searchClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchClearText: { fontSize: 10, color: '#64748b', fontWeight: '900' },
  searchCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 2,
  },
  // --- Sections ---
  sectionBlock: { marginBottom: 8 },
  section: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 20, marginBottom: 10, letterSpacing: -0.2 },
  sectionDiet: { color: '#16a34a' },
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
