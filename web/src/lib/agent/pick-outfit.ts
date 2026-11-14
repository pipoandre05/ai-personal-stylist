import type { ClosetItem } from "./tools";
import { MIN_PAIR_DIFFERENCE, lookDifference, validateOutfitComposition } from "@/lib/domain/outfit-rules";
import { type GarmentCategory, type MissingPiece, type Weather } from "@/lib/domain/types";

type Pickable = Pick<ClosetItem, "id" | "name" | "category" | "formality" | "favorite">;

/** Elige una prenda de la lista de forma determinista según la semilla. */
function pick<T>(items: T[], seed: number): T | undefined {
  return items.length ? items[seed % items.length] : undefined;
}

/**
 * Selección determinista de un look válido para el agente simulado.
 * Devuelve null si el clóset no permite [arriba + abajo] o [vestido] más una segunda prenda.
 * Si hay varias bases posibles (vestido y arriba+abajo) prueba la preferida por la semilla y, si no alcanza,
 * la otra: un clóset con un look válido nunca devuelve null.
 */
export function pickMockOutfit(
  closet: Pickable[],
  seed: number,
  weather: Pick<Weather, "temp_min"> | null,
): Pickable[] | null {
  const by = (c: GarmentCategory) => closet.filter((g) => g.category === c);
  const cold = weather !== null && weather.temp_min < 14;
  const shoes = pick(by("shoes"), seed);
  const outerwear = cold ? pick(by("outerwear"), seed) : undefined;
  const bag = pick(by("bag"), seed);

  const dress = pick(by("dress"), seed);
  const top = pick(by("top"), seed);
  const bottom = pick(by("bottom"), seed >> 1);

  const dressBase = dress ? [dress] : null;
  const pairBase = top && bottom ? [top, bottom] : null;
  const bases = (seed % 2 === 0 ? [dressBase, pairBase] : [pairBase, dressBase]).filter((b): b is Pickable[] => b !== null);

  const extras = [outerwear, shoes, bag].filter((g): g is Pickable => Boolean(g));
  for (const base of bases) {
    const items = [...base, ...extras];
    if (items.length >= 2) return items;
  }
  return null;
}

export type MockLookPlan =
  | { kind: "outfit"; items: Pickable[] }
  /** Clóset sin prendas listas: se piden fotos. */
  | { kind: "empty" }
  /** Falta una categoría base: se explica en texto y se describe la prenda; no hay tarjeta. */
  | { kind: "missing"; piece: MissingPiece };

/** Qué prenda falta para poder armar un look, según lo que ya hay. Pura. */
export function describeMissingPiece(closet: Pickable[]): MissingPiece {
  const has = (c: GarmentCategory) => closet.find((g) => g.category === c);
  const dress = has("dress");
  const top = has("top");
  const bottom = has("bottom");
  const lower = (g: Pickable) => g.name.toLowerCase();

  if (!dress && top && !bottom) {
    return {
      category: "bottom",
      description: `Un pantalón o una falda de corte simple en un tono neutro, que combine con tu ${lower(top)}`,
      why: "Con una parte de abajo puedo armarte looks completos con las partes de arriba que ya tienes.",
    };
  }
  if (!dress && bottom && !top) {
    return {
      category: "top",
      description: `Una polera, camisa o blusa lisa en un tono que combine con tu ${lower(bottom)}`,
      why: "Con una parte de arriba puedo armarte looks completos con las partes de abajo que ya tienes.",
    };
  }
  if (!dress && !top && !bottom) {
    return {
      category: "top",
      description: "Una parte de arriba y una de abajo, o un vestido, de colores neutros que se puedan combinar entre sí",
      why: "Esa base es lo que me permite armar un look; el calzado y los accesorios se suman encima.",
    };
  }
  // Hay base (vestido o arriba + abajo) pero no alcanza para un look de al menos dos prendas.
  return {
    category: "shoes",
    description: dress ? `Calzado cómodo y neutro que acompañe tu ${lower(dress)}` : "Calzado cómodo y neutro para completar el look",
    why: "Con una segunda prenda puedo cerrar el look; el calzado es lo que más se nota.",
  };
}

/**
 * Plan del asesor simulado para "¿qué me pongo?": un look si el clóset alcanza, pedir fotos si está vacío,
 * o explicar qué categoría base falta. `formal` (eventos) prefiere las prendas más formales.
 */
