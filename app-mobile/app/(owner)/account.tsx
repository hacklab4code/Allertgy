import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';
import { useSession } from '../../src/store/session';

/** Scheda Account del ristoratore. */
export default function OwnerAccount() {
  const { email, logout } = useSession();
  const { restaurants, reset } = useOwner();

  const confirmLogout = () =>
    Alert.alert('Esci dall\'account', 'Vuoi davvero uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci', style: 'destructive',
        onPress: () => { reset(); logout(); router.replace('/welcome'); },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>
          {(email ?? 'A')[0].toUpperCase()}
        </Text></View>
        <Text style={styles.email}>{email ?? 'Account'}</Text>
        <Text style={styles.roleBadge}>👨‍🍳 Ristoratore</Text>
      </View>

      <Text style={styles.sectionLabel}>LA MIA ATTIVITÀ</Text>
      <View style={styles.card}>
        <View style={styles.item}>
          <Text style={styles.itemIcon}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Locali registrati</Text>
            <Text style={styles.itemSub}>
              {restaurants.length === 0
                ? 'Nessun locale — crealo dalla scheda "Locale"'
                : restaurants.map((r) => `${r.name} (#${r.public_code})`).join(' · ')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>RESPONSABILITÀ</Text>
      <View style={styles.card}>
        <View style={styles.item}>
          <Text style={styles.itemIcon}>⚖️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Veridicità dei dati</Text>
            <Text style={styles.itemSub}>
              Pubblicando il menù confermi la correttezza degli allergeni dichiarati
              (Reg. UE 1169/2011). Aggiorna il menù ad ogni variazione di piatti o ricette.
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>ASSISTENZA</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.item}
          onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20Ristoratori')}>
          <Text style={styles.itemIcon}>✉️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Contatta l'assistenza</Text>
            <Text style={styles.itemSub}>supporto@allertgy.it</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <View style={styles.item}>
          <Text style={styles.itemIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Informazioni</Text>
            <Text style={styles.itemSub}>AllerTgy v0.2 (MVP) · server: {API}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Esci dall'account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 16 },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#059669',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  email: { fontWeight: '700', fontSize: 16, color: '#1e293b', marginTop: 8 },
  roleBadge: {
    marginTop: 4, fontSize: 12, color: '#047857', fontWeight: '700',
    backgroundColor: '#d1fae5', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: '#94a3b8',
    marginTop: 18, marginBottom: 6, marginLeft: 4, letterSpacing: 0.8,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  item: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  itemIcon: { fontSize: 22 },
  itemTitle: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
  itemSub: { color: '#64748b', fontSize: 13, marginTop: 2, lineHeight: 18 },
  chevron: { fontSize: 24, color: '#cbd5e1', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 48 },
  logout: { alignItems: 'center', padding: 16, marginTop: 12 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
