import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, WIREFRAME_MODE } from '../../theme';
import { AppText } from './AppText';
import { LiquidGlassView } from './LiquidGlassView';

type Props = {
  /** Ionicons — usato se `image` non è passato */
  icon?: keyof typeof Ionicons.glyphMap;
  /** PNG 3D soft — ha priorità su `icon` */
  image?: ImageSourcePropType;
  /** Dimensione PNG (default 52) */
  imageSize?: number;
  /**
   * solid = cerchio liquid glass (header)
   * ghost = solo icona, niente vetro (sopra foto)
   */
  variant?: 'solid' | 'ghost';
  /** Diametro tap target / orb (default 44 solid / 52 ghost) */
  size?: number;
  /** Override colore icona Ionicons */
  iconColor?: string;
  /** Stato preferito per pulsante Like */
  isFavorite?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  danger?: boolean;
  badge?: number;
  style?: StyleProp<ViewStyle>;
};

const ORB = 44;
const ORB_GHOST = 52;
/** PNG 3D: più grandi dell’orb — sporgono un filo sul cerchio glass */
const ICON_IMG = 52;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Orb header liquid glass + icona ink / PNG 3D.
 * Il vetro sta dietro (absoluteFill): così l’icona resta sempre visibile
 * anche con GlassView nativo iOS.
 */
export function GlassIconButton({
  icon,
  image,
  imageSize = ICON_IMG,
  variant = 'solid',
  size,
  iconColor: iconColorProp,
  isFavorite = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  danger = false,
  badge,
  style,
}: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const ghost = variant === 'ghost';
  const orb = size ?? (ghost ? ORB_GHOST : ORB);
  const glyph = ghost ? Math.round(orb * 0.52) : Math.round(orb * 0.46);

  const pressStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconColor = iconColorProp
    ?? (ghost ? '#FFFFFF' : isFavorite ? '#FF3B30' : danger ? colors.red : colors.brandInk);

  const tint = isFavorite
    ? 'rgba(255, 59, 48, 0.14)'
    : danger
    ? 'rgba(248,113,113,0.16)'
    : 'rgba(255,255,255,0.48)';

  const handlePress = () => {
    Haptics.impactAsync(
      isFavorite
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
    onPress();
  };

  if (WIREFRAME_MODE) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.orb, { width: orb, height: orb, borderRadius: orb / 2 }, styles.wire, style]}
      >
        <AppText variant="caption">{accessibilityLabel.slice(0, 3).toUpperCase()}</AppText>
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        opacity.value = withSpring(0.82, { damping: 20, stiffness: 420 });
        scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        opacity.value = withSpring(1, { damping: 16, stiffness: 280 });
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        styles.orb,
        { width: orb, height: orb, borderRadius: orb / 2 },
        ghost
          ? styles.orbGhost
          : isFavorite
          ? styles.orbFavorite
          : styles.orbGlass,
        pressStyle,
        style,
      ]}
    >
      {!ghost ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: orb / 2, overflow: 'hidden' },
          ]}
        >
          <LiquidGlassView
            glassStyle="clear"
            tintColor={tint}
            fallbackIntensity={56}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      <View style={styles.iconSlot}>
        {image ? (
          <Image
            source={image}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
          />
        ) : icon ? (
          <Ionicons
            name={icon}
            size={glyph}
            color={iconColor}
            style={[
              ghost ? styles.glyphShadow : undefined,
              icon === 'chevron-back' && { marginLeft: -1.5 },
            ]}
          />
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlass: {
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(210, 195, 246, 0.35)',
    shadowColor: '#1A0F33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  orbFavorite: {
    overflow: 'visible',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    elevation: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  orbGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  iconSlot: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphShadow: {
    textShadowColor: 'rgba(18, 10, 36, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
