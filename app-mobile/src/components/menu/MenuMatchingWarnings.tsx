import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { t } from '../../engine/translations';
import { colors } from '../../theme';
import type { CustomerAnnotation } from '../../types';

type Props = {
  warnings: CustomerAnnotation[];
  language?: string | null;
};

export default function MenuMatchingWarnings({ warnings, language }: Props) {
  if (warnings.length === 0) return null;

  const isIt = (language || 'it').toLowerCase() === 'it';

  return (
    <View style={styles.box}>
      <Text style={styles.header}>
        {isIt
          ? `⚠️ ATTENZIONE: segnalazioni clienti (${warnings.length})`
          : `⚠️ WARNING: customer reports (${warnings.length})`}
      </Text>
      <Text style={styles.disclaimer}>{t('ugc_warning_disclaimer', language)}</Text>
      {warnings.map((w) => (
        <GlassCard key={w.id} style={styles.card}>
          <Text style={styles.title}>
            {w.allergen_emoji} {isIt ? 'Allergia correlata' : 'Related allergy'}: {w.allergen_name_it}
          </Text>
          {w.ingredient ? (
            <Text style={styles.ingredient}>
              {isIt ? 'Ingrediente' : 'Ingredient'}:{' '}
              <Text style={{ fontWeight: '800', color: colors.redText }}>{w.ingredient}</Text>
            </Text>
          ) : null}
          <Text style={styles.notes}>"{w.notes}"</Text>
          <Text style={styles.meta}>
            {isIt ? 'Segnalato da' : 'Reported by'} {w.author_name} · {new Date(w.created_at).toLocaleDateString()}
          </Text>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.redBorder,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  header: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.redText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.redText,
    lineHeight: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.redBorder,
    gap: 4,
  },
  title: { fontSize: 13, fontWeight: '800', color: colors.redText },
  ingredient: { fontSize: 12.5, color: colors.inkSoft, fontWeight: '600' },
  notes: { fontSize: 12.5, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  meta: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
});
