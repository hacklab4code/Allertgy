import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useIsDarkMode } from '../../hooks/useAppTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  accessibilityLabel?: string;
};

/**
 * Pulsante Indietro Liquid Glass per l'header di navigazione.
 * Orb circolare (36x36px) con bordo traslucido, riflesso satinato, icona outline e feedback aptico.
 */
export function NavHeaderBackButton({
  onPress,
  style,
  tintColor,
  accessibilityLabel = 'Indietro',
}: Props) {
  const isDark = useIsDarkMode();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const iconColor = tintColor || (isDark ? '#F1FEC8' : '#23212C');

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.91, { damping: 18, stiffness: 400 });
        opacity.value = withSpring(0.85);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 350 });
        opacity.value = withSpring(1);
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        isDark ? styles.buttonDark : styles.buttonLight,
        animatedStyle,
        style,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={20}
        color={iconColor}
        style={{ marginLeft: -1 }}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#23212C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});
