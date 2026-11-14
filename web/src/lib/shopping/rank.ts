import type { ProductCandidate } from "@/lib/domain/shopping";
import { MAX_OPTIONS } from "@/lib/domain/shopping";
import { colorMatch, isAnyGarmentNoun, isNounOf } from "./lexicon";
import type { ShopQuery } from "./query";
import type { ProductSearchRequest } from "./product-search";
import { fold, stem, words } from "./text";
import type { RawCandidate } from "./types";

// Puntaje y orden. Determinista y sin red. REGLA (DP-10): la afiliación no se lee en ningún punto de este archivo;
// los tests cambian `store.affiliate` y comprueban que el orden no se mueve.
//
// Una ficha se DESCARTA (no se rellena con algo mediocre) si: no es la prenda pedida, no tiene el color pedido (ni un
// tono parecido), supera el presupuesto, está agotada, o la tienda dice con claridad que no tiene la talla.
// Puntaje (0 a 1): prenda 0,50 · color exacto 0,25 / tono parecido 0,15 / tono cercano 0,08 · palabras clave hasta 0,15 ·
// presupuesto 0,05 · con stock 0,05 · talla confirmada 0,05. También se descarta lo infantil y lo del otro género cuando
// el encargo dice "mujer" u "hombre" (el lector no conoce a la persona: solo lo que dice la descripción).

export type Scored = {
  raw: RawCandidate;
  relevance: number;
  reason: string;
};

export type DropReason = "type" | "color" | "budget" | "stock" | "size" | "price" | "audience" | "weak";

const SIZE_TOKEN = /^(xxs|xs|s|m|l|xl|xxl|xxxl|\d{1,2}(\.5)?|unica|u)$/;

const KIDS = new Set(["nino", "nina", "ninos", "ninas", "bebe", "infantil", "kids", "junior", "baby"]);
const FEMALE = new Set(["mujer", "mujeres", "dama", "damas", "femenino", "femenina", "women"]);
const MALE = new Set(["hombre", "hombres", "varon", "caballero", "masculino", "men"]);

/** Descarta lo infantil y, si el encargo nombra un género, lo del otro. Sin mención, no filtra por género. */
function audienceOk(titleWordsRaw: string[], descWords: string[]): boolean {
  const asked = new Set(descWords);
  if (titleWordsRaw.some((t) => KIDS.has(t)) && ![...KIDS].some((k) => asked.has(k))) return false;
  const wantsF = descWords.some((w) => FEMALE.has(w));
  const wantsM = descWords.some((w) => MALE.has(w));
  if (wantsF && !wantsM && titleWordsRaw.some((t) => MALE.has(t))) return false;
  if (wantsM && !wantsF && titleWordsRaw.some((t) => FEMALE.has(t))) return false;
  return true;
}

// Sinónimos de palabras clave frecuentes (solo para puntuar; la razón nombra la palabra pedida).
const SYNONYMS: Record<string, string[]> = { estampado: ["print", "estampada", "floral", "flores", "animal print"], estampada: ["print", "estampado", "floral"], lino: ["linen"], cuero: ["leather"], midi: ["medio largo", "midi"] };

