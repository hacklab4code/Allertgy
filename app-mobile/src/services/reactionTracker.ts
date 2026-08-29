import AsyncStorage from '@react-native-async-storage/async-storage';

const REACTIONS_STORAGE_KEY = 'allertgy-reactions-journal';

export interface ReactionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  profileName: string;
  severity: 'lieve' | 'moderata' | 'grave';
  symptoms: string[]; // ['orticaria', 'gonfiore', 'asma', 'prurito', 'dolore_addominale', 'vertigini']
  suspectedFood?: string;
  medsAdministered?: string;
  resolutionTimeMinutes?: number;
  notes?: string;
}

export const SYMPTOM_DEFINITIONS = [
  { id: 'orticaria', label: 'Orticaria / Pomfi', emoji: '🔴' },
  { id: 'prurito', label: 'Prurito diffuso', emoji: '🖐️' },
  { id: 'gonfiore', label: 'Gonfiore labbra / viso', emoji: '👄' },
  { id: 'asma', label: 'Difficoltà a respirare / Asma', emoji: '🫁' },
  { id: 'dolore_addominale', label: 'Dolori addominali / Nausea', emoji: '🤢' },
  { id: 'vertigini', label: 'Capogiri / Vertigini', emoji: '💫' },
];

export async function loadReactions(): Promise<ReactionEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(REACTIONS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    // Initial sample reaction
    const initial: ReactionEntry[] = [
      {
        id: '1',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:30',
        profileName: 'Principale',
        severity: 'lieve',
        symptoms: ['prurito', 'orticaria'],
        suspectedFood: 'Biscotti al burro (tracce di latte)',
        medsAdministered: 'Antistaminico Zyrtec (10 gocce)',
        resolutionTimeMinutes: 45,
        notes: 'Scomparsa dei sintomi dopo circa 45 minuti.',
      },
    ];
    await AsyncStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

export async function saveReaction(entry: ReactionEntry): Promise<ReactionEntry[]> {
  const list = await loadReactions();
  const exists = list.some((r) => r.id === entry.id);
  const updated = exists
    ? list.map((r) => (r.id === entry.id ? entry : r))
    : [entry, ...list];
  await AsyncStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteReaction(id: string): Promise<ReactionEntry[]> {
  const list = await loadReactions();
  const updated = list.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
