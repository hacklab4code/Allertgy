import { useCallback, useEffect, useState } from 'react';
import { api, type Restaurant, type Review } from '../api';

function restaurantCanReply(r: Restaurant | null) {
  if (!r) return false;
  const plan = r.business_plan ?? 'free';
  const status = r.subscription_status ?? 'free';
  return (
    status === 'comped' ||
    ((plan === 'base' || plan === 'pro_notify') && ['trialing', 'active'].includes(status))
  );
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerReviewsPanel({ restaurant }: { restaurant: Restaurant }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const canReply = restaurantCanReply(restaurant);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api.listReviews(restaurant.public_code);
      setReviews(list);
      setReplyDrafts(
        Object.fromEntries(list.filter((r) => r.reply).map((r) => [r.id, r.reply ?? ''])),
      );
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [restaurant.public_code]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReply = async (reviewId: number) => {
    const reply = (replyDrafts[reviewId] ?? '').trim();
    if (!reply) return;
    setBusyId(reviewId);
    try {
      const updated = await api.replyToReview(reviewId, reply);
      setReviews((items) => items.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Recensioni clienti</h2>
        <p className="text-sm text-slate-500 mt-1">
          Leggi i feedback e rispondi pubblicamente. Richiede piano Base o Pro attivo.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {!canReply && (
        <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs font-semibold rounded-2xl px-4 py-3">
          Attiva un piano Base o Pro per rispondere alle recensioni. Puoi comunque leggerle qui sotto.
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Caricamento recensioni…</p>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-xs text-slate-500 font-semibold">
          Nessuna recensione AllerTgy per questo locale. Incoraggia i clienti a lasciare un feedback dopo la cena.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-slate-800">{rev.author_name}</div>
                  <div className="text-amber-500 text-sm mt-0.5">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{dateLabel(rev.created_at)}</p>
                </div>
                {(rev.rating_staff || rev.rating_menu || rev.rating_safety) && (
                  <div className="text-[10px] text-slate-400 text-right shrink-0">
                    {rev.rating_staff != null && <div>Staff: {rev.rating_staff}/5</div>}
                    {rev.rating_menu != null && <div>Menù: {rev.rating_menu}/5</div>}
                    {rev.rating_safety != null && <div>Sicurezza: {rev.rating_safety}/5</div>}
                  </div>
                )}
              </div>
              {rev.comment && <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>}

              {rev.reply && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">La tua risposta</div>
                  <p className="text-xs text-emerald-900 mt-1">{rev.reply}</p>
                </div>
              )}

              {canReply && (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={replyDrafts[rev.id] ?? ''}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [rev.id]: e.target.value }))}
                    placeholder="Scrivi una risposta pubblica al cliente…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(rev.id)}
                    disabled={busyId === rev.id || !(replyDrafts[rev.id] ?? '').trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black px-4 py-2 rounded-xl"
                  >
                    {busyId === rev.id ? 'Invio…' : rev.reply ? 'Aggiorna risposta' : 'Pubblica risposta'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
