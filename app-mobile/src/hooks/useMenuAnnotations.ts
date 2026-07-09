import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../api/client';
import type { Allergen, CustomerAnnotation } from '../types';

export function useMenuAnnotations(codice: string | undefined, allergie: readonly string[]) {
  const [annotations, setAnnotations] = useState<CustomerAnnotation[]>([]);
  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  const [customAllergenSearch, setCustomAllergenSearch] = useState('');
  const [showAllAllergensDropdown, setShowAllAllergensDropdown] = useState(false);
  const [annotIngredient, setAnnotIngredient] = useState('');
  const [annotNotes, setAnnotNotes] = useState('');
  const [annotBusy, setAnnotBusy] = useState(false);

  useEffect(() => {
    if (!codice) return;
    api.listAnnotations(codice).then(setAnnotations).catch(() => {});
    api.allergens().then(setAllAllergens).catch(() => {});
  }, [codice]);

  const matchingWarnings = useMemo(
    () => annotations.filter((a) => allergie.includes(a.allergen_code)),
    [annotations, allergie],
  );

  const myAllergenList = useMemo(
    () => allAllergens.filter((a) => allergie.includes(a.code)),
    [allAllergens, allergie],
  );

  const filteredAllAllergens = useMemo(() => {
    const q = customAllergenSearch.toLowerCase().trim();
    if (!q) return allAllergens;
    return allAllergens.filter(
      (a) => a.name_it.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
    );
  }, [allAllergens, customAllergenSearch]);

  const submitAnnotation = async () => {
    if (!codice || !selectedAllergen || !annotNotes.trim()) return;
    setAnnotBusy(true);
    try {
      await api.createAnnotation(
        codice,
        selectedAllergen.id,
        annotIngredient.trim() || null,
        annotNotes.trim(),
      );
      setAnnotations(await api.listAnnotations(codice));
      setAnnotIngredient('');
      setAnnotNotes('');
      setSelectedAllergen(null);
      Alert.alert(
        'Segnalazione inviata',
        'Grazie per aver condiviso questo warning! La tua annotazione aiuterà gli altri clienti con la stessa allergia.',
      );
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    }
    setAnnotBusy(false);
  };

  return {
    annotations,
    selectedAllergen,
    setSelectedAllergen,
    customAllergenSearch,
    setCustomAllergenSearch,
    showAllAllergensDropdown,
    setShowAllAllergensDropdown,
    annotIngredient,
    setAnnotIngredient,
    annotNotes,
    setAnnotNotes,
    annotBusy,
    matchingWarnings,
    myAllergenList,
    filteredAllAllergens,
    submitAnnotation,
  };
}
