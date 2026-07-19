/**
 * Modalità wireframe — quadrati neri e testo, senza decorazioni.
 * Per ripristinare lo stile puffy: imposta WIREFRAME_MODE = false qui sotto.
 */
import { TextStyle, ViewStyle } from 'react-native';

export const WIREFRAME_MODE = false;

export const wireBox = (opts?: {
  dashed?: boolean;
  fill?: string;
  minHeight?: number;
}): ViewStyle => ({
  borderWidth: 1,
  borderColor: '#000000',
  borderStyle: opts?.dashed ? 'dashed' : 'solid',
  backgroundColor: opts?.fill ?? '#FFFFFF',
  borderRadius: 0,
  minHeight: opts?.minHeight,
});

export const wireText: TextStyle = {
  color: '#000000',
  fontWeight: '400',
};

export const wireLabel = (prefix: string, text: string) => `[${prefix}] ${text}`;
