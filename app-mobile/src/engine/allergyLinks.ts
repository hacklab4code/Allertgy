/**
 * Collegamenti intelligenti tra allergeni — selezione automatica di correlati.
 *
 * Regole:
 * 1. Categoria UE → tutti i sotto-allergeni (es. frutta_a_guscio → mandorle, noci…)
 * 2. Sotto-allergene → categoria padre (es. mandorle → frutta_a_guscio), senza i fratelli
 * 3. Correlazioni cliniche / di sicurezza (es. arachidi → noce moscata, lupini)
 */

export type AllergyIntensity = 'lieve' | 'moderata' | 'grave';

/** Categorie UE → allergeni specifici nel catalogo */
export const CATEGORY_CHILDREN: Record<string, readonly string[]> = {
  frutta_a_guscio: [
    'mandorle', 'nocciole', 'noci', 'noci_pecan', 'noci_brasiliane',
    'pistacchi', 'anacardi', 'castagne', 'pinoli', 'macadamia',
  ],
  pesce: [
    'tonno', 'salmone', 'merluzzo', 'acciughe', 'sgombro', 'trota',
    'branzino', 'orata', 'sardine', 'aringa', 'cernia', 'rombo', 'baccala',
  ],
  crostacei: ['gamberi', 'astice'],
  molluschi: ['calamari', 'polpo', 'seppia', 'vongole', 'cozze', 'ostriche'],
  latte: [
    'burro', 'panna', 'yogurt', 'parmigiano', 'mozzarella', 'gorgonzola',
    'pecorino', 'ricotta', 'mascarpone', 'formaggi_stagionati', 'caseina', 'lattosio',
  ],
  glutine: ['orzo', 'avena', 'segale', 'farro'],
  soia: ['edamame'],
};

export const CHILD_TO_PARENT: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_CHILDREN).flatMap(([parent, children]) =>
    children.map((child) => [child, parent]),
  ),
);

/**
 * Correlazioni aggiuntive — selezionando la chiave si aggiungono anche i valori.
 * Include casi di reattività crociata e ingredienti spesso confusi (es. noce moscata).
 */
export const CROSS_REACTIVE: Record<string, readonly string[]> = {
  arachidi: ['noce_moscata', 'lupini'],
  lupini: ['arachidi'],
  frutta_a_guscio: ['noce_moscata'],
  soia: ['edamame'],
  edamame: ['soia'],
  agrumi: ['arancia', 'limone'],
  arancia: ['agrumi'],
  limone: ['agrumi'],
};

function directAdds(code: string): string[] {
  const adds: string[] = [];
  const parent = CHILD_TO_PARENT[code];
  if (parent) adds.push(parent);
  const children = CATEGORY_CHILDREN[code];
  if (children) adds.push(...children);
  const cross = CROSS_REACTIVE[code];
  if (cross) adds.push(...cross);
  return adds;
}

/** Allergeni aggiunti automaticamente selezionando `code` (un solo livello). */
export function getLinkedAllergens(code: string): string[] {
  return directAdds(code);
}

function isImpliedByAny(code: string, sources: Set<string>): boolean {
  for (const src of sources) {
    if (src === code) continue;
    if (directAdds(src).includes(code)) return true;
    const children = CATEGORY_CHILDREN[src];
    if (children?.includes(code)) return true;
    if (CHILD_TO_PARENT[src] === code) return true;
  }
  return false;
}

/** Espande un elenco di codici con tutti i correlati. */
export function expandAllergieCodes(codes: Iterable<string>): string[] {
  const expanded = new Set<string>();
  for (const code of codes) {
    expanded.add(code);
    for (const linked of getLinkedAllergens(code)) expanded.add(linked);
  }
  return [...expanded];
}

/** Toggle intelligente: aggiunge/rimuove allergeni correlati. */
export function toggleAllergieSelection(selected: Set<string>, code: string): Set<string> {
  if (selected.has(code)) return deselectAllergie(selected, code);
  return selectAllergie(selected, code);
}

function selectAllergie(selected: Set<string>, code: string): Set<string> {
  const next = new Set(selected);
  next.add(code);
  for (const linked of getLinkedAllergens(code)) next.add(linked);
  return next;
}

function deselectAllergie(selected: Set<string>, code: string): Set<string> {
  const next = new Set(selected);
  next.delete(code);

  const children = CATEGORY_CHILDREN[code];
  if (children) {
    for (const child of children) {
      if (!isImpliedByAny(child, next)) next.delete(child);
    }
  }

  const parent = CHILD_TO_PARENT[code];
  if (parent && next.has(parent)) {
    const siblings = CATEGORY_CHILDREN[parent] ?? [];
    const anyChildLeft = siblings.some((s) => next.has(s));
    if (!anyChildLeft) next.delete(parent);
  }

  for (const linked of getLinkedAllergens(code)) {
    if (!isImpliedByAny(linked, next)) next.delete(linked);
  }

  return next;
}

export function toggleAllergieSelectionWithIntensities(
  selected: Set<string>,
  intensities: Record<string, AllergyIntensity>,
  code: string,
): { selected: Set<string>; intensities: Record<string, AllergyIntensity> } {
  const wasOn = selected.has(code);
  const nextSelected = toggleAllergieSelection(selected, code);
  const nextIntensities = { ...intensities };

  if (wasOn) {
    for (const c of selected) {
      if (!nextSelected.has(c)) delete nextIntensities[c];
    }
  } else {
    const base = nextIntensities[code] || 'moderata';
    for (const c of nextSelected) {
      if (!selected.has(c) && !nextIntensities[c]) nextIntensities[c] = base;
    }
  }

  return { selected: nextSelected, intensities: nextIntensities };
}
