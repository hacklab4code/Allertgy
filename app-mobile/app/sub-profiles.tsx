import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import type { Allergen, AllergyCriterio, AllergyIntensity, SubProfile } from '../src/types';
import { colors, font, radius, spacing } from '../src/theme';
import { toggleAllergieSelectionWithIntensities } from '../src/engine/allergyLinks';
import { criterioShortLabel, intensityShortLabel } from '../src/engine/allergyConfig';
import { TRANSLATED_ALLERGENS } from '../src/engine/translations';
import {
  AppText,
  AvatarBubble,
  avatarForIndex,
  DebossedInput,
  EmptyStateCard,
  GlassCard,
  GlassScreenScroll,
  HeaderAddButton,
  SurfaceButton,
  Screen,
  ScreenTopHeader,
  Section,
  AmbientMesh,
  AllergyChip,
  AllergyConfigModal,
  CATEGORY_ICONS,
} from '../src/components/ui';

type AllergenSel = { intensity: AllergyIntensity; criterio: AllergyCriterio };

const STORAGE_KEY_PHOTOS = '@allertgy_subprofile_photos';

const RELATIONS = [
  { label: 'Figlio/a', labelEn: 'Child', value: 'figlio', icon: 'happy-outline' as const },
  { label: 'Coniuge/Partner', labelEn: 'Spouse/Partner', value: 'coniuge', icon: 'heart-outline' as const },
  { label: 'Genitore', labelEn: 'Parent', value: 'genitore', icon: 'shield-outline' as const },
  { label: 'Amico/a', labelEn: 'Friend', value: 'amico', icon: 'people-outline' as const },
  { label: 'Altro', labelEn: 'Other', value: 'altro', icon: 'ellipsis-horizontal-outline' as const },
];

const CATEGORY_TABS: { key: string; labelIt: string; labelEn: string; iconName: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', labelIt: 'Tutti', labelEn: 'All', iconName: 'sparkles-outline' },
  { key: 'ue', labelIt: '14 UE', labelEn: '14 EU', iconName: 'shield-checkmark-outline' },
  { key: 'frutta_guscio', labelIt: 'Noci', labelEn: 'Nuts', iconName: 'nutrition-outline' },
  { key: 'frutta', labelIt: 'Frutta', labelEn: 'Fruit', iconName: 'leaf-outline' },
  { key: 'verdura', labelIt: 'Verdura', labelEn: 'Veggie', iconName: 'flower-outline' },
  { key: 'cereali', labelIt: 'Cereali', labelEn: 'Grains', iconName: 'restaurant-outline' },
  { key: 'spezie', labelIt: 'Spezie', labelEn: 'Spices', iconName: 'flame-outline' },
  { key: 'intolleranze', labelIt: 'Intolleranze', labelEn: 'Intolerances', iconName: 'water-outline' },
];

async function getStoredPhotos(): Promise<Record<number, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PHOTOS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveStoredPhoto(id: number, uri: string | null) {
  try {
    const map = await getStoredPhotos();
    if (uri) {
      map[id] = uri;
    } else {
      delete map[id];
    }
    await AsyncStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(map));
  } catch (e) {
    console.log('Errore salvataggio foto subprofile:', e);
  }
}

