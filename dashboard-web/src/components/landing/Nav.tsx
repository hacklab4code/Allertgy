import { Salad, Menu, X } from "lucide-react";
import { useState } from "react";

const LINKS = [
  { label: "Il Semaforo", target: "semaforo" },
  { label: "Per i clienti", target: "clienti" },
  { label: "Per i ristoratori", target: "ristoratori" },
  { label: "Prezzi", target: "prezzi" },
];

interface NavProps {
  scrollTo: (target: string) => void;
  onEnter: () => void;
  onClienti: () => void;
}

export const Nav = ({ scrollTo, onEnter, onClienti }: NavProps) => {
  const [open, setOpen] = useState(false);

  const go = (t: string) => {
    setOpen(false);
    scrollTo(t);
  };

  return (
    <header
      data-testid="main-nav"
      className="fixed top-0 inset-x-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl backdrop-saturate-150 border-b border-[#E2E8F0]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <button
          onClick={() => go("top")}
          data-testid="nav-logo"
          className="flex items-center gap-2.5 group bg-transparent border-0 cursor-pointer"
        >
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-[#7C3AED] text-white shadow-[0_6px_20px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform">
            <Salad className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">
            Aller<span className="text-[#7C3AED]">Tgy</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => go(l.target)}
              data-testid={`nav-link-${l.target}`}
              className="text-sm font-semibold text-[#475569] hover:text-[#7C3AED] transition-colors bg-transparent border-0 cursor-pointer"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onClienti}
            data-testid="nav-clienti-btn"
            className="text-sm font-semibold text-[#0F172A] hover:text-[#7C3AED] transition-colors px-3.5 py-2 bg-transparent border-0 cursor-pointer"
          >
            Area Clienti
          </button>
          <button
            onClick={onEnter}
            data-testid="nav-ristoratori-btn"
            className="btn-clay-green font-semibold px-5 py-2.5 rounded-full text-sm border-0 cursor-pointer"
          >
            Dashboard Ristoratori
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-mobile-toggle"
          className="md:hidden grid place-items-center w-10 h-10 rounded-xl border border-[#E2E8F0] text-[#0F172A] bg-transparent cursor-pointer"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 space-y-1.5 shadow-lg">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => go(l.target)}
              data-testid={`nav-mobile-link-${l.target}`}
              className="block w-full text-left py-2.5 text-[#0F172A] font-semibold hover:text-[#7C3AED] bg-transparent border-0 cursor-pointer"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={onClienti}
            className="mt-2 w-full btn-clay-white font-semibold py-3 rounded-full cursor-pointer"
          >
            Area Clienti
          </button>
          <button
            onClick={onEnter}
            className="mt-2 w-full btn-clay-green font-semibold py-3 rounded-full border-0 cursor-pointer"
          >
            Dashboard Ristoratori
          </button>
        </div>
      )}
    </header>
  );
};
