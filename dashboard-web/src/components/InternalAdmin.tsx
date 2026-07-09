import { useEffect, useMemo, useState } from 'react';
import {
  api,
  clearInternalAdminKey,
  hasInternalAdminKey,
  setInternalAdminKey,
  type BusinessPlan,
  type InternalRestaurant,
  type InternalRestaurantBusinessPatch,
  type InternalReview,
  type InternalSummary,
  type InternalUser,
  type SubscriptionStatus,
} from '../api';

const PLAN_LABELS: Record<BusinessPlan, string> = {
  free: 'Gratis',
  base: 'Base',
  pro_notify: 'Pro Notifiche',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  free: 'Gratis',
  trialing: 'Prova',
  active: 'Attivo',
  past_due: 'Pagamento KO',
  canceled: 'Annullato',
  comped: 'Omaggio',
};

const PLAN_OPTIONS: BusinessPlan[] = ['free', 'base', 'pro_notify'];
const STATUS_OPTIONS: SubscriptionStatus[] = ['free', 'trialing', 'active', 'past_due', 'canceled', 'comped'];

function euros(cents: number | null | undefined) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);
}

function dateOnly(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function planHasMenu(r: InternalRestaurant) {
  const status = r.subscription_status ?? 'free';
  const plan = r.business_plan ?? 'free';
  return status === 'comped' || ((plan === 'base' || plan === 'pro_notify') && ['trialing', 'active'].includes(status));
}

export default function InternalAdmin() {
  const [authed, setAuthed] = useState(hasInternalAdminKey());
  const [key, setKey] = useState('');
  const [summary, setSummary] = useState<InternalSummary | null>(null);
  const [restaurants, setRestaurants] = useState<InternalRestaurant[]>([]);
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [selected, setSelected] = useState<InternalRestaurant | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState({
    billing_email: '',
    vat_number: '',
    sdi_code: '',
    pec_email: '',
    commercial_notes: '',
    featured_priority: 0,
    plan_price_cents: 0,
    trial_ends_at: '',
  });

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const haystack = [
        r.name,
        r.city ?? '',
        r.public_code,
        r.owner_email ?? '',
        r.vat_number ?? '',
        r.business_plan ?? '',
        r.subscription_status ?? '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, restaurants]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextSummary, nextRestaurants, nextUsers, nextReviews] = await Promise.all([
        api.internalSummary(),
        api.internalRestaurants(),
        api.internalUsers(),
        api.internalReviews().catch(() => [] as InternalReview[]),
      ]);
      setSummary(nextSummary);
      setRestaurants(nextRestaurants);
      setUsers(nextUsers);
      setReviews(nextReviews);
      if (selected) {
        const updatedSelected = nextRestaurants.find((r) => r.id === selected.id) ?? null;
        setSelected(updatedSelected);
      }
    } catch (e) {
      setError((e as Error).message);
      if (/admin|autorizzato|401/i.test((e as Error).message)) {
        clearInternalAdminKey();
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => {
    if (!selected) return;
    setDraft({
      billing_email: selected.billing_email ?? '',
      vat_number: selected.vat_number ?? '',
      sdi_code: selected.sdi_code ?? '',
      pec_email: selected.pec_email ?? '',
      commercial_notes: selected.commercial_notes ?? '',
      featured_priority: selected.featured_priority ?? 0,
      plan_price_cents: selected.plan_price_cents ?? 0,
      trial_ends_at: dateOnly(selected.trial_ends_at),
    });
  }, [selected]);

  const patchRestaurant = async (restaurant: InternalRestaurant, patch: InternalRestaurantBusinessPatch) => {
    setBusyId(restaurant.id);
    setError('');
    try {
      const updated = await api.updateInternalRestaurantBusiness(restaurant.id, patch);
      setRestaurants((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      if (selected?.id === updated.id) setSelected(updated);
      await api.internalSummary().then(setSummary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const saveSelected = async () => {
    if (!selected) return;
    const patch: InternalRestaurantBusinessPatch = {
      billing_email: draft.billing_email.trim() || null,
      vat_number: draft.vat_number.trim() || null,
      sdi_code: draft.sdi_code.trim() || null,
      pec_email: draft.pec_email.trim() || null,
      commercial_notes: draft.commercial_notes.trim() || null,
      featured_priority: Number(draft.featured_priority) || 0,
      plan_price_cents: Number(draft.plan_price_cents) || 0,
      trial_ends_at: draft.trial_ends_at ? new Date(`${draft.trial_ends_at}T23:59:00`).toISOString() : null,
    };
    await patchRestaurant(selected, patch);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl border border-slate-200 p-7 shadow-2xl space-y-5">
          <div>
            <button onClick={() => { window.location.href = '/'; }} className="text-xs font-bold text-slate-400 hover:text-slate-700 mb-4">
              Torna all'app
            </button>
            <h1 className="text-2xl font-black">Admin interno AllerTgy</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inserisci la chiave interna. In sviluppo usa quella configurata in backend.
            </p>
          </div>
          {error && <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{error}</div>}
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && key.trim()) {
                setInternalAdminKey(key.trim());
                setAuthed(true);
              }
            }}
            type="password"
            placeholder="Chiave admin"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            disabled={!key.trim()}
            onClick={() => {
              setInternalAdminKey(key.trim());
              setAuthed(true);
            }}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-black"
          >
            Entra nella dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-black">AllerTgy Ops</div>
            <h1 className="text-xl font-black">Dashboard interna admin</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black">
              {loading ? 'Aggiorno...' : 'Aggiorna dati'}
            </button>
            <button onClick={() => { window.location.href = '/'; }} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black">
              App pubblica
            </button>
            <button
              onClick={() => {
                clearInternalAdminKey();
                setAuthed(false);
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 text-xs font-black"
            >
              Esci admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{error}</div>}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Utenti totali" value={summary?.total_users ?? 0} helper={`${summary?.total_customers ?? 0} clienti, ${summary?.total_owners ?? 0} commercianti`} />
          <Metric label="Locali" value={summary?.total_restaurants ?? 0} helper={`${summary?.active_restaurants ?? 0} attivi`} />
          <Metric label="Menu pubblicati" value={summary?.published_menus ?? 0} helper="con versione e conferma legale" />
          <Metric label="MRR stimato" value={euros(summary?.monthly_recurring_cents ?? 0)} helper={`${summary?.paid_restaurants ?? 0} locali a pagamento/prova`} />
        </section>

        <section className="grid lg:grid-cols-4 gap-3">
          {summary?.plans.map((plan) => (
            <div key={plan.code} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-sm">{plan.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{plan.tagline}</p>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                  {euros(plan.price_cents)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold">
                {summary.restaurants_by_plan[plan.code] ?? 0} locali
              </div>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-lg">Locali e piani</h2>
                <p className="text-xs text-slate-500">Gestisci visibilità, piano, stato pagamento e accesso al menu Pro.</p>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca locale, email, città, P.IVA..."
                className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-black">Locale</th>
                    <th className="px-4 py-3 font-black">Piano</th>
                    <th className="px-4 py-3 font-black">Stato</th>
                    <th className="px-4 py-3 font-black">Menu</th>
                    <th className="px-4 py-3 font-black">Flag</th>
                    <th className="px-4 py-3 font-black text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRestaurants.map((r) => (
                    <tr key={r.id} className={selected?.id === r.id ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}>
                      <td className="px-4 py-3 align-top min-w-64">
                        <div className="font-black text-slate-800">{r.name}</div>
                        <div className="text-slate-500 mt-0.5">
                          #{r.public_code} · {r.city || 'Città non impostata'}
                        </div>
                        <div className="text-slate-400 mt-0.5 truncate max-w-64">
                          {r.owner_email || 'Senza owner'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          value={r.business_plan ?? 'free'}
                          disabled={busyId === r.id}
                          onChange={(e) => patchRestaurant(r, { business_plan: e.target.value as BusinessPlan })}
                          className="bg-white border border-slate-200 rounded-xl px-2 py-2 font-bold focus:outline-none"
                        >
                          {PLAN_OPTIONS.map((plan) => <option key={plan} value={plan}>{PLAN_LABELS[plan]}</option>)}
                        </select>
                        <div className="text-slate-400 mt-1 font-bold">{euros(r.plan_price_cents)} / mese</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          value={r.subscription_status ?? 'free'}
                          disabled={busyId === r.id}
                          onChange={(e) => patchRestaurant(r, { subscription_status: e.target.value as SubscriptionStatus })}
                          className="bg-white border border-slate-200 rounded-xl px-2 py-2 font-bold focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className={`inline-flex px-2 py-1 rounded-lg font-black ${planHasMenu(r) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {planHasMenu(r) ? 'Menu Pro' : 'Bloccato'}
                        </div>
                        <div className="text-slate-400 mt-1">{r.dish_count} piatti</div>
                      </td>
                      <td className="px-4 py-3 align-top space-y-2">
                        <button
                          onClick={() => patchRestaurant(r, { is_active: r.is_active ? 0 : 1 })}
                          className={`block px-2 py-1 rounded-lg font-black ${r.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}
                        >
                          {r.is_active ? 'Attivo' : 'Nascosto'}
                        </button>
                        <button
                          onClick={() => patchRestaurant(r, { is_verified: r.is_verified ? 0 : 1 })}
                          className={`block px-2 py-1 rounded-lg font-black ${r.is_verified ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {r.is_verified ? 'Verificato' : 'Non verificato'}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          onClick={() => setSelected(r)}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black"
                        >
                          Gestisci
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRestaurants.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400 font-bold">Nessun locale trovato.</div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="font-black text-lg">Dettaglio commerciale</h2>
                <p className="text-xs text-slate-500">Dati utili per fatturazione, priorità e note operative.</p>
              </div>
              {!selected ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-xs text-slate-500 font-semibold">
                  Seleziona un locale dalla tabella per modificarne i dati commerciali.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="font-black">{selected.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{selected.owner_email || 'Nessun owner associato'}</div>
                  </div>
                  <Field label="Email fatturazione" value={draft.billing_email} onChange={(value) => setDraft({ ...draft, billing_email: value })} />
                  <Field label="Partita IVA" value={draft.vat_number} onChange={(value) => setDraft({ ...draft, vat_number: value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Codice SDI" value={draft.sdi_code} onChange={(value) => setDraft({ ...draft, sdi_code: value })} />
                    <Field label="PEC" value={draft.pec_email} onChange={(value) => setDraft({ ...draft, pec_email: value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Prezzo mensile cent" value={draft.plan_price_cents} onChange={(value) => setDraft({ ...draft, plan_price_cents: value })} />
                    <NumberField label="Priorità" value={draft.featured_priority} onChange={(value) => setDraft({ ...draft, featured_priority: value })} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black block mb-1">Fine prova</label>
                    <input
                      type="date"
                      value={draft.trial_ends_at}
                      onChange={(e) => setDraft({ ...draft, trial_ends_at: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black block mb-1">Note commerciali</label>
                    <textarea
                      value={draft.commercial_notes}
                      onChange={(e) => setDraft({ ...draft, commercial_notes: e.target.value })}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Es. prova concessa fino a fine mese, contatto titolare, stato fattura..."
                    />
                  </div>
                  <button
                    disabled={busyId === selected.id}
                    onClick={saveSelected}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-2xl py-3 text-xs font-black"
                  >
                    Salva dettaglio
                  </button>
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-lg">Utenti</h2>
                  <p className="text-xs text-slate-500">Ultimi account registrati.</p>
                </div>
                <span className="text-xs font-black bg-slate-100 px-2 py-1 rounded-lg">{users.length}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {users.slice(0, 15).map((user) => (
                  <div key={user.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-slate-800 truncate">{user.email}</div>
                      <span className={`px-2 py-0.5 rounded-lg font-black ${user.role === 'owner' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role === 'owner' ? 'Commerciante' : 'Cliente'}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      {user.restaurant_count} locali · {dateOnly(user.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        {/* Moderazione recensioni */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-lg">Moderazione recensioni</h2>
              <p className="text-xs text-slate-500">Le recensioni segnalate dagli utenti compaiono per prime. Nascondere una recensione la rimuove dalla pagina pubblica.</p>
            </div>
            <span className="text-xs font-black bg-slate-100 px-2 py-1 rounded-lg">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-xs text-slate-500 font-semibold">
              Nessuna recensione presente.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800">{rev.restaurant_name}</span>
                      <span className="text-amber-500">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                      {rev.reported_count > 0 && (
                        <span className="bg-rose-50 text-rose-700 font-black px-2 py-0.5 rounded-lg">⚠️ {rev.reported_count} segnalazioni</span>
                      )}
                      {rev.is_hidden && (
                        <span className="bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded-lg">Nascosta{rev.hidden_reason ? `: ${rev.hidden_reason}` : ''}</span>
                      )}
                    </div>
                    <p className="text-slate-500 mt-1 truncate">{rev.comment || '(senza commento)'}</p>
                    <p className="text-slate-400 mt-0.5">{rev.user_email} · {dateOnly(rev.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {rev.is_hidden ? (
                      <button
                        onClick={async () => {
                          try {
                            const updated = await api.moderateReview(rev.id, false);
                            setReviews((items) => items.map((item) => (item.id === updated.id ? updated : item)));
                          } catch (e) { setError((e as Error).message); }
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-black"
                      >
                        Ripubblica
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const reason = window.prompt('Motivo per nascondere la recensione (visibile solo internamente):');
                          if (reason === null) return;
                          try {
                            const updated = await api.moderateReview(rev.id, true, reason || 'Contenuto non conforme');
                            setReviews((items) => items.map((item) => (item.id === updated.id ? updated : item)));
                          } catch (e) { setError((e as Error).message); }
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-black"
                      >
                        Nascondi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-semibold">{helper}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}
