// ---------------------------------------------------------------------------
// Supported UI languages for the app interface
// All other language codes fall back to 'en'
// ---------------------------------------------------------------------------
export type UILang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'ru' | 'tr' | 'pl' | 'nl';

const SUPPORTED_UI_LANGS: UILang[] = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko', 'ru', 'tr', 'pl', 'nl'];

/**
 * Normalize any BCP-47 language code to a supported UI language.
 * Falls back to 'en' for unsupported languages.
 */
export function getLang(lang: string | null | undefined): UILang {
  const code = (lang || 'it').toLowerCase().split('-')[0] as UILang;
  return SUPPORTED_UI_LANGS.includes(code) ? code : 'en';
}

// ---------------------------------------------------------------------------
// Allergen name translations (IT + EN only – names come from the DB for others)
// ---------------------------------------------------------------------------
export const TRANSLATED_ALLERGENS: Record<string, { en: string; it: string; emoji: string }> = {
  glutine: { it: "Cereali con glutine", en: "Gluten cereals", emoji: "🌾" },
  crostacei: { it: "Crostacei", en: "Crustaceans", emoji: "🦐" },
  uova: { it: "Uova", en: "Eggs", emoji: "🥚" },
  pesce: { it: "Pesce", en: "Fish", emoji: "🐟" },
  arachidi: { it: "Arachidi", en: "Peanuts", emoji: "🥜" },
  soia: { it: "Soia", en: "Soy", emoji: "🌱" },
  latte: { it: "Latte e lattosio", en: "Milk & lactose", emoji: "🥛" },
  frutta_a_guscio: { it: "Frutta a guscio", en: "Tree nuts", emoji: "🌰" },
  sedano: { it: "Sedano", en: "Celery", emoji: "🥬" },
  senape: { it: "Senape", en: "Mustard", emoji: "🟡" },
  sesamo: { it: "Semi di sesamo", en: "Sesame seeds", emoji: "⚪" },
  solfiti: { it: "Anidride solforosa / solfiti", en: "Sulfites / sulfur dioxide", emoji: "🍷" },
  lupini: { it: "Lupini", en: "Lupins", emoji: "🫘" },
  molluschi: { it: "Molluschi", en: "Molluscs", emoji: "🦑" },
  mandorle: { it: "Mandorle", en: "Almonds", emoji: "🌰" },
  nocciole: { it: "Nocciole", en: "Hazelnuts", emoji: "🌰" },
  noci: { it: "Noci", en: "Walnuts", emoji: "🌰" },
  noci_pecan: { it: "Noci pecan", en: "Pecans", emoji: "🌰" },
  noci_brasiliane: { it: "Noci brasiliane", en: "Brazil nuts", emoji: "🌰" },
  pistacchi: { it: "Pistacchi", en: "Pistachios", emoji: "🌰" },
  anacardi: { it: "Anacardi", en: "Cashews", emoji: "🌰" },
  castagne: { it: "Castagne", en: "Chestnuts", emoji: "🌰" },
  pinoli: { it: "Pinoli", en: "Pine nuts", emoji: "🌰" },
  macadamia: { it: "Noci macadamia", en: "Macadamia nuts", emoji: "🌰" },
  fragole: { it: "Fragole", en: "Strawberries", emoji: "🍓" },
  kiwi: { it: "Kiwi", en: "Kiwi", emoji: "🥝" },
  mela: { it: "Mela", en: "Apple", emoji: "🍎" },
  pesca: { it: "Pesca", en: "Peach", emoji: "🍑" },
  arancia: { it: "Arancia", en: "Orange", emoji: "🍊" },
  limone: { it: "Limone", en: "Lemon", emoji: "🍋" },
  agrumi: { it: "Agrumi", en: "Citrus fruits", emoji: "🍊" },
  banana: { it: "Banana", en: "Banana", emoji: "🍌" },
  uva: { it: "Uva", en: "Grapes", emoji: "🍇" },
  anguria: { it: "Anguria", en: "Watermelon", emoji: "🍉" },
  melone: { it: "Melone", en: "Melon", emoji: "🍈" },
  ananas: { it: "Ananas", en: "Pineapple", emoji: "🍍" },
  mango: { it: "Mango", en: "Mango", emoji: "🥭" },
  avocado: { it: "Avocado", en: "Avocado", emoji: "🥑" },
  albicocca: { it: "Albicocca", en: "Apricot", emoji: "🍑" },
  ciliegia: { it: "Ciliegia", en: "Cherry", emoji: "🍒" },
  pera: { it: "Pera", en: "Pear", emoji: "🍐" },
  prugna: { it: "Prugna", en: "Plum", emoji: "🫐" },
  lamponi: { it: "Lamponi", en: "Raspberries", emoji: "🫐" },
  mirtilli: { it: "Mirtilli", en: "Blueberries", emoji: "🫐" },
  cocco: { it: "Cocco", en: "Coconut", emoji: "🥥" },
  frutti_di_bosco: { it: "Frutti di bosco", en: "Berries", emoji: "🫐" },
  pomodoro: { it: "Pomodoro", en: "Tomato", emoji: "🍅" },
  aglio: { it: "Aglio", en: "Garlic", emoji: "🧄" },
  cipolla: { it: "Cipolla", en: "Onion", emoji: "🧅" },
  carota: { it: "Carota", en: "Carrot", emoji: "🥕" },
  funghi: { it: "Funghi", en: "Mushrooms", emoji: "🍄" },
  mais: { it: "Mais", en: "Corn", emoji: "🌽" },
  peperoncino: { it: "Peperoncino", en: "Chili pepper", emoji: "🌶️" },
  peperone: { it: "Peperone", en: "Bell pepper", emoji: "🫑" },
  melanzana: { it: "Melanzana", en: "Eggplant", emoji: "🍆" },
  zucchina: { it: "Zucchina", en: "Zucchini", emoji: "🥒" },
  spinaci: { it: "Spinaci", en: "Spinach", emoji: "🥬" },
  broccoli: { it: "Broccoli", en: "Broccoli", emoji: "🥦" },
  cavolfiore: { it: "Cavolfiore", en: "Cauliflower", emoji: "🥦" },
  cavolo: { it: "Cavolo", en: "Cabbage", emoji: "🥬" },
  patata: { it: "Patata", en: "Potato", emoji: "🥔" },
  piselli: { it: "Piselli", en: "Peas", emoji: "🫛" },
  fagioli: { it: "Fagioli", en: "Beans", emoji: "🫘" },
  lenticchie: { it: "Lenticchie", en: "Lentils", emoji: "🫘" },
  cetriolo: { it: "Cetriolo", en: "Cucumber", emoji: "🥒" },
  lattuga: { it: "Lattuga e insalata", en: "Lettuce & salad", emoji: "🥬" },
  rucola: { it: "Rucola", en: "Arugula", emoji: "🥬" },
  barbabietola: { it: "Barbabietola", en: "Beetroot", emoji: "🫚" },
  finocchio: { it: "Finocchio", en: "Fennel", emoji: "🌿" },
  asparagi: { it: "Asparagi", en: "Asparagus", emoji: "🌿" },
  carciofi: { it: "Carciofi", en: "Artichokes", emoji: "🌿" },
  porri: { it: "Porri", en: "Leeks", emoji: "🧅" },
  riso: { it: "Riso", en: "Rice", emoji: "🍚" },
  avena: { it: "Avena", en: "Oats", emoji: "🌾" },
  segale: { it: "Segale", en: "Rye", emoji: "🌾" },
  orzo: { it: "Orzo", en: "Barley", emoji: "🌾" },
  quinoa: { it: "Quinoa", en: "Quinoa", emoji: "🌾" },
  farro: { it: "Farro", en: "Spelt", emoji: "🌾" },
  grano_saraceno: { it: "Grano saraceno", en: "Buckwheat", emoji: "🌾" },
  teff: { it: "Teff", en: "Teff", emoji: "🌾" },
  amaranto: { it: "Amaranto", en: "Amaranth", emoji: "🌾" },
  cannella: { it: "Cannella", en: "Cinnamon", emoji: "🟤" },
  vaniglia: { it: "Vaniglia", en: "Vanilla", emoji: "🌼" },
  pepe: { it: "Pepe", en: "Pepper", emoji: "⚫" },
  curry: { it: "Curry", en: "Curry", emoji: "🟡" },
  zenzero: { it: "Zenzero", en: "Ginger", emoji: "🫚" },
  noce_moscata: { it: "Noce moscata", en: "Nutmeg", emoji: "🟤" },
  chiodi_di_garofano: { it: "Chiodi di garofano", en: "Cloves", emoji: "🌿" },
  paprika: { it: "Paprika", en: "Paprika", emoji: "🌶️" },
  cumino: { it: "Cumino", en: "Cumin", emoji: "🟤" },
  origano: { it: "Origano", en: "Oregano", emoji: "🌿" },
  rosmarino: { it: "Rosmarino", en: "Rosemary", emoji: "🌿" },
  timo: { it: "Timo", en: "Thyme", emoji: "🌿" },
  salvia: { it: "Salvia", en: "Sage", emoji: "🌿" },
  anice: { it: "Anice", en: "Anise", emoji: "🌿" },
  curcuma: { it: "Curcuma", en: "Turmeric", emoji: "🟡" },
  coriandolo: { it: "Coriandolo", en: "Coriander", emoji: "🌿" },
  alloro: { it: "Alloro", en: "Bay leaf", emoji: "🌿" },
  istamina: { it: "Istamina", en: "Histamine", emoji: "🧪" },
  fruttosio: { it: "Fruttosio", en: "Fructose", emoji: "🍬" },
  sorbitolo: { it: "Sorbitolo", en: "Sorbitol", emoji: "🍬" },
  caffeina: { it: "Caffeina", en: "Caffeine", emoji: "☕" },
  alcool: { it: "Alcool", en: "Alcohol", emoji: "🍷" },
  nichel: { it: "Nichel", en: "Nickel", emoji: "⚙️" },
  solanacee: { it: "Solanacee", en: "Nightshades", emoji: "🍆" },
  caseina: { it: "Caseina", en: "Casein", emoji: "🥛" },
  glutammato: { it: "Glutammato", en: "Glutamate", emoji: "🧂" },
  fosfati: { it: "Fosfati alimentari", en: "Food phosphates", emoji: "🧪" },
  nitriti: { it: "Nitriti / nitriti", en: "Nitrates / nitrites", emoji: "🧪" },
  vegano: { it: "Vegano", en: "Vegan", emoji: "🌿" },
  vegetariano: { it: "Vegetariano", en: "Vegetarian", emoji: "🥗" },
  halal: { it: "Halal", en: "Halal", emoji: "☪️" },
  kosher: { it: "Kosher", en: "Kosher", emoji: "✡️" },
  senza_glutine: { it: "Senza glutine", en: "Gluten-free", emoji: "🌾" },
  senza_lattosio: { it: "Senza lattosio", en: "Lactose-free", emoji: "🥛" },
  pescetariano: { it: "Pescetariano", en: "Pescatarian", emoji: "🐟" },
};

