import { motion } from "framer-motion";
import { Check, Rocket, Star, Gift } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  dark: boolean;
  highlight: boolean;
  trial: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Gratis",
    price: "€0",
    period: "",
    desc: "Scheda base sulla mappa per essere trovato dai clienti.",
    features: ["Nome, città, indirizzo", "Presenza sulla mappa", "1 foto del locale"],
    cta: "Inizia ora",
    dark: false,
    highlight: false,
    trial: false,
  },
  {
    name: "Base",
    price: "€9",
    period: "/mese",
    desc: "I clienti scoprono cosa possono mangiare al tuo tavolo, personalizzato sulle loro allergie.",
    features: [
      "Semaforo personalizzato per ogni cliente con allergie",
      'Badge "Locale verificato"',
      "Fino a 10 foto in galleria",
      "QR code per tavoli e banco",
      "Registro allergeni PDF stampabile",
      "Rispondi alle recensioni",
    ],
    cta: "Prova gratis 14 giorni",
    dark: false,
    highlight: false,
    trial: true,
  },
  {
    name: "Pro Notifiche",
    price: "€19",
    period: "/mese",
    desc: "Come Base, più notifiche push ai tuoi clienti fedeli.",
    features: [
      "Tutto del piano Base",
      "Notifiche push ai clienti che ti preferiscono",
      "Promuovi sconti, novità e offerte",
      "Fino a 20 foto in galleria",
    ],
    cta: "Prova gratis 14 giorni",
    dark: true,
    highlight: true,
    trial: true,
  },
];

interface PricingSectionProps {
  scrollTo: (target: string) => void;
  onSelectPlan?: (planCode: string) => void;
}

export const PricingSection = ({ scrollTo, onSelectPlan }: PricingSectionProps) => (
  <section id="prezzi" className="py-24 md:py-32 bg-[#EFEBE1]/50 border-y border-[#EFEBE1]">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#16A34A]">Prezzi</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C221F] mt-3 font-heading">
          Un piano per ogni ristorante
        </h2>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-[#EFEBE1] px-4 py-2 text-[#4A524D] text-xs font-semibold">
          <Gift className="w-4 h-4 text-[#16A34A]" />
          14 giorni gratis sui piani a pagamento — nessuna carta richiesta
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-14 items-stretch">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            data-testid={`pricing-card-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
            className={`relative p-8 flex flex-col ${
              p.dark
                ? "card-clay-dark md:-translate-y-4"
                : "card-clay-white"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-white" /> Più scelto
              </span>
            )}

            <div className="flex items-start justify-between gap-3">
              <h3 className={`text-2xl font-extrabold font-heading ${p.dark ? "text-white" : "text-[#1C221F]"}`}>
                {p.name}
              </h3>
              {p.trial && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${p.dark ? "bg-white/10 text-[#86EFAC]" : "bg-[#DCFCE7] text-[#166534]"}`}>
                  14 gg gratis
                </span>
              )}
            </div>
            <p className={`text-sm mt-2 leading-relaxed ${p.dark ? "text-white/70" : "text-[#5C6B61]"}`}>
              {p.desc}
            </p>

            <div className="flex items-end gap-1 mt-6">
              <span className={`text-5xl font-extrabold font-heading ${p.dark ? "text-white" : "text-[#1C221F]"}`}>
                {p.price}
              </span>
              {p.period && (
                <span className={`text-sm font-medium mb-1.5 ${p.dark ? "text-white/60" : "text-[#5C6B61]"}`}>
                  {p.period}
                </span>
              )}
            </div>

            <ul className={`space-y-3 mt-6 pt-6 flex-1 border-t ${p.dark ? "border-white/10" : "border-[#EFEBE1]"}`}>
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.dark ? "text-[#86EFAC]" : "text-[#16A34A]"}`} strokeWidth={2.5} />
                  <span className={p.dark ? "text-white/85" : "text-[#4A524D]"}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (onSelectPlan) {
                  const code = p.name === "Gratis" ? "free" : p.name === "Base" ? "base" : "pro_notify";
                  onSelectPlan(code);
                } else {
                  scrollTo("top");
                }
              }}
              data-testid={`pricing-cta-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={`mt-8 w-full font-semibold py-3.5 rounded-full ${
                p.dark
                  ? "btn-clay-green"
                  : p.name === "Gratis"
                  ? "btn-clay-white"
                  : "btn-clay-dark"
              }`}
            >
              {p.cta}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Add-on Boost */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        data-testid="pricing-addon-boost"
        className="mt-8 rounded-3xl border-2 border-[#EAB308]/60 bg-[#FEF9C3] p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-[0_12px_24px_-4px_rgba(234,179,8,0.08),inset_0_-4px_6px_rgba(0,0,0,0.03),inset_0_4px_6px_rgba(255,255,255,0.6)]"
      >
        <div className="grid place-items-center w-14 h-14 rounded-2xl badge-clay-yellow shrink-0">
          <Rocket className="w-7 h-7" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-extrabold text-[#1C221F] font-heading">Boost Visibilità</h3>
            <span className="text-[10px] font-black bg-[#FDE047] text-[#854D0E] px-2.5 py-1 rounded-full uppercase">
              Add-on · Una tantum
            </span>
          </div>
          <p className="text-sm text-[#4A524D] mt-1 leading-relaxed">
            Metti il tuo locale <strong>in cima ai risultati di ricerca per 30 giorni</strong>.
            Pagamento singolo, senza abbonamento — attivabile quando vuoi.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold text-[#854D0E] font-heading">€9,90</div>
          <div className="text-[11px] text-[#854D0E]/70 font-semibold">per 30 giorni</div>
        </div>
      </motion.div>
    </div>
  </section>
);
