import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { useSession } from '../store/session';

const PUSH_TOKEN_STORAGE_KEY = 'allertgy-expo-push-token';

/** Sincronizza le allergie dell'utente dal server allo store locale di sessione. */
export async function syncUserAllergensFromServer() {
  try {
    const token = useSession.getState().token;
    if (!token) return;
    const mine = await api.myAllergens();
    const intensitiesMap: Record<string, 'lieve' | 'moderata' | 'grave'> = {};
    const criteriaMap: Record<string, 'assoluto' | 'crudo' | 'cotto'> = {};
    mine.forEach((a) => {
      if (a.intensity) {
        intensitiesMap[a.code] = a.intensity as 'lieve' | 'moderata' | 'grave';
      }
      if (a.criterio) {
        criteriaMap[a.code] = a.criterio as 'assoluto' | 'crudo' | 'cotto';
      }
    });
    useSession.getState().setAllergie(
      mine.map((a) => a.code),
      intensitiesMap,
      criteriaMap
    );
  } catch {
    // offline fallback
  }
}

/** Rimuove il token push e azzera la sessione locale. */
export async function logoutAndCleanup() {
  try {
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (stored) {
      await api.unregisterDeviceToken(stored);
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // logout comunque
  }
  useSession.getState().logout();
}

