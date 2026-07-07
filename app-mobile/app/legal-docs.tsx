import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../src/api/client';

interface LegalDoc { doc: string; title: string; version: string; content_markdown: string }

const DOCS = ['terms', 'privacy', 'safety', 'cookies'] as const;

/** Testi legali integrali, letti dall'API: stessa fonte della dashboard web. */
export default function LegalDocs() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [active, setActive] = useState<string>('terms');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all(DOCS.map((d) => api.legalDoc(d)))
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, []);

  const current = docs.find((d) => d.doc === active);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Indietro</Text>
      </TouchableOpacity>
      <Text style={styles.title}>📜 Documenti legali</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {docs.length === 0 && !error && <ActivityIndicator color="#059669" style={{ marginTop: 24 }} />}

      <View style={styles.tabs}>
        {docs.map((d) => (
          <TouchableOpacity
            key={d.doc}
            style={[styles.tab, active === d.doc && styles.tabOn]}
            onPress={() => setActive(d.doc)}
          >
            <Text style={[styles.tabText, active === d.doc && styles.tabTextOn]}>{d.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {current && (
        <View style={styles.docBox}>
          <Text style={styles.version}>Versione {current.version}</Text>
          {current.content_markdown.trim().split(/\n\n+/).map((block, i) => (
            <Text key={i} style={block.startsWith('# ') ? styles.docTitle : styles.docText}>
              {block.replace(/^# /, '').replace(/\*\*/g, '').replace(/(^|\s)\*([^*]+)\*/g, '$1$2')}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 48, backgroundColor: '#F7FAF8' },
  back: { color: '#0B5D4D', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#10201B', marginBottom: 14 },
  error: { color: '#dc2626', fontWeight: '700', marginBottom: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tab: {
    borderWidth: 1, borderColor: '#DDE8E2', backgroundColor: '#fff',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  tabOn: { backgroundColor: '#DDF8EA', borderColor: '#0F8A6A' },
  tabText: { fontSize: 12.5, color: '#596B63', fontWeight: '600' },
  tabTextOn: { color: '#0B5D4D', fontWeight: '800' },
  docBox: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 16, padding: 16, gap: 10,
  },
  version: { fontSize: 11, color: '#8AA096', fontWeight: '700', textTransform: 'uppercase' },
  docTitle: { fontSize: 18, fontWeight: '800', color: '#10201B' },
  docText: { fontSize: 13.5, color: '#475569', lineHeight: 20 },
});
