import { motion } from "framer-motion";
import {
  Pizza, Croissant, Cherry, Grape, Coffee, IceCreamCone, Carrot, Apple,
  Soup, Cake, Banana, Salad, Fish, Egg, Wheat, Cookie, Sandwich, Donut,
  Citrus, Sprout, type LucideIcon,
} from "lucide-react";

interface BgItem {
  Icon: LucideIcon;
  top: string;
  left: string;
  size: number;
  color: string;
  dur: number;
  delay: number;
  rot: number;
}

const ITEMS: BgItem[] = [
  { Icon: Pizza, top: "8%", left: "6%", size: 58, color: "#16A34A", dur: 11, delay: 0, rot: 8 },
  { Icon: Croissant, top: "18%", left: "88%", size: 46, color: "#EAB308", dur: 13, delay: 1.2, rot: -10 },
  { Icon: Cherry, top: "34%", left: "14%", size: 40, color: "#DC2626", dur: 9, delay: 0.6, rot: 6 },
  { Icon: Grape, top: "46%", left: "92%", size: 52, color: "#7C3AED", dur: 14, delay: 2, rot: -6 },
  { Icon: Coffee, top: "62%", left: "8%", size: 44, color: "#92400E", dur: 12, delay: 0.9, rot: 10 },
  { Icon: IceCreamCone, top: "72%", left: "84%", size: 50, color: "#DB2777", dur: 10, delay: 1.6, rot: -8 },
  { Icon: Carrot, top: "12%", left: "46%", size: 42, color: "#EA580C", dur: 13, delay: 0.3, rot: 12 },
  { Icon: Apple, top: "88%", left: "22%", size: 46, color: "#16A34A", dur: 11, delay: 2.4, rot: -5 },
  { Icon: Soup, top: "40%", left: "50%", size: 40, color: "#B45309", dur: 15, delay: 1.1, rot: 7 },
  { Icon: Cake, top: "80%", left: "58%", size: 48, color: "#DB2777", dur: 12, delay: 0.5, rot: -9 },
  { Icon: Banana, top: "26%", left: "68%", size: 44, color: "#EAB308", dur: 10, delay: 1.9, rot: 11 },
  { Icon: Salad, top: "56%", left: "34%", size: 50, color: "#16A34A", dur: 13, delay: 0.8, rot: -7 },
  { Icon: Fish, top: "6%", left: "72%", size: 46, color: "#0891B2", dur: 14, delay: 2.2, rot: 9 },
  { Icon: Egg, top: "68%", left: "48%", size: 38, color: "#CA8A04", dur: 9, delay: 1.4, rot: -11 },
  { Icon: Wheat, top: "48%", left: "4%", size: 48, color: "#CA8A04", dur: 12, delay: 0.2, rot: 6 },
  { Icon: Cookie, top: "92%", left: "80%", size: 42, color: "#92400E", dur: 11, delay: 1.7, rot: -8 },
  { Icon: Sandwich, top: "16%", left: "26%", size: 44, color: "#D97706", dur: 13, delay: 2.6, rot: 10 },
  { Icon: Donut, top: "78%", left: "38%", size: 46, color: "#DB2777", dur: 10, delay: 0.7, rot: -6 },
  { Icon: Citrus, top: "36%", left: "78%", size: 40, color: "#F59E0B", dur: 14, delay: 1.3, rot: 8 },
  { Icon: Sprout, top: "58%", left: "66%", size: 42, color: "#16A34A", dur: 12, delay: 2.1, rot: -10 },
];

export const AnimatedBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    data-testid="animated-food-background"
  >
    {/* tinte morbide di sfondo */}
    <div className="absolute -top-32 -left-32 w-[38rem] h-[38rem] rounded-full bg-[#16A34A]/10 blur-3xl" />
    <div className="absolute top-1/3 -right-40 w-[34rem] h-[34rem] rounded-full bg-[#EAB308]/10 blur-3xl" />
    <div className="absolute -bottom-40 left-1/4 w-[36rem] h-[36rem] rounded-full bg-[#DB2777]/[0.07] blur-3xl" />

    {ITEMS.map(({ Icon, top, left, size, color, dur, delay, rot }, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ top, left, color }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.1, 0.16, 0.1],
          y: [0, -22, 0],
          rotate: [0, rot, 0],
        }}
        transition={{
          duration: dur,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Icon width={size} height={size} strokeWidth={1.4} />
      </motion.div>
    ))}
  </div>
);
