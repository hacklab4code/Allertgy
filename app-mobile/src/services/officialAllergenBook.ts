import { Share } from 'react-native';
import { getAllergenName } from '../engine/translations';
import type { Menu, Piatto } from '../types';

const EU_14_ALLERGENS = [
  { code: 'glutine', label: 'Glutine / Grano' },
  { code: 'crostacei', label: 'Crostacei' },
  { code: 'uova', label: 'Uova' },
  { code: 'pesce', label: 'Pesce' },
  { code: 'arachidi', label: 'Arachidi' },
  { code: 'soia', label: 'Soia' },
  { code: 'latte', label: 'Latte / Lattosio' },
  { code: 'frutta_a_guscio', label: 'Frutta a guscio' },
  { code: 'sedano', label: 'Sedano' },
  { code: 'senape', label: 'Senape' },
  { code: 'sesamo', label: 'Semi di sesamo' },
  { code: 'solfiti', label: 'Anidride solforosa e Solfiti' },
  { code: 'lupini', label: 'Lupini' },
  { code: 'molluschi', label: 'Molluschi' },
];

export function generateOfficialAllergenBookText(
  menu: Menu,
  haccpManagerName?: string
): string {
  const dateStr = new Date().toLocaleDateString('it-IT');
  const dishes = menu.piatti || [];

  let out = `========================================================================================================
📋 REGISTRO UNICO DEGLI INGREDIENTI E SOSTANZE ALLERGENICHE
Documento Ufficiale redatto ai sensi del REGOLAMENTO (UE) N. 1169/2011 e del D.Lgs. 15 dicembre 2017 n. 231
Generato digitalmente tramite la piattaforma di sicurezza certificata AllerTgy
========================================================================================================

DATI DELL'ESERCIZIO:
• Denominazione Locale: ${menu.nome_ristorante.toUpperCase()}
• Indirizzo: ${menu.indirizzo || 'Sede operativa'} - ${menu.citta || ''}
• Codice Univoco Identificativo AllerTgy: #${menu.public_code || 'N/D'}
• Data Ultima Revisione e Stampa: ${dateStr}
• Responsabile del Piano di Autocontrollo HACCP: ${haccpManagerName || 'Titolare dell\'Esercizio'}

========================================================================================================
TABELLA MATRICIALE DEGLI ALLERGENI PER PIATTO (14 ALLERGENI REG. UE 1169/2011)
LEGENDA: [●] = Ingrediente Presente | [◒] = Possibili Tracce da Lavorazione | [-] = Assente
========================================================================================================\n\n`;

  // Group dishes by category
  const categoriesMap: Record<string, Piatto[]> = {};
  dishes.forEach((d) => {
    const cat = d.categoria?.trim() || 'Varie';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(d);
  });

  for (const [catName, catDishes] of Object.entries(categoriesMap)) {
    out += `\n▶ CATEGORIA: ${catName.toUpperCase()}\n`;
    out += `--------------------------------------------------------------------------------------------------------\n`;

    catDishes.forEach((p) => {
      const contained = new Set(p.allergeni_contenuti || []);
      const traces = new Set(p.allergeni_tracce || []);

      const containedNames = Array.from(contained).map((a) => getAllergenName(a, 'it')).join(', ') || 'Nessuno';
      const tracesNames = Array.from(traces).map((a) => getAllergenName(a, 'it')).join(', ') || 'Nessuna traccia';

      const price = p.prezzo_cents != null ? `${(p.prezzo_cents / 100).toFixed(2)} €` : 'N/D';

      out += `• ${p.nome_piatto} (${price})\n`;
      if (p.descrizione) out += `  Ingredienti: ${p.descrizione}\n`;
      out += `  [●] ALLERGENI PRESENTI: ${containedNames}\n`;
      if (traces.size > 0) out += `  [◒] TRACCE DICHIARATE: ${tracesNames}\n`;
      if (p.kitchen_protocol_confirmed === 1) {
        out += `  🛡️ PROTOCOLLO CUCINA: Sanificazione garantita e padella dedicata in fase di preparazione.\n`;
      }
      out += `\n`;
    });
  }

  out += `========================================================================================================
DICHIARAZIONE DI CONFORMITÀ DEL TITOLARE / RESPONSABILE HACCP:
Il sottoscritto dichiara che le informazioni sopra riportate corrispondono alle ricette e alle schede tecniche
dei fornitori in uso nel locale alla data odierna. Il personale di sala e di cucina è stato adeguatamente
formato per prevenire i rischi di contaminazione crociata durante la conservazione, manipolazione e somministrazione.

Data: ${dateStr}
Firma del Responsabile HACCP: _________________________________________
========================================================================================================`;

  return out;
}

export async function shareOfficialAllergenBook(
  menu: Menu,
  haccpManagerName?: string
): Promise<void> {
  const text = generateOfficialAllergenBookText(menu, haccpManagerName);
  const title = `Libro_Allergeni_Ufficiale_${menu.nome_ristorante.replace(/\s+/g, '_')}.txt`;

  try {
    await Share.share({
      title,
      message: text,
    });
  } catch (err) {
    console.warn('Errore condivisione Libro Allergeni:', err);
  }
}
