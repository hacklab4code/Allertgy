import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Apple,
  Bean,
  Carrot,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Egg,
  Fish,
  MapPin,
  MessageCircle,
  Milk,
  Nut,
  Pencil,
  Phone,
  Pill,
  Play,
  RotateCcw,
  Salad,
  Send,
  Settings,
  ShieldAlert,
  Syringe,
  Timer,
  TriangleAlert,
  User,
  Wheat,
  Wine,
  X,
} from 'lucide-react-native';
import { useSession } from '../src/store/session';
import { getAllergenName } from '../src/engine/translations';
import { colors, font, radius, spacing } from '../src/theme';
import { api } from '../src/api/client';

type IntensityLevel = 'lieve' | 'moderata' | 'grave';

interface AllergenItemData {
  code: string;
  name: string;
  intensity: IntensityLevel;
}

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const {
    allergie: primaryAllergies,
    allergyIntensities = {},
    emergencyMedicines,
    language,
    emergencyContactName,
    emergencyContactPhone,
    subProfiles,
    activeProfileId,
    email,
    setEmergencyMedicines,
    setEmergencyContact,
  } = useSession();

  const isIt = (language || 'it').toLowerCase() === 'it';

  // Location state for 112 & SMS
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Allergens Expandable State
  const [allergensExpanded, setAllergensExpanded] = useState(false);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [medicinesDraft, setMedicinesDraft] = useState(emergencyMedicines || '');
  const [contactNameDraft, setContactNameDraft] = useState(emergencyContactName || '');
  const [contactPhoneDraft, setContactPhoneDraft] = useState(emergencyContactPhone || '');
  const [saving, setSaving] = useState(false);

  // Adrenaline Interactive Guide State
  const [adrenalineModalVisible, setAdrenalineModalVisible] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5);
  const [timerDone, setTimerDone] = useState(false);

  // Fetch location on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGPS() {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLocationAddress(isIt ? 'Permesso GPS non autorizzato' : 'GPS permission denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (isMounted && pos?.coords) {
          const { latitude, longitude } = pos.coords;
          setLocationCoords({ lat: latitude, lon: longitude });
          try {
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode[0]) {
              const g = geocode[0];
              const addr = [g.street, g.streetNumber, g.city].filter(Boolean).join(', ');
              setLocationAddress(addr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } catch {
            setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        }
      } catch {
        if (isMounted) setLocationAddress(isIt ? 'Posizione GPS non disponibile' : 'GPS position unavailable');
      } finally {
        if (isMounted) setLoadingLocation(false);
      }
    }
    loadGPS();
    return () => { isMounted = false; };
  }, [isIt]);

  // Adrenaline Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            setTimerDone(true);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const startAdrenalineTimer = () => {
    setTimerSeconds(5);
    setTimerDone(false);
    setTimerRunning(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const resetAdrenalineTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(5);
    setTimerDone(false);
    void Haptics.selectionAsync();
  };

  // Active Subprofile & Name
  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return subProfiles.find((p) => p.id === activeProfileId) || null;
  }, [activeProfileId, subProfiles]);

  const profileName = useMemo(() => {
    if (activeProfile?.name) return activeProfile.name;
    if (email) {
      const namePart = email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Sofia';
  }, [activeProfile, email]);

  // Active Allergens with intensity
  const allergenItems = useMemo<AllergenItemData[]>(() => {
    const rawCodes = activeProfile
      ? activeProfile.allergens.map((a) => a.code)
      : primaryAllergies;

    const intensitiesMap = activeProfile
      ? Object.fromEntries(activeProfile.allergens.map((a) => [a.code, a.intensity]))
      : allergyIntensities;

    let items: AllergenItemData[] = [];

    if (rawCodes.length > 0) {
      items = rawCodes.map((code) => {
        const rawIntensity = (intensitiesMap[code] || 'moderata').toLowerCase();
        let intensity: IntensityLevel = 'moderata';
        if (rawIntensity === 'grave') intensity = 'grave';
        else if (rawIntensity === 'lieve') intensity = 'lieve';

        let name = getAllergenName(code, language);
        if (code.toLowerCase() === 'glutine' || code.toLowerCase() === 'cereali') name = 'Glutine';
        if (code.toLowerCase() === 'latte') name = 'Latte';
        if (code.toLowerCase() === 'frutta_a_guscio' || code.toLowerCase() === 'frutta_guscio') name = 'Frutta a guscio';

        return {
          code: code.toLowerCase(),
          name,
          intensity,
        };
      });
    } else {
      items = [
        { code: 'glutine', name: 'Glutine', intensity: 'moderata' },
        { code: 'latte', name: 'Latte', intensity: 'lieve' },
        { code: 'frutta_guscio', name: 'Frutta a guscio', intensity: 'grave' },
      ];
    }

    const priority: Record<IntensityLevel, number> = { grave: 1, moderata: 2, lieve: 3 };
    return items.sort((a, b) => priority[a.intensity] - priority[b.intensity]);
  }, [activeProfile, primaryAllergies, allergyIntensities, language]);

  const visibleAllergens = useMemo(() => {
    if (allergensExpanded || allergenItems.length <= 3) return allergenItems;
    return allergenItems.slice(0, 3);
  }, [allergensExpanded, allergenItems]);

  const severeAllergenNames = useMemo(() => {
    return allergenItems.filter((a) => a.intensity === 'grave').map((a) => a.name).join(', ');
  }, [allergenItems]);

  const contactNameDisplay = emergencyContactName || 'Marco (Contatto Fidato)';
  const contactPhoneDisplay = emergencyContactPhone || '+39 333 123 4567';

  const renderAllergenIcon = (code: string) => {
    const clean = code.toLowerCase().trim();
    const iconProps = { size: 18, color: '#7C789B', strokeWidth: 2 };

    if (['glutine', 'cereali', 'frumento', 'orzo', 'segale', 'avena', 'farro'].includes(clean)) return <Wheat {...iconProps} />;
    if (['latte', 'lattosio', 'formaggio'].includes(clean)) return <Milk {...iconProps} />;
    if (['frutta_guscio', 'frutta_a_guscio', 'arachidi', 'noci', 'nocciole', 'mandorle', 'pistacchi', 'anacardi'].includes(clean)) return <Nut {...iconProps} />;
    if (['uova', 'uovo'].includes(clean)) return <Egg {...iconProps} />;
    if (['pesce', 'crostacei', 'molluschi'].includes(clean)) return <Fish {...iconProps} />;
    if (['soia', 'lupini', 'legumi', 'fagioli', 'lenticchie'].includes(clean)) return <Bean {...iconProps} />;
    if (['sedano', 'verdura', 'spinaci', 'broccoli'].includes(clean)) return <Salad {...iconProps} />;
    if (['mela', 'frutta', 'pesca', 'fragole'].includes(clean)) return <Apple {...iconProps} />;
    if (['carota'].includes(clean)) return <Carrot {...iconProps} />;
    if (['solfiti', 'vino'].includes(clean)) return <Wine {...iconProps} />;
    return <TriangleAlert {...iconProps} />;
  };

  const handleCall112 = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL('tel:112').catch(() => {
      Alert.alert(isIt ? 'Avviso' : 'Notice', isIt ? 'Chiamate non supportate su questo dispositivo.' : 'Calls not supported on this device.');
    });
  };

  const handleCallContact = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const targetPhone = emergencyContactPhone || '+393331234567';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert(isIt ? 'Avviso' : 'Notice', isIt ? 'Chiamate non supportate su questo dispositivo.' : 'Calls not supported.');
    });
  };

  const handleSendSosSms = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const targetPhone = emergencyContactPhone || '';
    const mapUrl = locationCoords ? `https://maps.google.com/?q=${locationCoords.lat},${locationCoords.lon}` : (locationAddress || 'Posizione non rilevata');
    const msg = `🚨 SOS ALLERTGY: ${profileName} sta avendo una reazione allergica grave.\n\n📍 Posizione: ${mapUrl}\n⚠️ Allergie: ${severeAllergenNames || 'Vedi scheda AllerTgy'}\n💊 Farmaci: ${emergencyMedicines || 'Adrenalina / Antistaminico'}`;
    const smsUrl = Platform.OS === 'ios' ? `sms:${targetPhone}&body=${encodeURIComponent(msg)}` : `sms:${targetPhone}?body=${encodeURIComponent(msg)}`;
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert(isIt ? 'Errore' : 'Error', isIt ? 'Impossibile aprire l\'app messaggi.' : 'Unable to open SMS app.');
    });
  };

  const handleSendSosWhatsApp = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const cleanPhone = (emergencyContactPhone || '').replace(/\D/g, '');
    const mapUrl = locationCoords ? `https://maps.google.com/?q=${locationCoords.lat},${locationCoords.lon}` : (locationAddress || 'Posizione non rilevata');
    const msg = `🚨 SOS ALLERTGY: ${profileName} sta avendo una reazione allergica grave.\n\n📍 Posizione: ${mapUrl}\n⚠️ Allergie: ${severeAllergenNames || 'Vedi scheda AllerTgy'}\n💊 Farmaci: ${emergencyMedicines || 'Adrenalina / Antistaminico'}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert(isIt ? 'Errore' : 'Error', isIt ? 'Impossibile aprire WhatsApp.' : 'Unable to open WhatsApp.');
    });
  };

  const openEditModal = () => {
    setContactNameDraft(emergencyContactName || '');
    setContactPhoneDraft(emergencyContactPhone || '');
    setMedicinesDraft(emergencyMedicines || '');
    setModalVisible(true);
  };

  const handleSaveModal = async () => {
    setSaving(true);
    try {
      const medVal = medicinesDraft.trim() || null;
      const nameVal = contactNameDraft.trim() || null;
      const phoneVal = contactPhoneDraft.trim() || null;
      await api.updateAppleHealth(0, medVal, nameVal, phoneVal);
      setEmergencyMedicines(medVal);
      setEmergencyContact(nameVal, phoneVal);
      setModalVisible(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(isIt ? 'Salvato' : 'Saved', isIt ? 'Dati SOS aggiornati con successo.' : 'SOS data updated successfully.');
    } catch (e) {
      Alert.alert(isIt ? 'Errore' : 'Error', (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={isIt ? 'Indietro' : 'Back'}
          >
            <ChevronLeft size={22} color="#1E1B4B" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Emergenza SOS & ICE</Text>
        </View>

        {/* 1. CALL 112 BANNER CARD */}
        <View style={styles.callCard}>
          <View style={styles.callCardTopRow}>
            <View style={styles.callIconBadge}>
              <Phone size={24} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.callTextContainer}>
              <Text style={styles.callTitle}>Chiama il 112</Text>
              <Text style={styles.callSubtitle}>Numero unico europeo di emergenza</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.callNowButton, pressed && styles.btnPressed]}
            onPress={handleCall112}
            accessibilityRole="button"
            accessibilityLabel="Chiama il 112"
          >
            <Text style={styles.callNowButtonText}>Chiama 112 adesso</Text>
          </Pressable>
        </View>

        {/* 2. REAL-TIME GPS LOCATION CARD FOR DISPATCHER */}
        <View style={styles.locationCard}>
          <View style={styles.locationCardHead}>
            <MapPin size={18} color="#2563EB" />
            <Text style={styles.locationCardTitle}>
              {isIt ? 'La tua posizione (da leggere al 112)' : 'Your location (read to 112)'}
            </Text>
          </View>
          <Text style={styles.locationAddressText}>
            {loadingLocation ? (isIt ? 'Rilevamento GPS in corso...' : 'Locating GPS...') : locationAddress || (isIt ? 'Coordinate in fase di calcolo...' : 'Calculating coordinates...')}
          </Text>
          {locationCoords && (
            <Text style={styles.locationCoordsSub}>
              GPS: {locationCoords.lat.toFixed(5)}, {locationCoords.lon.toFixed(5)}
            </Text>
          )}
        </View>

        {/* 3. QUICK SOS TO TRUSTED CONTACT (SMS / WHATSAPP) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <User size={18} color="#1E1B4B" strokeWidth={2.2} />
            <Text style={styles.cardHeaderTitle}>
              {isIt ? 'Contatto fidato' : 'Trusted contact'}
            </Text>
            <Pressable onPress={openEditModal} hitSlop={8} style={styles.cardHeaderAction}>
              <Pencil size={15} color="#7C789B" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <Text style={styles.avatarEmoji}>👨</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contactNameDisplay}</Text>
              <Text style={styles.contactPhone}>{contactPhoneDisplay}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.contactCallBtn, pressed && styles.btnPressed]}
              onPress={handleCallContact}
            >
              <Phone size={18} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.sosActionRow}>
            <Pressable
              style={({ pressed }) => [styles.sosSmsBtn, pressed && styles.btnPressed]}
              onPress={handleSendSosSms}
            >
              <Send size={15} color="#FFFFFF" />
              <Text style={styles.sosBtnText}>{isIt ? 'SMS SOS + GPS' : 'SOS SMS + GPS'}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sosWhatsAppBtn, pressed && styles.btnPressed]}
              onPress={handleSendSosWhatsApp}
            >
              <MessageCircle size={15} color="#FFFFFF" />
              <Text style={styles.sosBtnText}>WhatsApp SOS</Text>
            </Pressable>
          </View>
        </View>

        {/* 4. ADRENALINE AUTO-INJECTOR INTERACTIVE GUIDE */}
        <View style={[styles.cardContainer, styles.adrenalineCard]}>
          <View style={styles.cardHeaderRow}>
            <Syringe size={18} color="#DC2626" strokeWidth={2.2} />
            <Text style={[styles.cardHeaderTitle, { color: '#991B1B' }]}>
              {isIt ? 'Autoiniettore Adrenalina (EpiPen / Fastjekt)' : 'Adrenaline Auto-Injector Guide'}
            </Text>
          </View>
          <Text style={styles.adrenalineIntroText}>
            {isIt
              ? 'In caso di difficoltà respiratorie o shock, usa subito l\'adrenalina sulla coscia esterna.'
              : 'In case of breathing difficulty or severe shock, use adrenaline immediately on the outer thigh.'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.adrenalineGuideBtn, pressed && styles.btnPressed]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAdrenalineModalVisible(true);
            }}
          >
            <Play size={16} color="#FFFFFF" />
            <Text style={styles.adrenalineGuideBtnText}>
              {isIt ? 'Avvia Guida Interattiva con Timer' : 'Start Interactive Guide with Timer'}
            </Text>
          </Pressable>
        </View>

        {/* 5. ACTIVE ALLERGENS LIST */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <TriangleAlert size={18} color="#F75555" strokeWidth={2.2} />
            <Text style={styles.cardHeaderTitle}>
              {isIt ? `Allergeni di ${profileName}` : `Allergens of ${profileName}`}
            </Text>
            <Pressable onPress={() => router.push('/allergie')} hitSlop={8} style={styles.cardHeaderAction}>
              <Settings size={15} color="#7C789B" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.allergenList}>
            {visibleAllergens.map((item) => (
              <View key={item.code} style={styles.allergenRow}>
                <View style={styles.allergenIconCircle}>{renderAllergenIcon(item.code)}</View>
                <Text style={styles.allergenName}>{item.name}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    item.intensity === 'grave' && styles.severityBadgeGrave,
                    item.intensity === 'moderata' && styles.severityBadgeModerata,
                    item.intensity === 'lieve' && styles.severityBadgeLieve,
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      item.intensity === 'grave' && styles.severityTextGrave,
                      item.intensity === 'moderata' && styles.severityTextModerata,
                      item.intensity === 'lieve' && styles.severityTextLieve,
                    ]}
                  >
                    {item.intensity === 'grave' ? 'Grave' : item.intensity === 'moderata' ? 'Moderata' : 'Lieve'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {allergenItems.length > 3 && (
            <Pressable
              style={({ pressed }) => [styles.expandToggleBtn, pressed && styles.btnPressed]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAllergensExpanded((v) => !v);
              }}
            >
              <Text style={styles.expandToggleText}>
                {allergensExpanded
                  ? (isIt ? 'Mostra meno' : 'Show less')
                  : (isIt ? `Mostra tutti i ${allergenItems.length} allergeni` : `Show all ${allergenItems.length} allergens`)}
              </Text>
              {allergensExpanded ? <ChevronUp size={16} color="#4A3F8C" /> : <ChevronDown size={16} color="#4A3F8C" />}
            </Pressable>
          )}
        </View>

        {/* 6. MEDICINES TO TAKE */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Pill size={18} color="#1E1B4B" strokeWidth={2.2} />
            <Text style={styles.cardHeaderTitle}>
              {isIt ? 'Farmaci & Note Personali' : 'Medicines & Personal Notes'}
            </Text>
            <Pressable onPress={openEditModal} hitSlop={8} style={styles.cardHeaderAction}>
              <Pencil size={15} color="#7C789B" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.medicineList}>
            <View style={styles.medicineRow}>
              <View style={styles.medicineIconCircle}><Syringe size={18} color="#F75555" /></View>
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>EpiPen / Fastjekt (Adrenalina)</Text>
                <Text style={styles.medicineInstruction}>Coscia antero-laterale esterna</Text>
              </View>
              <View style={styles.urgenteBadge}><Text style={styles.urgenteBadgeText}>Salvavita</Text></View>
            </View>

            <View style={styles.medicineRow}>
              <View style={styles.medicineIconCircle}><Pill size={18} color="#F59E0B" /></View>
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>Antistaminico / Cortisonico</Text>
                <Text style={styles.medicineInstruction}>Solo per reazioni lievi o post-iniezione</Text>
              </View>
            </View>

            {emergencyMedicines ? (
              <View style={[styles.medicineRow, styles.customMedicineRow]}>
                <View style={styles.medicineIconCircle}><Pill size={18} color="#7C789B" /></View>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{isIt ? 'Note & Farmaci Personali' : 'Personal Notes'}</Text>
                  <Text style={styles.medicineInstruction}>{emergencyMedicines}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* ADRENALINE GUIDE MODAL */}
      <Modal visible={adrenalineModalVisible} animationType="slide" transparent onRequestClose={() => setAdrenalineModalVisible(false)}>
        <View style={styles.adrenalineModalOverlay}>
          <View style={styles.adrenalineModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Syringe size={22} color="#DC2626" />
                <Text style={styles.modalTitle}>{isIt ? 'Guida Iniezione Adrenalina' : 'Adrenaline Injection Guide'}</Text>
              </View>
              <Pressable onPress={() => setAdrenalineModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#1E1B4B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.adrenalineStep}>
                <Text style={styles.adrenalineStepNum}>1</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adrenalineStepTitle}>{isIt ? 'Impugna e togli il tappo' : 'Grip & remove safety cap'}</Text>
                  <Text style={styles.adrenalineStepDesc}>
                    {isIt ? 'Impugna l\'autoiniettore a pugno (non mettere il pollice sopra). Rimuovi il tappo di sicurezza posteriore.' : 'Grip with fist without thumb on top. Pull off the safety cap.'}
                  </Text>
                </View>
              </View>

              <View style={styles.adrenalineStep}>
                <Text style={styles.adrenalineStepNum}>2</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adrenalineStepTitle}>{isIt ? 'Posiziona sulla coscia' : 'Position on outer thigh'}</Text>
                  <Text style={styles.adrenalineStepDesc}>
                    {isIt ? 'Piazza la punta attiva perpendicolare alla parte esterna della coscia (anche attraverso i vestiti).' : 'Place the tip against the outer middle thigh (even through clothes).'}
                  </Text>
                </View>
              </View>

              <View style={styles.adrenalineStep}>
                <Text style={styles.adrenalineStepNum}>3</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adrenalineStepTitle}>{isIt ? 'Spingi fino allo scatto' : 'Push firmly until it clicks'}</Text>
                  <Text style={styles.adrenalineStepDesc}>
                    {isIt ? 'Spingi con decisione contro la coscia finché non senti lo scatto che rilascia l\'ago.' : 'Push firmly against the thigh until you hear the click releasing the needle.'}
                  </Text>
                </View>
              </View>

              {/* TIMER INTERATTIVO 5 SECONDI */}
              <View style={styles.adrenalineTimerBox}>
                <Text style={styles.adrenalineTimerTitle}>
                  {timerDone ? '✅ Iniezione Completata!' : isIt ? 'Tieni premuto per 5 secondi:' : 'Hold firmly for 5 seconds:'}
                </Text>
                <Text style={[styles.adrenalineTimerDigits, timerDone && { color: '#059669' }]}>
                  {timerSeconds}s
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {!timerRunning && !timerDone && (
                    <Pressable style={styles.timerControlBtn} onPress={startAdrenalineTimer}>
                      <Play size={16} color="#FFFFFF" />
                      <Text style={styles.timerControlBtnText}>{isIt ? 'Avvia Timer 5s' : 'Start 5s Timer'}</Text>
                    </Pressable>
                  )}
                  {(timerRunning || timerDone) && (
                    <Pressable style={[styles.timerControlBtn, { backgroundColor: '#4B5563' }]} onPress={resetAdrenalineTimer}>
                      <RotateCcw size={16} color="#FFFFFF" />
                      <Text style={styles.timerControlBtnText}>{isIt ? 'Ricomincia' : 'Reset'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.adrenalineStep}>
                <Text style={styles.adrenalineStepNum}>4</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adrenalineStepTitle}>{isIt ? 'Massaggia e chiama il 112' : 'Massage & call 112'}</Text>
                  <Text style={styles.adrenalineStepDesc}>
                    {isIt ? 'Rimuovi l\'iniettore, massaggia il punto di iniezione per 10 secondi e contatta immediatamente i soccorsi.' : 'Remove injector, massage area for 10 seconds and call emergency services.'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT CONFIGURATION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isIt ? 'Modifica Contatto & Farmaci SOS' : 'Edit SOS Contact & Medicines'}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#1E1B4B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>{isIt ? 'Nome Contatto Fidato' : 'Trusted Contact Name'}</Text>
              <TextInput
                style={styles.textInput}
                value={contactNameDraft}
                onChangeText={setContactNameDraft}
                placeholder="es. Marco (Marito)"
                placeholderTextColor="#A09CB5"
              />

              <Text style={styles.inputLabel}>{isIt ? 'Telefono Contatto Fidato' : 'Trusted Contact Phone'}</Text>
              <TextInput
                style={styles.textInput}
                value={contactPhoneDraft}
                onChangeText={setContactPhoneDraft}
                placeholder="es. +39 333 123 4567"
                placeholderTextColor="#A09CB5"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>{isIt ? 'Farmaci & Istruzioni Aggiuntive' : 'Medicines & Additional Instructions'}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={medicinesDraft}
                onChangeText={setMedicinesDraft}
                placeholder={isIt ? 'es. Ventolin nello zaino, 2 puff al bisogno' : 'e.g. Inhaler in backpack'}
                placeholderTextColor="#A09CB5"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>{isIt ? 'Annulla' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleSaveModal} disabled={saving}>
                <Text style={styles.modalSaveBtnText}>{saving ? (isIt ? 'Salvataggio...' : 'Saving...') : (isIt ? 'Salva' : 'Save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECEAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B4B',
    marginLeft: 14,
    fontFamily: font.bold,
  },

  // CALL CARD
  callCard: {
    backgroundColor: '#DC2626',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  callCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  callIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  callTextContainer: {
    flex: 1,
  },
  callTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: font.bold,
  },
  callSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
  },
  callNowButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNowButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: font.bold,
  },

  // LOCATION CARD
  locationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  locationCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationCardTitle: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: '#1E40AF',
  },
  locationAddressText: {
    fontFamily: font.bold,
    fontSize: 16,
    color: '#1E3A8A',
    lineHeight: 21,
  },
  locationCoordsSub: {
    fontSize: 12,
    color: '#3B82F6',
    fontFamily: font.semibold,
  },

  // CARD CONTAINERS
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginLeft: 8,
    flex: 1,
    fontFamily: font.bold,
  },
  cardHeaderAction: {
    padding: 4,
  },

  // CONTACT & SOS
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    fontFamily: font.bold,
  },
  contactPhone: {
    fontSize: 13,
    color: '#7C789B',
    marginTop: 2,
  },
  contactCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sosSmsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 12,
  },
  sosWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 13,
  },

  // ADRENALINE CARD
  adrenalineCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adrenalineIntroText: {
    fontSize: 12.5,
    color: '#991B1B',
    lineHeight: 18,
    marginBottom: 12,
  },
  adrenalineGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 14,
  },
  adrenalineGuideBtnText: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 14,
  },

  // ALLERGENS
  allergenList: {
    gap: 8,
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  allergenIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  allergenName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1B4B',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityBadgeGrave: { backgroundColor: '#FCE9EA' },
  severityBadgeModerata: { backgroundColor: '#FFF4DC' },
  severityBadgeLieve: { backgroundColor: '#F3F2F8' },
  severityText: { fontSize: 11.5, fontWeight: '700' },
  severityTextGrave: { color: '#C92A2A' },
  severityTextModerata: { color: '#B45309' },
  severityTextLieve: { color: '#6B6690' },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
  },
  expandToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4A3F8C',
  },

  // MEDICINES
  medicineList: {
    gap: 10,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  customMedicineRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  medicineIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  medicineInstruction: {
    fontSize: 12,
    color: '#7C789B',
    marginTop: 2,
  },
  urgenteBadge: {
    backgroundColor: '#FCE9EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgenteBadgeText: {
    fontSize: 11,
    color: '#C92A2A',
    fontWeight: '800',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 41, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B4668',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B4B',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    backgroundColor: '#1E1B4B',
  },
  modalSaveBtnText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ADRENALINE MODAL
  adrenalineModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  adrenalineModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  adrenalineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  adrenalineStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontFamily: font.bold,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
  },
  adrenalineStepTitle: {
    fontSize: 14.5,
    fontFamily: font.bold,
    color: '#1E1B4B',
    marginBottom: 2,
  },
  adrenalineStepDesc: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  adrenalineTimerBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#F87171',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  adrenalineTimerTitle: {
    fontSize: 14,
    fontFamily: font.bold,
    color: '#991B1B',
  },
  adrenalineTimerDigits: {
    fontSize: 48,
    fontFamily: font.bold,
    color: '#DC2626',
    marginVertical: 4,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timerControlBtnText: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 13,
  },
});
