import { Platform, Alert, Linking, Share } from 'react-native';

/**
 * Export profilo allergie verso Apple Salute.
 * NON usa HealthKit: genera un riepilogo testuale da condividere manualmente
 * in Salute > Note mediche.
 */
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
    'Generato da AllerTgy. Aggiungi manualmente in Salute > Note mediche.',
  ].filter(Boolean);
  return lines.join('\n');
}

export async function connectAppleHealth(
  updateApi: (connected: number) => Promise<void>,
  allergenLabels: string[],
  medicines?: string | null,
): Promise<void> {
  if (!isAppleHealthAvailable()) {
    Alert.alert('Non disponibile', 'L\'export verso Apple Salute è disponibile solo su iPhone.');
    return;
  }

  Alert.alert(
    'Esporta in Apple Salute',
    'AllerTgy non legge né scrive dati in HealthKit. Potrai condividere un riepilogo testuale delle allergie da incollare manualmente in Salute > Note mediche.',
    [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esporta',
        onPress: async () => {
          try {
            await updateApi(1);
            const summary = buildAllergySummary(allergenLabels, medicines);
            Alert.alert(
              'Riepilogo pronto',
              'Condividi il testo e incollalo in Salute > Note mediche.',
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
    Alert.alert('Disattivato', 'L\'export verso Apple Salute non è più attivo.');
  } catch (e) {
    Alert.alert('Errore', (e as Error).message);
  }
}
