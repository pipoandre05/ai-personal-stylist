import type { ClosetItem } from "./tools";
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
