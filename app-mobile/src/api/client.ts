import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../store/session';
import type { Allergen, Menu, MenuValutato, PiattoIn, Restaurant } from '../types';

// Su dispositivo fisico imposta EXPO_PUBLIC_API_URL=http://<IP-del-tuo-Mac>:8000
export const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

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
}

interface RegisterConsents {
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_health_data?: boolean;
  accept_owner_responsibility?: boolean;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useSession.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (init.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
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

  /* ---------- cliente ---------- */
  listRestaurants: () => req<Menu[]>('/restaurants'),
  allergens: () => req<Allergen[]>('/allergens'),
  myAllergens: () => req<Allergen[]>('/profile/allergens'),
  saveAllergens: (codes: string[]) =>
    req<Allergen[]>('/profile/allergens', {
      method: 'PUT',
      body: JSON.stringify({ allergen_codes: codes }),
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
  updateAppleHealth: (apple_health_connected: number, emergency_medicines: string | null) =>
    req<{ id: number; apple_health_connected: number; emergency_medicines: string | null }>('/profile/apple-health', {
      method: 'PUT', body: JSON.stringify({ apple_health_connected, emergency_medicines }),
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

  /* ---------- ristoratore ---------- */
  myRestaurants: () => req<Restaurant[]>('/admin/restaurants'),
  createRestaurant: (name: string, city: string) =>
    req<Restaurant>('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify({ name, city }),
    }),
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
};