export default function SubProfilesScreen() {
  const insets = useSafeAreaInsets();
  const { subProfiles, setSubProfiles, language, profilePhotoUrl } = useSession();
  const params = useLocalSearchParams<{ edit?: string; add?: string }>();

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SubProfile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('figlio');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<Record<string, AllergenSel>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'grave' | 'moderata' | 'lieve'>('all');
  const [configModalTarget, setConfigModalTarget] = useState<Allergen | null>(null);

  const isIt = (language || 'it').toLowerCase() === 'it';
  const familyProfiles = subProfiles.filter((p) => p.relationship !== 'io');
  const primaryProfile = subProfiles.find((p) => p.relationship === 'io');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.allergens();
      setAllergens(all.filter((a) => !a.is_diet));
      const profiles = await api.getSubProfiles();
      const photosMap = await getStoredPhotos();
      const withPhotos = profiles.map((p) => ({
        ...p,
        photo_uri: photosMap[p.id] || p.photo_uri || p.image_url || null,
      }));
      setSubProfiles(withPhotos);
    } catch (e) {
      console.log('Errore caricamento profili:', e);
    }
    setLoading(false);
  }, [setSubProfiles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = useCallback(() => {
    setEditingProfile(null);
    setName('');
    setRelationship('figlio');
    setPhotoUri(null);
    setSelectedAllergens({});
    setSearchQuery('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((p: SubProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setRelationship(p.relationship);
    setPhotoUri(p.photo_uri || p.image_url || null);
    const mapped: Record<string, AllergenSel> = {};
    p.allergens.forEach((a) => {
      mapped[a.code] = {
        intensity: a.intensity || 'moderata',
        criterio: a.criterio || 'assoluto',
      };
    });
    setSelectedAllergens(mapped);
    setSearchQuery('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setModalVisible(true);
  }, []);

  useEffect(() => {
    if (loading || subProfiles.length === 0) return;
    if (params.add === '1') {
      openAddModal();
      router.setParams({ add: undefined });
    } else if (params.edit) {
      const id = Number(params.edit);
      const target = subProfiles.find((p) => p.id === id);
      if (target) openEditModal(target);
      router.setParams({ edit: undefined });
    }
  }, [params.add, params.edit, subProfiles, loading, openAddModal, openEditModal]);

  const toggleAllergen = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selected = new Set(Object.keys(selectedAllergens));
    const intensityMap: Record<string, AllergyIntensity> = {};
    for (const [k, v] of Object.entries(selectedAllergens)) intensityMap[k] = v.intensity;
    const { intensities } = toggleAllergieSelectionWithIntensities(
      selected,
      intensityMap,
      code,
    );
    const next: Record<string, AllergenSel> = {};
    for (const [k, intensity] of Object.entries(intensities)) {
      next[k] = {
        intensity,
        criterio: selectedAllergens[k]?.criterio || 'assoluto',
      };
    }
    setSelectedAllergens(next);
  };

  const updateConfig = (code: string, intensity: AllergyIntensity, criterio: AllergyCriterio) => {
    setSelectedAllergens((prev) => ({
      ...prev,
      [code]: { intensity, criterio },
    }));
  };

  const clearAllSelected = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAllergens({});
    setSeverityFilter('all');
  };

  const handlePickPhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      isIt ? 'Foto del Familiare' : 'Family Member Photo',
      isIt
        ? 'Aggiungi una foto reale per riconoscere subito questo profilo.'
        : 'Add a photo to recognize this profile instantly.',
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? '📷 Scatta Foto' : '📷 Take Photo',
          onPress: () => void launchPicker('camera'),
        },
        {
          text: isIt ? '🖼️ Scegli dalla Galleria' : '🖼️ Choose from Gallery',
          onPress: () => void launchPicker('library'),
        },
        ...(photoUri
          ? [
              {
                text: isIt ? '🗑️ Rimuovi Foto' : '🗑️ Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setPhotoUri(null);
                },
              },
            ]
          : []),
      ],
    );
  };

  const launchPicker = async (mode: 'camera' | 'library') => {
    try {
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            isIt ? 'Permesso negato' : 'Permission denied',
            isIt
              ? 'Abilita l\'accesso alla fotocamera nelle impostazioni del dispositivo.'
              : 'Enable camera access in device settings.',
          );
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setPhotoUri(res.assets[0].uri);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            isIt ? 'Permesso negato' : 'Permission denied',
            isIt
              ? 'Consenti l\'accesso alla galleria foto nelle impostazioni del dispositivo.'
              : 'Enable photo library access in device settings.',
          );
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setPhotoUri(res.assets[0].uri);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(isIt ? 'Attenzione' : 'Warning', isIt ? 'Inserisci un nome valido.' : 'Please enter a valid name.');
      return;
    }
    setSaving(true);
    try {
      const payloadAllergens = Object.keys(selectedAllergens).map((code) => ({
        code,
        intensity: selectedAllergens[code].intensity,
        criterio: selectedAllergens[code].criterio,
      }));
      const body = {
        name: name.trim(),
        relationship: editingProfile?.relationship === 'io' ? 'io' : relationship,
        photo_uri: photoUri,
        allergens: payloadAllergens,
      };
      if (editingProfile) {
        const updated = await api.updateSubProfile(editingProfile.id, body);
        await saveStoredPhoto(editingProfile.id, photoUri);
        const withPhoto: SubProfile = { ...updated, photo_uri: photoUri };
        setSubProfiles(subProfiles.map((p) => (p.id === editingProfile.id ? withPhoto : p)));
      } else {
        const created = await api.createSubProfile(body);
        await saveStoredPhoto(created.id, photoUri);
        const withPhoto: SubProfile = { ...created, photo_uri: photoUri };
        setSubProfiles([...subProfiles, withPhoto]);
      }
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setSaving(false);
  };

  const handleDelete = (p: SubProfile) => {
    if (p.relationship === 'io') {
      Alert.alert(
        isIt ? 'Azione non consentita' : 'Action not allowed',
        isIt ? 'Non puoi eliminare il profilo principale.' : 'You cannot delete your primary profile.',
      );
      return;
    }
    Alert.alert(
      isIt ? 'Elimina profilo' : 'Delete profile',
      isIt ? `Eliminare il profilo di ${p.name}?` : `Delete ${p.name}'s profile?`,
      [
        { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
        {
          text: isIt ? 'Elimina' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteSubProfile(p.id);
              await saveStoredPhoto(p.id, null);
              setSubProfiles(subProfiles.filter((item) => item.id !== p.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
            }
            setLoading(false);
          },
        },
      ],
    );
  };

  const getRelationInfo = (rel: string) => {
    if (rel === 'io') return { label: isIt ? 'Profilo principale' : 'Primary profile', icon: 'person-outline' as const };
    const found = RELATIONS.find((r) => r.value === rel);
    return {
      label: found ? (isIt ? found.label : found.labelEn) : rel,
      icon: found?.icon || ('person-outline' as const),
    };
  };

  const intensityStyle = (intensity: string) => {
    if (intensity === 'lieve') return styles.chipLieve;
    if (intensity === 'grave') return styles.chipGrave;
    return styles.chipModerata;
  };

  // Severity Stats for selected allergens
  const severityStats = useMemo(() => {
    let grave = 0;
    let moderata = 0;
    let lieve = 0;
    const entries = Object.entries(selectedAllergens);
    entries.forEach(([, val]) => {
      if (val.intensity === 'grave') grave++;
      else if (val.intensity === 'lieve') lieve++;
      else moderata++;
    });
    return { total: entries.length, grave, moderata, lieve };
  }, [selectedAllergens]);

  // Filtered allergens inside modal
  const filteredAllergens = useMemo(() => {
    return allergens.filter((a) => {
      // Severity Filter
      if (severityFilter !== 'all') {
        const sel = selectedAllergens[a.code];
        if (!sel || sel.intensity !== severityFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'ue' && a.category && a.category !== 'ue') return false;
        if (categoryFilter !== 'ue' && a.category !== categoryFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const itMatch = (a.name_it || '').toLowerCase().includes(q);
        const enMatch = (a.name_en || '').toLowerCase().includes(q);
        const codeMatch = (a.code || '').toLowerCase().includes(q);
        const dictMatch = TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.it.toLowerCase().includes(q) ||
          TRANSLATED_ALLERGENS[a.code.toLowerCase()]?.en.toLowerCase().includes(q);
        return itMatch || enMatch || codeMatch || dictMatch;
      }
      return true;
    });
  }, [allergens, categoryFilter, searchQuery, severityFilter, selectedAllergens]);

  const selectedCount = Object.keys(selectedAllergens).length;
  const currentRelationObj = RELATIONS.find((r) => r.value === relationship) || RELATIONS[0];

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Profili Famiglia' : 'Family Profiles'}
        rightElement={
          <HeaderAddButton onPress={openAddModal} accessibilityLabel="Aggiungi persona" />
        }
      />
      <GlassScreenScroll headerFloat={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Section
          title={isIt ? 'Gestione Famiglia' : 'Family Management'}
          subtitle={isIt
            ? 'Ogni profilo ha allergie separate per le scansioni del menu e del semaforo.'
            : 'Each profile has separate allergies for menu scans and traffic light.'}
        >
          {loading && <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.md }} />}

          {primaryProfile && (
            <GlassCard style={styles.primaryCard}>
              <View style={styles.cardRow}>
                <AvatarBubble
                  imageUrl={profilePhotoUrl}
                  {...avatarForIndex(0)}
                  active
                  size={52}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyBold" style={{ fontSize: 16 }}>{primaryProfile.name}</AppText>
                  <View style={styles.relationBadgeInline}>
                    <Ionicons name="person-outline" size={12} color={colors.brand} />
                    <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                      {getRelationInfo('io').label}
                    </AppText>
                  </View>
                </View>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => router.push('/allergie')}
                  accessibilityLabel="Modifica allergie personali"
                >
                  <Ionicons name="create-outline" size={18} color={colors.brand} />
                </Pressable>
              </View>
              <View style={styles.chips}>
                {primaryProfile.allergens.length === 0 ? (
                  <AppText variant="caption" color={colors.onSurfaceMuted}>
                    {isIt ? 'Nessun allergene selezionato' : 'No allergens selected'}
                  </AppText>
                ) : (
                  primaryProfile.allergens.map((a) => (
                    <View key={a.code} style={[styles.chip, intensityStyle(a.intensity)]}>
                      <AppText variant="caption" style={styles.chipText}>
                        {a.emoji} {a.name_it}
                        {a.intensity ? ` · ${intensityShortLabel(a.intensity, isIt)}` : ''}
                        {a.criterio && a.criterio !== 'assoluto' ? ` · ${criterioShortLabel(a.criterio, isIt)}` : ''}
                      </AppText>
                    </View>
                  ))
                )}
              </View>
            </GlassCard>
          )}
        </Section>

        <Section
          title={isIt ? 'Membri della Famiglia' : 'Family Members'}
          subtitle={familyProfiles.length > 0
            ? `${familyProfiles.length} ${isIt ? 'profili configurati' : 'configured profiles'}`
            : (isIt ? 'Aggiungi i tuoi familiari per proteggerli a tavola' : 'Add family members to protect them while dining')}
        >
          {!loading && familyProfiles.length === 0 ? (
            <EmptyStateCard
              icon="people-outline"
              title={isIt ? 'Nessun sottoprofilo' : 'No sub-profiles'}
              description={isIt
                ? 'Aggiungi figli, partner o amici con la loro foto e allergie dedicate.'
                : 'Add children, partners, or friends with their dedicated photo and allergies.'}
              actionLabel={isIt ? '+ Aggiungi membro' : '+ Add member'}
              onAction={openAddModal}
            />
          ) : (
            <View style={styles.list}>
              {familyProfiles.map((p, i) => {
                const rel = getRelationInfo(p.relationship);
                const initialLetter = (p.name.trim()[0] || 'F').toUpperCase();
                return (
                  <GlassCard key={p.id}>
                    <View style={styles.cardRow}>
                      {p.photo_uri || p.image_url ? (
                        <Image
                          source={{ uri: p.photo_uri || p.image_url || '' }}
                          style={styles.memberPhotoThumb}
                        />
                      ) : (
                        <View style={styles.memberFallbackThumb}>
                          <AppText style={styles.memberFallbackLetter}>{initialLetter}</AppText>
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="bodyBold" style={{ fontSize: 16 }}>{p.name}</AppText>
                        <View style={styles.relationBadgeInline}>
                          <Ionicons name={rel.icon} size={12} color={colors.brand} />
                          <AppText variant="caption" color={colors.brand} style={{ fontWeight: '600' }}>
                            {rel.label}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <Pressable
                          style={styles.iconBtn}
                          onPress={() => openEditModal(p)}
                          accessibilityLabel={`Modifica ${p.name}`}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.brand} />
                        </Pressable>
                        <Pressable
                          style={[styles.iconBtn, styles.iconBtnDanger]}
                          onPress={() => handleDelete(p)}
                          accessibilityLabel={`Elimina ${p.name}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.red} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.chips}>
                      {p.allergens.length === 0 ? (
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {isIt ? 'Nessun allergene impostato' : 'No allergens set'}
                        </AppText>
                      ) : (
                        p.allergens.map((a) => (
                          <View key={a.code} style={[styles.chip, intensityStyle(a.intensity)]}>
                            <AppText variant="caption" style={styles.chipText}>
                              {a.emoji} {a.name_it} ({intensityShortLabel(a.intensity, isIt)}
                              {a.criterio && a.criterio !== 'assoluto' ? ` · ${criterioShortLabel(a.criterio, isIt)}` : ''})
                            </AppText>
                          </View>
                        ))
                      )}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}

          {familyProfiles.length > 0 && (
            <SurfaceButton
              label={isIt ? 'Aggiungi altro membro' : 'Add another member'}
              icon="add-outline"
              variant="soft"
              onPress={openAddModal}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </Section>
      </GlassScreenScroll>

      {/* MODAL AGGIUNGI / MODIFICA MEMBRO FAMIGLIA */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalRoot,
            { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 12) : insets.top + 8 },
          ]}
        >
          <AmbientMesh />

          {/* Modal Top Drag Handle */}
          <View style={styles.modalHandle} />

          {/* Modal Header con Glassmorphism */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.modalBadge}>
                <Ionicons name="people-outline" size={13} color={colors.brand} />
                <AppText variant="caption" color={colors.brand} style={{ fontWeight: '800', letterSpacing: 0.5 }}>
                  {editingProfile
                    ? (isIt ? 'MODIFICA MEMBRO' : 'EDIT MEMBER')
                    : (isIt ? 'PROFILO FAMILIARE' : 'FAMILY PROFILE')}
                </AppText>
              </View>
              <AppText variant="h2" style={styles.modalTitle}>
                {editingProfile
                  ? (isIt ? 'Modifica Profilo' : 'Edit Profile')
                  : (isIt ? 'Nuovo Membro Famiglia' : 'New Family Member')}
              </AppText>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(false);
              }}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityLabel="Chiudi"
            >
              <Ionicons name="close-outline" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HERO PREVIEW CARD WITH REAL PHOTO PICKER */}
            <GlassCard style={styles.previewCard}>
              <View style={styles.previewHeroRow}>
                {/* Photo Trigger with Camera Badge */}
                <Pressable
                  onPress={handlePickPhoto}
                  style={({ pressed }) => [styles.photoAvatarWrapper, pressed && styles.avatarPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Foto profilo"
                >
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photoAvatarImage} />
                  ) : (
                    <View style={styles.photoAvatarPlaceholder}>
                      {name.trim() ? (
                        <AppText style={styles.photoPlaceholderLetter}>
                          {name.trim()[0].toUpperCase()}
                        </AppText>
                      ) : (
                        <Ionicons name="camera-outline" size={26} color={colors.brand} />
                      )}
                    </View>
                  )}
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
                  </View>
                </Pressable>

                {/* Profile Details Live Preview */}
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText
                    variant="bodyBold"
                    style={{
                      fontSize: 18,
                      fontFamily: font.bold,
                      color: name.trim() ? colors.ink : colors.onSurfaceMuted,
                    }}
                    numberOfLines={1}
                  >
                    {name.trim() || (isIt ? 'Nome del familiare' : 'Family member name')}
                  </AppText>

                  <View style={styles.previewMetaRow}>
                    <View style={styles.relationBadgeHero}>
                      <Ionicons name={currentRelationObj.icon} size={13} color={colors.brand} />
                      <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                        {isIt ? currentRelationObj.label : currentRelationObj.labelEn}
                      </AppText>
                    </View>

                    <View style={[
                      styles.allergyCountPill,
                      selectedCount > 0 && styles.allergyCountPillActive,
                    ]}>
                      <Ionicons
                        name={selectedCount > 0 ? "shield-checkmark-outline" : "shield-outline"}
                        size={12}
                        color={selectedCount > 0 ? colors.brand : colors.onSurfaceMuted}
                      />
                      <AppText
                        variant="caption"
                        color={selectedCount > 0 ? colors.brand : colors.onSurfaceMuted}
                        style={{ fontWeight: selectedCount > 0 ? '700' : '500' }}
                      >
                        {selectedCount === 0
                          ? (isIt ? '0 allergie' : '0 allergies')
                          : `${selectedCount} ${isIt ? (selectedCount === 1 ? 'allergia' : 'allergie') : 'allergies'}`}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Photo Action Buttons */}
              <View style={styles.photoActionsBar}>
                <Pressable
                  onPress={() => void launchPicker('camera')}
                  style={({ pressed }) => [styles.photoActionChip, pressed && styles.pressed]}
                >
                  <Ionicons name="camera-outline" size={15} color={colors.brand} />
                  <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                    {isIt ? 'Scatta Foto' : 'Take Photo'}
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => void launchPicker('library')}
                  style={({ pressed }) => [styles.photoActionChip, pressed && styles.pressed]}
                >
                  <Ionicons name="images-outline" size={15} color={colors.brand} />
                  <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                    {isIt ? 'Scegli Galleria' : 'Choose Gallery'}
                  </AppText>
                </Pressable>

                {photoUri && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setPhotoUri(null);
                    }}
                    style={({ pressed }) => [styles.photoRemoveChip, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.red} />
                    <AppText variant="caption" color={colors.red} style={{ fontWeight: '700' }}>
                      {isIt ? 'Rimuovi' : 'Remove'}
                    </AppText>
                  </Pressable>
                )}
              </View>
            </GlassCard>

            {/* SEZIONE 1: Dati Anagrafici */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="person-outline" size={18} color={colors.brand} />
                <AppText variant="bodyBold" style={styles.sectionTitleText}>
                  {isIt ? 'Dati Generali' : 'General Info'}
                </AppText>
              </View>

              {/* Input Nome */}
              <View style={styles.field}>
                <AppText variant="caption" style={styles.fieldLabel}>
                  {isIt ? 'NOME O SOPRANNOME' : 'NAME OR NICKNAME'}
                </AppText>
                <DebossedInput
                  value={name}
                  onChangeText={setName}
                  placeholder={isIt ? 'es. Marco, Sofia, Mamma...' : 'e.g. Marco, Sofia, Mom...'}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  rightIcon={
                    name.length > 0 ? (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setName('');
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.onSurfaceMuted} />
                      </Pressable>
                    ) : (
                      <Ionicons name="person-outline" size={18} color={colors.brand} />
                    )
                  }
                />
              </View>

              {/* Selezione Relazione */}
              {editingProfile?.relationship !== 'io' && (
                <View style={styles.field}>
                  <AppText variant="caption" style={styles.fieldLabel}>
                    {isIt ? 'RELAZIONE / RUOLO' : 'RELATIONSHIP'}
                  </AppText>
                  <View style={styles.relationsGrid}>
                    {RELATIONS.map((rel) => {
                      const on = relationship === rel.value;
                      return (
                        <Pressable
                          key={rel.value}
                          style={[styles.relationCard, on && styles.relationCardOn]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRelationship(rel.value);
                          }}
                        >
                          <Ionicons
                            name={rel.icon}
                            size={16}
                            color={on ? colors.brand : colors.onSurfaceMuted}
                          />
                          <AppText
                            variant="caption"
                            style={[
                              styles.relationText,
                              on ? styles.relationTextOn : styles.relationTextOff,
                            ]}
                          >
                            {isIt ? rel.label : rel.labelEn}
                          </AppText>
                          {on && (
                            <View style={styles.relationCheckDot}>
                              <Ionicons name="checkmark-outline" size={10} color="#FFFFFF" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* SEZIONE 2: Allergie e Intolleranze */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={styles.sectionTitleText}>
                    {isIt ? 'Allergie e Intolleranze' : 'Allergies & Intolerances'}
                  </AppText>
                </View>
                {selectedCount > 0 && (
                  <Pressable
                    onPress={clearAllSelected}
                    hitSlop={8}
                    style={styles.clearAllBtn}
                  >
                    <Ionicons name="trash-outline" size={13} color={colors.red} />
                    <AppText variant="caption" color={colors.red} style={{ fontWeight: '700' }}>
                      {isIt ? 'Deseleziona tutti' : 'Clear all'}
                    </AppText>
                  </Pressable>
                )}
              </View>

              <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.sectionHelper}>
                {isIt
                  ? 'Tocca un allergene per aggiungerlo. Tieni premuto per personalizzare severità e cottura.'
                  : 'Tap an allergen to toggle. Long press to customize severity and cooking criteria.'}
              </AppText>

              {/* Quick Summary / Severity Filter Pills Bar */}
              {selectedCount > 0 && (
                <View style={styles.summaryBar}>
                  <View style={styles.summaryTotalBadge}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={colors.brand} />
                    <AppText variant="caption" color={colors.brand} style={{ fontWeight: '800' }}>
                      {selectedCount} {isIt ? 'attivi' : 'active'}
                    </AppText>
                  </View>

                  <View style={styles.severityChipsWrap}>
                    {severityStats.grave > 0 && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSeverityFilter(severityFilter === 'grave' ? 'all' : 'grave');
                        }}
                        style={[
                          styles.sevPill,
                          styles.sevPillGrave,
                          severityFilter === 'grave' && styles.sevPillActiveGrave,
                        ]}
                      >
                        <View style={[styles.sevDot, { backgroundColor: '#EF4444' }]} />
                        <AppText variant="caption" style={[styles.sevPillText, { color: '#991B1B' }]}>
                          {severityStats.grave} {isIt ? 'Gravi' : 'Severe'}
                        </AppText>
                      </Pressable>
                    )}

                    {severityStats.moderata > 0 && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSeverityFilter(severityFilter === 'moderata' ? 'all' : 'moderata');
                        }}
                        style={[
                          styles.sevPill,
                          styles.sevPillMod,
                          severityFilter === 'moderata' && styles.sevPillActiveMod,
                        ]}
                      >
                        <View style={[styles.sevDot, { backgroundColor: '#F97316' }]} />
                        <AppText variant="caption" style={[styles.sevPillText, { color: '#9A3412' }]}>
                          {severityStats.moderata} {isIt ? 'Medie' : 'Moderate'}
                        </AppText>
                      </Pressable>
                    )}

                    {severityStats.lieve > 0 && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSeverityFilter(severityFilter === 'lieve' ? 'all' : 'lieve');
                        }}
                        style={[
                          styles.sevPill,
                          styles.sevPillLieve,
                          severityFilter === 'lieve' && styles.sevPillActiveLieve,
                        ]}
                      >
                        <View style={[styles.sevDot, { backgroundColor: '#EAB308' }]} />
                        <AppText variant="caption" style={[styles.sevPillText, { color: '#854D0E' }]}>
                          {severityStats.lieve} {isIt ? 'Lievi' : 'Mild'}
                        </AppText>
                      </Pressable>
                    )}

                    {severityFilter !== 'all' && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSeverityFilter('all');
                        }}
                        style={styles.resetSevPill}
                      >
                        <Ionicons name="close-circle-outline" size={13} color={colors.onSurfaceMuted} />
                        <AppText variant="caption" color={colors.onSurfaceMuted}>
                          {isIt ? 'Tutti' : 'All'}
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Barra di Ricerca Allergene Debossed */}
              <View style={styles.searchContainer}>
                <DebossedInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={isIt ? 'Cerca allergene (es. Arachidi, Glutine...)' : 'Search allergy...'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  rightIcon={
                    searchQuery.length > 0 ? (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSearchQuery('');
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.onSurfaceMuted} />
                      </Pressable>
                    ) : (
                      <Ionicons name="search-outline" size={18} color={colors.onSurfaceMuted} />
                    )
                  }
                />
              </View>

              {/* Filtri Categoria Orizzontali */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterRow}
              >
                {CATEGORY_TABS.map((cat) => {
                  const active = categoryFilter === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      style={[styles.categoryFilterChip, active && styles.categoryFilterChipOn]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategoryFilter(cat.key);
                      }}
                    >
                      <Ionicons
                        name={cat.iconName}
                        size={13}
                        color={active ? '#FFFFFF' : colors.onSurfaceMuted}
                      />
                      <AppText
                        variant="caption"
                        style={[
                          styles.categoryFilterText,
                          active && styles.categoryFilterTextOn,
                        ]}
                      >
                        {isIt ? cat.labelIt : cat.labelEn}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* GRIGLIA CHIP ALLERGENI CON DESIGN UNIFICATO */}
              {filteredAllergens.length === 0 ? (
                <View style={styles.noMatchBox}>
                  <Ionicons name="search-outline" size={28} color={colors.onSurfaceMuted} />
                  <AppText variant="caption" color={colors.onSurfaceMuted} style={{ textAlign: 'center' }}>
                    {isIt
                      ? `Nessun allergene corrisponde alla ricerca "${searchQuery}"`
                      : `No matching allergens for "${searchQuery}"`}
                  </AppText>
                </View>
              ) : (
                <View style={styles.allergenChipCardContainer}>
                  <View style={styles.allergenGrid}>
                    {filteredAllergens.map((a) => {
                      const sel = selectedAllergens[a.code];
                      return (
                        <AllergyChip
                          key={a.code}
                          a={a}
                          selected={Boolean(sel)}
                          intensity={sel?.intensity || 'moderata'}
                          criterio={sel?.criterio || 'assoluto'}
                          onToggle={() => toggleAllergen(a.code)}
                          onConfigure={() => setConfigModalTarget(a)}
                          isIt={isIt}
                        />
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Bottom Action Bar Glassmorphic */}
          <View
            style={[
              styles.modalBottomBar,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <SurfaceButton
              label={
                saving
                  ? (isIt ? 'Salvataggio...' : 'Saving...')
                  : editingProfile
                  ? (isIt ? 'Salva Modifiche' : 'Save Changes')
                  : selectedCount === 0
                  ? (isIt ? 'Salva Senza Allergie' : 'Save Without Allergies')
                  : (isIt
                    ? `Salva Profilo (${selectedCount} ${selectedCount === 1 ? 'allergia' : 'allergie'})`
                    : `Save Profile (${selectedCount} ${selectedCount === 1 ? 'allergy' : 'allergies'})`)
              }
              icon="checkmark-outline"
              onPress={handleSave}
              disabled={!name.trim() || saving}
              loading={saving}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURAZIONE DETTAGLIATA SEVERITÀ E CRITERIO */}
      {configModalTarget && (
        <AllergyConfigModal
          visible={Boolean(configModalTarget)}
          onClose={() => setConfigModalTarget(null)}
          allergenName={
            isIt
              ? configModalTarget.name_it
              : TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.en || configModalTarget.name_it
          }
          allergenEmoji={
            configModalTarget.emoji && configModalTarget.emoji !== '⚠️'
              ? configModalTarget.emoji
              : TRANSLATED_ALLERGENS[configModalTarget.code.toLowerCase()]?.emoji ||
                CATEGORY_ICONS[configModalTarget.category || 'ue'] ||
                '⚠️'
          }
          isDiet={Boolean(configModalTarget.is_diet)}
          intensity={selectedAllergens[configModalTarget.code]?.intensity || 'moderata'}
          criterio={selectedAllergens[configModalTarget.code]?.criterio || 'assoluto'}
          onSave={(intensity: AllergyIntensity, criterio: AllergyCriterio) =>
            updateConfig(configModalTarget.code, intensity, criterio)
          }
          isIt={isIt}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  primaryCard: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberPhotoThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  memberFallbackThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand50,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberFallbackLetter: {
    fontSize: 20,
    fontFamily: font.bold,
    color: colors.brand,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
  },
  iconBtnDanger: {
    backgroundColor: colors.redSoft,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  relationBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 12,
  },
  chipLieve: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FACC15',
  },
  chipModerata: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FB923C',
  },
  chipGrave: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },

  /* MODAL STYLES */
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  modalHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(50, 42, 99, 0.2)',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalTitle: {
    color: colors.ink,
    fontFamily: font.bold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalScroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },

  /* PREVIEW HERO CARD WITH REAL PHOTO PICKER */
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1.5,
    gap: spacing.md,
  },
  previewHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  photoAvatarWrapper: {
    position: 'relative',
  },
  avatarPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  photoAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brand,
  },
  photoAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand50,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderLetter: {
    fontSize: 26,
    fontFamily: font.bold,
    color: colors.brand,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  relationBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand50,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
  },
  allergyCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allergyCountPillActive: {
    backgroundColor: colors.brand50,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  photoActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 42, 99, 0.06)',
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  photoActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.18)',
  },
  photoRemoveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.redSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  pressed: {
    opacity: 0.8,
  },

  /* FORM SECTIONS */
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitleText: {
    fontSize: 16,
    fontFamily: font.bold,
    color: colors.ink,
  },
  sectionHelper: {
    lineHeight: 18,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.redSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '800',
    color: colors.onSurfaceMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  /* RELATIONS GRID */
  relationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  relationCardOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand50,
  },
  relationText: {
    fontSize: 13,
  },
  relationTextOn: {
    color: colors.brand,
    fontWeight: '700',
  },
  relationTextOff: {
    color: colors.ink,
    fontWeight: '500',
  },
  relationCheckDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  /* SUMMARY BAR */
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand50,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  severityChipsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sevDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sevPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sevPillGrave: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  sevPillActiveGrave: {
    borderColor: '#EF4444',
  },
  sevPillMod: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  sevPillActiveMod: {
    borderColor: '#F97316',
  },
  sevPillLieve: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  sevPillActiveLieve: {
    borderColor: '#EAB308',
  },
  resetSevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  /* SEARCH CONTAINER */
  searchContainer: {
    marginTop: 2,
  },

  /* CATEGORY FILTERS */
  categoryFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryFilterChipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  categoryFilterText: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
    fontWeight: '600',
  },
  categoryFilterTextOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ALLERGEN GRID */
  allergenChipCardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  noMatchBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* STICKY BOTTOM BAR */
  modalBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
});
