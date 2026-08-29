/** Codici cucina AllerTgy + inferenza dal nome locale. */

export type CuisineCode =
  | 'italiana'
  | 'pizza'
  | 'sushi'
  | 'cinese'
  | 'indiana'
  | 'mediterranea'
  | 'pesce'
  | 'carne'
  | 'vegetariana'
  | 'fast_food'
  | 'pasticceria'
  | 'altro';

export const CUISINE_OPTIONS: {
  code: CuisineCode;
  emoji: string;
  it: string;
  en: string;
}[] = [
  { code: 'italiana', emoji: '🍝', it: 'Italiana', en: 'Italian' },
  { code: 'pizza', emoji: '🍕', it: 'Pizza', en: 'Pizza' },
  { code: 'sushi', emoji: '🍣', it: 'Sushi', en: 'Sushi' },
  { code: 'cinese', emoji: '🥡', it: 'Cinese', en: 'Chinese' },
  { code: 'indiana', emoji: '🍛', it: 'Indiana', en: 'Indian' },
  { code: 'mediterranea', emoji: '🫒', it: 'Mediterranea', en: 'Mediterranean' },
  { code: 'pesce', emoji: '🦞', it: 'Pesce', en: 'Seafood' },
  { code: 'carne', emoji: '🥩', it: 'Carne', en: 'Steakhouse' },
  { code: 'vegetariana', emoji: '🥗', it: 'Vegetariana', en: 'Vegetarian' },
  { code: 'fast_food', emoji: '🍔', it: 'Fast food', en: 'Fast food' },
  { code: 'pasticceria', emoji: '🥐', it: 'Pasticceria', en: 'Bakery' },
  { code: 'altro', emoji: '🍽️', it: 'Altro', en: 'Other' },
];

const NAME_HINTS: { code: CuisineCode; patterns: RegExp[] }[] = [
  { code: 'pizza', patterns: [/\bpizz/i, /\bpizzer/i] },
  { code: 'sushi', patterns: [/\bsushi\b/i, /\bjapan/i, /\bgappones/i, /\bramen\b/i] },
  { code: 'cinese', patterns: [/\bcines/i, /\bchinese\b/i, /\bwok\b/i] },
  { code: 'indiana', patterns: [/\bindian/i, /\btandoori\b/i, /\bcurry\b/i] },
  { code: 'pesce', patterns: [/\bpesce\b/i, /\bseafood\b/i, /\bostricar/i, /\bmare\b/i] },
  { code: 'carne', patterns: [/\bsteak/i, /\bgrill\b/i, /\bbracer/i, /\bcarne\b/i] },
  { code: 'vegetariana', patterns: [/\bvegan/i, /\bvegetar/i, /\bplant.?based/i] },
  { code: 'fast_food', patterns: [/\bburger\b/i, /\bfast.?food/i, /\bkebab\b/i] },
  { code: 'pasticceria', patterns: [/\bpasticc/i, /\bbakery\b/i, /\bcaf[eé]\b/i, /\bbar\b/i] },
  { code: 'italiana', patterns: [/\btrattori/i, /\bosteri/i, /\bristorant/i, /\btaverna\b/i] },
  { code: 'mediterranea', patterns: [/\bmediterran/i, /\bgreek\b/i, /\bgrec/i] },
];

export function normalizeCuisine(raw?: string | null): CuisineCode | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  return CUISINE_OPTIONS.some((o) => o.code === key) ? (key as CuisineCode) : null;
}

/** Preferisce il campo API; altrimenti indovina dal nome. */
export function resolveCuisine(
  cuisine: string | null | undefined,
  name: string,
): CuisineCode {
  const fromApi = normalizeCuisine(cuisine);
  if (fromApi) return fromApi;
  for (const hint of NAME_HINTS) {
    if (hint.patterns.some((re) => re.test(name))) return hint.code;
  }
  return 'altro';
}

export function cuisineLabel(code: CuisineCode, isIt: boolean): string {
  const opt = CUISINE_OPTIONS.find((o) => o.code === code);
  if (!opt) return code;
  return isIt ? opt.it : opt.en;
}
