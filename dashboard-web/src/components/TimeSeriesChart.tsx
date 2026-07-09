interface Point {
  date: string;
  count: number;
}

export default function TimeSeriesChart({ data, label = 'Visite' }: { data: Point[]; label?: string }) {
  if (!data.length) {
    return (
      <p className="text-xs text-slate-400 italic">Nessun dato negli ultimi 30 giorni.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((point) => {
          const h = Math.max(4, Math.round((point.count / max) * 100));
          const day = point.date.slice(5);
          return (
            <div key={point.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[8px] font-bold text-slate-400 tabular-nums">{point.count || ''}</span>
              <div
                className="w-full max-w-[28px] bg-emerald-500 rounded-t-md transition-all"
                style={{ height: `${h}%` }}
                title={`${point.date}: ${point.count} ${label.toLowerCase()}`}
              />
              <span className="text-[7px] text-slate-400 font-semibold truncate w-full text-center">{day}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-450 font-semibold text-right">
        Totale ultimi 30 giorni: <strong className="text-slate-700">{total}</strong> {label.toLowerCase()}
      </p>
    </div>
  );
}
