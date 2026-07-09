import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../../src/api/client';
import DetailSection from '../../src/components/DetailSection';
import { useOwner } from '../../src/store/owner';
import { useSession } from '../../src/store/session';

/** Scheda Account del ristoratore. */
export default function OwnerAccount() {
  const { email, logout } = useSession();
  const { restaurants, current, reset } = useOwner();
  const locale = current ?? restaurants[0] ?? null;
  const plan = locale?.business_plan ?? 'free';
  const status = locale?.subscription_status ?? 'free';
  const planLabel = plan === 'base' ? 'Base' : plan === 'pro_notify' ? 'Pro' : 'Gratis';
  const hasMenu = !!locale?.menu_updated_at;
  const hasPublicProfile = !!locale?.city && !!(locale as any)?.address && !!(locale as any)?.phone;
  const hasLegalData = !!(locale as any)?.vat_number && !!(locale as any)?.allergen_manager;
  const setupDone = [!!locale, hasPublicProfile, hasMenu, hasLegalData, plan !== 'free' || status !== 'free'].filter(Boolean).length;

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

      <DetailSection
        title="LA MIA ATTIVITÀ"
        subtitle="Stato del locale selezionato e avanzamento setup operativo."
        padded={false}
      >
        <TouchableOpacity style={styles.item} onPress={() => router.push('/(owner)/locali')}>
          <Text style={styles.itemIcon}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{locale ? locale.name : 'Nessun locale selezionato'}</Text>
            <Text style={styles.itemSub}>
              {locale
                ? `${locale.city || 'Città da completare'} · codice ${locale.public_code} · ${restaurants.length} ${restaurants.length === 1 ? 'locale' : 'locali'}`
                : 'Crea il primo locale dalla sezione Attività.'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{setupDone}/5</Text>
            <Text style={styles.metricLabel}>setup attività</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{hasMenu ? 'OK' : 'NO'}</Text>
            <Text style={styles.metricLabel}>menù pubblicato</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{planLabel}</Text>
            <Text style={styles.metricLabel}>piano</Text>
          </View>
        </View>
      </DetailSection>

      <DetailSection
        title="CHECKLIST OBBLIGATORIA"
        subtitle="Passaggi richiesti prima che il menù sia valido e completo per i clienti."
        padded={false}
      >
        <View style={styles.checklistRow}>
          <Text style={hasPublicProfile ? styles.checkOk : styles.checkWarn}>{hasPublicProfile ? '✓' : '!'}</Text>
          <Text style={styles.checkText}>Scheda pubblica completa con città, indirizzo e telefono</Text>
        </View>
        <View style={styles.separatorTight} />
        <View style={styles.checklistRow}>
          <Text style={hasMenu ? styles.checkOk : styles.checkWarn}>{hasMenu ? '✓' : '!'}</Text>
          <Text style={styles.checkText}>Menù allergeni pubblicato e aggiornato</Text>
        </View>
        <View style={styles.separatorTight} />
        <View style={styles.checklistRow}>
          <Text style={hasLegalData ? styles.checkOk : styles.checkWarn}>{hasLegalData ? '✓' : '!'}</Text>
          <Text style={styles.checkText}>Partita IVA e referente allergeni compilati</Text>
        </View>
        <View style={styles.separator} />
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
      </DetailSection>

      <DetailSection
        title="CRESCITA"
        subtitle="Visibilità extra e comunicazioni ai clienti che seguono il locale."
        padded={false}
      >
        <TouchableOpacity style={styles.item} onPress={() => router.push('/(owner)/crescita')}>
          <Text style={styles.itemIcon}>🚀</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Boost e notifiche push</Text>
            <Text style={styles.itemSub}>
              Attiva il Boost visibilità (€9,90) o invia messaggi ai clienti che ti seguono (piano Pro).
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </DetailSection>

      <DetailSection
        title="ASSISTENZA"
        subtitle="Supporto tecnico e informazioni sull'app ristoratori."
        padded={false}
      >
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
            <Text style={styles.itemTitle}>Informazioni app</Text>
            <Text style={styles.itemSub}>AllerTgy ristoratori · server: {API}</Text>
          </View>
        </View>
      </DetailSection>

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
  separatorTight: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 14 },
  metricsRow: { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 4 },
  metricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    alignItems: 'center',
  },
  metricValue: { color: '#047857', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  metricLabel: { color: '#64748b', fontWeight: '800', fontSize: 10, textAlign: 'center', marginTop: 3 },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkOk: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d1fae5',
    color: '#047857',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 22,
  },
  checkWarn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 22,
  },
  checkText: { flex: 1, color: '#475569', fontSize: 12.5, fontWeight: '700', lineHeight: 17 },
  logout: { alignItems: 'center', padding: 16, marginTop: 12 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
