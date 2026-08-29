import { Share } from 'react-native';
import { getAllergenName } from '../engine/translations';

export interface IceWallpaperData {
  name: string;
  allergies: string[];
  bloodType?: string;
  adrenalineLocation?: string;
  iceContactName: string;
  iceContactPhone: string;
  doctorPhone?: string;
  theme: 'emergency_red' | 'midnight_dark' | 'neon_contrast';
}

export const WALLPAPER_THEMES = {
  emergency_red: {
    id: 'emergency_red',
    name: 'Rosso Emergenza',
    bgColor: '#180606',
    cardBg: '#2D0D0D',
    border: '#DC2626',
    headerColor: '#EF4444',
    accentBadge: '#991B1B',
    textColor: '#FFFFFF',
    textMuted: '#FECACA',
  },
  midnight_dark: {
    id: 'midnight_dark',
    name: 'Midnight Black',
    bgColor: '#09090B',
    cardBg: '#18181B',
    border: '#3F3F46',
    headerColor: '#A1A1AA',
    accentBadge: '#27272A',
    textColor: '#FFFFFF',
    textMuted: '#A1A1AA',
  },
  neon_contrast: {
    id: 'neon_contrast',
    name: 'Giallo Alto Contrasto',
    bgColor: '#000000',
    cardBg: '#111111',
    border: '#FACC15',
    headerColor: '#FACC15',
    accentBadge: '#854D0E',
    textColor: '#FFFFFF',
    textMuted: '#FEF08A',
  },
};

export async function shareIceCardText(data: IceWallpaperData, isIt: boolean = true): Promise<void> {
  const allergenList = data.allergies.map((a) => getAllergenName(a, isIt ? 'it' : 'en')).join(', ');

  const summary = `🚨 SCHEDA MEDICA ICE / SCHERMATA DI BLOCCO ALLERTGY
=============================================
PAZIENTE: ${data.name.toUpperCase()}${data.bloodType ? ` (Gruppo: ${data.bloodType})` : ''}

⚠️ ALLERGIE GRAVI / RISCHIO SHOCK ANAFILATTICO:
${allergenList.toUpperCase() || 'NESSUNA'}

💊 ADRENALINA AUTOINIETTABILE:
${data.adrenalineLocation || 'Nello zaino / borsa del paziente'}

📞 CONTATTO D'EMERGENZA:
${data.iceContactName || 'Referente Famiglia'}: ${data.iceContactPhone || 'N/D'}

🚨 ISTRUZIONI PER I SOCCORRITORI:
1. Chiamare subito il 112 specificando shock anafilattico.
2. Somministrare adrenalina nella parte antero-laterale della coscia.
=============================================`;

  try {
    await Share.share({
      title: `Scheda_ICE_${data.name}.txt`,
      message: summary,
    });
  } catch (err) {
    console.warn('Errore condivisione scheda ICE:', err);
  }
}
