import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AllergyCriterio, AllergyIntensity, SubProfile } from '../types';

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
  allergyIntensities: Record<string, AllergyIntensity>;
  /** criterio forma per ogni allergia (es. { uova: 'crudo' }) */
  allergyCriteria: Record<string, AllergyCriterio>;
  /** consensi minimi per usare un account cliente con dati allergie */
  legalAccepted: boolean;
  healthDataConsent: boolean;
  /** profilo allergie completato anche quando l'utente dichiara nessuna allergia */
  profileCompleted: boolean;
  disclaimerAccepted: boolean;
  /** tour guidato post-onboarding completato (cliente o ristoratore) */
  tourCompleted: boolean;
  /** cliente in fase registrazione — passo allergie dedicato */
  registerAllergieStep: boolean;
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
  /** profili familiari del cliente */
  subProfiles: SubProfile[];
  /** id del profilo selezionato per la scansione (null = default utente) */
  activeProfileId: number | null;
  /** URL firmato foto profilo principale (non persistito a lungo — refresh on load) */
  profilePhotoUrl: string | null;
  setToken: (t: string | null) => void;
  setEmail: (e: string | null) => void;
  setRole: (r: Role) => void;
  setAllergie: (
    a: string[],
    intensities?: Record<string, AllergyIntensity>,
    criteria?: Record<string, AllergyCriterio>,
  ) => void;
  setLegalStatus: (legalAccepted: boolean, healthDataConsent: boolean) => void;
  setProfileCompleted: (v: boolean) => void;
  setDisclaimer: (v: boolean) => void;
  setTourCompleted: (v: boolean) => void;
  setRegisterAllergieStep: (v: boolean) => void;
  addRecent: (code: string, name: string) => void;
  toggleFavorite: (code: string, name: string) => void;
  setFavorites: (favorites: RecentPlace[]) => void;
  isFavorite: (code: string) => boolean;
  setLanguage: (lang: string) => void;
  setEmergencyMedicines: (m: string | null) => void;
  setEmergencyContact: (name: string | null, phone: string | null) => void;
  setIngredientiEsclusi: (ings: string[]) => void;
  setSubProfiles: (profiles: SubProfile[]) => void;
  setActiveProfileId: (id: number | null) => void;
  setProfilePhotoUrl: (url: string | null) => void;
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
      allergyCriteria: {},
      legalAccepted: false,
      healthDataConsent: false,
      profileCompleted: false,
      disclaimerAccepted: false,
      tourCompleted: false,
      registerAllergieStep: false,
      recents: [],
      favorites: [],
      language: 'it',
      languageSelected: false,
      emergencyMedicines: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      ingredientiEsclusi: [],
      subProfiles: [],
      activeProfileId: null,
      profilePhotoUrl: null,
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }),
      setRole: (role) => set({ role }),
      setAllergie: (allergie, allergyIntensities, allergyCriteria) => set((state) => ({
        allergie,
        allergyIntensities: allergyIntensities || state.allergyIntensities,
        allergyCriteria: allergyCriteria || state.allergyCriteria,
      })),
      setLegalStatus: (legalAccepted, healthDataConsent) => set({ legalAccepted, healthDataConsent }),
      setProfileCompleted: (profileCompleted) => set({ profileCompleted }),
      setDisclaimer: (disclaimerAccepted) => set({ disclaimerAccepted }),
      setTourCompleted: (tourCompleted) => set({ tourCompleted }),
      setRegisterAllergieStep: (registerAllergieStep) => set({ registerAllergieStep }),
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
      setFavorites: (favorites) => set({ favorites }),
      isFavorite: (code) => get().favorites.some((f) => f.code === code),
      setLanguage: (language) => set({ language, languageSelected: true }),
      setEmergencyMedicines: (emergencyMedicines) => set({ emergencyMedicines }),
      setEmergencyContact: (emergencyContactName, emergencyContactPhone) => set({ emergencyContactName, emergencyContactPhone }),
      setIngredientiEsclusi: (ingredientiEsclusi) => set({ ingredientiEsclusi }),
      setSubProfiles: (subProfiles) => set({ subProfiles }),
      setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
      setProfilePhotoUrl: (profilePhotoUrl) => set({ profilePhotoUrl }),
      logout: () =>
        set({
          token: null, email: null, role: 'customer', allergie: [], allergyIntensities: {}, allergyCriteria: {},
          legalAccepted: false, healthDataConsent: false, profileCompleted: false,
          disclaimerAccepted: false, tourCompleted: false, registerAllergieStep: false, recents: [], favorites: [], language: 'it', languageSelected: false,
          emergencyMedicines: null, emergencyContactName: null, emergencyContactPhone: null, ingredientiEsclusi: [],
          subProfiles: [], activeProfileId: null, profilePhotoUrl: null,
        }),
    }),
    {
      name: 'allertgy-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { profilePhotoUrl: _photo, ...rest } = state;
        return rest;
      },
    },
  ),
);
