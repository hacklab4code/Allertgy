import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Animated views only on native — on web renders children as-is.
 */
function NativeOnlyAnimatedView(props: Record<string, unknown> & { as?: 'View' | 'Pressable'; children?: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return <>{props.children}</>;
  }
  if (props.as === 'Pressable') {
    return <AnimatedPressable {...(props as object)} />;
  }
  return <Animated.View {...(props as object)} />;
}

export { NativeOnlyAnimatedView };
