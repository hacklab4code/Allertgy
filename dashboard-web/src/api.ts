export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface Allergen { id: number; code: string; name_it: string; emoji: string | null; is_diet: number }
export interface DishIn {
  nome_piatto: string; descrizione?: string | null; categoria?: string | null;
  prezzo_cents?: number | null; image_url?: string | null; menu_group?: string | null;
  allergeni_contenuti: string[]; allergeni_tracce: string[];
}
export interface Restaurant {
  id: number; public_code: string; name: string; city: string | null;
  slug?: string | null; website?: string | null; description?: string | null;
  is_active?: number;
  address?: string | null; phone?: string | null; email_contact?: string | null;
  opening_hours?: string | null; image_url?: string | null; menu_updated_at: string | null;
  latitude?: number | null; longitude?: number | null;
  menu_version?: number; menu_legal_confirmed_at?: string | null; menu_legal_version?: string | null;
  business_plan?: BusinessPlan; subscription_status?: SubscriptionStatus; plan_price_cents?: number;
  is_verified?: number; featured_priority?: number; plan_started_at?: string | null; trial_ends_at?: string | null;
  billing_email?: string | null; vat_number?: string | null; sdi_code?: string | null;
  pec_email?: string | null; commercial_notes?: string | null; created_at?: string | null;
}

export interface UserProfile {
  id: number; email: string; display_name: string | null; role: string;
  terms_accepted_at: string | null; privacy_accepted_at: string | null;
  health_data_consent_at: string | null; legal_terms_version: string | null;
  privacy_version: string | null; disclaimer_accepted_at: string | null;
  safety_disclaimer_version: string | null; onboarding_completed_at: string | null;
  legal_consents_ok: boolean; disclaimer_accepted: boolean; onboarding_completed: boolean;
  apple_health_connected: number; emergency_medicines: string | null;
}

export interface RegisterConsents {
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_health_data?: boolean;
  accept_owner_responsibility?: boolean;
}

let token = localStorage.getItem('allertgy_token') ?? '';
export const setToken = (t: string) => { token = t; localStorage.setItem('allertgy_token', t); };
export const clearToken = () => { token = ''; localStorage.removeItem('allertgy_token'); };
export const hasToken = () => !!token;

let internalAdminKey = localStorage.getItem('allertgy_internal_admin_key') ?? '';
export const setInternalAdminKey = (t: string) => { internalAdminKey = t; localStorage.setItem('allertgy_internal_admin_key', t); };
export const clearInternalAdminKey = () => { internalAdminKey = ''; localStorage.removeItem('allertgy_internal_admin_key'); };
export const hasInternalAdminKey = () => !!internalAdminKey;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (internalAdminKey) headers['X-Admin-Key'] = internalAdminKey;
  if (init.body && typeof init.body === 'string') headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      `Impossibile contattare il server AllerTgy (${API}). ` +
      'Verifica che il backend sia avviato: apri il Terminale nella cartella backend ed esegui ' +
      '"source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0". ' +
      `Poi controlla che ${API}/docs si apra nel browser.`,
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export interface DishOut extends DishIn { id: number }
export interface MenuOut {
  restaurant_id: number; public_code: string; nome_ristorante: string; citta: string | null;
  aggiornato_il: string | null; menu_version?: number; menu_legal_confirmed_at?: string | null;
  menu_legal_version?: string | null; safety_notice?: string; piatti: DishOut[];
  latitude?: number | null; longitude?: number | null; image_url?: string | null;
}

export type BusinessPlan = 'free' | 'verified' | 'pro' | 'premium';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'comped';

export interface PlanDefinition {
  code: BusinessPlan;
  name: string;
  price_cents: number;
  tagline: string;
  features: string[];
}

export interface InternalSummary {
  total_users: number;
  total_customers: number;
  total_owners: number;
  total_restaurants: number;
  active_restaurants: number;
  published_menus: number;
  paid_restaurants: number;
  monthly_recurring_cents: number;
  plans: PlanDefinition[];
  restaurants_by_plan: Record<string, number>;
  restaurants_by_status: Record<string, number>;
}

export interface InternalRestaurant extends Restaurant {
  owner_email: string | null;
  owner_display_name: string | null;
  dish_count: number;
}

export interface InternalUser {
  id: number;
  email: string;
  display_name: string | null;
  role: 'customer' | 'owner';
  created_at: string;
  restaurant_count: number;
  legal_consents_ok: boolean;
  onboarding_completed: boolean;
}