export function planMockLook(
  closet: Pickable[],
  seed: number,
  weather: Pick<Weather, "temp_min"> | null,
  opts: { formal?: boolean } = {},
): MockLookPlan {
  if (closet.length === 0) return { kind: "empty" };
  const pool = opts.formal ? [...closet].sort((a, b) => b.formality - a.formality || a.id.localeCompare(b.id)) : closet;
  // Con `formal` la semilla 0 toma la prenda más formal de cada categoría.
  const items = pickMockOutfit(pool, opts.formal ? 0 : seed, weather);
  if (items) return { kind: "outfit", items };
  return { kind: "missing", piece: describeMissingPiece(closet) };
}

const MISSING_NOUN: Record<GarmentCategory, string> = {
  top: "una parte de arriba",
  bottom: "una parte de abajo",
  dress: "un vestido",
  outerwear: "un abrigo o una chaqueta",
  shoes: "calzado",
  bag: "un bolso",
  accessory: "un accesorio",
};

/** Texto en que el asesor simulado explica la prenda que falta (sin tarjeta, sin compra). */
export function missingPieceText(piece: MissingPiece): string {
  const label = MISSING_NOUN[piece.category];
  return `Con lo que tienes hoy todavía no alcanzo a armar un look completo: te falta ${label}. Lo que más te serviría es ${piece.description.charAt(0).toLowerCase()}${piece.description.slice(1)}. ${piece.why} Si ya la tienes, mándame una foto y lo armamos.`;
}

export const EMPTY_CLOSET_TEXT =
  "Todavía no tienes prendas en tu clóset, así que no puedo armarte un look. Mándame fotos de 3 a 5 prendas, una por foto, y lo armamos.";

/** Título y ocasión del look según lo que pidió la persona. */
export function isFormalRequest(text: string): boolean {
  return /\b(evento|matrimonio|boda|fiesta|cena|gala|ceremonia|graduaci[oó]n|reuni[oó]n)\b/i.test(text);
}

// --- Contrato v2: dos looks, pieza faltante por formalidad y ajustes (asesor simulado) ---


type PickableWithColors = Pickable & Partial<Pick<ClosetItem, "colors" | "subcategory">>;

export type MockLooksPlan =
  | { kind: "empty" }
  /** Falta una categoría base: no hay look posible. */
  | { kind: "missing_base"; piece: MissingPiece }
  /** Un solo look: con pieza faltante (D-04: se muestra el mejor que se puede armar) o porque el clóset no da dos distintos. */
  | { kind: "single"; items: Pickable[]; missing_piece: MissingPiece | null }
  /** Dos looks para elegir que difieren en al menos dos prendas. */
  | { kind: "pair"; seguro: Pickable[]; atrevido: Pickable[] };

export const SHOES_MISSING: MissingPiece = {
  category: "shoes",
  description: "Sandalia o zapato de taco ancho en tonos tierra",
  why: "Tu calzado actual es muy casual para este plan, y un taco fino se entierra en el pasto. El taco ancho te da firmeza y se ve elegante.",
};

/** ¿El calzado del clóset no sirve para el plan? Sin calzado, o todo a más de un nivel de la formalidad del marco (D-03). */
export function shoesIssue(closet: Pickable[], targetFormality: number | null): boolean {
  const shoes = closet.filter((g) => g.category === "shoes");
  if (shoes.length === 0) return true;
  if (targetFormality === null) return false;
  return shoes.every((g) => g.formality < targetFormality - 1);
}

/**
 * Plan del asesor simulado para un marco con evento o con día normal: dos looks (seguro y atrevido) si el clóset da dos
 * que difieran en al menos dos prendas; uno solo con la pieza faltante (calzado, solo en eventos) si hace falta;
 * `exclude` saca una categoría del clóset (camino inverso: la persona quiere comprar justo eso).
 */
