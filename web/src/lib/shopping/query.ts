import type { ProductSearchRequest } from "./product-search";
import { isAnyGarmentNoun, isNounOf } from "./lexicon";
import { STOPWORDS, fold, stem, words } from "./text";

// Lo que SALE a la red. Es la única función que decide qué texto viaja hacia una tienda, y por diseño solo puede
// contener palabras de la descripción de la PIEZA y su color. El presupuesto y la talla no viajan: se filtran
// aquí, localmente. Ningún dato de la persona llega a este módulo (DT-18): `ProductSearchRequest` no los tiene.

export type ShopQuery = {
  /** Texto de la consulta para tiendas con búsqueda de varias palabras (Shopify). */
  text: string;
  /** Una sola palabra, la pieza, para tiendas que exigen todas las palabras (VTEX). */
  term: string;
  /** Sustantivo de la prenda pedida (p. ej. "sandalia"), o null. */
  head: string | null;
  /** Palabras de la descripción sin la prenda ni el color: sirven para puntuar. */
  keywords: string[];
};

const MAX_WORDS = 4;

export function buildQuery(req: ProductSearchRequest): ShopQuery | null {
  const tokens: string[] = [];
  const seen = new Set<string>();
  for (const w of words(req.description)) {
    if (STOPWORDS.has(w) || /^\d+$/.test(w) || w.length > 24) continue;
    const k = stem(w);
    if (seen.has(k)) continue;
    seen.add(k);
    tokens.push(w);
  }
  const head = tokens.find((t) => isNounOf(req.category, t)) ?? tokens.find((t) => isAnyGarmentNoun(t)) ?? null;
  const colorWords = req.color ? words(req.color).filter((w) => !STOPWORDS.has(w)).slice(0, 2) : [];

  const ordered = [...(head ? [head] : []), ...tokens.filter((t) => t !== head)].slice(0, MAX_WORDS);
  for (const c of colorWords) if (!ordered.map(stem).includes(stem(c))) ordered.push(c);
  const text = ordered.slice(0, MAX_WORDS + 2).join(" ");
  if (!text) return null;
  const colorStems = new Set(colorWords.map(stem));
  const keywords = tokens.filter((t) => t !== head && !colorStems.has(stem(t)));
  return { text, term: head ?? ordered[0], head, keywords: keywords.map(fold) };
}
