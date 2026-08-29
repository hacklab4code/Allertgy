import { useCallback, useRef, useState } from 'react';
import { type View } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { create } from 'zustand';
import { colors } from '../theme';

export type MeshInk = {
  onDark: boolean;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  action: string;
};

export const MESH_HERO_INK: MeshInk = {
  onDark: false,
  ink: colors.onSurface,
  inkMuted: colors.textSecondary,
  inkSoft: colors.textMuted,
  action: colors.brand,
};

export const MESH_CANVAS_INK: MeshInk = {
  onDark: false,
  ink: colors.onSurface,
  inkMuted: colors.textSecondary,
  inkSoft: colors.textMuted,
  action: colors.brand,
};

export function meshInkForWindowY(midY: number, windowHeight: number): MeshInk {
  return midY < windowHeight * 0.35 ? MESH_HERO_INK : MESH_CANVAS_INK;
}

/**
 * Scroll Y su UI-thread — AmbientMesh fade fluido senza bridge JS.
 * Aggiornato da GlassScreenScroll ogni frame.
 */
export const meshScrollY = makeMutable(0);

/** Fade completo del wash ~ entro questa distanza di scroll (px). */
export const MESH_SCROLL_FADE_END = 160;

type MeshScrollState = {
  y: number;
  setY: (y: number) => void;
};

export const useMeshScrollY = create<MeshScrollState>((set) => ({
  y: 0,
  setY: (y) => set({ y }),
}));

export function useMeshInkScrollHandler() {
  return useCallback(() => {}, []);
}

/**
 * Ink stabile a zero overhead — elimina chiamate bridge measureInWindow e re-render in scroll.
 */
export function useAdaptiveMeshInk(initialOnDark = true, _enabled = true) {
  const ref = useRef<View>(null);
  const [ink] = useState<MeshInk>(initialOnDark ? MESH_HERO_INK : MESH_CANVAS_INK);
  const onLayout = useCallback(() => {}, []);

  return { ref, ink, onLayout };
}
