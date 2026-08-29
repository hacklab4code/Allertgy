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
      className="fixed top-0 inset-x-0 z-50 bg-[#F6F2FC]/70 backdrop-blur-xl backdrop-saturate-150 border-b border-[#E6DFF5]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <button
          onClick={() => go("top")}
          data-testid="nav-logo"
          className="flex items-center gap-2 group"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#36255C] text-white group-hover:-translate-y-0.5 transition-transform">
            <Salad className="w-5 h-5" strokeWidth={2} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#36255C]">
            Aller<span className="text-[#B9A6E8]">Tgy</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => go(l.target)}
              data-testid={`nav-link-${l.target}`}
              className="text-sm font-medium text-[#6B6575] hover:text-[#36255C] transition-colors bg-transparent border-0 cursor-pointer"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onClienti}
            data-testid="nav-clienti-btn"
            className="text-sm font-semibold text-[#36255C] hover:text-[#36255C] transition-colors px-3 py-2 bg-transparent border-0 cursor-pointer"
          >
            Area Clienti
          </button>
          <button
            onClick={onEnter}
            data-testid="nav-ristoratori-btn"
            className="btn-clay-dark font-semibold px-5 py-2.5 rounded-full text-sm border-0 cursor-pointer"
          >
            Dashboard Ristoratori
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-mobile-toggle"
          className="md:hidden grid place-items-center w-10 h-10 rounded-xl border border-[#E6DFF5] text-[#36255C] bg-transparent"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#E6DFF5] bg-[#F6F2FC] px-6 py-4 space-y-1">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => go(l.target)}
              data-testid={`nav-mobile-link-${l.target}`}
              className="block w-full text-left py-2.5 text-[#36255C] font-medium bg-transparent border-0 cursor-pointer"
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
