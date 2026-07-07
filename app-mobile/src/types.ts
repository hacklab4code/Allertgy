export interface Allergen {
  id: number;
  code: string;
  name_it: string;
  emoji: string | null;
  is_diet: number;
  intensity?: 'lieve' | 'moderata' | 'grave' | null;
}

export interface Piatto {
  id: number;
  nome_piatto: string;
  descrizione: string | null;
  categoria: string | null;
  prezzo_cents: number | null;
  image_url?: string | null;
  menu_group?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

export interface Menu {
  restaurant_id: number;
  public_code: string;
  nome_ristorante: string;
  citta: string | null;
  latitude?: number | null;
  longitude?: number | null;
  aggiornato_il: string | null;
  menu_version?: number;
  menu_legal_confirmed_at?: string | null;
  menu_legal_version?: string | null;
  safety_notice?: string;
  piatti: Piatto[];
}

export interface PiattoValutazione {
  dish_id: number;
  status: 'verde' | 'giallo' | 'rosso';
  label: 'compatibile' | 'attenzione_tracce' | 'non_idoneo';
  match_contenuti: string[];
  match_tracce: string[];
  match_esclusi: string[];
}

export interface MenuValutato extends Menu {
  evaluation: PiattoValutazione[];
}

/** Piatto in scrittura (lato ristoratore) */
export interface PiattoIn {
  nome_piatto: string;
  descrizione?: string | null;
  categoria?: string | null;
  prezzo_cents?: number | null;
  image_url?: string | null;
  menu_group?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

export type BusinessPlan = 'free' | 'verified' | 'pro' | 'premium';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'comped';

export interface Restaurant {
  id: number;
  public_code: string;
  name: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  menu_updated_at: string | null;
  menu_version?: number;
  menu_legal_confirmed_at?: string | null;
  menu_legal_version?: string | null;
  business_plan?: BusinessPlan;
  subscription_status?: SubscriptionStatus;
  plan_price_cents?: number;
  is_verified?: number;
  plan_started_at?: string | null;
  trial_ends_at?: string | null;
}

export interface Plan {
  code: BusinessPlan;
  name: string;
  price_cents: number;
  tagline: string;
  features: string[];
  photo_limit: number;
  has_menu: boolean;
  has_review_reply: boolean;
  has_priority: boolean;
}
