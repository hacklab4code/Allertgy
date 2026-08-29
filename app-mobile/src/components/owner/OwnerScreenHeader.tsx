import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors, radius, spacing } from '../../theme';

/** Header secondario owner: indietro → Profilo + titolo schermo. */
export function OwnerScreenHeader({
  title,
  subtitle,
  backTo = '/(owner)/account',
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => router.push(backTo as any)}
        hitSlop={10}
        accessibilityLabel="Torna al profilo"
      >
        <Ionicons name="chevron-back" size={20} color={colors.brandInk} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <AppText variant="h2" style={{ fontSize: 18 }} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.onSurfaceMuted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
