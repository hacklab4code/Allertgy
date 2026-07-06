/**
 * Motore di match "Semaforo" — cuore di AllerTgy.
 * Confronta il profilo allergenico dell'utente con gli allergeni del piatto.
 *
 * 🔴 rosso  = allergene tra i CONTENUTI  → piatto pericoloso
 * 🟡 giallo = allergene solo tra le TRACCE → rischio contaminazione crociata
 * 🟢 verde  = nessun match → piatto sicuro
 *
 * Funzione pura: nessuna dipendenza, testabile in isolamento.
 */

export type Semaforo = 'verde' | 'giallo' | 'rosso';

export interface PiattoAllergeni {
  nome_piatto?: string;
  descrizione?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

export interface EsitoSemaforo {
  stato: Semaforo;
  /** codici allergene o diete che hanno causato il rosso */
  match_contenuti: string[];
  /** codici allergene che hanno causato il giallo */
  match_tracce: string[];
  /** ingredienti esclusi che hanno causato il rosso */
  match_esclusi?: string[];
}

export function calcolaSemaforo(
  allergieUtente: readonly string[],
  piatto: PiattoAllergeni,
  ingredientiEsclusi: readonly string[] = []
): EsitoSemaforo {
  // Dividiamo allergie da diete
  const dieteUtente = allergieUtente.filter((a) => a === 'vegano' || a === 'vegetariano');
  const allergieVere = allergieUtente.filter((a) => a !== 'vegano' && a !== 'vegetariano');

  const profiloAllergie = new Set(allergieVere);

  const match_contenuti = piatto.allergeni_contenuti.filter((a) => profiloAllergie.has(a));
  const match_tracce = piatto.allergeni_tracce.filter((a) => profiloAllergie.has(a));

  // Verifica diete
  const dieteNonRispettate: string[] = [];
  for (const dieta of dieteUtente) {
    if (dieta === 'vegano') {
      if (!piatto.allergeni_contenuti.includes('vegano')) {
        dieteNonRispettate.push('vegano');
      }
    } else if (dieta === 'vegetariano') {
      if (!piatto.allergeni_contenuti.includes('vegetariano') && !piatto.allergeni_contenuti.includes('vegano')) {
        dieteNonRispettate.push('vegetariano');
      }
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
    : match_tracce.length > 0 ? 'giallo'
    : 'verde';

  return { stato, match_contenuti: tuttiContenuti, match_tracce, match_esclusi };
}
