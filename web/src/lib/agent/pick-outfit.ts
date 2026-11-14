import type { ClosetItem } from "./tools";
import type { GarmentCategory, Weather } from "@/lib/domain/types";

type Pickable = Pick<ClosetItem, "id" | "name" | "category" | "formality" | "favorite">;

/** Elige una prenda de la lista de forma determinista según la semilla. */
function pick<T>(items: T[], seed: number): T | undefined {
  return items.length ? items[seed % items.length] : undefined;
}

/**
 * Selección determinista de un look válido para el agente simulado.
 * Devuelve null si el clóset no permite [arriba + abajo] o [vestido] más una segunda prenda.
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

  const useDress = dress && (!(top && bottom) || seed % 2 === 0);
  const base = useDress ? [dress] : top && bottom ? [top, bottom] : [];
  if (base.length === 0) return null;

  const extras = [outerwear, shoes, bag].filter((g): g is Pickable => Boolean(g));
  const items = [...base, ...extras];
  return items.length >= 2 ? items : null;
}
