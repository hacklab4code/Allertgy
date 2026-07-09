import { useEffect, useState } from 'react';
import { api } from '../api';

interface PushNotificationPanelProps {
  restaurantId: number;
}

export default function PushNotificationPanel({ restaurantId }: PushNotificationPanelProps) {
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFollowersCount = async () => {
    try {
      setLoadingCount(true);
      const res = await api.billingFollowersCount(restaurantId);
      setFollowersCount(res.count);
    } catch (e) {
      console.error('Errore nel recupero dei follower:', e);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchFollowersCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Titolo e corpo sono obbligatori.' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const res = await api.billingSendNotification(restaurantId, title.trim(), body.trim());
      setMessage({
        type: 'success',
        text: `Successo! ${res.message || `Notifica inviata a ${res.sent_count} utenti.`}`,
      });
      setTitle('');
      setBody('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Si è verificato un errore durante l’invio.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-violet-500/20 relative overflow-hidden transition-all duration-300">
      {/* Background glow decorator */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h3 className="text-lg font-black tracking-tight text-slate-100">
                Notifiche push ai clienti fedeli
              </h3>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
              Comunica direttamente sul telefono dei clienti che ti hanno aggiunto ai preferiti. Promuovi sconti, serate a tema o aggiornamenti del menù.
            </p>
          </div>

          {/* Stats Badge */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">
              ⭐
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Clienti fedeli
              </span>
              <span className="text-lg font-black text-violet-400">
                {loadingCount ? (
                  <span className="inline-block animate-pulse w-8 h-4 bg-slate-700 rounded" />
                ) : followersCount !== null ? (
                  `${followersCount} ${followersCount === 1 ? 'utente' : 'utenti'}`
                ) : (
                  '0 utenti'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Info alerts */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Sending Form */}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
              Titolo della notifica
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: Sconto speciale del 10% stasera!"
              maxLength={100}
              disabled={sending}
              className="w-full bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all duration-150 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-500 float-right">
              {title.length}/100
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
              Corpo della notifica
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Es: Mostra questa notifica alla cassa per ricevere lo sconto sul menù senza glutine..."
              maxLength={500}
              rows={3}
              disabled={sending}
              className="w-full bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all duration-150 resize-none disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-500 float-right">
              {body.length}/500
            </span>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={fetchFollowersCount}
              disabled={loadingCount || sending}
              className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-30"
            >
              🔄 Aggiorna conteggio
            </button>

            <button
              type="submit"
              disabled={sending || !followersCount}
              className={`px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all duration-150 flex items-center gap-2 ${
                !followersCount
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-98'
              }`}
            >
              {sending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Invio in corso...
                </>
              ) : (
                '🚀 Invia Notifica Push'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
