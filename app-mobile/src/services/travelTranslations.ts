export interface TravelLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const TRAVEL_LANGUAGES: TravelLanguage[] = [
  { code: 'en', name: 'Inglese', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spagnolo', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Francese', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Giapponese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Cinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'el', name: 'Greco', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ar', name: 'Arabo', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Portoghese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
];

export const TRAVEL_ALLERGEN_NAMES: Record<string, Record<string, string>> = {
  glutine: {
    it: 'glutine / grano',
    en: 'gluten / wheat',
    es: 'gluten / trigo',
    fr: 'gluten / blé',
    de: 'Gluten / Weizen',
    ja: '小麦・グルテン',
    zh: '麸质 / 小麦',
    el: 'γλουτένη / σιτάρι',
    ar: 'الغلوتين / القمح',
    pt: 'glúten / trigo',
  },
  latte: {
    it: 'latte / lattosio / formaggio',
    en: 'milk / dairy / cheese',
    es: 'leche / lácteos / queso',
    fr: 'lait / produits laitiers',
    de: 'Milch / Laktose',
    ja: '乳・乳製品',
    zh: '牛奶 / 乳制品',
    el: 'γάλα / γαλακτοκομικά',
    ar: 'الحليب / مشتقات الألبان',
    pt: 'leite / laticínios',
  },
  uova: {
    it: 'uova',
    en: 'eggs',
    es: 'huevos',
    fr: 'œufs',
    de: 'Eier',
    ja: '卵',
    zh: '鸡蛋',
    el: 'αυγά',
    ar: 'البيض',
    pt: 'ovos',
  },
  arachidi: {
    it: 'arachidi / noccioline',
    en: 'peanuts',
    es: 'cacahuates / maní',
    fr: 'arachides / cacahuètes',
    de: 'Erdnüsse',
    ja: '落花生・ピーナッツ',
    zh: '花生',
    el: 'φιστίκια',
    ar: 'الفول السوداني',
    pt: 'amendoim',
  },
  frutta_a_guscio: {
    it: 'frutta a guscio (noci, nocciole, mandorle)',
    en: 'tree nuts (walnuts, hazelnuts, almonds)',
    es: 'frutos secos (nueces, avellanas)',
    fr: 'fruits à coque (noix, noisettes)',
    de: 'Schalenfrüchte / Nüsse',
    ja: '木の実類（ナッツ、アーモンド）',
    zh: '坚果（核桃、榛子、杏仁）',
    el: 'ξηροί καρποί',
    ar: 'المكسرات',
    pt: 'frutos de casca rija (nozes, avelãs)',
  },
  crostacei: {
    it: 'crostacei (gamberi, scampi, aragoste)',
    en: 'shellfish / crustaceans (shrimps, prawns)',
    es: 'mariscos / crustáceos (gambas, langostinos)',
    fr: 'crustacés (crevettes, homard)',
    de: 'Krebstiere / Garnelen',
    ja: '甲殻類（エビ・カニ）',
    zh: '甲壳类（虾、蟹）',
    el: 'οστρακοειδή / γαρίδες',
    ar: 'القشريات / الروبيان',
    pt: 'crustáceos (camarão, lagosta)',
  },
  pesce: {
    it: 'pesce',
    en: 'fish',
    es: 'pescado',
    fr: 'poisson',
    de: 'Fisch',
    ja: '魚',
    zh: '鱼类',
    el: 'ψάρι',
    ar: 'الأسماك',
    pt: 'peixe',
  },
  soia: {
    it: 'soia',
    en: 'soy / soya',
    es: 'soja',
    fr: 'soja',
    de: 'Soja',
    ja: '大豆',
    zh: '大豆 / 黄豆',
    el: 'σόγια',
    ar: 'الصويا',
    pt: 'soja',
  },
};

export interface TravelPhraseTemplate {
  id: string;
  category: 'restaurant' | 'emergency';
  titleIt: string;
  titleEn: string;
  templateByLang: Record<string, string>;
  phoneticJaZh?: Record<string, string>;
}

export const TRAVEL_PHRASE_TEMPLATES: TravelPhraseTemplate[] = [
  {
    id: 'rest_severe_allergy',
    category: 'restaurant',
    titleIt: 'Dichiarazione Allergia Grave (Shock Anafilattico)',
    titleEn: 'Severe Allergy Notice',
    templateByLang: {
      it: 'Ho una grave allergia a: {ALLERGENS}. Anche tracce minime possono causarmi shock anafilattico letale.',
      en: 'I have a life-threatening allergy to: {ALLERGENS}. Even small traces can cause fatal anaphylactic shock.',
      es: 'Tengo una alergia grave y mortal a: {ALLERGENS}. Trazas mínimas pueden causarme shock anafiláctico.',
      fr: 'J\'ai une allergie mortelle à : {ALLERGENS}. Même d\'infimes traces peuvent provoquer un choc anaphylactique.',
      de: 'Ich habe eine lebensgefährliche Allergie gegen: {ALLERGENS}. Selbst Spuren können einen anaphylaktischen Schock auslösen.',
      ja: '私は【 {ALLERGENS} 】に重度のアレルギーがあります。微量混入でも命に関わるアナフィラキシーショックを起こします。',
      zh: '我对【 {ALLERGENS} 】有严重过敏。即使微量接触也会引起危及生命的过敏性休克。',
      el: 'Έχω σοβαρή και απειλητική για τη ζωή αλλεργία σε: {ALLERGENS}. Ακόμη και ίχνη προκαλούν αναφυλακτικό σοκ.',
      ar: 'لدي حساسية شديدة ومميتة تجاه: {ALLERGENS}. حتى الآثار القليلة قد تسبب صدمة حساسية خطيرة.',
      pt: 'Tenho uma alergia grave a: {ALLERGENS}. Mesmo vestígios podem causar choque anafilático.',
    },
    phoneticJaZh: {
      ja: 'Watashi wa {ALLERGENS} ni jūdo no arerugī ga arimasu.',
      zh: 'Wǒ duì {ALLERGENS} yǒu yánzhòng guòmǐn.',
    },
  },
  {
    id: 'rest_cross_contamination',
    category: 'restaurant',
    titleIt: 'Verifica Contaminazione Olio e Padelle',
    titleEn: 'Cross-Contamination & Cooking Oil Check',
    templateByLang: {
      it: 'Questo piatto è stato fritto nello stesso olio o preparato sullo stesso tagliere/padella di {ALLERGENS}?',
      en: 'Was this dish cooked in the same oil or prepared on the same surface/pan as {ALLERGENS}?',
      es: '¿Este plato fue frito en el mismo aceite o preparado en la misma sartén que {ALLERGENS}?',
      fr: 'Ce plat a-t-il été cuit dans la même huile ou préparé sur la même poêle que {ALLERGENS} ?',
      de: 'Wurde dieses Gericht im selben Öl frittiert oder auf derselben Pfanne zubereitet wie {ALLERGENS}?',
      ja: 'この料理は【 {ALLERGENS} 】と同じ油や同じフライパン・まな板で調理されていますか？',
      zh: '这道菜是否与【 {ALLERGENS} 】使用相同的油或厨具烹制？',
      el: 'Αυτό το πιάτο μαγειρεύτηκε στο ίδιο λάδι ή τηγάνι με {ALLERGENS};',
      ar: 'هل تم طهي هذا الطبق في نفس الزيت أو باستخدام نفس الأواني مثل {ALLERGENS}؟',
      pt: 'Este prato foi cozinhado no mesmo óleo ou na mesma frigideira que {ALLERGENS}?',
    },
  },
  {
    id: 'rest_hidden_dairy',
    category: 'restaurant',
    titleIt: 'Verifica Burro o Latticini Nascosti nella Salsa',
    titleEn: 'Hidden Butter / Dairy in Sauce Check',
    templateByLang: {
      it: 'La salsa o l\'impasto contengono burro, latte, panna o formaggio?',
      en: 'Does the sauce or dough contain hidden butter, milk, cream, or cheese?',
      es: '¿La salsa o la masa contienen mantequilla, leche, nata o queso?',
      fr: 'La sauce ou la pâte contient-elle du beurre, du lait, de la crème ou du fromage ?',
      de: 'Enthält die Sauce oder der Teig Butter, Milch, Sahne oder Käse?',
      ja: 'ソースや生地にバター、牛乳、生クリーム、チーズは含まれていますか？',
      zh: '酱汁或面团中是否含有黄油、牛奶、奶油或奶酪？',
      el: 'Η σάλτσα ή η ζύμη περιέχει βούτυρο, γάλα, κρέμα ή τυρί;',
      ar: 'هل تحتوي الصلصة أو العجين على زبدة أو حليب أو قشطة أو جبن؟',
      pt: 'O molho ou a massa contêm manteiga, leite, natas ou queijo?',
    },
  },
  {
    id: 'emg_anaphylaxis_help',
    category: 'emergency',
    titleIt: 'Allerta Emergenza Anafilassi',
    titleEn: 'Anaphylaxis Emergency Help',
    templateByLang: {
      it: 'AIUTO! Sto avendo uno shock anafilattico! Chiamate subito il 112!',
      en: 'HELP! I am having an anaphylactic shock! Call emergency services immediately!',
      es: '¡AYUDA! ¡Estoy sufriendo un shock anafiláctico! ¡Llamen a emergencias de inmediato!',
      fr: 'AIDEZ-MOI ! Je fais un choc anaphylactique ! Appelez les urgences immédiatement !',
      de: 'HILFE! Ich erleide einen anaphylaktischen Schock! Rufen Sie sofort den Notarzt!',
      ja: '助けてください！アナフィラキシーショックを起こしています！今すぐ救急車を呼んでください！',
      zh: '救命！我正在发生过敏性休克！请立即呼叫救护车！',
      el: 'ΒΟΗΘΕΙΑ! Παθαίνω αναφυλακτικό σοκ! Καλέστε αμέσως ασθενοφόρο!',
      ar: 'النجدة! أنا أعاني من صدمة حساسية حادة! اتصلوا بالإسعاف فوراً!',
      pt: 'SOCORRO! Estou a ter um choque anafilático! Chamem uma ambulância imediatamente!',
    },
  },
  {
    id: 'emg_epipen_injection',
    category: 'emergency',
    titleIt: 'Istruzioni Autoiniettore Adrenalina',
    titleEn: 'Adrenaline Auto-Injector Instructions',
    templateByLang: {
      it: 'Ho un autoiniettore di adrenalina nella borsa. Iniettatemelo con forza nella parte esterna della coscia per 5 secondi!',
      en: 'I have an adrenaline auto-injector in my bag. Firmly inject it into the outer thigh and hold for 5 seconds!',
      es: 'Tengo un autoinyector de adrenalina en mi bolso. ¡Inyéctenlo firmemente en la parte exterior del muslo durante 5 segundos!',
      fr: 'J\'ai un auto-injecteur d\'adrénaline dans mon sac. Injectez-le fermement sur le côté de ma cuisse pendant 5 secondes !',
      de: 'Ich habe einen Adrenalin-Autoinjektor in meiner Tasche. Bitte fest in den äußeren Oberschenkel injizieren und 5 Sekunden halten!',
      ja: 'バッグの中にアドレナリン自己注射器（エピペン）があります。太ももの外側に強く押し当てて5秒間保持してください！',
      zh: '我的包里有肾上腺素自动注射器。请用力刺入我的大腿外侧并保持5秒钟！',
      el: 'Έχω αυτοενιέκτη αδρεναλίνης στην τσάντα μου. Κάντε ένεση στον εξωτερικό μηρό για 5 δευτερόλεπτα!',
      ar: 'لدي حاقن أدرينالين تلقائي في حقيبتي. يرجى حقنه بقوة في الفخذ الخارجي وتثبيته لمدة 5 ثوانٍ!',
      pt: 'Tenho um autoinjetor de adrenalina na minha bolsa. Injetem com firmeza na parte exterior da coxa durante 5 segundos!',
    },
  },
];

export function getResolvedPhrase(
  template: TravelPhraseTemplate,
  targetLang: string,
  userAllergens: string[]
): string {
  const rawTemplate = template.templateByLang[targetLang] || template.templateByLang['en'];
  const allergenNames = userAllergens
    .map((code) => {
      const dict = TRAVEL_ALLERGEN_NAMES[code];
      return dict ? (dict[targetLang] || dict['en'] || code) : code;
    })
    .join(', ');

  return rawTemplate.replace('{ALLERGENS}', allergenNames || 'Allergens');
}