export type InternalRestaurantBusinessPatch = Partial<Pick<
  Restaurant,
  'business_plan' | 'subscription_status' | 'plan_price_cents' | 'is_active' | 'is_verified' |
  'featured_priority' | 'trial_ends_at' | 'billing_email' | 'vat_number' | 'sdi_code' |
  'pec_email' | 'commercial_notes'
>>;

export interface DishEvaluationOut {
  dish_id: number;
  status: 'verde' | 'giallo' | 'rosso';
  label: 'compatibile' | 'attenzione_tracce' | 'non_idoneo';
  match_contenuti: string[];
  match_tracce: string[];
  match_esclusi: string[];
}

export interface MenuEvaluationOut extends MenuOut {
  evaluation: DishEvaluationOut[];
}

export interface Photo { id: number; url: string; is_cover: boolean; sort_order: number }

export interface PublicRestaurant {
  public_code: string; slug: string | null; name: string; city: string | null;
  address: string | null; latitude: number | null; longitude: number | null;
  phone: string | null; website: string | null; description: string | null;
  opening_hours: string | null; image_url: string | null; photos: Photo[];
  business_plan: BusinessPlan; is_verified: boolean;
  rating_avg: number | null; rating_count: number;
  menu_available: boolean; piatti: DishOut[]; safety_notice: string;
}

export interface Review {
  id: number; restaurant_id: number; rating: number; comment: string | null;
  author_name: string; is_mine: boolean; reply: string | null; created_at: string;
}

export interface InternalReview {
  id: number; restaurant_id: number; restaurant_name: string; user_email: string;
  rating: number; comment: string | null; is_hidden: boolean;
  hidden_reason: string | null; reported_count: number; created_at: string;
}

export interface LegalDoc { doc: string; title: string; version: string; content_markdown: string }

export interface InvoiceRow {
  id: number; stripe_invoice_id: string; amount_cents: number; status: string;
  pdf_url: string | null; created_at: string;
}

