import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { useSession } from '../store/session';

const PUSH_TOKEN_STORAGE_KEY = 'allertgy-expo-push-token';

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
