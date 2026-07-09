import { motion } from "framer-motion";
import { Store, ScanLine, PencilRuler, Printer, CheckCircle2, type LucideIcon } from "lucide-react";

const KITCHEN_IMG =
  "https://static.prod-images.emergentagent.com/jobs/1fd5b028-e395-4976-965f-8697c0422be9/images/ab4cf62e9b5acc5cac2960fb990f7ad1d7c3c4f823681147d76d3ec01149f2a2.png";

interface RistoratoriStep {
  Icon: LucideIcon;
  title: string;
  desc: string;
}

const STEPS: RistoratoriStep[] = [
  { Icon: Store, title: "Registra il locale", desc: "Crea il profilo del ristorante con orari, città e indirizzo." },
  { Icon: ScanLine, title: "Analisi con AI Vision", desc: "Carica una foto del menù cartaceo: l'AI estrae i piatti e suggerisce gli allergeni." },
  { Icon: PencilRuler, title: "Editor & Conferma", desc: "Verifica i suggerimenti dell'AI e adatta prezzi e ingredienti dall'editor visuale." },
  { Icon: Printer, title: "QR sul tavolo", desc: "Stampa il codice: ogni cliente scopre cosa può mangiare da te, personalizzato sulle sue allergie." },
];

interface RistoratoriSectionProps {
  scrollTo: (target: string) => void;
  onEnterDashboard?: () => void;
}

export const RistoratoriSection = ({ scrollTo, onEnterDashboard }: RistoratoriSectionProps) => (
  <section id="ristoratori" className="py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-[#FAF8F5] border border-[#EFEBE1]">
            <img src={KITCHEN_IMG} alt="Illustrazione di uno chef con menù digitale" className="w-full h-[420px] object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-2 md:right-6 card-clay-white p-5 max-w-[220px]">
            <div className="flex items-center gap-2 text-[#16A34A]">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" strokeWidth={2} />
              <span className="text-sm font-extrabold text-[#1C221F] font-heading">Clienti in sicurezza</span>
            </div>
            <p className="text-xs text-[#5C6B61] mt-1">Ogni ospite scopre cosa può mangiare da te.</p>
          </div>
        </motion.div>

        {/* Steps */}
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#16A34A]">
            Per i ristoratori
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1C221F] mt-3 font-heading">
            I clienti scoprono cosa possono mangiare da te
          </h2>
          <p className="text-[#4A524D] mt-4 leading-relaxed">
            Compili il menù una volta: ogni ospite con allergie vede il semaforo
            personalizzato al tavolo, senza interrogare il cameriere.
          </p>

          <div className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                data-testid={`ristoratori-step-${i + 1}`}
                className="flex gap-4"
              >
                <div className="grid place-items-center w-12 h-12 rounded-2xl bg-[#EFEBE1] text-[#1C221F] shrink-0">
                  <s.Icon className="w-6 h-6 text-[#16A34A]" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1C221F] font-heading">{s.title}</h3>
                  <p className="text-sm text-[#4A524D] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4 mt-9">
            <button
              onClick={() => scrollTo("prezzi")}
              data-testid="ristoratori-cta"
              className="inline-flex items-center gap-2 btn-clay-dark font-semibold px-7 py-4 rounded-full"
            >
              Scopri i piani
            </button>
            {onEnterDashboard && (
              <button
                onClick={onEnterDashboard}
                className="inline-flex items-center gap-2 btn-clay-white font-semibold px-7 py-4 rounded-full"
              >
                Accedi alla Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);
