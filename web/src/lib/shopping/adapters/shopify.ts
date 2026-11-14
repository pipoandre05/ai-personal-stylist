import { plainText } from "../text";
import type { RawCandidate, SizeInfo, Store } from "../types";
import { MAX_ITEMS_PER_STORE, clpPrice, imageUrl, isRecord, productUrl } from "./common";

// Tiendas sobre Shopify: sugerencias de búsqueda del propio sitio (`/search/suggest.json`), que devuelven fichas
// estructuradas. Solo se leen campos con nombre; el HTML de la descripción (`body`) no se usa.

export const SHOPIFY_PATH = "/search/suggest.json";

/** Ruta y query de la búsqueda. La consulta lleva solo palabras de la pieza (ver query.ts). */
export function shopifySearchUrl(domain: string, query: string): string {
  const p = new URLSearchParams();
  p.set("q", query);
  p.set("resources[type]", "product");
  p.set("resources[limit]", String(MAX_ITEMS_PER_STORE));
  p.set("resources[options][unavailable_products]", "last");
  return `https://${domain}${SHOPIFY_PATH}?${p.toString()}`;
}

/** Ruta + query tal como se compara con `robots.txt`. */
export function shopifyRobotsPath(query: string): string {
  return `${SHOPIFY_PATH}?q=${encodeURIComponent(query)}&resources[type]=product`;
}

function sizesOf(variants: unknown): SizeInfo[] | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const out: SizeInfo[] = [];
  for (const v of variants.slice(0, 40)) {
    if (!isRecord(v)) continue;
    const label = plainText(v.title, 60);
    if (label) out.push({ label, available: typeof v.available === "boolean" ? v.available : null });
  }
  return out.length ? out : null;
}

/** Devuelve las fichas, o `null` si la respuesta no tiene la forma de Shopify (no es esa plataforma). */
export function parseShopify(text: string, store: Store): RawCandidate[] | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(json) || !isRecord(json.resources) || !isRecord(json.resources.results)) return null;
  const products = json.resources.results.products;
  if (!Array.isArray(products)) return null;

  const out: RawCandidate[] = [];
  for (const p of products.slice(0, MAX_ITEMS_PER_STORE)) {
    if (!isRecord(p)) continue;
    const title = plainText(p.title, 140);
    const price = clpPrice(p.price);
    const url = productUrl(store.domain, p.url);
    if (!title || price === null || !url) continue;
    const tags = Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === "string").slice(0, 40).map((t) => plainText(t, 40)) : [];
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const featured = isRecord(p.featured_image) ? p.featured_image.url : undefined;
    out.push({
      store,
      title,
      price_clp: price,
      url,
      image_url: imageUrl(p.image) ?? imageUrl(featured),
      available: typeof p.available === "boolean" ? p.available : null,
      sizes: sizesOf(variants),
      attrs: [plainText(p.type, 80), ...tags, ...variants.slice(0, 40).map((v) => (isRecord(v) ? plainText(v.title, 60) : ""))].filter(Boolean).join(" "),
    });
  }
  return out;
}
