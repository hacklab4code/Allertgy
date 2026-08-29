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
import { useSession } from '../src/store/session';
import { AppText, GlassScreenScroll, Screen, SurfaceButton, CATEGORY_ICONS } from '../src/components/ui';
import { TRANSLATED_ALLERGENS, ALLERGEN_SECTIONS } from '../src/engine/translations';
import { colors, radius, spacing, font, MIN_TOUCH_TARGET } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';

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

export default function AllergyCardScreen() {
  const navigation = useNavigation();
  const {
    allergie: primaryAllergies,
    allergyIntensities: primaryIntensities = {},
    ingredientiEsclusi: primaryExcluded = [],
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
    return 'Ospite';
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

  const getEmojiForCode = (code: string): string => {
    const clean = code.toLowerCase().trim();
    if (TRANSLATED_ALLERGENS[clean]?.emoji) return TRANSLATED_ALLERGENS[clean].emoji;
    const cat = getCategoryForKey(clean);
    return CATEGORY_ICONS[cat] || '⚠️';
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
      return { pillStyle: styles.pillDiet, textStyle: styles.pillDietText, suffix: '' };
    }
    if (intensity === 'grave') {
      const suf = activeLang === 'it' ? ' (GRAVE)' : activeLang === 'jp' ? '（重度）' : ' (SEVERE)';
      return { pillStyle: styles.pillGrave, textStyle: styles.pillGraveText, suffix: suf };
    }
    if (intensity === 'lieve') {
      return { pillStyle: styles.pillLieve, textStyle: styles.pillLieveText, suffix: '' };
    }
    return { pillStyle: styles.pillMod, textStyle: styles.pillModText, suffix: '' };
  };

  const getTitle = (): string => CARD_TITLES[activeLang] || CARD_TITLES.en;

  const handleShareCard = async () => {
    void Haptics.selectionAsync();
    const allergenListText = activeAllergies.map((code) => `• ${formatAllergenLabel(code)}`).join('\n');
    const message = `🍽️ AllerTgy Chef Pass — ${profileName} (${currentLangObj.name})\n\n${getTitle()}\n\n⚠️ ALLERGENI & INTOLLERANZE:\n${allergenListText}\n\n🍳 REGOLE DI CUCINA:\n• Utilizzare padelle e superfici dedicate\n• Olio di frittura non contaminato\n• Lavaggio mani e guanti puliti prima dell'impiattamento.\n\nGenerato con AllerTgy (allertgy.com)`;

    try {
      await Share.share({ message });
    } catch {
      // ignore
    }
  };

  const renderPillGroup = (items: string[]) => (
    <View style={styles.pillRow}>
      {items.map((code) => {
        const emoji = getEmojiForCode(code);
        const label = formatAllergenLabel(code);
        const { pillStyle, textStyle, suffix } = getPillStyle(code);

        return (
          <View key={code} style={[styles.pillBase, pillStyle]}>
            <AppText style={styles.pillEmoji}>{emoji}</AppText>
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
      <Stack.Screen
        options={{
          headerTitle: isIt ? 'Chef Pass Ristorante' : 'Restaurant Chef Pass',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 18, color: '#322A63' },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else router.replace('/');
              }}
              hitSlop={12}
              style={{ paddingRight: 12, paddingVertical: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#322A63" />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={handleShareCard} hitSlop={8} style={styles.topHeaderIconBtn}>
                <Ionicons name="share-outline" size={20} color="#322A63" />
              </Pressable>
              <Pressable
                style={styles.topRightLangPill}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLangPickerVisible(true);
                }}
              >
                <AppText style={{ fontSize: 14 }}>{currentLangObj.flag}</AppText>
                <AppText variant="caption" style={{ fontWeight: '800', color: '#2A2452' }}>
                  {currentLangObj.label} ⌄
                </AppText>
              </Pressable>
            </View>
          ),
        }}
      />

      <GlassScreenScroll insetBottom={150 + insets.bottom} headerFloat={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* SUBPROFILE SELECTOR */}
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
                <AppText style={[styles.profilePillText, !activeProfileId && styles.profilePillTextActive]}>
                  👤 {email ? email.split('@')[0] : 'Principale'}
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
                    <AppText style={[styles.profilePillText, isSelected && styles.profilePillTextActive]}>
                      👶 {p.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* SUBTITLE */}
        <AppText style={styles.subtitleText}>
          {isIt
            ? `Pass digitale medico per sala e cucina di ${profileName}. Mostralo al cameriere o allo chef.`
            : `Medical digital pass for kitchen and waitstaff of ${profileName}. Show it to the server or chef.`}
        </AppText>

        {/* CRITICAL BANNER FIRST */}
        <View style={styles.criticalBanner}>
          <AppText style={styles.criticalIcon}>⚠️</AppText>
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

        {/* KITCHEN CONTAMINATION RULES CARD */}
        <View style={styles.kitchenRulesCard}>
          <View style={styles.kitchenRulesHead}>
            <Ionicons name="restaurant-outline" size={18} color="#D97706" />
            <AppText style={styles.kitchenRulesTitle}>
              {activeLang === 'it' ? 'Regole di Non Contaminazione in Cucina' : activeLang === 'jp' ? '厨房内での混入防止ルール' : 'Kitchen Non-Contamination Rules'}
            </AppText>
          </View>
          <View style={styles.kitchenRulesList}>
            {Object.keys(KITCHEN_RULES_TRANSLATIONS).map((key) => {
              const rDict = KITCHEN_RULES_TRANSLATIONS[key];
              const rule = rDict[activeLang] || rDict.en || rDict.it;
              const iconName = key === 'surfaces' ? 'flame-outline' : key === 'oil' ? 'water-outline' : key === 'gloves' ? 'hand-left-outline' : 'cut-outline';
              return (
                <View key={key} style={styles.kitchenRuleItem}>
                  <View style={styles.kitchenRuleIconCircle}>
                    <Ionicons name={iconName as any} size={15} color="#B45309" />
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

        {/* ALLERGENS LIST */}
        {activeAllergies.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppText variant="caption" color="#6B6690">
              {isIt ? 'Nessun allergene configurato nel profilo selezionato.' : 'No allergens configured in this profile.'}
            </AppText>
          </View>
        ) : (
          <View style={styles.listCard}>
            {groupedAllergies.map((group, idx) => {
              const catIcon = CATEGORY_ICONS[group.key] || '🏷️';
              const secDict = ALLERGEN_SECTIONS[group.key] as Record<string, string> | undefined;
              const catTitle = secDict?.[activeLang] || secDict?.it || group.key.toUpperCase();
              const isLastGroup = idx === groupedAllergies.length - 1;

              return (
                <View key={group.key} style={[styles.group, isLastGroup && styles.groupLast]}>
                  <View style={styles.groupHead}>
                    <View style={styles.groupTitleRow}>
                      <AppText style={styles.groupIconText}>{catIcon}</AppText>
                      <AppText style={styles.groupTitleText}>{catTitle}</AppText>
                    </View>
                  </View>
                  {renderPillGroup(group.items)}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 140 + insets.bottom }} />
      </GlassScreenScroll>

      {/* FLOATING CTA FOOTER */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <SurfaceButton
          label={isIt ? 'Mostra Pass a Schermo Intero' : 'Show Full-Screen Pass'}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFullScreenVisible(true);
          }}
          fullWidth
          style={styles.ctaButton}
        />
      </View>

      {/* LANGUAGE PICKER MODAL */}
      <Modal visible={langPickerVisible} animationType="fade" transparent onRequestClose={() => setLangPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangPickerVisible(false)} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.sheetHandle} />
          <AppText variant="title" style={styles.sheetTitle}>
            {isIt ? 'Seleziona Lingua del Pass' : 'Select Pass Language'}
          </AppText>
          <AppText variant="caption" color="#6B6690" style={styles.sheetSubtitle}>
            {isIt ? 'Il pass e le istruzioni di cucina verranno tradotti istantaneamente' : 'Pass and kitchen rules will translate instantly'}
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
                      <AppText variant="bodyBold" color={selected ? colors.brand : '#2A2452'}>
                        {langObj.name}
                      </AppText>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={colors.brand} />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* FULL-SCREEN PASS MODAL */}
      <Modal visible={fullScreenVisible} animationType="slide" transparent={false}>
        <View style={styles.fullScreenBg}>
          <View style={styles.fsTopBar}>
            <Pressable
              style={styles.fsLangBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLangPickerVisible(true);
              }}
            >
              <AppText style={{ fontSize: 18 }}>{currentLangObj.flag}</AppText>
              <AppText variant="bodyBold" color="#FFFFFF">{currentLangObj.label}</AppText>
              <Ionicons name="chevron-down" size={14} color="#94A3B8" />
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setFullScreenVisible(false)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
              <AppText variant="bodyBold" color="#FFFFFF">{isIt ? 'Chiudi' : 'Close'}</AppText>
            </Pressable>
          </View>

          <View style={styles.fullScreenCard}>
            <AppText style={styles.fsTitle}>{getTitle()}</AppText>
            <AppText style={styles.fsSubtitle}>
              {activeLang === 'it' ? `Ospite: ${profileName}` : activeLang === 'jp' ? `お名前: ${profileName}` : `Guest: ${profileName}`}
            </AppText>

            <View style={styles.fsCriticalBanner}>
              <AppText style={styles.criticalIcon}>⚠️</AppText>
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

            <ScrollView style={{ width: '100%', maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={styles.fsListCard}>
                {groupedAllergies.map((group, idx) => {
                  const catIcon = CATEGORY_ICONS[group.key] || '🏷️';
                  const fsSecDict = ALLERGEN_SECTIONS[group.key] as Record<string, string> | undefined;
                  const catTitle = fsSecDict?.[activeLang] || fsSecDict?.it || group.key.toUpperCase();
                  const isLast = idx === groupedAllergies.length - 1;

                  return (
                    <View key={group.key} style={[styles.group, isLast && styles.groupLast]}>
                      <View style={styles.groupHead}>
                        <View style={styles.groupTitleRow}>
                          <AppText style={styles.groupIconText}>{catIcon}</AppText>
                          <AppText style={styles.groupTitleText}>{catTitle}</AppText>
                        </View>
                      </View>
                      {renderPillGroup(group.items)}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <AppText variant="caption" color="#6B6690" style={styles.fsFooter}>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 160,
  },
  profileSelectorWrap: {
    marginBottom: 12,
  },
  profileSelectorScroll: {
    gap: 8,
  },
  profilePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  profilePillActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  profilePillText: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: '#4B4668',
  },
  profilePillTextActive: {
    color: '#FFFFFF',
    fontFamily: font.bold,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B6690',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: font.regular,
  },
  topHeaderIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  topRightLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  // CRITICAL BANNER
  criticalBanner: {
    backgroundColor: '#FCE9EA',
    borderLeftWidth: 4,
    borderLeftColor: '#E5484D',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  criticalIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  criticalTextWrap: {
    flex: 1,
  },
  criticalText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#2A2452',
    fontFamily: font.regular,
  },
  criticalBoldRed: {
    fontWeight: '800',
    color: '#E5484D',
    fontFamily: font.bold,
  },

  // KITCHEN CONTAMINATION RULES CARD
  kitchenRulesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  kitchenRulesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kitchenRulesTitle: {
    fontFamily: font.bold,
    fontSize: 14,
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
    fontSize: 13,
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
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#322A63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  group: {
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2F8',
  },
  groupLast: {
    borderBottomWidth: 0,
    paddingBottom: 14,
  },
  groupHead: {
    marginBottom: 12,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupIconText: {
    fontSize: 16,
  },
  groupTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#322A63',
    letterSpacing: 0.6,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillEmoji: {
    fontSize: 15,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: font.semibold,
  },
  pillGrave: {
    backgroundColor: '#FCE9EA',
    borderWidth: 1,
    borderColor: '#F8B4B8',
  },
  pillGraveText: {
    color: '#C92A2A',
    fontWeight: '800',
    fontFamily: font.bold,
  },
  pillMod: {
    backgroundColor: '#F3F2F8',
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  pillModText: {
    color: '#2A2452',
  },
  pillLieve: {
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#EDEBF5',
  },
  pillLieveText: {
    color: '#6B6690',
  },
  pillDiet: {
    backgroundColor: '#E6F6EC',
    borderWidth: 1,
    borderColor: '#B7E4C7',
  },
  pillDietText: {
    color: '#2B8A3E',
    fontWeight: '700',
  },

  // FLOATING CTA
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  ctaButton: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  // MODAL / SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 41, 0.45)',
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
    paddingHorizontal: 24,
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
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: font.bold,
    color: '#1E1B4B',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  sheetList: {
    marginBottom: 16,
  },
  sheetGrid: {
    gap: 8,
  },
  langSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  langSheetOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },

  // FULLSCREEN
  fullScreenBg: {
    flex: 1,
    backgroundColor: '#0F0C29',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 24,
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
    paddingVertical: 6,
    borderRadius: radius.pill,
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
    justifyContent: 'space-between',
  },
  fsTitle: {
    fontSize: 18,
    fontFamily: font.bold,
    color: '#1E1B4B',
    textAlign: 'center',
    marginBottom: 2,
  },
  fsSubtitle: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: '#6B6690',
    marginBottom: 12,
  },
  fsCriticalBanner: {
    backgroundColor: '#FCE9EA',
    borderLeftWidth: 4,
    borderLeftColor: '#E5484D',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
    width: '100%',
  },
  fsCriticalText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#2A2452',
  },
  fsListCard: {
    width: '100%',
  },
  fsFooter: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
  },
});