function wordIn(hayFolded: string, term: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s|es)?([^a-z0-9]|$)`).test(hayFolded);
}

function sizeTokens(label: string): string[] {
  return fold(label).split(/[^a-z0-9.]+/).filter(Boolean);
}

function sizeCheck(raw: RawCandidate, wanted: string | undefined): "ok" | "unknown" | "no" {
  if (!wanted) return "unknown";
  const w = fold(wanted).trim();
  const sizes = raw.sizes;
  if (!sizes || !sizes.some((s) => sizeTokens(s.label).some((t) => SIZE_TOKEN.test(t)))) return "unknown";
  const hit = sizes.filter((s) => sizeTokens(s.label).includes(w));
  if (hit.length === 0) return "no";
  return hit.some((s) => s.available !== false) ? "ok" : "no";
}

export function scoreCandidate(raw: RawCandidate, req: ProductSearchRequest, q: ShopQuery): { scored: Scored } | { dropped: DropReason } {
  const titleWords = words(raw.title).map(stem);
  const hay = ` ${fold(`${raw.title} ${raw.attrs}`)} `;

  // 1. La prenda pedida.
  const typeOk = q.head
    ? titleWords.includes(stem(q.head))
    : titleWords.some((t) => isNounOf(req.category, t)) && !titleWords.some((t) => isAnyGarmentNoun(t) && !isNounOf(req.category, t));
  if (!typeOk) return { dropped: "type" };

  // El género y lo infantil se miran también en el slug de la URL (a veces el título no lo dice).
  const slug = raw.url.replace(/^https:\/\/[^/]+/, "").replace(/[-_/]+/g, " ");
  if (!audienceOk(words(`${raw.title} ${slug}`), words(req.description))) return { dropped: "audience" };

  // 2. Duras: presupuesto, stock, talla.
  if (raw.price_clp <= 0) return { dropped: "price" };
  if (req.max_price_clp !== undefined && raw.price_clp > req.max_price_clp) return { dropped: "budget" };
  if (raw.available === false) return { dropped: "stock" };
  const size = sizeCheck(raw, req.size);
  if (size === "no") return { dropped: "size" };

  // 3. Color pedido: el mismo o uno parecido; si no, se descarta.
  let color: ReturnType<typeof colorMatch> = { level: "none" };
  if (req.color) {
    color = colorMatch(req.color, hay);
    if (color.level === "none") return { dropped: "color" };
  }

  let score = 0.5;
  const matched: string[] = [];
  const noun = q.head ?? words(req.description).find((w) => isNounOf(req.category, w));
  if (noun) matched.push(fold(noun));
  if (color.level === "exact") {
    score += 0.25;
    matched.push(`color ${fold(req.color ?? "")}`);
  } else if (color.level === "family") {
    score += 0.15;
    matched.push(`un tono parecido (${color.found})`);
  } else if (color.level === "near") {
    score += 0.08;
    matched.push(`un tono cercano (${color.found})`);
  }
  if (q.keywords.length) {
    const hits = q.keywords.filter((k) => [k, ...(SYNONYMS[k] ?? [])].some((v) => wordIn(hay, v)));
    // Pidió más que la prenda (palabras clave) y sin color: si no calza ninguna, es relleno mediocre y se descarta (P-08).
    if (hits.length === 0 && !req.color) return { dropped: "weak" };
    score += 0.15 * (hits.length / q.keywords.length);
    if (hits.length) matched.push(hits.slice(0, 2).join(" y "));
  }
  if (req.max_price_clp !== undefined) {
    score += 0.05;
    matched.push("dentro de tu presupuesto");
  }
  if (raw.available === true) score += 0.05;
  if (size === "ok") {
    score += 0.05;
    matched.push(`talla ${fold(req.size ?? "")} disponible`);
  }

  const tail = req.size && size === "unknown" ? " La talla no se pudo confirmar: revísala en la tienda." : "";
  const reason = `Calza con lo que pediste: ${matched.join(", ")}.${tail}`.slice(0, 200);
  return { scored: { raw, relevance: Math.round(Math.min(1, score) * 1000) / 1000, reason } };
}

/** Orden: relevancia, luego precio, luego tienda y título. La afiliación NO entra. */
export function compareScored(a: Scored, b: Scored): number {
  return (
    b.relevance - a.relevance ||
    a.raw.price_clp - b.raw.price_clp ||
    a.raw.store.name.localeCompare(b.raw.store.name) ||
    a.raw.title.localeCompare(b.raw.title)
  );
}

/**
 * Hasta `max` opciones, de tiendas distintas si se puede: primero la mejor de cada tienda (en orden de puntaje) y, si
 * faltan, las siguientes mejores. El resultado queda ordenado por puntaje. Sin repetir el mismo producto.
 */
export function pickDiverse(scored: Scored[], max: number = MAX_OPTIONS): Scored[] {
  const sorted = [...scored].sort(compareScored);
  const urls = new Set<string>();
  const unique = sorted.filter((s) => (urls.has(s.raw.url) ? false : (urls.add(s.raw.url), true)));
  const picked: Scored[] = [];
  const stores = new Set<string>();
  for (const s of unique) {
    if (picked.length === max) break;
    if (stores.has(s.raw.store.domain)) continue;
    stores.add(s.raw.store.domain);
    picked.push(s);
  }
  for (const s of unique) {
    if (picked.length === max) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked.sort(compareScored);
}

export function toCandidate(s: Scored, seenAt: string): ProductCandidate {
  const r = s.raw;
  return {
    store_name: r.store.name,
    title: r.title,
    price_clp: r.price_clp,
    seen_at: seenAt,
    url: r.url,
    image_url: r.image_url,
    image_cutout_url: null,
    affiliate: r.store.affiliate, // solo para mostrar la insignia
    in_stock: r.available,
    reason: s.reason,
    relevance: s.relevance,
  };
}
