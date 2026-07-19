import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

/** Tab nativo iOS — apre lo scanner modale al focus. */
export default function ScanTab() {
  useFocusEffect(
    useCallback(() => {
      router.push('/scanner');
    }, []),
  );

  return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
}
