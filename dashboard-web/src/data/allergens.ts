import {
  Wheat, Milk, Egg, Fish, Shrimp, Bean, Sprout, Nut,
  Leaf, Droplet, CircleDot, Wine, Shell, Salad,
  type LucideIcon,
} from "lucide-react";

export interface Allergen {
  code: string;
  name: string;
  Icon: LucideIcon;
}

// 14 allergeni previsti dalla normativa UE
export const ALLERGENS: Allergen[] = [
  { code: "glutine", name: "Glutine", Icon: Wheat },
  { code: "latte", name: "Latte", Icon: Milk },
  { code: "uova", name: "Uova", Icon: Egg },
  { code: "pesce", name: "Pesce", Icon: Fish },
  { code: "crostacei", name: "Crostacei", Icon: Shrimp },
  { code: "molluschi", name: "Molluschi", Icon: Shell },
  { code: "arachidi", name: "Arachidi", Icon: Bean },
  { code: "frutta_a_guscio", name: "Frutta a guscio", Icon: Nut },
  { code: "soia", name: "Soia", Icon: Sprout },
  { code: "sedano", name: "Sedano", Icon: Leaf },
  { code: "senape", name: "Senape", Icon: Droplet },
  { code: "sesamo", name: "Sesamo", Icon: CircleDot },
  { code: "solfiti", name: "Solfiti", Icon: Wine },
  { code: "lupini", name: "Lupini", Icon: Salad },
];

// Sottoinsieme mostrato nella demo interattiva della hero
export const DEMO_ALLERGENS = ALLERGENS.filter((a) =>
  ["glutine", "latte", "uova", "pesce", "crostacei", "frutta_a_guscio", "soia", "sedano"].includes(a.code)
);

export interface DemoDish {
  nome: string;
  descrizione: string;
  categoria: string;
  prezzo: string;
  contenuti: string[];
  tracce: string[];
}

export const DEMO_DISHES: DemoDish[] = [
  {
    nome: "Spaghetti alla Carbonara",
    descrizione: "Guanciale croccante, uova biologiche, pecorino DOP",
    categoria: "Primi",
    prezzo: "12,00 €",
    contenuti: ["glutine", "uova", "latte"],
    tracce: [],
  },
  {
    nome: "Insalata di Mare",
    descrizione: "Polpo, gamberi sgusciati, sedano, olio al limone",
    categoria: "Antipasti",
    prezzo: "14,00 €",
    contenuti: ["crostacei"],
    tracce: ["pesce"],
  },
  {
    nome: "Sorbetto al Limone",
    descrizione: "Limoni di Sorrento, zucchero, menta fresca",
    categoria: "Dolci",
    prezzo: "4,50 €",
    contenuti: [],
    tracce: ["latte"],
  },
];

export interface SemaforoResult {
  stato: "rosso" | "giallo" | "verde";
  match: string[];
  label: string;
  card: string;
  text: string;
  dot: string;
  badge: string;
}

export function getSemaforo(dish: DemoDish, selected: Set<string>): SemaforoResult {
  const cont = dish.contenuti.filter((a) => selected.has(a));
  const trac = dish.tracce.filter((a) => selected.has(a));
  if (cont.length > 0)
    return {
      stato: "rosso",
      match: cont,
      label: "NON IDONEO",
      card: "border-[#FECACA] bg-[#FEF2F2]",
      text: "text-[#991B1B]",
      dot: "bg-[#EF4444]",
      badge: "bg-[#EF4444] text-white",
    };
  if (trac.length > 0)
    return {
      stato: "giallo",
      match: trac,
      label: "ATTENZIONE",
      card: "border-[#FDE68A] bg-[#FFFBEB]",
      text: "text-[#92400E]",
      dot: "bg-[#F59E0B]",
      badge: "bg-[#F59E0B] text-white",
    };
  return {
    stato: "verde",
    match: [],
    label: "IDONEO",
    card: "border-[#A7F3D0] bg-[#ECFDF5]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]",
    badge: "bg-[#10B981] text-white",
  };
}
