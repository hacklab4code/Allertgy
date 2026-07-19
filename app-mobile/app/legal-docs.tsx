import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { api } from '../src/api/client';
import { AppText, GlassScreenScroll, Screen, Section } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

interface LegalDoc { doc: string; title: string; version: string; content_markdown: string }

const DOCS = ['terms', 'privacy', 'safety', 'cookies'] as const;

/** Testi legali integrali, letti dall'API: stessa fonte della dashboard web. */
export default function LegalDocs() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [active, setActive] = useState<string>('terms');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all(DOCS.map((d) => api.legalDoc(d)))
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (params.tab && DOCS.includes(params.tab as typeof DOCS[number])) {
      setActive(params.tab);
    }
  }, [params.tab]);

  const current = docs.find((d) => d.doc === active);

  return (
    <Screen edges={false} ambient>
      <Stack.Screen options={{ title: 'Documenti legali' }} />
      <GlassScreenScroll showsVerticalScrollIndicator={false}>
        {error ? <AppText variant="caption" color={colors.red}>{error}</AppText> : null}
        {docs.length === 0 && !error ? <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.lg }} /> : null}

        {docs.length > 0 ? (
          <Section title="Seleziona documento" subtitle="Termini, privacy, sicurezza e cookie.">
            <View style={styles.tabs}>
              {docs.map((d) => (
                <Pressable
                  key={d.doc}
                  style={[styles.tab, active === d.doc && styles.tabOn]}
                  onPress={() => setActive(d.doc)}
                >
                  <AppText variant="caption" style={active === d.doc ? styles.tabTextOn : styles.tabText}>
                    {d.title}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        {current ? (
          <Section title={current.title} subtitle={`Versione ${current.version}`}>
            <View style={styles.docBox}>
              {current.content_markdown.trim().split(/\n\n+/).map((block, i) => (
                <AppText
                  key={i}
                  variant={block.startsWith('# ') ? 'title' : 'body'}
                  style={styles.docText}
                >
                  {block.replace(/^# /, '').replace(/\*\*/g, '').replace(/(^|\s)\*([^*]+)\*/g, '$1$2')}
                </AppText>
              ))}
            </View>
          </Section>
        ) : null}
      </GlassScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabOn: { backgroundColor: colors.brand50, borderColor: colors.brand },
  tabText: { color: colors.onSurfaceMuted, fontWeight: '600' },
  tabTextOn: { color: colors.brand, fontWeight: '800' },
  docBox: { gap: spacing.sm },
  docText: { color: colors.onSurfaceMuted, lineHeight: 20 },
});
