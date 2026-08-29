import { Salad, ShieldAlert } from "lucide-react";

interface FooterProps {
  scrollTo: (target: string) => void;
}

export const Footer = ({ scrollTo }: FooterProps) => (
  <footer className="bg-[#36255C] text-white/70 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#D2C3F6] text-[#36255C]">
              <Salad className="w-5 h-5" strokeWidth={2} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Aller<span className="text-[#86EFAC]">Tgy</span>
            </span>
          </div>
          <p className="text-sm mt-4 max-w-sm leading-relaxed">
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
              className="text-sm hover:text-[#86EFAC] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-white/5 border border-white/10 p-5 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-[#EAB308] shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/60">
          Le informazioni sugli allergeni sono inserite sotto la responsabilità
          esclusiva dei ristoratori. AllerTgy è uno strumento di supporto: segnala
          sempre le tue allergie al personale del locale.
        </p>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <span>© 2026 AllerTgy Platform. Tutti i diritti riservati.</span>
        <span>Made with care in Italy 🇮🇹</span>
      </div>
    </div>
  </footer>
);
