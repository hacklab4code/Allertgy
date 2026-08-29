import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, Screen, SurfaceButton } from '../src/components/ui';
import { colors, font, radius, spacing } from '../src/theme';
import {
  TRAVEL_LANGUAGES,
  TRAVEL_PHRASE_TEMPLATES,
  getResolvedPhrase,
  type TravelPhraseTemplate,
} from '../src/services/travelTranslations';

export default function TravelHubScreen() {
  const insets = useSafeAreaInsets();
  const { language, allergie: primaryAllergies, subProfiles, activeProfileId } = useSession();
  const isIt = (language || 'it').toLowerCase() === 'it';

  const [selectedLang, setSelectedLang] = useState<string>('ja');
  const [selectedCategory, setSelectedCategory] = useState<'restaurant' | 'emergency'>('restaurant');
  const [fullscreenPhrase, setFullscreenPhrase] = useState<{ title: string; text: string; langName: string } | null>(null);

  const activeAllergies = useMemo(() => {
    if (activeProfileId) {
      const sub = subProfiles.find((p) => p.id === activeProfileId);
      if (sub) return sub.allergens.map((a) => a.code);
    }
    return primaryAllergies;
  }, [activeProfileId, subProfiles, primaryAllergies]);

  const currentLangObj = useMemo(() => {
    return TRAVEL_LANGUAGES.find((l) => l.code === selectedLang) || TRAVEL_LANGUAGES[0];
  }, [selectedLang]);

  const filteredPhrases = useMemo(() => {
    return TRAVEL_PHRASE_TEMPLATES.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const openFullscreen = (template: TravelPhraseTemplate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const resolved = getResolvedPhrase(template, selectedLang, activeAllergies);
    setFullscreenPhrase({
      title: isIt ? template.titleIt : template.titleEn,
      text: resolved,
      langName: currentLangObj.nativeName,
    });
  };

  return (
    <Screen edges={false} ambient>
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Frasario Viaggi Offline' : 'Offline Travel Safe Hub',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#1E1B4B' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 12, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#1E1B4B" />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {/* LANGUAGE SELECTOR */}
          <AppText variant="caption" style={styles.sectionHeader}>
            {isIt ? 'Seleziona Lingua di Destinazione:' : 'Destination Language:'}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll} contentContainerStyle={styles.langScrollContent}>
            {TRAVEL_LANGUAGES.map((lang) => {
              const isSel = selectedLang === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.langChip, isSel && styles.langChipActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedLang(lang.code);
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{lang.flag}</Text>
                  <AppText style={[styles.langChipText, isSel && styles.langChipTextActive]}>
                    {lang.nativeName}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* CATEGORY SWITCHER */}
          <View style={styles.tabSwitcher}>
            <Pressable
              style={[styles.tabBtn, selectedCategory === 'restaurant' && styles.tabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedCategory('restaurant');
              }}
            >
              <Ionicons name="restaurant-outline" size={16} color={selectedCategory === 'restaurant' ? '#1E1B4B' : '#6B6690'} />
              <AppText variant="bodyBold" style={[styles.tabBtnText, selectedCategory === 'restaurant' && styles.tabBtnTextActive]}>
                {isIt ? '🍽️ Al Ristorante' : '🍽️ At Restaurant'}
              </AppText>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, selectedCategory === 'emergency' && styles.tabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedCategory('emergency');
              }}
            >
              <Ionicons name="alert-circle-outline" size={16} color={selectedCategory === 'emergency' ? '#DC2626' : '#6B6690'} />
              <AppText variant="bodyBold" style={[styles.tabBtnText, selectedCategory === 'emergency' && styles.tabBtnTextActive]}>
                {isIt ? '🚨 Emergenza Medica' : '🚨 Emergency'}
              </AppText>
            </Pressable>
          </View>

          {/* OFFLINE BADGE */}
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={16} color="#059669" />
            <AppText variant="caption" color="#065F46" style={{ fontWeight: '700' }}>
              {isIt ? '100% Funzionante Offline all\'estero senza connessione' : '100% Offline functional abroad'}
            </AppText>
          </View>

          {/* PHRASES LIST */}
          <View style={styles.phraseList}>
            {filteredPhrases.map((template) => {
              const resolved = getResolvedPhrase(template, selectedLang, activeAllergies);
              return (
                <Pressable
                  key={template.id}
                  style={styles.phraseCard}
                  onPress={() => openFullscreen(template)}
                >
                  <View style={styles.cardHeader}>
                    <AppText variant="caption" style={styles.cardTitle}>
                      {isIt ? template.titleIt : template.titleEn}
                    </AppText>
                    <View style={styles.expandIcon}>
                      <Ionicons name="expand" size={16} color="#4338CA" />
                    </View>
                  </View>

                  <Text style={styles.phraseForeignText}>
                    {resolved}
                  </Text>

                  <View style={styles.cardFooter}>
                    <AppText variant="caption" color="#64748B">
                      🇮🇹 {template.templateByLang['it'].replace('{ALLERGENS}', 'i tuoi allergeni')}
                    </AppText>
                    <AppText variant="caption" color="#4338CA" style={{ fontWeight: '800' }}>
                      {isIt ? 'Tocca per ingrandire ›' : 'Tap to enlarge ›'}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* FULLSCREEN SHOW TO WAITER / DOCTOR MODAL */}
      <Modal visible={!!fullscreenPhrase} animationType="fade" transparent onRequestClose={() => setFullscreenPhrase(null)}>
        <View style={styles.fullscreenOverlay}>
          <View style={styles.fullscreenContent}>
            <Pressable onPress={() => setFullscreenPhrase(null)} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </Pressable>

            <View style={styles.fullscreenCard}>
              <View style={styles.fullscreenHeader}>
                <Ionicons name="globe-outline" size={20} color="#1E1B4B" />
                <AppText variant="title" style={{ fontSize: 16, color: '#1E1B4B' }}>
                  {fullscreenPhrase?.langName}
                </AppText>
              </View>

              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={styles.giantText}>
                  {fullscreenPhrase?.text}
                </Text>
              </ScrollView>

              <AppText variant="caption" color="#64748B" style={{ textAlign: 'center', marginTop: 12 }}>
                {isIt ? 'Mostra questo schermo al cameriere o al soccorritore' : 'Show this screen to the waiter or doctor'}
              </AppText>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  langScroll: {
    marginBottom: 14,
  },
  langScrollContent: {
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langChipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  langChipText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: '#4B5563',
  },
  langChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#ECEAF8',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    color: '#6B6690',
  },
  tabBtnTextActive: {
    color: '#1E1B4B',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    marginBottom: 14,
  },
  phraseList: {
    gap: 12,
  },
  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.3,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseForeignText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenContent: {
    width: '100%',
    maxHeight: '85%',
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  fullscreenCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    minHeight: 320,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  giantText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B4B',
    lineHeight: 34,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
