import type { GarmentCategory, OutfitView } from "@/lib/domain/types";
import { SLOT_SHORT } from "./format";

// Composición de un look sobre la mesa (UX_UI_SPEC §7.10, PD-13): puro y sin React, para poder testearlo.
// La maqueta solo resuelve 5 piezas con posiciones fijas; aquí cualquier combinación de 1 a 7 piezas se reparte
// en dos franjas: arriba las prendas grandes (abrigo, arriba o vestido, abajo) y abajo las chicas (bolso, calzado,
// accesorio). Las rotaciones son fijas (nada se mueve al azar entre renders).

/** Orden de lectura y numeración de la composición. */
const RANK: Record<GarmentCategory, number> = { outerwear: 0, top: 1, dress: 1, bottom: 2, bag: 3, shoes: 4, accessory: 5 };
/** Proporción ancho/alto de la prenda recortada, por categoría (de los símbolos de la maqueta v4). */
export const ASPECT: Record<GarmentCategory, number> = {
  top: 0.92,
  bottom: 0.84,
  dress: 0.73,
  outerwear: 0.86,
  shoes: 1.41,
  bag: 1.02,
  accessory: 1,
};
const ROTATIONS = [-6, 5, 7, -4, 3, -3, 4];
const JITTER = [0, 2, -1, 2, -2, 1, 0];

export type PieceKind = "garment" | "missing" | "chosen";

export type Piece = {
  key: string;
  /** Número en la composición y en la leyenda (1, 2, 3…), por orden de lectura. */
  index: number;
  category: GarmentCategory;
  kind: PieceKind;
  /** Nombre de la prenda; de la faltante, "Zapatos: no tienes". */
  name: string;
  src: string | null;
  garmentId: string | null;
  /** Solo `chosen`: de dónde sale y cuánto cuesta. */
  store?: string;
  price?: number;
};

/** Piezas del look en orden de lectura: las prendas de la persona, y la pieza que falta (o la opción elegida). */
export function buildPieces(outfit: Pick<OutfitView, "items" | "missing_piece" | "selected_option">): Piece[] {
  const raw: Omit<Piece, "index">[] = outfit.items.map((it) => ({
    key: `g-${it.garment_id}`,
    category: it.category,
    kind: "garment" as const,
    name: it.name,
    src: it.photo_url,
    garmentId: it.garment_id,
  }));
  const miss = outfit.missing_piece;
  const sel = outfit.selected_option;
  if (miss && sel) {
    raw.push({
      key: `c-${sel.id}`,
      category: miss.category,
      kind: "chosen",
      name: sel.title,
      src: sel.image_cutout_url ?? sel.image_url,
      garmentId: null,
      store: sel.store_name,
      price: sel.price_clp,
    });
  } else if (miss) {
    raw.push({
      key: `m-${miss.category}`,
      category: miss.category,
      kind: "missing",
      name: `${SLOT_SHORT[miss.category]}: no tienes`,
      src: null,
      garmentId: null,
    });
  }
  return raw
    .map((p, i) => ({ p, i }))
    .sort((a, b) => RANK[a.p.category] - RANK[b.p.category] || a.i - b.i)
    .map(({ p }, i) => ({ ...p, index: i + 1 }));
}

export type Placement = { left: number; top: number; width: number; rotate: number; aspect: number };

type Band = { top: number; height: number };

function placeBand(cats: GarmentCategory[], band: Band, offset: number): Placement[] {
  const k = cats.length;
  return cats.map((cat, i) => {
    const aspect = ASPECT[cat];
    // La mesa es 3:2: una altura de H % equivale a H / 1.5 puntos de ancho.
    const byHeight = (band.height / 1.5) * aspect * 0.94;
    const byWidth = Math.min(40, (100 / k) * 1.1);
    const width = Math.round(Math.min(byWidth, byHeight) * 10) / 10;
    const heightPct = (width / aspect) * 1.5;
    const center = 4 + (92 * (i + 0.5)) / k;
    const left = Math.min(Math.max(center - width / 2, 1), 99 - width);
    const top = Math.max(band.top + (band.height - heightPct) / 2 + JITTER[(offset + i) % JITTER.length], 1);
    return {
      left: Math.round(left * 10) / 10,
      top: Math.round(top * 10) / 10,
      width,
      rotate: ROTATIONS[(offset + i) % ROTATIONS.length],
      aspect,
    };
  });
}

/** Posición de cada pieza (mismo orden que `categories`, que ya viene en orden de lectura). */
export function layoutPieces(categories: GarmentCategory[]): Placement[] {
  const isUpper = (c: GarmentCategory) => RANK[c] <= 2;
  const upper = categories.filter(isUpper);
  const lower = categories.filter((c) => !isUpper(c));
  const both = upper.length > 0 && lower.length > 0;
  const upperBand: Band = both ? { top: 2, height: 60 } : { top: 2, height: 96 };
  const lowerBand: Band = both ? { top: 64, height: 34 } : { top: 2, height: 96 };
  const up = placeBand(upper, upperBand, 0);
  const lo = placeBand(lower, lowerBand, upper.length);
  let u = 0;
  let l = 0;
  return categories.map((c) => (isUpper(c) ? up[u++] : lo[l++]));
}
