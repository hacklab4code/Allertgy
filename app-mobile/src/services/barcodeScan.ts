import { calcolaSemaforo, type AllergyCriterio, type PiattoAllergeni } from '../engine/semaforo';
import { OFF_ALLERGEN_MAP } from '../engine/offAllergens';
import { api, type BarcodeResolveResult } from '../api/client';

export type ProductSourceType =
  | 'off'
  | 'openfoodfacts'
  | 'openbeautyfacts'
  | 'ai_label'
  | 'community_cache'
  | 'allertgy_verified'
  | 'upcitemdb';

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  status: 'verde' | 'giallo' | 'rosso';
  ingredients: string;
  match_contenuti: string[];
  match_tracce: string[];
  match_esclusi: string[];
  match_criterio?: string[];
  date: string;
  source?: ProductSourceType;
  sourceLabel?: string;
  confidenceScore?: number;
  verificationCount?: number;
  isCosmetic?: boolean;
  lastVerified?: string;
  disclaimer?: string;
  aiNote?: string;
}

/** Helper per mappare le etichette delle fonti in italiano */
export function getSourceBadgeInfo(source?: string, isCosmetic?: boolean): { label: string; icon: string; color: string } {
  if (isCosmetic || source === 'openbeautyfacts') {
    return { label: 'Cura Personale / Cosmetico', icon: 'sparkles', color: '#8B5CF6' };
  }
  switch (source) {
    case 'allertgy_verified':
      return { label: 'Certificato AllerTgy', icon: 'shield-checkmark', color: '#10B981' };
    case 'community_cache':
    case 'ai_label':
      return { label: 'Analisi Etichetta Community', icon: 'camera', color: '#F59E0B' };
    case 'openfoodfacts':
    case 'off':
      return { label: 'Open Food Facts', icon: 'globe-outline', color: '#0EA5E9' };
    case 'upcitemdb':
      return { label: 'Catalogo Commerciale UPC', icon: 'barcode-outline', color: '#64748B' };
    default:
      return { label: 'Database AllerTgy', icon: 'checkmark-circle-outline', color: '#10B981' };
  }
}

/** Converte il risultato del resolver backend multi-database in ScannedProduct. */
export function analyzeResolvedProduct(
  data: BarcodeResolveResult,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
  criteri: Readonly<Record<string, AllergyCriterio>> = {},
): ScannedProduct {
  const activeAllergies = [...allergie];
  if (allergie.includes('senza_glutine') && !activeAllergies.includes('glutine')) activeAllergies.push('glutine');
  if (allergie.includes('senza_lattosio') && !activeAllergies.includes('latte')) activeAllergies.push('latte');

  const piatto: PiattoAllergeni = {
    nome_piatto: data.product_name || 'Prodotto sconosciuto',
    descrizione: data.ingredients,
    allergeni_contenuti: data.allergeni_contenuti || [],
    allergeni_tracce: data.allergeni_tracce || [],
  };

  const esito = calcolaSemaforo(activeAllergies, piatto, ingredientiEsclusi, criteri);

  return {
    barcode: data.barcode,
    name: data.product_name || 'Prodotto sconosciuto',
    brand: data.brand || 'Marca non specificata',
    image: data.image_url || null,
    status: esito.stato,
    ingredients: data.ingredients || 'Lista ingredienti non disponibile',
    match_contenuti: esito.match_contenuti || [],
    match_tracce: esito.match_tracce || [],
    match_esclusi: esito.match_esclusi || [],
    match_criterio: esito.match_criterio || [],
    date: new Date().toISOString(),
    source: (data.source as ProductSourceType) || 'allertgy_verified',
    sourceLabel: data.source_label,
    confidenceScore: data.confidence_score,
    verificationCount: data.verification_count,
    isCosmetic: data.is_cosmetic,
    lastVerified: data.last_verified_at || undefined,
    aiNote: data.note || undefined,
    disclaimer:
      'Le ricette possono subire modifiche nel tempo. Verifica sempre la confezione fisica prima del consumo.',
  };
}

