import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  loadShareContacts,
  openGenericShare,
  shareWithContact,
  createAndDeliverShare,
  type ShareContactRow,
  type ShareDuration,
} from '../services/shareProfile';

type Props = {
  visible: boolean;
  onClose: () => void;
  profileId: number | null;
  profileLabel: string;
  isIt: boolean;
};

export default function ShareProfileModal({
  visible,
  onClose,
  profileId,
  profileLabel,
  isIt,
}: Props) {
  const [duration, setDuration] = useState<ShareDuration>('24h');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [recentAppContacts, setRecentAppContacts] = useState<ShareContactRow[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<ShareContactRow[]>([]);

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setDuration('24h');
    setLoading(true);
    loadShareContacts()
      .then(({ phoneContacts: phone, recentAppContacts: recent }) => {
        setPhoneContacts(phone);
        setRecentAppContacts(recent);
      })
      .catch((e) => Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message))
      .finally(() => setLoading(false));
  }, [visible, isIt]);

  const appContacts = useMemo(() => {
    const merged = new Map<string, ShareContactRow>();
    for (const c of recentAppContacts) merged.set(`app-${c.appUserId}`, c);
    for (const c of phoneContacts) {
      if (c.appUserId) merged.set(`app-${c.appUserId}`, { ...c, source: 'app_recent' });
    }
    return [...merged.values()];
  }, [recentAppContacts, phoneContacts]);

  const phoneOnlyContacts = useMemo(
    () => phoneContacts.filter((c) => !c.appUserId),
    [phoneContacts],
  );

  const filterRows = (rows: ShareContactRow[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.emailHint?.toLowerCase().includes(q),
    );
  };

  const filteredApp = filterRows(appContacts);
  const filteredPhone = filterRows(phoneOnlyContacts);

  const shareOptions = {
    profileId,
    duration,
    label: profileLabel,
  };

  const handleShareContact = async (contact: ShareContactRow) => {
    setLoading(true);
    try {
      await shareWithContact(contact, shareOptions, isIt);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleOtherShare = async () => {
    setLoading(true);
    try {
      const share = await createAndDeliverShare(shareOptions);
      await openGenericShare(share.label, duration, share.token, isIt);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setLoading(false);
  };

  const renderContact = (contact: ShareContactRow, badge: string) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactRow}
      onPress={() => handleShareContact(contact)}
      disabled={loading}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactSub}>
          {contact.emailHint || contact.email || contact.phone || badge}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>{isIt ? 'Chiudi' : 'Close'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isIt ? 'Condividi allergie' : 'Share allergies'}</Text>
          <View style={{ width: 48 }} />
        </View>

        <Text style={styles.profileLabel}>
          {isIt ? 'Profilo' : 'Profile'}: <Text style={{ fontWeight: '800' }}>{profileLabel}</Text>
        </Text>

        <View style={styles.durationRow}>
          <TouchableOpacity
            style={[styles.durationBtn, duration === '24h' && styles.durationBtnActive]}
            onPress={() => setDuration('24h')}
          >
            <Text style={[styles.durationText, duration === '24h' && styles.durationTextActive]}>
              {isIt ? '24 ore · festa/spesa' : '24h · event/shopping'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.durationBtn, duration === 'permanent' && styles.durationBtnActive]}
            onPress={() => setDuration('permanent')}
          >
            <Text style={[styles.durationText, duration === 'permanent' && styles.durationTextActive]}>
              {isIt ? 'Sempre · famiglia' : 'Always · family'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder={isIt ? 'Cerca contatto...' : 'Search contact...'}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading && <ActivityIndicator color="#059669" style={{ marginVertical: 12 }} />}

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.section}>
            {isIt ? 'Contatti AllerTgy' : 'AllerTgy contacts'}
          </Text>
          {filteredApp.length === 0 ? (
            <Text style={styles.empty}>
              {isIt
                ? 'Nessun contatto con AllerTgy trovato. Invia via SMS dalla rubrica sotto.'
                : 'No AllerTgy contacts found. Send via SMS from the phone book below.'}
            </Text>
          ) : (
            filteredApp.map((c) => renderContact(c, 'App'))
          )}

          <Text style={styles.section}>
            {isIt ? 'Rubrica telefono' : 'Phone contacts'}
          </Text>
          {filteredPhone.length === 0 ? (
            <Text style={styles.empty}>
              {isIt ? 'Nessun contatto telefonico con numero o email.' : 'No phone contacts with number or email.'}
            </Text>
          ) : (
            filteredPhone.map((c) => renderContact(c, 'SMS'))
          )}

          <TouchableOpacity style={styles.otherBtn} onPress={handleOtherShare} disabled={loading}>
            <Text style={styles.otherBtnText}>
              {isIt ? 'Altro · WhatsApp, email, link...' : 'Other · WhatsApp, email, link...'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  close: { color: '#059669', fontWeight: '800', fontSize: 14 },
  title: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  profileLabel: { paddingHorizontal: 16, color: '#64748b', fontSize: 13, marginBottom: 10 },
  durationRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  durationBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  durationBtnActive: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  durationText: { textAlign: 'center', color: '#64748b', fontWeight: '700', fontSize: 12 },
  durationTextActive: { color: '#047857' },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  section: {
    marginTop: 14,
    marginBottom: 6,
    marginHorizontal: 16,
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  empty: { marginHorizontal: 16, color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  contactName: { fontWeight: '800', color: '#1e293b', fontSize: 14 },
  contactSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: '#047857', fontWeight: '900', fontSize: 11 },
  otherBtn: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  otherBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
