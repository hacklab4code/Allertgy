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

export const Hero = ({ scrollTo, onEnter, onClienti }: HeroProps) => {
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
      {/* Hand-drawn illustration + soft cream gradient for legibility */}
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={HERO_IMG}
          alt=""
          className="w-full h-full object-cover object-center opacity-90"
          initial={{ scale: 1.06 }}
          animate={{ scale: [1.06, 1.12, 1.06], x: [0, -14, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F2FC] from-25% via-[#F6F2FC]/75 to-[#F6F2FC]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F2FC] via-transparent to-[#F6F2FC]/50" />
      </div>

      {/* Animated drawn food elements floating in the hero */}
      {[
        { Icon: Pizza, top: "14%", left: "40%", size: 40, color: "#36255C", dur: 7, delay: 0, rot: 14 },
        { Icon: IceCreamCone, top: "58%", left: "44%", size: 34, color: "#DB2777", dur: 6, delay: 0.8, rot: -12 },
        { Icon: Cherry, top: "30%", left: "34%", size: 30, color: "#DC2626", dur: 8, delay: 0.4, rot: 10 },
        { Icon: Croissant, top: "70%", left: "36%", size: 34, color: "#EAB308", dur: 6.5, delay: 1.2, rot: -8 },
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
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E6DFF5] px-4 py-2 text-[#6B6575] text-xs font-bold uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <ShieldCheck className="w-4 h-4 text-[#36255C]" strokeWidth={2} />
            Non un menù — una risposta per te
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] text-[#36255C] font-heading">
            Cosa posso
            <br />
            mangiare qui?
            <br />
            <span className="text-[#B9A6E8]">Scansiona e scopri.</span>
          </h1>

          <p className="text-base lg:text-lg text-[#6B6575] max-w-lg leading-relaxed">
            Il QR al tavolo non mostra un menù generico: confronta le tue
            allergie con i piatti del locale e ti dice subito cosa puoi
            ordinare — verde, giallo o rosso.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onClienti}
              data-testid="hero-clienti-btn"
              className="group inline-flex items-center gap-2 btn-clay-green font-semibold px-7 py-4 rounded-full border-0 cursor-pointer"
            >
              Prova come cliente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onEnter}
              data-testid="hero-ristoratori-btn"
              className="inline-flex items-center gap-2 btn-clay-white font-semibold px-7 py-4 rounded-full cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" />
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
          <div className="relative card-clay-white p-6 md:p-7">
            <div className="absolute -top-3.5 right-6 bg-[#36255C] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-white/20 shadow-md">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#4ADE80]" />
              </span>
              Demo live
            </div>

            <h3 className="text-xl font-extrabold text-[#36255C] font-heading">
              Prova con le tue allergie
            </h3>
            <p className="text-sm text-[#6B6575] mt-1 mb-5">
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
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? "badge-clay-green border-transparent text-white"
                        : "bg-white border-[#E6DFF5] text-[#6B6575] hover:border-[#D2C3F6]/40 shadow-sm"
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
                const cardStyle =
                  s.stato === "rosso"
                    ? "border-2 border-[#FCA5A5]/80 bg-[#FEE2E2] shadow-[0_6px_16px_rgba(220,38,38,0.06),inset_0_-3px_5px_rgba(0,0,0,0.04),inset_0_3px_5px_rgba(255,255,255,0.4)]"
                    : s.stato === "giallo"
                    ? "border-2 border-[#FDE047]/80 bg-[#FEF9C3] shadow-[0_6px_16px_rgba(234,179,8,0.06),inset_0_-3px_5px_rgba(0,0,0,0.04),inset_0_3px_5px_rgba(255,255,255,0.5)]"
                    : "border-2 border-[#86EFAC]/80 bg-[#DCFCE7] shadow-[0_6px_16px_rgba(22,163,74,0.06),inset_0_-3px_5px_rgba(0,0,0,0.04),inset_0_3px_5px_rgba(255,255,255,0.5)]";

                const badgeStyle =
                  s.stato === "rosso"
                    ? "badge-clay-red text-[9px] font-black px-2 py-1 rounded-full mt-2"
                    : s.stato === "giallo"
                    ? "badge-clay-yellow text-[9px] font-black px-2 py-1 rounded-full mt-2"
                    : "badge-clay-green text-[9px] font-black px-2 py-1 rounded-full mt-2";

                return (
                  <motion.div
                    key={dish.nome}
                    layout
                    data-testid={`demo-dish-${s.stato}`}
                    className={`p-4 rounded-2xl transition-all duration-300 ${cardStyle}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="relative flex w-3 h-3 shrink-0">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${s.dot}`} />
                            <span className={`relative inline-flex w-3 h-3 rounded-full ${s.dot}`} />
                          </span>
                          <h4 className="font-bold text-sm text-[#36255C] truncate font-heading">
                            {dish.nome}
                          </h4>
                        </div>
                        <p className="text-xs text-[#6B6575] mt-1 leading-snug">
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
                        <div className="text-sm font-extrabold text-[#36255C]">
                          {dish.prezzo}
                        </div>
                        <span className={badgeStyle}>
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
