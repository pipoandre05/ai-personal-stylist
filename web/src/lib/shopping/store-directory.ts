import type { GarmentCategory } from "@/lib/domain/types";
import type { Store } from "./types";

// Directorio de tiendas: qué vende cada una y para quién. Sirve para dos cosas:
//   1. Elegir a qué tiendas consultar en cada búsqueda (`selectStores`): no se le pregunta por vestidos a una zapatería.
//   2. Darle al asesor una idea de qué se puede encontrar (`STORE_DIRECTORY_PROMPT`, dentro del prompt de sistema).
// Fuente: los directorios de Felipe (hombre y mujer, noviembre 2026). Solo están las tiendas que el lector pudo leer el
// 2026-11-14 (Shopify o VTEX, `robots.txt` lo permite, precios en CLP). Ver docs/tecnico/lector-de-tiendas.md.
// Las marcadas `unverified` no venían en los directorios: su clasificación es de la sesión y está por confirmar con Felipe.

export type Audience = "mujer" | "hombre";

export type StoreProfile = {
  domain: string;
  name: string;
  /** Para quién vende. `unisex` = ambos. */
  audience: Audience | "unisex";
  /** Categorías de prenda que tiene sentido buscarle. */
  sells: readonly GarmentCategory[];
  /** Estilo y especialidad, en una frase corta (texto del directorio). */
  focus: string;
  unverified?: true;
};

const ALL: readonly GarmentCategory[] = ["top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"];
const CLOTHES: readonly GarmentCategory[] = ["top", "bottom", "outerwear"];
const WOMENSWEAR: readonly GarmentCategory[] = ["top", "bottom", "dress", "outerwear"];

/** El orden es la prioridad cuando hay más tiendas elegibles que cupos. */
export const STORE_DIRECTORY: readonly StoreProfile[] = [
  { domain: "www.wildlama.com", name: "Wild Lama", audience: "unisex", sells: [...CLOTHES, "accessory"], focus: "casual, básicos y lifestyle con foco sustentable" },
  { domain: "froens.cl", name: "Froens", audience: "unisex", sells: [...CLOTHES, "dress"], focus: "casual, tejidos y lino" },
  { domain: "www.trial.cl", name: "Trial", audience: "hombre", sells: [...CLOTHES, "shoes", "accessory"], focus: "formal masculino: trajes, sastrería, camisas y pantalones; smart casual" },
  { domain: "cl.tommy.com", name: "Tommy Hilfiger", audience: "unisex", sells: ALL, focus: "clásico americano, preppy y smart casual" },
  { domain: "www.calvinklein.cl", name: "Calvin Klein", audience: "unisex", sells: ALL, focus: "minimalista, formal y casual contemporáneo" },
  { domain: "www.dockers.cl", name: "Dockers", audience: "hombre", sells: [...CLOTHES, "accessory"], focus: "chinos, pantalones, camisas y casual de oficina" },
  { domain: "killsyou.cl", name: "Kills You", audience: "mujer", sells: WOMENSWEAR, focus: "diseño chileno: vestidos, sweaters y prendas con personalidad" },
  { domain: "joandfire.cl", name: "Jo & Fire", audience: "mujer", sells: WOMENSWEAR, focus: "lino, cashmere y lana; vestuario atemporal" },
  { domain: "muth.cl", name: "Muth Boutique", audience: "mujer", sells: WOMENSWEAR, focus: "diseño de autor, estampados y siluetas diferenciadas; ocasiones especiales" },
  { domain: "karyncoo.com", name: "Karyn Coo", audience: "mujer", sells: WOMENSWEAR, focus: "diseño femenino y prendas de autor" },
  { domain: "lamura.cl", name: "La Mura", audience: "mujer", sells: WOMENSWEAR, focus: "vestuario femenino atemporal en fibras naturales" },
  { domain: "almabar.cl", name: "Almabar", audience: "mujer", sells: [...CLOTHES, "bag", "accessory"], focus: "cuero, gamuza y fibras naturales; prendas premium" },
  { domain: "www.guante.cl", name: "Guante", audience: "unisex", sells: ["shoes", "bag", "accessory"], focus: "calzado y accesorios de cuero" },
  { domain: "www.hushpuppies.cl", name: "Hush Puppies", audience: "unisex", sells: ["shoes", "bag", "accessory"], focus: "calzado casual y de vestir", unverified: true },
  { domain: "www.bestias.cl", name: "Bestias", audience: "unisex", sells: ["shoes"], focus: "calzado de diseño independiente" },
  { domain: "www.vans.cl", name: "Vans", audience: "unisex", sells: ["shoes", "top", "outerwear", "accessory"], focus: "zapatillas, skate y urbano" },
  { domain: "www.fashionspark.com", name: "Fashion's Park", audience: "unisex", sells: ALL, focus: "moda y básicos económicos" },
  { domain: "www.ellus.cl", name: "Ellus", audience: "unisex", sells: CLOTHES, focus: "denim y casual premium" },
  { domain: "savillerow.cl", name: "Saville Row", audience: "hombre", sells: [...CLOTHES, "accessory"], focus: "formal y camisería masculina", unverified: true },
  { domain: "www.rkflife.com", name: "Rockford", audience: "unisex", sells: [...CLOTHES, "shoes", "accessory"], focus: "casual y outdoor", unverified: true },
  { domain: "www.columbiachile.cl", name: "Columbia", audience: "unisex", sells: [...CLOTHES, "shoes", "accessory"], focus: "outdoor y vestuario funcional" },
  { domain: "www.lippioutdoor.com", name: "Lippi", audience: "unisex", sells: [...CLOTHES, "shoes", "accessory"], focus: "outdoor, trekking y lifestyle" },
  { domain: "www.hakahonu.cl", name: "Haka Honu", audience: "unisex", sells: [...CLOTHES, "accessory"], focus: "surf, outdoor y casual" },
  { domain: "www.atakamaoutdoor.cl", name: "Atakama Outdoor", audience: "unisex", sells: CLOTHES, focus: "outdoor y vestuario funcional" },
  { domain: "www.merrell.cl", name: "Merrell", audience: "unisex", sells: ["shoes", "outerwear"], focus: "calzado y vestuario outdoor" },
  { domain: "www.oneill.cl", name: "O'Neill", audience: "unisex", sells: CLOTHES, focus: "surf y casual" },
  { domain: "www.underarmour.cl", name: "Under Armour", audience: "unisex", sells: [...CLOTHES, "shoes", "accessory"], focus: "entrenamiento y deportivo" },
  { domain: "www.reebok.cl", name: "Reebok", audience: "unisex", sells: ["top", "bottom", "shoes"], focus: "deportivo y retro" },
  { domain: "www.bold.cl", name: "Bold", audience: "unisex", sells: ["shoes", "top", "outerwear", "accessory"], focus: "zapatillas y streetwear multimarca", unverified: true },
  { domain: "shopcaterpillar.cl", name: "Caterpillar", audience: "unisex", sells: ["shoes", "outerwear"], focus: "workwear, botas y casual", unverified: true },
  { domain: "www.vistetelocal.cl", name: "Vístete Local", audience: "mujer", sells: [...WOMENSWEAR, "bag", "accessory"], focus: "diseño de autor chileno, vestuario y accesorios" },
  { domain: "www.ciervastore.com", name: "Cierva Design", audience: "mujer", sells: ["top", "bottom", "dress"], focus: "diseño independiente femenino" },
  { domain: "mujeron.cl", name: "Mujerón", audience: "mujer", sells: ["top", "bottom", "dress"], focus: "tallas extendidas, jeans y marcas curvy" },
  { domain: "www.ozare.cl", name: "Ozare", audience: "mujer", sells: WOMENSWEAR, focus: "moda femenina en tallas extendidas" },
  { domain: "www.lounge.cl", name: "Lounge", audience: "mujer", sells: ["top", "bottom", "dress", "bag", "accessory"], focus: "pijamas, bikinis, vestuario y accesorios" },
  { domain: "pilgrim.cl", name: "Pilgrim", audience: "unisex", sells: ["accessory"], focus: "joyería y accesorios", unverified: true },
  { domain: "www.monarch.cl", name: "Monarch", audience: "unisex", sells: ["accessory"], focus: "ropa interior, básicos, pijamas y calcetería" },
  { domain: "www.leonisa.cl", name: "Leonisa", audience: "mujer", sells: ["accessory"], focus: "lencería y ropa interior" },
  { domain: "www.caffarena.cl", name: "Caffarena", audience: "mujer", sells: ["accessory"], focus: "pantys, ropa interior y básicos" },
  { domain: "www.intime.cl", name: "Intime", audience: "mujer", sells: ["accessory"], focus: "lencería, ropa interior y pijamas" },
];

