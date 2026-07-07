/**
 * Motore di compatibilità — calcola la percentuale di piatti mangiabili
 * in un ristorante in base al profilo allergenico dell'utente.
 *
 * La formula pesa:
 *   🟢 verde  = 100% (piatto sicuro)
 *   🟡 giallo =  50% (tracce possibili ma non certe)
 *   🔴 rosso  =   0% (contiene allergeni)
 *
 * Percentuale = (verde + giallo × 0.5) / totale × 100
 */

import { calcolaSemaforo, type PiattoAllergeni } from './semaforo';

export interface CompatibilitaResult {
  totaleDishes: number;
  verde: number;
  giallo: number;
  rosso: number;
  /** Percentuale 0–100 di quanto l'utente può mangiare nel locale */
  percentuale: number;
}

export function calcolaCompatibilita(
  allergieUtente: readonly string[],
  piatti: readonly PiattoAllergeni[],
  ingredientiEsclusi: readonly string[] = [],
): CompatibilitaResult {
  if (piatti.length === 0) {
    return { totaleDishes: 0, verde: 0, giallo: 0, rosso: 0, percentuale: 0 };
  }

  let verde = 0;
  let giallo = 0;
  let rosso = 0;

  for (const p of piatti) {
    const esito = calcolaSemaforo(allergieUtente, p, ingredientiEsclusi);
    switch (esito.stato) {
      case 'verde':
        verde++;
        break;
      case 'giallo':
        giallo++;
        break;
      case 'rosso':
        rosso++;
        break;
    }
  }

  const totale = piatti.length;
  const percentuale = Math.round(((verde + giallo * 0.5) / totale) * 100);

  return { totaleDishes: totale, verde, giallo, rosso, percentuale };
}

/** Restituisce il colore dominante in base alla percentuale */
export function compatibilitaColor(percentuale: number): 'verde' | 'giallo' | 'rosso' {
  if (percentuale >= 70) return 'verde';
  if (percentuale >= 40) return 'giallo';
  return 'rosso';
}
