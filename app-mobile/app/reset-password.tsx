import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { api } from '../src/api/client';

/** Aperta dal deep link allertgy://reset-password?token=... nell'email di recupero. */
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      setError('Le due password non coincidono');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.resetPassword(token ?? '', password);
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AllerTgy</Text>
        <View style={styles.heading}>
          <Text style={styles.title}>Nuova password</Text>
          <Text style={styles.tagline}>Scegli una nuova password per il tuo account.</Text>
        </View>

        {!token && <Text style={styles.error}>Link non valido: manca il token. Richiedi un nuovo link.</Text>}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {done ? (
          <View style={{ gap: 16 }}>
            <Text style={styles.success}>✅ Password aggiornata. Ora puoi accedere.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
              <Text style={styles.buttonText}>Vai all'accesso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Nuova password</Text>
              <TextInput
                style={styles.input} placeholder="Minimo 8 caratteri, maiuscole e numeri"
                secureTextEntry value={password} onChangeText={setPassword}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Conferma password</Text>
              <TextInput
                style={styles.input} placeholder="Ripeti la nuova password"
                secureTextEntry value={confirm} onChangeText={setConfirm}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, (busy || !token || password.length < 8) && styles.disabled]}
              disabled={busy || !token || password.length < 8}
              onPress={submit}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Imposta password</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7FAF8' },
  container: { flexGrow: 1, padding: 24, paddingTop: 70 },
  logo: { fontSize: 22, fontWeight: '800', color: '#0B5D4D', marginBottom: 28 },
  heading: { gap: 6, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#10201B' },
  tagline: { color: '#596B63', fontSize: 15, lineHeight: 22 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#596B63' },
  input: {
    height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE8E2',
    borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#10201B',
  },
  button: {
    height: 52, backgroundColor: '#0F8A6A', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#dc2626', marginBottom: 12, fontWeight: '700' },
  success: { color: '#0B5D4D', fontWeight: '700', fontSize: 15 },
});
