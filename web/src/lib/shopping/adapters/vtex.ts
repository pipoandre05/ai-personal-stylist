import { plainText } from "../text";
import type { RawCandidate, SizeInfo, Store } from "../types";
import { clpPrice, imageUrl, isRecord, productUrl } from "./common";

// Tiendas sobre VTEX: catálogo público de búsqueda (`/api/catalog_system/pub/products/search`). La búsqueda de texto
// de VTEX exige que aparezcan todas las palabras, así que se consulta con UNA palabra (la pieza) y el filtro fino
// (color, presupuesto, talla) se hace después, aquí, sobre los atributos.

export const VTEX_PATH = "/api/catalog_system/pub/products/search";
const MAX_ITEMS_VTEX = 8;

export function vtexSearchUrl(domain: string, term: string): string {
  const p = new URLSearchParams();
  p.set("ft", term);
  p.set("_from", "0");
  p.set("_to", String(MAX_ITEMS_VTEX - 1));
  // URLSearchParams usa "+" para el espacio; VTEX responde 400 a eso. Con una sola palabra no aplica, pero se normaliza.
  return `https://${domain}${VTEX_PATH}?${p.toString().replace(/\+/g, "%20")}`;
}

export function vtexRobotsPath(term: string): string {
  return `${VTEX_PATH}?ft=${encodeURIComponent(term)}`;
}

const firstString = (v: unknown, max: number): string => (Array.isArray(v) ? plainText(v[0], max) : plainText(v, max));

/** Devuelve las fichas, o `null` si la respuesta no tiene la forma de VTEX (no es esa plataforma). */
export function parseVtex(text: string, store: Store): RawCandidate[] | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(json)) return null;
  // Una lista vacía es válida en VTEX, pero también la devuelven otros sistemas: se acepta solo si las fichas tienen la forma.
  if (json.length && !json.slice(0, 3).every((p) => isRecord(p) && Array.isArray(p.items) && ("productName" in p || "linkText" in p))) return null;

  const out: RawCandidate[] = [];
  for (const p of json.slice(0, MAX_ITEMS_VTEX)) {
    if (!isRecord(p)) continue;
    const title = plainText(p.productName, 140);
    const items = Array.isArray(p.items) ? p.items.filter(isRecord).slice(0, 40) : [];
    if (!title || items.length === 0) continue;

    // Precio: el más bajo entre las variantes con stock; si no hay stock, el más bajo y `available: false`.
    const offers: { price: number; qty: number }[] = [];
    const sizes: SizeInfo[] = [];
    let image: string | null = null;
    const colors: string[] = [];
    for (const it of items) {
      const sellers = Array.isArray(it.sellers) ? it.sellers.filter(isRecord) : [];
      let itemQty = 0;
      for (const s of sellers) {
        const o = s.commertialOffer;
        if (!isRecord(o)) continue;
        const price = clpPrice(o.Price);
        const qty = typeof o.AvailableQuantity === "number" ? o.AvailableQuantity : 0;
        if (price !== null) {
          offers.push({ price, qty });
          itemQty += qty;
        }
      }
      const size = firstString(it.Talla, 30);
      if (size) sizes.push({ label: size, available: itemQty > 0 });
      const color = firstString(it.Color, 40);
      if (color) colors.push(color);
      if (!image && Array.isArray(it.images)) image = imageUrl(isRecord(it.images[0]) ? it.images[0].imageUrl : undefined);
    }
    if (offers.length === 0) continue;
    const inStock = offers.filter((o) => o.qty > 0);
    const pool = inStock.length ? inStock : offers;
    const price = Math.min(...pool.map((o) => o.price));

    const linkText = typeof p.linkText === "string" && /^[a-z0-9_.-]{1,200}$/i.test(p.linkText) ? p.linkText : null;
    const url = productUrl(store.domain, p.link) ?? (linkText ? productUrl(store.domain, `/${linkText}/p`) : null);
    if (!url) continue;

    const cats = Array.isArray(p.categories) ? p.categories.filter((c): c is string => typeof c === "string").slice(0, 6).map((c) => plainText(c.replace(/\//g, " "), 80)) : [];
    out.push({
      store,
      title,
      price_clp: price,
      url,
      image_url: image,
      available: inStock.length > 0,
      sizes: sizes.length ? sizes : null,
      attrs: [plainText(p.brand, 40), ...cats, ...colors].filter(Boolean).join(" "),
    });
  }
  return out;
}