// ---------------------------------------------------------------------------
// Allergen section titles
// ---------------------------------------------------------------------------
export const ALLERGEN_SECTIONS: Record<string, { [K in UILang]: string }> = {
  ue: {
    it: "Allergeni obbligatori UE (Reg. 1169/2011)",
    en: "EU mandatory allergens (Reg. 1169/2011)",
    es: "Alérgenos obligatorios UE (Reg. 1169/2011)",
    fr: "Allergènes obligatoires UE (Rég. 1169/2011)",
    de: "Pflichtallergene EU (Verord. 1169/2011)",
    pt: "Alergénios obrigatórios UE (Reg. 1169/2011)",
    ar: "مسببات الحساسية الإلزامية في الاتحاد الأوروبي",
    zh: "欧盟强制过敏原 (法规 1169/2011)",
    ja: "EU必須アレルゲン (規則 1169/2011)",
    ko: "EU 의무 알레르겐 (규정 1169/2011)",
    ru: "Обязательные аллергены ЕС (рег. 1169/2011)",
    tr: "AB Zorunlu Alerjenler (Yönet. 1169/2011)",
    pl: "Obowiązkowe alergeny UE (Rozp. 1169/2011)",
    nl: "Verplichte EU-allergenen (Verord. 1169/2011)",
  },
  frutta_guscio: {
    it: "Frutta a guscio (dettaglio)", en: "Tree nuts (detail)", es: "Frutos secos (detalle)",
    fr: "Fruits à coque (détail)", de: "Schalenfrüchte (Detail)", pt: "Frutos secos (detalhe)",
    ar: "المكسرات (التفاصيل)", zh: "坚果（详情）", ja: "ナッツ類（詳細）",
    ko: "견과류 (상세)", ru: "Орехи (подробно)", tr: "Sert kabuklu meyveler (detay)",
    pl: "Orzechy (szczegóły)", nl: "Noten (detail)",
  },
  frutta: {
    it: "Frutta", en: "Fruit", es: "Fruta", fr: "Fruits", de: "Obst", pt: "Fruta",
    ar: "الفاكهة", zh: "水果", ja: "果物", ko: "과일", ru: "Фрукты", tr: "Meyve", pl: "Owoce", nl: "Fruit",
  },
  verdura: {
    it: "Verdura e ortaggi", en: "Vegetables", es: "Verduras y hortalizas",
    fr: "Légumes", de: "Gemüse", pt: "Legumes e hortaliças",
    ar: "الخضروات", zh: "蔬菜", ja: "野菜", ko: "채소", ru: "Овощи", tr: "Sebzeler", pl: "Warzywa", nl: "Groenten",
  },
  cereali: {
    it: "Cereali e derivati", en: "Cereals & grains", es: "Cereales y derivados",
    fr: "Céréales et dérivés", de: "Getreide & Körner", pt: "Cereais e derivados",
    ar: "الحبوب ومشتقاتها", zh: "谷物及衍生品", ja: "穀物・穀類", ko: "곡류 및 파생물", ru: "Злаки и производные", tr: "Tahıllar ve türevleri", pl: "Zboża i produkty zbożowe", nl: "Granen & graanproducten",
  },
  spezie: {
    it: "Spezie e aromi", en: "Spices & herbs", es: "Especias y hierbas",
    fr: "Épices et aromates", de: "Gewürze & Kräuter", pt: "Especiarias e ervas",
    ar: "التوابل والأعشاب", zh: "香料和草药", ja: "スパイス・ハーブ", ko: "향신료 및 허브", ru: "Специи и травы", tr: "Baharatlar ve otlar", pl: "Przyprawy i zioła", nl: "Specerijen & kruiden",
  },
  intolleranze: {
    it: "Intolleranze alimentari", en: "Food intolerances", es: "Intolerancias alimentarias",
    fr: "Intolérances alimentaires", de: "Lebensmittelunverträglichkeiten", pt: "Intolerâncias alimentares",
    ar: "عدم تحمل الطعام", zh: "食物不耐受", ja: "食物不耐症", ko: "식품 불내증", ru: "Пищевая непереносимость", tr: "Gıda intoleransları", pl: "Nietolerancje pokarmowe", nl: "Voedselintoleranties",
  },
  preferenze: {
    it: "Preferenze alimentari", en: "Dietary preferences", es: "Preferencias alimentarias",
    fr: "Préférences alimentaires", de: "Ernährungsvorlieben", pt: "Preferências alimentares",
    ar: "التفضيلات الغذائية", zh: "饮食偏好", ja: "食事の好み", ko: "식이 선호도", ru: "Пищевые предпочтения", tr: "Diyet tercihleri", pl: "Preferencje żywieniowe", nl: "Voedingsvoorkeuren",
  },
};