export function planMockLooks(
  closet: Pickable[],
  seed: number,
  weather: Pick<Weather, "temp_min"> | null,
  opts: { formal?: boolean; targetFormality?: number | null; event?: boolean; exclude?: GarmentCategory } = {},
): MockLooksPlan {
  const base = opts.exclude ? closet.filter((g) => g.category !== opts.exclude) : closet;
  if (closet.length === 0) return { kind: "empty" };
  const pool = opts.formal ? [...base].sort((a, b) => b.formality - a.formality || a.id.localeCompare(b.id)) : base;
  const first = pickMockOutfit(pool, opts.formal ? 0 : seed, weather);
  if (!first) {
    // Sin base posible: en el camino inverso el pedido sigue en pie (se busca sin look); si no, se dice qué falta.
    return opts.exclude ? { kind: "single", items: [], missing_piece: null } : { kind: "missing_base", piece: describeMissingPiece(closet) };
  }

  const target = opts.targetFormality ?? null;
  const shoeProblem = opts.event === true && shoesIssue(closet, target);
  if (shoeProblem) {
    const items = first.filter((g) => g.category !== "shoes");
    return { kind: "single", items: items.length >= 2 ? items : first, missing_piece: SHOES_MISSING };
  }
  if (opts.exclude) return { kind: "single", items: first, missing_piece: null };

  for (let k = 1; k <= 24; k++) {
    const other = pickMockOutfit(pool, (opts.formal ? 0 : seed) + k, weather);
    if (
      other &&
      validateOutfitComposition(other).ok &&
      lookDifference(
        first.map((g) => g.id),
        other.map((g) => g.id),
      ) >= MIN_PAIR_DIFFERENCE
    ) {
      return { kind: "pair", seguro: first, atrevido: other };
    }
  }
  return { kind: "single", items: first, missing_piece: null };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Título corto del look a partir de sus prendas principales. */
export function lookTitle(items: Pick<Pickable, "name" | "category">[]): string {
  const main = items.filter((g) => g.category === "top" || g.category === "bottom" || g.category === "dress");
  const names = (main.length ? main : items).slice(0, 2).map((g) => g.name.toLowerCase());
  return cap(names.join(" con ")).slice(0, 70);
}

export type RefineChange = "more_formal" | "less_formal" | "other_color" | "warmer" | "lighter" | "swap_garment" | "drop_garment";

/**
 * Nuevo look para un ajuste, o null si el clóset no permite uno válido distinto del anterior. Pura y determinista:
 * es lo que hace el asesor simulado cuando la persona toca un botón de refinamiento.
 */
export function refineMockLook(closet: PickableWithColors[], prevIds: string[], change: RefineChange, garmentId?: string): string[] | null {
  const byId = new Map(closet.map((g) => [g.id, g]));
  const prev = prevIds.map((id) => byId.get(id)).filter((g): g is PickableWithColors => Boolean(g));
  if (prev.length === 0) return null;
  const inUse = new Set(prev.map((g) => g.id));
  const sameCat = (c: GarmentCategory) => closet.filter((g) => g.category === c).sort((a, b) => a.id.localeCompare(b.id));
  let next: PickableWithColors[] | null = null;

  const swapEach = (better: (cand: PickableWithColors, cur: PickableWithColors) => boolean, rank: (a: PickableWithColors, b: PickableWithColors) => number) => {
    const out = prev.map((cur) => {
      const best = sameCat(cur.category).filter((c) => c.id === cur.id || (!inUse.has(c.id) && better(c, cur))).sort(rank)[0];
      return best ?? cur;
    });
    return out.some((g, i) => g.id !== prev[i].id) ? out : null;
  };

  switch (change) {
    case "more_formal":
      next = swapEach((c, cur) => c.formality > cur.formality, (a, b) => b.formality - a.formality || a.id.localeCompare(b.id));
      break;
    case "less_formal":
      next = swapEach((c, cur) => c.formality < cur.formality, (a, b) => a.formality - b.formality || a.id.localeCompare(b.id));
      break;
    case "other_color": {
      const used = new Set(prev.flatMap((g) => g.colors ?? []));
      const target = prev.find((g) => g.category === "dress") ?? prev.find((g) => g.category === "top") ?? prev[0];
      const options = sameCat(target.category).filter((c) => !inUse.has(c.id));
      const other = options.find((c) => (c.colors ?? []).every((x) => !used.has(x))) ?? options[0];
      if (other) next = prev.map((g) => (g.id === target.id ? other : g));
      break;
    }
    case "warmer": {
      const coat = sameCat("outerwear").find((c) => !inUse.has(c.id));
      if (coat && !prev.some((g) => g.category === "outerwear")) next = [...prev, coat];
      break;
    }
    case "lighter":
      if (prev.some((g) => g.category === "outerwear")) next = prev.filter((g) => g.category !== "outerwear");
      break;
    case "swap_garment": {
      const cur = prev.find((g) => g.id === garmentId);
      const other = cur ? sameCat(cur.category).find((c) => !inUse.has(c.id)) : undefined;
      if (cur && other) next = prev.map((g) => (g.id === cur.id ? other : g));
      break;
    }
    case "drop_garment":
      if (prev.some((g) => g.id === garmentId)) next = prev.filter((g) => g.id !== garmentId);
      break;
  }
  if (!next || !validateOutfitComposition(next).ok) return null;
  return next.map((g) => g.id);
}
