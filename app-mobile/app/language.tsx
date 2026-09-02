import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES } from '../src/constants/languages';
import { useSession } from '../src/store/session';
import { AppText, DebossedInput, Screen, ScreenTopHeader, Section } from '../src/components/ui';
import { colors, radius, spacing, MIN_TOUCH_TARGET } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    <Screen edges={false} ambient>
      <ScreenTopHeader title="Lingua / Language" />
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
              style={({ pressed }) => [
                styles.langButton,
                selected && styles.langButtonSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => handleSelect(item.code)}
            >
              <AppText variant="title">{item.flag}</AppText>
              <View style={styles.langText}>
                <AppText variant="bodyBold">{item.nativeLabel}</AppText>
                {item.label !== item.nativeLabel ? (
                  <AppText variant="caption" color={colors.onSurfaceMuted}>{item.label}</AppText>
                ) : null}
              </View>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.onSurfaceMuted,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: MIN_TOUCH_TARGET,
    gap: 14,
  },
  langButtonSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  langText: {
    flex: 1,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
