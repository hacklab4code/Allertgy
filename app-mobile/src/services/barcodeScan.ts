import { calcolaSemaforo, type PiattoAllergeni } from '../engine/semaforo';
import { OFF_ALLERGEN_MAP } from '../engine/offAllergens';

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
  date: string;
}

/** Analizza un prodotto Open Food Facts e calcola il semaforo per il profilo utente. */
export function analyzeOffProduct(
  barcode: string,
  product: Record<string, unknown>,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
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

  const esito = calcolaSemaforo(activeAllergies, piatto, ingredientiEsclusi);

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
    date: new Date().toISOString(),
  };
}

/** Scarica e analizza un prodotto da Open Food Facts. */
export async function fetchAndAnalyzeBarcode(
  barcode: string,
  allergie: readonly string[],
  ingredientiEsclusi: readonly string[] = [],
): Promise<ScannedProduct> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
    headers: { 'User-Agent': 'AllerTgyApp/1.0 (contact@allertgy.com)' },
  });
  const data = await response.json();
  if (data.status !== 1 || !data.product) {
    throw new Error('Prodotto non trovato nel database di Open Food Facts');
  }
  return analyzeOffProduct(barcode, data.product, allergie, ingredientiEsclusi);
}
