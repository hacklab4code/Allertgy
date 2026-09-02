import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, UtensilsCrossed, Pizza, IceCreamCone, Cherry, Croissant } from "lucide-react";
import { DEMO_ALLERGENS, DEMO_DISHES, getSemaforo } from "../../data/allergens";

const HERO_IMG =
  "https://static.prod-images.emergentagent.com/jobs/1fd5b028-e395-4976-965f-8697c0422be9/images/a9fc486ac18a9c7d01ee28f173707c314bc29e1da97c8738c0ece7a7531ce374.png";

interface HeroProps {
  scrollTo: (target: string) => void;
  onEnter: () => void;
  onClienti: () => void;
}

export const Hero = ({ onEnter, onClienti }: HeroProps) => {
  const [selected, setSelected] = useState(new Set(["latte", "crostacei"]));

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  return (
    <section id="top" className="relative overflow-hidden pt-32 md:pt-40 pb-24">
      {/* Background overlay */}
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={HERO_IMG}
          alt=""
          className="w-full h-full object-cover object-center opacity-85"
          initial={{ scale: 1.06 }}
          animate={{ scale: [1.06, 1.12, 1.06], x: [0, -14, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] from-25% via-[#F8FAFC]/80 to-[#F8FAFC]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-[#F8FAFC]/50" />
      </div>

      {/* Animated drawn food elements floating in the hero */}
      {[
        { Icon: Pizza, top: "14%", left: "40%", size: 40, color: "#7C3AED", dur: 7, delay: 0, rot: 14 },
        { Icon: IceCreamCone, top: "58%", left: "44%", size: 34, color: "#A855F7", dur: 6, delay: 0.8, rot: -12 },
        { Icon: Cherry, top: "30%", left: "34%", size: 30, color: "#EF4444", dur: 8, delay: 0.4, rot: 10 },
        { Icon: Croissant, top: "70%", left: "36%", size: 34, color: "#F59E0B", dur: 6.5, delay: 1.2, rot: -8 },
      ].map(({ Icon, top, left, size, color, dur, delay, rot }, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block pointer-events-none"
          style={{ top, left, color }}
          animate={{ y: [0, -18, 0], rotate: [0, rot, 0], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon width={size} height={size} strokeWidth={1.6} />
        </motion.div>
      ))}

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-6 space-y-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#DDD6FE] px-4 py-2 text-[#7C3AED] text-xs font-bold uppercase tracking-[0.2em] shadow-[0_8px_30px_rgba(124,58,237,0.06)]">
            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" strokeWidth={2.2} />
            Sicurezza al tavolo
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] text-[#0F172A] font-heading">
            Cosa posso
            <br />
            mangiare qui?
            <br />
            <span className="text-[#7C3AED]">Scansiona e scopri.</span>
          </h1>

          <p className="text-base lg:text-lg text-[#475569] max-w-lg leading-relaxed">
            Il QR al tavolo non mostra un menù generico: confronta le tue
            allergie con i piatti del locale e ti dice subito cosa puoi
            ordinare — verde, giallo o rosso.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onClienti}
              data-testid="hero-clienti-btn"
              className="group inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold px-7 py-4 rounded-full border-0 cursor-pointer shadow-[0_12px_32px_rgba(124,58,237,0.35)] transition-all hover:-translate-y-1"
            >
              Prova come cliente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onEnter}
              data-testid="hero-ristoratori-btn"
              className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] hover:border-[#7C3AED] hover:text-[#7C3AED] font-semibold px-7 py-4 rounded-full cursor-pointer transition-all hover:-translate-y-1 shadow-sm"
            >
              <UtensilsCrossed className="w-4 h-4 text-[#7C3AED]" />
              Sono un ristoratore
            </button>
          </div>
        </motion.div>

        {/* Right: interactive demo */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="lg:col-span-6"
        >
          <div className="relative bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-6 md:p-7 shadow-[0_12px_40px_rgba(124,58,237,0.08)]">
            <div className="absolute -top-3.5 right-6 bg-[#2E1065] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-white/20 shadow-md">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#10B981]" />
              </span>
              Demo live
            </div>

            <h3 className="text-xl font-extrabold text-[#0F172A] font-heading">
              Prova con le tue allergie
            </h3>
            <p className="text-sm text-[#64748B] mt-1 mb-5">
              Ogni piatto cambia colore in base a cosa puoi e non puoi mangiare.
            </p>

            {/* Allergen pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {DEMO_ALLERGENS.map(({ code, name, Icon }) => {
                const active = selected.has(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggle(code)}
                    data-testid={`allergen-pill-${code}`}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_6px_18px_rgba(124,58,237,0.30)]"
                        : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#DDD6FE] shadow-sm"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Dish cards */}
            <div className="space-y-3">
              {DEMO_DISHES.map((dish) => {
                const s = getSemaforo(dish, selected);
                return (
                  <motion.div
                    key={dish.nome}
                    layout
                    data-testid={`demo-dish-${s.stato}`}
                    className={`p-4 rounded-2xl border transition-all duration-300 ${s.card}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="relative flex w-3 h-3 shrink-0">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${s.dot}`} />
                            <span className={`relative inline-flex w-3 h-3 rounded-full ${s.dot}`} />
                          </span>
                          <h4 className="font-bold text-sm text-[#0F172A] truncate font-heading">
                            {dish.nome}
                          </h4>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1 leading-snug">
                          {dish.descrizione}
                        </p>
                        {s.match.length > 0 && (
                          <p className={`text-xs font-semibold mt-2 ${s.text}`}>
                            {s.stato === "rosso" ? "Contiene: " : "Possibili tracce: "}
                            {s.match.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-[#0F172A]">
                          {dish.prezzo}
                        </div>
                        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-full mt-2 shadow-sm ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
