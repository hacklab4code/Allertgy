import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, font, WIREFRAME_MODE } from '../../theme';
import { SCAN_SPHERE_SIZE } from '../../layoutConstants';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { ScanSphere } from './ScanSphere';
import { LiquidGlassView } from './LiquidGlassView';
import { LiquidGlassContainer } from './LiquidGlassContainer';
import { LiquidGlassSlidingIndicator } from './LiquidGlassSlidingIndicator';
import { glassShellBorder } from './glassFallback';
import { IOS_TAB_SPRING } from './useNativeLiquidGlass';
import { useProfileSheet } from '../../store/profileSheet';
import { useActiveProfileAllergies } from '../../hooks/useActiveProfileAllergies';

type TabSlot =
  | { kind: 'route'; name: string; label: string; icon: string }
  | { kind: 'action'; id: 'scan'; label: string; icon: string };

const TAB_SLOTS: TabSlot[] = [
  { kind: 'route', name: 'home', label: 'Home', icon: 'home' },
  { kind: 'route', name: 'locali', label: 'Ristoranti', icon: 'restaurant' },
  { kind: 'action', id: 'scan', label: 'Scansiona', icon: 'scan' },
  { kind: 'route', name: 'preferiti', label: 'Preferiti', icon: 'heart' },
  { kind: 'route', name: 'account', label: 'Profilo', icon: 'person' },
];

const BAR_H = 62;
const BAR_RADIUS = 31;
const BAR_MARGIN_H = 16;
const BAR_MARGIN_BOTTOM = 8;
const BLOB_RENDER = Math.round(SCAN_SPHERE_SIZE * 1.35);
/** Quanto la sfera sporge sopra la pillola */
const BLOB_OVERHANG = Math.round(BLOB_RENDER * 0.42);
const ICON_SLOT_H = 30;
const TRACK_PAD_H = 4;
const TRACK_PAD_V = 6;
const BLOB_INSET = 3;

