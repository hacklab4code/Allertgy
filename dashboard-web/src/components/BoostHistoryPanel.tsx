import { useEffect, useState } from 'react';
import { api } from '../api';

interface BoostRow {
  id: number;
  restaurant_id: number;
  expires_at: string | null;
  activated_at: string | null;
}

function dateLabel(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BoostHistoryPanel({ restaurantId }: { restaurantId: number }) {
  const [boosts, setBoosts] = useState<BoostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .billingBoosts(restaurantId)
      .then(setBoosts)
      .catch(() => setBoosts([]))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) return <p className="text-xs text-slate-400">Caricamento boost…</p>;
  if (!boosts.length) {
    return (
      <p className="text-xs text-slate-500 font-semibold">Nessun boost acquistato finora.</p>
    );
  }

  const now = Date.now();

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
      {boosts.map((b) => {
        const active = b.expires_at && new Date(b.expires_at).getTime() > now;
        return (
          <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white text-xs">
            <div>
              <div className="font-black text-slate-800">Boost Visibilità</div>
              <div className="text-slate-400 mt-0.5">
                Attivato: {dateLabel(b.activated_at)} · Scade: {dateLabel(b.expires_at)}
              </div>
            </div>
            <span
              className={`font-black px-2.5 py-1 rounded-lg ${
                active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {active ? 'Attivo' : 'Scaduto'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
