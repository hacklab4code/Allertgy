import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Clipboard,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader } from '../src/components/ui';
import { font, radius } from '../src/theme';
import {
  TRAVEL_LANGUAGES,
  TRAVEL_PHRASE_TEMPLATES,
  getResolvedPhrase,
  type TravelPhraseTemplate,
} from '../src/services/travelTranslations';

interface FullscreenData {
  title: string;
  foreignText: string;
  foreignLangName: string;
  foreignFlag: string;
  appLangText: string;
  appLangName: string;
  phoneticText?: string;
}

export default function TravelHubScreen() {
  const insets = useSafeAreaInsets();
  const { language, allergie: primaryAllergies, subProfiles, activeProfileId } = useSession();
  
  const appLang = (language || 'it').toLowerCase().slice(0, 2);
  const isIt = appLang === 'it';

  const [selectedLang, setSelectedLang] = useState<string>('ja');
  const [selectedCategory, setSelectedCategory] = useState<'restaurant' | 'emergency'>('restaurant');
  const [fullscreenPhrase, setFullscreenPhrase] = useState<FullscreenData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeAllergies = useMemo(() => {
    if (activeProfileId) {
      const sub = subProfiles.find((p) => p.id === activeProfileId);
      if (sub && Array.isArray(sub.allergens)) {
        return sub.allergens.map((a) => a.code);
      }
    }
    return primaryAllergies || [];
  }, [activeProfileId, subProfiles, primaryAllergies]);

  const currentLangObj = useMemo(() => {
    return TRAVEL_LANGUAGES.find((l) => l.code === selectedLang) || TRAVEL_LANGUAGES[0];
  }, [selectedLang]);

  const appLangObj = useMemo(() => {
    return TRAVEL_LANGUAGES.find((l) => l.code === appLang) || (isIt ? TRAVEL_LANGUAGES.find((l) => l.code === 'it') : TRAVEL_LANGUAGES[0]);
  }, [appLang, isIt]);

  const filteredPhrases = useMemo(() => {
    return TRAVEL_PHRASE_TEMPLATES.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const openFullscreen = (template: TravelPhraseTemplate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const resolvedForeign = getResolvedPhrase(template, selectedLang, activeAllergies);
    const resolvedAppLang = getResolvedPhrase(template, appLang, activeAllergies);
    const phonetic = template.phoneticJaZh?.[selectedLang];

    setFullscreenPhrase({
      title: isIt ? template.titleIt : template.titleEn,
      foreignText: resolvedForeign,
      foreignLangName: currentLangObj.nativeName,
      foreignFlag: currentLangObj.flag,
      appLangText: resolvedAppLang,
      appLangName: isIt ? 'Italiano' : (appLangObj?.name || 'English'),
      phoneticText: phonetic,
    });
  };

  const handleCopyPhrase = (id: string, text: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Clipboard.setString(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSharePhrase = async (template: TravelPhraseTemplate, resolvedForeign: string, resolvedAppLang: string) => {
    void Haptics.selectionAsync();
    const title = isIt ? template.titleIt : template.titleEn;
    const destName = `${currentLangObj.flag} ${currentLangObj.name} (${currentLangObj.nativeName})`;
    const appLangLabel = isIt ? "Traduzione nell'app" : "App translation";

    const message = `💬 AllerTgy Travel Phrase (${destName})\n\n📌 ${title}\n\n"${resolvedForeign}"\n\n📖 ${appLangLabel}:\n"${resolvedAppLang}"\n\nGenerato con AllerTgy (allertgy.com)`;
    try {
      await Share.share({ message });
    } catch {
      // ignore
    }
  };

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Frasario Viaggi' : 'Travel Phrasebook'}
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* 1. HERO SUMMARY CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {isIt ? 'Frasario Medico e Ristorante' : 'Travel Medical & Dining Guide'}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? 'Frasi tradotte istantaneamente con i tuoi allergeni e traduzione visibile nella lingua dell\'app. Funziona 100% offline.'
                    : 'Instant localized phrases with your allergens and app language translation visible. Works 100% offline.'}
                </AppText>
              </View>
            </View>

            {/* OFFLINE & ALLERGENS BADGES */}
            <View style={styles.heroMetaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="cloud-offline-outline" size={13} color="#F1FEC8" />
                <AppText variant="caption" style={styles.metaChipText}>
                  {isIt ? '100% Offline' : '100% Offline'}
                </AppText>
              </View>

              <View style={styles.metaChip}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#F1FEC8" />
                <AppText variant="caption" style={styles.metaChipText}>
                  {activeAllergies.length} {isIt ? 'Allergeni inclusi' : 'Allergens mapped'}
                </AppText>
              </View>

              <View style={styles.metaChip}>
                <Ionicons name="language-outline" size={13} color="#F1FEC8" />
                <AppText variant="caption" style={styles.metaChipText}>
                  {isIt ? 'Lingua app: Italiano' : `App lang: ${appLangObj?.name || 'English'}`}
                </AppText>
              </View>
            </View>

            {/* DESTINATION LANGUAGE PICKER SCROLL */}
            <View style={styles.langSection}>
              <AppText variant="caption" style={styles.langSectionLabel}>
                {isIt ? 'Lingua di destinazione estera:' : 'Destination foreign language:'}
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.langScrollContent}
              >
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
                      <Text style={{ fontSize: 14 }}>{lang.flag}</Text>
                      <AppText style={[styles.langChipText, isSel && styles.langChipTextActive]}>
                        {lang.nativeName}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* 2. CATEGORY SWITCHER (RISTORANTE / EMERGENZA) */}
          <View style={styles.tabSwitcher}>
            <Pressable
              style={[styles.tabBtn, selectedCategory === 'restaurant' && styles.tabBtnActive]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedCategory('restaurant');
              }}
            >
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={selectedCategory === 'restaurant' ? '#23212C' : '#64748B'}
              />
              <AppText
                variant="bodyBold"
                style={[styles.tabBtnText, selectedCategory === 'restaurant' && styles.tabBtnTextActive]}
              >
                {isIt ? 'Al Ristorante' : 'Dining Out'}
              </AppText>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, selectedCategory === 'emergency' && styles.tabBtnActiveEmergency]}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedCategory('emergency');
              }}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={selectedCategory === 'emergency' ? '#DC2626' : '#64748B'}
              />
              <AppText
                variant="bodyBold"
                style={[styles.tabBtnText, selectedCategory === 'emergency' && styles.tabBtnTextActiveEmergency]}
              >
                {isIt ? 'Emergenza Medica' : 'Emergency'}
              </AppText>
            </Pressable>
          </View>

          {/* 3. LISTA DELLE FRASI */}
          <View style={styles.phraseList}>
            {filteredPhrases.map((template) => {
              const resolvedForeign = getResolvedPhrase(template, selectedLang, activeAllergies);
              const resolvedAppLang = getResolvedPhrase(template, appLang, activeAllergies);
              const isEmergency = template.category === 'emergency';
              const isCopied = copiedId === template.id;
              const phonetic = template.phoneticJaZh?.[selectedLang];

              return (
                <View
                  key={template.id}
                  style={[styles.phraseCard, isEmergency && styles.phraseCardEmergency]}
                >
                  {/* CARD HEADER */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons
                        name={isEmergency ? 'warning-outline' : 'chatbox-ellipses-outline'}
                        size={16}
                        color={isEmergency ? '#DC2626' : '#23212C'}
                      />
                      <AppText variant="bodyBold" style={[styles.cardTitle, isEmergency && { color: '#991B1B' }]}>
                        {isIt ? template.titleIt : template.titleEn}
                      </AppText>
                    </View>

                    <View style={styles.langBadge}>
                      <Text style={{ fontSize: 12 }}>{currentLangObj.flag}</Text>
                      <AppText variant="caption" style={styles.langBadgeText}>
                        {currentLangObj.nativeName}
                      </AppText>
                    </View>
                  </View>

                  {/* 1. RISOLUZIONE IN LINGUA LOCALE / DESTINAZIONE */}
                  <View style={[styles.foreignPhraseBox, isEmergency && styles.foreignPhraseBoxEmergency]}>
                    <View style={styles.foreignPhraseLabelRow}>
                      <Text style={{ fontSize: 13 }}>{currentLangObj.flag}</Text>
                      <AppText variant="caption" style={styles.foreignPhraseLabel}>
                        {isIt
                          ? `In ${currentLangObj.name} (${currentLangObj.nativeName}):`
                          : `In ${currentLangObj.name} (${currentLangObj.nativeName}):`}
                      </AppText>
                    </View>

                    <Text style={[styles.phraseForeignText, isEmergency && styles.phraseForeignTextEmergency]}>
                      {resolvedForeign}
                    </Text>

                    {phonetic ? (
                      <View style={styles.phoneticContainer}>
                        <AppText variant="caption" color="#64748B" style={styles.phoneticText}>
                          🗣️ {phonetic}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {/* 2. TRADUZIONE NELLA LINGUA DELL'APP (CON ALLERGENI TRADOTTI) */}
                  <View style={styles.appTranslationBox}>
                    <View style={styles.appTranslationHeader}>
                      <Ionicons name="language-outline" size={14} color="#0284C7" />
                      <AppText variant="caption" style={styles.appTranslationLabel}>
                        {isIt
                          ? "Traduzione nella lingua dell'app (Italiano):"
                          : `Translation in app language (${appLangObj?.name || 'English'}):`}
                      </AppText>
                    </View>
                    <Text style={styles.appTranslationText}>
                      {resolvedAppLang}
                    </Text>
                  </View>

                  {/* 3. ACTIONS BAR (INGRANDISCI, COPIA, CONDIVIDI) */}
                  <View style={styles.cardActionsBar}>
                    <Pressable
                      style={styles.expandCtaBtn}
                      onPress={() => openFullscreen(template)}
                    >
                      <Ionicons name="expand-outline" size={15} color="#23212C" />
                      <AppText variant="caption" style={styles.expandCtaText}>
                        {isIt ? 'Schermo intero' : 'Full-screen'}
                      </AppText>
                    </Pressable>

                    <View style={styles.secondaryActionsRow}>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleCopyPhrase(template.id, resolvedForeign)}
                        hitSlop={8}
                        accessibilityLabel={isIt ? 'Copia frase estera' : 'Copy foreign phrase'}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark-outline' : 'copy-outline'}
                          size={16}
                          color={isCopied ? '#059669' : '#64748B'}
                        />
                      </Pressable>

                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleSharePhrase(template, resolvedForeign, resolvedAppLang)}
                        hitSlop={8}
                        accessibilityLabel={isIt ? 'Condividi' : 'Share'}
                      >
                        <Ionicons name="share-outline" size={16} color="#64748B" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* 4. MODAL SCHERMO INTERO AD ALTO CONTRASTO CON TRADUZIONE INCLUSA */}
      <Modal
        visible={!!fullscreenPhrase}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFullscreenPhrase(null)}
      >
        <View style={[styles.fullscreenContainer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          {/* HEADER TOP BAR */}
          <View style={styles.fsTopBar}>
            <View style={styles.fsLangChip}>
              <Text style={{ fontSize: 14 }}>{fullscreenPhrase?.foreignFlag}</Text>
              <AppText variant="bodyBold" color="#F1FEC8">
                {fullscreenPhrase?.foreignLangName}
              </AppText>
            </View>

            <Pressable
              style={styles.fsCloseBtn}
              onPress={() => setFullscreenPhrase(null)}
              hitSlop={12}
            >
              <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              <AppText variant="bodyBold" color="#FFFFFF">
                {isIt ? 'Chiudi' : 'Close'}
              </AppText>
            </Pressable>
          </View>

          {/* MAIN CARD CON TESTO GIGANTE E TRADUZIONE */}
          <View style={styles.fsCard}>
            <View style={styles.fsCardHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#23212C" />
              <AppText variant="bodyBold" style={styles.fsCardTitle}>
                {fullscreenPhrase?.title}
              </AppText>
            </View>

            <ScrollView
              contentContainerStyle={styles.fsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fsGiantText}>
                {fullscreenPhrase?.foreignText}
              </Text>

              {fullscreenPhrase?.phoneticText ? (
                <View style={styles.fsPhoneticBox}>
                  <AppText variant="caption" color="#64748B" style={{ textAlign: 'center', fontSize: 14 }}>
                    🗣️ {fullscreenPhrase.phoneticText}
                  </AppText>
                </View>
              ) : null}

              {/* TRADUZIONE NELLA LINGUA DELL'APP ANCHE IN SCHERMO INTERO */}
              <View style={styles.fsAppTranslationBox}>
                <View style={styles.fsAppTranslationHeader}>
                  <Ionicons name="language-outline" size={14} color="#0284C7" />
                  <AppText variant="caption" style={styles.fsAppTranslationLabel}>
                    {isIt
                      ? "Cosa stai comunicando (Traduzione in Italiano):"
                      : `What you are communicating (${fullscreenPhrase?.appLangName || 'App Language'}):`}
                  </AppText>
                </View>
                <Text style={styles.fsAppTranslationText}>
                  {fullscreenPhrase?.appLangText}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.fsFooterBox}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <AppText variant="caption" color="#64748B" style={{ flex: 1 }}>
                {isIt
                  ? 'Mostra questo schermo direttamente al cameriere o al personale medico.'
                  : 'Show this screen directly to waitstaff or medical staff.'}
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
    paddingTop: 8,
  },
  scrollContent: {
    gap: 14,
    paddingTop: 4,
  },
  navBackBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#23212C',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.2)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(241, 254, 200, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 254, 200, 0.3)',
  },
  heroTextContainer: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  metaChipText: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // LANGUAGE SELECTOR
  langSection: {
    marginTop: 2,
    gap: 8,
  },
  langSectionLabel: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
  },
  langScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  langChipActive: {
    backgroundColor: '#F1FEC8',
    borderColor: '#E2F4A6',
  },
  langChipText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#FFFFFF',
  },
  langChipTextActive: {
    color: '#23212C',
    fontFamily: font.bold,
  },

  // TAB SWITCHER
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    padding: 3,
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
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnActiveEmergency: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tabBtnText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: font.semibold,
  },
  tabBtnTextActive: {
    color: '#23212C',
    fontFamily: font.bold,
  },
  tabBtnTextActiveEmergency: {
    color: '#DC2626',
    fontFamily: font.bold,
  },

  // PHRASES LIST
  phraseList: {
    gap: 14,
  },
  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  phraseCardEmergency: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    color: '#23212C',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  langBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // FOREIGN BOX
  foreignPhraseBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  foreignPhraseBoxEmergency: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  foreignPhraseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  foreignPhraseLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  phraseForeignText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  phraseForeignTextEmergency: {
    color: '#991B1B',
  },
  phoneticContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  phoneticText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // APP TRANSLATION BOX
  appTranslationBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  appTranslationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  appTranslationLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  appTranslationText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    fontWeight: '500',
  },

  // ACTIONS BAR
  cardActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  expandCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  expandCtaText: {
    fontSize: 11.5,
    color: '#23212C',
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FULLSCREEN MODAL
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#23212C',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  fsTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  fsLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  fsCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  fsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  fsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  fsCardTitle: {
    fontSize: 15,
    color: '#23212C',
  },
  fsScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  fsGiantText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 35,
    textAlign: 'center',
  },
  fsPhoneticBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fsAppTranslationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
    marginTop: 8,
  },
  fsAppTranslationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fsAppTranslationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  fsAppTranslationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    fontWeight: '500',
  },
  fsFooterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
