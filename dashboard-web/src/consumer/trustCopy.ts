/** Messaggi fiducia/responsabilità — allineati a app mobile e backend/app/legal.py */

export const SAFETY_REMINDER =
  'Avvisa sempre il personale delle tue allergie — anche sui piatti verdi. Il semaforo confronta solo i dati dichiarati dal locale.';

export const ACCOUNT_DISCLAIMER =
  'AllerTgy confronta il tuo profilo con i dati dichiarati dal locale. Non sostituisce il parere medico: comunica sempre le tue allergie al personale.';

export const KITCHEN_SAFE_HINT =
  'Dichiarato dal locale — verifica sempre col personale.';

export const UGC_WARNING_DISCLAIMER =
  'Segnalazioni di altri clienti, non verificate da AllerTgy. Usale per parlare col personale.';

export const SEMAFORO_LEGEND = [
  ['🔴', 'Contiene un allergene del tuo profilo dichiarato dal locale'],
  ['🟡', 'Possibili tracce — chiedi conferma al personale prima di ordinare'],
  ['🟢', 'Nessun allergene del profilo rilevato — comunica comunque le allergie al personale'],
] as const;

export const SEMAFORO_SECTION: Record<
  'verde' | 'giallo' | 'rosso',
  { title: string; sub: string; dishLabel: string }
> = {
  verde: {
    title: 'Puoi mangiare',
    sub: 'Nessun allergene del tuo profilo rilevato. Comunica comunque le allergie al personale.',
    dishLabel: 'Compatibile',
  },
  giallo: {
    title: 'Attenzione — tracce',
    sub: 'Chiedi conferma al personale prima di ordinare.',
    dishLabel: 'Chiedi conferma',
  },
  rosso: {
    title: 'Da evitare',
    sub: 'Contiene allergeni dichiarati del tuo profilo.',
    dishLabel: 'Da evitare',
  },
};

export function guestGreenLabel(hasAllergens: boolean): string {
  if (!hasAllergens) return 'Seleziona allergie';
  return SEMAFORO_SECTION.verde.dishLabel;
}
