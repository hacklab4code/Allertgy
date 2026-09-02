import { Stack, router, useNavigation } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../src/store/session';
import { AppText, NavHeaderBackButton, Screen, ScreenTopHeader, SurfaceButton } from '../src/components/ui';
import { TRANSLATED_ALLERGENS, ALLERGEN_SECTIONS } from '../src/engine/translations';
import { font, radius } from '../src/theme';

const ALLERGEN_TRANSLATIONS: Record<string, Record<string, string>> = {
  glutine: {
    it: 'Cereali con glutine (Frumento, Orzo, Segale, Farro)',
    en: 'Gluten-containing cereals (Wheat, Barley, Rye, Spelt)',
    es: 'Cereales con gluten (Trigo, Cebada, Centeno, Espelta)',
    fr: 'Céréales contenant du gluten (Blé, Orge, Seigle, Épeautre)',
    de: 'Glutenhaltiges Getreide (Weizen, Gerste, Roggen, Dinkel)',
    jp: '小麦・グルテンを含む穀物（大麦・ライ麦）',
  },
  crostacei: {
    it: 'Crostacei (Gamberi, Scampi, Aragoste, Granchi)',
    en: 'Crustaceans (Shrimp, Prawns, Lobster, Crab)',
    es: 'Crustáceos (Gambas, Langostinos, Langosta, Cangrejo)',
    fr: 'Crustacés (Crevettes, Langoustines, Homard, Crabe)',
    de: 'Krebstiere (Garnelen, Hummer, Krabben)',
    jp: 'えび・かに・甲殻類',
  },
  uova: {
    it: 'Uova e derivati (Albume, Tuorlo, Maionese)',
    en: 'Eggs & derivatives (Egg white, Yolk, Mayonnaise)',
    es: 'Huevos y derivados (Clara, Yema, Mayonesa)',
    fr: 'Œufs et dérivés (Blanc, Jaune, Mayonnaise)',
    de: 'Eier und Eierzeugnisse',
    jp: '卵・卵白・卵黄製品',
  },
  pesce: {
    it: 'Pesce e derivati (Tonno, Salmone, Alici, Colla di pesce)',
    en: 'Fish & derivatives (Tuna, Salmon, Anchovies, Gelatin)',
    es: 'Pescado y derivados (Atún, Salmón, Anchoas)',
    fr: 'Poisson et dérivés (Thon, Saumon, Anchois)',
    de: 'Fisch und Fischerzeugnisse',
    jp: '魚類（マグロ・サーモン・魚粉など）',
  },
  arachidi: {
    it: 'Arachidi e olio di arachidi',
    en: 'Peanuts & peanut oil',
    es: 'Cacahuetes y aceite de cacahuete',
    fr: 'Arachides et huile d\'arachide',
    de: 'Erdnüsse und Erdnussöl',
    jp: '落花生・ピーナッツ',
  },
  soia: {
    it: 'Soia e lecitina di soia',
    en: 'Soy, soybeans & soy lecithin',
    es: 'Soja y lecitina de soja',
    fr: 'Soja et lécithine de soja',
    de: 'Soja und Sojaerzeugnisse',
    jp: '大豆・大豆製品・醤油',
  },
  latte: {
    it: 'Latte, formaggi, burro e lattosio',
    en: 'Milk, cheese, butter & lactose',
    es: 'Leche, quesos, mantequilla y lactosa',
    fr: 'Lait, fromage, beurre et lactose',
    de: 'Milch, Käse, Butter und Laktose',
    jp: '乳・チーズ・バター・乳製品',
  },
  frutta_a_guscio: {
    it: 'Frutta a guscio (Mandorle, Nocciole, Noci, Pistacchi, Anacardi)',
    en: 'Tree nuts (Almonds, Hazelnuts, Walnuts, Pistachios, Cashews)',
    es: 'Frutos de cáscara (Almendras, Avellanas, Nueces, Pistachos)',
    fr: 'Fruits à coque (Amandes, Noisettes, Noix, Pistaches)',
    de: 'Schalenfrüchte (Mandeln, Haselnüsse, Walnüsse, Pistazien)',
    jp: 'ナッツ類（アーモンド・くるみ・カシューナッツ）',
  },
  sedano: {
    it: 'Sedano e derivati',
    en: 'Celery & celeriac',
    es: 'Apio y derivados',
    fr: 'Céleri et dérivés',
    de: 'Sellerie und Sellerieerzeugnisse',
    jp: 'セロリ',
  },
  senape: {
    it: 'Senape e semi di senape',
    en: 'Mustard & mustard seeds',
    es: 'Mostaza y semillas de mostaza',
    fr: 'Moutarde et graines de moutarde',
    de: 'Senf und Senfsamen',
    jp: 'マスタード・からし',
  },
  sesamo: {
    it: 'Semi di sesamo e olio di sesamo',
    en: 'Sesame seeds & sesame oil',
    es: 'Semillas de sésamo y aceite de sésamo',
    fr: 'Graines de sésame et huile de sésame',
    de: 'Sesamsamen und Sesamöl',
    jp: 'ごま・ごま油',
  },
  solfiti: {
    it: 'Anidride solforosa e solfiti (E220-E228)',
    en: 'Sulfites / sulfur dioxide (E220-E228)',
    es: 'Dióxido de azufre y sulfitos',
    fr: 'Anhydride sulfureux et sulfites',
    de: 'Schwefeldioxid und Sulfite',
    jp: '亜硫酸塩（酸化防止剤）',
  },
  lupini: {
    it: 'Lupini e farina di lupino',
    en: 'Lupin & lupin flour',
    es: 'Altramuces y harina de altramuz',
    fr: 'Lupin et farine de lupin',
    de: 'Lupinen und Lupinenerzeugnisse',
    jp: 'ルピナス（ルピン）',
  },
  molluschi: {
    it: 'Molluschi (Cozze, Vongole, Polpo, Calamari)',
    en: 'Molluscs (Mussels, Clams, Octopus, Squid)',
    es: 'Moluscos (Mejillones, Almejas, Pulpo, Calamares)',
    fr: 'Mollusques (Moules, Palourdes, Poulpe, Calmars)',
    de: 'Weichtiere (Muscheln, Tintenfisch, Oktopus)',
    jp: '貝類・いか・たこ・軟体動物',
  },
  senza_glutine: {
    it: 'Celiachia (Rigido Senza Glutine)',
    en: 'Celiac disease (Strictly Gluten-Free)',
    es: 'Celiaquía (Estrictamente Sin Gluten)',
    fr: 'Maladie cœliaque (Strictement Sans Gluten)',
    de: 'Zöliakie (Streng Glutenfrei)',
    jp: 'セリアック病・完全グルテンフリー',
  },
  senza_lattosio: {
    it: 'Intolleranza severa al lattosio',
    en: 'Severe lactose intolerance',
    es: 'Intolerancia severa a la lactosa',
    fr: 'Intolérance sévère au lactose',
    de: 'Schwere Laktoseintoleranz',
    jp: '重度乳糖不耐症（ラクトースフリー）',
  },
  vegano: {
    it: 'Dieta 100% Vegana (No carne, pesce, latticini, uova, miele)',
    en: '100% Vegan (No meat, fish, dairy, eggs, honey)',
    es: 'Dieta 100% Vegana',
    fr: 'Régime 100% Végétalien',
    de: '100% Vegan (Keine tierischen Produkte)',
    jp: '完全ヴィーガン（動物性食品不使用）',
  },
  vegetariano: {
    it: 'Dieta Vegetariana (No carne, no pesce)',
    en: 'Vegetarian (No meat, no fish)',
    es: 'Dieta Vegetariana (Sin carne ni pescado)',
    fr: 'Végétarien (Pas de viande ni poisson)',
    de: 'Vegetarisch (Kein Fleisch, kein Fisch)',
    jp: 'ベジタリアン（肉・魚不使用）',
  },
};

