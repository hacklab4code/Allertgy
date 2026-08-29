import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScannedProduct } from './barcodeScan';
import { useExperienceMood } from '../store/experienceMood';

const HISTORY_KEY = 'allertgy-scan-history';
const FAVORITES_KEY = 'allertgy-product-favorites';
const PANTRY_KEY = 'allertgy-pantry-items';
const MEDS_REMINDERS_KEY = 'allertgy-meds-reminders';

export interface PantryItem extends ScannedProduct {
  addedAt: string;
  assignedProfileId?: number | null; // null = per tutta la famiglia, oppure id specifico del sottoprofilo
  notes?: string;
}

export interface MedsReminder {
  id: string;
  name: string; // es. "EpiPen Autoiniettore 0.3mg", "Fastjekt Bambini"
  expiryDate: string; // YYYY-MM-DD
  assignedTo: string; // es. "Sofia", "Leo"
  lotNumber?: string;
  notes?: string;
}

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

export async function loadPantryItems(): Promise<PantryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(PANTRY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function savePantryItem(item: PantryItem): Promise<PantryItem[]> {
  const pantry = await loadPantryItems();
  const exists = pantry.some((p) => p.barcode === item.barcode);
  const updated = exists
    ? pantry.map((p) => (p.barcode === item.barcode ? item : p))
    : [item, ...pantry];
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(updated));
  return updated;
}

export async function removePantryItem(barcode: string): Promise<PantryItem[]> {
  const pantry = await loadPantryItems();
  const updated = pantry.filter((p) => p.barcode !== barcode);
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadMedsReminders(): Promise<MedsReminder[]> {
  try {
    const stored = await AsyncStorage.getItem(MEDS_REMINDERS_KEY);
    if (stored) return JSON.parse(stored);
    // Initial sample reminder
    const initial: MedsReminder[] = [
      {
        id: '1',
        name: 'EpiPen Autoiniettore (Adrenalina 0.3mg)',
        expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Principale',
        notes: 'Conservare a temperatura ambiente (15-25°C)',
      },
    ];
    await AsyncStorage.setItem(MEDS_REMINDERS_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

export async function saveMedsReminder(reminder: MedsReminder): Promise<MedsReminder[]> {
  const reminders = await loadMedsReminders();
  const exists = reminders.some((r) => r.id === reminder.id);
  const updated = exists
    ? reminders.map((r) => (r.id === reminder.id ? reminder : r))
    : [reminder, ...reminders];
  await AsyncStorage.setItem(MEDS_REMINDERS_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteMedsReminder(id: string): Promise<MedsReminder[]> {
  const reminders = await loadMedsReminders();
  const updated = reminders.filter((r) => r.id !== id);
  await AsyncStorage.setItem(MEDS_REMINDERS_KEY, JSON.stringify(updated));
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
