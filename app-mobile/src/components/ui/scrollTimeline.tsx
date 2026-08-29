/**
 * Scroll-driven timeline — equivalente RN di CSS:
 *   animation-timeline: view();
 *   animation-range: entry 0% entry 200%;
 *
 * Ref: https://nerdy.dev/notebook/scroll-driven-animations.html#the-technique
 */
import React, { createContext, useContext, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  type SharedValue,
  useSharedValue,
} from 'react-native-reanimated';

export type ScrollTimelineValue = {
  /** contentOffset.y dello scrollport */
  scrollY: SharedValue<number>;
  /** altezza scrollport (finestra utile) */
  viewportH: SharedValue<number>;
  /** altezza totale del contenuto, usata per tenere leggibile l'ultimo elemento */
  contentH: SharedValue<number>;
};

const ScrollTimelineContext = createContext<ScrollTimelineValue | null>(null);

export function useScrollTimeline(): ScrollTimelineValue | null {
  return useContext(ScrollTimelineContext);
}

export function ScrollTimelineProvider({
  scrollY,
  viewportH,
  contentH,
  children,
}: {
  scrollY: SharedValue<number>;
  viewportH?: SharedValue<number>;
  contentH?: SharedValue<number>;
  children: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const fallbackViewportH = useSharedValue(height);
  const fallbackContentH = useSharedValue(height);
  const viewport = viewportH ?? fallbackViewportH;
  const content = contentH ?? fallbackContentH;

  useEffect(() => {
    if (!viewportH) fallbackViewportH.value = height;
    if (!contentH) fallbackContentH.value = height;
  }, [height, viewportH, contentH, fallbackViewportH, fallbackContentH]);

  return (
    <ScrollTimelineContext.Provider value={{ scrollY, viewportH: viewport, contentH: content }}>
      {children}
    </ScrollTimelineContext.Provider>
  );
}
