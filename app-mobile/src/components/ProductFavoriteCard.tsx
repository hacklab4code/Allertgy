import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ScannedProduct } from '../services/barcodeScan';
import { productStatusLabel } from '../services/productStorage';
import { colors, radius, spacing } from '../theme';
import { AppText } from './ui/AppText';
import { GlassCard } from './ui/GlassCard';
import { StatoVerdictPill } from './ui/Traffic';

type Props = {
  product: ScannedProduct;
  isIt: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
};

export function ProductFavoriteCard({
  product,
  isIt,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  compact = false,
}: Props) {
  const cardTint = product.status === 'verde' ? 'green'
    : product.status === 'giallo' ? 'yellow'
    : 'red';
  const accent = product.status === 'verde' ? colors.green
    : product.status === 'giallo' ? colors.amber
    : colors.red;

  return (
    <GlassCard
      padded={false}
      tint={cardTint}
      accentColor={accent}
      cardRadius={radius.lg}
      style={compact ? styles.cardCompact : styles.card}
    >
      <View style={styles.row}>
        <Pressable style={styles.mainTap} onPress={onPress}>
          <View style={styles.imageFrame}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="barcode-outline" size={22} color={colors.brand} />
              </View>
            )}
          </View>

          <View style={styles.body}>
            <AppText variant="bodyBold" numberOfLines={2}>{product.name}</AppText>
            <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
              {product.brand}
            </AppText>
            <View style={styles.metaRow}>
              <StatoVerdictPill
                stato={product.status}
                label={productStatusLabel(product.status, isIt)}
                size="sm"
              />
            </View>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {onToggleFavorite ? (
            <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.favBtn}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? colors.red : colors.onSurfaceMuted}
              />
            </Pressable>
          ) : null}
          <Pressable onPress={onPress} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  cardCompact: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    minHeight: 80,
  },
  mainTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minWidth: 0,
  },
  imageFrame: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3, minWidth: 0 },
  metaRow: { marginTop: 2 },
  actions: {
    alignItems: 'center',
    gap: 6,
  },
  favBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
