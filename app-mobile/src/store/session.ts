import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RecentPlace {
  code: string;
  name: string;
  visitedAt: string;
}

export type Role = 'customer' | 'owner';

interface SessionState {
  token: string | null;
  email: string | null;
  /** 'customer' = cliente, 'owner' = ristoratore */
  role: Role;
  /** codici allergene selezionati (es. ['glutine','latte']) */
  allergie: string[];
  /** intensità per ogni allergia selezionata (es. { glutine: 'grave' }) */
  allergyIntensities: Record<string, 'lieve' | 'moderata' | 'grave'>;
  /** consensi minimi per usare un account cliente con dati allergie */
  legalAccepted: boolean;
  healthDataConsent: boolean;
  /** profilo allergie completato anche quando l'utente dichiara nessuna allergia */
  profileCompleted: boolean;
  disclaimerAccepted: boolean;
  /** ultimi locali visitati */
  recents: RecentPlace[];
  /** locali salvati come preferiti */
  favorites: RecentPlace[];
  /** lingua selezionata dell'app */
  language: string;
  /** indica se l'utente ha scelto esplicitamente la lingua */
  languageSelected: boolean;
  /** farmaci salvavita dell'utente salvati offline */
  emergencyMedicines: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  /** ingredienti da evitare esclusi manualmente dall'utente */
  ingredientiEsclusi: string[];
  setToken: (t: string | null) => void;
  setEmail: (e: string | null) => void;
  setRole: (r: Role) => void;
  setAllergie: (a: string[], intensities?: Record<string, 'lieve' | 'moderata' | 'grave'>) => void;
  setLegalStatus: (legalAccepted: boolean, healthDataConsent: boolean) => void;
  setProfileCompleted: (v: boolean) => void;
  setDisclaimer: (v: boolean) => void;
  addRecent: (code: string, name: string) => void;
  toggleFavorite: (code: string, name: string) => void;
  isFavorite: (code: string) => boolean;
  setLanguage: (lang: string) => void;
  setEmergencyMedicines: (m: string | null) => void;
  setEmergencyContact: (name: string | null, phone: string | null) => void;
  setIngredientiEsclusi: (ings: string[]) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,
      role: 'customer',
      allergie: [],
      allergyIntensities: {},
      legalAccepted: false,
      healthDataConsent: false,
      profileCompleted: false,
      disclaimerAccepted: false,
      recents: [],
      favorites: [],
      language: 'it',
      languageSelected: false,
      emergencyMedicines: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      ingredientiEsclusi: [],
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }),
      setRole: (role) => set({ role }),
      setAllergie: (allergie, allergyIntensities) => set((state) => ({ 
        allergie, 
        allergyIntensities: allergyIntensities || state.allergyIntensities 
      })),
      setLegalStatus: (legalAccepted, healthDataConsent) => set({ legalAccepted, healthDataConsent }),
      setProfileCompleted: (profileCompleted) => set({ profileCompleted }),
      setDisclaimer: (disclaimerAccepted) => set({ disclaimerAccepted }),
      addRecent: (code, name) => {
        const others = get().recents.filter((r) => r.code !== code);
        set({
          recents: [{ code, name, visitedAt: new Date().toISOString() }, ...others].slice(0, 10),
        });
      },
      toggleFavorite: (code, name) => {
        const favs = get().favorites;
        set({
          favorites: favs.some((f) => f.code === code)
            ? favs.filter((f) => f.code !== code)
            : [{ code, name, visitedAt: new Date().toISOString() }, ...favs],
        });
      },
      isFavorite: (code) => get().favorites.some((f) => f.code === code),
      setLanguage: (language) => set({ language, languageSelected: true }),
      setEmergencyMedicines: (emergencyMedicines) => set({ emergencyMedicines }),
      setEmergencyContact: (emergencyContactName, emergencyContactPhone) => set({ emergencyContactName, emergencyContactPhone }),
      setIngredientiEsclusi: (ingredientiEsclusi) => set({ ingredientiEsclusi }),
      logout: () =>
        set({
          token: null, email: null, role: 'customer', allergie: [], allergyIntensities: {},
          legalAccepted: false, healthDataConsent: false, profileCompleted: false,
          disclaimerAccepted: false, recents: [], favorites: [], language: 'it', languageSelected: false, 
          emergencyMedicines: null, emergencyContactName: null, emergencyContactPhone: null, ingredientiEsclusi: [],
        }),
    }),
    {
      name: 'allertgy-session',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
