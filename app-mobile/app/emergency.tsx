import { Stack, router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../src/store/session';
import { getAllergenName } from '../src/engine/translations';

export default function EmergencyScreen() {
  const { allergie, emergencyMedicines, language } = useSession();

  const handleCall112 = () => {
    Linking.openURL('tel:112').catch(() => {
      alert("Chiamata telefonica non supportata su questo dispositivo.");
    });
  };

  const handleSendSMS = () => {
    const listAllergie = allergie.map((a) => getAllergenName(a, language)).join(', ');
    const listMedicines = emergencyMedicines || (language === 'en' ? 'None declared' : 'Nessuno dichiarato');
    
    const bodyText = language === 'en' 
      ? `AllerTgy SOS! I am having a severe allergic reaction. Allergies: ${listAllergie}. Emergency medicines: ${listMedicines}.`
      : `AllerTgy SOS! Sto avendo una reazione allergica grave. Allergie: ${listAllergie}. Farmaci salvavita: ${listMedicines}.`;
      
    Linking.openURL(`sms:?body=${encodeURIComponent(bodyText)}`).catch(() => {
      alert("Invio SMS non supportato su questo dispositivo.");
    });
  };

  const isIt = language === 'it';

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: isIt ? 'Emergenza Medica' : 'Medical Emergency',
          headerStyle: { backgroundColor: '#b91c1c' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '900' }
        }} 
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner principale di allarme */}
        <View style={styles.alertCard}>
          <Text style={styles.alertEmoji}>🚨</Text>
          <Text style={styles.alertTitle}>
            {isIt ? 'SCHERMATA SALVAVITA' : 'LIFESAVING INFO'}
          </Text>
          <Text style={styles.alertSubtitle}>
            {isIt 
              ? 'Mostra questa schermata al personale medico o a chi ti presta soccorso' 
              : 'Show this screen to medical staff or first responders'}
          </Text>
        </View>

        {/* Informazioni sulle allergie */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            {isIt ? '🛡️ ALLERGIE E INTOLLERANZE:' : '🛡️ ALLERGIES & INTOLERANCES:'}
          </Text>
          {allergie.length === 0 ? (
            <Text style={styles.emptyText}>
              {isIt ? 'Nessuna allergia selezionata nel profilo.' : 'No allergies selected in profile.'}
            </Text>
          ) : (
            <View style={styles.badgeContainer}>
              {allergie.map((code) => {
                const name = getAllergenName(code, language);
                return (
                  <View key={code} style={styles.allergenBadge}>
                    <Text style={styles.allergenBadgeText}>⚠️ {name.toUpperCase()}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Farmaci Salvavita */}
        <View style={[styles.sectionCard, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.sectionHeader, { color: '#991b1b' }]}>
            {isIt ? '💊 FARMACI SALVAVITA ASSOCIATI:' : '💊 PERSONAL EMERGENCY DRUGS:'}
          </Text>
          <Text style={styles.medicineText}>
            {emergencyMedicines || (isIt ? 'Nessun farmaco dichiarato' : 'No emergency drugs declared')}
          </Text>
          {emergencyMedicines && (
            <Text style={styles.medicineWarning}>
              {isIt 
                ? '⚠️ Se necessario, autosomministra immediatamente il farmaco (es. adrenalina autoiniettabile).' 
                : '⚠️ If needed, immediately self-administer the medication (e.g. epinephrine autoinjector).'}
            </Text>
          )}
        </View>

        {/* Azioni Rapide */}
        <View style={{ gap: 14, marginTop: 10 }}>
          {/* Pulsante Chiamata 112 */}
          <TouchableOpacity style={styles.sosButton} onPress={handleCall112}>
            <Text style={styles.sosButtonEmoji}>📞</Text>
            <View>
              <Text style={styles.sosButtonText}>
                {isIt ? 'CHIAMA SOCCORSI (112)' : 'CALL EMERGENCY SERVICES (112)'}
              </Text>
              <Text style={styles.sosButtonSub}>
                {isIt ? 'Avvia chiamata telefonica di emergenza' : 'Start emergency phone call'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Pulsante SMS SOS */}
          <TouchableOpacity style={styles.smsButton} onPress={handleSendSMS}>
            <Text style={styles.smsButtonEmoji}>💬</Text>
            <View>
              <Text style={styles.smsButtonText}>
                {isIt ? 'INVIA SMS DI SOS' : 'SEND SOS TEXT MESSAGE'}
              </Text>
              <Text style={styles.smsButtonSub}>
                {isIt 
                  ? 'Invia SMS di aiuto con la lista delle tue allergie' 
                  : 'Send help text with your active allergy list'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Chiusura */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>
            {isIt ? 'Chiudi e Torna Indietro' : 'Close and Go Back'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 18, backgroundColor: '#f8fafc' },
  alertCard: {
    backgroundColor: '#b91c1c',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#b91c1c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  alertEmoji: { fontSize: 42, marginBottom: 8 },
  alertTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  alertSubtitle: { color: '#fee2e2', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18, fontWeight: '500' },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergenBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  allergenBadgeText: { color: '#b91c1c', fontSize: 11, fontWeight: '800' },
  medicineText: { color: '#b91c1c', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  medicineWarning: { color: '#7f1d1d', fontSize: 11, fontWeight: '600', lineHeight: 16 },
  sosButton: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sosButtonEmoji: { fontSize: 28 },
  sosButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  sosButtonSub: { color: '#fca5a5', fontSize: 11, marginTop: 1, fontWeight: '500' },
  smsButton: {
    backgroundColor: '#475569',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  smsButtonEmoji: { fontSize: 28 },
  smsButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  smsButtonSub: { color: '#cbd5e1', fontSize: 11, marginTop: 1, fontWeight: '500' },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  closeButtonText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
});
