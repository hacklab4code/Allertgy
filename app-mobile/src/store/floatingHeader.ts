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

const TOP_SHOW_Y = 20;
const DELTA_HIDE = 5;
const DELTA_SHOW = 4;

/**
 * Chrome floating: sempre visibile e fisso in alto durante lo scorrimento.
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
  reportScroll: (_offsetY, _deltaY) => {
    // Mantiene l'header sempre fisso e visibile in alto durante lo scroll
    if (!get().visible) set({ visible: true });
  },
}));

