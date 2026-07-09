import { useMemo, useState } from 'react';
import {
  api,
  type InternalCustomerDetail,
  type InternalUser,
} from '../api';

type CustomerPlan = 'customer_free' | 'customer_plus';
type CustomerStatus = 'free' | 'active' | 'comped' | 'trialing' | 'past_due' | 'canceled';

const PLAN_LABELS: Record<CustomerPlan, string> = {
  customer_free: 'Gratis',
  customer_plus: 'Plus Famiglia',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  free: 'Free',
  active: 'Pagante',
  comped: 'Omaggio',
  trialing: 'Prova',
  past_due: 'Pagamento KO',
  canceled: 'Annullato',
};

function euros(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function dateOnly(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('it-IT');
}

interface Props {
  customers: InternalUser[];
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
}

export default function InternalCustomersPanel({ customers, onRefresh, onError }: Props) {
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | CustomerPlan>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<InternalCustomerDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (c.role !== 'customer') return false;
      if (planFilter !== 'all' && c.customer_plan !== planFilter) return false;
      if (!q) return true;
      const hay = [
        c.email,
        c.display_name ?? '',
        c.invite_code ?? '',
        c.customer_plan,
        c.customer_subscription_status,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query, planFilter]);

  const plusActive = customers.filter(
    (c) => c.role === 'customer' && c.has_customer_plus && c.customer_subscription_status === 'active',
  ).length;
  const plusComped = customers.filter(
    (c) => c.role === 'customer' && c.has_customer_plus && c.customer_subscription_status === 'comped',
  ).length;

  const openDetail = async (user: InternalUser) => {
    setSelectedId(user.id);
    setBusy(true);
    try {
      const d = await api.internalCustomerDetail(user.id);
      setDetail(d);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const patchCustomer = async (patch: { customer_plan?: CustomerPlan; customer_subscription_status?: CustomerStatus }) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const updated = await api.updateInternalCustomer(selectedId, patch);
      setDetail(updated);
      await onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <Metric label="Clienti totali" value={customers.filter((c) => c.role === 'customer').length} />
        <Metric label="Plus paganti" value={plusActive} helper={`MRR stimato ${euros(plusActive * 399)}`} />
        <Metric label="Plus omaggio" value={plusComped} helper="referral / supporto" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-lg">Clienti</h2>
              <p className="text-xs text-slate-500">Piano Plus, referral, utilizzo e abbonamenti.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'all' | CustomerPlan)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="all">Tutti i piani</option>
                <option value="customer_free">Gratis</option>
                <option value="customer_plus">Plus</option>
              </select>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca email, codice invito..."
                className="w-full md:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-black">Cliente</th>
                  <th className="px-4 py-3 font-black">Piano</th>
                  <th className="px-4 py-3 font-black">Referral</th>
                  <th className="px-4 py-3 font-black">Uso</th>
                  <th className="px-4 py-3 font-black text-right">Dettaglio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className={selectedId === c.id ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}>
                    <td className="px-4 py-3 align-top min-w-48">
                      <div className="font-black text-slate-800 truncate max-w-52">{c.email}</div>
                      <div className="text-slate-400 mt-0.5">{dateOnly(c.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-1 rounded-lg font-black ${
                        c.has_customer_plus ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {PLAN_LABELS[c.customer_plan as CustomerPlan] ?? c.customer_plan}
                      </span>
                      <div className="text-slate-400 mt-1 font-bold">
                        {STATUS_LABELS[c.customer_subscription_status as CustomerStatus] ?? c.customer_subscription_status}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-black">{c.referrals_count}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{c.invite_code ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-500">
                      <div>{c.allergen_count} allergie</div>
                      <div>{c.barcode_scans_month}/∞ scan</div>
                      <div>{c.favorites_count} preferiti</div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        onClick={() => openDetail(c)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black"
                      >
                        Apri
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400 font-bold">Nessun cliente trovato.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 min-h-[24rem]">
          {!detail ? (
            <div className="text-sm text-slate-400 font-semibold py-16 text-center">
              Seleziona un cliente per vedere piano, allergie e azioni admin.
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-black text-lg">{detail.email}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registrato {dateOnly(detail.created_at)}
                  {detail.customer_plan_started_at ? ` · Plus dal ${dateOnly(detail.customer_plan_started_at)}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Piano" value={PLAN_LABELS[detail.customer_plan as CustomerPlan]} />
                <Info label="Stato abbonamento" value={STATUS_LABELS[detail.customer_subscription_status as CustomerStatus]} />
                <Info label="Allergie" value={detail.allergen_codes.length ? detail.allergen_codes.join(', ') : 'Nessuna'} />
                <Info label="Profili famiglia" value={String(detail.sub_profile_count)} />
                <Info label="Referral portati" value={String(detail.referrals_count)} />
                <Info label="Codice invito" value={detail.invite_code ?? '—'} />
                <Info label="Scan barcode (mese)" value={detail.has_customer_plus ? `${detail.barcode_scans_month} (illimitato)` : `${detail.barcode_scans_month}/20`} />
                <Info label="Doc. medici" value={String(detail.medical_documents_count)} />
                <Info label="Recensioni" value={String(detail.reviews_count)} />
                <Info label="Preferiti" value={String(detail.favorites_count)} />
                {detail.customer_stripe_subscription_id && (
                  <Info label="Stripe sub" value={`…${detail.customer_stripe_subscription_id.slice(-8)}`} />
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  disabled={busy}
                  onClick={() => patchCustomer({ customer_plan: 'customer_plus', customer_subscription_status: 'comped' })}
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs"
                >
                  Regala Plus
                </button>
                <button
                  disabled={busy}
                  onClick={() => patchCustomer({ customer_plan: 'customer_free', customer_subscription_status: 'free' })}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-black text-xs"
                >
                  Torna a Gratis
                </button>
                <button
                  disabled={busy}
                  onClick={() => patchCustomer({ customer_subscription_status: 'active' })}
                  className="px-3 py-2 rounded-xl bg-blue-50 text-blue-800 font-black text-xs"
                >
                  Segna pagante
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Non vedi dati sanitari grezzi (referti). Per GDPR usa la cancellazione account dall&apos;app o contatta il supporto tecnico.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-black">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
      {helper && <div className="text-[11px] text-slate-500 mt-1 font-semibold">{helper}</div>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black">{label}</div>
      <div className="font-bold text-slate-800 mt-1 break-words">{value}</div>
    </div>
  );
}