const SECTION_ORDER = [
  "ue", "frutta_guscio", "frutta", "verdura", "cereali", "spezie", "intolleranze", "preferenze",
] as const;

export function groupAllergensBySection<T extends { category?: string; sort_order?: number }>(
  allergens: T[],
): { key: string; items: T[] }[] {
  const grouped = new Map<string, T[]>();
  for (const a of allergens) {
    const key = a.category || "ue";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }
  return SECTION_ORDER
    .filter((key) => grouped.has(key))
    .map((key) => ({
      key,
      items: grouped.get(key)!.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));
}

// ---------------------------------------------------------------------------
// UI Strings – fully multilingual
// ---------------------------------------------------------------------------
type UIStringMap = { [K in UILang]: string };

const UI_STRINGS: Record<string, UIStringMap> = {
  safe: {
    it: "SICURO", en: "SAFE", es: "SEGURO", fr: "SÛR", de: "SICHER", pt: "SEGURO",
    ar: "آمن", zh: "安全", ja: "安全", ko: "안전", ru: "БЕЗОПАСНО", tr: "GÜVENLİ", pl: "BEZPIECZNY", nl: "VEILIG",
  },
  warning: {
    it: "ATTENZIONE — possibili tracce", en: "WARNING — possible traces",
    es: "ATENCIÓN — posibles trazas", fr: "ATTENTION — traces possibles",
    de: "ACHTUNG — mögliche Spuren", pt: "ATENÇÃO — possíveis traços",
    ar: "تحذير — آثار محتملة", zh: "警告 — 可能含有痕量", ja: "注意 — 微量含有の可能性",
    ko: "주의 — 미량 포함 가능", ru: "ВНИМАНИЕ — возможные следы", tr: "UYARI — olası izler",
    pl: "UWAGA — możliwe ślady", nl: "WAARSCHUWING — mogelijke sporen",
  },
  danger: {
    it: "NON IDONEO", en: "NOT ELIGIBLE", es: "NO APTO", fr: "NON AUTORISÉ",
    de: "NICHT GEEIGNET", pt: "NÃO ADEQUADO",
    ar: "غير مناسب", zh: "不适合", ja: "不適合", ko: "부적합", ru: "НЕ ПОДХОДИТ", tr: "UYGUN DEĞİL",
    pl: "NIEODPOWIEDNI", nl: "NIET GESCHIKT",
  },
  contains: {
    it: "Contiene: ", en: "Contains: ", es: "Contiene: ", fr: "Contient : ",
    de: "Enthält: ", pt: "Contém: ",
    ar: "يحتوي على: ", zh: "含有：", ja: "含む：", ko: "포함：", ru: "Содержит: ", tr: "İçerir: ",
    pl: "Zawiera: ", nl: "Bevat: ",
  },
  traces: {
    it: "Tracce di: ", en: "Traces of: ", es: "Trazas de: ", fr: "Traces de : ",
    de: "Spuren von: ", pt: "Traços de: ",
    ar: "آثار من: ", zh: "痕量：", ja: "微量：", ko: "미량：", ru: "Следы: ", tr: "İzi var: ",
    pl: "Ślady: ", nl: "Sporen van: ",
  },
  diet_incompatible: {
    it: "Incompatibile con: ", en: "Incompatible with: ", es: "Incompatible con: ",
    fr: "Incompatible avec : ", de: "Inkompatibel mit: ", pt: "Incompatível com: ",
    ar: "غير متوافق مع: ", zh: "与……不相容：", ja: "非対応：", ko: "비호환：", ru: "Несовместимо с: ", tr: "Uyumsuz: ",
    pl: "Niezgodny z: ", nl: "Niet compatibel met: ",
  },
  excluded_ingredient: {
    it: "Contiene ingrediente escluso: ", en: "Contains excluded ingredient: ",
    es: "Contiene ingrediente excluido: ", fr: "Contient ingrédient exclu : ",
    de: "Enthält ausgeschlossene Zutat: ", pt: "Contém ingrediente excluído: ",
    ar: "يحتوي على مكون مستبعد: ", zh: "含有排除食材：", ja: "除外食材を含む：", ko: "제외 재료 포함：",
    ru: "Содержит исключённый ингредиент: ", tr: "Hariç tutulan madde içeriyor: ",
    pl: "Zawiera wykluczone składniki: ", nl: "Bevat uitgesloten ingrediënt: ",
  },
  custom_ingredients_label: {
    it: "INGREDIENTI DA EVITARE", en: "INGREDIENTS TO AVOID", es: "INGREDIENTES A EVITAR",
    fr: "INGRÉDIENTS À ÉVITER", de: "ZU MEIDENDE ZUTATEN", pt: "INGREDIENTES A EVITAR",
    ar: "المكونات التي يجب تجنبها", zh: "需要避免的食材", ja: "避けるべき食材", ko: "피해야 할 재료",
    ru: "ИНГРЕДИЕНТЫ ДЛЯ ИСКЛЮЧЕНИЯ", tr: "KAÇINILACAK MALZEMELER", pl: "SKŁADNIKI DO UNIKANIA", nl: "TE VERMIJDEN INGREDIËNTEN",
  },
  custom_ingredients_sub: {
    it: "Digita ingredienti specifici (es. cipolla, aglio) separati da virgola",
    en: "Type specific ingredients (e.g. onion, garlic) separated by comma",
    es: "Escribe ingredientes específicos (p. ej. cebolla, ajo) separados por coma",
    fr: "Saisir des ingrédients spécifiques (ex. oignon, ail) séparés par une virgule",
    de: "Bestimmte Zutaten eingeben (z.B. Zwiebel, Knoblauch), kommagetrennt",
    pt: "Escreva ingredientes específicos (ex. cebola, alho) separados por vírgula",
    ar: "أدخل المكونات المحددة (مثال: بصل، ثوم) مفصولة بفاصلة",
    zh: "输入特定食材（例如洋葱、大蒜），用逗号分隔",
    ja: "特定の食材を入力してください（例：玉ねぎ、にんにく）、カンマ区切り",
    ko: "특정 재료를 쉼표로 구분하여 입력하세요 (예: 양파, 마늘)",
    ru: "Введите конкретные ингредиенты (напр. лук, чеснок), разделённые запятой",
    tr: "Belirli malzemeleri virgülle ayırarak yazın (örn. soğan, sarımsak)",
    pl: "Wpisz konkretne składniki (np. cebula, czosnek) oddzielone przecinkiem",
    nl: "Typ specifieke ingrediënten (bijv. ui, knoflook) gescheiden door komma",
  },
  reminder: {
    it: "⚠️ Avvisa sempre il personale delle tue allergie.",
    en: "⚠️ Always inform staff about your allergies.",
    es: "⚠️ Siempre informa al personal sobre tus alergias.",
    fr: "⚠️ Informez toujours le personnel de vos allergies.",
    de: "⚠️ Informiere das Personal immer über deine Allergien.",
    pt: "⚠️ Informe sempre o pessoal sobre as suas alergias.",
    ar: "⚠️ أعلم الموظفين دائمًا بحساسيتك الغذائية.",
    zh: "⚠️ 请始终告知工作人员您的过敏信息。",
    ja: "⚠️ 必ずスタッフにアレルギーを伝えてください。",
    ko: "⚠️ 항상 직원에게 알레르기를 알려주세요.",
    ru: "⚠️ Всегда сообщайте персоналу о своей аллергии.",
    tr: "⚠️ Personeli alerjenleriniz hakkında her zaman bilgilendirin.",
    pl: "⚠️ Zawsze informuj personel o swoich alergiach.",
    nl: "⚠️ Informeer het personeel altijd over uw allergieën.",
  },
  all: {
    it: "Tutti", en: "All", es: "Todos", fr: "Tous", de: "Alle", pt: "Todos",
    ar: "الكل", zh: "全部", ja: "すべて", ko: "전체", ru: "Все", tr: "Tümü", pl: "Wszystkie", nl: "Alle",
  },
  yes: {
    it: "Sì", en: "Yes", es: "Sí", fr: "Oui", de: "Ja", pt: "Sim",
    ar: "نعم", zh: "是", ja: "はい", ko: "예", ru: "Да", tr: "Evet", pl: "Tak", nl: "Ja",
  },
  no: {
    it: "No", en: "No", es: "No", fr: "Non", de: "Nein", pt: "Não",
    ar: "لا", zh: "否", ja: "いいえ", ko: "아니오", ru: "Нет", tr: "Hayır", pl: "Nie", nl: "Nee",
  },
  empty_menu: {
    it: "Questo locale non ha ancora pubblicato il menù.",
    en: "This place has not published its menu yet.",
    es: "Este local aún no ha publicado su menú.",
    fr: "Ce restaurant n'a pas encore publié son menu.",
    de: "Dieses Lokal hat noch keine Speisekarte veröffentlicht.",
    pt: "Este local ainda não publicou o menu.",
    ar: "لم يقم هذا المكان بنشر قائمة طعامه بعد.",
    zh: "该餐厅尚未发布菜单。",
    ja: "このお店はまだメニューを公開していません。",
    ko: "이 음식점은 아직 메뉴를 게시하지 않았습니다.",
    ru: "Это заведение ещё не опубликовало меню.",
    tr: "Bu mekan henüz menüsünü yayınlamadı.",
    pl: "To miejsce nie opublikowało jeszcze menu.",
    nl: "Dit restaurant heeft zijn menu nog niet gepubliceerd.",
  },
  offline_warning: {
    it: "⚡ Connessione assente. Visualizzazione copia offline del menù.",
    en: "⚡ No connection. Viewing offline menu copy.",
    es: "⚡ Sin conexión. Mostrando copia del menú sin conexión.",
    fr: "⚡ Pas de connexion. Affichage du menu hors ligne.",
    de: "⚡ Keine Verbindung. Offline-Kopie des Menüs.",
    pt: "⚡ Sem conexão. Exibindo cópia offline do menu.",
    ar: "⚡ لا يوجد اتصال. عرض نسخة غير متصلة من القائمة.",
    zh: "⚡ 无连接，显示离线菜单副本。",
    ja: "⚡ 接続なし。オフラインメニューを表示中。",
    ko: "⚡ 연결 없음. 오프라인 메뉴를 표시합니다.",
    ru: "⚡ Нет связи. Показывается офлайн-копия меню.",
    tr: "⚡ Bağlantı yok. Çevrimdışı menü kopyası gösteriliyor.",
    pl: "⚡ Brak połączenia. Wyświetlanie kopii menu offline.",
    nl: "⚡ Geen verbinding. Offline menukopie wordt weergegeven.",
  },
  compatible: {
    it: "Compatibile", en: "Compatible", es: "Compatible", fr: "Compatible",
    de: "Kompatibel", pt: "Compatível",
    ar: "متوافق", zh: "兼容", ja: "対応", ko: "호환", ru: "Совместимо", tr: "Uyumlu",
    pl: "Zgodny", nl: "Compatibel",
  },
  safe_dishes: {
    it: "sicuri", en: "safe", es: "seguros", fr: "sûrs", de: "sicher", pt: "seguros",
    ar: "آمن", zh: "安全", ja: "安全", ko: "안전", ru: "безопасных", tr: "güvenli",
    pl: "bezpiecznych", nl: "veilig",
  },
  traces_dishes: {
    it: "tracce", en: "traces", es: "trazas", fr: "traces", de: "Spuren", pt: "traços",
    ar: "آثار", zh: "痕量", ja: "微量", ko: "미량", ru: "следы", tr: "izler",
    pl: "ślady", nl: "sporen",
  },
  avoid_dishes: {
    it: "da evitare", en: "avoid", es: "evitar", fr: "éviter", de: "meiden", pt: "evitar",
    ar: "تجنب", zh: "避免", ja: "避ける", ko: "피하기", ru: "избегать", tr: "kaçının",
    pl: "unikać", nl: "vermijden",
  },
  other: {
    it: "Altro", en: "Other", es: "Otro", fr: "Autre", de: "Sonstiges", pt: "Outro",
    ar: "أخرى", zh: "其他", ja: "その他", ko: "기타", ru: "Другое", tr: "Diğer",
    pl: "Inne", nl: "Overige",
  },
  reviews: {
    it: "Recensioni", en: "Reviews", es: "Reseñas", fr: "Avis", de: "Bewertungen", pt: "Avaliações",
    ar: "مراجعات", zh: "评论", ja: "レビュー", ko: "리뷰", ru: "Отзывы", tr: "Yorumlar",
    pl: "Opinie", nl: "Beoordelingen",
  },
  you: {
    it: " (tu)", en: " (you)", es: " (tú)", fr: " (vous)", de: " (Sie)", pt: " (você)",
    ar: " (أنت)", zh: "（你）", ja: "（あなた）", ko: " (당신)", ru: " (вы)", tr: " (siz)",
    pl: " (ty)", nl: " (jij)",
  },
  restaurant_reply: {
    it: "Risposta del locale", en: "Reply from the restaurant", es: "Respuesta del local",
    fr: "Réponse du restaurant", de: "Antwort des Restaurants", pt: "Resposta do restaurante",
    ar: "رد المطعم", zh: "餐厅回复", ja: "お店の返信", ko: "레스토랑 답글",
    ru: "Ответ ресторана", tr: "Restoranın yanıtı", pl: "Odpowiedź lokalu", nl: "Reactie van het restaurant",
  },
  no_reviews: {
    it: "Ancora nessuna recensione per questo locale.",
    en: "No reviews yet for this place.",
    es: "Aún no hay reseñas para este lugar.",
    fr: "Aucun avis pour ce restaurant pour l'instant.",
    de: "Noch keine Bewertungen für dieses Lokal.",
    pt: "Ainda sem avaliações para este local.",
    ar: "لا توجد مراجعات بعد لهذا المكان.",
    zh: "该餐厅暂无评论。", ja: "このお店のレビューはまだありません。",
    ko: "이 음식점에 아직 리뷰가 없습니다.", ru: "Пока нет отзывов для этого заведения.",
    tr: "Bu mekan için henüz yorum yok.", pl: "Brak opinii dla tego miejsca.", nl: "Nog geen beoordelingen voor deze plek.",
  },
  be_first_review: {
    it: "Sii il primo a condividere la tua esperienza!",
    en: "Be the first to share your experience!",
    es: "¡Sé el primero en compartir tu experiencia!",
    fr: "Soyez le premier à partager votre expérience !",
    de: "Sei der Erste, der seine Erfahrungen teilt!",
    pt: "Seja o primeiro a partilhar a sua experiência!",
    ar: "كن أول من يشارك تجربته!",
    zh: "成为第一个分享体验的人！", ja: "最初の体験を共有しましょう！",
    ko: "첫 번째로 경험을 공유해 보세요!",
    ru: "Будьте первым, кто поделится опытом!", tr: "Deneyiminizi paylaşan ilk kişi olun!",
    pl: "Bądź pierwszym, który podzieli się swoim doświadczeniem!", nl: "Wees de eerste die zijn ervaring deelt!",
  },
  your_review: {
    it: "La tua recensione", en: "Your review", es: "Tu reseña", fr: "Votre avis",
    de: "Deine Bewertung", pt: "A sua avaliação",
    ar: "تقييمك", zh: "你的评价", ja: "あなたのレビュー", ko: "내 리뷰",
    ru: "Ваш отзыв", tr: "Yorumunuz", pl: "Twoja opinia", nl: "Uw beoordeling",
  },
  review_help: {
    it: "Aiuta altri utenti con allergie a scegliere questo locale",
    en: "Help other users with allergies choose this place",
    es: "Ayuda a otros usuarios con alergias a elegir este lugar",
    fr: "Aidez d'autres utilisateurs allergiques à choisir ce restaurant",
    de: "Hilf anderen Nutzern mit Allergien, dieses Lokal zu wählen",
    pt: "Ajude outros utilizadores com alergias a escolher este local",
    ar: "ساعد مستخدمين آخرين يعانون من الحساسية على اختيار هذا المكان",
    zh: "帮助其他过敏用户选择这家餐厅",
    ja: "アレルギーをお持ちの他のユーザーがこのお店を選ぶのをお手伝いください",
    ko: "알레르기 있는 다른 사용자들이 이 곳을 선택하는 데 도움을 주세요",
    ru: "Помогите другим пользователям с аллергией выбрать это заведение",
    tr: "Alerjisi olan diğer kullanıcıların bu mekanı seçmesine yardımcı olun",
    pl: "Pomóż innym użytkownikom z alergiami wybrać to miejsce",
    nl: "Help andere gebruikers met allergieën dit restaurant te kiezen",
  },
  review_placeholder: {
    it: "Il locale è stato attento alle tue allergie? Racconta la tua esperienza...",
    en: "Was the restaurant careful about your allergies? Share your experience...",
    es: "¿El local atendió tus alergias? Comparte tu experiencia...",
    fr: "Le restaurant a-t-il respecté vos allergies ? Partagez votre expérience...",
    de: "War das Lokal auf deine Allergien aufmerksam? Teile deine Erfahrung...",
    pt: "O local foi atento às suas alergias? Partilhe a sua experiência...",
    ar: "هل كان المطعم حذرًا بشأن حساسيتك؟ شاركنا تجربتك...",
    zh: "餐厅是否注意了您的过敏情况？分享您的体验...",
    ja: "お店はアレルギーに気を配ってくれましたか？体験を教えてください…",
    ko: "레스토랑이 알레르기에 주의했나요? 경험을 공유해 주세요...",
    ru: "Было ли заведение внимательным к вашей аллергии? Поделитесь опытом...",
    tr: "Mekan alerjenlerinize dikkat etti mi? Deneyiminizi paylaşın...",
    pl: "Czy lokal dbał o twoje alergie? Podziel się swoim doświadczeniem...",
    nl: "Was het restaurant voorzichtig met uw allergieën? Deel uw ervaring...",
  },
  publish_review: {
    it: "📝 Pubblica recensione", en: "📝 Publish review", es: "📝 Publicar reseña",
    fr: "📝 Publier l'avis", de: "📝 Bewertung veröffentlichen", pt: "📝 Publicar avaliação",
    ar: "📝 نشر المراجعة", zh: "📝 发布评价", ja: "📝 レビューを投稿", ko: "📝 리뷰 게시",
    ru: "📝 Опубликовать отзыв", tr: "📝 Yorumu yayınla", pl: "📝 Opublikuj opinię", nl: "📝 Beoordeling plaatsen",
  },
  thank_you: {
    it: "Grazie!", en: "Thank you!", es: "¡Gracias!", fr: "Merci !",
    de: "Danke!", pt: "Obrigado!",
    ar: "شكرًا!", zh: "谢谢！", ja: "ありがとうございます！", ko: "감사합니다!",
    ru: "Спасибо!", tr: "Teşekkürler!", pl: "Dziękujemy!", nl: "Dank u!",
  },
  review_published: {
    it: "La tua recensione è stata pubblicata.",
    en: "Your review has been published.",
    es: "Tu reseña ha sido publicada.",
    fr: "Votre avis a été publié.",
    de: "Deine Bewertung wurde veröffentlicht.",
    pt: "A sua avaliação foi publicada.",
    ar: "تم نشر مراجعتك.",
    zh: "您的评价已发布。", ja: "レビューが投稿されました。", ko: "리뷰가 게시되었습니다.",
    ru: "Ваш отзыв опубликован.", tr: "Yorumunuz yayınlandı.", pl: "Twoja opinia została opublikowana.", nl: "Uw beoordeling is gepubliceerd.",
  },
  error: {
    it: "Errore", en: "Error", es: "Error", fr: "Erreur", de: "Fehler", pt: "Erro",
    ar: "خطأ", zh: "错误", ja: "エラー", ko: "오류", ru: "Ошибка", tr: "Hata", pl: "Błąd", nl: "Fout",
  },
  saved: {
    it: "Salvato", en: "Saved", es: "Guardado", fr: "Enregistré", de: "Gespeichert", pt: "Guardado",
    ar: "تم الحفظ", zh: "已保存", ja: "保存済み", ko: "저장됨", ru: "Сохранено", tr: "Kaydedildi", pl: "Zapisano", nl: "Opgeslagen",
  },
  logout_title: {
    it: "Esci dall'account", en: "Logout", es: "Cerrar sesión", fr: "Se déconnecter",
    de: "Abmelden", pt: "Sair da conta",
    ar: "تسجيل الخروج", zh: "退出账户", ja: "ログアウト", ko: "로그아웃",
    ru: "Выйти", tr: "Çıkış yap", pl: "Wyloguj się", nl: "Uitloggen",
  },
  logout_confirm: {
    it: "Vuoi davvero uscire?", en: "Are you sure you want to logout?",
    es: "¿Seguro que quieres cerrar sesión?", fr: "Voulez-vous vraiment vous déconnecter ?",
    de: "Möchtest du dich wirklich abmelden?", pt: "Tem certeza que deseja sair?",
    ar: "هل أنت متأكد أنك تريد تسجيل الخروج؟", zh: "确定要退出账户吗？",
    ja: "ログアウトしてもよろしいですか？", ko: "정말 로그아웃하시겠습니까?",
    ru: "Вы уверены, что хотите выйти?", tr: "Çıkış yapmak istediğinizden emin misiniz?",
    pl: "Czy na pewno chcesz się wylogować?", nl: "Weet u zeker dat u wilt uitloggen?",
  },
  cancel: {
    it: "Annulla", en: "Cancel", es: "Cancelar", fr: "Annuler", de: "Abbrechen", pt: "Cancelar",
    ar: "إلغاء", zh: "取消", ja: "キャンセル", ko: "취소", ru: "Отмена", tr: "İptal", pl: "Anuluj", nl: "Annuleren",
  },
  logout_btn: {
    it: "Esci", en: "Logout", es: "Salir", fr: "Déconnexion", de: "Abmelden", pt: "Sair",
    ar: "خروج", zh: "退出", ja: "ログアウト", ko: "로그아웃", ru: "Выйти", tr: "Çıkış", pl: "Wyloguj", nl: "Uitloggen",
  },
  emergency_saved: {
    it: "Le informazioni di emergenza sono state aggiornate.",
    en: "Emergency information has been updated.",
    es: "La información de emergencia ha sido actualizada.",
    fr: "Les informations d'urgence ont été mises à jour.",
    de: "Die Notfallinformationen wurden aktualisiert.",
    pt: "As informações de emergência foram atualizadas.",
    ar: "تم تحديث معلومات الطوارئ.",
    zh: "紧急信息已更新。", ja: "緊急情報が更新されました。", ko: "응급 정보가 업데이트되었습니다.",
    ru: "Данные экстренной помощи обновлены.", tr: "Acil bilgiler güncellendi.",
    pl: "Informacje awaryjne zostały zaktualizowane.", nl: "Noodinformatie is bijgewerkt.",
  },
  contact_saved: {
    it: "Il contatto di emergenza è stato aggiornato.",
    en: "Emergency contact has been updated.",
    es: "El contacto de emergencia ha sido actualizado.",
    fr: "Le contact d'urgence a été mis à jour.",
    de: "Der Notfallkontakt wurde aktualisiert.",
    pt: "O contacto de emergência foi atualizado.",
    ar: "تم تحديث جهة الاتصال في حالات الطوارئ.",
    zh: "紧急联系人已更新。", ja: "緊急連絡先が更新されました。", ko: "긴급 연락처가 업데이트되었습니다.",
    ru: "Контакт для экстренных случаев обновлён.", tr: "Acil iletişim güncellendi.",
    pl: "Kontakt alarmowy został zaktualizowany.", nl: "Noodcontact is bijgewerkt.",
  },
  // Emergency screen
  emergency_title: {
    it: "Emergenza Medica", en: "Medical Emergency", es: "Emergencia Médica",
    fr: "Urgence Médicale", de: "Medizinischer Notfall", pt: "Emergência Médica",
    ar: "طوارئ طبية", zh: "医疗紧急情况", ja: "医療緊急事態", ko: "의료 응급 상황",
    ru: "Медицинская помощь", tr: "Tıbbi Acil Durum", pl: "Nagłe przypadki medyczne", nl: "Medische noodsituatie",
  },
  emergency_banner: {
    it: "SCHERMATA SALVAVITA", en: "LIFESAVING INFO", es: "INFORMACIÓN VITAL",
    fr: "INFOS VITALES", de: "LEBENSRETTENDE INFO", pt: "INFO VITAL",
    ar: "معلومات منقذة للحياة", zh: "生命救援信息", ja: "救命情報", ko: "생명 구조 정보",
    ru: "ЖИЗНЕННО ВАЖНАЯ ИНФОРМАЦИЯ", tr: "HAYAT KURTARAN BİLGİ", pl: "INFORMACJE RATUJĄCE ŻYCIE", nl: "LEVENSREDDENDE INFO",
  },
  emergency_show: {
    it: "Mostra questa schermata al personale medico o a chi ti presta soccorso",
    en: "Show this screen to medical staff or first responders",
    es: "Muestra esta pantalla al personal médico o a quien te auxilie",
    fr: "Montrez cet écran au personnel médical ou aux secouristes",
    de: "Zeige diesen Bildschirm dem medizinischen Personal oder Ersthelfern",
    pt: "Mostre este ecrã ao pessoal médico ou a quem lhe presta socorro",
    ar: "أرِ هذه الشاشة للطاقم الطبي أو للمسعفين",
    zh: "请将此屏幕展示给医疗人员或急救人员",
    ja: "この画面を医療スタッフや救助者に見せてください",
    ko: "이 화면을 의료진 또는 구조대원에게 보여주세요",
    ru: "Покажите этот экран медицинскому персоналу или спасателям",
    tr: "Bu ekranı sağlık personeline veya müdahale ekibine gösterin",
    pl: "Pokaż ten ekran personelowi medycznemu lub ratownikom",
    nl: "Toon dit scherm aan medisch personeel of hulpverleners",
  },
  allergies_section: {
    it: "🛡️ ALLERGIE E INTOLLERANZE:", en: "🛡️ ALLERGIES & INTOLERANCES:",
    es: "🛡️ ALERGIAS E INTOLERANCIAS:", fr: "🛡️ ALLERGIES & INTOLÉRANCES:",
    de: "🛡️ ALLERGIEN & UNVERTRÄGLICHKEITEN:", pt: "🛡️ ALERGIAS E INTOLERÂNCIAS:",
    ar: ":🛡️ الحساسية وعدم التحمل", zh: "🛡️ 过敏与不耐受：", ja: "🛡️ アレルギー＆不耐症：", ko: "🛡️ 알레르기 및 불내증：",
    ru: "🛡️ АЛЛЕРГИИ И НЕПЕРЕНОСИМОСТЬ:", tr: "🛡️ ALERJİLER VE DUYARLILIKLAR:", pl: "🛡️ ALERGIE I NIETOLERANCJE:", nl: "🛡️ ALLERGIEËN & INTOLERANTIES:",
  },
  no_allergies: {
    it: "Nessuna allergia selezionata nel profilo.", en: "No allergies selected in profile.",
    es: "Ninguna alergia seleccionada en el perfil.", fr: "Aucune allergie sélectionnée dans le profil.",
    de: "Keine Allergien im Profil ausgewählt.", pt: "Nenhuma alergia selecionada no perfil.",
    ar: "لم يتم تحديد أي حساسية في الملف الشخصي.", zh: "个人资料中未选择过敏项。",
    ja: "プロフィールにアレルギーが選択されていません。", ko: "프로필에 알레르기가 선택되지 않았습니다.",
    ru: "В профиле не выбрано ни одного аллергена.", tr: "Profilde hiç alerji seçilmedi.",
    pl: "Nie wybrano żadnych alergii w profilu.", nl: "Geen allergieën geselecteerd in profiel.",
  },
  emergency_drugs_section: {
    it: "💊 FARMACI SALVAVITA ASSOCIATI:", en: "💊 PERSONAL EMERGENCY DRUGS:",
    es: "💊 MEDICAMENTOS DE EMERGENCIA:", fr: "💊 MÉDICAMENTS D'URGENCE:",
    de: "💊 NOTFALLMEDIKAMENTE:", pt: "💊 MEDICAMENTOS DE EMERGÊNCIA:",
    ar: ":💊 أدوية الطوارئ الشخصية", zh: "💊 个人应急药物：", ja: "💊 緊急薬品：", ko: "💊 긴급 의약품：",
    ru: "💊 ЭКСТРЕННЫЕ ПРЕПАРАТЫ:", tr: "💊 ACİL KİŞİSEL İLAÇLAR:", pl: "💊 LEKI RATUNKOWE:", nl: "💊 PERSOONLIJKE NOODMEDICIJNEN:",
  },
  no_drugs: {
    it: "Nessun farmaco dichiarato", en: "No emergency drugs declared",
    es: "Ningún medicamento declarado", fr: "Aucun médicament d'urgence déclaré",
    de: "Keine Notfallmedikamente angegeben", pt: "Nenhum medicamento de emergência declarado",
    ar: "لا توجد أدوية طوارئ معلنة", zh: "未声明紧急药物", ja: "緊急薬品なし", ko: "응급 약물 없음",
    ru: "Экстренных препаратов не указано", tr: "Acil ilaç belirtilmedi",
    pl: "Brak zadeklarowanych leków ratunkowych", nl: "Geen noodmedicijnen opgegeven",
  },
  drug_warning: {
    it: "⚠️ Se necessario, autosomministra immediatamente il farmaco (es. adrenalina autoiniettabile).",
    en: "⚠️ If needed, immediately self-administer the medication (e.g. epinephrine autoinjector).",
    es: "⚠️ Si es necesario, autoadministra el medicamento (p. ej. autoinyector de adrenalina).",
    fr: "⚠️ Si nécessaire, administrez-vous immédiatement le médicament (ex. auto-injecteur d'adrénaline).",
    de: "⚠️ Bei Bedarf sofort selbst das Medikament verabreichen (z.B. Adrenalin-Autoinjektor).",
    pt: "⚠️ Se necessário, autoadministre imediatamente o medicamento (ex. injetor de adrenalina).",
    ar: "⚠️ إذا لزم الأمر، قم بحقن الدواء فورًا (مثل حقنة الأدرينالين).",
    zh: "⚠️ 如有必要，请立即自行注射药物（如肾上腺素自动注射笔）。",
    ja: "⚠️ 必要に応じて、すぐに薬を自己投与してください（例：エピペン）。",
    ko: "⚠️ 필요 시 즉시 약물을 자가투여하세요 (예: 에피네프린 자동 주사기).",
    ru: "⚠️ При необходимости немедленно самостоятельно введите препарат (напр. автоинъектор адреналина).",
    tr: "⚠️ Gerekirse ilacı hemen kendinize uygulayın (örn. adrenalin oto-enjektörü).",
    pl: "⚠️ W razie potrzeby natychmiast podaj sobie lek (np. autostrzykawkę z adrenaliną).",
    nl: "⚠️ Indien nodig, dien het medicament onmiddellijk zelf toe (bijv. adrenaline-auto-injector).",
  },
  call_contact: {
    it: "CHIAMA", en: "CALL", es: "LLAMAR A", fr: "APPELER", de: "ANRUFEN", pt: "LIGAR PARA",
    ar: "اتصل بـ", zh: "致电", ja: "電話", ko: "전화", ru: "ПОЗВОНИТЬ", tr: "ARA", pl: "ZADZWOŃ DO", nl: "BEL",
  },
  call_emergency: {
    it: "CHIAMA SOCCORSI (112)", en: "CALL EMERGENCY SERVICES (112)",
    es: "LLAMAR EMERGENCIAS (112)", fr: "APPELER LES SECOURS (112)",
    de: "NOTFALLDIENST ANRUFEN (112)", pt: "LIGAR PARA EMERGÊNCIAS (112)",
    ar: "اتصل بالطوارئ (112)", zh: "拨打急救电话 (112)", ja: "緊急サービスを呼ぶ (112)", ko: "응급 서비스 호출 (112)",
    ru: "ВЫЗВАТЬ ЭКСТРЕННЫЕ СЛУЖБЫ (112)", tr: "ACİL SERVİSİ ARA (112)", pl: "WEZWIJ POMOC (112)", nl: "NOODNUMMER BELLEN (112)",
  },
  call_emergency_sub: {
    it: "Avvia chiamata telefonica di emergenza", en: "Start emergency phone call",
    es: "Iniciar llamada de emergencia", fr: "Passer un appel d'urgence",
    de: "Notfallanruf starten", pt: "Iniciar chamada de emergência",
    ar: "إجراء مكالمة طارئة", zh: "拨打紧急电话", ja: "緊急電話をかける", ko: "긴급 전화 걸기",
    ru: "Начать экстренный звонок", tr: "Acil çağrı başlat", pl: "Zainicjuj połączenie alarmowe", nl: "Start noodoproep",
  },
  send_sos: {
    it: "INVIA SMS DI SOS", en: "SEND SOS TEXT MESSAGE", es: "ENVIAR SMS DE SOS",
    fr: "ENVOYER SMS SOS", de: "SOS-SMS SENDEN", pt: "ENVIAR SMS DE SOS",
    ar: "إرسال رسالة SOS", zh: "发送SOS短信", ja: "SOSメッセージを送る", ko: "SOS 문자 보내기",
    ru: "ОТПРАВИТЬ SOS СМС", tr: "SOS SMS GÖNDER", pl: "WYŚLIJ SMS SOS", nl: "SOS SMS VERZENDEN",
  },
  send_sos_sub: {
    it: "Invia SMS di aiuto con la lista delle tue allergie",
    en: "Send help text with your active allergy list",
    es: "Enviar SMS de ayuda con tu lista de alergias",
    fr: "Envoyer un SMS avec votre liste d'allergies",
    de: "Hilfs-SMS mit deiner Allergenliste senden",
    pt: "Enviar SMS de ajuda com a sua lista de alergias",
    ar: "إرسال رسالة مساعدة مع قائمة الحساسية الخاصة بك",
    zh: "发送包含过敏信息的求助短信", ja: "アレルギーリスト付きSOSメッセージを送る",
    ko: "알레르기 목록이 포함된 도움 문자 보내기",
    ru: "Отправить SMS помощи со списком аллергенов", tr: "Alerji listenizle SOS SMS gönderin",
    pl: "Wyślij SMS z pomocą i listą swoich alergii", nl: "Stuur hulp-SMS met uw allergielijst",
  },
  close_back: {
    it: "Chiudi e Torna Indietro", en: "Close and Go Back", es: "Cerrar y volver",
    fr: "Fermer et retour", de: "Schließen und zurück", pt: "Fechar e voltar",
    ar: "إغلاق والعودة", zh: "关闭并返回", ja: "閉じて戻る", ko: "닫고 돌아가기",
    ru: "Закрыть и вернуться", tr: "Kapat ve geri dön", pl: "Zamknij i wróć", nl: "Sluiten en terug",
  },
  none_declared: {
    it: "Nessuno dichiarato", en: "None declared", es: "Ninguno declarado",
    fr: "Aucun déclaré", de: "Nicht angegeben", pt: "Nenhum declarado",
    ar: "لم يُعلن أي شيء", zh: "未声明", ja: "未申告", ko: "선언 없음",
    ru: "Не указано", tr: "Belirtilmedi", pl: "Nie zadeklarowano", nl: "Geen opgegeven",
  },
  sos_message_prefix: {
    it: "AllerTgy SOS! Sto avendo una reazione allergica grave. Allergie:",
    en: "AllerTgy SOS! I am having a severe allergic reaction. Allergies:",
    es: "AllerTgy SOS! Estoy teniendo una reacción alérgica grave. Alergias:",
    fr: "AllerTgy SOS! Je fais une réaction allergique grave. Allergies :",
    de: "AllerTgy SOS! Ich habe eine schwere allergische Reaktion. Allergien:",
    pt: "AllerTgy SOS! Estou tendo uma reação alérgica grave. Alergias:",
    ar: "AllerTgy SOS! أعاني من رد فعل تحسسي حاد. الحساسية:",
    zh: "AllerTgy SOS! 我正在发生严重的过敏反应。过敏原：",
    ja: "AllerTgy SOS! 重篤なアレルギー反応が起きています。アレルゲン：",
    ko: "AllerTgy SOS! 심각한 알레르기 반응이 있습니다. 알레르기：",
    ru: "AllerTgy SOS! У меня тяжёлая аллергическая реакция. Аллергены:",
    tr: "AllerTgy SOS! Şiddetli bir alerjik reaksiyon geçiriyorum. Alerjenler:",
    pl: "AllerTgy SOS! Mam ciężką reakcję alergiczną. Alergie:",
    nl: "AllerTgy SOS! Ik heb een ernstige allergische reactie. Allergenen:",
  },
  sos_medicines_label: {
    it: "Farmaci salvavita:", en: "Emergency medicines:", es: "Medicamentos de emergencia:",
    fr: "Médicaments d'urgence :", de: "Notfallmedikamente:", pt: "Medicamentos de emergência:",
    ar: ":أدوية الطوارئ", zh: "急救药物：", ja: "緊急薬：", ko: "응급 의약품：",
    ru: "Экстренные препараты:", tr: "Acil ilaçlar:", pl: "Leki ratunkowe:", nl: "Noodmedicijnen:",
  },
};

// ---------------------------------------------------------------------------
// Public translation function
// ---------------------------------------------------------------------------
export function t(key: keyof typeof UI_STRINGS, lang: string | null | undefined): string {
  const uiLang = getLang(lang);
  const entry = UI_STRINGS[key];
  if (!entry) return key;
  return entry[uiLang] ?? entry.en ?? key;
}

// ---------------------------------------------------------------------------
// Summary text helper
// ---------------------------------------------------------------------------
export function tSummary(lang: string | null | undefined, verde: number, giallo: number, rosso: number): string {
  const uiLang = getLang(lang);
  const summaries: Record<UILang, (v: number, g: number, r: number) => string> = {
    it: (v, g, r) => `In base al tuo profilo: ${v} piatti sicuri, ${g} con possibili tracce, ${r} da evitare.`,
    en: (v, g, r) => `Based on your profile: ${v} safe dishes, ${g} with possible traces, ${r} to avoid.`,
    es: (v, g, r) => `Según tu perfil: ${v} platos seguros, ${g} con posibles trazas, ${r} a evitar.`,
    fr: (v, g, r) => `Selon votre profil : ${v} plats sûrs, ${g} avec traces possibles, ${r} à éviter.`,
    de: (v, g, r) => `Basierend auf deinem Profil: ${v} sichere Gerichte, ${g} mit möglichen Spuren, ${r} zu meiden.`,
    pt: (v, g, r) => `Com base no seu perfil: ${v} pratos seguros, ${g} com possíveis traços, ${r} a evitar.`,
    ar: (v, g, r) => `بناءً على ملفك: ${v} أطباق آمنة، ${g} مع آثار محتملة، ${r} تجنّبها.`,
    zh: (v, g, r) => `根据您的资料：${v} 道安全菜，${g} 道可能含痕量，${r} 道需避免。`,
    ja: (v, g, r) => `プロフィールに基づく：安全${v}品、微量含有${g}品、避ける${r}品。`,
    ko: (v, g, r) => `프로필 기준: 안전 ${v}개, 미량 포함 ${g}개, 피해야 할 ${r}개.`,
    ru: (v, g, r) => `По вашему профилю: ${v} безопасных блюд, ${g} с возможными следами, ${r} следует избегать.`,
    tr: (v, g, r) => `Profilinize göre: ${v} güvenli yemek, ${g} olası izler, ${r} kaçınılacak.`,
    pl: (v, g, r) => `Na podstawie Twojego profilu: ${v} bezpiecznych dań, ${g} z możliwymi śladami, ${r} do unikania.`,
    nl: (v, g, r) => `Op basis van uw profiel: ${v} veilige gerechten, ${g} met mogelijke sporen, ${r} te vermijden.`,
  };
  return summaries[uiLang](verde, giallo, rosso);
}

// ---------------------------------------------------------------------------
// Section label for green/yellow/red sections in the menu
// ---------------------------------------------------------------------------
const SECTION_STRINGS: Record<string, Record<UILang, { title: string; sub: string }>> = {
  verde: {
    it: { title: "✅ Puoi mangiare", sub: "Nessun allergene del tuo profilo rilevato." },
    en: { title: "✅ You can eat", sub: "No allergen from your profile detected." },
    es: { title: "✅ Puedes comer", sub: "Ningún alérgeno de tu perfil detectado." },
    fr: { title: "✅ Vous pouvez manger", sub: "Aucun allergène de votre profil détecté." },
    de: { title: "✅ Du kannst essen", sub: "Kein Allergen aus deinem Profil entdeckt." },
    pt: { title: "✅ Pode comer", sub: "Nenhum alergênio do seu perfil detectado." },
    ar: { title: "✅ يمكنك الأكل", sub: "لم يتم الكشف عن أي مسبب حساسية من ملفك." },
    zh: { title: "✅ 可以食用", sub: "未检测到您的过敏原。" },
    ja: { title: "✅ 食べられます", sub: "プロフィールのアレルゲンは検出されませんでした。" },
    ko: { title: "✅ 먹을 수 있음", sub: "프로필의 알레르겐이 감지되지 않았습니다." },
    ru: { title: "✅ Можно есть", sub: "Ни один аллерген из вашего профиля не обнаружен." },
    tr: { title: "✅ Yiyebilirsiniz", sub: "Profilinizdeki hiçbir alerjen tespit edilmedi." },
    pl: { title: "✅ Możesz jeść", sub: "Nie wykryto żadnych alergenów z Twojego profilu." },
    nl: { title: "✅ U kunt eten", sub: "Geen allergeen uit uw profiel gedetecteerd." },
  },
  giallo: {
    it: { title: "⚠️ Attenzione — tracce", sub: "Chiedi conferma al personale prima di ordinare." },
    en: { title: "⚠️ Caution — traces", sub: "Ask staff for confirmation before ordering." },
    es: { title: "⚠️ Precaución — trazas", sub: "Consulta al personal antes de pedir." },
    fr: { title: "⚠️ Attention — traces", sub: "Demandez confirmation au personnel avant de commander." },
    de: { title: "⚠️ Vorsicht — Spuren", sub: "Frage das Personal vor der Bestellung." },
    pt: { title: "⚠️ Atenção — traços", sub: "Confirme com o pessoal antes de pedir." },
    ar: { title: "⚠️ تحذير — آثار", sub: "اسأل الموظفين قبل الطلب." },
    zh: { title: "⚠️ 注意 — 痕量", sub: "订餐前请向服务员确认。" },
    ja: { title: "⚠️ 注意 — 微量", sub: "注文前にスタッフに確認してください。" },
    ko: { title: "⚠️ 주의 — 미량", sub: "주문 전에 직원에게 확인하세요." },
    ru: { title: "⚠️ Осторожно — следы", sub: "Спросите персонал перед заказом." },
    tr: { title: "⚠️ Dikkat — izler", sub: "Sipariş vermeden önce personele sorun." },
    pl: { title: "⚠️ Uwaga — ślady", sub: "Zapytaj personel przed zamówieniem." },
    nl: { title: "⚠️ Waarschuwing — sporen", sub: "Vraag het personeel om bevestiging voor het bestellen." },
  },
  rosso: {
    it: { title: "🚫 Da evitare", sub: "Contiene allergeni dichiarati del tuo profilo." },
    en: { title: "🚫 Avoid", sub: "Contains declared allergens from your profile." },
    es: { title: "🚫 Evitar", sub: "Contiene alérgenos declarados de tu perfil." },
    fr: { title: "🚫 À éviter", sub: "Contient des allergènes déclarés de votre profil." },
    de: { title: "🚫 Meiden", sub: "Enthält deklarierte Allergene aus deinem Profil." },
    pt: { title: "🚫 Evitar", sub: "Contém alergénios declarados do seu perfil." },
    ar: { title: "🚫 تجنّب", sub: "يحتوي على مسببات حساسية معلنة من ملفك." },
    zh: { title: "🚫 避免", sub: "含有您个人资料中声明的过敏原。" },
    ja: { title: "🚫 避けてください", sub: "プロフィールに申告済みのアレルゲンを含みます。" },
    ko: { title: "🚫 피하기", sub: "프로필에 선언된 알레르겐이 포함되어 있습니다." },
    ru: { title: "🚫 Избегать", sub: "Содержит задекларированные аллергены из профиля." },
    tr: { title: "🚫 Kaçının", sub: "Profilinizdeki beyan edilen alerjenleri içeriyor." },
    pl: { title: "🚫 Unikaj", sub: "Zawiera zadeklarowane alergeny z Twojego profilu." },
    nl: { title: "🚫 Vermijden", sub: "Bevat gedeclareerde allergenen uit uw profiel." },
  },
};

export function tSection(stato: 'verde' | 'giallo' | 'rosso', part: 'title' | 'sub', lang: string | null | undefined): string {
  const uiLang = getLang(lang);
  return SECTION_STRINGS[stato][uiLang][part];
}

// ---------------------------------------------------------------------------
// Allergen name helper
// ---------------------------------------------------------------------------
export function getAllergenName(code: string, lang: string | null | undefined): string {
  const cleanCode = code.toLowerCase().trim();
  const allergen = TRANSLATED_ALLERGENS[cleanCode];
  if (allergen) {
    const uiLang = getLang(lang);
    // For languages other than it/en, fall back to English
    return (uiLang === 'it' ? allergen.it : allergen.en) ?? allergen.en ?? code;
  }
  return code;
}

// ---------------------------------------------------------------------------
// Section title helper
// ---------------------------------------------------------------------------
export function getSectionTitle(category: string, lang: string | null | undefined): string {
  const uiLang = getLang(lang);
  return ALLERGEN_SECTIONS[category]?.[uiLang] ?? ALLERGEN_SECTIONS[category]?.en ?? category;
}
