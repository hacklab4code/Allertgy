export interface CrossReactionFamily {
  id: string;
  inhalantName: string; // es. Betulla / Betullacee
  inhalantEmoji: string;
  proteinFamily: string; // es. Bet v 1 (PR-10)
  description: string;
  thermolabile: boolean; // true = la cottura rende il cibo sicuro; false = termostabile (rischio anche cotto)
  cookingSafetyAdvice: string;
  crossedFoods: Array<{
    name: string;
    riskLevel: 'ALTO' | 'MEDIO';
    rawOnlySafe: boolean; // se true, cotto è tollerato
  }>;
}

export const CROSS_REACTIVITY_DATABASE: CrossReactionFamily[] = [
  {
    id: 'betulla',
    inhalantName: 'Betulla & Betullacee',
    inhalantEmoji: '🌳',
    proteinFamily: 'Proteina PR-10 (Bet v 1)',
    description: 'La più frequente causa di Sindrome Orale Allergica (OAS). Causa prurito e gonfiore a bocca e labbra mangiando frutta cruda.',
    thermolabile: true,
    cookingSafetyAdvice: '🟢 Termolabile: La cottura distrugge la proteina Bet v 1. Marmellate, torte e mele cotte sono generalmente ben tollerate.',
    crossedFoods: [
      { name: 'Mela', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Pera', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Pesca & Nettarina', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Nocciola', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Ciliegia', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Carota & Sedano', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Kiwi', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Mandorla', riskLevel: 'MEDIO', rawOnlySafe: false },
    ],
  },
  {
    id: 'graminacee',
    inhalantName: 'Graminacee',
    inhalantEmoji: '🌾',
    proteinFamily: 'Profiline & Gruppo 1/5',
    description: 'Presente in primavera ed estate. Reazioni crociate con frutti estivi e solanacee.',
    thermolabile: true,
    cookingSafetyAdvice: '🟢 Parzialmente termolabile. I pomodori cotti (salsa) danno meno reazioni del pomodoro crudo a fette.',
    crossedFoods: [
      { name: 'Pomodoro', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Melone', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Anguria', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Arancia & Agrumi', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Kiwi', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Pesca', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Frumento / Grano', riskLevel: 'MEDIO', rawOnlySafe: false },
    ],
  },
  {
    id: 'acari',
    inhalantName: 'Acari della Polvere',
    inhalantEmoji: '🕷️',
    proteinFamily: 'Tropomiosina',
    description: 'Proteina muscolare condivisa tra acari della polvere e invertebrati marini (crostacei e molluschi).',
    thermolabile: false,
    cookingSafetyAdvice: '🔴 TERMOSTABILE: La tropomiosina resiste alle alte temperature di cottura. Non consumare crostacei anche se ben cotti.',
    crossedFoods: [
      { name: 'Gamberi & Scampi', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Aragosta & Astice', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Granchi', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Calamari & Seppie', riskLevel: 'MEDIO', rawOnlySafe: false },
      { name: 'Cozze & Vongole', riskLevel: 'MEDIO', rawOnlySafe: false },
      { name: 'Chiocciole / Lumache', riskLevel: 'MEDIO', rawOnlySafe: false },
    ],
  },
  {
    id: 'ltp',
    inhalantName: 'Sindrome da LTP (Proteine di Trasporto Lipidico)',
    inhalantEmoji: '🍑',
    proteinFamily: 'LTP (Pru p 3)',
    description: 'Allergene principale nel bacino del Mediterraneo. Si concentra nella buccia della frutta e può provocare reazioni sistemiche gravi anche lontano dalla stagione dei pollini.',
    thermolabile: false,
    cookingSafetyAdvice: '🔴 ALTAMENTE RESISTENTE A COTTURA E SUCCHI GASTRICI: Sbucciare la frutta riduce la carica ma non elimina il rischio.',
    crossedFoods: [
      { name: 'Buccia di Pesca & Albicocca', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Prugna & Susina', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Noce & Nocciola', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Pomodoro', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Uva & Vino', riskLevel: 'MEDIO', rawOnlySafe: false },
      { name: 'Mais', riskLevel: 'MEDIO', rawOnlySafe: false },
      { name: 'Lattuga & Melanzana', riskLevel: 'MEDIO', rawOnlySafe: false },
    ],
  },
  {
    id: 'lattice',
    inhalantName: 'Lattice (Sindrome Lattice-Frutta)',
    inhalantEmoji: '🧤',
    proteinFamily: 'Eparina / Chitinasi',
    description: 'Reattività crociata tra gli allergeni della gomma naturale (lattice) e frutti tropicali.',
    thermolabile: true,
    cookingSafetyAdvice: '🟡 Moderatamente termolabile: la cottura può ridurre i sintomi orali lievi, ma è raccomandata cautela.',
    crossedFoods: [
      { name: 'Banana', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Avocado', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Castagna', riskLevel: 'ALTO', rawOnlySafe: false },
      { name: 'Kiwi', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Fichi', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Papaya & Mango', riskLevel: 'MEDIO', rawOnlySafe: true },
    ],
  },
  {
    id: 'parietaria',
    inhalantName: 'Parietaria (Erba Vetriola)',
    inhalantEmoji: '🌿',
    proteinFamily: 'Par j 1 / Par j 2',
    description: 'Tipica delle zone costiere e muri antichi. Frequente cross-reattività con erbe aromatiche e frutti.',
    thermolabile: true,
    cookingSafetyAdvice: '🟢 I vegetali cotti riducono significativamente il prurito orofaringeo.',
    crossedFoods: [
      { name: 'Basilico', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Gelso', riskLevel: 'ALTO', rawOnlySafe: true },
      { name: 'Melone', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Ortica', riskLevel: 'MEDIO', rawOnlySafe: true },
      { name: 'Pistacchio', riskLevel: 'MEDIO', rawOnlySafe: false },
    ],
  },
];
