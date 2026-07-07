import { create } from 'zustand';
import { api, type AppNotification } from '../api/client';
import { useSession } from './session';

interface NotifState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/** Stato condiviso delle notifiche: alimenta il badge sulla campanella
 * (header) e la schermata inbox, senza rifare la fetch da più punti. */
export const useNotifStore = create<NotifState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  refresh: async () => {
    if (!useSession.getState().token) {
      set({ items: [], unread: 0 });
      return;
    }
    set({ loading: true });
    try {
      const items = await api.listNotifications();
      set({ items, unread: items.filter((n) => !n.read_at).length });
    } catch {
      // offline / sessione scaduta: mantieni lo stato precedente
    }
    set({ loading: false });
  },
  markRead: async (id) => {
    try { await api.markNotificationRead(id); } catch { /* best-effort */ }
    const items = get().items.map((n) =>
      n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n,
    );
    set({ items, unread: items.filter((n) => !n.read_at).length });
  },
  markAllRead: async () => {
    const unreadItems = get().items.filter((n) => !n.read_at);
    await Promise.all(unreadItems.map((n) => api.markNotificationRead(n.id).catch(() => {})));
    set({
      items: get().items.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      unread: 0,
    });
  },
}));
