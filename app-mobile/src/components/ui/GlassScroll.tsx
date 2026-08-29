/**
 * Scroll containers — liquid glass demo pattern (blur cards + 12px gap + gutter).
 * Ref: https://github.com/hung940801/liquid_glass
 *
 * Animated.ScrollView + scrollViewOffset alimenta la view-timeline (ScrollEntry).
 */
import React, { type ReactNode, useCallback, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_FLOAT_CLEARANCE, TAB_BAR_CLEARANCE, SCREEN_PADDING_H } from '../../layoutConstants';
import { meshScrollY, useMeshScrollY } from '../../hooks/useMeshInk';
import { useFloatingHeader } from '../../store/floatingHeader';
import { colors, spacing } from '../../theme';
import { LiquidGlassView } from './LiquidGlassView';
import { glassShellBorder } from './glassFallback';
import { ScrollTimelineProvider } from './scrollTimeline';

/** ScrollView GH wrappata: gesture ok + scrollViewOffset Reanimated. */
const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

/** Gap tra card in liste verticali / orizzontali (.lgCards__list) */
export const GLASS_LIST_GAP = 14;

/** Gutter destro per scrollbar (.demoListYContainer padding-right) */
export const GLASS_SCROLL_GUTTER = 0;

/** Padding sotto carousel orizzontale (.demoListXContainer) */
export const GLASS_CAROUSEL_PAD_B = 8;

/** Larghezza card carousel (.lgCards--row grid-auto-columns) */
export const GLASS_CAROUSEL_CARD_W = 240;

/** Bridge JS throttled per massima fluidità nativa a 120fps. */
const JS_SCROLL_EPS = 32;

type ScreenScrollProps = ScrollViewProps & {
  insetBottom?: number;
  /** true = spazio per SOS/notifiche (tab). false = solo safe area (stack). */
  headerFloat?: boolean;
  /**
   * Aggiorna SOS/notifiche su scroll-down/up.
   * Default = headerFloat. Usa true con headerFloat false quando l'header è fuori dallo scroll
   * (es. Ristoranti).
   */
  trackFloatingChrome?: boolean;
  /** SharedValue opzionale per sincronizzare animazioni esterne (es. HomeTopHeader) a 120fps */
  externalScrollY?: SharedValue<number>;
  /** Padding superiore custom se fornito */
  topPaddingOverride?: number;
};

/** Scroll principale schermata — sfondo visibile, gap uniforme tra blocchi vetro. */
export function GlassScreenScroll({
  children,
  contentContainerStyle,
  style,
  insetBottom = TAB_BAR_CLEARANCE,
  headerFloat = true,
  trackFloatingChrome,
  externalScrollY,
  topPaddingOverride,
  showsVerticalScrollIndicator = false,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle,
  ...props
}: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const topPad = topPaddingOverride !== undefined
    ? topPaddingOverride
    : headerFloat
    ? insets.top + HEADER_FLOAT_CLEARANCE
    : spacing.sm;
  const trackChrome = trackFloatingChrome ?? headerFloat;
  const lastY = useRef(0);
  const reportScroll = useFloatingHeader((s) => s.reportScroll);
  const showHeader = useFloatingHeader((s) => s.show);
  const setMeshScrollY = useMeshScrollY((s) => s.setY);
  const scrollY = useSharedValue(0);
  const viewportH = useSharedValue(0);
  const contentH = useSharedValue(0);

  const lastJsY = useSharedValue(-9999);
  /** Offset locale: i tab restano montati — al focus ripristiniamo il wash corretto. */
  const localScrollY = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      meshScrollY.value = localScrollY.value;
      setMeshScrollY(localScrollY.value);
    }, [localScrollY, setMeshScrollY]),
  );

  const handleScrollJS = useCallback((y: number) => {
    setMeshScrollY(y);
    if (trackChrome) {
      const dy = y - lastY.current;
      lastY.current = y;
      reportScroll(y, dy);
    }
  }, [setMeshScrollY, trackChrome, reportScroll]);

  // UI-thread: scrollY + mesh fade ogni frame; JS (chrome) throttled → meno scatti
  const onScrollAnim = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      localScrollY.value = y;
      meshScrollY.value = y;
      if (externalScrollY) {
        externalScrollY.value = y;
      }
      if (Math.abs(y - lastJsY.value) >= JS_SCROLL_EPS) {
        lastJsY.value = y;
        runOnJS(handleScrollJS)(y);
      }
    },
  });

  return (
    <ScrollTimelineProvider scrollY={scrollY} viewportH={viewportH} contentH={contentH}>
      <AnimatedScrollView
        {...props}
        style={[styles.scroll, style]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        onScroll={onScrollAnim}
        onLayout={(event) => {
          viewportH.value = event.nativeEvent.layout.height;
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          contentH.value = height;
          onContentSizeChange?.(width, height);
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces
        alwaysBounceVertical={false}
        nestedScrollEnabled
        onMomentumScrollEnd={(e) => {
          props.onMomentumScrollEnd?.(e);
          handleScrollJS(e.nativeEvent.contentOffset.y);
          if (trackChrome && e.nativeEvent.contentOffset.y <= 12) {
            showHeader();
          }
        }}
        contentContainerStyle={[
          styles.screenContent,
          { paddingTop: topPad },
          contentContainerStyle,
          { paddingBottom: Math.max(insetBottom, (contentContainerStyle as any)?.paddingBottom ?? 0) },
        ]}
      >
        {children}
      </AnimatedScrollView>
    </ScrollTimelineProvider>
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
    <GHScrollView
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
      <GHScrollView
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.insetContent, contentContainerStyle]}
        {...props}
      >
        {children}
      </GHScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
