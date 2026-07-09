import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Se true, avvolge i children in una card bianca. */
  card?: boolean;
  /** Padding interno della card (disattiva per liste con item già padded). */
  padded?: boolean;
  style?: ViewStyle;
};

/** Intestazione di sezione per schermate dettaglio (cliente e ristoratore). */
export default function DetailSection({ title, subtitle, children, card = true, padded = true, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? (card ? <View style={[styles.card, !padded && styles.cardFlush]}>{children}</View> : children) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 8,
    marginLeft: 4,
    marginRight: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    padding: 14,
  },
  cardFlush: {
    padding: 0,
  },
});
