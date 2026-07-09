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
