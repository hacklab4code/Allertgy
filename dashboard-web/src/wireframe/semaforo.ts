import type { DishOut } from '../api';

export type Semaforo = 'verde' | 'giallo' | 'rosso';

export function calcolaSemaforo(profilo: Set<string>, p: DishOut): { stato: Semaforo; match: string[] } {
  const contenuti = p.allergeni_contenuti.filter((a) => profilo.has(a));
  const tracce = p.allergeni_tracce.filter((a) => profilo.has(a));
  if (contenuti.length > 0) return { stato: 'rosso', match: contenuti };
  if (tracce.length > 0) return { stato: 'giallo', match: tracce };
  return { stato: 'verde', match: [] };
}

export function compatibilitaPercentuale(profilo: Set<string>, piatti: DishOut[]): number | null {
  if (piatti.length === 0) return null;
  const verdi = piatti.filter((p) => calcolaSemaforo(profilo, p).stato === 'verde').length;
  return Math.round((verdi / piatti.length) * 100);
}

export function statoLocale(profilo: Set<string>, piatti: DishOut[]): 'verde' | 'giallo' | 'rosso' | 'grigio' {
  if (piatti.length === 0) return 'grigio';
  const valutati = piatti.map((p) => calcolaSemaforo(profilo, p));
  const rosso = valutati.filter((v) => v.stato === 'rosso').length;
  const giallo = valutati.filter((v) => v.stato === 'giallo').length;
  const verde = valutati.filter((v) => v.stato === 'verde').length;
  if (rosso > 0 && verde === 0) return 'rosso';
  if (rosso > 0 || giallo > 0) return 'giallo';
  return 'verde';
}
