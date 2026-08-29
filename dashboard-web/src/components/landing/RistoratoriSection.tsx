import { motion } from "framer-motion";
import {
  ScanLine,
  FileCheck,
  QrCode,
  BellRing,
  ShieldCheck,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface RistoratoriStep {
  n: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  badge: string;
  span: string;
}

const STEPS: RistoratoriStep[] = [
  {
    n: "01",
    Icon: ScanLine,
    title: "Fotografa il Menù con AI Vision",
    desc: "Carica una foto del tuo menù cartaceo o un file PDF. L'Intelligenza Artificiale estrae istantaneamente piatti e ingredienti ed evidenzia i 14 allergeni previsti per legge.",
    badge: "AI Scanning",
    span: "md:col-span-7",
  },
  {
    n: "02",
    Icon: FileCheck,
    title: "Registro Allergeni a Norma di Legge",
    desc: "Verifica e conferma le schede piatto. Genera in un click il Registro Allergeni digitale in PDF conforme al Reg. UE 1169/2011, a prova di controlli ASL o NAS.",
    badge: "100% A norma UE",
    span: "md:col-span-5",
  },
  {
    n: "03",
    Icon: QrCode,
    title: "QR Code Smart per i Tavoli",
    desc: "Stampa ed esponi il QR Code sui tavoli. Quando il cliente inquadra con lo smartphone, il tuo menù si adatta al volo sul suo specifico profilo allergico.",
    badge: "Menù al Tavolo",
    span: "md:col-span-5",
  },
  {
    n: "04",
    Icon: BellRing,
    title: "Fidelizza & Invia Notifiche Push",
    desc: "Attira i clienti con esigenze alimentari specifiche e trasformali in clienti abituali. Invia notifiche push per promozioni, serate a tema e nuovi piatti.",
    badge: "Crescita & Clienti",
    span: "md:col-span-7",
  },
];

interface BenefitItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

const BENEFITS: BenefitItem[] = [
  {
    Icon: ShieldCheck,
    title: "Compliance UE 100% Garantita",
    desc: "Rispetta il Regolamento UE 1169/2011 ed evita sanzioni senza fogli cartacei disordinati.",
    color: "text-[#36255C]",
    bg: "bg-[#E6DFF5]",
  },
  {
    Icon: Clock,
    title: "Zero Errori in Sala",
    desc: "I camerieri non devono più correre in cucina a chiedere ingredienti durante i picchi di lavoro.",
    color: "text-[#2563EB]",
    bg: "bg-[#DBEAFE]",
  },
  {
    Icon: TrendingUp,
    title: "+25% Scontrino Medio",
    desc: "Le persone con allergie o intolleranze scelgono locali sicuri e trascinano ampie comitive.",
    color: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
  },
  {
    Icon: RefreshCw,
    title: "Aggiornamenti in Tempo Reale",
    desc: "Modifica un ingrediente dall'editor e il menù si aggiorna all'istante su tutti i QR Code.",
    color: "text-[#9333EA]",
    bg: "bg-[#F3E8FF]",
  },
];

interface RistoratoriSectionProps {
  scrollTo: (target: string) => void;
  onEnterDashboard?: () => void;
}

export const RistoratoriSection = ({ scrollTo, onEnterDashboard }: RistoratoriSectionProps) => (
  <section id="ristoratori" className="py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-[#E6DFF5] text-[#36255C]">
            <Sparkles className="w-3.5 h-3.5" />
            Per i ristoratori
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#36255C] mt-4 font-heading">
            Digitalizza il tuo locale e attira nuovi clienti, in 4 passi
          </h2>
          <p className="text-[#6B6575] mt-3 text-base lg:text-lg leading-relaxed">
            Trasforma un obbligo di legge in un'opportunità di business. Zero pratiche burocratiche, massima sicurezza per i tuoi ospiti.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => scrollTo("prezzi")}
            data-testid="ristoratori-cta"
            className="group inline-flex items-center gap-2 self-start btn-clay-dark font-semibold px-7 py-4 rounded-full border-0 cursor-pointer"
          >
            Scopri i piani
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          {onEnterDashboard && (
            <button
              onClick={onEnterDashboard}
              className="inline-flex items-center gap-2 btn-clay-white font-semibold px-7 py-4 rounded-full border-0 cursor-pointer text-[#36255C]"
            >
              Accedi alla Dashboard
            </button>
          )}
        </div>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            data-testid={`ristoratori-step-${i + 1}`}
            className={`${s.span} card-clay-white p-8 hover:-translate-y-1 transition-transform flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-[#36255C] text-white">
                  <s.Icon className="w-7 h-7 text-[#B9A6E8]" strokeWidth={1.75} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#36255C] bg-[#E6DFF5] px-3 py-1 rounded-full">
                    {s.badge}
                  </span>
                  <span className="text-4xl font-extrabold text-[#E6DFF5] font-heading">
                    {s.n}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-extrabold mt-6 text-[#36255C] font-heading">
                {s.title}
              </h3>
              <p className="text-sm text-[#6B6575] mt-2 leading-relaxed max-w-md">
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Strategic Benefits (Bento Grid) */}
      <div className="bg-[#E6DFF5]/40 border border-[#E6DFF5] rounded-3xl p-8 md:p-12">
        <div className="max-w-xl mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#36255C]">
            Perché sceglierci
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#36255C] mt-2 font-heading">
            Tutti i vantaggi per la tua attività
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="card-clay-white p-6 flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl grid place-items-center ${b.bg} ${b.color} mb-4`}>
                  <b.Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <h4 className="font-extrabold text-[#36255C] font-heading text-base">
                  {b.title}
                </h4>
                <p className="text-xs text-[#6B6575] mt-2 leading-relaxed">
                  {b.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E6DFF5]/50 flex items-center gap-1.5 text-[11px] font-bold text-[#36255C]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Incluso nel servizio</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
