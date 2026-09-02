import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from "lucide-react";

interface CardItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  tint: string;
  ic: string;
  stato: string;
  badge: string;
}

const CARDS: CardItem[] = [
  {
    Icon: CheckCircle2,
    title: "Idoneo",
    desc: "Nessun allergene del tuo profilo tra quelli dichiarati dal locale. Puoi ordinare serenamente.",
    tint: "border border-[#A7F3D0] bg-[#ECFDF5] shadow-sm",
    ic: "text-[#065F46]",
    stato: "verde",
    badge: "bg-[#10B981] text-white",
  },
  {
    Icon: AlertTriangle,
    title: "Attenzione",
    desc: "Possibili tracce o contaminazione incrociata. Chiedi sempre conferma al personale di sala.",
    tint: "border border-[#FDE68A] bg-[#FFFBEB] shadow-sm",
    ic: "text-[#92400E]",
    stato: "giallo",
    badge: "bg-[#F59E0B] text-white",
  },
  {
    Icon: XCircle,
    title: "Non idoneo",
    desc: "Il piatto contiene un allergene del tuo profilo. È da evitare secondo i dati dichiarati.",
    tint: "border border-[#FECACA] bg-[#FEF2F2] shadow-sm",
    ic: "text-[#991B1B]",
    stato: "rosso",
    badge: "bg-[#EF4444] text-white",
  },
];

export const SemaforoSection = () => (
  <section id="semaforo" className="py-24 md:py-32 bg-white/40">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
          Il sistema
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] mt-3 font-heading">
          Verde, giallo, rosso: la risposta per te
        </h2>
        <p className="text-[#475569] mt-4 text-base lg:text-lg leading-relaxed">
          Non un menù da sfogliare — un semaforo costruito sul tuo profilo
          allergico, piatto per piatto in meno di 3 secondi.
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
            className={`rounded-3xl p-8 ${c.tint} transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/90 shadow-sm">
                <c.Icon className={`w-7 h-7 ${c.ic}`} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.badge}`}>
                {c.title}
              </span>
            </div>
            <h3 className="text-xl font-extrabold mt-6 text-[#0F172A] font-heading">
              {c.title}
            </h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
