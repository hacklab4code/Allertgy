import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET } from '../../layoutConstants';
import { colors, WIREFRAME_MODE } from '../../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  /** margin per headerRight dello stack */
  inHeader?: boolean;
};

/** Pulsante + compatto — header o azione di sezione. */
export function HeaderAddButton({ onPress, accessibilityLabel = 'Aggiungi', inHeader = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.btn, inHeader && styles.inHeader]}
    >
      <Ionicons
        name={WIREFRAME_MODE ? 'add' : 'add-circle-outline'}
        size={WIREFRAME_MODE ? 22 : 28}
        color={WIREFRAME_MODE ? '#000' : colors.brand}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inHeader: { marginRight: 8 },
});
