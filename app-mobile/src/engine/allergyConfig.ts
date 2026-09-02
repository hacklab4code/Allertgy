import { Alert } from 'react-native';
import type { AllergyCriterio, AllergyIntensity } from '../types';

export const CRITERIO_LABELS_IT: Record<AllergyCriterio, string> = {
  assoluto: 'Assoluto',
  crudo: 'Solo crudo',
  cotto: 'Solo cotto',
};

export const CRITERIO_LABELS_EN: Record<AllergyCriterio, string> = {
  assoluto: 'Absolute',
  crudo: 'Raw only',
  cotto: 'Cooked only',
};

export const INTENSITY_LABELS_IT: Record<AllergyIntensity, string> = {
  lieve: 'Lieve (Giallo)',
  moderata: 'Media (Arancione)',
  grave: 'Grave (Rosso)',
};

export const INTENSITY_LABELS_EN: Record<AllergyIntensity, string> = {
  lieve: 'Mild (Yellow)',
  moderata: 'Moderate (Orange)',
  grave: 'Severe (Red)',
};

export function criterioShortLabel(criterio: AllergyCriterio | undefined, isIt: boolean): string {
  const c = criterio || 'assoluto';
  if (c === 'crudo') return isIt ? 'Crudo' : 'Raw';
  if (c === 'cotto') return isIt ? 'Cotto' : 'Cooked';
  return isIt ? 'Assoluto' : 'Absolute';
}

export function intensityShortLabel(intensity: AllergyIntensity | undefined, isIt: boolean): string {
  if (intensity === 'lieve') return isIt ? 'Lieve' : 'Mild';
  if (intensity === 'grave') return isIt ? 'Grave' : 'Severe';
  return isIt ? 'Media' : 'Mod.';
}

/** Long-press: scegli se impostare intensità o criterio (forma). */
export function promptAllergyConfig(opts: {
  name: string;
  isIt: boolean;
  onIntensity: (level: AllergyIntensity) => void;
  onCriterio: (criterio: AllergyCriterio) => void;
}) {
  const { name, isIt, onIntensity, onCriterio } = opts;
  Alert.alert(
    isIt ? `Configura: ${name}` : `Configure: ${name}`,
    isIt
      ? 'Imposta intensità (lieve = giallo, media = arancione, grave = rosso) e criterio di forma.'
      : 'Set severity (mild = yellow, moderate = orange, severe = red) and form criterion.',
    [
      {
        text: isIt ? 'Intensità…' : 'Severity…',
        onPress: () => {
          Alert.alert(
            isIt ? `Intensità: ${name}` : `Severity: ${name}`,
            isIt ? 'Quanto è grave questa allergia?' : 'How severe is this allergy?',
            [
              { text: isIt ? 'Lieve (Giallo)' : 'Mild (Yellow)', onPress: () => onIntensity('lieve') },
              { text: isIt ? 'Media (Arancione)' : 'Moderate (Orange)', onPress: () => onIntensity('moderata') },
              {
                text: isIt ? 'Grave (Rosso)' : 'Severe (Red)',
                onPress: () => onIntensity('grave'),
                style: 'destructive',
              },
              { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
            ],
          );
        },
      },
      {
        text: isIt ? 'Criterio (forma)…' : 'Form criterion…',
        onPress: () => {
          Alert.alert(
            isIt ? `Criterio: ${name}` : `Criterion: ${name}`,
            isIt
              ? 'Assoluto = qualsiasi forma (rosso). Crudo/Cotto = solo quella forma: se presente, avviso giallo perché il menù non indica la preparazione.'
              : 'Absolute = any form (red). Raw/Cooked = that form only: if present, yellow warning because the menu does not specify preparation.',
            [
              { text: isIt ? 'Assoluto' : 'Absolute', onPress: () => onCriterio('assoluto') },
              { text: isIt ? 'Solo crudo' : 'Raw only', onPress: () => onCriterio('crudo') },
              { text: isIt ? 'Solo cotto' : 'Cooked only', onPress: () => onCriterio('cotto') },
              { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
            ],
          );
        },
      },
      { text: isIt ? 'Annulla' : 'Cancel', style: 'cancel' },
    ],
  );
}
