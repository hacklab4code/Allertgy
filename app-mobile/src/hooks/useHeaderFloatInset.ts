import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_FLOAT_CLEARANCE } from '../layoutConstants';

/** Spazio sotto status bar per i pulsanti header flottanti. */
export function useHeaderFloatInset(extra = 0) {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_FLOAT_CLEARANCE + extra;
}
