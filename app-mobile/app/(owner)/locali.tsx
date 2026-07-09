import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, API, WEB_URL } from '../../src/api/client';
import { useOwner } from '../../src/store/owner';

/** Scheda Locale: seleziona o crea il ristorante. */
export default function Locali() {
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  // Stati form di personalizzazione vetrina
  const [isEditingVetrina, setIsEditingVetrina] = useState(false);
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
      const r = await api.createRestaurant(name.trim(), city.trim());
      const firstLocale = restaurants.length === 0;
      setRestaurants([...restaurants, r]);
      setCurrent(r);
      setName(''); setCity('');
      // Il menù digitale richiede un piano: al primo locale porta alla prova gratuita
      router.push(firstLocale ? '/(owner)/piano' : '/(owner)/menu');
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
      setIsEditingVetrina(false);
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

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#059669" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {restaurants.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>I tuoi locali</Text>
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
                    {r.menu_updated_at ? ' · menù pubblicato ✓' : ' · menù da pubblicare'}
                  </Text>
                </View>
                {active && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          {current && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={styles.cta} onPress={() => router.push('/(owner)/menu')}>
                <Text style={styles.ctaText}>Gestisci il menù di {current.name} →</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryCta, isEditingVetrina && { backgroundColor: '#f1f5f9' }]} 
                onPress={() => setIsEditingVetrina(!isEditingVetrina)}
              >
                <Text style={styles.secondaryCtaText}>
                  {isEditingVetrina ? 'Chiudi personalizzazione ✕' : 'Personalizza Vetrina ✨'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Vetrina Editor Card */}
      {isEditingVetrina && current && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Personalizzazione Vetrina</Text>
          <Text style={styles.muted}>Configura i dettagli pubblici del tuo locale visualizzati sulla pagina vetrina per i clienti.</Text>
          
          {/* Logo Section */}
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

          {/* Text Fields */}
          <Text style={styles.fieldLabel}>Nome Locale</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Nome del ristorante" />

          <Text style={styles.fieldLabel}>Città</Text>
          <TextInput style={styles.input} value={editCity} onChangeText={setEditCity} placeholder="Città" />

          <Text style={styles.fieldLabel}>Indirizzo Completo</Text>
          <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} placeholder="es. Via Garibaldi 12" />

          <Text style={styles.fieldLabel}>Telefono</Text>
          <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" placeholder="es. +39 02 1234567" />

          <Text style={styles.fieldLabel}>Email Contatto Pubblico</Text>
          <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholder="es. info@trattoria.it" />

          <Text style={styles.fieldLabel}>Sito Web</Text>
          <TextInput style={styles.input} value={editWebsite} onChangeText={setEditWebsite} keyboardType="url" autoCapitalize="none" placeholder="es. https://trattoria.it" />

          <Text style={styles.fieldLabel}>Link Menù Originale (PDF / Web)</Text>
          <TextInput style={styles.input} value={editMenuUrl} onChangeText={setEditMenuUrl} keyboardType="url" autoCapitalize="none" placeholder="es. https://trattoria.it/menu.pdf" />

          <Text style={styles.fieldLabel}>Orari di Apertura</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            value={editHours} 
            onChangeText={setEditHours} 
            multiline 
            placeholder="es. Lun - Ven: 12:30 - 14:30, 19:30 - 22:30" 
          />

          <Text style={styles.fieldLabel}>Descrizione Vetrina</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            value={editDesc} 
            onChangeText={setEditDesc} 
            multiline 
            placeholder="es. Specialità tradizionali milanesi con cucina gluten-free..." 
          />

          <Text style={styles.fieldLabel}>Google Place ID</Text>
          <TextInput style={styles.input} value={editGoogle} onChangeText={setEditGoogle} placeholder="Google Place ID per recensioni" />

          <Text style={styles.fieldLabel}>TripAdvisor URL</Text>
          <TextInput style={styles.input} value={editTripAdvisor} onChangeText={setEditTripAdvisor} placeholder="URL TripAdvisor per recensioni" />

          <Text style={styles.fieldLabel}>Partita IVA (P.IVA)</Text>
          <TextInput style={styles.input} value={editVat} onChangeText={setEditVat} keyboardType="numeric" placeholder="es. 12345678901" />

          <Text style={styles.fieldLabel}>Referente Allergeni (Responsabile HACCP)</Text>
          <TextInput style={styles.input} value={editAllergenManager} onChangeText={setEditAllergenManager} placeholder="es. Chef Mario Rossi" />

          {/* Galleria Foto */}
          <Text style={styles.fieldLabel}>Galleria Foto Locale</Text>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
            <Text style={styles.addPhotoBtnText}>+ Aggiungi Foto alla Galleria</Text>
          </TouchableOpacity>

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

          {/* Action buttons */}
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.formBtn, styles.cancelFormBtn]} onPress={() => setIsEditingVetrina(false)}>
              <Text style={styles.cancelFormBtnText}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.formBtn, styles.saveFormBtn]} onPress={saveVetrina} disabled={busy}>
              <Text style={styles.saveFormBtnText}>{busy ? 'Salvataggio...' : 'Salva Vetrina'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Vetrina Page Link Preview */}
      {!isEditingVetrina && current && (current as any).slug && (
        <View style={styles.slugPreviewCard}>
          <Text style={styles.slugPreviewTitle}>🌐 Pagina vetrina online:</Text>
          <Text style={styles.slugPreviewUrl}>{WEB_URL}/r/{(current as any).slug}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {restaurants.length === 0 ? 'Registra il tuo locale' : 'Aggiungi un altro locale'}
        </Text>
        <Text style={styles.muted}>
          Riceverai un codice a 6 cifre: i clienti lo useranno per vedere il tuo menù
          filtrato sulle loro allergie.
        </Text>
        <TextInput style={styles.input} placeholder="Nome del locale (es. Trattoria da Mario)"
          value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Città" value={city} onChangeText={setCity} />
        <TouchableOpacity
          style={[styles.button, (!name.trim() || busy) && { opacity: 0.4 }]}
          disabled={!name.trim() || busy}
          onPress={create}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crea locale</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  place: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  placeOn: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  placeName: { fontWeight: '700', color: '#1e293b' },
  placeSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  check: { color: '#059669', fontWeight: '800', fontSize: 18 },
  cta: { marginTop: 6, alignItems: 'center', padding: 10 },
  ctaText: { color: '#047857', fontWeight: '700' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 13, marginBottom: 10, fontSize: 15,
  },
  button: {
    backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryCta: {
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryCtaText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 14,
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
  addPhotoBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#ecfdf5',
  },
  addPhotoBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
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
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelFormBtn: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
  },
  saveFormBtn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  cancelFormBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
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
