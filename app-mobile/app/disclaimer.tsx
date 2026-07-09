import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import LanguageFlagsRow from '../src/components/LanguageFlagsRow';
import { useTranslation } from '../src/constants/translations';

export default function Disclaimer() {
  const [talkToStaff, setTalkToStaff] = useState(false);
  const [supportOnly, setSupportOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const { setDisclaimer, language } = useSession();
  const { t } = useTranslation();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const accept = async () => {
    setBusy(true);
    try {
      await api.acceptDisclaimer();
      setDisclaimer(true);
      router.replace('/(tabs)/home');
    } catch {
      setDisclaimer(true);
      router.replace('/(tabs)/home');
    }
    setBusy(false);
  };

  const ready = talkToStaff && supportOnly;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAF8' }}>
      <Stack.Screen options={{ headerRight: undefined }} />
      <LanguageFlagsRow />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{t('safety_title')}</Text>
        <Text style={styles.text}>
          {isIt ? "AllerTgy ti aiuta a orientarti nel menù, ma non sostituisce la comunicazione diretta con il ristorante." : "AllerTgy helps you navigate the menu, but does not replace direct communication with the restaurant."}
          {'\n\n'}
          <Text style={{ fontWeight: '700' }}>
            {isIt ? "Comunica SEMPRE le tue allergie al personale di sala" : "ALWAYS communicate your allergies to the staff"}
          </Text>{' '}
          {isIt 
            ? "prima di ordinare. Le informazioni sugli allergeni sono fornite dal ristoratore e potrebbero non riflettere variazioni dell'ultimo minuto in cucina." 
            : "before ordering. Allergen information is provided by the owner and may not reflect last-minute changes in the kitchen."}
        </Text>

        <View style={styles.checkBox}>
          <Check 
            checked={talkToStaff} 
            onPress={() => setTalkToStaff(!talkToStaff)} 
            text={isIt ? "Mi impegno a comunicare le allergie al personale prima di ordinare." : "I promise to communicate allergies to staff before ordering."} 
          />
          <Check 
            checked={supportOnly} 
            onPress={() => setSupportOnly(!supportOnly)} 
            text={isIt ? "Ho capito che AllerTgy è uno strumento di supporto e non sostituisce il confronto con il locale o un parere medico." : "I understand that AllerTgy is a support tool and does not replace consulting the staff or medical advice."} 
          />
        </View>

        <TouchableOpacity style={[styles.button, (!ready || busy) && styles.disabled]} disabled={!ready || busy} onPress={accept}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isIt ? "Confermo e continuo" : "Confirm and continue"}</Text>}
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
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#1e293b', marginBottom: 16 },
  text: { fontSize: 15, lineHeight: 23, color: '#475569', textAlign: 'center' },
  button: {
    marginTop: 32, backgroundColor: '#059669', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  checkBox: {
    marginTop: 20, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0', padding: 14, gap: 12,
  },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: {
    width: 23, height: 23, borderRadius: 6, borderWidth: 1.5,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#059669', borderColor: '#059669' },
  checkboxMark: { color: '#fff', fontWeight: '900', fontSize: 14 },
  checkText: { flex: 1, color: '#475569', fontSize: 12, lineHeight: 18, fontWeight: '600' },
});
