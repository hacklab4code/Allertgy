export interface FoodRecall {
  id: string;
  productName: string;
  brand: string;
  recallDate: string; // YYYY-MM-DD
  reason: string; // Motivo del richiamo (es. "Presenza di allergene non dichiarato")
  allergenKey: string; // 'latte' | 'glutine' | 'uova' | 'arachidi' | 'soia' | 'frutta_a_guscio' | 'senape' | etc.
  lotNumbers: string[];
  expiryDates?: string[];
  manufacturer: string;
  hazardLevel: 'ALTO' | 'MEDIO' | 'CAUZIONALE';
  instructions: string;
  sourceUrl?: string;
}

export const OFFICIAL_FOOD_RECALLS: FoodRecall[] = [
  {
    id: 'rec-2026-01',
    productName: 'Biscotti Frollini con Gocce di Cioccolato',
    brand: 'Mulino Dorato',
    recallDate: '2026-08-25',
    reason: 'Possibile presenza di proteine del latte e lattosio non dichiarati in etichetta',
    allergenKey: 'latte',
    lotNumbers: ['L260811', 'L260812'],
    expiryDates: ['30/04/2027'],
    manufacturer: 'Dolciaria Italia S.p.A.',
    hazardLevel: 'ALTO',
    instructions: 'I consumatori allergici al latte sono pregati di non consumare il prodotto e restituirlo al punto vendita per rimborso.',
  },
  {
    id: 'rec-2026-02',
    productName: 'Pesto Genovese Fresco Senza Aglio',
    brand: 'Terre di Liguria',
    recallDate: '2026-08-20',
    reason: 'Rilevate tracce di anacardi e mandorle non menzionate nel campo ingredienti',
    allergenKey: 'frutta_a_guscio',
    lotNumbers: ['240820P'],
    expiryDates: ['15/10/2026'],
    manufacturer: 'Gastronomia Ligure S.r.l.',
    hazardLevel: 'ALTO',
    instructions: 'Rischio di reazione per soggetti con allergia alla frutta a guscio. Non consumare.',
  },
  {
    id: 'rec-2026-03',
    productName: 'Gallette di Mais Bio',
    brand: 'BioSano',
    recallDate: '2026-08-14',
    reason: 'Presenza accidentale di glutine superiore ai 20 ppm in prodotto commercializzato come senza glutine',
    allergenKey: 'glutine',
    lotNumbers: ['GM-0814A', 'GM-0814B'],
    expiryDates: ['12/12/2026'],
    manufacturer: 'Cereali & Natura S.p.A.',
    hazardLevel: 'ALTO',
    instructions: 'Prodotto non idoneo al consumo da parte di persone celiache o con intolleranza al glutine.',
  },
  {
    id: 'rec-2026-04',
    productName: 'Maionese Vegetale Cremosa',
    brand: 'VegGourmet',
    recallDate: '2026-08-05',
    reason: 'Contaminazione incrociata da albume d\'uovo in linea di confezionamento',
    allergenKey: 'uova',
    lotNumbers: ['MV-0805'],
    expiryDates: ['28/02/2027'],
    manufacturer: 'Salse & Bio S.r.l.',
    hazardLevel: 'MEDIO',
    instructions: 'Non idoneo per allergici all\'uovo o consumatori con dieta vegana stretta.',
  },
  {
    id: 'rec-2026-05',
    productName: 'Salsa di Soia Tradizionale 250ml',
    brand: 'Nippon Taste',
    recallDate: '2026-07-28',
    reason: 'Mancata indicazione in lingua italiana della presenza di grano (glutine)',
    allergenKey: 'glutine',
    lotNumbers: ['NT-7829'],
    expiryDates: ['31/12/2027'],
    manufacturer: 'Asian Import Corp',
    hazardLevel: 'MEDIO',
    instructions: 'Verificare lotto prima del consumo da parte di consumatori con celiachia.',
  },
];

export interface RecallAlertMatch {
  recall: FoodRecall;
  matchedPantryItem?: string;
  matchedAllergen: boolean;
}

export function checkUserRecalls(
  recalls: FoodRecall[],
  userAllergens: readonly string[],
  pantryProductNames: string[] = [],
): RecallAlertMatch[] {
  const userSet = new Set(userAllergens.map((a) => a.toLowerCase().trim()));

  return recalls.map((rec) => {
    const matchedAllergen = userSet.has(rec.allergenKey.toLowerCase().trim()) || (rec.allergenKey === 'glutine' && userSet.has('senza_glutine'));
    const matchedPantryItem = pantryProductNames.find((name) =>
      name.toLowerCase().includes(rec.productName.toLowerCase()) ||
      name.toLowerCase().includes(rec.brand.toLowerCase())
    );

    return {
      recall: rec,
      matchedAllergen,
      matchedPantryItem,
    };
  });
}
