import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';

export default function LegalScreen() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [health, setHealth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setLegalStatus, language } = useSession();
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';

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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Stack.Screen options={{ headerRight: undefined }} />
      <LanguageFlagsRow />
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.icon}>⚖️</Text>
        <Text style={styles.title}>{t('legal_title')}</Text>
        <Text style={styles.text}>{t('legal_intro')}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.box}>
          <Check 
            checked={terms} 
            onPress={() => setTerms(!terms)} 
            text={isIt ? "Accetto i Termini di servizio dell'app." : "I accept the App Terms of Service."} 
          />
          <Check 
            checked={privacy} 
            onPress={() => setPrivacy(!privacy)} 
            text={isIt ? "Ho letto l'Informativa Privacy e so che posso revocare o modificare i dati dal profilo." : "I have read the Privacy Policy and know that I can revoke or modify my data in my profile."} 
          />
          <Check 
            checked={health} 
            onPress={() => setHealth(!health)} 
            text={isIt ? "Acconsento esplicitamente al trattamento dei dati su allergie, intolleranze e preferenze alimentari per personalizzare il menu." : "I explicitly consent to the processing of data on allergies, intolerances and dietary preferences to customize the menu."} 
          />
        </View>

        <TouchableOpacity style={[styles.button, (!ready || busy) && styles.disabled]} disabled={!ready || busy} onPress={accept}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('accept_continue')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
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
