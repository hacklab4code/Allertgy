import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGUAGES } from '../constants/languages';
import { useSession } from '../store/session';
import { AppText } from './ui/AppText';
import { colors, spacing, radius, MIN_TOUCH_TARGET } from '../theme';

const SUPPORTED_CODES = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko', 'ru', 'tr', 'pl', 'nl'];

type Props = {
  /** Mostra il picker compatto in alto a destra (sezione avvio) */
  compact?: boolean;
  /** Solo il pulsante bandiera, per headerRight della navigation bar */
  inHeader?: boolean;
};

export default function LanguageFlagsRow({ compact = true, inHeader = false }: Props) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useSession();
  const insets = useSafeAreaInsets();
  const current = (language || 'it').toLowerCase();
  const isIt = current === 'it';

  const supportedLanguages = useMemo(
    () => LANGUAGES.filter((l) => SUPPORTED_CODES.includes(l.code)),
    [],
  );

  const active = supportedLanguages.find((l) => l.code === current) ?? supportedLanguages[0];

  const pick = (code: string) => {
    setLanguage(code);
    setOpen(false);
  };

  const trigger = (
    <Pressable
      style={inHeader ? styles.headerTrigger : styles.compactTrigger}
      onPress={() => setOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={isIt ? 'Cambia lingua' : 'Change language'}
    >
      <Text style={styles.compactFlag}>{active.flag}</Text>
      <Ionicons name="chevron-down" size={14} color={colors.onSurfaceMuted} />
    </Pressable>
  );

  const sheet = (
    <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.sheetHandle} />
        <AppText variant="title" style={styles.sheetTitle}>
          {isIt ? 'Scegli lingua' : 'Choose language'}
        </AppText>
        <ScrollView
          style={styles.sheetList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {supportedLanguages.map((lang) => {
            const selected = lang.code === current;
            return (
              <Pressable
                key={lang.code}
                style={[styles.langRow, selected && styles.langRowSelected]}
                onPress={() => pick(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langText}>
                  <AppText variant="bodyBold">{lang.nativeLabel}</AppText>
                  {lang.label !== lang.nativeLabel ? (
                    <AppText variant="caption" color={colors.onSurfaceMuted}>{lang.label}</AppText>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.brand} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );

  if (inHeader) {
    return (
      <View style={styles.headerWrap}>
        {trigger}
        {sheet}
      </View>
    );
  }

  if (!compact) {
    return (
      <View style={styles.legacyOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legacyContainer}
          keyboardShouldPersistTaps="handled"
        >
          {supportedLanguages.map((lang) => {
            const isActive = lang.code === current;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.legacyFlagButton, isActive && styles.legacyFlagButtonActive]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.legacyFlagEmoji}>{lang.flag}</Text>
                <Text style={[styles.legacyFlagText, isActive && styles.legacyFlagTextActive]}>
                  {lang.code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      <View style={styles.compactBar}>
        {trigger}
      </View>
      {sheet}
    </>
  );
}

const styles = StyleSheet.create({
  compactBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  compactTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  compactFlag: { fontSize: 22 },
  headerWrap: { marginRight: spacing.sm },
  headerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sheetList: { flexGrow: 0 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  langRowSelected: {
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
  },
  langFlag: { fontSize: 24 },
  langText: { flex: 1 },

  legacyOuter: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  legacyContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  legacyFlagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  legacyFlagButtonActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand,
  },
  legacyFlagEmoji: { fontSize: 18 },
  legacyFlagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
  },
  legacyFlagTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
});