const KITCHEN_RULES_TRANSLATIONS: Record<string, Record<string, { title: string; desc: string }>> = {
  surfaces: {
    it: { title: 'Padelle e superfici separate', desc: 'Pulire e sanificare piastre, padelle e piani di lavoro prima della preparazione.' },
    en: { title: 'Dedicated cookware & clean surfaces', desc: 'Sanitize pans, grills and prep surfaces before cooking.' },
    es: { title: 'Sartenes y superficies separadas', desc: 'Limpiar y desinfectar planchas, sartenes y mesas de trabajo.' },
    fr: { title: 'Poêles et surfaces dédiées', desc: 'Nettoyer et désinfecter poêles, plaques et plans de travail.' },
    de: { title: 'Getrennte Pfannen und Flächen', desc: 'Pfannen, Grills und Arbeitsflächen vor der Zubereitung gründlich reinigen.' },
    jp: { title: '調理器具と作業台の分離', desc: '調理前にフライパン、鉄板、調理スペースを完全に洗浄・除菌してください。' },
  },
  oil: {
    it: { title: 'Olio di frittura dedicato', desc: 'Non utilizzare olio già usato per cuocere alimenti con allergeni vietati.' },
    en: { title: 'Dedicated clean fryer oil', desc: 'Do not use oil previously used to fry foods containing prohibited allergens.' },
    es: { title: 'Aceite de freír limpio', desc: 'No utilizar aceite usado para freír alimentos con alérgenos prohibidos.' },
    fr: { title: 'Huile de friture dédiée', desc: 'Ne pas utiliser d\'huile ayant servi à frire des allergènes interdits.' },
    de: { title: 'Frisches/Getrenntes Frittieröl', desc: 'Kein Öl verwenden, in dem bereits allergene Speisen frittiert wurden.' },
    jp: { title: '揚げ油の専用使用', desc: 'アレルギー物質の調理に使用した油は絶対に再利用しないでください。' },
  },
  gloves: {
    it: { title: 'Cambio guanti e lavaggio mani', desc: 'Lavare accuratamente le mani e indossare guanti monouso nuovi prima di impiattare.' },
    en: { title: 'Fresh gloves & clean hands', desc: 'Wash hands thoroughly and wear clean gloves before plating.' },
    es: { title: 'Lavado de manos y guantes nuevos', desc: 'Lavarse bien las manos y cambiar los guantes antes de emplatar.' },
    fr: { title: 'Lavage des mains et gants propres', desc: 'Se laver les mains et mettre des gants propres avant le dressage.' },
    de: { title: 'Händewaschen und neue Handschuhe', desc: 'Hände gründlich waschen und vor dem Anrichten neue Handschuhe anziehen.' },
    jp: { title: '手洗いと清潔な手袋の着用', desc: '盛り付け前に必ず入念な手洗いと新しい手袋への交換をお願いします。' },
  },
  utensils: {
    it: { title: 'Coltelli e taglieri dedicati', desc: 'Utilizzare taglieri e posate lavati ad alte temperature per evitare contaminazioni.' },
    en: { title: 'Dedicated knives & cutting boards', desc: 'Use separate cutting boards and utensils sanitized at high temperature.' },
    es: { title: 'Cuchillos y tablas exclusivas', desc: 'Utilizar tablas y cubiertos esterilizados a alta temperatura.' },
    fr: { title: 'Couteaux et planches dédiés', desc: 'Utiliser des planches à découper et ustensiles lavés à haute température.' },
    de: { title: 'Eigene Messer und Schneidebretter', desc: 'Nur gründlich bei hoher Temperatur gereinigte Bretter und Messer verwenden.' },
    jp: { title: '専用の包丁・まな板を使用', desc: '高温洗浄した専用のまな板と調理器具を使用してください。' },
  },
};

