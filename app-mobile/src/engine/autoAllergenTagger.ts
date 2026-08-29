export interface AutoTagResult {
  detectedAllergens: string[];
  matchedKeywords: Record<string, string[]>; // allergenKey -> array of matched words
  confidenceScore: number; // 0.0 - 1.0
}

const CULINARY_DICTIONARY: Record<string, string[]> = {
  glutine: [
    'farina', 'grano', 'frumento', 'semola', 'orzo', 'farro', 'segale', 'avena',
    'pane', 'pangrattato', 'crostini', 'pasta', 'spaghetti', 'penne', 'tagliatelle',
    'gnocchi', 'pizza', 'focaccia', 'bruschetta', 'birra', 'sfoglia', 'panatura',
    'pastella', 'lasagna', 'biscotto', 'savoiardo', 'panettone', 'crostata',
  ],
  latte: [
    'latte', 'burro', 'panna', 'formaggio', 'parmigiano', 'grana', 'mozzarella',
    'ricotta', 'gorgonzola', 'pecorino', 'mascarpone', 'yogurt', 'besciamella',
    'fonduta', 'stracciatella', 'burrata', 'caciocavallo', 'provola', 'scamorza',
    'taleggio', 'brie', 'cheddar', 'lattosio',
  ],
  uova: [
    'uovo', 'uova', 'albume', 'tuorlo', 'maionese', 'zabaione', 'carbonara',
    'meringa', 'frittata', 'crema pasticcera', 'pasta all\'uovo', 'tagliolini',
  ],
  crostacei: [
    'gambero', 'gamberi', 'gamberetto', 'gamberetti', 'scampo', 'scampi',
    'aragosta', 'astice', 'granchio', 'mazzancolle', 'cannocchie', 'cicala di mare',
  ],
  molluschi: [
    'cozza', 'cozze', 'vongola', 'vongole', 'calamaro', 'calamari', 'seppia',
    'seppie', 'polpo', 'polipo', 'moscardini', 'ostrica', 'ostriche', 'capasanta',
    'capesante', 'lumache', 'chiocciole', 'totano', 'totani',
  ],
  pesce: [
    'pesce', 'tonno', 'salmone', 'branzino', 'spigola', 'orata', 'acciuga',
    'acciughe', 'alice', 'alici', 'baccala', 'baccalà', 'stoccafisso', 'merluzzo',
    'pesce spada', 'trota', 'sogliola', 'rombo', 'sarda', 'sarde', 'bottarga',
  ],
  arachidi: [
    'arachide', 'arachidi', 'nocciolina', 'noccioline', 'burro di arachidi',
  ],
  frutta_a_guscio: [
    'noce', 'noci', 'nocciola', 'nocciole', 'mandorla', 'mandorle', 'pistacchio',
    'pistacchi', 'pinolo', 'pinoli', 'anacardo', 'anacardi', 'castagna', 'castagne',
    'pesto', 'praline', 'macadamia',
  ],
  soia: [
    'soia', 'tofu', 'edamame', 'tamari', 'salsa di soia', 'miso', 'lecitina di soia',
  ],
  sedano: [
    'sedano', 'soffritto', 'brodo vegetale', 'brodo di carne',
  ],
  senape: [
    'senape', 'mostarda', 'dijon',
  ],
  sesamo: [
    'sesamo', 'tahina', 'semi di sesamo', 'olio di sesamo',
  ],
  solfiti: [
    'vino', 'vino bianco', 'vino rosso', 'aceto', 'aceto balsamico', 'sfumato con vino',
  ],
  lupini: [
    'lupino', 'lupini', 'farina di lupino',
  ],
};

export function autoDetectDishAllergens(
  dishName: string,
  description: string = ''
): AutoTagResult {
  const combinedText = `${dishName} ${description}`.toLowerCase();
  const detectedAllergens: string[] = [];
  const matchedKeywords: Record<string, string[]> = {};

  let matchCount = 0;

  for (const [allergenKey, keywords] of Object.entries(CULINARY_DICTIONARY)) {
    const matchedForThis: string[] = [];
    for (const kw of keywords) {
      // Regex word boundary matching or substring matching
      if (combinedText.includes(kw)) {
        matchedForThis.push(kw);
      }
    }

    if (matchedForThis.length > 0) {
      detectedAllergens.push(allergenKey);
      matchedKeywords[allergenKey] = matchedForThis;
      matchCount += matchedForThis.length;
    }
  }

  const confidenceScore = detectedAllergens.length > 0 ? Math.min(1.0, 0.6 + matchCount * 0.1) : 0.0;

  return {
    detectedAllergens,
    matchedKeywords,
    confidenceScore,
  };
}

export function autoDetectMenuAllergens(
  piatti: Array<{ id: number; nome_piatto: string; descrizione?: string | null; allergeni_contenuti?: string[] }>
): Array<{ id: number; nome_piatto: string; suggestedAllergens: string[]; newlyDiscovered: string[] }> {
  return piatti.map((p) => {
    const { detectedAllergens } = autoDetectDishAllergens(p.nome_piatto, p.descrizione || '');
    const current = new Set(p.allergeni_contenuti || []);
    const newlyDiscovered = detectedAllergens.filter((a) => !current.has(a));

    return {
      id: p.id,
      nome_piatto: p.nome_piatto,
      suggestedAllergens: detectedAllergens,
      newlyDiscovered,
    };
  });
}
