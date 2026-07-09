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
      card: "border-[#FCA5A5] bg-[#FEE2E2]",
      text: "text-[#991B1B]",
      dot: "bg-[#DC2626]",
      badge: "bg-[#DC2626] text-white",
    };
  if (trac.length > 0)
    return {
      stato: "giallo",
      match: trac,
      label: "CON ATTENZIONE",
      card: "border-[#FDE047] bg-[#FEF9C3]",
      text: "text-[#854D0E]",
      dot: "bg-[#EAB308]",
      badge: "bg-[#EAB308] text-[#1C221F]",
    };
  return {
    stato: "verde",
    match: [],
    label: "IDONEO",
    card: "border-[#86EFAC] bg-[#DCFCE7]",
    text: "text-[#166534]",
    dot: "bg-[#16A34A]",
    badge: "bg-[#16A34A] text-white",
  };
}