const bare = (domain: string) => domain.toLowerCase().replace(/^www\./, "");
const BY_DOMAIN = new Map(STORE_DIRECTORY.map((p) => [bare(p.domain), p]));

export function storeProfile(domain: string): StoreProfile | null {
  return BY_DOMAIN.get(bare(domain)) ?? null;
}

/** Las tiendas del directorio como lista del lector (`SHOP_STORES=directorio`). Ninguna tiene afiliación. */
export function directoryStores(): Store[] {
  return STORE_DIRECTORY.map((p) => ({ domain: p.domain, name: p.name, affiliate: false }));
}

/** Cuántas tiendas se consultan como máximo en una búsqueda. */
export const MAX_STORES_PER_SEARCH = 12;

/**
 * Elige a qué tiendas consultar: las que venden esa categoría y, si se sabe para quién es, las que le venden a esa
 * persona. Una tienda fuera del directorio no se descarta (no se sabe qué vende), pero va después de las conocidas.
 * La afiliación no participa (DP-10). Mantiene el orden del directorio y luego el de la configuración.
 */
export function selectStores(
  stores: readonly Store[],
  want: { category: GarmentCategory; audience?: Audience | null },
  max = MAX_STORES_PER_SEARCH,
): Store[] {
  const known: { store: Store; rank: number }[] = [];
  const unknown: Store[] = [];
  for (const store of stores) {
    const p = storeProfile(store.domain);
    if (!p) {
      unknown.push(store);
      continue;
    }
    if (!p.sells.includes(want.category)) continue;
    if (want.audience && p.audience !== "unisex" && p.audience !== want.audience) continue;
    known.push({ store, rank: STORE_DIRECTORY.indexOf(p) });
  }
  known.sort((a, b) => a.rank - b.rank);
  return [...known.map((k) => k.store), ...unknown].slice(0, max);
}

const AUDIENCE_LABEL: Record<StoreProfile["audience"], string> = { mujer: "mujer", hombre: "hombre", unisex: "mujer y hombre" };

/** Bloque ESTÁTICO para el prompt de sistema (no cambia por persona ni por día: no invalida el cache). */
export const STORE_DIRECTORY_PROMPT = STORE_DIRECTORY.map((p) => `- ${p.name} (${AUDIENCE_LABEL[p.audience]}): ${p.focus}.`).join("\n");
