import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../src/api/client';
import { getFlagEmoji } from '../src/constants/languages';
import { useSession } from '../src/store/session';

export default function LegalScreen() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [health, setHealth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setLegalStatus, language } = useSession();

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = await api.acceptLegalConsents(health);
      setLegalStatus(profile.legal_consents_ok, !!profile.health_data_consent_at);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const ready = terms && privacy && health;

  return (
    <>
      <Stack.Screen options={{ 
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/language')} style={{ marginRight: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F8A6A' }}>{getFlagEmoji(language)} {(language || 'it').toUpperCase()}</Text>
          </TouchableOpacity>
        ) 
      }} />
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>⚖️</Text>
      <Text style={styles.title}>Termini, privacy e dati salute</Text>
      <Text style={styles.text}>
        AllerTgy usa i dati che inserisci su allergie, intolleranze e preferenze alimentari
        solo per confrontarli con i menu dei locali e mostrarti il semaforo personalizzato.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.box}>
        <Check checked={terms} onPress={() => setTerms(!terms)} text="Accetto i Termini di servizio dell'app." />
        <Check checked={privacy} onPress={() => setPrivacy(!privacy)} text="Ho letto l'Informativa Privacy e so che posso revocare o modificare i dati dal profilo." />
        <Check checked={health} onPress={() => setHealth(!health)} text="Acconsento esplicitamente al trattamento dei dati su allergie, intolleranze e preferenze alimentari per personalizzare il menu." />
      </View>

      <TouchableOpacity style={[styles.button, (!ready || busy) && styles.disabled]} disabled={!ready || busy} onPress={accept}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Accetta e continua</Text>}
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

function Check({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  icon: { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: '#0f172a' },
  text: { marginTop: 10, marginBottom: 18, color: '#475569', textAlign: 'center', lineHeight: 22, fontSize: 14 },
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 14, gap: 12 },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: {
    width: 23, height: 23, borderRadius: 6, borderWidth: 1.5,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#059669', borderColor: '#059669' },
  checkboxMark: { color: '#fff', fontWeight: '900', fontSize: 14 },
  checkText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  button: { marginTop: 18, backgroundColor: '#059669', borderRadius: 14, padding: 16, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  error: { color: '#dc2626', textAlign: 'center', marginBottom: 10 },
});
