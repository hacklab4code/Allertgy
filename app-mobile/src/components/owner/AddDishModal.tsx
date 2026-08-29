import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, API } from '../../api/client';
import { AppText, SurfaceButton } from '../ui';
import { colors, font, radius, spacing } from '../../theme';
import type { Allergen, PiattoIn } from '../../types';

const CATEGORIE = ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Pizza', 'Dolci', 'Bevande'];

type Props = {
  visible: boolean;
  allergens: Allergen[];
  initialCategory?: string | null;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (dish: PiattoIn, opts: { addAnother: boolean }) => Promise<boolean>;
};

const emptyDraft = (categoria?: string | null): PiattoIn => ({
  nome_piatto: '',
  categoria: categoria ?? null,
  prezzo_cents: null,
  image_url: null,
  allergeni_contenuti: [],
  allergeni_tracce: [],
  kitchen_protocol_confirmed: 0,
});

function resolvePreview(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('file:')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Nuovo piatto — foto in evidenza, form unico, senza wizard. */
export function AddDishModal({
  visible,
  allergens,
  initialCategory,
  busy,
  error,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const nameRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState<PiattoIn>(() => emptyDraft(initialCategory));
  const [localError, setLocalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(emptyDraft(initialCategory));
    setLocalError('');
    setLocalPreview(null);
    const t = setTimeout(() => nameRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [visible, initialCategory]);

  const photoUri = localPreview || resolvePreview(draft.image_url);

  const cycleAllergen = (code: string) => {
    setDraft((prev) => {
      if (prev.allergeni_contenuti.includes(code)) {
        return {
          ...prev,
          allergeni_contenuti: prev.allergeni_contenuti.filter((c) => c !== code),
          allergeni_tracce: [...prev.allergeni_tracce, code],
        };
      }
      if (prev.allergeni_tracce.includes(code)) {
        return {
          ...prev,
          allergeni_tracce: prev.allergeni_tracce.filter((c) => c !== code),
        };
      }
      return {
        ...prev,
        allergeni_contenuti: [...prev.allergeni_contenuti, code],
      };
    });
  };

  const pickPhoto = () => {
    Alert.alert('Foto del piatto', 'Aggiungi una foto chiara del piatto.', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Fotocamera', onPress: () => void launch('camera') },
      { text: 'Galleria', onPress: () => void launch('library') },
    ]);
  };

  const launch = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'Abilita la fotocamera nelle impostazioni.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'Consenti l’accesso alla galleria.');
        return;
      }
    }

    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
          });

    if (res.canceled || !res.assets?.[0]) return;

    const uri = res.assets[0].uri;
    setLocalPreview(uri);
    setUploading(true);
    setLocalError('');
    try {
      const filename = uri.split('/').pop() || 'dish.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);
      const uploaded = await api.uploadImage(formData);
      setDraft((d) => ({ ...d, image_url: uploaded.url }));
      setLocalPreview(null);
    } catch (e) {
      setLocalError((e as Error).message || 'Upload foto non riuscito.');
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => {
    setDraft((d) => ({ ...d, image_url: null }));
    setLocalPreview(null);
  };

  const submit = async (addAnother: boolean) => {
    setLocalError('');
    if (!draft.nome_piatto.trim()) {
      setLocalError('Inserisci il nome del piatto.');
      nameRef.current?.focus();
      return;
    }
    if (!draft.categoria) {
      setLocalError('Scegli una categoria.');
      return;
    }
    if (uploading) {
      setLocalError('Attendi il caricamento della foto.');
      return;
    }
    const ok = await onSave(
      {
        ...draft,
        nome_piatto: draft.nome_piatto.trim(),
        kitchen_protocol_confirmed: draft.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at:
          draft.kitchen_protocol_confirmed === 1 ? new Date().toISOString() : null,
      },
      { addAnother },
    );
    if (ok && addAnother) {
      setDraft(emptyDraft(draft.categoria));
      setLocalPreview(null);
      setTimeout(() => nameRef.current?.focus(), 200);
    }
  };

  const allergenFood = allergens.filter((a) => !a.is_diet);
  const contCount = draft.allergeni_contenuti.length;
  const tracCount = draft.allergeni_tracce.length;
  const showError = localError || error;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.iconBtn} disabled={busy}>
            <Ionicons name="close" size={22} color={colors.brandInk} />
          </TouchableOpacity>
          <AppText variant="h2" style={{ fontSize: 17, flex: 1, textAlign: 'center' }}>
            Nuovo piatto
          </AppText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero foto */}
          <TouchableOpacity
            style={styles.photoHero}
            onPress={pickPhoto}
            activeOpacity={0.9}
            disabled={uploading || busy}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoEmpty}>
                <View style={styles.photoIconWrap}>
                  <Ionicons name="camera-outline" size={28} color={colors.brandInk} />
                </View>
                <AppText variant="bodyBold" style={{ fontSize: 15, marginTop: 10 }}>
                  Aggiungi foto del piatto
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: 4 }}>
                  Fotocamera o galleria · consigliato
                </AppText>
              </View>
            )}
            {uploading ? (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color="#FFF" size="large" />
                <AppText variant="caption" color="#FFF" style={{ marginTop: 8, fontWeight: '700' }}>
                  Caricamento…
                </AppText>
              </View>
            ) : null}
            {photoUri && !uploading ? (
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={pickPhoto}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                  <AppText variant="caption" color="#FFF" style={{ fontWeight: '800', fontSize: 11 }}>
                    Cambia
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoActionBtn, styles.photoRemove]} onPress={clearPhoto}>
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>

          {showError ? (
            <AppText variant="caption" color={colors.red} style={styles.error}>
              {showError}
            </AppText>
          ) : null}

          <AppText variant="eyebrow" color={colors.brandInk} style={styles.label}>
            NOME *
          </AppText>
          <TextInput
            ref={nameRef}
            style={styles.nameInput}
            placeholder="es. Spaghetti alle vongole"
            placeholderTextColor={colors.onSurfaceMuted}
            value={draft.nome_piatto}
            onChangeText={(t) => setDraft((d) => ({ ...d, nome_piatto: t }))}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <AppText variant="eyebrow" color={colors.brandInk} style={styles.label}>
                PREZZO
              </AppText>
              <TextInput
                style={styles.priceInput}
                placeholder="12,50"
                placeholderTextColor={colors.onSurfaceMuted}
                keyboardType="decimal-pad"
                value={
                  draft.prezzo_cents != null
                    ? String(draft.prezzo_cents / 100).replace('.', ',')
                    : ''
                }
                onChangeText={(t) => {
                  const n = parseFloat(t.replace(',', '.'));
                  setDraft((d) => ({
                    ...d,
                    prezzo_cents: isNaN(n) ? null : Math.round(n * 100),
                  }));
                }}
              />
            </View>
          </View>

          <AppText variant="eyebrow" color={colors.brandInk} style={styles.label}>
            CATEGORIA *
          </AppText>
          <View style={styles.catGrid}>
            {CATEGORIE.map((c) => {
              const on = draft.categoria === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, on && styles.catChipOn]}
                  onPress={() => setDraft((d) => ({ ...d, categoria: c }))}
                >
                  <AppText
                    variant="caption"
                    style={{
                      fontWeight: '700',
                      fontSize: 12,
                      color: on ? colors.brandInk : colors.onSurfaceMuted,
                    }}
                  >
                    {c}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppText variant="eyebrow" color={colors.brandInk} style={styles.label}>
            ALLERGENI UE
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginBottom: 8, lineHeight: 16 }}>
            Tocca: contiene → tracce → assente
          </AppText>
          <View style={styles.legend}>
            <LegendDot color={colors.red} label="Contiene" />
            <LegendDot color={colors.yellow} label="Tracce" />
            <LegendDot color={colors.borderStrong} label="No" />
          </View>
          <View style={styles.allGrid}>
            {allergenFood.map((a) => {
              const cont = draft.allergeni_contenuti.includes(a.code);
              const trac = draft.allergeni_tracce.includes(a.code);
              return (
                <TouchableOpacity
                  key={a.code}
                  style={[styles.allChip, cont && styles.allCont, trac && styles.allTrac]}
                  onPress={() => cycleAllergen(a.code)}
                >
                  <AppText
                    variant="caption"
                    style={{
                      fontSize: 12,
                      fontWeight: cont || trac ? '700' : '500',
                      color: cont
                        ? colors.redText
                        : trac
                          ? colors.amberText
                          : colors.onSurfaceMuted,
                    }}
                  >
                    {a.name_it}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <AppText variant="caption" color={colors.onSurfaceMuted} style={{ marginTop: 8 }}>
            {contCount + tracCount === 0
              ? 'Nessun allergene dichiarato'
              : `${contCount} contiene · ${tracCount} tracce`}
          </AppText>

          <TouchableOpacity
            style={styles.kitchenRow}
            onPress={() =>
              setDraft((d) => ({
                ...d,
                kitchen_protocol_confirmed: d.kitchen_protocol_confirmed === 1 ? 0 : 1,
              }))
            }
          >
            <View
              style={[
                styles.checkbox,
                draft.kitchen_protocol_confirmed === 1 && styles.checkboxOn,
              ]}
            >
              {draft.kitchen_protocol_confirmed === 1 ? (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ fontSize: 13 }}>
                Protocollo cucina
              </AppText>
              <AppText variant="caption" style={{ marginTop: 2, lineHeight: 16 }}>
                Niente contaminazione crociata sugli allergeni esclusi.
              </AppText>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <SurfaceButton
            label={busy ? 'Salvataggio…' : 'Salva piatto'}
            icon="checkmark"
            onPress={() => submit(false)}
            disabled={busy || uploading}
          />
          <View style={{ height: 8 }} />
          <SurfaceButton
            label="Salva e aggiungi altro"
            variant="soft"
            icon="add"
            onPress={() => submit(true)}
            disabled={busy || uploading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ fontSize: 10, fontWeight: '600' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  photoHero: {
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.brand100,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(54, 37, 92, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(54, 37, 92, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  photoRemove: {
    backgroundColor: 'rgba(180, 50, 50, 0.9)',
    paddingHorizontal: 8,
  },
  error: {
    marginBottom: 8,
    fontWeight: '700',
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: 6,
    fontSize: 9,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: font.displaySemibold,
    fontSize: 16,
    color: colors.brandInk,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.brandInk,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  catChipOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand100,
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  allGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  allCont: { borderColor: colors.red, backgroundColor: colors.redSoft },
  allTrac: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  kitchenRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