const CARD_TITLES: Record<string, string> = {
  it: 'Chef Pass Allergeni — Da mostrare a sala e cucina',
  en: 'Allergy Chef Pass — Show to waitstaff & kitchen',
  es: 'Pase de Alérgenos para el Chef y Camarero',
  fr: 'Pass Allergènes pour le Chef et le Service',
  de: 'Allergie-Pass für Küche und Service',
  jp: '厨房・スタッフ用 アレルギー申告カード',
};

const LANGUAGES_LIST = [
  { code: 'it', label: 'IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'jp', label: 'JP', name: '日本語', flag: '🇯🇵' },
];

const CATEGORY_OUTLINE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ue: 'shield-outline',
  frutta_guscio: 'nutrition-outline',
  frutta: 'nutrition-outline',
  verdura: 'leaf-outline',
  cereali: 'grid-outline',
  spezie: 'sparkles-outline',
  intolleranze: 'pulse-outline',
  preferenze: 'heart-outline',
};

export default function AllergyCardScreen() {
  const navigation = useNavigation();
  const {
    allergie: primaryAllergies,
    allergyIntensities: primaryIntensities = {},
    subProfiles,
    activeProfileId,
    setActiveProfileId,
    language,
    email,
  } = useSession();
  const insets = useSafeAreaInsets();

  const [selectedLang, setSelectedLang] = useState<string>('it');
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  // Active subprofile calculation
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
    return 'Io';
  }, [activeProfile, email]);

  const activeAllergies = useMemo(() => {
    if (activeProfile) return activeProfile.allergens.map((a) => a.code);
    return primaryAllergies;
  }, [activeProfile, primaryAllergies]);

  const activeIntensities = useMemo(() => {
    if (activeProfile) {
      return Object.fromEntries(activeProfile.allergens.map((a) => [a.code, a.intensity]));
    }
    return primaryIntensities;
  }, [activeProfile, primaryIntensities]);

  const activeLang = selectedLang.toLowerCase();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const currentLangObj = LANGUAGES_LIST.find((l) => l.code === activeLang) || LANGUAGES_LIST[0];

  const SECTION_ORDER = [
    'ue', 'frutta_guscio', 'frutta', 'verdura', 'cereali', 'spezie', 'intolleranze', 'preferenze',
  ] as const;

  const getCategoryForKey = (code: string): string => {
    const c = code.toLowerCase().trim();
    if (['glutine','crostacei','uova','pesce','arachidi','soia','latte','frutta_a_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi'].includes(c)) return 'ue';
    if (['mandorle','nocciole','noci','noci_pecan','noci_brasiliane','pistacchi','anacardi','castagne','pinoli','macadamia'].includes(c)) return 'frutta_guscio';
    if (['fragole','kiwi','mela','pesca','arancia','limone','agrumi','banana','uva','anguria','melone','ananas','mango','avocado','albicocca','ciliegia','pera','prugna','lamponi','mirtilli','cocco','frutti_di_bosco'].includes(c)) return 'frutta';
    if (['pomodoro','aglio','cipolla','carota','funghi','mais','peperoncino','peperone','melanzana','zucchina','spinaci','broccoli','cavolfiore','cavolo','patata','piselli','fagioli','lenticchie','cetriolo','lattuga','rucola','barbabietola','finocchio','asparagi','carciofi','porri'].includes(c)) return 'verdura';
    if (['riso','avena','segale','orzo','quinoa','farro','grano_saraceno','teff','amaranto'].includes(c)) return 'cereali';
    if (['cannella','vaniglia','pepe','curry','zenzero','noce_moscata','chiodi_di_garofano','paprika','cumino','origano','rosmarino','timo','salvia','anice','curcuma','coriandolo','alloro','lievito'].includes(c)) return 'spezie';
    if (['istamina','fruttosio','sorbitolo','caffeina','alcool','nichel','solanacee','caseina','glutammato','fosfati','nitriti','lattosio','senza_lattosio'].includes(c)) return 'intolleranze';
    if (['vegano','vegetariano','halal','kosher','senza_glutine','pescetariano'].includes(c)) return 'preferenze';
    return 'ue';
  };

  const formatAllergenLabel = (code: string): string => {
    const dict = ALLERGEN_TRANSLATIONS[code];
    if (dict) {
      if (dict[activeLang]) return dict[activeLang];
      if (dict.en) return dict.en;
      if (dict.it) return dict.it;
    }
    const clean = code.toLowerCase().trim();
    if (TRANSLATED_ALLERGENS[clean]) {
      const isItLang = activeLang === 'it';
      return isItLang ? TRANSLATED_ALLERGENS[clean].it : TRANSLATED_ALLERGENS[clean].en;
    }
    return code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, ' ');
  };

  const groupedAllergies = useMemo(() => {
    const map = new Map<string, string[]>();
    SECTION_ORDER.forEach((cat) => map.set(cat, []));
    activeAllergies.forEach((code) => {
      const cat = getCategoryForKey(code);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(code);
    });
    return SECTION_ORDER
      .filter((cat) => (map.get(cat)?.length ?? 0) > 0)
      .map((cat) => ({
        key: cat,
        items: map.get(cat)!,
      }));
  }, [activeAllergies]);

  const severeAllergies = useMemo(() => {
    return activeAllergies.filter((code) => {
      const intensity = activeIntensities[code] || 'moderata';
      return intensity === 'grave';
    });
  }, [activeAllergies, activeIntensities]);

  const getPillStyle = (code: string) => {
    const intensity = activeIntensities[code] || 'moderata';
    const isDiet = ['vegano','vegetariano','halal','kosher','senza_glutine','pescetariano'].includes(code.toLowerCase());

    if (isDiet) {
      return {
        pillStyle: styles.pillDiet,
        textStyle: styles.pillDietText,
        icon: 'checkmark-circle-outline' as const,
        iconColor: '#059669',
        suffix: '',
      };
    }
    if (intensity === 'grave') {
      const suf = activeLang === 'it' ? ' (GRAVE)' : activeLang === 'jp' ? '（重度）' : ' (SEVERE)';
      return {
        pillStyle: styles.pillGrave,
        textStyle: styles.pillGraveText,
        icon: 'warning-outline' as const,
        iconColor: '#DC2626',
        suffix: suf,
      };
    }
    if (intensity === 'lieve') {
      return {
        pillStyle: styles.pillLieve,
        textStyle: styles.pillLieveText,
        icon: 'shield-checkmark-outline' as const,
        iconColor: '#0D9488',
        suffix: '',
      };
    }
    return {
      pillStyle: styles.pillMod,
      textStyle: styles.pillModText,
      icon: 'alert-circle-outline' as const,
      iconColor: '#D97706',
      suffix: '',
    };
  };

  const getTitle = (): string => CARD_TITLES[activeLang] || CARD_TITLES.en;

  const handleShareCard = async () => {
    void Haptics.selectionAsync();
    const allergenListText = activeAllergies.map((code) => `• ${formatAllergenLabel(code)}`).join('\n');
    const message = `🍽️ AllerTgy Passaporto Medico / Chef Pass — ${profileName} (${currentLangObj.name})\n\n${getTitle()}\n\n⚠️ ALLERGENI & INTOLLERANZE:\n${allergenListText}\n\n🍳 REGOLE DI CUCINA:\n• Utilizzare padelle e superfici dedicate\n• Olio di frittura non contaminato\n• Lavaggio mani e guanti puliti prima dell'impiattamento.\n\nGenerato con AllerTgy (allertgy.com)`;

    try {
      await Share.share({ message });
    } catch {
      // ignore
    }
  };

  const renderPillGroup = (items: string[]) => (
    <View style={styles.pillRow}>
      {items.map((code) => {
        const label = formatAllergenLabel(code);
        const { pillStyle, textStyle, icon, iconColor, suffix } = getPillStyle(code);

        return (
          <View key={code} style={[styles.pillBase, pillStyle]}>
            <Ionicons name={icon} size={14} color={iconColor} />
            <AppText style={[styles.pillText, textStyle]}>
              {label}{suffix}
            </AppText>
          </View>
        );
      })}
    </View>
  );

  return (
    <Screen edges={false} ambient>
      <ScreenTopHeader
        title={isIt ? 'Passaporto Allergie' : 'Allergy Passport'}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else router.replace('/');
        }}
        rightElement={
          <View style={styles.headerRightRow}>
            <Pressable onPress={handleShareCard} hitSlop={8} style={styles.topHeaderIconBtn}>
              <Ionicons name="share-outline" size={19} color="#23212C" />
            </Pressable>
            <Pressable
              style={styles.topRightLangPill}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLangPickerVisible(true);
              }}
            >
              <AppText style={{ fontSize: 13 }}>{currentLangObj.flag}</AppText>
              <AppText variant="caption" style={styles.langPillText}>
                {currentLangObj.label}
              </AppText>
              <Ionicons name="chevron-down-outline" size={12} color="#23212C" />
            </Pressable>
          </View>
        }
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        >
          {/* 1. SELETTORE PROFILI A CHIP LINEARI */}
          {subProfiles.length > 0 && (
            <View style={styles.profileSelectorWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileSelectorScroll}>
                <Pressable
                  style={[styles.profilePill, !activeProfileId && styles.profilePillActive]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setActiveProfileId(null);
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={13}
                    color={!activeProfileId ? '#F1FEC8' : '#64748B'}
                  />
                  <AppText style={[styles.profilePillText, !activeProfileId && styles.profilePillTextActive]}>
                    {email ? email.split('@')[0] : 'Io'}
                  </AppText>
                </Pressable>
                {subProfiles.map((p) => {
                  const isSelected = activeProfileId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={[styles.profilePill, isSelected && styles.profilePillActive]}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setActiveProfileId(p.id);
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={13}
                        color={isSelected ? '#F1FEC8' : '#64748B'}
                      />
                      <AppText style={[styles.profilePillText, isSelected && styles.profilePillTextActive]}>
                        {p.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 2. HERO CARD COSMIC + VANILLA */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="card-outline" size={22} color="#F1FEC8" />
              </View>
              <View style={styles.heroTextContainer}>
                <AppText variant="bodyBold" style={styles.heroTitle}>
                  {getTitle()}
                </AppText>
                <AppText variant="caption" style={styles.heroSubtitle}>
                  {isIt
                    ? `Passaporto clinico digitale di ${profileName}. Mostralo al cameriere o allo chef.`
                    : `Medical digital pass for ${profileName}. Present to server or head chef.`}
                </AppText>
              </View>
            </View>

            {/* QUICK META ROW */}
            <View style={styles.heroMetaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="language-outline" size={13} color="#F1FEC8" />
                <AppText variant="caption" style={styles.metaChipText}>
                  {currentLangObj.name} ({currentLangObj.flag})
                </AppText>
              </View>

              <View style={styles.metaChip}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#F1FEC8" />
                <AppText variant="caption" style={styles.metaChipText}>
                  {activeAllergies.length} {isIt ? 'Allergeni attivi' : 'Active items'}
                </AppText>
              </View>
            </View>
          </View>

          {/* 3. CRITICAL BANNER (SEVERITÀ / ALLERTA CUCINA) */}
          <View style={styles.criticalBanner}>
            <Ionicons name="warning-outline" size={20} color="#DC2626" />
            <View style={styles.criticalTextWrap}>
              {severeAllergies.length > 0 ? (
                <AppText style={styles.criticalText}>
                  <AppText style={styles.criticalBoldRed}>
                    {activeLang === 'it'
                      ? `ALLERGIA GRAVE: ${severeAllergies.map((c) => formatAllergenLabel(c)).join(', ')}. `
                      : activeLang === 'jp'
                      ? `重度アレルギー: ${severeAllergies.map((c) => formatAllergenLabel(c)).join('、')}。`
                      : `SEVERE ALLERGY: ${severeAllergies.map((c) => formatAllergenLabel(c)).join(', ')}. `}
                  </AppText>
                  {activeLang === 'it'
                    ? 'Il contatto anche minimo con questi alimenti o la cottura negli stessi oli/padelle può provocare shock anafilattico.'
                    : activeLang === 'jp'
                    ? '微量の混入や同一の揚げ油・調理器具の使用でもアナフィラキシーショックを引き起こす危険があります。'
                    : 'Even minimal cross-contact or cooking in shared fryers/pans can trigger anaphylaxis.'}
                </AppText>
              ) : (
                <AppText style={styles.criticalText}>
                  <AppText style={styles.criticalBoldRed}>
                    {activeLang === 'it' ? 'Avviso per la cucina: ' : activeLang === 'jp' ? '調理スタッフへの重要なお願い: ' : 'Kitchen Alert: '}
                  </AppText>
                  {activeLang === 'it'
                    ? 'Si prega di verificare con la massima cura che le preparazioni non contengano gli allergeni indicati sotto.'
                    : activeLang === 'jp'
                    ? '下記の特定原材料・アレルゲンが料理に含まれないよう厳重にご確認ください。'
                    : 'Please verify with utmost care that dishes do not contain the allergens listed below.'}
                </AppText>
              )}
            </View>
          </View>

          {/* 4. KITCHEN CONTAMINATION RULES CARD */}
          <View style={styles.kitchenRulesCard}>
            <View style={styles.kitchenRulesHead}>
              <Ionicons name="restaurant-outline" size={17} color="#B45309" />
              <AppText style={styles.kitchenRulesTitle}>
                {activeLang === 'it' ? 'Regole di Non Contaminazione in Cucina' : activeLang === 'jp' ? '厨房内での混入防止ルール' : 'Kitchen Non-Contamination Rules'}
              </AppText>
            </View>
            <View style={styles.kitchenRulesList}>
              {Object.keys(KITCHEN_RULES_TRANSLATIONS).map((key) => {
                const rDict = KITCHEN_RULES_TRANSLATIONS[key];
                const rule = rDict[activeLang] || rDict.en || rDict.it;
                const iconName: keyof typeof Ionicons.glyphMap =
                  key === 'surfaces' ? 'flame-outline' :
                  key === 'oil' ? 'water-outline' :
                  key === 'gloves' ? 'hand-left-outline' : 'cut-outline';
                return (
                  <View key={key} style={styles.kitchenRuleItem}>
                    <View style={styles.kitchenRuleIconCircle}>
                      <Ionicons name={iconName} size={14} color="#B45309" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.kitchenRuleItemTitle}>{rule.title}</AppText>
                      <AppText style={styles.kitchenRuleItemDesc}>{rule.desc}</AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 5. ALLERGENS LIST CATEGORIZZATA */}
          {activeAllergies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shield-checkmark-outline" size={42} color="#10B981" />
              <AppText variant="bodyBold" style={{ color: '#23212C', marginTop: 10 }}>
                {isIt ? 'Nessun allergene configurato' : 'No allergens configured'}
              </AppText>
              <AppText variant="caption" color="#64748B" style={{ textAlign: 'center', marginTop: 4 }}>
                {isIt ? 'Aggiungi i tuoi allergeni nelle impostazioni profilo.' : 'Add your allergens in profile settings.'}
              </AppText>
            </View>
          ) : (
            <View style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <Ionicons name="shield-outline" size={16} color="#23212C" />
                <AppText variant="bodyBold" style={{ color: '#23212C', fontSize: 14 }}>
                  {isIt ? 'Dettaglio Allergeni & Intolleranze' : 'Allergen & Intolerance Detail'}
                </AppText>
              </View>

              {groupedAllergies.map((group, idx) => {
                const iconName = CATEGORY_OUTLINE_ICONS[group.key] || 'nutrition-outline';
                const secDict = ALLERGEN_SECTIONS[group.key] as Record<string, string> | undefined;
                const catTitle = secDict?.[activeLang] || secDict?.it || group.key.toUpperCase();
                const isLastGroup = idx === groupedAllergies.length - 1;

                return (
                  <View key={group.key} style={[styles.group, isLastGroup && styles.groupLast]}>
                    <View style={styles.groupHead}>
                      <View style={styles.groupTitleRow}>
                        <Ionicons name={iconName} size={15} color="#23212C" />
                        <AppText style={styles.groupTitleText}>{catTitle}</AppText>
                      </View>
                    </View>
                    {renderPillGroup(group.items)}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* FLOATING CTA FOOTER CON VANILLA */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFullScreenVisible(true);
          }}
        >
          <Ionicons name="expand-outline" size={18} color="#23212C" />
          <AppText variant="bodyBold" color="#23212C">
            {isIt ? 'Mostra Pass a Schermo Intero' : 'Show Full-Screen Pass'}
          </AppText>
        </Pressable>
      </View>

      {/* LANGUAGE PICKER MODAL */}
      <Modal visible={langPickerVisible} animationType="fade" transparent onRequestClose={() => setLangPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangPickerVisible(false)} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.sheetHandle} />
          <AppText variant="title" style={styles.sheetTitle}>
            {isIt ? 'Seleziona Lingua del Pass' : 'Select Pass Language'}
          </AppText>
          <AppText variant="caption" color="#64748B" style={styles.sheetSubtitle}>
            {isIt ? 'Il pass e le regole per lo chef verranno tradotti istantaneamente.' : 'The pass and kitchen rules will be instantly translated.'}
          </AppText>

          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetGrid}>
              {LANGUAGES_LIST.map((langObj) => {
                const selected = selectedLang === langObj.code;
                return (
                  <Pressable
                    key={langObj.code}
                    style={[styles.langSheetOption, selected && styles.langSheetOptionSelected]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedLang(langObj.code);
                      setLangPickerVisible(false);
                    }}
                  >
                    <AppText style={{ fontSize: 22 }}>{langObj.flag}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color={selected ? '#23212C' : '#475569'}>
                        {langObj.name}
                      </AppText>
                    </View>
                    {selected && <Ionicons name="checkmark-circle-outline" size={20} color="#23212C" />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* FULL-SCREEN PASS MODAL */}
      <Modal visible={fullScreenVisible} animationType="slide" transparent={false}>
        <View style={[styles.fullScreenBg, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.fsTopBar}>
            <Pressable
              style={styles.fsLangBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLangPickerVisible(true);
              }}
            >
              <AppText style={{ fontSize: 16 }}>{currentLangObj.flag}</AppText>
              <AppText variant="bodyBold" color="#F1FEC8">{currentLangObj.label}</AppText>
              <Ionicons name="chevron-down-outline" size={13} color="#F1FEC8" />
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setFullScreenVisible(false)}>
              <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              <AppText variant="bodyBold" color="#FFFFFF">{isIt ? 'Chiudi' : 'Close'}</AppText>
            </Pressable>
          </View>

          <View style={styles.fullScreenCard}>
            <AppText style={styles.fsTitle}>{getTitle()}</AppText>
            <AppText style={styles.fsSubtitle}>
              {activeLang === 'it' ? `Ospite: ${profileName}` : activeLang === 'jp' ? `お名前: ${profileName}` : `Guest: ${profileName}`}
            </AppText>

            <View style={styles.fsCriticalBanner}>
              <Ionicons name="warning-outline" size={18} color="#DC2626" />
              <View style={{ flex: 1 }}>
                {severeAllergies.length > 0 ? (
                  <AppText style={styles.fsCriticalText}>
                    <AppText style={styles.criticalBoldRed}>
                      {activeLang === 'it'
                        ? `ALLERGIA GRAVE: ${severeAllergies.map((c) => formatAllergenLabel(c)).join(', ')}. `
                        : activeLang === 'jp'
                        ? `重度アレルギー: ${severeAllergies.map((c) => formatAllergenLabel(c)).join('、')}。`
                        : `SEVERE ALLERGY: ${severeAllergies.map((c) => formatAllergenLabel(c)).join(', ')}. `}
                    </AppText>
                    {activeLang === 'it'
                      ? 'Evitare contaminazione crociata (piastre, oli, utensili).'
                      : activeLang === 'jp'
                      ? '調理器具や油の共有による交差混入に細心の注意をお願いします。'
                      : 'Strictly avoid cross-contamination in prep, utensils & oils.'}
                  </AppText>
                ) : (
                  <AppText style={styles.fsCriticalText}>
                    <AppText style={styles.criticalBoldRed}>
                      {activeLang === 'it' ? 'Avviso Cucina: ' : activeLang === 'jp' ? '調理のお願い: ' : 'Kitchen Alert: '}
                    </AppText>
                    {activeLang === 'it'
                      ? 'Verificare che i piatti non contengano gli allergeni indicati sotto.'
                      : activeLang === 'jp'
                      ? '下記のアレルゲンが料理に含まれないようご確認をお願いします。'
                      : 'Ensure dishes do not contain listed ingredients.'}
                  </AppText>
                )}
              </View>
            </View>

            <ScrollView style={{ width: '100%', flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.fsListCard}>
                {groupedAllergies.map((group, idx) => {
                  const iconName = CATEGORY_OUTLINE_ICONS[group.key] || 'nutrition-outline';
                  const fsSecDict = ALLERGEN_SECTIONS[group.key] as Record<string, string> | undefined;
                  const catTitle = fsSecDict?.[activeLang] || fsSecDict?.it || group.key.toUpperCase();
                  const isLast = idx === groupedAllergies.length - 1;

                  return (
                    <View key={group.key} style={[styles.group, isLast && styles.groupLast]}>
                      <View style={styles.groupHead}>
                        <View style={styles.groupTitleRow}>
                          <Ionicons name={iconName} size={15} color="#23212C" />
                          <AppText style={styles.groupTitleText}>{catTitle}</AppText>
                        </View>
                      </View>
                      {renderPillGroup(group.items)}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <AppText variant="caption" color="#64748B" style={styles.fsFooter}>
              {isIt ? 'Mostra questo schermo al cameriere o allo chef.' : activeLang === 'jp' ? 'この画面を給仕スタッフまたは料理長にご提示ください。' : 'Show this screen to waitstaff or head chef.'}
            </AppText>
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
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topHeaderIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRightLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langPillText: {
    fontWeight: '800',
    color: '#23212C',
    fontSize: 12,
  },

  // PROFILI
  profileSelectorWrap: {
    marginBottom: 2,
  },
  profileSelectorScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profilePillActive: {
    backgroundColor: '#23212C',
    borderColor: '#23212C',
  },
  profilePillText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#475569',
  },
  profilePillTextActive: {
    color: '#F1FEC8',
    fontFamily: font.bold,
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

  // CRITICAL BANNER
  criticalBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  criticalTextWrap: {
    flex: 1,
  },
  criticalText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
    fontFamily: font.regular,
  },
  criticalBoldRed: {
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: font.bold,
  },

  // KITCHEN CONTAMINATION RULES CARD
  kitchenRulesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    gap: 12,
  },
  kitchenRulesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kitchenRulesTitle: {
    fontFamily: font.bold,
    fontSize: 13.5,
    color: '#92400E',
  },
  kitchenRulesList: {
    gap: 10,
  },
  kitchenRuleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  kitchenRuleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  kitchenRuleItemTitle: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: '#78350F',
    marginBottom: 1,
  },
  kitchenRuleItemDesc: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },

  // LIST CARD
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  group: {
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  groupLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  groupHead: {
    marginBottom: 10,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#23212C',
    letterSpacing: 0.3,
    fontFamily: font.bold,
  },

  // PILLS
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: font.semibold,
  },
  pillGrave: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pillGraveText: {
    color: '#DC2626',
    fontWeight: '800',
    fontFamily: font.bold,
  },
  pillMod: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillModText: {
    color: '#B45309',
    fontWeight: '700',
  },
  pillLieve: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  pillLieveText: {
    color: '#0F766E',
    fontWeight: '700',
  },
  pillDiet: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillDietText: {
    color: '#059669',
    fontWeight: '700',
  },

  // FLOATING CTA
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1FEC8',
    borderWidth: 1,
    borderColor: '#E2F4A6',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#F1FEC8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // MODAL / SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 33, 44, 0.65)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: '#23212C',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    marginBottom: 16,
  },
  sheetList: {
    marginBottom: 12,
  },
  sheetGrid: {
    gap: 8,
  },
  langSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langSheetOptionSelected: {
    backgroundColor: '#F1FEC8',
    borderColor: '#E2F4A6',
  },

  // FULLSCREEN
  fullScreenBg: {
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
  fsLangBtn: {
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
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  fullScreenCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  fsTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: '#23212C',
    textAlign: 'center',
    marginBottom: 2,
  },
  fsSubtitle: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: '#64748B',
    marginBottom: 12,
  },
  fsCriticalBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
    width: '100%',
  },
  fsCriticalText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
  },
  fsListCard: {
    width: '100%',
  },
  fsFooter: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 11.5,
    color: '#64748B',
  },
});
