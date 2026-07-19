import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing, WIREFRAME_MODE } from '../../theme';
import { wireBox } from '../../wireframe';
import { AppText } from './AppText';
import { LiquidGlassView } from './LiquidGlassView';
import { LiquidGlassContainer } from './LiquidGlassContainer';
import { LiquidGlassSlidingIndicator } from './LiquidGlassSlidingIndicator';
import { glassShellBorder } from './glassFallback';
import { IOS_TAB_SPRING } from './useNativeLiquidGlass';

export type VenueTab = 'menu' | 'warning' | 'esperienza' | 'info';

type TabDef = {
  id: Exclude<VenueTab, 'menu'>;
  labelIt: string;
  labelEn: string;
  icon: string;
};

const TABS: TabDef[] = [
  { id: 'warning', labelIt: 'Warning', labelEn: 'Warnings', icon: 'warning' },
  { id: 'esperienza', labelIt: 'Scrivi esperienza', labelEn: 'Write review', icon: 'create' },
  { id: 'info', labelIt: 'Info', labelEn: 'Info', icon: 'information-circle' },
];

const BAR_H = 58;
const BAR_RADIUS = 29;
const BAR_MARGIN_H = 16;
const BAR_MARGIN_BOTTOM = 8;
const TRACK_PAD = 5;
const ICON_SLOT_H = 30;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  focused,
  icon,
  label,
  badge,
  onPress,
}: {
  focused: boolean;
  icon: string;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const tint = focused ? colors.brand : colors.onSurfaceMuted;

  if (WIREFRAME_MODE) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
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
      style={[styles.item, animatedStyle]}
      onPressIn={() => (scale.value = withSpring(0.94, { damping: 16, stiffness: 380 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 280 }))}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.iconSlot}>
        <Ionicons
          name={(focused ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap}
          size={20}
          color={tint}
          style={styles.tabIcon}
        />
        {badge != null && badge > 0 ? (
          <View style={[styles.badge, !focused && styles.badgeMuted]}>
            <AppText variant="caption" style={styles.badgeText}>{badge > 9 ? '9+' : badge}</AppText>
          </View>
        ) : null}
      </View>
      <AppText
        variant="caption"
        style={[styles.label, { color: tint, fontFamily: focused ? font.semibold : font.displayMedium }]}
      >
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

type Props = {
  active: VenueTab;
  onChange: (tab: VenueTab) => void;
  language: string;
  warningCount?: number;
};

export function VenueBottomBar({ active, onChange, language, warningCount }: Props) {
  const insets = useSafeAreaInsets();
  const isIt = (language || 'it').toLowerCase() === 'it';
  const [barWidth, setBarWidth] = useState(0);

  const activeIndex = active === 'menu' ? -1 : Math.max(0, TABS.findIndex((t) => t.id === active));
  const slide = useSharedValue(activeIndex >= 0 ? activeIndex : 0);

  useEffect(() => {
    if (activeIndex >= 0) {
      slide.value = withSpring(activeIndex, IOS_TAB_SPRING);
    }
  }, [activeIndex, slide]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const tabWidth = barWidth > 0 ? (barWidth - TRACK_PAD * 2) / TABS.length : 0;

  const handleTabPress = (tabId: Exclude<VenueTab, 'menu'>) => {
    if (active === tabId) {
      onChange('menu');
    } else {
      onChange(tabId);
    }
  };

  if (WIREFRAME_MODE) {
    return (
      <View style={[styles.wfBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {TABS.map((tab) => {
          const focused = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[wireBox({ fill: focused ? '#000' : '#FFF' }), styles.wfTab]}
              onPress={() => handleTabPress(tab.id)}
            >
              <AppText variant="caption" style={{ color: focused ? '#FFF' : '#000', textAlign: 'center', fontSize: 9 }}>
                {isIt ? tab.labelIt : tab.labelEn}
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
      <View style={[styles.barShell, { height: BAR_H }]}>
        <LiquidGlassContainer spacing={14} style={[styles.barBody, { height: BAR_H }]} onLayout={onBarLayout}>
          <LiquidGlassView
            glassStyle="clear"
            tintColor="rgba(210, 195, 246, 0.14)"
            fallbackIntensity={98}
            style={StyleSheet.absoluteFill}
          />

          {activeIndex >= 0 ? (
            <LiquidGlassSlidingIndicator
              slide={slide}
              slotWidth={tabWidth}
              inset={0}
              top={TRACK_PAD}
              left={TRACK_PAD}
              height={BAR_H - TRACK_PAD * 2}
              borderRadius={radius.pill}
            />
          ) : null}

          <View style={styles.barInner}>
            {TABS.map((tab) => (
              <TabItem
                key={tab.id}
                focused={active === tab.id}
                icon={tab.icon}
                label={isIt ? tab.labelIt : tab.labelEn}
                badge={tab.id === 'warning' ? warningCount : undefined}
                onPress={() => handleTabPress(tab.id)}
              />
            ))}
          </View>
        </LiquidGlassContainer>
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
  wfTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
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
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  barBody: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: BAR_RADIUS,
    backgroundColor: 'transparent',
    ...glassShellBorder,
  },
  barInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: TRACK_PAD,
    paddingBottom: 6,
    paddingTop: 4,
    zIndex: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    minHeight: 44,
    paddingVertical: 2,
  },
  iconSlot: {
    width: 40,
    height: ICON_SLOT_H,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tabIcon: { zIndex: 2 },
  label: { fontSize: 9, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 3,
  },
  badgeMuted: { backgroundColor: colors.amber },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', lineHeight: 12 },
});
