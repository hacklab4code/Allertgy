import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, TextInput,
} from 'react-native';
import { LANGUAGES } from '../src/constants/languages';
import { useSession } from '../src/store/session';

export default function LanguageScreen() {
  const { language, setLanguage } = useSession();
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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Language / Lingua</Text>
          <Text style={styles.subtitle}>
            Scegli tra {LANGUAGES.length} lingue · Choose from {LANGUAGES.length} languages
          </Text>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca / Search..."
            placeholderTextColor="#8A9A92"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>Nessuna lingua trovata · No language found</Text>
          }
          renderItem={({ item }) => {
            const selected = item.code === current;
            return (
              <TouchableOpacity
                style={[styles.langButton, selected && styles.langButtonSelected]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.langText}>
                  <Text style={styles.label}>{item.nativeLabel}</Text>
                  {item.label !== item.nativeLabel && (
                    <Text style={styles.labelSub}>{item.label}</Text>
                  )}
                </View>
                {selected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#596B63',
    marginBottom: 16,
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE8E2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#10201B',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 10,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE8E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  langButtonSelected: {
    borderColor: '#0F8A6A',
    backgroundColor: '#F0FAF6',
  },
  flag: {
    fontSize: 24,
    marginRight: 14,
  },
  langText: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#10201B',
  },
  labelSub: {
    fontSize: 13,
    color: '#596B63',
    marginTop: 2,
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F8A6A',
    marginLeft: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#596B63',
    fontSize: 15,
    marginTop: 24,
  },
});
