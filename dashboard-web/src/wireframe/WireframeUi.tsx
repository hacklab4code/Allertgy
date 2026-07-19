import type { CSSProperties, ReactNode } from 'react';

/** Layout wireframe — bordi neri, etichette funzionali, zero decorazione. */

const box: CSSProperties = {
  border: '1px solid #000',
  background: '#fff',
};

export function WireApp({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black font-mono text-sm" style={{ fontFamily: 'ui-monospace, monospace' }}>
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
    <header style={{ ...box, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }} className="px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {left}
        <span className="font-bold truncate">[{title}]</span>
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
      style={box}
      className={vertical ? 'flex flex-col' : 'flex flex-wrap'}
      aria-label="Navigazione principale"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          style={{
            border: '1px solid #000',
            borderTop: vertical ? undefined : 'none',
            borderLeft: vertical ? 'none' : undefined,
            background: active === item.id ? '#000' : '#fff',
            color: active === item.id ? '#fff' : '#000',
          }}
          className={`px-4 py-2 text-left text-xs font-bold ${vertical ? 'border-l-0 border-r-0' : 'border-b-0'}`}
        >
          {active === item.id ? '▸ ' : '  '}{item.label}
        </button>
      ))}
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
      style={{ ...box, borderStyle: dashed ? 'dashed' : 'solid' }}
      className={`p-3 ${className}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide mb-2 border-b border-black pb-1">
        [{label}]
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
      style={{ ...box, borderLeft: 'none', borderRight: 'none' }}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs ${onClick ? 'hover:bg-neutral-100 cursor-pointer' : ''}`}
    >
      <span>{label}</span>
      <span className="text-neutral-600 shrink-0">
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
  const gridClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';
  return <div className={`grid ${gridClass} gap-2`}>{children}</div>;
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
    <div style={{ ...box, minHeight }} className="p-2 text-xs">
      {label && <div className="font-bold mb-1">[{label}]</div>}
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...box,
        background: active ? '#000' : variant === 'danger' ? '#fff' : '#fff',
        color: active ? '#fff' : '#000',
        opacity: disabled ? 0.4 : 1,
      }}
      className="px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed"
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
      style={box}
      className={`w-full px-2 py-1.5 text-xs bg-white focus:outline-none ${className}`}
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
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-120px)]">
      {sidebar && (
        <div className="lg:w-56 shrink-0 border-r border-black">{sidebar}</div>
      )}
      <div className="flex-1 min-w-0 p-4">{main}</div>
      {aside && (
        <div className="lg:w-72 shrink-0 border-l border-black p-4">{aside}</div>
      )}
    </div>
  );
}
