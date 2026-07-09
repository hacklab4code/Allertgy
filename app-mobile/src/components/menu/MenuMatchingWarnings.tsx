import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import type { CustomerAnnotation } from '../../types';

type Props = {
  warnings: CustomerAnnotation[];
};

export default function MenuMatchingWarnings({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.header}>
        ⚠️ ATTENZIONE: Warning dai Clienti ({warnings.length})
      </Text>
      {warnings.map((w) => (
        <View key={w.id} style={styles.card}>
          <Text style={styles.title}>
            {w.allergen_emoji} Allergia correlata: {w.allergen_name_it}
          </Text>
          {w.ingredient ? (
            <Text style={styles.ingredient}>
              Ingrediente: <Text style={{ fontWeight: '800', color: colors.redText }}>{w.ingredient}</Text>
            </Text>
          ) : null}
          <Text style={styles.notes}>"{w.notes}"</Text>
          <Text style={styles.meta}>
            Segnalato da {w.author_name} il {new Date(w.created_at).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  header: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  title: { fontSize: 13, fontWeight: '800', color: '#b91c1c' },
  ingredient: { fontSize: 12.5, color: '#334155', fontWeight: '600' },
  notes: { fontSize: 12.5, color: '#475569', fontStyle: 'italic', lineHeight: 18 },
  meta: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
});
