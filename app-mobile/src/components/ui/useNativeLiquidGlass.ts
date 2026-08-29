import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export function canUseNativeLiquidGlass(reduceTransparency: boolean) {
  if (Platform.OS !== 'ios' || reduceTransparency) return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function useNativeLiquidGlass() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((enabled) => {
          if (mounted) setReduceTransparency(enabled);
        })
        .catch(() => {});
    }

    const sub = typeof AccessibilityInfo?.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency)
      : null;

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return {
    /** Effetto vetro sempre attivo (rispetta solo Reduce Transparency). */
    enabled: !reduceTransparency,
    /** Native iOS Liquid Glass (solo Apple, API disponibile, Reduce Transparency off). */
    native: canUseNativeLiquidGlass(reduceTransparency),
    reduceTransparency,
    /** Niente blur/vetro: solo accessibilità Reduce Transparency. */
    glassOff: reduceTransparency,
  };
}

/** Spring curve vicina al comportamento UISpringTimingParameters di iOS. */
export const IOS_TAB_SPRING = {
  damping: 22,
  stiffness: 320,
  mass: 0.65,
} as const;
