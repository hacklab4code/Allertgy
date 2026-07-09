import { useEffect, useState } from 'react';
import { api, type InvoiceRow } from '../api';

function euros(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagata',
  open: 'Aperta',
  draft: 'Bozza',
  void: 'Annullata',
  uncollectible: 'Non riscossa',
};

export default function InvoicesPanel({ restaurantId }: { restaurantId: number }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .billingInvoices(restaurantId)
      .then(setInvoices)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) return <p className="text-xs text-slate-400">Caricamento fatture…</p>;
  if (error) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500">
        {error.includes('404') || error.includes('non trov') ? 'Nessuna fattura disponibile.' : error}
      </div>
    );
  }
  if (!invoices.length) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 font-semibold">
        Nessuna fattura emessa. Le fatture Stripe compariranno qui dopo il primo pagamento.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white text-xs">
          <div>
            <div className="font-black text-slate-800">{euros(inv.amount_cents)}</div>
            <div className="text-slate-400 mt-0.5">{dateLabel(inv.created_at)}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 font-black px-2 py-1 rounded-lg">
              {STATUS_LABELS[inv.status] ?? inv.status}
            </span>
            {inv.pdf_url && (
              <a
                href={inv.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-black hover:underline"
              >
                PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
