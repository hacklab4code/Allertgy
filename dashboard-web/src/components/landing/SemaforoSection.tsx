import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from "lucide-react";

interface CardItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  tint: string;
  ic: string;
  stato: string;
}

const CARDS: CardItem[] = [
  {
    Icon: CheckCircle2,
    title: "Idoneo",
    desc: "Nessun allergene del tuo profilo tra quelli dichiarati dal locale. Puoi ordinare serenamente.",
    tint: "border-2 border-[#86EFAC] bg-[#DCFCE7] shadow-[0_12px_24px_-4px_rgba(22,163,74,0.12),inset_0_-4px_6px_rgba(0,0,0,0.05),inset_0_4px_6px_rgba(255,255,255,0.6)]",
    ic: "text-[#166534]",
    stato: "verde",
  },
  {
    Icon: AlertTriangle,
    title: "Con attenzione",
    desc: "Possibili tracce o contaminazione incrociata. Chiedi sempre conferma al personale di sala.",
    tint: "border-2 border-[#FDE047] bg-[#FEF9C3] shadow-[0_12px_24px_-4px_rgba(234,179,8,0.12),inset_0_-4px_6px_rgba(0,0,0,0.05),inset_0_4px_6px_rgba(255,255,255,0.6)]",
    ic: "text-[#854D0E]",
    stato: "giallo",
  },
  {
    Icon: XCircle,
    title: "Non idoneo",
    desc: "Il piatto contiene un allergene del tuo profilo. È da evitare secondo i dati dichiarati.",
    tint: "border-2 border-[#FCA5A5] bg-[#FEE2E2] shadow-[0_12px_24px_-4px_rgba(220,38,38,0.12),inset_0_-4px_6px_rgba(0,0,0,0.05),inset_0_4px_6px_rgba(255,255,255,0.4)]",
    ic: "text-[#991B1B]",
    stato: "rosso",
  },
];

export const SemaforoSection = () => (
  <section id="semaforo" className="py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#16A34A]">
          Il sistema
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C221F] mt-3 font-heading">
          Verde, giallo, rosso: la risposta per te
        </h2>
        <p className="text-[#4A524D] mt-4 text-base lg:text-lg leading-relaxed">
          Non un menù da sfogliare — un semaforo costruito sul tuo profilo
          allergico, piatto per piatto.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-14">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            data-testid={`semaforo-card-${c.stato}`}
            className={`rounded-3xl border p-8 ${c.tint} transition-transform hover:-translate-y-1`}
          >
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <c.Icon className={`w-8 h-8 ${c.ic}`} strokeWidth={1.75} />
            </div>
            <h3 className="text-xl font-extrabold mt-5 text-[#1C221F] font-heading">
              {c.title}
            </h3>
            <p className="text-sm text-[#4A524D] mt-2 leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
