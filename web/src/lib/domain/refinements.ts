import type { ChatIntent, GarmentCategory, ProductOption, Refinement } from "./types";

// Botones de refinamiento (C-3). Los genera el servidor a partir del look o de la búsqueda: el modelo no inventa chips.

/** "blazer" -> "el blazer"; "cartera" -> "la cartera"; "zapatos" -> "los zapatos". Heurística simple para sustantivos de ropa. */
export function withArticle(noun: string): string {
  const n = noun.trim().toLowerCase();
  if (!n) return "";
  const first = n.split(/\s+/)[0];
  if (/as$/.test(first)) return `las ${n}`;
  if (/s$/.test(first)) return `los ${n}`;
  if (/(a|ión|dad|umbre)$/.test(first) && !/^(poncho|sombrero)/.test(first)) return `la ${n}`;
  return `el ${n}`;
}

type LookItem = { garment_id: string; name: string; category: GarmentCategory; subcategory?: string };

const noun = (g: LookItem) => (g.subcategory?.trim() || g.name.split(/\s+/).slice(0, 2).join(" ")).toLowerCase();

/** Hasta cuatro botones: más formal, otro color, cambiar la prenda más protagonista y quitar un complemento. */
export function buildOutfitRefinements(outfitId: string, items: LookItem[]): Refinement[] {
  const out: Refinement[] = [
    { id: "r-more_formal", label: "Más formal", intent: { kind: "refine_outfit", outfit_id: outfitId, change: "more_formal" } },
    { id: "r-other_color", label: "Otro color", intent: { kind: "refine_outfit", outfit_id: outfitId, change: "other_color" } },
  ];
  const swap = items.find((g) => g.category === "outerwear") ?? items.find((g) => g.category === "top" || g.category === "dress");
  if (swap) {
    out.push({
      id: `r-swap-${swap.garment_id}`,
      label: `Cambiar ${withArticle(noun(swap))}`,
      intent: { kind: "refine_outfit", outfit_id: outfitId, change: "swap_garment", garment_id: swap.garment_id },
    });
  }
  const drop = items.find((g) => g.category === "bag") ?? items.find((g) => g.category === "accessory");
  if (drop) {
    out.push({
      id: `r-drop-${drop.garment_id}`,
      label: `Sin ${noun(drop)}`,
      intent: { kind: "refine_outfit", outfit_id: outfitId, change: "drop_garment", garment_id: drop.garment_id },
    });
  }
  return out;
}

/** Botones de la búsqueda: más baratos, otro color y, solo en calzado, taco más bajo; siempre "No me interesan". */
export function buildSearchRefinements(blockId: string, slot: GarmentCategory): Refinement[] {
  const mk = (change: Extract<ChatIntent, { kind: "refine_search" }>["change"], label: string): Refinement => ({
    id: `r-${change}`,
    label,
    intent: { kind: "refine_search", block_id: blockId, change },
  });
  const out = [mk("cheaper", "Más baratos"), mk("other_color", "Otro color")];
  if (slot === "shoes") out.push(mk("lower_heel", "Taco más bajo"));
  out.push(mk("dismiss", "No me interesan"));
  return out;
}

/** Botones de la oferta de búsqueda. */
export function buildOfferActions(offerId: string, outfitId: string, slot: GarmentCategory): Refinement[] {
  return [
    { id: `${offerId}-accept`, label: "Sí, búscame opciones", intent: { kind: "accept_search", outfit_id: outfitId, slot } },
    { id: `${offerId}-decline`, label: "Por ahora no", intent: { kind: "decline_search", outfit_id: outfitId, slot } },
  ];
}

/** Opción elegida de un bloque, si hay. */
export function findOption(options: ProductOption[], id: string | null): ProductOption | null {
  return id ? (options.find((o) => o.id === id) ?? null) : null;
}
