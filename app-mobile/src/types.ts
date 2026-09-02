export interface Allergen {
  id: number;
  code: string;
  name_it: string;
  name_en?: string | null;
  emoji: string | null;
  is_diet: number;
  category: string;
  intensity?: 'lieve' | 'moderata' | 'grave' | null;
  /** Forma a cui reagisce: assoluto / crudo / cotto */
  criterio?: 'assoluto' | 'crudo' | 'cotto' | null;
}

export type AllergyIntensity = 'lieve' | 'moderata' | 'grave';
export type AllergyCriterio = 'assoluto' | 'crudo' | 'cotto';

export interface MenuOutItem {
  id: number;
  restaurant_id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Piatto {
  id: number;
  nome_piatto: string;
  descrizione: string | null;
  categoria?: string | null;
  prezzo_cents?: number | null;
  image_url?: string | null;
  menu_group?: string | null;
  menu_id?: number | null;
  kitchen_protocol_confirmed?: number;
  cross_contamination_checked_at?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

/** Lista leggera locali (endpoint /restaurants/summary). */
export interface RestaurantSummary {
  restaurant_id: number;
  public_code: string;
  nome_ristorante: string;
  citta: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  boost_active?: boolean;
  /** False = piano free / menù allergeni non pubblicato — non confondere con “0 piatti idonei”. */
  menu_available?: boolean;
  /** Badge AllerTgy verificato. */
  is_verified?: boolean;
  /** Tipo cucina (es. italiana, pizza, sushi). */
  cuisine?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  piatti: Piatto[];
}

export interface FavoriteItem {
  public_code: string;
  name: string;
}

export interface Menu {
  restaurant_id: number;
  public_code: string;
  nome_ristorante: string;
  citta: string | null;
  indirizzo?: string | null;
  telefono?: string | null;
  email_contatto?: string | null;
  orari_apertura?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  aggiornato_il: string | null;
  menu_version?: number;
  menu_legal_confirmed_at?: string | null;
  menu_legal_version?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  tripadvisor_rating?: number | null;
  tripadvisor_reviews_count?: number | null;
  boost_active?: boolean;
  /** False = dati allergeni non pubblicati (piano free o menù non attivo). */
  menu_available?: boolean;
  safety_notice?: string;
  menus?: MenuOutItem[];
  photos?: RestaurantPhoto[];
  piatti: Piatto[];
}

export interface RestaurantPhoto {
  id: number;
  url: string;
  is_cover: boolean;
  sort_order?: number;
}

export interface PublicRestaurant {
  public_code: string;
  name: string;
  city?: string | null;
  image_url?: string | null;
  photos: RestaurantPhoto[];
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
  id?: number;
  nome_piatto: string;
  descrizione?: string | null;
  categoria?: string | null;
  prezzo_cents?: number | null;
  image_url?: string | null;
  menu_group?: string | null;
  kitchen_protocol_confirmed?: number;
  cross_contamination_checked_at?: string | null;
  allergeni_contenuti: string[];
  allergeni_tracce: string[];
}

export interface DishSaveOut {
  dish: PiattoIn & { id: number };
  menu_version: number;
  menu_updated_at: string | null;
  published: boolean;
  registry_ready: boolean;
}

export type BusinessPlan = 'free' | 'base' | 'pro_notify';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'comped';

export interface Restaurant {
  id: number;
  public_code: string;
  slug?: string;
  name: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  website?: string | null;
  menu_url?: string | null;
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
  vat_number?: string | null;
  allergen_manager?: string | null;
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

export interface VisibilityBoost {
  id: number;
  restaurant_id: number;
  amount_cents: number;
  duration_days: number;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CustomerPlan {
  code: 'customer_free' | 'customer_plus';
  name: string;
  price_cents: number;
  tagline: string;
  features: string[];
  sub_profile_limit: number | null;
  barcode_scan_limit_month: number | null;
  medical_ai_limit_month: number | null;
  shared_profile_permanent: boolean;
}

export interface ReferralStats {
  invite_code: string | null;
  referrals_count: number;
  customer_plan: 'customer_free' | 'customer_plus';
  customer_subscription_status: string;
  has_plus: boolean;
  reward_message?: string | null;
}

export interface CustomerAnnotation {
  id: number;
  restaurant_id: number;
  allergen_id: number;
  allergen_code: string;
  allergen_name_it: string;
  allergen_emoji: string | null;
  ingredient: string | null;
  notes: string;
  author_name: string;
  is_mine: boolean;
  created_at: string;
}

export interface SubProfileAllergen {
  code: string;
  name_it: string;
  emoji: string | null;
  intensity: 'lieve' | 'moderata' | 'grave';
  criterio?: 'assoluto' | 'crudo' | 'cotto';
}

export interface SubProfile {
  id: number;
  name: string;
  relationship: string;
  photo_uri?: string | null;
  image_url?: string | null;
  custom_emoji?: string | null;
  custom_color?: string | null;
  allergens: SubProfileAllergen[];
  created_at: string;
}

export interface SubProfileIn {
  name: string;
  relationship: string;
  photo_uri?: string | null;
  image_url?: string | null;
  custom_emoji?: string | null;
  custom_color?: string | null;
  allergens: {
    code: string;
    intensity: 'lieve' | 'moderata' | 'grave';
    criterio?: 'assoluto' | 'crudo' | 'cotto';
  }[];
}

export interface ProfileShare {
  id: number;
  token: string;
  label: string;
  scope: '24h' | 'permanent';
  expires_at: string | null;
  created_at: string;
  share_url: string;
  delivered_in_app?: boolean;
  recipient_display_name?: string | null;
}

export interface AppContactMatch {
  user_id: number;
  display_name: string | null;
  email: string;
  email_hint: string;
}

export interface RecentAppContact extends AppContactMatch {
  last_shared_at: string;
}

export interface SharedProfile {
  token: string;
  label: string;
  owner_display_name: string | null;
  profile_name: string;
  relationship: string;
  expires_at: string | null;
  allergens: SubProfileAllergen[];
}

