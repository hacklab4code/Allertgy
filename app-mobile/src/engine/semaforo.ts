/**
 * Motore di match "Semaforo" — cuore di AllerTgy.
 * Confronta il profilo allergenico dell'utente con gli allergeni del piatto.
 *
 * 🔴 rosso  = allergene tra i CONTENUTI (criterio assoluto) → piatto pericoloso
 * 🟡 giallo = tracce, oppure contenuto con criterio crudo/cotto (forma non nota → avviso)
 * 🟢 verde  = nessun match → piatto sicuro
 *
 * Funzione pura: nessuna dipendenza, testabile in isolamento.
 */

export type Semaforo = 'verde' | 'giallo' | 'rosso';

/** Forma a cui l'utente reagisce: assoluto = qualsiasi; crudo/cotto = solo quella. */
export type AllergyCriterio = 'assoluto' | 'crudo' | 'cotto';

export interface PiattoAllergeni {
  nome_piatto?: string;
  descrizione?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

export interface EsitoSemaforo {
  stato: Semaforo;
  /** codici allergene o diete che hanno causato il rosso (criterio assoluto) */
  match_contenuti: string[];
  /** codici allergene che hanno causato il giallo (tracce) */
  match_tracce: string[];
  /** ingredienti esclusi che hanno causato il rosso */
  match_esclusi?: string[];
  /**
   * Allergeni presenti nel piatto ma con criterio crudo/cotto:
   * non sappiamo la forma → avviso giallo, non blocco rosso.
   */
  match_criterio?: string[];
}

/** Ingredienti di origine animale — se presenti, un piatto non è vegano/vegetariano */
const INGREDIENTI_ANIMALI = [
  'carne', 'pollo', 'manzo', 'maiale', 'agnello', 'vitello', 'prosciutto', 'speck', 'pancetta', 'guanciale',
  'pesce', 'salmone', 'tonno', 'acciughe', 'alici', 'gamberi', 'gamberetti', 'aragosta', 'polpo', 'calamari', 'seppia', 'molluschi', 'crostacei',
  'uova', 'uovo', 'latte', 'panna', 'burro', 'formaggio', 'parmigiano', 'pecorino', 'mozzarella', 'gorgonzola', 'ricotta', 'stracchino', 'mascarpone',
  'miele', 'gelatina animale', 'strutto', 'lardo',
];

/** Diete e i codici allergene di origine animale che le violano */
const DIETA_REGole: Record<string, readonly string[]> = {
  vegano: INGREDIENTI_ANIMALI,
  vegetariano: ['carne', 'pollo', 'manzo', 'maiale', 'agnello', 'vitello', 'prosciutto', 'speck', 'pancetta', 'guanciale',
    'pesce', 'salmone', 'tonno', 'acciughe', 'alici', 'gamberi', 'gamberetti', 'aragosta', 'polpo', 'calamari', 'seppia', 'molluschi', 'crostacei',
  ],
};

function isSoftCriterio(criterio: AllergyCriterio | undefined): boolean {
  return criterio === 'crudo' || criterio === 'cotto';
}

export function calcolaSemaforo(
  allergieUtente: readonly string[],
  piatto: PiattoAllergeni,
  ingredientiEsclusi: readonly string[] = [],
  criteri: Readonly<Record<string, AllergyCriterio>> = {},
): EsitoSemaforo {
  // Dividiamo allergie da diete
  const dieteUtente = allergieUtente.filter((a) => a === 'vegano' || a === 'vegetariano');
  const allergieVere = allergieUtente.filter((a) => a !== 'vegano' && a !== 'vegetariano');

  const profiloAllergie = new Set(allergieVere);

  const contenutiRaw = piatto.allergeni_contenuti.filter((a) => profiloAllergie.has(a));
  const match_tracce = piatto.allergeni_tracce.filter((a) => profiloAllergie.has(a));

  const match_contenuti: string[] = [];
  const match_criterio: string[] = [];
  for (const code of contenutiRaw) {
    if (isSoftCriterio(criteri[code])) {
      match_criterio.push(code);
    } else {
      match_contenuti.push(code);
    }
  }

  // Verifica diete: identifica ingredienti animali nel piatto
  const tuttiIngredientiPiatto = [
    ...piatto.allergeni_contenuti,
    ...piatto.allergeni_tracce,
    ...((piatto.descrizione || '').toLowerCase().split(/\s+/)),
    ...((piatto.nome_piatto || '').toLowerCase().split(/\s+/)),
  ];
  const setIngredienti = new Set(tuttiIngredientiPiatto);

  const dieteNonRispettate: string[] = [];
  for (const dieta of dieteUtente) {
    const ingredientiVietati = DIETA_REGole[dieta];
    if (!ingredientiVietati) continue;
    const violazione = ingredientiVietati.some((ing) => setIngredienti.has(ing));
    if (violazione) {
      dieteNonRispettate.push(dieta);
    }
  }

  // Verifica ingredienti esclusi
  const match_esclusi: string[] = [];
  const desc = (piatto.descrizione || '').toLowerCase();
  const nome = (piatto.nome_piatto || '').toLowerCase();
  for (const ing of ingredientiEsclusi) {
    const cleanIng = ing.trim().toLowerCase();
    if (cleanIng && (desc.includes(cleanIng) || nome.includes(cleanIng))) {
      match_esclusi.push(ing.trim());
    }
  }

  const tuttiContenuti = [...match_contenuti, ...dieteNonRispettate];

  const stato: Semaforo =
    (tuttiContenuti.length > 0 || match_esclusi.length > 0) ? 'rosso'
    : (match_tracce.length > 0 || match_criterio.length > 0) ? 'giallo'
    : 'verde';

  return {
    stato,
    match_contenuti: tuttiContenuti,
    match_tracce,
    match_esclusi,
    match_criterio,
  };
}

export interface CommensaleProfile {
  id: string | number;
  name: string;
  allergie: readonly string[];
  ingredientiEsclusi?: readonly string[];
  criteri?: Readonly<Record<string, AllergyCriterio>>;
}

export interface EsitoTavolata {
  statoGlobale: Semaforo;
  dettaglioCommensali: Array<{
    id: string | number;
    name: string;
    esito: EsitoSemaforo;
  }>;
  commensaliIdonei: string[];
  commensaliNonIdonei: string[];
}

export function calcolaSemaforoTavolata(
  commensali: CommensaleProfile[],
  piatto: PiattoAllergeni,
): EsitoTavolata {
  if (commensali.length === 0) {
    return {
      statoGlobale: 'verde',
      dettaglioCommensali: [],
      commensaliIdonei: [],
      commensaliNonIdonei: [],
    };
  }

  const dettaglio = commensali.map((c) => ({
    id: c.id,
    name: c.name,
    esito: calcolaSemaforo(c.allergie, piatto, c.ingredientiEsclusi || [], c.criteri || {}),
  }));

  const idonei = dettaglio.filter((d) => d.esito.stato === 'verde').map((d) => d.name);
  const nonIdonei = dettaglio.filter((d) => d.esito.stato === 'rosso').map((d) => d.name);

  let statoGlobale: Semaforo = 'verde';
  if (dettaglio.some((d) => d.esito.stato === 'rosso')) {
    statoGlobale = 'rosso';
  } else if (dettaglio.some((d) => d.esito.stato === 'giallo')) {
    statoGlobale = 'giallo';
  }

  return {
    statoGlobale,
    dettaglioCommensali: dettaglio,
    commensaliIdonei: idonei,
    commensaliNonIdonei: nonIdonei,
  };
}

