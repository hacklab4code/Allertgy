import { Salad, ShieldAlert } from "lucide-react";

interface FooterProps {
  scrollTo: (target: string) => void;
}

export const Footer = ({ scrollTo }: FooterProps) => (
  <footer className="bg-[#0F172A] text-white/70 relative overflow-hidden border-t border-[#1E293B]">
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.4)]">
              <Salad className="w-5 h-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-tight font-heading">
              Aller<span className="text-[#A78BFA]">Tgy</span>
            </span>
          </div>
          <p className="text-sm mt-4 max-w-sm leading-relaxed text-slate-400">
            Scopri cosa puoi mangiare in ogni ristorante. Il QR al tavolo
            attiva il semaforo personalizzato sulle tue allergie.
          </p>
        </div>

        <div className="md:justify-self-end flex flex-wrap gap-x-10 gap-y-3">
          {[
            ["Il Semaforo", "semaforo"],
            ["Per i clienti", "clienti"],
            ["Per i ristoratori", "ristoratori"],
            ["Prezzi", "prezzi"],
          ].map(([label, target]) => (
            <button
              key={target}
              onClick={() => scrollTo(target)}
              data-testid={`footer-link-${target}`}
              className="text-sm text-slate-300 hover:text-[#A78BFA] transition-colors bg-transparent border-0 cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-white/5 border border-white/10 p-5 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-slate-400">
          Le informazioni sugli allergeni sono inserite sotto la responsabilità
          esclusiva dei ristoratori. AllerTgy è uno strumento di supporto: segnala
          sempre le tue allergie al personale del locale.
        </p>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>© 2026 AllerTgy Platform. Tutti i diritti riservati.</span>
        <span>Made with care in Italy 🇮🇹</span>
      </div>
    </div>
  </footer>
);
