import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALLERGEN_KEYWORDS } from '../engine/offAllergens';
import { getAllergenName } from '../engine/translations';

const SHOPPING_LIST_KEY = 'allertgy-smart-shopping-list';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  warningAllergen?: string | null;
  addedAt: string;
}

export function checkItemAllergenWarning(
  name: string,
  userAllergens: readonly string[],
  isIt: boolean = true
): string | null {
  const cleanName = name.toLowerCase().trim();
  if (!cleanName) return null;

  for (const allergen of userAllergens) {
    const code = allergen.toLowerCase().trim();
    const keywords = ALLERGEN_KEYWORDS[code] || [code];
    for (const kw of keywords) {
      if (cleanName.includes(kw.toLowerCase())) {
        const allergenDisplayName = getAllergenName(code, isIt ? 'it' : 'en');
        return isIt
          ? `Attenzione: contiene o è associato a ${allergenDisplayName}`
          : `Warning: contains or associated with ${allergenDisplayName}`;
      }
    }
  }
  return null;
}

export async function loadShoppingList(): Promise<ShoppingItem[]> {
  try {
    const stored = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    if (stored) return JSON.parse(stored);

    const initial: ShoppingItem[] = [
      {
        id: '1',
        name: 'Latte d\'avena senza glutine',
        category: 'Colazione',
        checked: false,
        addedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Pasta di riso integrale',
        category: 'Dispensa',
        checked: false,
        addedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Mele biologiche',
        category: 'Frutta & Verdura',
        checked: true,
        addedAt: new Date().toISOString(),
      },
    ];
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

export async function addShoppingItem(
  name: string,
  category: string = 'Generale',
  userAllergens: readonly string[] = []
): Promise<ShoppingItem[]> {
  const list = await loadShoppingList();
  const warning = checkItemAllergenWarning(name, userAllergens);
  const newItem: ShoppingItem = {
    id: String(Date.now()),
    name: name.trim(),
    category: category.trim() || 'Generale',
    checked: false,
    warningAllergen: warning,
    addedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...list];
  await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
  return updated;
}

export async function toggleShoppingItem(id: string): Promise<ShoppingItem[]> {
  const list = await loadShoppingList();
  const updated = list.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteShoppingItem(id: string): Promise<ShoppingItem[]> {
  const list = await loadShoppingList();
  const updated = list.filter((item) => item.id !== id);
  await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearCompletedItems(): Promise<ShoppingItem[]> {
  const list = await loadShoppingList();
  const updated = list.filter((item) => !item.checked);
  await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
  return updated;
}
