import type { Garment } from "./types";

export type OutfitValidation = { ok: true } | { ok: false; reason: string };

export const MIN_OUTFIT_ITEMS = 2;
export const MAX_OUTFIT_ITEMS = 7;

type Candidate = Pick<Garment, "id" | "category"> & Partial<Pick<Garment, "status" | "archived_at">>;

const MAX_BY_CATEGORY = { outerwear: 1, shoes: 1, bag: 1, accessory: 2 } as const;
const LABEL = {
  outerwear: "abrigo o chaqueta",
  shoes: "calzado",
  bag: "bolso",
  accessory: "accesorio",
} as const;

/**
 * Regla de composición de un outfit (R-05). Pura: la usa el servidor al persistir y el agente
 * recibe `reason` como error de herramienta para corregir.
 *
 * - Solo prendas `ready` y no archivadas (cuando el dato viene en la prenda).
 * - [1 o 2 arriba + 1 abajo] o [1 vestido, con 0 o 1 arriba como capa y sin abajo].
 * - Máx. 1 abrigo, 1 calzado, 1 bolso y 2 accesorios. De 2 a 7 prendas, sin repetidas.
 */
export function validateOutfitComposition(garments: Candidate[]): OutfitValidation {
  if (garments.some((g) => (g.status !== undefined && g.status !== "ready") || (g.archived_at ?? null) !== null)) {
    return { ok: false, reason: "Solo se pueden usar prendas listas y que no estén archivadas." };
  }
  if (garments.length < MIN_OUTFIT_ITEMS) {
    return { ok: false, reason: `Un look necesita al menos ${MIN_OUTFIT_ITEMS} prendas.` };
  }
  if (garments.length > MAX_OUTFIT_ITEMS) {
    return { ok: false, reason: `Un look admite como máximo ${MAX_OUTFIT_ITEMS} prendas.` };
  }
  if (new Set(garments.map((x) => x.id)).size !== garments.length) {
    return { ok: false, reason: "Hay prendas repetidas en el look." };
  }

  const count = (category: Garment["category"]) => garments.filter((x) => x.category === category).length;
  const dresses = count("dress");
  const tops = count("top");
  const bottoms = count("bottom");

  if (dresses > 1) return { ok: false, reason: "Solo puede haber un vestido por look." };
  if (dresses === 1) {
    if (bottoms > 0) return { ok: false, reason: "Un vestido no se combina con una parte de abajo." };
    if (tops > 1) return { ok: false, reason: "Con un vestido solo cabe una parte de arriba, como capa." };
  } else {
    if (tops === 0 || bottoms === 0) {
      return { ok: false, reason: "El look necesita una parte de arriba y una de abajo, o un vestido." };
    }
    if (tops > 2) return { ok: false, reason: "Un look admite como máximo dos partes de arriba." };
    if (bottoms > 1) return { ok: false, reason: "Un look admite una sola parte de abajo." };
  }

  for (const category of Object.keys(MAX_BY_CATEGORY) as (keyof typeof MAX_BY_CATEGORY)[]) {
    const max = MAX_BY_CATEGORY[category];
    if (count(category) > max) {
      return {
        ok: false,
        reason: max === 1 ? `Solo puede haber un ${LABEL[category]} por look.` : `Solo puede haber hasta ${max} ${LABEL[category]}s por look.`,
      };
    }
  }
  return { ok: true };
}
