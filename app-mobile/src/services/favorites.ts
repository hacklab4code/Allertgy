import { Alert } from 'react-native';
import { api } from '../api/client';
import { useSession } from '../store/session';

/** Sincronizza i preferiti dal server (fonte di verità al login). */
export async function syncFavoritesFromServer(): Promise<void> {
  const { token, setFavorites } = useSession.getState();
  if (!token) return;
  try {
    const favs = await api.myFavorites();
    setFavorites(
      favs.map((f) => ({
        code: f.public_code,
        name: f.name,
        visitedAt: new Date().toISOString(),
      })),
    );
  } catch (e) {
    console.log('Sync preferiti fallita:', e);
  }
}

/** Toggle ottimistico con rollback se la sync API fallisce. */
export async function toggleRestaurantFavorite(code: string, name: string): Promise<boolean> {
  const { token, toggleFavorite, isFavorite, language } = useSession.getState();
  const wasFav = isFavorite(code);
  toggleFavorite(code, name);
  if (!token) return true;

  try {
    if (wasFav) {
      await api.removeFavorite(code);
    } else {
      await api.addFavorite(code);
    }
    return true;
  } catch (e) {
    console.log('Toggle preferito fallito, rollback:', e);
    toggleFavorite(code, name);
    const isIt = (language || 'it').toLowerCase() === 'it';
    Alert.alert(
      isIt ? 'Preferiti' : 'Favorites',
      isIt
        ? 'Impossibile salvare il preferito. Controlla la connessione e riprova.'
        : 'Could not save favorite. Check your connection and try again.',
    );
    return false;
  }
}
