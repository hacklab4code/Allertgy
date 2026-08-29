import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Piatto } from '../types';

const FAVORITES_KEY = 'allertgy-dish-favorites';

export type FavoriteDish = {
  dish: Piatto;
  restaurantCode: string;
  restaurantName: string;
  savedAt: string;
};

export async function loadDishFavorites(): Promise<FavoriteDish[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function toggleDishFavorite(
  dish: Piatto,
  restaurantCode: string,
  restaurantName: string,
): Promise<FavoriteDish[]> {
  const favorites = await loadDishFavorites();
  const isFavorite = favorites.some(
    (item) => item.restaurantCode === restaurantCode && item.dish.id === dish.id,
  );
  const updated = isFavorite
    ? favorites.filter((item) => item.restaurantCode !== restaurantCode || item.dish.id !== dish.id)
    : [{ dish, restaurantCode, restaurantName, savedAt: new Date().toISOString() }, ...favorites];

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}
