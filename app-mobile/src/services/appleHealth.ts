import { Platform, Alert, Linking, Share } from 'react-native';

/** Integrazione Apple Salute — su iOS salva lo stato e offre export allergie. */
export function isAppleHealthAvailable(): boolean {
  return Platform.OS === 'ios';
}

function buildAllergySummary(allergenLabels: string[], medicines?: string | null): string {
  const lines = [
    'AllerTgy — Profilo allergie',
    '',
    allergenLabels.length ? `Allergie: ${allergenLabels.join(', ')}` : 'Allergie: nessuna registrata',
    medicines ? `Farmaci emergenza: ${medicines}` : '',
    '',
    'Generato da AllerTgy. Aggiungi in Salute > Note mediche.',
  ].filter(Boolean);
  return lines.join('\n');
}

export async function connectAppleHealth(
  updateApi: (connected: number) => Promise<void>,
  allergenLabels: string[],
  medicines?: string | null,
): Promise<void> {
  if (!isAppleHealthAvailable()) {
    Alert.alert('Non disponibile', 'Apple Salute è disponibile solo su iPhone.');
    return;
  }

  Alert.alert(
    'Collega Apple Salute',
    'AllerTgy salverà lo stato di connessione. Potrai condividere un riepilogo delle allergie da incollare in Salute > Note mediche.',
    [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Collega',
        onPress: async () => {
          try {
            await updateApi(1);
            const summary = buildAllergySummary(allergenLabels, medicines);
            Alert.alert(
              'Collegato',
              'Profilo collegato. Condividi il riepilogo allergie o apri l\'app Salute.',
              [
                {
                  text: 'Condividi riepilogo',
                  onPress: () => Share.share({ message: summary }),
                },
                { text: 'Apri Salute', onPress: () => Linking.openURL('x-apple-health://') },
                { text: 'Ok' },
              ],
            );
          } catch (e) {
            Alert.alert('Errore', (e as Error).message);
          }
        },
      },
    ],
  );
}

export async function disconnectAppleHealth(updateApi: (connected: number) => Promise<void>): Promise<void> {
  try {
    await updateApi(0);
    Alert.alert('Disconnesso', 'Apple Salute non è più collegato ad AllerTgy.');
  } catch (e) {
    Alert.alert('Errore', (e as Error).message);
  }
}
