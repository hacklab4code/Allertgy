export const TRANSLATED_ALLERGENS: Record<string, { en: string; it: string; emoji: string }> = {
  glutine: { it: "Cereali con glutine", en: "Gluten cereals", emoji: "🌾" },
  crostacei: { it: "Crostacei", en: "Crustaceans", emoji: "🦐" },
  uova: { it: "Uova", en: "Eggs", emoji: "🥚" },
  pesce: { it: "Pesce", en: "Fish", emoji: "🐟" },
  arachidi: { it: "Arachidi", en: "Peanuts", emoji: "🥜" },
  soia: { it: "Soia", en: "Soy", emoji: "🌱" },
  latte: { it: "Latte e lattosio", en: "Milk & lactose", emoji: "🥛" },
  frutta_a_guscio: { it: "Frutta a guscio", en: "Nuts", emoji: "🌰" },
  sedano: { it: "Sedano", en: "Celery", emoji: "🥬" },
  senape: { it: "Senape", en: "Mustard", emoji: "🟡" },
  sesamo: { it: "Semi di sesamo", en: "Sesame seeds", emoji: "⚪" },
  solfiti: { it: "Anidride solforosa / solfiti", en: "Sulfites / sulfur dioxide", emoji: "🍷" },
  lupini: { it: "Lupini", en: "Lupins", emoji: "🫘" },
  molluschi: { it: "Molluschi", en: "Molluscs", emoji: "🦑" },
  vegano: { it: "Vegano", en: "Vegan", emoji: "🌿" },
  vegetariano: { it: "Vegetariano", en: "Vegetarian", emoji: "🥗" },
};

const UI_STRINGS = {
  safe: { it: "SICURO", en: "SAFE" },
  warning: { it: "ATTENZIONE — possibili tracce", en: "WARNING — possible traces" },
  danger: { it: "NON IDONEO", en: "NOT ELIGIBLE" },
  contains: { it: "Contiene: ", en: "Contains: " },
  traces: { it: "Tracce di: ", en: "Traces of: " },
  diet_incompatible: { it: "Incompatibile con: ", en: "Incompatible with: " },
  excluded_ingredient: { it: "Contiene ingrediente escluso: ", en: "Contains excluded ingredient: " },
  custom_ingredients_label: { it: "INGREDIENTI DA EVITARE", en: "INGREDIENTS TO AVOID" },
  custom_ingredients_sub: { it: "Digita ingredienti specifici (es. cipolla, aglio) separati da virgola", en: "Type specific ingredients (e.g. onion, garlic) separated by comma" },
  reminder: { it: "⚠️ Avvisa sempre il personale delle tue allergie.", en: "⚠️ Always inform staff about your allergies." },
  all: { it: "Tutti", en: "All" },
  yes: { it: "Sì", en: "Yes" },
  no: { it: "No", en: "No" },
  empty_menu: { it: "Questo locale non ha ancora pubblicato il menù.", en: "This place has not published its menu yet." },
  offline_warning: { it: "⚡ Connessione assente. Visualizzazione copia offline del menù.", en: "⚡ No connection. Viewing offline menu copy." },
  summary_text: {
    it: (verde: number, giallo: number, rosso: number) => 
      `In base al tuo profilo: ${verde} piatti sicuri, ${giallo} con possibili tracce, ${rosso} da evitare.`,
    en: (verde: number, giallo: number, rosso: number) => 
      `Based on your profile: ${verde} safe dishes, ${giallo} with possible traces, ${rosso} to avoid.`
  }
};

export function t(key: Exclude<keyof typeof UI_STRINGS, 'summary_text'>, lang: 'it' | 'en'): string {
  const item = UI_STRINGS[key] as { it: string; en: string };
  return item[lang];
}

export function tSummary(lang: 'it' | 'en', verde: number, giallo: number, rosso: number): string {
  return UI_STRINGS.summary_text[lang](verde, giallo, rosso);
}

export function getAllergenName(code: string, lang: 'it' | 'en'): string {
  const cleanCode = code.toLowerCase().trim();
  const allergen = TRANSLATED_ALLERGENS[cleanCode];
  if (allergen) {
    return allergen[lang];
  }
  return code;
}
