/**
 * Tab bar floating — valle + sfera seguono il tasto selezionato.
 * Home · Locali · Scan · Preferiti · Profilo
 */
import React, { useEffect, useId, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router, usePathname } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { useActiveProfileAllergies } from '../../hooks/useActiveProfileAllergies';
import { useProfileSheet } from '../../store/profileSheet';
import { useSession } from '../../store/session';
import { colors, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
const TAB_ICONS = {
  home: require('../../../assets/tab_home.png'),
  locali: require('../../../assets/tab_locali.png'),
  scan: require('../../../assets/tab_qr.png'),
  preferiti: require('../../../assets/tab_preferiti.png'),
  account: require('../../../assets/tab_account.png'),
} as const satisfies Record<string, ImageSourcePropType>;

const SEMAFORO = {
  green: colors.green,
  yellow: colors.yellow,
  red: colors.red,
} as const;

type TabSlot =
  | { kind: 'route'; name: keyof typeof TAB_ICONS; label: string }
  | { kind: 'action'; id: 'scan'; label: string };

const TAB_SLOTS: TabSlot[] = [
  { kind: 'route', name: 'home', label: 'Home' },
  { kind: 'route', name: 'locali', label: 'Ristoranti' },
  { kind: 'action', id: 'scan', label: 'Scansiona' },
  { kind: 'route', name: 'preferiti', label: 'Preferiti' },
  { kind: 'route', name: 'account', label: 'Profilo' },
];

const H_INSET = 32;
const BAR_H = 56;
const CIRCLE_R = 27;
const NOTCH_R = CIRCLE_R + 6;
const SHOULDER = 12;
const DIP = 4;
const SIDE_PAD = NOTCH_R + SHOULDER + 6;
const ICON_LIFT = -(BAR_H / 2);
const SCAN_SLOT = 2;
const SPRING = { damping: 18, stiffness: 180, mass: 0.75 };
const DOCK = colors.ink;

const TAB_ICON_SIZE = 26;
const TAB_ICON_SIZE_ACTIVE = 30;
/** Diametro avatar profilo attivo = cerchio dock (bordo su bordo). */
const PROFILE_AVATAR_SIZE = CIRCLE_R * 2;
const PROFILE_AVATAR_SIZE_IDLE = TAB_ICON_SIZE + 4;

const ROUTE_SLOT_INDEX: Record<string, number> = {
  home: 0,
  locali: 1,
  preferiti: 3,
  account: 4,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

function slotIndexForRoute(routeName: string | undefined): number {
  if (!routeName) return 0;
  return ROUTE_SLOT_INDEX[routeName] ?? 0;
}

function centerX(progress: number, slotW: number): number {
  'worklet';
  return SIDE_PAD + progress * slotW + slotW / 2;
}

function dockPath(w: number, h: number, cx: number, top: number, dipFactor: number = 1): string {
  'worklet';
  const cr = h / 2;
  const dip = DIP * dipFactor;
  const bottom = top + h;

  if (dip <= 0.01) {
    return [
      `M ${cr} ${top}`,
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

  const R = NOTCH_R;
  const s = SHOULDER;

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

function TabIcon({
  slot,
  index,
  selected,
  progress,
  sheetOpen,
  onPress,
  onLongPress,
  testID,
  profilePhotoUrl,
  profileEmoji,
  profileColor,
}: {
  slot: TabSlot;
  index: number;
  selected: boolean;
  progress: SharedValue<number>;
  sheetOpen: SharedValue<number>;
  onPress: () => void;
  onLongPress?: () => void;
  testID: string;
  profilePhotoUrl?: string | null;
  profileEmoji?: string;
  profileColor?: string;
}) {
  const iconKey = slot.kind === 'action' ? slot.id : slot.name;
  const source = TAB_ICONS[iconKey];
  const isAccount = slot.kind === 'route' && slot.name === 'account';
  const useProfileAvatar = isAccount && (!!profilePhotoUrl || (!!profileEmoji && !!profileColor));
  const avatarSize = selected ? PROFILE_AVATAR_SIZE : PROFILE_AVATAR_SIZE_IDLE;

  const iconStyle = useAnimatedStyle(() => {
    const dist = Math.abs(progress.value - index);
    const baseLift = interpolate(dist, [0, 0.35, 1], [ICON_LIFT, 0, 0], Extrapolation.CLAMP);
    const lift = baseLift * (1 - sheetOpen.value);
    // Avatar profilo: niente scale extra — deve restare concentrica col cerchio dock
    const baseScale = useProfileAvatar
      ? 1
      : interpolate(dist, [0, 0.35, 1], [1.08, 1, 1], Extrapolation.CLAMP);
    const scale = 1 + (baseScale - 1) * (1 - sheetOpen.value);
    return { transform: [{ translateY: lift }, { scale }] };
  });

  const animatedAvatarStyle = useAnimatedStyle(() => {
    const active = selected && sheetOpen.value < 0.5;
    const currentSize = active
      ? interpolate(sheetOpen.value, [0, 1], [PROFILE_AVATAR_SIZE, PROFILE_AVATAR_SIZE_IDLE], Extrapolation.CLAMP)
      : PROFILE_AVATAR_SIZE_IDLE;
    return {
      width: currentSize,
      height: currentSize,
      borderRadius: currentSize / 2,
      borderWidth: active ? 0 : 1.5,
      borderColor: 'rgba(255,255,255,0.55)',
      opacity: active ? 1 : 0.88,
    };
  });

  const animatedAvatarWrapStyle = useAnimatedStyle(() => {
    const active = selected && sheetOpen.value < 0.5;
    const wrapSize = active
      ? interpolate(sheetOpen.value, [0, 1], [PROFILE_AVATAR_SIZE, 44], Extrapolation.CLAMP)
      : 44;
    return {
      width: wrapSize,
      height: wrapSize,
    };
  });

  let iconNode: React.ReactNode;
  if (isAccount && profilePhotoUrl) {
    iconNode = (
      <Animated.Image
        source={{ uri: profilePhotoUrl }}
        style={[styles.profilePhoto, animatedAvatarStyle]}
      />
    );
  } else if (isAccount && profileEmoji && profileColor) {
    iconNode = (
      <Animated.View
        style={[
          styles.profileEmojiBubble,
          { backgroundColor: profileColor },
          animatedAvatarStyle,
        ]}
      >
        <Text style={{ fontSize: 14, textAlign: 'center', lineHeight: 16 }}>
          {profileEmoji}
        </Text>
      </Animated.View>
    );
  } else {
    iconNode = (
      <Image
        source={source}
        style={[styles.tabIcon, selected && styles.tabIconActive]}
        resizeMode="contain"
      />
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={slot.label}
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={styles.tabHit}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          useProfileAvatar && animatedAvatarWrapStyle,
          iconStyle,
        ]}
      >
        {iconNode}
      </Animated.View>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const pathname = usePathname();
  const uid = useId().replace(/:/g, '');
  const glowId = `glow-${uid}`;
  const wellClipId = `well-${uid}`;

  const activeRoute = state.routes[state.index]?.name;
  const sheetVisible = useProfileSheet((s) => s.visible);
  const openSheet = useProfileSheet((s) => s.open);
  const closeSheet = useProfileSheet((s) => s.close);
  const token = useSession((s) => s.token);
  const profilePhotoUrl = useSession((s) => s.profilePhotoUrl);
  const setProfilePhotoUrl = useSession((s) => s.setProfilePhotoUrl);
  const { activeAvatar, isSelf } = useActiveProfileAllergies();

  const [scanRaised, setScanRaised] = useState(false);
  const onScanner = typeof pathname === 'string' && pathname.includes('scanner');
  const activeIndex = scanRaised || onScanner ? SCAN_SLOT : slotIndexForRoute(activeRoute);

  const progress = useSharedValue(activeIndex);
  const sheetOpen = useSharedValue(sheetVisible ? 1 : 0);
  const barW = winW - H_INSET * 2;
  const slotW = (barW - SIDE_PAD * 2) / TAB_SLOTS.length;
  const bottomSafe = Math.max(insets.bottom, 10);

  useEffect(() => {
    sheetOpen.value = withSpring(sheetVisible ? 1 : 0, SPRING);
  }, [sheetVisible, sheetOpen]);

  useEffect(() => {
    if (!token) {
      setProfilePhotoUrl(null);
      return;
    }
    let cancelled = false;
    api.getProfilePhoto()
      .then((photo) => {
        if (!cancelled) setProfilePhotoUrl(photo?.photo_url ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfilePhotoUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, setProfilePhotoUrl]);

  /** Foto solo per profilo principale; famiglia → emoji del profilo attivo. */
  const accountPhotoUrl = isSelf ? profilePhotoUrl : null;
  const barTop = CIRCLE_R + 2;
  const totalH = barTop + BAR_H;

  useEffect(() => {
    if (!onScanner) setScanRaised(false);
  }, [onScanner]);

  useEffect(() => {
    progress.value = withSpring(activeIndex, SPRING);
  }, [activeIndex, progress]);

  const dockProps = useAnimatedProps(() => {
    const cx = centerX(progress.value, slotW);
    return { d: dockPath(barW, BAR_H, cx, barTop, 1 - sheetOpen.value) };
  });

  const cxProps = useAnimatedProps(() => ({
    cx: centerX(progress.value, slotW),
    r: (1 - sheetOpen.value) * CIRCLE_R,
  }));

  const wellGlowProps = useAnimatedProps(() => ({
    cx: centerX(progress.value, slotW),
    rx: CIRCLE_R + 4,
    ry: CIRCLE_R - 2,
    opacity: (1 - sheetOpen.value) * 0.42,
  }));

  const navigateToRoute = (name: string) => {
    setScanRaised(false);
    closeSheet();
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeRoute !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const openScanner = () => {
    setScanRaised(true);
    closeSheet();
    router.push('/scanner');
  };

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wfBar, { paddingBottom: bottomSafe }]}>
        {TAB_SLOTS.map((slot) => {
          const key = slot.kind === 'action' ? slot.id : slot.name;
          const focused = slot.kind === 'route' && activeRoute === slot.name;
          return (
            <Pressable
              key={key}
              style={[wireBox({ fill: focused ? '#000' : '#FFF' }), styles.wfTab]}
              onPress={slot.kind === 'action' ? openScanner : () => navigateToRoute(slot.name)}
            >
              <AppText variant="caption" style={{ color: focused ? '#FFF' : '#000', fontSize: 9 }}>
                {slot.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.tabBarRow, { marginBottom: bottomSafe }]}>
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
            {TAB_SLOTS.map((slot, index) => {
              const key = slot.kind === 'action' ? slot.id : slot.name;
              const selected = index === activeIndex;
              const isAccount = slot.kind === 'route' && slot.name === 'account';
              return (
                <TabIcon
                  key={key}
                  slot={slot}
                  index={index}
                  selected={selected}
                  progress={progress}
                  sheetOpen={sheetOpen}
                  onPress={
                    slot.kind === 'action' ? openScanner : () => navigateToRoute(slot.name)
                  }
                  onLongPress={
                    slot.kind === 'route' && slot.name === 'account' ? openSheet : undefined
                  }
                  testID={slot.kind === 'action' ? 'tab-scan' : `tab-${slot.name}`}
                  profilePhotoUrl={isAccount ? accountPhotoUrl : undefined}
                  profileEmoji={isAccount ? activeAvatar.emoji : undefined}
                  profileColor={isAccount ? activeAvatar.color : undefined}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
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
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    overflow: 'visible',
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapProfile: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
  },
  tabIcon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    opacity: 0.72,
  },
  tabIconActive: {
    width: TAB_ICON_SIZE_ACTIVE,
    height: TAB_ICON_SIZE_ACTIVE,
    opacity: 1,
  },
  profilePhoto: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  profileEmojiBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
