/** Traccia l'ultima versione menù stampata come Registro PDF (per reminder ristampa). */

const key = (rid: number) => `allertgy_registry_printed_v_${rid}`;

export function getRegistryPrintedVersion(rid: number): number {
  const raw = localStorage.getItem(key(rid));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function markRegistryPrinted(rid: number, menuVersion: number): void {
  localStorage.setItem(key(rid), String(Math.max(0, menuVersion || 0)));
}

export function registryNeedsReprint(rid: number, menuVersion: number | null | undefined): boolean {
  const live = menuVersion || 0;
  if (live <= 0) return false;
  return live > getRegistryPrintedVersion(rid);
}
