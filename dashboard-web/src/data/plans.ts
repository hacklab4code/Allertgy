import type { Restaurant } from '../api';

export const PLAN_LABELS = {
  free: 'Gratis',
  base: 'Base',
  pro_notify: 'Pro',
} as const;

export const PLAN_PRICES = {
  free: 0,
  base: 900,
  pro_notify: 1900,
} as const;

export const PLAN_FEATURES = [
  {
    code: 'free',
    name: 'Gratis',
    price: '€0',
    description: 'Scheda mappa.',
    features: ['Scheda locale sulla mappa', 'Nome, città, indirizzo e 1 foto'],
    highlight: false,
  },
  {
    code: 'base',
    name: 'Base',
    price: '€9/mese',
    description: 'Semaforo clienti + QR + PDF.',
    trial: '14 giorni gratis',
    features: [
      'Semaforo personalizzato per ogni cliente',
      'QR code al tavolo',
      'Registro allergeni PDF',
      'Menù digitale con allergeni per piatto',
    ],
    highlight: false,
  },
  {
    code: 'pro_notify',
    name: 'Pro',
    price: '€19/mese',
    description: 'Come Base + Push, AI e statistiche.',
    trial: '14 giorni gratis',
    features: [
      'Tutto del piano Base',
      'Notifiche push ai clienti fedeli',
      'Analisi AI menù illimitate',
      'Statistiche scansioni e allergeni cercati',
    ],
    highlight: true,
  },
] as const;

export function centsToEuro(cents: number | null | undefined) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);
}

export function restaurantCanUseMenu(r: Restaurant | null) {
  if (!r) return false;
  const plan = r.business_plan ?? 'free';
  const status = r.subscription_status ?? 'free';
  return status === 'comped' || ((plan === 'base' || plan === 'pro_notify') && ['trialing', 'active'].includes(status));
}

export function restaurantCanPushNotify(r: Restaurant | null) {
  if (!r) return false;
  const status = r.subscription_status ?? 'free';
  return r.business_plan === 'pro_notify' && ['trialing', 'active', 'comped'].includes(status);
}
