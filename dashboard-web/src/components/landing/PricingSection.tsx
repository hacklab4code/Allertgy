import { motion } from "framer-motion";
import { Rocket, Gift } from "lucide-react";

interface PricingRow {
  tier: string;
  price: string;
  restaurant: string;
  customer: string;
  highlight?: boolean;
}

const ROWS: PricingRow[] = [
  {
    tier: "Gratis",
    price: "€0",
    restaurant: "Scheda mappa",
    customer: "Scan + semaforo + 1 profilo",
  },
  {
    tier: "Base",
    price: "€9/mese",
    restaurant: "Semaforo clienti + QR + PDF",
    customer: "—",
  },
  {
    tier: "Pro",
    price: "€19/mese",
    restaurant: "+ Push + AI + stats",
    customer: "—",
    highlight: true,
  },
  {
    tier: "Boost",
    price: "€9,90",
    restaurant: "Visibilità 30 gg",
    customer: "—",
  },
];

interface PricingSectionProps {
  scrollTo: (target: string) => void;
  onSelectPlan?: (planCode: string) => void;
}

export const PricingSection = ({ scrollTo, onSelectPlan }: PricingSectionProps) => (
  <section id="prezzi" className="py-24 md:py-32 bg-[#EFEBE1]/50 border-y border-[#EFEBE1]">
    <div className="max-w-5xl mx-auto px-6 md:px-12">
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#16A34A]">Prezzi</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C221F] mt-3 font-heading">
          Semplice per tutti
        </h2>
        <p className="text-[#5C6B61] mt-4 text-sm md:text-base leading-relaxed">
          I clienti usano gratis il semaforo al tavolo. I ristoratori pagano solo per attivare
          menù, QR e registro allergeni — o per crescere con Pro e Boost.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-[#EFEBE1] px-4 py-2 text-[#4A524D] text-xs font-semibold">
          <Gift className="w-4 h-4 text-[#16A34A]" />
          14 giorni gratis su Base e Pro — nessuna carta richiesta
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mt-14 card-clay-white overflow-hidden"
      >
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-0 text-sm border-b border-[#EFEBE1] bg-[#F8FAF9] font-bold uppercase tracking-wider text-[10px] text-[#64748B]">
          <div className="p-4 md:p-5" />
          <div className="p-4 md:p-5">Prezzo</div>
          <div className="p-4 md:p-5 text-[#166534]">Ristoratori</div>
          <div className="p-4 md:p-5 text-[#166534]">Clienti</div>
        </div>

        {ROWS.map((row, i) => (
          <motion.div
            key={row.tier}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-0 border-b border-[#EFEBE1] last:border-b-0 ${
              row.highlight ? "bg-[#ECFDF5]/60" : "bg-white"
            }`}
          >
            <div className="p-4 md:p-5 flex items-center gap-2">
              <span className="font-extrabold text-[#1C221F] text-base font-heading">{row.tier}</span>
              {row.highlight && (
                <span className="text-[9px] font-black bg-[#16A34A] text-white px-2 py-0.5 rounded-full uppercase">
                  Top
                </span>
              )}
            </div>
            <div className="p-4 md:p-5 font-extrabold text-[#1C221F] text-base font-heading flex items-center">
              {row.price}
            </div>
            <div className="p-4 md:p-5 text-[#4A524D] font-medium leading-snug flex items-center">
              {row.restaurant}
            </div>
            <div className="p-4 md:p-5 text-[#4A524D] font-medium leading-snug flex items-center">
              {row.customer}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          { code: "free", label: "Gratis", cta: "Scheda mappa" },
          { code: "base", label: "Base €9", cta: "Prova 14 gg" },
          { code: "pro_notify", label: "Pro €19", cta: "Prova 14 gg" },
        ].map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => (onSelectPlan ? onSelectPlan(p.code) : scrollTo("top"))}
            className={`py-3.5 rounded-full font-semibold text-sm ${
              p.code === "pro_notify" ? "btn-clay-green" : p.code === "base" ? "btn-clay-dark" : "btn-clay-white"
            }`}
          >
            {p.label} · {p.cta}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        data-testid="pricing-addon-boost"
        className="mt-6 rounded-3xl border-2 border-[#EAB308]/60 bg-[#FEF9C3] p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      >
        <div className="grid place-items-center w-14 h-14 rounded-2xl badge-clay-yellow shrink-0">
          <Rocket className="w-7 h-7" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-[#1C221F] font-heading">Boost · €9,90 una tantum</h3>
          <p className="text-sm text-[#4A524D] mt-1">
            Visibilità in cima alla ricerca per <strong>30 giorni</strong>. Solo ristoratori, senza abbonamento.
          </p>
        </div>
      </motion.div>

      <p className="text-center text-xs text-[#94A3B8] mt-8 leading-relaxed max-w-xl mx-auto">
        Plus Famiglia (€3,99/mese) opzionale per i clienti: sottoprofili, condivisione permanente e scanner spesa illimitato.
        Il semaforo al QR resta sempre gratuito.
      </p>
    </div>
  </section>
);
