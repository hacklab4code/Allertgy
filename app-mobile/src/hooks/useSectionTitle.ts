import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useFloatingHeader } from '../store/floatingHeader';

/** Imposta il titolo sezione nell'header floating (tra SOS e notifiche). */
export function useSectionTitle(title: string) {
  const setTitle = useFloatingHeader((s) => s.setTitle);

  useFocusEffect(
    useCallback(() => {
      setTitle(title);
    }, [setTitle, title]),
  );
}
