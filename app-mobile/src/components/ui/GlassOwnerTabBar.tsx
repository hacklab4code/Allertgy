import React, { useEffect, useId } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';

const OWNER_TAB_ICONS = {
  locali: require('../../../assets/owner_tab_locali.png'),
  menu: require('../../../assets/owner_tab_menu.png'),
  qr: require('../../../assets/owner_tab_qr.png'),
  account: require('../../../assets/owner_tab_account.png'),
} as const satisfies Record<string, ImageSourcePropType>;

const TAB_ICON_SIZE = 34;
const TAB_ICON_SIZE_ACTIVE = 34;

const OWNER_SLOTS = [
  { name: 'locali', label: 'Attività' },
  { name: 'menu', label: 'Menù' },
  { name: 'qr', label: 'QR Tavoli' },
  { name: 'account', label: 'Profilo' },
] as const;

const SEMAFORO = {
  green: colors.green,
  yellow: colors.yellow,
  red: colors.red,
} as const;

const H_INSET = 18;
const BAR_H = 56;
const CIRCLE_R = 27;
const NOTCH_R = CIRCLE_R + 6;
const SHOULDER = 12;
const DIP = 4;
const SIDE_PAD = NOTCH_R + SHOULDER + 8;
const ICON_LIFT = -(BAR_H / 2);
const SPRING = { damping: 18, stiffness: 180, mass: 0.75 };
const DOCK = colors.ink;

