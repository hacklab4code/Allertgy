import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (rid: number) => `allertgy_registry_printed_v_${rid}`;

export async function getRegistryPrintedVersion(rid: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key(rid));
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function markRegistryPrinted(rid: number, menuVersion: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key(rid), String(Math.max(0, menuVersion || 0)));
  } catch {
    // ignore
  }
}

export async function registryNeedsReprint(
  rid: number,
  menuVersion: number | null | undefined,
): Promise<boolean> {
  const live = menuVersion || 0;
  if (live <= 0) return false;
  const printed = await getRegistryPrintedVersion(rid);
  return live > printed;
}
