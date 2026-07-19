import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../../src/api/client';
import { logoutAndCleanup } from '../../src/services/authSession';
import { useOwner } from '../../src/store/owner';
import { useSession } from '../../src/store/session';
import { CollapseSection, Screen } from '../../src/components/ui';
import { TAB_BAR_CLEARANCE, spacing } from '../../src/theme';

/** Scheda Account del ristoratore. */
export default function OwnerAccount() {
  const { email } = useSession();
  const { restaurants, current, reset } = useOwner();
  const locale = current ?? restaurants[0] ?? null;
  const plan = locale?.business_plan ?? 'free';
  const status = locale?.subscription_status ?? 'free';
  const planLabel = plan === 'base' ? 'Base' : plan === 'pro_notify' ? 'Pro' : 'Gratis';
  const hasMenu = !!locale?.menu_updated_at;
  const hasPublicProfile = !!locale?.city && !!(locale as any)?.address && !!(locale as any)?.phone;
  const hasLegalData = !!(locale as any)?.vat_number && !!(locale as any)?.allergen_manager;
  const setupDone = [!!locale, hasPublicProfile, hasMenu, hasLegalData, plan !== 'free' || status !== 'free'].filter(Boolean).length;
  const setupComplete = setupDone >= 5;

  const [checklistExpanded, setChecklistExpanded] = useState(!setupComplete);
  const [growthExpanded, setGrowthExpanded] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);

  const checklistPreview = useMemo(() => {
    if (setupComplete) return 'Setup completato';
    return `${setupDone}/5 passaggi completati`;
  }, [setupComplete, setupDone]);

  const confirmLogout = () =>
    Alert.alert('Esci dall\'account', 'Vuoi davvero uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci', style: 'destructive',
        onPress: async () => { reset(); await logoutAndCleanup(); router.replace('/welcome'); },
      },
    ]);

  return (
    <Screen edges={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(email ?? 'A')[0].toUpperCase()}</Text></View>
          <Text style={styles.email}>{email ?? 'Account'}</Text>
          <Text style={styles.roleBadge}>Ristoratore</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>La mia attività</Text>
          <Text style={styles.blockSub}>Stato del locale selezionato</Text>
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
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{setupDone}/5</Text>
              <Text style={styles.metricLabel}>setup</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{hasMenu ? 'OK' : 'NO'}</Text>
              <Text style={styles.metricLabel}>menù</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{planLabel}</Text>
              <Text style={styles.metricLabel}>piano</Text>
            </View>
          </View>
        </View>

        <CollapseSection
          icon="checkbox"
          title="Checklist obbligatoria"
          preview={checklistPreview}
          expanded={checklistExpanded}
          onToggle={() => setChecklistExpanded((v) => !v)}
        >
          <ChecklistRow ok={hasPublicProfile} label="Scheda pubblica completa" onPress={() => router.push('/(owner)/locali')} />
          <ChecklistRow ok={hasMenu} label="Menù allergeni pubblicato" onPress={() => router.push('/(owner)/menu')} />
          <ChecklistRow ok={hasLegalData} label="P.IVA e referente allergeni" onPress={() => router.push('/(owner)/locali')} />
          <ChecklistRow ok={plan !== 'free' || status !== 'free'} label="Piano attivo (Base o Pro)" onPress={() => router.push('/(owner)/piano')} />
          <Text style={styles.legalNote}>
            Pubblicando il menù confermi la correttezza degli allergeni dichiarati (Reg. UE 1169/2011).
          </Text>
        </CollapseSection>

        <CollapseSection
          icon="rocket"
          title="Crescita"
          preview="QR, statistiche, piano, boost"
          expanded={growthExpanded}
          onToggle={() => setGrowthExpanded((v) => !v)}
        >
          <NavRow icon="🖨️" title="QR code tavoli" sub="Stampa il QR per i clienti" onPress={() => router.push('/(owner)/qr')} />
          <NavRow icon="📊" title="Statistiche" sub="Visite menù e allergeni cercati" onPress={() => router.push('/(owner)/statistiche')} />
          <NavRow icon="💳" title="Piano e fatturazione" sub="Abbonamento e fatture" onPress={() => router.push('/(owner)/piano')} />
          <NavRow icon="🚀" title="Boost e notifiche push" sub="Visibilità e messaggi ai follower" onPress={() => router.push('/(owner)/crescita')} />
        </CollapseSection>

        <CollapseSection
          icon="help-circle"
          title="Assistenza"
          preview="supporto@allertgy.it"
          expanded={supportExpanded}
          onToggle={() => setSupportExpanded((v) => !v)}
        >
          <NavRow
            icon="✉️"
            title="Contatta l'assistenza"
            sub="supporto@allertgy.it"
            onPress={() => Linking.openURL('mailto:supporto@allertgy.it?subject=Assistenza%20Ristoratori')}
          />
          <View style={styles.item}>
            <Text style={styles.itemIcon}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Informazioni app</Text>
              <Text style={styles.itemSub}>AllerTgy ristoratori · server: {API}</Text>
            </View>
          </View>
        </CollapseSection>

        <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function ChecklistRow({ ok, label, onPress }: { ok: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.checklistRow} onPress={onPress}>
      <Text style={ok ? styles.checkOk : styles.checkWarn}>{ok ? '✓' : '!'}</Text>
      <Text style={styles.checkText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function NavRow({ icon, title, sub, onPress }: { icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  hero: { alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
  avatar: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  avatarText: { fontSize: 24, fontWeight: '800' },
  email: { fontSize: 16, fontWeight: '800' },
  roleBadge: { fontSize: 12, color: '#666' },
  block: { gap: 6 },
  blockTitle: { fontSize: 16, fontWeight: '800' },
  blockSub: { fontSize: 12, color: '#666', marginBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 48 },
  itemIcon: { fontSize: 18, width: 28 },
  itemTitle: { fontWeight: '700', fontSize: 14 },
  itemSub: { color: '#666', fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 20, color: '#999' },
  metricsRow: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  metricBox: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#000', padding: 8, gap: 2 },
  metricValue: { fontSize: 16, fontWeight: '900' },
  metricLabel: { fontSize: 10, color: '#666' },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, minHeight: 44 },
  checkOk: { fontWeight: '900', width: 20 },
  checkWarn: { fontWeight: '900', width: 20 },
  checkText: { flex: 1, fontSize: 13, fontWeight: '600' },
  legalNote: { fontSize: 11, color: '#666', lineHeight: 16, paddingTop: 4 },
  logout: { borderWidth: 1, borderColor: '#000', padding: 14, alignItems: 'center', marginTop: spacing.sm },
  logoutText: { fontWeight: '800', fontSize: 14 },
});
