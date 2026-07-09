import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../store/session';
import type {
  Allergen,
  BusinessPlan,
  CustomerPlan,
  CustomerAnnotation,
  Menu,
  MenuValutato,
  PiattoIn,
  Plan,
  ProfileShare,
  Restaurant,
  RestaurantSummary,
  FavoriteItem,
  SharedProfile,
  SubProfile,
  SubProfileIn,
} from '../types';

// Su dispositivo fisico imposta EXPO_PUBLIC_API_URL=http://<IP-del-tuo-Mac>:8000
export const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const getWebUrl = () => {
  if (API.includes('localhost')) return 'http://localhost:5173';
  if (API.includes('127.0.0.1')) return 'http://127.0.0.1:5173';
  return API.replace(':8000', ':5173');
};
export const WEB_URL = getWebUrl();

export interface UserProfile {
  id: number;
  email: string;
  display_name: string | null;
  role: string;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  health_data_consent_at: string | null;
  legal_terms_version: string | null;
  privacy_version: string | null;
  disclaimer_accepted_at: string | null;
  safety_disclaimer_version: string | null;
  onboarding_completed_at: string | null;
  legal_consents_ok: boolean;
  disclaimer_accepted: boolean;
  onboarding_completed: boolean;
  apple_health_connected: number;
  emergency_medicines: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  invite_code?: string | null;
  customer_plan?: 'customer_free' | 'customer_plus';
  customer_subscription_status?: string;
  has_customer_plus?: boolean;
}

export interface ReferralStats {
  invite_code: string | null;
  referrals_count: number;
  customer_plan: 'customer_free' | 'customer_plus';
  customer_subscription_status: string;
  has_plus: boolean;
  reward_message?: string | null;
}

interface RegisterConsents {
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_health_data?: boolean;
  accept_owner_responsibility?: boolean;
}

export interface MedicalDocument {
  id: number;
  filename: string;
  mime_type: string;
  status: 'pending' | 'processed' | 'failed';
  ai_consent_at: string | null;
  uploaded_at: string;
  url: string | null; // signed URL breve, presente solo su /download
}

export interface Extraction {
  id: number;
  allergen_code: string;
  confidence: number | null;
  applied: number;
}

export interface ExtractionResult {
  document_id: number;
  status: string;
  extractions: Extraction[];
  remaining_this_month: number;
  note: string;
}

export interface Review {
  id: number;
  restaurant_id: number;
  rating: number;
  rating_staff?: number | null;
  rating_menu?: number | null;
  rating_safety?: number | null;
  comment: string | null;
  author_name: string;
  is_mine: boolean;
  reply: string | null;
  created_at: string;
  source?: 'google' | 'tripadvisor' | null;
}