/** Analizza un prodotto Open Food Facts e calcola il semaforo per il profilo utente. */
export function analyzeOffProduct(
  barcode: string,
  product: Record<string, unknown>,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
  criteri: Readonly<Record<string, AllergyCriterio>> = {},
): ScannedProduct {
  const name = (product.product_name_it as string) || (product.product_name as string) || 'Prodotto sconosciuto';
  const brand = (product.brands as string) || 'Marca non specificata';
  const image = (product.image_front_url as string) || (product.image_url as string) || null;
  const ingredientsText =
    (product.ingredients_text_it as string) ||
    (product.ingredients_text as string) ||
    'Lista ingredienti non disponibile';

  const allergeniContenuti = new Set<string>();
  const allergeniTracce = new Set<string>();

  for (const tag of (product.allergens_tags as string[]) || []) {
    const mapped = OFF_ALLERGEN_MAP[tag.toLowerCase()];
    if (mapped) mapped.forEach((code) => allergeniContenuti.add(code));
  }

  for (const tag of (product.traces_tags as string[]) || []) {
    const mapped = OFF_ALLERGEN_MAP[tag.toLowerCase()];
    if (mapped) mapped.forEach((code) => allergeniTracce.add(code));
  }

  const analysisTags = (product.ingredients_analysis_tags as string[]) || [];
  const isVegan = analysisTags.includes('en:vegan');
  const isVegetarian = analysisTags.includes('en:vegetarian') || isVegan;
  if (isVegan) {
    allergeniContenuti.add('vegano');
    allergeniContenuti.add('vegetariano');
  } else if (isVegetarian) {
    allergeniContenuti.add('vegetariano');
  }

  const labelsTags = (product.labels_tags as string[]) || [];
  if (labelsTags.includes('en:gluten-free')) allergeniContenuti.add('senza_glutine');
  if (labelsTags.includes('en:lactose-free')) allergeniContenuti.add('senza_lattosio');

  for (const ing of (product.ingredients as { id?: string }[]) || []) {
    const mapped = OFF_ALLERGEN_MAP[(ing.id || '').toLowerCase()];
    if (mapped) mapped.forEach((code) => allergeniContenuti.add(code));
  }

  const activeAllergies = [...allergie];
  if (allergie.includes('senza_glutine') && !activeAllergies.includes('glutine')) activeAllergies.push('glutine');
  if (allergie.includes('senza_lattosio') && !activeAllergies.includes('latte')) activeAllergies.push('latte');

  const piatto: PiattoAllergeni = {
    nome_piatto: name,
    descrizione: ingredientsText,
    allergeni_contenuti: Array.from(allergeniContenuti),
    allergeni_tracce: Array.from(allergeniTracce),
  };

  const esito = calcolaSemaforo(activeAllergies, piatto, ingredientiEsclusi, criteri);

  return {
    barcode,
    name,
    brand,
    image,
    status: esito.stato,
    ingredients: ingredientsText,
    match_contenuti: esito.match_contenuti || [],
    match_tracce: esito.match_tracce || [],
    match_esclusi: esito.match_esclusi || [],
    match_criterio: esito.match_criterio || [],
    date: new Date().toISOString(),
    source: 'off',
    sourceLabel: 'Open Food Facts',
    disclaimer:
      'Le ricette possono subire modifiche nel tempo. Verifica sempre la confezione fisica prima del consumo.',
  };
}

export interface ProductLabelAiResult {
  barcode: string;
  product_name: string;
  brand: string;
  ingredients: string;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
  note?: string;
}

