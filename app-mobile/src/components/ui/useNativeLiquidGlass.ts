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

let cachedReduceTransparency = false;
let isListenerInitialized = false;
const transparencyListeners = new Set<(val: boolean) => void>();

function initGlobalTransparencyListener() {
  if (isListenerInitialized) return;
  isListenerInitialized = true;

  if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        cachedReduceTransparency = enabled;
        transparencyListeners.forEach((fn) => fn(enabled));
      })
      .catch(() => {});
  }

  if (typeof AccessibilityInfo?.addEventListener === 'function') {
    AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
      cachedReduceTransparency = enabled;
      transparencyListeners.forEach((fn) => fn(enabled));
    });
  }
}

export function useNativeLiquidGlass() {
  const [reduceTransparency, setReduceTransparency] = useState(cachedReduceTransparency);

  useEffect(() => {
    initGlobalTransparencyListener();
    transparencyListeners.add(setReduceTransparency);
    return () => {
      transparencyListeners.delete(setReduceTransparency);
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
