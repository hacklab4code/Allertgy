import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSession } from '../../src/store/session';

/** Scheda Cerca: codice locale o QR. */
export default function Home() {
  const [code, setCode] = useState('');
  const { allergie, recents } = useSession();

  const go = (c?: string) => {
    const target = (c ?? code).trim();
    if (target.length >= 4) router.push(`/menu/${target}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Riepilogo profilo */}
      <View style={styles.profileBanner}>
        <Text style={styles.profileEmoji}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileTitle}>Profilo attivo</Text>
          <Text style={styles.profileText}>
            {allergie.length} allergie/preferenze impostate — i menù saranno filtrati su di te.
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Dove stai mangiando?</Text>
      <Text style={styles.subtitle}>
        Scansiona il QR sul tavolo o inserisci il codice del locale
      </Text>

      <TouchableOpacity style={styles.qr} onPress={() => router.push('/scanner')}>
        <Text style={styles.qrEmoji}>📷</Text>
        <Text style={styles.qrText}>Scansiona QR Code</Text>
        <Text style={styles.qrSub}>Il modo più veloce al tavolo</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} /><Text style={styles.or}>oppure</Text><View style={styles.line} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Codice locale (es. 100001)"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
        onSubmitEditing={() => go()}
      />
      <TouchableOpacity
        style={[styles.button, code.trim().length < 4 && { opacity: 0.4 }]}
        disabled={code.trim().length < 4}
        onPress={() => go()}
      >
        <Text style={styles.buttonText}>Mostra il menù</Text>
      </TouchableOpacity>

      {recents.length > 0 && (
        <View style={styles.recentsBox}>
          <Text style={styles.recentsTitle}>Ultimo locale visitato</Text>
          <TouchableOpacity style={styles.recent} onPress={() => go(recents[0].code)}>
            <Text style={styles.recentName}>🍽 {recents[0].name}</Text>
            <Text style={styles.recentCode}>#{recents[0].code}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/locali')}>
            <Text style={styles.allRecents}>Vedi tutti i miei locali →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 16, paddingBottom: 48 },
  profileBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1,
    borderRadius: 14, padding: 12, marginBottom: 20,
  },
  profileEmoji: { fontSize: 24 },
  profileTitle: { fontWeight: '800', color: '#065f46', fontSize: 13 },
  profileText: { color: '#047857', fontSize: 12, marginTop: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 20 },
  qr: {
    backgroundColor: '#059669', borderRadius: 16, padding: 22, alignItems: 'center',
  },
  qrEmoji: { fontSize: 34 },
  qrText: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 6 },
  qrSub: { color: '#a7f3d0', fontSize: 12, marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  or: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 16, fontSize: 20, textAlign: 'center',
    letterSpacing: 4, marginBottom: 12,
  },
  button: {
    borderWidth: 1.5, borderColor: '#059669', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  buttonText: { color: '#047857', fontWeight: '700', fontSize: 16 },
  recentsBox: {
    marginTop: 28, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0', padding: 16,
  },
  recentsTitle: { fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  recent: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  recentName: { color: '#1e293b', fontWeight: '600' },
  recentCode: { color: '#94a3b8' },
  allRecents: { color: '#047857', fontWeight: '700', fontSize: 13, marginTop: 8 },
});
