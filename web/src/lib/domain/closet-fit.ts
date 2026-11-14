import type { GarmentCategory } from "./types";

// N4 del modelo de decisión (D-03): ¿el clóset alcanza para la formalidad del marco? Regla pura, sin IA.
// El asesor traduce el marco a un nivel 1 a 5; esta regla lo compara con la formalidad de las prendas y devuelve uno
// de tres resultados. El asesor no decide por su cuenta que "no alcanza".

export type FitGarment = { id: string; name: string; category: GarmentCategory; formality: number };

export type FitResult = "alcanza" | "falta_una_pieza" | "no_hay_base";

/** Por qué una categoría base no llega: no hay ninguna prenda, o las que hay quedan sobre o bajo el nivel pedido. */
export type FitGap = { category: GarmentCategory; reason: "no_hay" | "falta_mas_formal" | "falta_mas_relajada" };

export type ClosetFit = {
  target: number;
  result: FitResult;
  /** Categorías base que no llegan a la formalidad del marco. Vacío si alcanza. */
  gaps: FitGap[];
  /** Ids de las prendas base que sí llegan, por categoría: de aquí se arma el look. */
  reaching: Partial<Record<GarmentCategory, string[]>>;
  /** El clóset no tiene ningún calzado cargado: no es una pieza que falta, se pide una foto (D-03). */
  no_shoes_loaded: boolean;
};

/** Margen confirmado por Felipe: la prenda está en el nivel del marco o a un nivel de distancia. */
export const FORMALITY_MARGIN = 1;

export function reachesFormality(formality: number, target: number): boolean {
  return Math.abs(formality - target) <= FORMALITY_MARGIN;
}

function gapFor(category: GarmentCategory, all: FitGarment[], target: number): FitGap | null {
  const inCategory = all.filter((g) => g.category === category);
  if (inCategory.length === 0) return { category, reason: "no_hay" };
  if (inCategory.some((g) => reachesFormality(g.formality, target))) return null;
  const allBelow = inCategory.every((g) => g.formality < target);
  return { category, reason: allBelow ? "falta_mas_formal" : "falta_mas_relajada" };
}

/**
 * Compara el clóset con la formalidad del marco.
 * Base: [parte de arriba + parte de abajo] o [vestido], más calzado si hay alguno cargado.
 * 0 categorías base sin llegar → alcanza · 1 → falta una pieza · 2 o más, o sin cuerpo del look → no hay base.
 */
export function closetFit(garments: FitGarment[], targetFormality: number): ClosetFit {
  const target = Math.min(5, Math.max(1, Math.round(targetFormality)));
  const reaching: ClosetFit["reaching"] = {};
  for (const g of garments) {
    if (reachesFormality(g.formality, target)) (reaching[g.category] ??= []).push(g.id);
  }

  const hasShoes = garments.some((g) => g.category === "shoes");
  const shoesGap = hasShoes ? gapFor("shoes", garments, target) : null;

  // Cuerpo del look: se elige el camino que deja menos vacíos (separados o vestido).
  const separates = [gapFor("top", garments, target), gapFor("bottom", garments, target)].filter((g): g is FitGap => g !== null);
  const dress = gapFor("dress", garments, target);
  const dressGaps = dress ? [dress] : [];
  const hasSeparates = garments.some((g) => g.category === "top") && garments.some((g) => g.category === "bottom");
  const hasDress = garments.some((g) => g.category === "dress");

  let bodyGaps: FitGap[];
  if (!hasSeparates && !hasDress) bodyGaps = separates; // no se puede armar ningún look: falta una categoría base
  else if (hasSeparates && hasDress) bodyGaps = dressGaps.length < separates.length ? dressGaps : separates;
  else bodyGaps = hasSeparates ? separates : dressGaps;

  const gaps = [...bodyGaps, ...(shoesGap ? [shoesGap] : [])];
  const noBody = !hasSeparates && !hasDress;
  const result: FitResult = noBody || gaps.length >= 2 ? "no_hay_base" : gaps.length === 1 ? "falta_una_pieza" : "alcanza";
  return { target, result, gaps, reaching, no_shoes_loaded: !hasShoes };
}

const BASE: ReadonlySet<GarmentCategory> = new Set(["top", "bottom", "dress", "shoes"]);

/**
 * Revisa un look propuesto contra la regla. Devuelve null si pasa, o el motivo accionable para el asesor:
 *  - una prenda base no llega y en su categoría hay otras que sí → que la cambie;
 *  - una prenda base no llega y nada de su categoría llega → debe declararlo como pieza que falta.
 */
export function checkOutfitFormality(
  outfit: FitGarment[],
  closet: FitGarment[],
  fit: ClosetFit,
  declaredMissing: GarmentCategory | null,
): string | null {
  for (const g of outfit) {
    if (!BASE.has(g.category) || reachesFormality(g.formality, fit.target)) continue;
    const better = closet.filter((c) => c.category === g.category && reachesFormality(c.formality, fit.target));
    if (better.length > 0) {
      const names = better.slice(0, 4).map((c) => `${c.name} (${c.id})`).join(", ");
      return `"${g.name}" tiene formalidad ${g.formality} y el marco pide ${fit.target}: no llega. En esa categoría sí llegan: ${names}. Cámbiala por una de esas.`;
    }
    if (declaredMissing !== g.category && fit.result !== "no_hay_base") {
      return `Nada de esa categoría llega a la formalidad ${fit.target} ("${g.name}" tiene ${g.formality}). Puedes usarla como lo más cercano, pero declara missing_piece con category "${g.category}" y dilo con claridad.`;
    }
  }
  if (fit.result !== "alcanza" && fit.gaps.length > 0 && !declaredMissing) {
    const cats = fit.gaps.map((x) => x.category).join(", ");
    return `Según la regla de formalidad el clóset no alcanza (${fit.result}; no llega: ${cats}). Propón lo más cercano, pero declara missing_piece con la pieza que más falta.`;
  }
  return null;
}
