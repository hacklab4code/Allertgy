import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useAppearance } from '../../store/appearance';

export function canUseNativeLiquidGlass(reduceTransparency: boolean, liquidGlassEnabled = true) {
  if (!liquidGlassEnabled || Platform.OS !== 'ios' || reduceTransparency) return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function useNativeLiquidGlass() {
  const liquidGlassEnabled = useAppearance((s) => s.liquidGlassEnabled);
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (mounted) setReduceTransparency(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const glassOff = !liquidGlassEnabled || reduceTransparency;

  return {
    /** Preferenza utente: effetto vetro attivo. */
    enabled: liquidGlassEnabled,
    /** Native iOS Liquid Glass (solo Apple, API disponibile, preferenza on, Reduce Transparency off). */
    native: canUseNativeLiquidGlass(reduceTransparency, liquidGlassEnabled),
    reduceTransparency,
    /** Niente blur/vetro: superficie opaca (preferenza off o accessibilità). */
    glassOff,
  };
}

/** Spring curve vicina al comportamento UISpringTimingParameters di iOS. */
export const IOS_TAB_SPRING = {
  damping: 22,
  stiffness: 320,
  mass: 0.65,
} as const;
