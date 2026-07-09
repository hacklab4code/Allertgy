import { useEffect, useState } from 'react';
import { api } from '../api';

interface AuditRow {
  id: number;
  action: string;
  menu_version: number;
  legal_version: string | null;
  note: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  save: 'Salvataggio menù',
  approve: 'Pubblicazione menù',
  update: 'Aggiornamento',
};

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MenuAuditPanel({ restaurantId }: { restaurantId: number }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .menuAudit(restaurantId)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) return <p className="text-xs text-slate-400">Caricamento storico…</p>;
  if (!rows.length) {
    return (
      <p className="text-xs text-slate-500 font-semibold">Nessuna modifica registrata al menù.</p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
      {rows.map((row) => (
        <div key={row.id} className="px-4 py-3 bg-white text-xs space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-slate-800">
              {ACTION_LABELS[row.action] ?? row.action}
            </span>
            <span className="text-slate-400 shrink-0">v{row.menu_version}</span>
          </div>
          <div className="text-slate-400">{dateLabel(row.created_at)}</div>
          {row.note && <div className="text-slate-500">{row.note}</div>}
        </div>
      ))}
    </div>
  );
}
