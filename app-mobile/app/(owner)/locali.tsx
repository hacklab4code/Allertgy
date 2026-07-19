import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, API, WEB_URL } from '../../src/api/client';
import { OwnerReviewsPanel } from '../../src/components/owner/OwnerReviewsPanel';
import { CollapseSection, HeaderAddButton, Screen, Section, SettingsDivider, SettingsRow } from '../../src/components/ui';
import { TAB_BAR_CLEARANCE, spacing } from '../../src/theme';
import { useOwner } from '../../src/store/owner';

/** Scheda Locale: seleziona o crea il ristorante. */
export default function Locali() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  // Stati form di personalizzazione vetrina
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [reviewStats, setReviewStats] = useState({ total: 0, pending: 0 });
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editMenuUrl, setEditMenuUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGoogle, setEditGoogle] = useState('');
  const [editTripAdvisor, setEditTripAdvisor] = useState('');
  const [editVat, setEditVat] = useState('');
  const [editAllergenManager, setEditAllergenManager] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ id: number; url: string; is_cover: boolean }[]>([]);
  const [identityOpen, setIdentityOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (current) {
      setEditName(current.name || '');
      setEditCity(current.city || '');
      setEditAddress((current as any).address || '');
      setEditPhone((current as any).phone || '');
      setEditEmail((current as any).email_contact || '');
      setEditHours((current as any).opening_hours || '');
      setEditWebsite(current.website || '');
      setEditMenuUrl(current.menu_url || '');
      setEditDesc((current as any).description || '');
      setEditGoogle((current as any).google_place_id || '');
      setEditTripAdvisor((current as any).tripadvisor_url || '');
      setEditVat((current as any).vat_number || '');
      setEditAllergenManager((current as any).allergen_manager || '');
      setLogoUrl(current.image_url || null);
      
      // Carica foto
      api.listRestaurantPhotos(current.id)
        .then(setPhotos)
        .catch(() => {});
    }
  }, [current]);

  useEffect(() => {
    if (!current) {
      setReviewStats({ total: 0, pending: 0 });
      return;
    }
    api.listReviews(current.public_code)
      .then((list) => setReviewStats({
        total: list.length,
        pending: list.filter((r) => !r.reply).length,
      }))
      .catch(() => setReviewStats({ total: 0, pending: 0 }));
  }, [current?.id]);

  useEffect(() => {
    api.myRestaurants()
      .then((rs) => {
        setRestaurants(rs);
        if (rs.length === 1) setCurrent(rs[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    setBusy(true); setError('');
    try {
      const r = await api.createRestaurant(name.trim(), city.trim(), inviteCode.trim() || undefined);
      setRestaurants([...restaurants, r]);
      setCurrent(r);
      setName(''); setCity(''); setInviteCode('');
      setShowAddModal(false);
      if (inviteCode.trim() && r.business_plan === 'pro_notify') {
        Alert.alert(
          'Pro omaggio attivato!',
          `${r.name} ha il piano Pro gratis per 30 giorni grazie al codice invito del cliente.`,
        );
      }
      // Dopo la creazione mostra subito il lavoro operativo: il gate piano resta dentro Menù.
      router.push('/(owner)/menu');
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const saveVetrina = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try {
      const updated = await api.updateRestaurant(current.id, {
        name: editName.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        phone: editPhone.trim(),
        email_contact: editEmail.trim(),
        opening_hours: editHours.trim(),
        website: editWebsite.trim(),
        menu_url: editMenuUrl.trim(),
        description: editDesc.trim(),
        google_place_id: editGoogle.trim(),
        tripadvisor_url: editTripAdvisor.trim(),
        vat_number: editVat.trim(),
        allergen_manager: editAllergenManager.trim(),
        image_url: logoUrl,
      } as any);
      
      setRestaurants(restaurants.map(r => r.id === current.id ? updated : r));
      setCurrent(updated);
      Alert.alert('Salvato', 'I dettagli della vetrina sono stati aggiornati con successo!');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita i permessi per accedere alle foto.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setBusy(true);
      try {
        const uri = res.assets[0].uri;
        const filename = uri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.uploadImage(formData);
        setLogoUrl(uploadRes.url);
      } catch (e) {
        Alert.alert('Errore logo', (e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleAddPhoto = async () => {
    if (!current) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita i permessi per accedere alle foto.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setBusy(true);
      try {
        const uri = res.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const newPhoto = await api.uploadRestaurantPhoto(current.id, formData);
        setPhotos([...photos, newPhoto]);
      } catch (e) {
        Alert.alert('Errore foto', (e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!current) return;
    setBusy(true);
    try {
      await api.deleteRestaurantPhoto(current.id, photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSetCover = async (photoId: number) => {
    if (!current) return;
    setBusy(true);
    try {
      const updated = await api.setCoverPhoto(current.id, photoId);
      setPhotos(updated);
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const planLabel = current?.business_plan === 'base' ? 'Base'
    : current?.business_plan === 'pro_notify' ? 'Pro' : 'Gratis';

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#059669" />;

  return (
    <Screen edges={false}>
    <Stack.Screen
      options={{
        headerRight: () => (
          <HeaderAddButton
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="Aggiungi attività"
          />
        ),
      }}
    />
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: TAB_BAR_CLEARANCE }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

        <Section
          title="Le tue attività"
          subtitle={restaurants.length === 0
            ? 'Tocca + in alto a destra per registrare la prima attività.'
            : restaurants.length === 1
              ? 'Gestisci locale, vetrina e feedback clienti.'
              : 'Seleziona quale locale stai gestendo.'}
          card
          padded={false}
        >
          {restaurants.length === 0 ? (
            <Text style={styles.muted}>Nessun locale registrato.</Text>
          ) : null}
          {restaurants.map((r) => {
            const active = current?.id === r.id;
            return (
              <TouchableOpacity key={r.id}
                style={[styles.place, active && styles.placeOn]}
                onPress={() => setCurrent(r)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{r.name}</Text>
                  <Text style={styles.placeSub}>
                    {r.city ? `${r.city} · ` : ''}codice {r.public_code}
                    {r.menu_updated_at ? ' · menù ✓' : ' · menù da fare'}
                  </Text>
                </View>
                {active && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </Section>

      {current ? (
        <>
          <Section title="Panoramica" subtitle={current.name} card padded={false}>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{current.menu_updated_at ? 'OK' : '—'}</Text>
                <Text style={styles.metricLabel}>menù</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{planLabel}</Text>
                <Text style={styles.metricLabel}>piano</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{reviewStats.pending > 0 ? reviewStats.pending : reviewStats.total}</Text>
                <Text style={styles.metricLabel}>{reviewStats.pending > 0 ? 'da rispondere' : 'recensioni'}</Text>
              </View>
            </View>
            <SettingsRow
              icon="restaurant"
              title="Gestione menù"
              subtitle={current.menu_updated_at ? 'Menù pubblicato' : 'Da pubblicare'}
              onPress={() => router.push('/(owner)/menu')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="qr-code"
              title="QR code tavoli"
              subtitle="Stampa il QR per i clienti"
              onPress={() => router.push('/(owner)/qr')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="bar-chart"
              title="Statistiche"
              subtitle="Visite menù e allergeni cercati"
              onPress={() => router.push('/(owner)/statistiche')}
            />
          </Section>

          <CollapseSection
            icon="star"
            title="Recensioni clienti"
            preview={
              reviewStats.total === 0
                ? 'Nessuna recensione'
                : reviewStats.pending > 0
                  ? `${reviewStats.pending} da rispondere`
                  : `${reviewStats.total} recensioni`
            }
            badge={reviewStats.pending > 0 ? reviewStats.pending : undefined}
            expanded={reviewsExpanded}
            onToggle={() => setReviewsExpanded((v) => !v)}
            tint={reviewStats.pending > 0 ? 'yellow' : 'none'}
          >
            <OwnerReviewsPanel locale={current} onStats={setReviewStats} />
          </CollapseSection>

          <CollapseSection
            icon="storefront"
            title="Identità e logo"
            preview={editName || current.name}
            expanded={identityOpen}
            onToggle={() => setIdentityOpen((v) => !v)}
          >
            <Text style={styles.fieldLabel}>Logo del Ristorante</Text>
            <View style={styles.logoRow}>
              {logoUrl ? (
                <Image 
                  source={{ uri: logoUrl.startsWith('http') ? logoUrl : `${API}${logoUrl}` }} 
                  style={styles.logoImage} 
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>Nessun Logo</Text>
                </View>
              )}
              <TouchableOpacity style={styles.uploadBtn} onPress={handleLogoUpload}>
                <Text style={styles.uploadBtnText}>Carica Logo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Nome Locale</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Nome del ristorante" />
            <Text style={styles.fieldLabel}>Città</Text>
            <TextInput style={styles.input} value={editCity} onChangeText={setEditCity} placeholder="Città" />
            <Text style={styles.fieldLabel}>Descrizione Vetrina</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              value={editDesc} 
              onChangeText={setEditDesc} 
              multiline 
              placeholder="es. Specialità tradizionali milanesi con cucina gluten-free..." 
            />
          </CollapseSection>

          <CollapseSection
            icon="location"
            title="Contatti e posizione"
            preview={editCity || 'Indirizzo, telefono, orari'}
            expanded={contactsOpen}
            onToggle={() => setContactsOpen((v) => !v)}
          >
            <Text style={styles.fieldLabel}>Indirizzo Completo</Text>
            <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} placeholder="es. Via Garibaldi 12" />
            <Text style={styles.fieldLabel}>Telefono</Text>
            <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" placeholder="es. +39 02 1234567" />
            <Text style={styles.fieldLabel}>Email Contatto Pubblico</Text>
            <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholder="es. info@trattoria.it" />
            <Text style={styles.fieldLabel}>Sito Web</Text>
            <TextInput style={styles.input} value={editWebsite} onChangeText={setEditWebsite} keyboardType="url" autoCapitalize="none" placeholder="es. https://trattoria.it" />
            <Text style={styles.fieldLabel}>Orari di Apertura</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              value={editHours} 
              onChangeText={setEditHours} 
              multiline 
              placeholder="es. Lun - Ven: 12:30 - 14:30, 19:30 - 22:30" 
            />
          </CollapseSection>

          <CollapseSection
            icon="link"
            title="Link esterni"
            preview="Menù PDF, Google, TripAdvisor"
            expanded={linksOpen}
            onToggle={() => setLinksOpen((v) => !v)}
          >
            <Text style={styles.fieldLabel}>Link Menù Originale (PDF / Web)</Text>
            <TextInput style={styles.input} value={editMenuUrl} onChangeText={setEditMenuUrl} keyboardType="url" autoCapitalize="none" placeholder="es. https://trattoria.it/menu.pdf" />
            <Text style={styles.fieldLabel}>Google Place ID</Text>
            <TextInput style={styles.input} value={editGoogle} onChangeText={setEditGoogle} placeholder="Google Place ID per recensioni" />
            <Text style={styles.fieldLabel}>TripAdvisor URL</Text>
            <TextInput style={styles.input} value={editTripAdvisor} onChangeText={setEditTripAdvisor} placeholder="URL TripAdvisor per recensioni" />
          </CollapseSection>

          <CollapseSection
            icon="document-text"
            title="Dati legali"
            preview={editVat ? 'P.IVA inserita' : 'P.IVA da completare'}
            expanded={legalOpen}
            onToggle={() => setLegalOpen((v) => !v)}
            tint={editVat && editAllergenManager ? undefined : 'yellow'}
          >
            <Text style={styles.fieldLabel}>Partita IVA (P.IVA)</Text>
            <TextInput style={styles.input} value={editVat} onChangeText={setEditVat} keyboardType="numeric" placeholder="es. 12345678901" />
            <Text style={styles.fieldLabel}>Referente Allergeni (Responsabile HACCP)</Text>
            <TextInput style={styles.input} value={editAllergenManager} onChangeText={setEditAllergenManager} placeholder="es. Chef Mario Rossi" />
          </CollapseSection>

          <CollapseSection
            icon="images"
            title="Galleria foto"
            preview={`${photos.length} foto`}
            expanded={galleryOpen}
            onToggle={() => setGalleryOpen((v) => !v)}
          >
            <View style={styles.galleryToolbar}>
              <Text style={styles.fieldLabel}>Foto caricate</Text>
              <HeaderAddButton
                inHeader={false}
                onPress={handleAddPhoto}
                accessibilityLabel="Aggiungi foto"
              />
            </View>
            {photos.length > 0 ? (
              <View style={styles.photosGrid}>
                {photos.map((p) => (
                  <View key={p.id} style={styles.photoContainer}>
                    <Image source={{ uri: p.url }} style={styles.photoImage} />
                    {p.is_cover ? <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View> : null}
                    <View style={styles.photoActions}>
                      {!p.is_cover && (
                        <TouchableOpacity style={styles.actionPill} onPress={() => handleSetCover(p.id)}>
                          <Text style={styles.actionPillText}>Cover</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.actionPill, { backgroundColor: '#dc2626' }]} onPress={() => handleDeletePhoto(p.id)}>
                        <Text style={styles.actionPillText}>Elimina</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyPhotos}>Nessuna foto caricata nella galleria.</Text>
            )}
          </CollapseSection>

          {(current as any).slug ? (
            <View style={styles.slugPreviewCard}>
              <Text style={styles.slugPreviewTitle}>🌐 Pagina vetrina online</Text>
              <Text style={styles.slugPreviewUrl}>{WEB_URL}/r/{(current as any).slug}</Text>
            </View>
          ) : null}

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.formBtn, styles.saveFormBtn]} onPress={saveVetrina} disabled={busy}>
              <Text style={styles.saveFormBtnText}>{busy ? 'Salvataggio...' : 'Salva vetrina'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

    </ScrollView>

    <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
      <Screen edges={false}>
        <View style={styles.modalHead}>
          <Text style={styles.modalTitle}>
            {restaurants.length === 0 ? 'Registra attività' : 'Nuova attività'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={12}>
            <Text style={styles.modalClose}>Chiudi</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.muted}>
            Riceverai un codice a 6 cifre per il menù filtrato sulle allergie dei clienti.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nome del locale (es. Trattoria da Mario)"
            value={name}
            onChangeText={setName}
          />
          <TextInput style={styles.input} placeholder="Città" value={city} onChangeText={setCity} />
          {restaurants.length === 0 ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Codice invito cliente (opzionale)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.mutedSmall}>
                Se un cliente AllerTgy ti ha invitato, inserisci il suo codice: tu ricevi 1 mese di Pro omaggio.
              </Text>
            </>
          ) : null}
          <TouchableOpacity
            style={[styles.button, (!name.trim() || busy) && { opacity: 0.4 }]}
            disabled={!name.trim() || busy}
            onPress={create}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crea locale</Text>}
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  error: { color: '#dc2626', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#1e293b', marginBottom: 8 },
  muted: { color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  mutedSmall: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginBottom: 8 },
  place: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  placeOn: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  placeName: { fontWeight: '700', color: '#1e293b' },
  placeSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  check: { color: '#059669', fontWeight: '800', fontSize: 18 },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 4 },
  metricBox: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#f8fafc',
  },
  metricValue: { fontWeight: '800', fontSize: 15, color: '#1e293b' },
  metricLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 13, marginBottom: 10, fontSize: 15,
  },
  button: {
    backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontWeight: '800', fontSize: 18, color: '#1e293b' },
  modalClose: { color: '#047857', fontWeight: '700', fontSize: 15 },
  modalBody: { padding: 16, gap: 4, paddingBottom: 40 },
  galleryToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
  },
  uploadBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  photoContainer: {
    width: '48%',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#059669',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 5,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 4,
  },
  actionPill: {
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  actionPillText: {
    color: '#1e293b',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyPhotos: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 10,
  },
  formActions: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  formBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveFormBtn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  saveFormBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  slugPreviewCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  slugPreviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#064e3b',
  },
  slugPreviewUrl: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '800',
    marginTop: 2,
  },
});