export interface AppNotification {
  id: number;
  type: string;
  payload_json: string | null;
  read_at: string | null;
  created_at: string;
}

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Richiesta scaduta: il server non ha risposto entro 15 secondi.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useSession.getState().token;
  const language = useSession.getState().language || 'it';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(init.headers as Record<string, string>),
  };
  if (init.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API}${path}`, { ...init, headers });
  } catch (e) {
    if (e instanceof Error && e.message.includes('scaduta')) throw e;
    throw new Error(
      `Server non raggiungibile (${API}).\n` +
      'Controlla che il backend sia avviato sul computer e che il telefono sia ' +
      'sulla stessa rete Wi-Fi. Avvia l\'app con:\n' +
      'EXPO_PUBLIC_API_URL=http://<IP-del-Mac>:8000 npx expo start',
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  /* ---------- auth ---------- */
  register: (
    email: string,
    password: string,
    role: 'customer' | 'owner' = 'customer',
    displayName?: string,
    consents?: RegisterConsents,
  ) =>
    req<{ access_token: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, display_name: displayName, ...consents }),
    }),
  login: (email: string, password: string) =>
    req<{ access_token: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    req<{ detail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    req<{ detail: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  /* ---------- cliente ---------- */
  listRestaurants: () => req<Menu[]>('/restaurants'),
  listRestaurantsSummary: () => req<RestaurantSummary[]>('/restaurants/summary'),
  allergens: () => req<Allergen[]>('/allergens'),
  myAllergens: () => req<Allergen[]>('/profile/allergens'),
  saveAllergens: (codes: string[], intensities: Record<string, 'lieve'|'moderata'|'grave'> = {}) =>
    req<Allergen[]>('/profile/allergens', {
      method: 'PUT',
      body: JSON.stringify({
        allergen_codes: codes,
        allergens: codes.map(c => ({ code: c, intensity: intensities[c] || 'moderata' }))
      }),
    }),
  acceptLegalConsents: (acceptHealthData = true) =>
    req<UserProfile>('/profile/legal-consents', {
      method: 'POST',
      body: JSON.stringify({
        accept_terms: true,
        accept_privacy: true,
        accept_health_data: acceptHealthData,
      }),
    }),
  acceptDisclaimer: () => req<void>('/profile/disclaimer', { method: 'POST' }),
  getSubProfiles: () => req<SubProfile[]>('/profile/sub-profiles'),
  createSubProfile: (data: SubProfileIn) =>
    req<SubProfile>('/profile/sub-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubProfile: (pid: number, data: SubProfileIn) =>
    req<SubProfile>(`/profile/sub-profiles/${pid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubProfile: (pid: number) =>
    req<{ detail: string }>(`/profile/sub-profiles/${pid}`, {
      method: 'DELETE',
    }),
  createProfileShare: (
    profileId: number | null,
    duration: '24h' | 'permanent',
    label?: string,
    recipientUserId?: number,
    recipientEmail?: string,
  ) =>
    req<ProfileShare>('/profile/shares', {
      method: 'POST',
      body: JSON.stringify({
        profile_id: profileId,
        duration,
        label,
        recipient_user_id: recipientUserId ?? null,
        recipient_email: recipientEmail ?? null,
      }),
    }),
  lookupAppContacts: (emails: string[]) =>
    req<{ matches: import('../types').AppContactMatch[] }>('/profile/contacts/lookup', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    }),
  getRecentAppContacts: () =>
    req<import('../types').RecentAppContact[]>('/profile/contacts/recent'),
  getSharedProfile: (token: string) => req<SharedProfile>(`/profile/shares/${token}`),
  menu: async (codice: string) => {
    const res = await req<Menu>(`/restaurants/${codice}/menu`);
    try {
      await AsyncStorage.setItem(`menu_cache_${codice}`, JSON.stringify(res));
    } catch (e) {
      console.warn("Errore salvataggio cache menù:", e);
    }
    return res;
  },
  evaluateMenu: (codice: string, allergenCodes: string[], excludedIngredients: string[] = []) =>
    req<MenuValutato>(`/restaurants/${codice}/menu/evaluate`, {
      method: 'POST',
      body: JSON.stringify({
        allergen_codes: allergenCodes,
        excluded_ingredients: excludedIngredients,
      }),
    }),
  getProfile: () => req<UserProfile>('/profile'),
  getReferralStats: () => req<import('../types').ReferralStats>('/profile/referral'),
  updateAppleHealth: (
    apple_health_connected: number,
    emergency_medicines: string | null,
    emergency_contact_name: string | null,
    emergency_contact_phone: string | null
  ) =>
    req<{ id: number; apple_health_connected: number; emergency_medicines: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null }>('/profile/apple-health', {
      method: 'PUT',
      body: JSON.stringify({ apple_health_connected, emergency_medicines, emergency_contact_name, emergency_contact_phone }),
    }),
  getDocuments: () => req<{ id: number; filename: string; file_path: string; status: string; created_at: string }[]>('/profile/documents'),
  uploadDocument: (fileUri: string, filename: string) => {
    const fd = new FormData();
    fd.append('file', {
      uri: fileUri,
      name: filename,
      type: 'application/pdf',
    } as any);
    return req<{ id: number; filename: string; file_path: string; status: string; created_at: string }>('/profile/upload-document', {
      method: 'POST', body: fd,
    });
  },

  /* ---------- foto profilo ---------- */
  uploadProfilePhoto: (fileUri: string, mimeType = 'image/jpeg') => {
    const fd = new FormData();
    fd.append('file', { uri: fileUri, name: 'avatar.jpg', type: mimeType } as any);
    return req<{ photo_url: string }>('/profile/photo', { method: 'POST', body: fd });
  },
  getProfilePhoto: () => req<{ photo_url: string }>('/profile/photo'),

  /* ---------- documenti medici + estrazione AI ---------- */
  listMedicalDocuments: () => req<MedicalDocument[]>('/profile/medical-documents'),
  uploadMedicalDocument: (fileUri: string, filename: string, mimeType: string, aiConsent: boolean) => {
    const fd = new FormData();
    fd.append('file', { uri: fileUri, name: filename, type: mimeType } as any);
    fd.append('ai_consent', aiConsent ? 'true' : 'false');
    return req<MedicalDocument>('/profile/medical-documents', { method: 'POST', body: fd });
  },
  extractAllergens: (docId: number) =>
    req<ExtractionResult>(`/profile/medical-documents/${docId}/extract`, { method: 'POST' }),
  confirmExtraction: (docId: number, codes: string[]) =>
    req<Allergen[]>('/profile/allergens/confirm-extraction', {
      method: 'POST',
      body: JSON.stringify({ document_id: docId, allergen_codes: codes }),
    }),
  downloadMedicalDocument: (docId: number) =>
    req<MedicalDocument>(`/profile/medical-documents/${docId}/download`),
  deleteMedicalDocument: (docId: number) =>
    req<void>(`/profile/medical-documents/${docId}`, { method: 'DELETE' }),

  /* ---------- preferiti server-side + recensioni ---------- */
  myFavorites: () => req<FavoriteItem[]>('/restaurants/favorites/mine'),
  addFavorite: (code: string) => req<void>(`/restaurants/${code}/favorite`, { method: 'POST' }),
  removeFavorite: (code: string) => req<void>(`/restaurants/${code}/favorite`, { method: 'DELETE' }),
  listReviews: (code: string) => req<Review[]>(`/restaurants/${code}/reviews`),
  upsertReview: (code: string, rating: number, comment: string, ratingStaff?: number, ratingMenu?: number, ratingSafety?: number) =>
    req<Review>(`/restaurants/${code}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment, rating_staff: ratingStaff, rating_menu: ratingMenu, rating_safety: ratingSafety }),
    }),
  listExternalReviews: (code: string) => req<Review[]>(`/restaurants/${code}/external-reviews`),
  replyToReview: (reviewId: number, reply: string) =>
    req<Review>(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  /* ---------- notifiche ---------- */
  registerDeviceToken: (expoToken: string) =>
    req<void>('/profile/device-token', {
      method: 'POST',
      body: JSON.stringify({ expo_token: expoToken }),
    }),
  listNotifications: () => req<AppNotification[]>('/profile/notifications'),
  markNotificationRead: (id: number) =>
    req<void>(`/profile/notifications/${id}/read`, { method: 'POST' }),

  /* ---------- documenti legali ---------- */
  legalDoc: (doc: string) =>
    req<{ doc: string; title: string; version: string; content_markdown: string }>(`/legal/${doc}`),

  /* ---------- cancellazione account (GDPR) ---------- */
  deleteAccount: () => req<void>('/profile', { method: 'DELETE' }),

  /* ---------- ristoratore ---------- */
  myRestaurants: () => req<Restaurant[]>('/admin/restaurants'),
  createRestaurant: (name: string, city: string, inviteCode?: string) =>
    req<Restaurant>('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify({
        name,
        city,
        ...(inviteCode?.trim() ? { invite_code: inviteCode.trim() } : {}),
      }),
    }),

  /* ---------- piani / abbonamento ristoratore ---------- */
  getPlans: () => req<Plan[]>('/billing/plans'),
  getCustomerPlans: () => req<CustomerPlan[]>('/billing/customer-plans'),
  customerCheckout: () =>
    req<{ checkout_url: string }>('/billing/customer-checkout', { method: 'POST' }),
  customerPortal: () =>
    req<{ portal_url: string }>('/billing/customer-portal', { method: 'POST' }),
  recordBarcodeScan: () =>
    req<{ allowed: boolean; remaining: number | null; limit: number | null }>('/profile/barcode-scan', {
      method: 'POST',
    }),
  barcodeScansRemaining: () =>
    req<{ allowed: boolean; remaining: number | null; limit: number | null }>('/profile/barcode-scan/remaining'),
  startTrial: (restaurantId: number, plan: BusinessPlan) =>
    req<Restaurant>('/billing/start-trial', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, plan }),
    }),
  billingCheckout: (restaurantId: number, plan: BusinessPlan) =>
    req<{ checkout_url: string }>('/billing/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, plan }),
    }),
  billingPortal: (restaurantId: number) =>
    req<{ portal_url: string }>('/billing/portal-session', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    }),
  billingBoost: (restaurantId: number) =>
    req<{ checkout_url?: string; activated?: boolean; message?: string }>('/billing/boost', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    }),
  listBoosts: (restaurantId: number) =>
    req<import('../types').VisibilityBoost[]>(`/billing/boosts/${restaurantId}`),
  billingFollowersCount: (restaurantId: number) =>
    req<{ count: number }>(`/billing/followers-count/${restaurantId}`),
  billingSendNotification: (restaurantId: number, title: string, body: string) =>
    req<{ sent_count: number; message: string }>('/billing/send-notification', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, title, body }),
    }),
  billingInvoices: (restaurantId: number) =>
    req<{ id: number; stripe_invoice_id: string; amount_cents: number; status: string; pdf_url: string | null; created_at: string }[]>(
      `/billing/invoices/${restaurantId}`,
    ),
  getRestaurantAnalytics: (restaurantId: number) =>
    req<{
      restaurant_id: number;
      total_views: number;
      total_allergen_queries: number;
      distribution: { code: string; name: string; emoji: string; count: number }[];
      time_series: { date: string; count: number }[];
    }>(`/admin/restaurants/${restaurantId}/analytics`),
  menuAudit: (restaurantId: number) =>
    req<{
      id: number; action: string; menu_version: number; note: string | null; created_at: string;
    }[]>(`/admin/restaurants/${restaurantId}/menu/audit`),
  saveMenu: (rid: number, piatti: PiattoIn[]) =>
    req<unknown>(`/admin/restaurants/${rid}/menu`, {
      method: 'PUT',
      body: JSON.stringify({ piatti, replace: true }),
    }),
  approve: (rid: number, legalAcknowledged: boolean) =>
    req<Restaurant>(`/admin/restaurants/${rid}/approve`, {
      method: 'POST',
      body: JSON.stringify({ legal_acknowledged: legalAcknowledged }),
    }),
  listAnnotations: (code: string) => req<CustomerAnnotation[]>(`/restaurants/${code}/annotations`),
  createAnnotation: (code: string, allergenId: number, ingredient: string | null, notes: string) =>
    req<CustomerAnnotation>(`/restaurants/${code}/annotations`, {
      method: 'POST',
      body: JSON.stringify({ allergen_id: allergenId, ingredient, notes }),
    }),
  updateRestaurant: (rid: number, data: Partial<Restaurant>) =>
    req<Restaurant>(`/admin/restaurants/${rid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  analyze: (formData: FormData) =>
    req<{ ai_stub: boolean; note: string; piatti: PiattoIn[] }>('/admin/menu/analyze', {
      method: 'POST',
      body: formData,
    }),
  analyzeUrl: (url: string) =>
    req<{ ai_stub: boolean; note: string; piatti: PiattoIn[] }>('/admin/menu/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  uploadImage: (formData: FormData) =>
    req<{ url: string }>('/admin/upload-image', {
      method: 'POST',
      body: formData,
    }),
  uploadRestaurantPhoto: (rid: number, formData: FormData) =>
    req<{ id: number; url: string; is_cover: boolean; sort_order: number }>(`/admin/restaurants/${rid}/photos`, {
      method: 'POST',
      body: formData,
    }),
  listRestaurantPhotos: (rid: number) =>
    req<{ id: number; url: string; is_cover: boolean; sort_order: number }[]>(`/admin/restaurants/${rid}/photos`),
  setCoverPhoto: (rid: number, photoId: number) =>
    req<{ id: number; url: string; is_cover: boolean; sort_order: number }[]>(`/admin/restaurants/${rid}/photos/${photoId}/cover`, {
      method: 'POST',
    }),
  deleteRestaurantPhoto: (rid: number, photoId: number) =>
    req<unknown>(`/admin/restaurants/${rid}/photos/${photoId}`, {
      method: 'DELETE',
    }),
};