/** Converte dati etichetta (AI o archivio) in ScannedProduct con semaforo profilo. */
export function analyzeFromLabelAi(
  data: ProductLabelAiResult,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
  opts?: { source?: ProductSourceType; aiNote?: string; sourceLabel?: string },
  criteri: Readonly<Record<string, AllergyCriterio>> = {},
): ScannedProduct {
  const activeAllergies = [...allergie];
  if (allergie.includes('senza_glutine') && !activeAllergies.includes('glutine')) activeAllergies.push('glutine');
  if (allergie.includes('senza_lattosio') && !activeAllergies.includes('latte')) activeAllergies.push('latte');

  const piatto: PiattoAllergeni = {
    nome_piatto: data.product_name || 'Prodotto sconosciuto',
    descrizione: data.ingredients,
    allergeni_contenuti: data.allergeni_contenuti,
    allergeni_tracce: data.allergeni_tracce,
  };

  const esito = calcolaSemaforo(activeAllergies, piatto, ingredientiEsclusi, criteri);
  const source = opts?.source ?? 'ai_label';

  return {
    barcode: data.barcode,
    name: data.product_name || 'Prodotto sconosciuto',
    brand: data.brand || 'Marca non specificata',
    image: null,
    status: esito.stato,
    ingredients: data.ingredients,
    match_contenuti: esito.match_contenuti || [],
    match_tracce: esito.match_tracce || [],
    match_esclusi: esito.match_esclusi || [],
    match_criterio: esito.match_criterio || [],
    date: new Date().toISOString(),
    source,
    sourceLabel: opts?.sourceLabel ?? (source === 'community_cache' ? 'Archivio Community AllerTgy' : 'Analisi Etichetta AI'),
    aiNote: opts?.aiNote ?? data.note,
    disclaimer:
      'Analisi AI basata sull\'etichetta inquadrata. Verifica sempre la confezione prima del consumo.',
  };
}

/** Risolve e analizza un barcode tramite la cascata Multi-Database (Cloud AllerTgy -> OFF -> OBF -> UPC). */
export async function fetchAndAnalyzeBarcode(
  barcode: string,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
  criteri: Readonly<Record<string, AllergyCriterio>> = {},
): Promise<ScannedProduct> {
  // 1. Prova prima il nostro resolver backend multi-database (cascata 5 livelli server-side)
  try {
    const resolved = await api.resolveBarcode(barcode);
    if (resolved && resolved.product_name) {
      return analyzeResolvedProduct(resolved, allergie, ingredientiEsclusi, criteri);
    }
  } catch (err: any) {
    // Se è 404 (non trovato nei DB) o errore di rete, continuiamo con fallback client
    if (err?.status === 404 || err?.message?.includes('404')) {
      throw new Error('Prodotto non trovato nei database');
    }
  }

  // 2. Fallback diretto client a Open Food Facts se il backend non è raggiungibile
  const candidates = barcodeCandidates(barcode);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${candidate}.json`, {
        headers: { 'User-Agent': 'AllerTgyApp/2.0 (contact@allertgy.com)' },
      });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      const data = await response.json();
      if (data.status === 1 && data.product) {
        return analyzeOffProduct(candidate, data.product, allergie, ingredientiEsclusi, criteri);
      }
      lastError = new Error('Prodotto non trovato nei database');
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error('Errore di connessione');
    }
  }

  throw lastError ?? new Error('Prodotto non trovato nei database');
}

/** Estrae un codice prodotto da stringa scanner (EAN, UPC, GS1 QR). */
export function extractProductBarcode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const gs1 = trimmed.match(/\(01\)(\d{13,14})/);
  if (gs1) return gs1[1];

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 8 && digitsOnly.length <= 14) return digitsOnly;

  const urlMatch = trimmed.match(/\/(\d{8,14})(?:[/?#]|$)/);
  if (urlMatch) return urlMatch[1];

  return null;
}

function barcodeCandidates(barcode: string): string[] {
  const digits = barcode.replace(/\D/g, '');
  if (!digits) return [];
  const out = new Set<string>([digits]);
  if (digits.length === 12) out.add(`0${digits}`);
  if (digits.length < 13) out.add(digits.padStart(13, '0'));
  if (digits.length === 13 && digits.startsWith('0')) out.add(digits.slice(1));
  return [...out];
}