const ROUTE_INDEX: Record<string, number> = {
  locali: 0,
  menu: 1,
  qr: 2,
  account: 3,
  // Schermate secondarie
  scheda: 0, // sotto Attività
  registro: 2, // sotto QR
  crescita: 3,
  piano: 3,
  recensioni: 3,
  statistiche: 3,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

function slotIndexForRoute(routeName: string | undefined): number {
  if (!routeName) return 0;
  return ROUTE_INDEX[routeName] ?? 0;
}

function centerX(progress: number, slotW: number): number {
  'worklet';
  return SIDE_PAD + progress * slotW + slotW / 2;
}

function dockPath(w: number, h: number, cx: number, top: number): string {
  'worklet';
  const cr = h / 2;
  const R = NOTCH_R;
  const s = SHOULDER;
  const dip = DIP;
  const bottom = top + h;

  const lFlat = cx - R - s;
  const lArc = cx - R;
  const rArc = cx + R;
  const rFlat = cx + R + s;

  return [
    `M ${cr} ${top}`,
    `L ${lFlat} ${top}`,
    `C ${lFlat + s * 0.55} ${top} ${lArc} ${top} ${lArc} ${top + dip}`,
    `A ${R} ${R} 0 0 0 ${rArc} ${top + dip}`,
    `C ${rArc} ${top} ${rFlat - s * 0.55} ${top} ${rFlat} ${top}`,
    `L ${w - cr} ${top}`,
    `A ${cr} ${cr} 0 0 1 ${w} ${top + cr}`,
    `L ${w} ${bottom - cr}`,
    `A ${cr} ${cr} 0 0 1 ${w - cr} ${bottom}`,
    `L ${cr} ${bottom}`,
    `A ${cr} ${cr} 0 0 1 0 ${bottom - cr}`,
    `L 0 ${top + cr}`,
    `A ${cr} ${cr} 0 0 1 ${cr} ${top}`,
    'Z',
  ].join(' ');
}

function OwnerTabItem({
  slot,
  index,
  activeIndex,
  progress,
  onPress,
}: {
  slot: (typeof OWNER_SLOTS)[number];
  index: number;
  activeIndex: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const focused = index === activeIndex;

  const iconStyle = useAnimatedStyle(() => {
    const dist = Math.abs(progress.value - index);
    const lift = interpolate(dist, [0, 0.35, 1], [ICON_LIFT, 0, 0], Extrapolation.CLAMP);
    const scale = interpolate(dist, [0, 0.35, 1], [1.06, 1, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: lift }, { scale }] };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={slot.label}
      accessibilityState={{ selected: focused }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.tabHit}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Image
          source={OWNER_TAB_ICONS[slot.name]}
          style={[styles.tabIcon, focused && styles.tabIconActive]}
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

/** GlassOwnerTabBar — Stessa identica Tab Bar Floating a valle SVG + bagliore semaforo (🔴 🟡 🟢) + cerchio animato dell'Area Clienti. */
export function GlassOwnerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const uid = useId().replace(/:/g, '');
  const glowId = `owner-glow-${uid}`;
  const wellClipId = `owner-well-${uid}`;

  const activeRoute = state.routes[state.index]?.name;
  const activeIndex = slotIndexForRoute(activeRoute);

  const progress = useSharedValue(activeIndex);
  const barW = winW - H_INSET * 2;
  const slotW = (barW - SIDE_PAD * 2) / OWNER_SLOTS.length;
  const bottomSafe = Math.max(insets.bottom, 10);

  const barTop = CIRCLE_R + 2;
  const svgH = barTop + BAR_H;
  const totalH = svgH;

  useEffect(() => {
    progress.value = withSpring(activeIndex, SPRING);
  }, [activeIndex, progress]);

  const dockProps = useAnimatedProps(() => {
    const cx = centerX(progress.value, slotW);
    return { d: dockPath(barW, BAR_H, cx, barTop) };
  });

  const cxProps = useAnimatedProps(() => ({
    cx: centerX(progress.value, slotW),
  }));

  const wellGlowProps = useAnimatedProps(() => ({
    cx: centerX(progress.value, slotW),
    rx: CIRCLE_R + 4,
    ry: CIRCLE_R - 2,
  }));

  const navigateToRoute = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeRoute !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wfBar, { paddingBottom: bottomSafe }]}>
        {OWNER_SLOTS.map((slot) => {
          const focused = activeRoute === slot.name;
          return (
            <Pressable
              key={slot.name}
              style={[wireBox({ fill: focused ? '#000' : '#FFF' }), styles.wfTab]}
              onPress={() => navigateToRoute(slot.name)}
            >
              <AppText variant="caption" style={{ color: focused ? '#FFF' : '#000', fontSize: 10 }}>
                {slot.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomSafe }]} pointerEvents="box-none">
      <View style={{ width: barW, height: totalH }}>
        <Svg width={barW} height={totalH}>
          <Defs>
            <SvgLinearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={SEMAFORO.red} />
              <Stop offset="50%" stopColor={SEMAFORO.yellow} />
              <Stop offset="100%" stopColor={SEMAFORO.green} />
            </SvgLinearGradient>
            <ClipPath id={wellClipId}>
              <Rect x={0} y={barTop + DIP + 1} width={barW} height={NOTCH_R + 2} />
            </ClipPath>
          </Defs>

          <AnimatedPath animatedProps={dockProps} fill={DOCK} />

          <G clipPath={`url(#${wellClipId})`}>
            <AnimatedEllipse
              animatedProps={wellGlowProps}
              cy={barTop + 14}
              fill={`url(#${glowId})`}
              opacity={0.42}
            />
          </G>

          <AnimatedCircle
            animatedProps={cxProps}
            cy={barTop}
            r={CIRCLE_R}
            fill={DOCK}
          />
        </Svg>

        <View
          style={[styles.tabsRow, { top: barTop, height: BAR_H, paddingHorizontal: SIDE_PAD }]}
          pointerEvents="box-none"
        >
          {OWNER_SLOTS.map((slot, index) => (
            <OwnerTabItem
              key={slot.name}
              slot={slot}
              index={index}
              activeIndex={activeIndex}
              progress={progress}
              onPress={() => navigateToRoute(slot.name)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    alignItems: 'center',
    overflow: 'visible',
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  tabHit: {
    flex: 1,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    opacity: 0.92,
  },
  tabIconActive: {
    width: TAB_ICON_SIZE_ACTIVE,
    height: TAB_ICON_SIZE_ACTIVE,
    opacity: 1,
  },
  wfBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  wfTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
});
