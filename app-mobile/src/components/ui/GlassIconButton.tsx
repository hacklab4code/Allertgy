import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, WIREFRAME_MODE } from '../../theme';
import { SafeBlurView } from './SafeBlurView';
import { useNativeLiquidGlass } from './useNativeLiquidGlass';
import { AppText } from './AppText';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  danger?: boolean;
  badge?: number;
  style?: StyleProp<ViewStyle>;
};

const ORB = 40;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Un solo cerchio liquid — blur/glass + icona, zero wrapper doppio. */
export function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  danger = false,
  badge,
  style,
}: Props) {
  const { native, glassOff } = useNativeLiquidGlass();
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tint = danger ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.38)';
  const iconColor = danger ? colors.red : colors.brandInk;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (WIREFRAME_MODE) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.orb, styles.wire, style]}
      >
        <AppText variant="caption">{accessibilityLabel.slice(0, 3).toUpperCase()}</AppText>
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 14, stiffness: 420 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 280 }); }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.orb, pressStyle, style]}
    >
      {native ? (
        <GlassView
          glassEffectStyle="clear"
          isInteractive={false}
          tintColor={tint}
          colorScheme="light"
          style={StyleSheet.absoluteFill}
        />
      ) : glassOff ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.88)' }]}
        />
      ) : (
        <>
          <SafeBlurView
            intensity={52}
            tint="systemUltraThinMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.06)']}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <View style={styles.iconSlot}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.white} style={styles.badgeText}>
            {badge > 9 ? '9+' : String(badge)}
          </AppText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    zIndex: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    zIndex: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  wire: {
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
});
