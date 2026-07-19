import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScannedProduct } from './barcodeScan';
import { useExperienceMood } from '../store/experienceMood';

const HISTORY_KEY = 'allertgy-scan-history';
const FAVORITES_KEY = 'allertgy-product-favorites';

export async function loadScanHistory(): Promise<ScannedProduct[]> {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveToScanHistory(prod: ScannedProduct): Promise<ScannedProduct[]> {
  const history = await loadScanHistory();
  const updated = [prod, ...history.filter((h) => h.barcode !== prod.barcode)].slice(0, 15);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  useExperienceMood.getState().setFromScan(prod.status);
  return updated;
}

export async function loadProductFavorites(): Promise<ScannedProduct[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function toggleProductFavorite(prod: ScannedProduct): Promise<ScannedProduct[]> {
  const favorites = await loadProductFavorites();
  const isFav = favorites.some((f) => f.barcode === prod.barcode);
  const updated = isFav
    ? favorites.filter((f) => f.barcode !== prod.barcode)
    : [prod, ...favorites];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export async function findCachedProduct(barcode: string): Promise<ScannedProduct | null> {
  const favorites = await loadProductFavorites();
  const fromFav = favorites.find((p) => p.barcode === barcode);
  if (fromFav) return fromFav;
  const history = await loadScanHistory();
  return history.find((p) => p.barcode === barcode) ?? null;
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export function productStatusLabel(status: ScannedProduct['status'], isIt: boolean): string {
  if (status === 'verde') return isIt ? 'Sicuro' : 'Safe';
  if (status === 'giallo') return isIt ? 'Attenzione' : 'Caution';
  return isIt ? 'Non idoneo' : 'Not eligible';
}
