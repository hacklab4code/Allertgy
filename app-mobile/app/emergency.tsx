import { Stack, router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../src/store/session';
import { getAllergenName, t } from '../src/engine/translations';

export default function EmergencyScreen() {
  const { allergie, emergencyMedicines, language, emergencyContactName, emergencyContactPhone } = useSession();

  const handleCall112 = () => {
    Linking.openURL('tel:112').catch(() => {
      alert("Chiamata telefonica non supportata su questo dispositivo.");
    });
  };

  const handleCallContact = () => {
    if (!emergencyContactPhone) return;
    Linking.openURL(`tel:${emergencyContactPhone}`).catch(() => {
      alert("Chiamata telefonica non supportata su questo dispositivo.");
    });
  };

  const handleSendSMS = () => {
    const listAllergie = allergie.map((a) => getAllergenName(a, language)).join(', ');
    const listMedicines = emergencyMedicines || t('none_declared', language);

    const bodyText = `${t('sos_message_prefix', language)} ${listAllergie}. ${t('sos_medicines_label', language)} ${listMedicines}.`;

    const smsUrl = emergencyContactPhone
      ? `sms:${emergencyContactPhone}?body=${encodeURIComponent(bodyText)}`
      : `sms:?body=${encodeURIComponent(bodyText)}`;

    Linking.openURL(smsUrl).catch(() => {
      alert("Invio SMS non supportato su questo dispositivo.");
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('emergency_title', language),
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
            {t('emergency_banner', language)}
          </Text>
          <Text style={styles.alertSubtitle}>
            {t('emergency_show', language)}
          </Text>
        </View>

        {/* Informazioni sulle allergie */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            {t('allergies_section', language)}
          </Text>
          {allergie.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('no_allergies', language)}
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
            {t('emergency_drugs_section', language)}
          </Text>
          <Text style={styles.medicineText}>
            {emergencyMedicines || t('no_drugs', language)}
          </Text>
          {emergencyMedicines && (
            <Text style={styles.medicineWarning}>
              {t('drug_warning', language)}
            </Text>
          )}
        </View>

        {/* Azioni Rapide */}
        <View style={{ gap: 14, marginTop: 10 }}>
          {/* Pulsante Chiamata Contatto di Emergenza (se configurato) */}
          {emergencyContactPhone && (
            <TouchableOpacity style={[styles.sosButton, { backgroundColor: '#059669', shadowColor: '#059669' }]} onPress={handleCallContact}>
              <Text style={styles.sosButtonEmoji}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosButtonText}>
                  {t('call_contact', language)} {emergencyContactName?.toUpperCase() || ''}
                </Text>
                <Text style={[styles.sosButtonSub, { color: '#d1fae5' }]}>
                  {emergencyContactPhone}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Pulsante Chiamata 112 */}
          <TouchableOpacity style={styles.sosButton} onPress={handleCall112}>
            <Text style={styles.sosButtonEmoji}>🚑</Text>
            <View>
              <Text style={styles.sosButtonText}>
                {t('call_emergency', language)}
              </Text>
              <Text style={styles.sosButtonSub}>
                {t('call_emergency_sub', language)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Pulsante SMS SOS */}
          <TouchableOpacity style={styles.smsButton} onPress={handleSendSMS}>
            <Text style={styles.smsButtonEmoji}>💬</Text>
            <View>
              <Text style={styles.smsButtonText}>
                {t('send_sos', language)}
              </Text>
              <Text style={styles.smsButtonSub}>
                {t('send_sos_sub', language)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Chiusura */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>
            {t('close_back', language)}
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