const ROUTE_SLOT_INDEX: Record<string, number> = {
  home: 0,
  locali: 1,
  preferiti: 3,
  account: 4,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  focused,
  icon,
  label,
  onPress,
  onLongPress,
  testID,
  profileBadge,
}: {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  testID: string;
  profileBadge?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const tint = focused ? colors.brand : colors.onSurfaceMuted;

  if (WIREFRAME_MODE) {
    return (
      <Pressable
        testID={testID}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[wireBox({ fill: focused ? '#000' : '#FFF' }), styles.wfTab]}
      >
        <AppText variant="caption" style={{ color: focused ? '#FFF' : '#000', textAlign: 'center', fontSize: 9 }}>
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      testID={testID}
      style={[styles.tabCol, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 16, stiffness: 380 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 280 }); }}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      onLongPress={onLongPress}
      delayLongPress={450}
    >
      <View style={styles.iconSlot}>
        <Ionicons
          name={(focused ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap}
          size={22}
          color={tint}
          style={styles.tabIcon}
        />
        {profileBadge ? (
          <View style={styles.profileBadge}>
            <AppText style={styles.profileBadgeText}>{profileBadge}</AppText>
          </View>
        ) : null}
      </View>
      <AppText
        variant="caption"
        style={[styles.tabLabel, { color: tint, fontFamily: focused ? font.semibold : font.displayMedium }]}
      >
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

function ScanColumn({ label }: { label: string }) {
  return (
    <View style={styles.scanCol} pointerEvents="none">
      <View style={styles.scanIconGap} />
      <AppText variant="caption" style={styles.scanLabel}>{label}</AppText>
    </View>
  );
}

export function PuffyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = width - BAR_MARGIN_H * 2;
  const shellHeight = BAR_H + BLOB_OVERHANG;
  const activeRoute = state.routes[state.index]?.name;
  const openSheet = useProfileSheet((s) => s.open);
  const { activeAvatar } = useActiveProfileAllergies();
  const [trackWidth, setTrackWidth] = useState(0);

  const activeSlotIndex = activeRoute ? (ROUTE_SLOT_INDEX[activeRoute] ?? 0) : 0;
  const slide = useSharedValue(activeSlotIndex);

  useEffect(() => {
    slide.value = withSpring(activeSlotIndex, IOS_TAB_SPRING);
  }, [activeSlotIndex, slide]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const slotWidth = trackWidth > 0 ? trackWidth / TAB_SLOTS.length : 0;

  const navigateToRoute = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeRoute !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const openScanner = () => {
    router.push('/scanner');
  };

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wfBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {TAB_SLOTS.map((slot) => {
          if (slot.kind === 'action') {
            return (
              <Pressable key={slot.id} style={[wireBox(), styles.wfTab]} onPress={openScanner}>
                <AppText variant="caption" style={{ textAlign: 'center', fontSize: 9 }}>{slot.label}</AppText>
              </Pressable>
            );
          }
          const focused = activeRoute === slot.name;
          const { options } = descriptors[state.routes.find((r) => r.name === slot.name)?.key ?? state.routes[0].key];
          const label = (options.tabBarLabel as string) ?? slot.label;
          return (
            <Pressable
              key={slot.name}
              style={[wireBox({ fill: focused ? '#000' : '#FFF' }), styles.wfTab]}
              onPress={() => navigateToRoute(slot.name)}
              onLongPress={slot.name === 'account' ? openSheet : undefined}
              delayLongPress={450}
            >
              <AppText variant="caption" style={{ color: focused ? '#FFF' : '#000', textAlign: 'center', fontSize: 9 }}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) + BAR_MARGIN_BOTTOM },
      ]}
    >
      <View style={[styles.barShell, { width: barWidth, height: shellHeight }]}>
        <LiquidGlassContainer spacing={16} style={[styles.barBody, { width: barWidth, height: BAR_H, top: BLOB_OVERHANG }]}>
          <LiquidGlassView
            glassStyle="clear"
            tintColor="rgba(124, 92, 255, 0.06)"
            fallbackIntensity={98}
            style={StyleSheet.absoluteFill}
          />

          <LiquidGlassSlidingIndicator
            slide={slide}
            slotWidth={slotWidth}
            inset={BLOB_INSET}
            top={TRACK_PAD_V + 1}
            left={TRACK_PAD_H}
            height={ICON_SLOT_H + 2}
          />

          <View style={styles.tabsRow} onLayout={onTrackLayout}>
            {TAB_SLOTS.map((slot) => {
              if (slot.kind === 'action') {
                return <ScanColumn key={slot.id} label={slot.label} />;
              }
              const focused = activeRoute === slot.name;
              const routeKey = state.routes.find((r) => r.name === slot.name)?.key;
              const { options } = descriptors[routeKey ?? state.routes[0].key];
              const label = (options.tabBarLabel as string) ?? slot.label;
              return (
                <TabItem
                  key={slot.name}
                  focused={focused}
                  icon={slot.icon}
                  label={label}
                  onPress={() => navigateToRoute(slot.name)}
                  onLongPress={slot.name === 'account' ? openSheet : undefined}
                  testID={`tab-${slot.name}`}
                  profileBadge={slot.name === 'account' ? activeAvatar.emoji : undefined}
                />
              );
            })}
          </View>
        </LiquidGlassContainer>

        <View style={[styles.blobAnchor, { width: barWidth }]}>
          <ScanSphere onPress={openScanner} testID="tab-scan" />
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
    alignItems: 'stretch',
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
    paddingHorizontal: BAR_MARGIN_H,
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 40,
    alignItems: 'center',
  },
  barShell: {
    position: 'relative',
    overflow: 'visible',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  barBody: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
    borderRadius: BAR_RADIUS,
    backgroundColor: 'transparent',
    ...glassShellBorder,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: TRACK_PAD_H,
    paddingBottom: 8,
    paddingTop: TRACK_PAD_V,
    zIndex: 2,
  },
  tabCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    minHeight: 44,
  },
  iconSlot: {
    width: 44,
    height: ICON_SLOT_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: { zIndex: 2 },
  profileBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.brand,
    zIndex: 3,
  },
  profileBadgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.05,
    textAlign: 'center',
  },
  scanCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingBottom: 0,
  },
  scanIconGap: {
    width: 44,
    height: ICON_SLOT_H,
  },
  scanLabel: {
    fontFamily: font.displayMedium,
    fontSize: 10,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  blobAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
    pointerEvents: 'box-none',
  },
});
