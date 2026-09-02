import { motion } from "framer-motion";
import { UserCog, QrCode, Soup, ArrowRight, type LucideIcon } from "lucide-react";

interface StepItem {
  n: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  span: string;
}

const STEPS: StepItem[] = [
  {
    n: "01",
    Icon: UserCog,
    title: "Imposta il tuo profilo",
    desc: "Registrati e seleziona le tue intolleranze tra i 14 allergeni previsti per legge, più le preferenze alimentari (es. vegano).",
    span: "md:col-span-7",
  },
  {
    n: "02",
    Icon: QrCode,
    title: "Scansiona il QR al tavolo",
    desc: "Non per leggere un menù generico: per scoprire cosa puoi mangiare in quel ristorante, personalizzato sul tuo profilo.",
    span: "md:col-span-5",
  },
  {
    n: "03",
    Icon: Soup,
    title: "Vedi cosa puoi e non puoi mangiare",
    desc: "Verde, giallo o rosso su ogni piatto — la risposta è costruita sulle tue allergie. Avvisa sempre lo staff prima di ordinare.",
    span: "md:col-span-12",
  },
];

interface ClientiSectionProps {
  scrollTo: (target: string) => void;
  onEnterApp?: () => void;
}

export const ClientiSection = ({ scrollTo, onEnterApp }: ClientiSectionProps) => (
  <section id="clienti" className="py-24 md:py-32 bg-[#F1F5F9]/60 border-y border-[#E2E8F0]">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
            Per chi mangia fuori
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] mt-3 font-heading">
            Scopri cosa puoi mangiare, in 3 passi
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => scrollTo("top")}
            data-testid="clienti-cta"
            className="group inline-flex items-center gap-2 self-start btn-clay-green font-semibold px-6 py-3.5 rounded-full border-0 cursor-pointer"
          >
            Prova la demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          {onEnterApp && (
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 btn-clay-white font-semibold px-6 py-3.5 rounded-full cursor-pointer"
            >
              Accedi come Cliente
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            data-testid={`clienti-step-${s.n}`}
            className={`${s.span} bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-[0_8px_30px_rgba(124,58,237,0.04)] hover:-translate-y-1 transition-transform`}
          >
            <div className="flex items-start justify-between">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-[#7C3AED] text-white shadow-[0_8px_24px_rgba(124,58,237,0.3)]">
                <s.Icon className="w-7 h-7" strokeWidth={2} />
              </div>
              <span className="text-4xl font-extrabold text-[#DDD6FE] font-heading">
                {s.n}
              </span>
            </div>
            <h3 className="text-xl font-extrabold mt-6 text-[#0F172A] font-heading">
              {s.title}
            </h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed max-w-md">
              {s.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
