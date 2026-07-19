/**
 * Scroll containers — liquid glass demo pattern (blur cards + 12px gap + gutter).
 * Ref: https://github.com/hung940801/liquid_glass
 */
import React, { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_FLOAT_CLEARANCE, TAB_BAR_CLEARANCE, SCREEN_PADDING_H } from '../../layoutConstants';
import { colors, spacing } from '../../theme';
import { LiquidGlassView } from './LiquidGlassView';
import { glassShellBorder } from './glassFallback';

/** Gap tra card in liste verticali / orizzontali (.lgCards__list) */
export const GLASS_LIST_GAP = 14;

/** Gutter destro per scrollbar (.demoListYContainer padding-right) */
export const GLASS_SCROLL_GUTTER = 0;

/** Padding sotto carousel orizzontale (.demoListXContainer) */
export const GLASS_CAROUSEL_PAD_B = 8;

/** Larghezza card carousel (.lgCards--row grid-auto-columns) */
export const GLASS_CAROUSEL_CARD_W = 240;

type ScreenScrollProps = ScrollViewProps & {
  insetBottom?: number;
  /** true = spazio per SOS/notifiche (tab). false = solo safe area (stack). */
  headerFloat?: boolean;
};

/** Scroll principale schermata — sfondo visibile, gap uniforme tra blocchi vetro. */
export function GlassScreenScroll({
  contentContainerStyle,
  insetBottom = TAB_BAR_CLEARANCE,
  headerFloat = true,
  showsVerticalScrollIndicator = false,
  ...props
}: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (headerFloat ? HEADER_FLOAT_CLEARANCE : 8);

  return (
    <ScrollView
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={[
        styles.screenContent,
        { paddingTop: topPad, paddingBottom: insetBottom },
        contentContainerStyle,
      ]}
      {...props}
    />
  );
}

type CarouselProps = ScrollViewProps & {
  snap?: boolean;
  cardWidth?: number;
};

/** Carousel orizzontale card vetro (.demoListXContainer). */
export function GlassCarousel({
  contentContainerStyle,
  snap = false,
  cardWidth = GLASS_CAROUSEL_CARD_W,
  showsHorizontalScrollIndicator = false,
  decelerationRate = 'fast',
  ...props
}: CarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      decelerationRate={decelerationRate}
      snapToAlignment="start"
      {...(snap ? { snapToInterval: cardWidth + GLASS_LIST_GAP } : null)}
      contentContainerStyle={[styles.carouselContent, contentContainerStyle]}
      {...props}
    />
  );
}

type InsetScrollProps = ScrollViewProps & {
  maxHeight?: number;
  panelStyle?: StyleProp<ViewStyle>;
};

/** Lista scrollabile dentro un pannello vetro (.demoListYContainer). */
export function GlassInsetScroll({
  children,
  maxHeight = 400,
  panelStyle,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  ...props
}: InsetScrollProps) {
  return (
    <View style={[styles.insetPanel, { maxHeight }, panelStyle]}>
      <LiquidGlassView
        glassStyle="regular"
        tintColor="rgba(210, 195, 246, 0.18)"
        fallbackIntensity={70}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.insetContent, contentContainerStyle]}
        {...props}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Colonna card con gap liquid-glass. */
export function GlassList({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.list, style]}>{children}</View>;
}

/** Chip orizzontale vetro per feed “recenti”. */
export function GlassScrollChip({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.chip, style]}>
        <LiquidGlassView
          glassStyle="regular"
          tintColor="rgba(210, 195, 246, 0.20)"
          fallbackIntensity={66}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.chipContent}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.chip, style]}>
      <LiquidGlassView
        glassStyle="regular"
        tintColor="rgba(210, 195, 246, 0.20)"
        fallbackIntensity={66}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.chipContent}>{children}</View>
    </View>
  );
}

export const glassCardListStyle: ViewStyle = {
  gap: GLASS_LIST_GAP,
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.lg,
    gap: GLASS_LIST_GAP,
    alignItems: 'stretch',
  },
  carouselContent: {
    gap: GLASS_LIST_GAP,
    paddingBottom: GLASS_CAROUSEL_PAD_B,
    paddingHorizontal: SCREEN_PADDING_H,
  },
  insetPanel: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: 'transparent',
    ...glassShellBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignSelf: 'stretch',
  },
  insetContent: {
    gap: GLASS_LIST_GAP,
    padding: spacing.md,
  },
  list: {
    gap: GLASS_LIST_GAP,
    alignSelf: 'stretch',
  },
  chip: {
    overflow: 'hidden',
    borderRadius: 999,
    maxWidth: GLASS_CAROUSEL_CARD_W - 80,
    backgroundColor: 'transparent',
    ...glassShellBorder,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
});
