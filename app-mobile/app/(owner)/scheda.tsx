import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, API } from '../../src/api/client';
import { OwnerScreenHeader } from '../../src/components/owner/OwnerScreenHeader';
import {
  AppText,
  CollapseSection,
  GlassCard,
  GlassScreenScroll,
  HeaderAddButton,
  SurfaceButton,
} from '../../src/components/ui';
import { useOwner } from '../../src/store/owner';
import { colors, font, radius, spacing } from '../../src/theme';
import type { RestaurantPhoto } from '../../src/types';

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'phone-pad' | 'email-address' | 'url' | 'numeric';
}) {
  return (
    <>
      <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
        {label}
      </AppText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceMuted}
        keyboardType={
          keyboard === 'url'
            ? 'url'
            : keyboard === 'email-address'
              ? 'email-address'
              : keyboard === 'phone-pad'
                ? 'phone-pad'
                : keyboard === 'numeric'
                  ? 'numeric'
                  : 'default'
        }
        autoCapitalize={
          keyboard === 'email-address' || keyboard === 'url' ? 'none' : 'sentences'
        }
      />
    </>
  );
}

/** Scheda pubblica + dati legali — schermata dedicata, fuori dall’hub Attività. */
export default function OwnerScheda() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { restaurants, current, setRestaurants, setCurrent } = useOwner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
  const [logoUrl, setLogoUrl] = useState('');
  const [photos, setPhotos] = useState<RestaurantPhoto[]>([]);

  const [identityOpen, setIdentityOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(focus === 'legal');
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (focus === 'legal') {
      setLegalOpen(true);
      setIdentityOpen(false);
    }
  }, [focus]);

  useEffect(() => {
    if (!current) return;
    setEditName(current.name || '');
    setEditCity(current.city || '');
    setEditAddress((current as any).address || '');
    setEditPhone((current as any).phone || '');
    setEditEmail((current as any).email_contact || '');
    setEditHours((current as any).opening_hours || '');
    setEditWebsite((current as any).website || '');
    setEditMenuUrl((current as any).menu_url || '');
    setEditDesc((current as any).description || '');
    setEditGoogle((current as any).google_place_id || '');
    setEditTripAdvisor((current as any).tripadvisor_url || '');
    setEditVat((current as any).vat_number || '');
    setEditAllergenManager((current as any).allergen_manager || '');
    setLogoUrl((current as any).image_url || '');

    api
      .listRestaurantPhotos(current.id)
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, [current]);

  const legalOk = !!(editVat.trim() && editAllergenManager.trim());

  const saveVetrina = async () => {
    if (!current) return;
    setBusy(true);
    setError('');
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
      setRestaurants(restaurants.map((r) => (r.id === current.id ? updated : r)));
      setCurrent(updated);
      Alert.alert('Salvato', 'Scheda pubblica aggiornata.');
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
    if (!res.canceled && res.assets?.[0]) {
      setBusy(true);
      try {
        const uri = res.assets[0].uri;
        const filename = uri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        const formData = new FormData();
        formData.append('file', { uri, name: filename, type } as any);
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
    if (!res.canceled && res.assets?.[0]) {
      setBusy(true);
      try {
        const uri = res.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        const formData = new FormData();
        formData.append('file', { uri, name: filename, type } as any);
        const uploadRes = await api.uploadRestaurantPhoto(current.id, formData);
        setPhotos([...photos, uploadRes]);
      } catch (e) {
        Alert.alert('Errore caricamento', (e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleSetCover = async (photoId: number) => {
    if (!current) return;
    try {
      await api.setCoverPhoto(current.id, photoId);
      setPhotos(photos.map((p) => ({ ...p, is_cover: p.id === photoId })));
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!current) return;
    try {
      await api.deleteRestaurantPhoto(current.id, photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
  };

  if (!current) {
    return (
      <GlassScreenScroll headerFloat>
        <OwnerScreenHeader title="Scheda pubblica" backTo="/(owner)/locali" />
        <GlassCard style={styles.emptyCard}>
          <AppText variant="bodyBold" style={{ textAlign: 'center', marginBottom: 12 }}>
            Seleziona prima un locale
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  return (
    <GlassScreenScroll headerFloat>
      <OwnerScreenHeader
        title="Scheda pubblica"
        subtitle={`${current.name} · vetrina e dati legali`}
        backTo="/(owner)/locali"
      />

      {error ? (
        <AppText variant="bodyBold" color={colors.red} style={{ marginBottom: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.statusRow}>
        <View style={[styles.pill, legalOk ? styles.pillOk : styles.pillWarn]}>
          <View style={[styles.dot, { backgroundColor: legalOk ? colors.green : colors.yellow }]} />
          <AppText
            variant="caption"
            style={{
              fontWeight: '700',
              fontSize: 11,
              color: legalOk ? colors.greenText : colors.amberText,
            }}
          >
            {legalOk ? 'Dati legali OK' : 'Completa P.IVA e HACCP'}
          </AppText>
        </View>
      </View>

      <CollapseSection
        icon="image"
        title="Identità e logo"
        preview={editName || current.name}
        expanded={identityOpen}
        onToggle={() => setIdentityOpen((v) => !v)}
      >
        <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
          LOGO
        </AppText>
        <View style={styles.logoRow}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl.startsWith('http') ? logoUrl : `${API}${logoUrl}` }}
              style={styles.logoImage}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="image-outline" size={20} color={colors.onSurfaceMuted} />
            </View>
          )}
          <TouchableOpacity style={styles.uploadBtn} onPress={handleLogoUpload}>
            <AppText variant="caption" color={colors.brandInk} style={{ fontWeight: '700' }}>
              Carica logo
            </AppText>
          </TouchableOpacity>
        </View>
        <Field label="NOME" value={editName} onChange={setEditName} placeholder="Nome del ristorante" />
        <Field label="CITTÀ" value={editCity} onChange={setEditCity} placeholder="Città" />
        <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
          DESCRIZIONE
        </AppText>
        <TextInput
          style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
          value={editDesc}
          onChangeText={setEditDesc}
          multiline
          placeholder="Breve descrizione per la vetrina"
          placeholderTextColor={colors.onSurfaceMuted}
        />
      </CollapseSection>

      <CollapseSection
        icon="location"
        title="Contatti e posizione"
        preview={editAddress || 'Indirizzo, telefono, orari'}
        expanded={contactsOpen}
        onToggle={() => setContactsOpen((v) => !v)}
      >
        <Field label="INDIRIZZO" value={editAddress} onChange={setEditAddress} placeholder="Via e civico" />
        <Field label="TELEFONO" value={editPhone} onChange={setEditPhone} placeholder="+39 …" keyboard="phone-pad" />
        <Field label="EMAIL" value={editEmail} onChange={setEditEmail} placeholder="info@…" keyboard="email-address" />
        <Field label="SITO WEB" value={editWebsite} onChange={setEditWebsite} placeholder="https://" keyboard="url" />
        <AppText variant="eyebrow" color={colors.brandInk} style={styles.fieldLabel}>
          ORARI
        </AppText>
        <TextInput
          style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
          value={editHours}
          onChangeText={setEditHours}
          multiline
          placeholder="Lun–Ven 12:30–14:30…"
          placeholderTextColor={colors.onSurfaceMuted}
        />
      </CollapseSection>

      <CollapseSection
        icon="link"
        title="Link esterni"
        preview="PDF menù, Google, TripAdvisor"
        expanded={linksOpen}
        onToggle={() => setLinksOpen((v) => !v)}
      >
        <Field label="MENÙ PDF / WEB" value={editMenuUrl} onChange={setEditMenuUrl} placeholder="https://" keyboard="url" />
        <Field label="GOOGLE PLACE ID" value={editGoogle} onChange={setEditGoogle} placeholder="Place ID" />
        <Field label="TRIPADVISOR" value={editTripAdvisor} onChange={setEditTripAdvisor} placeholder="URL" />
      </CollapseSection>

      <CollapseSection
        icon="document-text"
        title="Dati legali UE"
        preview={legalOk ? 'P.IVA e referente OK' : 'P.IVA e HACCP da completare'}
        expanded={legalOpen}
        onToggle={() => setLegalOpen((v) => !v)}
        tint={legalOk ? undefined : 'yellow'}
      >
        <AppText variant="caption" style={{ marginBottom: spacing.sm, lineHeight: 18 }}>
          Serve per il Registro Allergeni e i controlli ASL/NAS.
        </AppText>
        <Field label="PARTITA IVA" value={editVat} onChange={setEditVat} placeholder="11 cifre" keyboard="numeric" />
        <Field
          label="REFERENTE ALLERGENI (HACCP)"
          value={editAllergenManager}
          onChange={setEditAllergenManager}
          placeholder="Nome responsabile"
        />
      </CollapseSection>

      <CollapseSection
        icon="images"
        title="Galleria foto"
        preview={`${photos.length} foto`}
        expanded={galleryOpen}
        onToggle={() => setGalleryOpen((v) => !v)}
      >
        <View style={styles.galleryToolbar}>
          <AppText variant="eyebrow" color={colors.brandInk} style={{ fontSize: 9 }}>
            FOTO
          </AppText>
          <HeaderAddButton inHeader={false} onPress={handleAddPhoto} accessibilityLabel="Aggiungi foto" />
        </View>
        {photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {photos.map((p) => (
              <View key={p.id} style={styles.photoContainer}>
                <Image source={{ uri: p.url }} style={styles.photoImage} />
                {p.is_cover ? (
                  <View style={styles.coverBadge}>
                    <AppText variant="caption" color="#FFFFFF" style={{ fontSize: 8, fontWeight: '800' }}>
                      Cover
                    </AppText>
                  </View>
                ) : null}
                <View style={styles.photoActions}>
                  {!p.is_cover && (
                    <TouchableOpacity style={styles.photoAction} onPress={() => handleSetCover(p.id)}>
                      <AppText variant="caption" color="#FFFFFF" style={{ fontSize: 8, fontWeight: '800' }}>
                        Cover
                      </AppText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.photoAction, { backgroundColor: colors.red }]}
                    onPress={() => handleDeletePhoto(p.id)}
                  >
                    <AppText variant="caption" color="#FFFFFF" style={{ fontSize: 8, fontWeight: '800' }}>
                      Elimina
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <AppText variant="caption">Nessuna foto in galleria.</AppText>
        )}
      </CollapseSection>

      <View style={{ marginTop: spacing.sm, marginBottom: spacing['2xl'] }}>
        <SurfaceButton
          label={busy ? 'Salvataggio…' : 'Salva scheda pubblica'}
          onPress={saveVetrina}
          disabled={busy}
          icon="save-outline"
        />
        {busy ? <ActivityIndicator style={{ marginTop: 12 }} color={colors.brand} /> : null}
      </View>
    </GlassScreenScroll>
  );
}

const styles = StyleSheet.create({
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  pillOk: { backgroundColor: colors.greenSoft },
  pillWarn: { backgroundColor: colors.yellowSoft },
  dot: { width: 7, height: 7, borderRadius: 4 },
  fieldLabel: { marginTop: spacing.sm, marginBottom: 4, fontSize: 9 },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.brandInk,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtn: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  galleryToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  photoContainer: {
    width: '48%',
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  photoActions: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  photoAction: {
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
});