export const api = {
  listRestaurants: () => req<MenuOut[]>('/restaurants'),
  publicMenu: (code: string) => req<MenuOut>(`/restaurants/${code}/menu`),
  evaluateMenu: (code: string, allergenCodes: string[], excludedIngredients: string[] = []) =>
    req<MenuEvaluationOut>(`/restaurants/${code}/menu/evaluate`, {
      method: 'POST',
      body: JSON.stringify({
        allergen_codes: allergenCodes,
        excluded_ingredients: excludedIngredients,
      }),
    }),
  register: (
    email: string,
    password: string,
    role: 'owner' | 'customer' = 'owner',
    display_name?: string,
    consents?: RegisterConsents,
  ) =>
    req<{ access_token: string; role: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, role, display_name, ...consents }),
    }),
  myAllergens: () => req<Allergen[]>('/profile/allergens'),
  saveAllergens: (codes: string[]) =>
    req<Allergen[]>('/profile/allergens', {
      method: 'PUT', body: JSON.stringify({ allergen_codes: codes }),
    }),
  getProfile: () => req<UserProfile>('/profile'),
  updateAppleHealth: (apple_health_connected: number, emergency_medicines: string | null) =>
    req<{ id: number; apple_health_connected: number; emergency_medicines: string | null }>('/profile/apple-health', {
      method: 'PUT', body: JSON.stringify({ apple_health_connected, emergency_medicines }),
    }),
  getDocuments: () => req<{ id: number; filename: string; file_path: string; status: string; created_at: string }[]>('/profile/documents'),
  uploadDocument: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ id: number; filename: string; file_path: string; status: string; created_at: string }>('/profile/upload-document', {
      method: 'POST', body: fd,
    });
  },
  login: (email: string, password: string) =>
    req<{ access_token: string; role: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  allergens: () => req<Allergen[]>('/allergens'),
  myRestaurants: () => req<Restaurant[]>('/admin/restaurants'),
  createRestaurant: (name: string, city: string, address?: string, phone?: string, email_contact?: string, opening_hours?: string) =>
    req<Restaurant>('/admin/restaurants', { method: 'POST', body: JSON.stringify({ name, city, address, phone, email_contact, opening_hours }) }),
  updateRestaurant: (id: number, data: Partial<Restaurant>) =>
    req<Restaurant>(`/admin/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  analyze: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ ai_stub: boolean; note: string; piatti: DishIn[] }>('/admin/menu/analyze', {
      method: 'POST', body: fd,
    });
  },
  saveMenu: (rid: number, piatti: DishIn[]) =>
    req(`/admin/restaurants/${rid}/menu`, { method: 'PUT', body: JSON.stringify({ piatti, replace: true }) }),
  approve: (rid: number, legalAcknowledged: boolean) =>
    req<Restaurant>(`/admin/restaurants/${rid}/approve`, {
      method: 'POST',
      body: JSON.stringify({ legal_acknowledged: legalAcknowledged }),
    }),
  menuAudit: (rid: number) =>
    req<{
      id: number; restaurant_id: number; owner_user_id: number | null; action: string;
      menu_version: number; legal_version: string | null; snapshot_json: string | null;
      note: string | null; created_at: string;
    }[]>(`/admin/restaurants/${rid}/menu/audit`),
  downloadRegistryPdf: async (rid: number) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API}/admin/restaurants/${rid}/registry.pdf`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `Errore ${res.status}`);
    }
    return res.blob();
  },
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ url: string }>('/admin/upload-image', {
      method: 'POST',
      body: fd,
    });
  },
  // --- Recupero password ---
  forgotPassword: (email: string) =>
    req<{ detail: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (resetToken: string, newPassword: string) =>
    req<{ detail: string }>('/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token: resetToken, new_password: newPassword }),
    }),

  // --- Pagina pubblica + recensioni ---
  publicRestaurant: (codeOrSlug: string) => req<PublicRestaurant>(`/restaurants/${codeOrSlug}/public`),
  listReviews: (code: string) => req<Review[]>(`/restaurants/${code}/reviews`),
  upsertReview: (code: string, rating: number, comment: string) =>
    req<Review>(`/restaurants/${code}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  deleteMyReview: (code: string) =>
    req<void>(`/restaurants/${code}/reviews/mine`, { method: 'DELETE' }),
  reportReview: (id: number) => req<void>(`/reviews/${id}/report`, { method: 'POST' }),
  replyToReview: (id: number, reply: string) =>
    req<Review>(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),

  // --- Galleria foto locale ---
  listRestaurantPhotos: (rid: number) => req<Photo[]>(`/admin/restaurants/${rid}/photos`),
  uploadRestaurantPhoto: (rid: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<Photo>(`/admin/restaurants/${rid}/photos`, { method: 'POST', body: fd });
  },
  setCoverPhoto: (rid: number, photoId: number) =>
    req<Photo[]>(`/admin/restaurants/${rid}/photos/${photoId}/cover`, { method: 'POST' }),
  deleteRestaurantPhoto: (rid: number, photoId: number) =>
    req<void>(`/admin/restaurants/${rid}/photos/${photoId}`, { method: 'DELETE' }),

  // --- Billing Stripe ---
  billingCheckout: (restaurantId: number, plan: BusinessPlan) =>
    req<{ checkout_url: string }>('/billing/checkout-session', {
      method: 'POST', body: JSON.stringify({ restaurant_id: restaurantId, plan }),
    }),
  billingPortal: (restaurantId: number) =>
    req<{ portal_url: string }>('/billing/portal-session', {
      method: 'POST', body: JSON.stringify({ restaurant_id: restaurantId }),
    }),
  billingInvoices: (restaurantId: number) => req<InvoiceRow[]>(`/billing/invoices/${restaurantId}`),

  // --- Documenti legali ---
  legalDoc: (doc: string) => req<LegalDoc>(`/legal/${doc}`),

  // --- Moderazione recensioni (admin interno) ---
  internalReviews: () => req<InternalReview[]>('/internal-admin/reviews'),
  moderateReview: (id: number, isHidden: boolean, reason?: string) =>
    req<InternalReview>(`/internal-admin/reviews/${id}/moderate`, {
      method: 'PATCH', body: JSON.stringify({ is_hidden: isHidden, hidden_reason: reason ?? null }),
    }),
  internalDocumentAccessLog: () =>
    req<{ id: number; document_id: number; document_owner_user_id: number; accessed_by_user_id: number; accessed_at: string }[]>(
      '/internal-admin/document-access-log',
    ),

  internalPlans: () => req<PlanDefinition[]>('/internal-admin/plans'),
  internalSummary: () => req<InternalSummary>('/internal-admin/summary'),
  internalRestaurants: () => req<InternalRestaurant[]>('/internal-admin/restaurants'),
  internalUsers: () => req<InternalUser[]>('/internal-admin/users'),
  updateInternalRestaurantBusiness: (id: number, data: InternalRestaurantBusinessPatch) =>
    req<InternalRestaurant>(`/internal-admin/restaurants/${id}/business`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
