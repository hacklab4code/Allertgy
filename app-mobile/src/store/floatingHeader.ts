import { create } from 'zustand';

type FloatingHeaderState = {
  visible: boolean;
  /** Titolo sezione tra SOS e notifiche */
  title: string | null;
  show: () => void;
  hide: () => void;
  setTitle: (title: string | null) => void;
  /** Aggiorna visibilità in base a offset e delta scroll. */
  reportScroll: (offsetY: number, deltaY: number) => void;
};

const TOP_SHOW_Y = 12;
const DELTA_HIDE = 8;
const DELTA_SHOW = 6;

/**
 * Chrome floating (SOS + titolo + notifiche): nascosto in scroll-down, visibile in scroll-up.
 */
export const useFloatingHeader = create<FloatingHeaderState>((set, get) => ({
  visible: true,
  title: null,
  show: () => {
    if (!get().visible) set({ visible: true });
  },
  hide: () => {
    if (get().visible) set({ visible: false });
  },
  setTitle: (title) => {
    if (get().title !== title) set({ title });
  },
  reportScroll: (offsetY, deltaY) => {
    if (offsetY <= TOP_SHOW_Y) {
      if (!get().visible) set({ visible: true });
      return;
    }
    if (deltaY > DELTA_HIDE) {
      if (get().visible) set({ visible: false });
      return;
    }
    if (deltaY < -DELTA_SHOW) {
      if (!get().visible) set({ visible: true });
    }
  },
}));
