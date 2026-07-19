import { Nav } from "./components/landing/Nav";
import { Hero } from "./components/landing/Hero";
import { SemaforoSection } from "./components/landing/SemaforoSection";
import { ClientiSection } from "./components/landing/ClientiSection";
import { RistoratoriSection } from "./components/landing/RistoratoriSection";
import { PricingSection } from "./components/landing/PricingSection";
import { Footer } from "./components/landing/Footer";
import { AnimatedBackground } from "./components/landing/AnimatedBackground";

interface Props {
  onEnter: () => void;
  onClienti: () => void;
}

export default function Landing({ onEnter, onClienti }: Props) {
  const scrollTo = (target: string) => {
    if (target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(target);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#4A3B32] font-body antialiased relative selection:bg-[#FFD9A3] selection:text-[#4A3B32]">
      <AnimatedBackground />
      <Nav scrollTo={scrollTo} onEnter={onEnter} onClienti={onClienti} />
      <main>
        <Hero scrollTo={scrollTo} onEnter={onEnter} onClienti={onClienti} />
        <SemaforoSection />
        <ClientiSection scrollTo={scrollTo} onEnterApp={onClienti} />
        <RistoratoriSection scrollTo={scrollTo} onEnterDashboard={onEnter} />
        <PricingSection scrollTo={scrollTo} onSelectPlan={onEnter} />
      </main>
      <Footer scrollTo={scrollTo} />
    </div>
  );
}
