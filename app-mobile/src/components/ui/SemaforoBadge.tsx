import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  SEMAFORO_TOKENS,
  SemaforoStatus,
  normalizeSemaforoStatus,
} from '../../designTokens';
import { font, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';

export type SemaforoBadgeVariant = 'soft' | 'solid' | 'outline' | 'hero' | 'dot';
export type SemaforoBadgeSize = 'sm' | 'md' | 'lg' | 'hero';

export interface SemaforoBadgeProps {
  /** Stato del semaforo: 'safe' | 'warning' | 'danger' | 'neutral' (o alias 'green' | 'yellow' | 'red' | 'verde' | 'giallo' | 'rosso') */
  status: SemaforoStatus | 'green' | 'yellow' | 'red' | 'verde' | 'giallo' | 'rosso' | string;
  /** Variante stilistica (default: 'soft') */
  variant?: SemaforoBadgeVariant;
  /** Dimensione del badge (default: 'md') */
  size?: SemaforoBadgeSize;
  /** Testo principale personalizzato (se omesso usa 'Idoneo', 'Attenzione', 'Non idoneo') */
  label?: string;
  /** Sottotitolo / spiegazione (usato soprattutto in variante 'hero') */
  sublabel?: string;
  /** Lista allergeni rilevati (es. ['Glutine', 'Latte']) per chiarezza istantanea */
  allergens?: string[] | string;
  /** Mostra icona vettoriale (default: true) */
  showIcon?: boolean;
  /** Icona vettoriale personalizzata (Ionicons name) */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Forzatura uppercase per il testo (default: true per 'dot'/'soft'/'outline', false per 'hero') */
  uppercase?: boolean;
  /** Callback opzionale al tap (con feedback aptico) */
  onPress?: () => void;
  /** Stile aggiuntivo per il container */
  style?: ViewStyle;
  /** Classi Tailwind / NativeWind aggiuntive */
  className?: string;
  /** Test ID per automazione */
  testID?: string;
}

export function SemaforoBadge({
  status: rawStatus,
  variant = 'soft',
  size = 'md',
  label,
  sublabel,
  allergens,
  showIcon = true,
  iconName,
  uppercase,
  onPress,
  style,
  testID,
}: SemaforoBadgeProps) {
  const status = normalizeSemaforoStatus(rawStatus);
  const token = SEMAFORO_TOKENS[status];

  const isUppercase = uppercase ?? (variant !== 'hero');
  const mainLabel = label ?? token.label;
  const displayText = isUppercase ? mainLabel.toUpperCase() : mainLabel;
  const displaySublabel = sublabel ?? token.sublabel;

  const allergensList: string[] = Array.isArray(allergens)
    ? allergens
    : typeof allergens === 'string' && allergens.trim()
      ? allergens.split(',').map((a) => a.trim())
      : [];

  const handlePress = () => {
    if (!onPress) return;
    try {
      if (Platform.OS !== 'web') {
        if (status === 'danger') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (status === 'warning') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {
      /* no-op */
    }
    onPress();
  };

  // Modalità wireframe pura per layout testing
  if (WIREFRAME_MODE) {
    const symbol = status === 'safe' ? '🟢 [V]' : status === 'warning' ? '🟡 [G]' : status === 'danger' ? '🔴 [R]' : '⚪ [?]';
    return (
      <View style={[wireBox(), styles.base, styles.sizeMd, style]} testID={testID}>
        <Text style={{ fontFamily: font.bold, fontSize: 12 }}>
          {symbol} {displayText}
        </Text>
      </View>
    );
  }

  // Dimensioni icone
  const iconSizeMap: Record<SemaforoBadgeSize, number> = {
    sm: 13,
    md: 16,
    lg: 20,
    hero: 44,
  };
  const iconSize = iconSizeMap[size];
  const effectiveIconName = iconName ?? token.icon;

  // 1. VARIANTE HERO (Schermata Scanner & Risultato Piatto)
  if (variant === 'hero') {
    const heroBg = token.soft;
    const heroBorder = token.border;
    const heroSolid = token.solid;

    const Content = (
      <View
        style={[
          styles.heroContainer,
          { backgroundColor: heroBg, borderColor: heroBorder },
          style,
        ]}
        testID={testID}
      >
        <View style={[styles.heroIconCircle, { backgroundColor: heroSolid }]}>
          <Ionicons name={effectiveIconName} size={iconSize} color="#FFFFFF" />
        </View>

        <Text style={[styles.heroTitle, { color: token.text }]}>{displayText}</Text>

        {displaySublabel ? (
          <Text style={[styles.heroSubtitle, { color: token.text }]}>
            {displaySublabel}
          </Text>
        ) : null}

        {allergensList.length > 0 && (
          <View style={styles.heroAllergensWrap}>
            {allergensList.map((allergen, idx) => (
              <View
                key={`${allergen}-${idx}`}
                style={[
                  styles.allergenChip,
                  {
                    backgroundColor: status === 'danger' ? '#FEE2E2' : '#FEF3C7',
                    borderColor: status === 'danger' ? '#FCA5A5' : '#FCD34D',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.allergenChipText,
                    { color: status === 'danger' ? '#991B1B' : '#92400E' },
                  ]}
                >
                  ⚠️ {allergen}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          {Content}
        </Pressable>
      );
    }
    return Content;
  }

  // 2. VARIANTE DOT (Micro indicatore compatto)
  if (variant === 'dot') {
    const dotSize = size === 'lg' ? 10 : size === 'sm' ? 6 : 8;
    const Content = (
      <View style={[styles.dotRow, style]} testID={testID}>
        <View
          style={[
            styles.dotIndicator,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: token.solid,
            },
          ]}
        />
        <Text style={[styles.dotLabel, { color: token.text }, textSizes[size]]}>
          {displayText}
        </Text>
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          {Content}
        </Pressable>
      );
    }
    return Content;
  }

  // 3. COLORI PER SOFT / SOLID / OUTLINE
  let containerBg: string = token.soft;
  let borderColor: string = token.border;
  let textColor: string = token.text;
  let iconColor: string = token.solid;

  if (variant === 'solid') {
    containerBg = token.solid;
    borderColor = token.solid;
    textColor = '#FFFFFF';
    iconColor = '#FFFFFF';
  } else if (variant === 'outline') {
    containerBg = 'transparent';
    borderColor = token.solid;
    textColor = token.text;
    iconColor = token.solid;
  }

  const BadgeContent = (
    <View
      style={[
        styles.base,
        badgeSizes[size],
        { backgroundColor: containerBg, borderColor },
        style,
      ]}
      testID={testID}
    >
      {showIcon && (
        <Ionicons name={effectiveIconName} size={iconSize} color={iconColor} style={styles.icon} />
      )}
      <Text
        style={[
          styles.label,
          { color: textColor },
          textSizes[size],
          variant === 'solid' && { fontWeight: '800' },
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
        {BadgeContent}
      </Pressable>
    );
  }

  return BadgeContent;
}

const badgeSizes = StyleSheet.create({
  sm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    gap: 4,
  },
  md: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    gap: 6,
  },
  lg: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    gap: 8,
  },
  hero: {
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
});

const textSizes = StyleSheet.create({
  sm: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  md: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  lg: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  hero: {
    fontSize: 20,
    letterSpacing: 0.1,
  },
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  sizeMd: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
  },
  icon: {
    flexShrink: 0,
  },
  label: {
    fontFamily: font.bold,
    fontWeight: '700',
    includeFontPadding: false,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    flexShrink: 0,
  },
  dotLabel: {
    fontFamily: font.semibold,
    fontWeight: '600',
  },
  heroContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  heroTitle: {
    fontFamily: font.displayBold,
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  heroAllergensWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  allergenChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  allergenChipText: {
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '700',
  },
});
