import type { ReactNode } from 'react';
import { Salad } from 'lucide-react';

/** Premium Emerald Design System — Stesso Stile dell'Area Cliente (ClientArea.tsx) */

export function WireApp({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#10201B] font-sans text-sm antialiased selection:bg-[#BFE9D2] selection:text-[#0B5D4D]">
      {children}
    </div>
  );
}

export function WireHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {left}
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Salad className="w-5 h-5" strokeWidth={2} />
          </span>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 font-heading truncate">
            {title}
          </span>
        </div>
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </header>
  );
}

export function WireNav({
  items,
  active,
  onChange,
  vertical,
}: {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  vertical?: boolean;
}) {
  return (
    <nav
      className={`p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs ${
        vertical ? 'flex flex-col gap-1.5' : 'flex flex-wrap items-center gap-2'
      }`}
      aria-label="Navigazione principale"
    >
      {items.map((item) => {
        const isSelected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
              vertical ? 'w-full text-left' : ''
            } ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200/70 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function WireZone({
  label,
  children,
  className = '',
  dashed,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <section
      className={`bg-white rounded-3xl border ${
        dashed ? 'border-dashed border-emerald-300' : 'border-slate-200/70'
      } shadow-sm p-5 md:p-6 mb-6 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {label}
        </h3>
      </div>
      {children}
    </section>
  );
}

export function WireRow({
  label,
  value,
  onClick,
  action,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  action?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-bold rounded-2xl border border-slate-200/60 bg-slate-50/50 mb-2 transition-all ${
        onClick ? 'hover:bg-emerald-50/60 hover:border-emerald-300 cursor-pointer hover:translate-x-0.5' : ''
      }`}
    >
      <span className="text-slate-800 font-extrabold">{label}</span>
      <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
        {value ?? action ?? '›'}
      </span>
    </Tag>
  );
}

export function WireGrid({
  cols,
  children,
}: {
  cols: 2 | 3 | 4;
  children: ReactNode;
}) {
  const gridClass =
    cols === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  return <div className={`grid ${gridClass} gap-4`}>{children}</div>;
}

export function WireBlock({
  label,
  children,
  minHeight,
}: {
  label?: string;
  children?: ReactNode;
  minHeight?: number;
}) {
  return (
    <div
      style={{ minHeight }}
      className="p-4 text-xs bg-white rounded-2xl border border-slate-200/70 shadow-xs"
    >
      {label && <div className="font-extrabold text-slate-800 mb-2">{label}</div>}
      {children}
    </div>
  );
}

export function WireBtn({
  children,
  onClick,
  active,
  disabled,
  variant = 'default',
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}) {
  if (variant === 'danger') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 text-xs font-extrabold rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 shadow-xs'
      }`}
    >
      {children}
    </button>
  );
}

export function WireInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition-all outline-none ${className}`}
    />
  );
}

export function WireLayout({
  sidebar,
  main,
  aside,
}: {
  sidebar?: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-100px)]">
      {sidebar && (
        <div className="lg:w-64 shrink-0 bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-slate-200/70 shadow-xs">
          {sidebar}
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-6">{main}</div>
      {aside && (
        <div className="lg:w-72 shrink-0 space-y-6">{aside}</div>
      )}
    </div>
  );
}
