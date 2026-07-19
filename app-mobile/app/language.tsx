import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { LANGUAGES } from '../src/constants/languages';
import { useSession } from '../src/store/session';
import { AppText, DebossedInput, Screen, Section } from '../src/components/ui';
import { colors, spacing, MIN_TOUCH_TARGET } from '../src/theme';

export default function LanguageScreen() {
  const { language, setLanguage, token } = useSession();
  const [query, setQuery] = useState('');
  const current = (language || 'it').toLowerCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.code.includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.nativeLabel.toLowerCase().includes(q),
    );
  }, [query]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    if (token) {
      router.replace('/');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <Screen edges={false}>
      <Stack.Screen options={{ title: 'Lingua / Language' }} />
      <Section
        title="Language / Lingua"
        subtitle={`Scegli tra ${LANGUAGES.length} lingue · Choose from ${LANGUAGES.length} languages`}
        style={styles.headerSection}
      >
        <DebossedInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cerca / Search..."
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </Section>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <AppText variant="subtitle" style={styles.empty}>
            Nessuna lingua trovata · No language found
          </AppText>
        }
        renderItem={({ item }) => {
          const selected = item.code === current;
          return (
            <Pressable
              style={[styles.langButton, selected && styles.langButtonSelected]}
              onPress={() => handleSelect(item.code)}
            >
              <AppText variant="title">{item.flag}</AppText>
              <View style={styles.langText}>
                <AppText variant="bodyBold">{item.nativeLabel}</AppText>
                {item.label !== item.nativeLabel ? (
                  <AppText variant="caption" color={colors.onSurfaceMuted}>{item.label}</AppText>
                ) : null}
              </View>
              {selected ? <AppText variant="bodyBold" color={colors.brand}>✓</AppText> : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: MIN_TOUCH_TARGET,
    gap: spacing.md,
  },
  langButtonSelected: { borderColor: colors.brand, backgroundColor: colors.brand50 },
  langText: { flex: 1 },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
