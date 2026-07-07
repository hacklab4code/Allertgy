import { useEffect, useRef, useState } from 'react';
import { api, type OwnerNotification } from '../api';

interface Presented { icon: string; title: string; body: string }

function present(n: OwnerNotification): Presented {
  let payload: any = {};
  try { payload = n.payload_json ? JSON.parse(n.payload_json) : {}; } catch { /* ignore */ }
  switch (n.type) {
    case 'review_received':
      return {
        icon: '⭐',
        title: 'Nuova recensione',
        body: payload.rating ? `Hai ricevuto una recensione da ${payload.rating}★. Rispondi dalla scheda del locale.` : 'Hai ricevuto una nuova recensione.',
      };
    case 'menu_updated':
      return { icon: '🍽️', title: 'Menù aggiornato', body: 'Il menù di un locale è stato aggiornato.' };
    default:
      return { icon: '🔔', title: 'Notifica', body: n.type };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h fa`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

/** Campanella + dropdown notifiche per la dashboard ristoratore. */
export default function NotificationsPanel() {
  const [items, setItems] = useState<OwnerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read_at).length;

  const load = () => api.notifications().then(setItems).catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000); // aggiorna in background ogni minuto
    return () => clearInterval(timer);
  }, []);

  // Chiudi cliccando fuori
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (n: OwnerNotification) => {
    if (n.read_at) return;
    await api.markNotificationRead(n.id).catch(() => {});
    setItems((items) => items.map((it) => (it.id === n.id ? { ...it, read_at: new Date().toISOString() } : it)));
  };

  const markAll = async () => {
    const unreadItems = items.filter((n) => !n.read_at);
    await Promise.all(unreadItems.map((n) => api.markNotificationRead(n.id).catch(() => {})));
    setItems((items) => items.map((it) => ({ ...it, read_at: it.read_at ?? new Date().toISOString() })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/50 flex items-center justify-center transition-all"
        aria-label="Notifiche"
      >
        <span className="text-base">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-emerald-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-black text-sm text-slate-800">Notifiche</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800">
                Segna tutte lette
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-xs text-slate-500 font-semibold">Nessuna notifica</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Qui arriveranno le nuove recensioni e gli avvisi sul tuo locale.
                </p>
              </div>
            ) : (
              items.map((n) => {
                const p = present(n);
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${isUnread ? 'bg-emerald-50/40' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{p.title}</span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
