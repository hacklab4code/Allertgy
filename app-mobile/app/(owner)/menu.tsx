import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, API } from '../../src/api/client';
import { AddDishModal } from '../../src/components/owner/AddDishModal';
import {
  AppText,
  CollapseSection,
  GlassCard,
  GlassScreenScroll,
  SurfaceButton,
} from '../../src/components/ui';
import { TAB_BAR_CLEARANCE } from '../../src/theme';
import { useOwner } from '../../src/store/owner';
import { colors, font, radius, spacing } from '../../src/theme';
import type { Allergen, PiattoIn } from '../../src/types';
import { registryNeedsReprint } from '../../src/utils/registryPrint';

const CATEGORIE = ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Pizza', 'Dolci', 'Bevande'];
const AUTOSAVE_MS = 700;

/** Menù — lista piatti compatta, un editor alla volta, Violet Precision. */
export default function MenuEditor() {
  const { current, piatti, setPiatti, setPublished, patchCurrent } = useOwner();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [legalAck, setLegalAck] = useState(false);

  const [showUrlModal, setShowUrlModal] = useState(false);
  const [menuUrlInput, setMenuUrlInput] = useState('');
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [importExpanded, setImportExpanded] = useState(false);
  const [catExpanded, setCatExpanded] = useState<Record<string, boolean>>({});
  const [expandedDish, setExpandedDish] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [confirmingKitchenAll, setConfirmingKitchenAll] = useState(false);
  const [pdfReprintNeeded, setPdfReprintNeeded] = useState(false);
  const [autosaveHint, setAutosaveHint] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');
  const [photoUploadingIndex, setPhotoUploadingIndex] = useState<number | null>(null);
  const piattiRef = useRef(piatti);
  piattiRef.current = piatti;
  const autosaveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const legalAlreadyCurrent = !!(current?.menu_legal_confirmed_at && current?.menu_legal_version);
  const pendingKitchen = piatti.filter((p) => (p.kitchen_protocol_confirmed ?? 0) !== 1).length;
  const namedCount = piatti.filter((p) => p.nome_piatto.trim()).length;

  useEffect(() => {
    api.allergens().then(setAllergens).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!current?.id) {
      setPdfReprintNeeded(false);
      return;
    }
    registryNeedsReprint(current.id, current.menu_version).then(setPdfReprintNeeded);
  }, [current?.id, current?.menu_version]);

  useEffect(() => {
    if (!current || loaded) return;
    api
      .menu(current.public_code)
      .then((m) => {
        if (piatti.length === 0) {
          setPiatti(
            m.piatti.map((p) => ({
              id: p.id,
              nome_piatto: p.nome_piatto,
              descrizione: p.descrizione ?? null,
              categoria: p.categoria ?? null,
              prezzo_cents: p.prezzo_cents ?? null,
              image_url: p.image_url ?? null,
              menu_group: p.menu_group ?? null,
              kitchen_protocol_confirmed: p.kitchen_protocol_confirmed ?? 0,
              cross_contamination_checked_at: p.cross_contamination_checked_at ?? null,
              allergeni_contenuti: p.allergeni_contenuti || [],
              allergeni_tracce: p.allergeni_tracce || [],
            })),
          );
          if (m.piatti.length > 0) setPublished(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const saveDish = async (i: number, opts?: { silent?: boolean }) => {
    if (!current) return;
    const dish = piattiRef.current[i];
    if (!dish?.nome_piatto.trim()) {
      if (!opts?.silent) setError('Inserisci il nome del piatto prima di salvare.');
      return;
    }
    if (opts?.silent && !dish.id) return;
    setSavingIndex(i);
    setError('');
    try {
      const payload: PiattoIn = {
        nome_piatto: dish.nome_piatto.trim(),
        descrizione: dish.descrizione ?? null,
        categoria: dish.categoria ?? null,
        prezzo_cents: dish.prezzo_cents ?? null,
        image_url: dish.image_url ?? null,
        menu_group: dish.menu_group ?? 'Principale',
        kitchen_protocol_confirmed: dish.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at: dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: dish.allergeni_contenuti || [],
        allergeni_tracce: dish.allergeni_tracce || [],
      };
      const res = dish.id
        ? await api.updateDish(current.id, dish.id, payload, true)
        : await api.createDish(current.id, payload, true);
      const next = [...piattiRef.current];
      next[i] = {
        ...next[i],
        id: res.dish.id,
        nome_piatto: res.dish.nome_piatto,
        kitchen_protocol_confirmed: res.dish.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at: res.dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: res.dish.allergeni_contenuti || [],
        allergeni_tracce: res.dish.allergeni_tracce || [],
      };
      setPiatti(next);
      patchCurrent({
        menu_version: res.menu_version,
        menu_updated_at: res.menu_updated_at,
      });
      if (res.published) setPublished(true);
      setFlashIndex(i);
      setTimeout(() => setFlashIndex((cur) => (cur === i ? null : cur)), 1600);
      if (res.published) {
        const needs = await registryNeedsReprint(current.id, res.menu_version);
        setPdfReprintNeeded(needs);
        setAutosaveHint(opts?.silent ? `Autosave · v${res.menu_version}` : `Salvato · v${res.menu_version}`);
        if (!opts?.silent && needs) {
          Alert.alert('Salvato', `Menù v${res.menu_version} live. Ristampa il Registro Allergeni.`, [
            { text: 'Ok' },
            { text: 'Registro', onPress: () => router.push('/(owner)/registro') },
          ]);
        }
      }
    } catch (e) {
      if (!opts?.silent) setError((e as Error).message);
    } finally {
      setSavingIndex(null);
    }
  };

  const confirmKitchenAll = () => {
    if (!current) return;
    Alert.alert(
      'Conferma cucina',
      'Confermi il protocollo anti-contaminazione crociata su tutti i piatti?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma tutti',
          onPress: async () => {
            setConfirmingKitchenAll(true);
            setError('');
            try {
              const res = await api.confirmKitchenAll(current.id, true);
              const now = new Date().toISOString();
              setPiatti(
                piattiRef.current.map((p) => ({
                  ...p,
                  kitchen_protocol_confirmed: 1,
                  cross_contamination_checked_at: now,
                })),
              );
              patchCurrent({
                menu_version: res.menu_version,
                menu_updated_at: res.menu_updated_at,
              });
              if (res.published) setPublished(true);
              setPdfReprintNeeded(await registryNeedsReprint(current.id, res.menu_version));
              setAutosaveHint(
                res.updated > 0
                  ? `Cucina OK su ${res.updated} · v${res.menu_version}`
                  : 'Cucina già ok su tutti',
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setConfirmingKitchenAll(false);
            }
          },
        },
      ],
    );
  };

  const scheduleAutosave = (i: number) => {
    if (!current) return;
    const existing = autosaveTimers.current[i];
    if (existing) clearTimeout(existing);
    autosaveTimers.current[i] = setTimeout(() => {
      void saveDish(i, { silent: true });
    }, AUTOSAVE_MS);
  };

  const update = (i: number, patch: Partial<PiattoIn>, autosave = false) => {
    const next = piattiRef.current.map((p, j) => (j === i ? { ...p, ...patch } : p));
    setPiatti(next);
    if (autosave) scheduleAutosave(i);
  };

  const cycle = (i: number, code: string) => {
    const p = piattiRef.current[i];
    if (!p) return;
    if (p.allergeni_contenuti.includes(code)) {
      update(
        i,
        {
          allergeni_contenuti: p.allergeni_contenuti.filter((c) => c !== code),
          allergeni_tracce: [...p.allergeni_tracce, code],
        },
        true,
      );
    } else if (p.allergeni_tracce.includes(code)) {
      update(i, { allergeni_tracce: p.allergeni_tracce.filter((c) => c !== code) }, true);
    } else {
      update(i, { allergeni_contenuti: [...p.allergeni_contenuti, code] }, true);
    }
  };

  const openAddDish = (categoria?: string) => {
    setAddError('');
    setAddCategory(categoria ?? null);
    setShowAddModal(true);
  };

  const saveNewDish = async (dish: PiattoIn, opts: { addAnother: boolean }): Promise<boolean> => {
    if (!current) return false;
    setAddBusy(true);
    setAddError('');
    try {
      const payload: PiattoIn = {
        nome_piatto: dish.nome_piatto.trim(),
        descrizione: dish.descrizione ?? null,
        categoria: dish.categoria ?? null,
        prezzo_cents: dish.prezzo_cents ?? null,
        image_url: dish.image_url ?? null,
        menu_group: dish.menu_group ?? 'Principale',
        kitchen_protocol_confirmed: dish.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at: dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: dish.allergeni_contenuti || [],
        allergeni_tracce: dish.allergeni_tracce || [],
      };
      const res = await api.createDish(current.id, payload, true);
      const created: PiattoIn = {
        id: res.dish.id,
        nome_piatto: res.dish.nome_piatto,
        descrizione: payload.descrizione,
        categoria: payload.categoria,
        prezzo_cents: payload.prezzo_cents,
        image_url: payload.image_url,
        menu_group: payload.menu_group,
        kitchen_protocol_confirmed: res.dish.kitchen_protocol_confirmed ?? 0,
        cross_contamination_checked_at: res.dish.cross_contamination_checked_at ?? null,
        allergeni_contenuti: res.dish.allergeni_contenuti || [],
        allergeni_tracce: res.dish.allergeni_tracce || [],
      };
      const next = [...piattiRef.current, created];
      setPiatti(next);
      patchCurrent({
        menu_version: res.menu_version,
        menu_updated_at: res.menu_updated_at,
      });
      if (res.published) setPublished(true);
      if (created.categoria) {
        setCatExpanded((prev) => ({ ...prev, [created.categoria!]: true }));
      }
      setAutosaveHint(`Creato · v${res.menu_version}`);
      setFlashIndex(next.length - 1);
      setTimeout(() => setFlashIndex(null), 1600);
      if (res.published) {
        setPdfReprintNeeded(await registryNeedsReprint(current.id, res.menu_version));
      }
      if (!opts.addAnother) {
        setShowAddModal(false);
        setExpandedDish(null);
      } else if (created.categoria) {
        setAddCategory(created.categoria);
      }
      return true;
    } catch (e) {
      setAddError((e as Error).message);
      return false;
    } finally {
      setAddBusy(false);
    }
  };

  const removeDish = (i: number) => {
    const dish = piattiRef.current[i];
    Alert.alert('Elimina piatto', `Eliminare "${dish?.nome_piatto || 'piatto senza nome'}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          const prev = piattiRef.current;
          const next = prev.filter((_, j) => j !== i);
          setPiatti(next);
          setExpandedDish(null);
          if (current && dish?.id) {
            try {
              await api.deleteDish(current.id, dish.id);
            } catch (e) {
              setError((e as Error).message);
              setPiatti(prev);
            }
          }
        },
      },
    ]);
  };

  const dishesByCategory = useMemo(() => {
    const map = new Map<string, number[]>();
    piatti.forEach((p, i) => {
      const cat = p.categoria?.trim() || 'Senza categoria';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(i);
    });
    const ordered: { cat: string; indices: number[] }[] = [];
    for (const c of CATEGORIE) {
      if (map.has(c)) ordered.push({ cat: c, indices: map.get(c)! });
      map.delete(c);
    }
    for (const [cat, indices] of map) ordered.push({ cat, indices });
    return ordered;
  }, [piatti]);

  const allergenSummary = (p: PiattoIn) => {
    const n = (p.allergeni_contenuti?.length || 0) + (p.allergeni_tracce?.length || 0);
    if (n === 0) return 'Nessun allergene';
    const cont = p.allergeni_contenuti?.length || 0;
    const trac = p.allergeni_tracce?.length || 0;
    if (cont && trac) return `${cont} contiene · ${trac} tracce`;
    if (cont) return `${cont} contiene`;
    return `${trac} tracce`;
  };

  const dishPhotoUri = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('file:')) return url;
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const uploadDishPhoto = async (i: number) => {
    Alert.alert('Foto del piatto', 'Scegli una foto chiara del piatto.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Fotocamera',
        onPress: () => void pickAndUploadDishPhoto(i, 'camera'),
      },
      {
        text: 'Galleria',
        onPress: () => void pickAndUploadDishPhoto(i, 'library'),
      },
    ]);
  };

  const pickAndUploadDishPhoto = async (i: number, source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'Abilita la fotocamera.');
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
    setPhotoUploadingIndex(i);
    setError('');
    try {
      const filename = uri.split('/').pop() || 'dish.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);
      const uploaded = await api.uploadImage(formData);
      update(i, { image_url: uploaded.url }, true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPhotoUploadingIndex(null);
    }
  };

  const renderDishRow = (i: number) => {
    const p = piatti[i];
    const open = expandedDish === i;
    const kitchenOk = p.kitchen_protocol_confirmed === 1;
    const saving = savingIndex === i;
    const flashed = flashIndex === i;
    const thumb = dishPhotoUri(p.image_url);
    const photoBusy = photoUploadingIndex === i;

    return (
      <View key={`${p.id ?? 'new'}-${i}`} style={[styles.dishCard, open && styles.dishCardOpen]}>
        <TouchableOpacity
          style={styles.dishRow}
          onPress={() => setExpandedDish(open ? null : i)}
          activeOpacity={0.85}
        >
          <View style={styles.thumbWrap}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbEmpty}>
                <Ionicons name="image-outline" size={18} color={colors.onSurfaceMuted} />
              </View>
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyBold" style={{ fontSize: 15 }} numberOfLines={1}>
              {p.nome_piatto.trim() || 'Nuovo piatto'}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} style={{ fontSize: 11 }}>
              {allergenSummary(p)}
              {p.prezzo_cents != null ? ` · €${(p.prezzo_cents / 100).toFixed(2)}` : ''}
            </AppText>
          </View>
          <View style={styles.dishMeta}>
            {saving || photoBusy ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : flashed ? (
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.green} />
            ) : (
              <View style={[styles.kitchenDot, kitchenOk ? styles.kitchenDotOk : styles.kitchenDotWarn]} />
            )}
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.onSurfaceMuted}
            />
          </View>
        </TouchableOpacity>

        {open ? (
          <View style={styles.dishEditor}>
            <TouchableOpacity
              style={styles.editorPhoto}
              onPress={() => uploadDishPhoto(i)}
              activeOpacity={0.9}
              disabled={photoBusy}
            >
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.editorPhotoImg} />
              ) : (
                <View style={styles.editorPhotoEmpty}>
                  <Ionicons name="camera-outline" size={22} color={colors.brandInk} />
                  <AppText variant="caption" style={{ marginTop: 6, fontWeight: '700' }}>
                    Aggiungi foto
                  </AppText>
                </View>
              )}
              {photoBusy ? (
                <View style={styles.editorPhotoOverlay}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : null}
              {thumb && !photoBusy ? (
                <View style={styles.editorPhotoBadge}>
                  <Ionicons name="camera-outline" size={12} color="#FFF" />
                  <AppText variant="caption" color="#FFF" style={{ fontSize: 10, fontWeight: '800' }}>
                    Cambia
                  </AppText>
                </View>
              ) : null}
            </TouchableOpacity>

            <TextInput
              style={styles.dishName}
              placeholder="Nome del piatto"
              placeholderTextColor={colors.onSurfaceMuted}
              value={p.nome_piatto}
              onChangeText={(t) => update(i, { nome_piatto: t })}
              onBlur={() => {
                if (p.nome_piatto.trim()) scheduleAutosave(i);
              }}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.catRow}>
                {CATEGORIE.map((c) => {
                  const on = p.categoria === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, on && styles.catChipOn]}
                      onPress={() => update(i, { categoria: on ? null : c }, true)}
                    >
                      <AppText
                        variant="caption"
                        style={{ fontWeight: '700', fontSize: 12, color: on ? colors.brandInk : colors.onSurfaceMuted }}
                      >
                        {c}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TextInput
              style={styles.field}
              placeholder="Prezzo € (opzionale)"
              placeholderTextColor={colors.onSurfaceMuted}
              keyboardType="decimal-pad"
              value={p.prezzo_cents != null ? String(p.prezzo_cents / 100) : ''}
              onChangeText={(t) => {
                const n = parseFloat(t.replace(',', '.'));
                update(i, { prezzo_cents: isNaN(n) ? null : Math.round(n * 100) });
              }}
              onBlur={() => scheduleAutosave(i)}
            />

            <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.allLabel}>
              Allergeni — tocca: contiene → tracce → assente
            </AppText>
            <View style={styles.allGrid}>
              {allergens
                .filter((a) => !a.is_diet)
                .map((a) => {
                  const cont = p.allergeni_contenuti.includes(a.code);
                  const trac = p.allergeni_tracce.includes(a.code);
                  return (
                    <TouchableOpacity
                      key={a.code}
                      style={[styles.allChip, cont && styles.allCont, trac && styles.allTrac]}
                      onPress={() => cycle(i, a.code)}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          fontSize: 12,
                          fontWeight: cont || trac ? '700' : '500',
                          color: cont ? colors.redText : trac ? colors.amberText : colors.onSurfaceMuted,
                        }}
                      >
                        {a.name_it}
                        {cont ? ' ·' : trac ? ' ~' : ''}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <TouchableOpacity
              style={styles.kitchenRow}
              onPress={() =>
                update(
                  i,
                  {
                    kitchen_protocol_confirmed: p.kitchen_protocol_confirmed === 1 ? 0 : 1,
                    cross_contamination_checked_at:
                      p.kitchen_protocol_confirmed === 1 ? null : new Date().toISOString(),
                  },
                  true,
                )
              }
            >
              <View style={[styles.checkbox, kitchenOk && styles.checkboxOn]}>
                {kitchenOk ? <Ionicons name="checkmark-outline" size={14} color="#FFF" /> : null}
              </View>
              <AppText variant="caption" style={{ flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' }}>
                Conferma cucina: niente contaminazione crociata sugli allergeni esclusi
              </AppText>
            </TouchableOpacity>

            <View style={styles.dishActions}>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeDish(i)}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <SurfaceButton
                  label={
                    saving
                      ? 'Salvataggio…'
                      : flashed
                        ? 'Salvato'
                        : p.id
                          ? 'Salva piatto'
                          : 'Crea piatto'
                  }
                  onPress={() => saveDish(i)}
                  disabled={saving}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  if (!current) {
    return (
      <GlassScreenScroll headerFloat>
        <GlassCard style={styles.emptyCard}>
          <AppText variant="h2" style={{ fontSize: 17, textAlign: 'center' }}>
            Seleziona prima un locale
          </AppText>
          <AppText variant="caption" style={{ textAlign: 'center', marginVertical: 12 }}>
            Scegli o crea l’attività, poi gestisci i piatti da qui.
          </AppText>
          <SurfaceButton label="Vai ad Attività" onPress={() => router.push('/(owner)/locali')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  const status = current.subscription_status ?? 'free';
  const plan = current.business_plan ?? 'free';
  const hasMenuAccess =
    status === 'comped' ||
    ((plan === 'base' || plan === 'pro_notify') && (status === 'trialing' || status === 'active'));

  if (!hasMenuAccess) {
    return (
      <GlassScreenScroll headerFloat>
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.brand} style={{ marginBottom: 8 }} />
          <AppText variant="h2" style={{ fontSize: 17, textAlign: 'center' }}>
            Menù digitale dal piano Base
          </AppText>
          <AppText variant="caption" style={{ textAlign: 'center', marginVertical: 12, lineHeight: 19 }}>
            Crea piatti con allergeni e tracce, genera il QR e stampa il registro. Prova 14 giorni gratis,
            senza carta.
          </AppText>
          <SurfaceButton label="Attiva prova gratuita" onPress={() => router.push('/(owner)/piano')} />
        </GlassCard>
      </GlassScreenScroll>
    );
  }

  const pickImageAndAnalyze = async () => {
    Alert.alert('Carica foto menù (AI)', 'Foto nitida del menù cartaceo: l’AI propone piatti e allergeni.', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Fotocamera', onPress: handleLaunchCamera },
      { text: 'Galleria', onPress: handleLaunchLibrary },
    ]);
  };

  const handleLaunchCamera = async () => {
    const { status: cam } = await ImagePicker.requestCameraPermissionsAsync();
    if (cam !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita la fotocamera nelle impostazioni.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) uploadPhoto(res.assets[0].uri);
  };

  const handleLaunchLibrary = async () => {
    const { status: lib } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib !== 'granted') {
      Alert.alert('Permesso negato', 'Consenti l’accesso alla galleria.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) uploadPhoto(res.assets[0].uri);
  };

  const uploadPhoto = async (uri: string) => {
    setError('');
    setLoadingStep('Preparazione immagine…');
    try {
      setTimeout(() => setLoadingStep('Caricamento…'), 800);
      setTimeout(() => setLoadingStep('Lettura OCR…'), 1800);
      setTimeout(() => setLoadingStep('Allergeni con AI…'), 2800);
      const filename = uri.split('/').pop() || 'menu.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);
      const res = await api.analyze(formData);
      if (res.piatti?.length > 0) {
        setPiatti(res.piatti);
        setExpandedDish(0);
        if (res.note) Alert.alert('Analisi completata', res.note);
      } else {
        Alert.alert('Nessun piatto', 'Prova con una foto più nitida.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!menuUrlInput.trim()) return;
    setShowUrlModal(false);
    setError('');
    setLoadingStep('Connessione al link…');
    try {
      setTimeout(() => setLoadingStep('Download menù…'), 1000);
      setTimeout(() => setLoadingStep('Estrazione allergeni…'), 2200);
      const res = await api.analyzeUrl(menuUrlInput.trim());
      if (res.piatti?.length > 0) {
        setPiatti(res.piatti);
        setMenuUrlInput('');
        setExpandedDish(0);
        if (res.note) Alert.alert('Analisi completata', res.note);
      } else {
        Alert.alert('Nessun piatto', 'Assicurati che il link sia un menù valido.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingStep(null);
    }
  };

  const publish = async () => {
    const validi = piatti.filter((p) => p.nome_piatto.trim());
    if (validi.length === 0) {
      setError('Aggiungi almeno un piatto con un nome.');
      return;
    }
    const republishOnly = legalAlreadyCurrent;
    if (!republishOnly && !legalAck) {
      setError('Conferma prima la responsabilità sui dati allergeni.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const allNew = validi.every((p) => !p.id);
      if (allNew) {
        await api.saveMenu(current.id, validi);
      } else {
        for (const p of validi) {
          const payload: PiattoIn = {
            nome_piatto: p.nome_piatto.trim(),
            descrizione: p.descrizione ?? null,
            categoria: p.categoria ?? null,
            prezzo_cents: p.prezzo_cents ?? null,
            image_url: p.image_url ?? null,
            menu_group: p.menu_group ?? 'Principale',
            kitchen_protocol_confirmed: p.kitchen_protocol_confirmed ?? 0,
            cross_contamination_checked_at: p.cross_contamination_checked_at ?? null,
            allergeni_contenuti: p.allergeni_contenuti || [],
            allergeni_tracce: p.allergeni_tracce || [],
          };
          if (p.id) await api.updateDish(current.id, p.id, payload, false);
          else await api.createDish(current.id, payload, false);
        }
      }
      const approved = await api.approve(current.id, legalAck || republishOnly, republishOnly);
      setPublished(true);
      patchCurrent({
        menu_version: approved.menu_version,
        menu_updated_at: approved.menu_updated_at,
        menu_legal_confirmed_at: approved.menu_legal_confirmed_at,
        menu_legal_version: approved.menu_legal_version,
      });
      setPdfReprintNeeded(await registryNeedsReprint(current.id, approved.menu_version));
      Alert.alert('Pubblicato', 'QR-menu attivo. Ristampa il Registro Allergeni aggiornato.', [
        { text: 'Apri Registro', onPress: () => router.push('/(owner)/registro') },
        { text: 'QR tavoli', onPress: () => router.push('/(owner)/qr') },
      ]);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const publishDisabled = busy || namedCount === 0 || (!legalAlreadyCurrent && !legalAck);

  return (
    <View style={{ flex: 1 }}>
      <GlassScreenScroll headerFloat contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 88 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" color={colors.textSecondary} style={{ fontSize: 9 }}>
              GESTIONE MENÙ
            </AppText>
            <AppText variant="h2" style={{ fontSize: 20 }} numberOfLines={1}>
              {current.name}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted}>
              #{current.public_code} · {namedCount} piatti
              {autosaveHint ? ` · ${autosaveHint}` : ''}
            </AppText>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => openAddDish()} activeOpacity={0.85}>
            <Ionicons name="add-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {error ? (
          <AppText variant="bodyBold" color={colors.red} style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}

        {pdfReprintNeeded ? (
          <TouchableOpacity style={styles.warnBanner} onPress={() => router.push('/(owner)/registro')}>
            <Ionicons name="print-outline" size={18} color={colors.amberText} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ fontSize: 13, color: colors.amberText }}>
                Registro Allergeni da ristampare
              </AppText>
              <AppText variant="caption" style={{ color: colors.amberText }}>
                Menù v{current.menu_version ?? 0} · modulo UE 1169/2011
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.amberText} />
          </TouchableOpacity>
        ) : null}

        {piatti.length > 0 ? (
          <TouchableOpacity
            style={[styles.kitchenAll, pendingKitchen === 0 && styles.kitchenAllOk]}
            disabled={confirmingKitchenAll || pendingKitchen === 0}
            onPress={confirmKitchenAll}
          >
            {confirmingKitchenAll ? (
              <ActivityIndicator color={colors.brandInk} />
            ) : (
              <>
                <Ionicons
                  name={pendingKitchen > 0 ? 'flame-outline' : 'checkmark-circle'}
                  size={18}
                  color={pendingKitchen > 0 ? colors.amberText : colors.greenText}
                />
                <AppText
                  variant="bodyBold"
                  style={{
                    fontSize: 13,
                    color: pendingKitchen > 0 ? colors.amberText : colors.greenText,
                  }}
                >
                  {pendingKitchen > 0
                    ? `Conferma cucina su tutti (${pendingKitchen})`
                    : 'Cucina OK su tutti i piatti'}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {!loaded ? (
          <ActivityIndicator style={{ marginVertical: 40 }} color={colors.brand} />
        ) : dishesByCategory.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <AppText variant="bodyBold" style={{ textAlign: 'center', marginBottom: 8 }}>
              Nessun piatto ancora
            </AppText>
            <AppText variant="caption" style={{ textAlign: 'center', marginBottom: 16 }}>
              Aggiungi il primo piatto, imposta gli allergeni, conferma cucina.
            </AppText>
            <SurfaceButton label="Aggiungi piatto" icon="add" onPress={() => openAddDish()} />
          </GlassCard>
        ) : (
          dishesByCategory.map(({ cat, indices }, idx) => {
            const filled = indices.filter((i) => piatti[i].nome_piatto.trim()).length;
            const expanded = catExpanded[cat] ?? idx === 0;
            return (
              <CollapseSection
                key={cat}
                icon="restaurant"
                title={cat}
                preview={`${filled} piatti`}
                badge={indices.length}
                expanded={expanded}
                onToggle={() => setCatExpanded((prev) => ({ ...prev, [cat]: !expanded }))}
              >
                {indices.map((i) => renderDishRow(i))}
                <TouchableOpacity style={styles.addInCat} onPress={() => openAddDish(cat === 'Senza categoria' ? undefined : cat)}>
                  <Ionicons name="add-outline" size={16} color={colors.brand} />
                  <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                    Aggiungi in {cat}
                  </AppText>
                </TouchableOpacity>
              </CollapseSection>
            );
          })
        )}

        <CollapseSection
          icon="cloud-upload"
          title="Importa con AI"
          preview="Foto o link menù"
          expanded={importExpanded}
          onToggle={() => setImportExpanded((v) => !v)}
        >
          <AppText variant="caption" style={{ marginBottom: 12, lineHeight: 18 }}>
            Bozza automatica: verifica sempre allergeni e tracce prima di pubblicare.
          </AppText>
          <View style={styles.aiRow}>
            <View style={{ flex: 1 }}>
              <SurfaceButton label="Foto menù" icon="camera-outline" variant="soft" onPress={pickImageAndAnalyze} />
            </View>
            <View style={{ flex: 1 }}>
              <SurfaceButton label="Da link" icon="link-outline" variant="soft" onPress={() => setShowUrlModal(true)} />
            </View>
          </View>
        </CollapseSection>

        {!legalAlreadyCurrent ? (
          <TouchableOpacity style={styles.legalRow} onPress={() => setLegalAck(!legalAck)}>
            <View style={[styles.checkbox, legalAck && styles.checkboxOn]}>
              {legalAck ? <Ionicons name="checkmark-outline" size={14} color="#FFF" /> : null}
            </View>
            <AppText variant="caption" style={{ flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' }}>
              Confermo di aver verificato ingredienti, allergeni e tracce. Le informazioni pubblicate
              sono sotto la responsabilità del locale.
            </AppText>
          </TouchableOpacity>
        ) : null}
      </GlassScreenScroll>

      <View style={styles.publishBar}>
        <SurfaceButton
          label={
            busy
              ? 'Pubblicazione…'
              : legalAlreadyCurrent
                ? `Pubblica modifiche (${namedCount})`
                : `Pubblica menù (${namedCount})`
          }
          onPress={publish}
          disabled={publishDisabled}
          icon="checkmark-circle-outline"
        />
      </View>

      <AddDishModal
        visible={showAddModal}
        allergens={allergens}
        initialCategory={addCategory}
        busy={addBusy}
        error={addError}
        onClose={() => {
          if (!addBusy) {
            setShowAddModal(false);
            setAddError('');
          }
        }}
        onSave={saveNewDish}
      />

      <Modal visible={showUrlModal} transparent animationType="slide" onRequestClose={() => setShowUrlModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="h2" style={{ fontSize: 17, marginBottom: 8 }}>
              Analizza da link
            </AppText>
            <AppText variant="caption" style={{ marginBottom: 16, lineHeight: 18 }}>
              Inserisci l’URL del menù online (PDF o pagina web).
            </AppText>
            <TextInput
              style={styles.modalInput}
              placeholder="https://esempio.it/menu.pdf"
              placeholderTextColor={colors.onSurfaceMuted}
              keyboardType="url"
              autoCapitalize="none"
              value={menuUrlInput}
              onChangeText={setMenuUrlInput}
            />
            <View style={styles.modalButtons}>
              <View style={{ flex: 1 }}>
                <SurfaceButton label="Annulla" variant="soft" onPress={() => setShowUrlModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <SurfaceButton label="Analizza" onPress={handleAnalyzeUrl} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={loadingStep !== null} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color={colors.brand} />
            <AppText variant="bodyBold" style={{ fontSize: 15 }}>
              Elaborazione AI
            </AppText>
            <AppText variant="caption" color={colors.brand} style={{ textAlign: 'center' }}>
              {loadingStep}
            </AppText>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.sm,
  },
  kitchenAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  kitchenAllOk: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dishCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dishCardOpen: {
    borderColor: colors.brand,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  thumb: { width: '100%', height: '100%' },
  thumbEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kitchenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kitchenDotOk: { backgroundColor: colors.green },
  kitchenDotWarn: { backgroundColor: colors.yellow },
  dishEditor: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editorPhoto: {
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.brand100,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  editorPhotoImg: { width: '100%', height: '100%' },
  editorPhotoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(54, 37, 92, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorPhotoBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(54, 37, 92, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  dishName: {
    marginTop: 10,
    fontFamily: font.displaySemibold,
    fontSize: 16,
    color: colors.brandInk,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  catRow: { flexDirection: 'row', gap: 6 },
  catChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: colors.surfaceTertiary,
  },
  catChipOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand100,
  },
  field: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.brandInk,
    width: 170,
  },
  allLabel: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allChip: {
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: colors.surface,
  },
  allCont: { borderColor: colors.red, backgroundColor: colors.redSoft },
  allTrac: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  kitchenRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 12,
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
  dishActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInCat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    borderRadius: radius.md,
    marginTop: 4,
  },
  aiRow: { flexDirection: 'row', gap: 8 },
  legalRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  publishBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: TAB_BAR_CLEARANCE - 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(54, 37, 92, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalInput: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.brandInk,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(54, 37, 92, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: 250,
  },
});
