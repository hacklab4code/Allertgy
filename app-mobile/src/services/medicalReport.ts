import { Share } from 'react-native';
import { getAllergenName } from '../engine/translations';

export interface MedicalReportData {
  patientName: string;
  birthDate?: string;
  allergies: Array<{
    code: string;
    intensity: 'lieve' | 'moderata' | 'grave';
    criterio?: 'assoluto' | 'crudo' | 'cotto';
  }>;
  excludedIngredients?: string[];
  emergencyMedicines?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  schoolName?: string;
  classSection?: string;
  notes?: string;
  reportType: 'school' | 'allergist';
}

export function generateReportText(data: MedicalReportData, isIt: boolean = true): string {
  const dateStr = new Date().toLocaleDateString();

  if (data.reportType === 'school') {
    const severeAllergies = data.allergies.filter((a) => a.intensity === 'grave');
    const modAllergies = data.allergies.filter((a) => a.intensity !== 'grave');

    return `=====================================================
📋 MODULO RICHIESTA DIETA SPECIALE & EMERGENZA SCOLASTICA
Emesso tramite AllerTgy Health Hub — Data: ${dateStr}
=====================================================

DATI ALUNNO/A:
• Nome e Cognome: ${data.patientName}
${data.schoolName ? `• Istituto Scolastico: ${data.schoolName}` : ''}
${data.classSection ? `• Sezione / Classe: ${data.classSection}` : ''}

⚠️ QUADRO ALLERGENICO & DIETA SPECIALE:
${severeAllergies.length > 0 ? `🔴 ALLERGIE GRAVI (RISCHIO ANAFILASSI - DIVIETO ASSOLUTO):
${severeAllergies.map((a) => `  - ${getAllergenName(a.code, isIt ? 'it' : 'en').toUpperCase()} (Gravità: Severa)`).join('\n')}` : ''}

${modAllergies.length > 0 ? `🟡 ALTRE ALLERGIE / INTOLLERANZE:
${modAllergies.map((a) => `  - ${getAllergenName(a.code, isIt ? 'it' : 'en')} (${a.intensity})`).join('\n')}` : ''}

${data.excludedIngredients && data.excludedIngredients.length > 0 ? `🚫 INGREDIENTI DA ESCLUDERE:\n  - ${data.excludedIngredients.join(', ')}` : ''}

🍳 ISTRUZIONI PER LA MENSA SCOLASTICA:
1. Preparazione con stoviglie e padelle accuratamente sanificate e dedicate.
2. Evitare qualsiasi forma di contaminazione crociata (anche vapori, salse, posate condivise).
3. Non somministrare snack o alimenti confezionati senza la preventiva verifica dell'etichetta.

🚨 PROTOCOLLO DI EMERGENZA IN CASO DI INGESTIONE ACCIDENTALE:
1. Contattare immediatamente il 112 specificando "Sospetto shock anafilattico su minore".
2. Farmaci salvavita in dotazione: ${data.emergencyMedicines || 'Autoiniettore Adrenalina / Antistaminico in segreteria'}.
3. Avvisare immediatamente i genitori / tutori.

📞 CONTATTI DI EMERGENZA:
• Genitore/Tutore: ${data.emergencyContactName || 'Referente famiglia'} (${data.emergencyContactPhone || 'Tel. registrato'})
${data.doctorName ? `• Pediatra/Allergologo curante: ${data.doctorName} (${data.doctorPhone || 'Tel. studio'})` : ''}

Firma Genitore/Tutore: _______________________
=====================================================`;
  }

  // Report for Allergist / Specialist Doctor
  return `=====================================================
🩺 FASCICOLO CLINICO ALLERGOLOGICO
Emesso tramite AllerTgy Medical Hub — Data: ${dateStr}
=====================================================

PAZIENTE: ${data.patientName}

📊 PROFILO DIAGNOSTICO ALLERGENI:
${data.allergies.map((a) => {
  const name = getAllergenName(a.code, isIt ? 'it' : 'en');
  const crit = a.criterio ? ` [Forma: ${a.criterio}]` : '';
  return `• ${name}: severità ${a.intensity.toUpperCase()}${crit}`;
}).join('\n')}

${data.excludedIngredients && data.excludedIngredients.length > 0 ? `🚫 INGREDIENTI ESCLUSI DALLA DIETA:\n• ${data.excludedIngredients.join(', ')}` : ''}

💊 TERAPIA D'EMERGENZA PRESCRITTA:
• ${data.emergencyMedicines || 'Nessun farmaco specifico registrato'}

📞 REPERIBILITÀ:
• Contatto Emergenza: ${data.emergencyContactName || 'N/D'} (${data.emergencyContactPhone || 'N/D'})
${data.doctorName ? `• Medico Curante: ${data.doctorName}` : ''}

NOTE AGGIUNTIVE:
${data.notes || 'Nessuna nota clinica aggiuntiva registrata.'}

=====================================================`;
}

export async function shareMedicalReport(data: MedicalReportData, isIt: boolean = true): Promise<void> {
  const text = generateReportText(data, isIt);
  const title = data.reportType === 'school'
    ? `Modulo_Scuola_AllerTgy_${data.patientName.replace(/\s+/g, '_')}.txt`
    : `Dossier_Allergologo_AllerTgy_${data.patientName.replace(/\s+/g, '_')}.txt`;

  try {
    await Share.share({
      title,
      message: text,
    });
  } catch (error) {
    console.warn('Errore durante la condivisione del fascicolo:', error);
  }
}
