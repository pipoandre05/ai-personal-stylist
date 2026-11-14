import type { GarmentCategory } from "@/lib/domain/types";
import type { ProductCandidate } from "@/lib/domain/shopping";

// Punto de extensión de la búsqueda de opciones de compra (C-4).
//
// `ProductSearch` es la FRONTERA con lo que lee la web de las tiendas. Cuando Felipe entregue la lista de tiendas (A-01),
// la implementación real es un lector AISLADO (DT-18): recibe solo este encargo —sin perfil, sin clóset, sin historial—,
// tiene topes propios de tiempo y de resultados, y devuelve fichas con este contrato. Lo que lea es dato, no instrucción
// (BF-09). No se implementa todavía: hoy hay dos implementaciones, la simulada (asesor simulado y tests) y `none`.

/** Encargo al buscador. Nada de datos personales más allá de lo que hace falta para buscar. */
export type ProductSearchRequest = {
  description: string;
  category: GarmentCategory;
  color?: string;
  /** Pesos chilenos enteros. */
  max_price_clp?: number;
  size?: string;
};

export type ProductSearchResult =
  | { ok: true; stores_searched: number; results_found: number; candidates: ProductCandidate[] }
  | { ok: false; reason: "unavailable" };

export interface ProductSearch {
  readonly kind: "simulated" | "none";
  search(request: ProductSearchRequest, now?: Date): Promise<ProductSearchResult>;
}

/** Sin búsqueda: el asesor describe la pieza y no inventa productos. */
export const noProductSearch: ProductSearch = {
  kind: "none",
  async search() {
    return { ok: false, reason: "unavailable" };
  },
};

type CatalogItem = {
  store: "Tienda A" | "Tienda B" | "Tienda C" | "Tienda D";
  slug: string;
  category: GarmentCategory;
  title: string;
  price: number;
  tags: string[];
};

// Catálogo de ejemplo, determinista. Tiendas genéricas; las URL usan el dominio reservado `example` (https).
// Solo "Tienda A" tiene enlace con comisión, para ejercitar la insignia de afiliación (DP-10).
const CATALOG: CatalogItem[] = [
  { store: "Tienda A", slug: "sandalia-camel-taco-cuadrado", category: "shoes", title: "Sandalia de cuero camel, taco cuadrado de 5 cm", price: 54990, tags: ["sandalia", "camel", "tierra", "taco ancho", "taco cuadrado", "cuero", "formal"] },
  { store: "Tienda B", slug: "mule-terracota-taco-bloque", category: "shoes", title: "Mule terracota, taco bloque de 4 cm", price: 39990, tags: ["mule", "terracota", "tierra", "taco ancho", "taco bloque", "formal"] },
  { store: "Tienda C", slug: "alpargata-plataforma-yute", category: "shoes", title: "Alpargata de plataforma en yute", price: 29990, tags: ["alpargata", "yute", "tierra", "plataforma", "taco ancho", "casual"] },
  { store: "Tienda D", slug: "zapato-nude-taco-bajo", category: "shoes", title: "Zapato nude de taco bajo de 3 cm", price: 47990, tags: ["zapato", "nude", "beige", "taco bajo", "formal"] },
  { store: "Tienda B", slug: "bailarina-negra-cuero", category: "shoes", title: "Bailarina negra de cuero", price: 34990, tags: ["bailarina", "negro", "taco bajo", "plano", "formal"] },
  { store: "Tienda C", slug: "zapatilla-blanca-urbana", category: "shoes", title: "Zapatilla blanca urbana", price: 42990, tags: ["zapatilla", "blanco", "plano", "casual"] },
  { store: "Tienda A", slug: "blazer-lino-arena", category: "outerwear", title: "Blazer de lino color arena", price: 69990, tags: ["blazer", "lino", "arena", "beige", "formal"] },
  { store: "Tienda C", slug: "chaqueta-denim-clara", category: "outerwear", title: "Chaqueta de denim clara", price: 44990, tags: ["chaqueta", "denim", "azul", "casual"] },
  { store: "Tienda D", slug: "abrigo-lana-camel", category: "outerwear", title: "Abrigo de lana camel", price: 119990, tags: ["abrigo", "lana", "camel", "formal"] },
  { store: "Tienda B", slug: "blusa-seda-cruda", category: "top", title: "Blusa de seda color crudo", price: 37990, tags: ["blusa", "seda", "crudo", "blanco", "formal"] },
  { store: "Tienda C", slug: "polera-algodon-blanca", category: "top", title: "Polera de algodón blanca", price: 12990, tags: ["polera", "algodon", "blanco", "casual"] },
  { store: "Tienda A", slug: "camisa-lino-celeste", category: "top", title: "Camisa de lino celeste", price: 32990, tags: ["camisa", "lino", "celeste", "azul", "formal"] },
  { store: "Tienda D", slug: "falda-plisada-salvia", category: "bottom", title: "Falda midi plisada color salvia", price: 38990, tags: ["falda", "plisada", "salvia", "verde", "formal"] },
  { store: "Tienda B", slug: "pantalon-sastre-negro", category: "bottom", title: "Pantalón de sastre negro", price: 45990, tags: ["pantalon", "sastre", "negro", "formal"] },
  { store: "Tienda C", slug: "jeans-recto-azul", category: "bottom", title: "Jeans recto azul", price: 29990, tags: ["jeans", "denim", "azul", "casual"] },
  { store: "Tienda A", slug: "vestido-midi-salvia", category: "dress", title: "Vestido midi color salvia", price: 59990, tags: ["vestido", "midi", "salvia", "verde", "formal"] },
  { store: "Tienda D", slug: "vestido-camisero-lino", category: "dress", title: "Vestido camisero de lino", price: 49990, tags: ["vestido", "camisero", "lino", "beige", "casual"] },
  { store: "Tienda B", slug: "vestido-negro-corto", category: "dress", title: "Vestido negro corto", price: 35990, tags: ["vestido", "negro", "corto", "formal"] },
  { store: "Tienda B", slug: "cartera-mimbre", category: "bag", title: "Cartera de mimbre con asa", price: 27990, tags: ["cartera", "mimbre", "tierra", "casual"] },
  { store: "Tienda A", slug: "bolso-cuero-camel", category: "bag", title: "Bolso de cuero camel", price: 64990, tags: ["bolso", "cuero", "camel", "tierra", "formal"] },
  { store: "Tienda C", slug: "clutch-negra", category: "bag", title: "Clutch negra de noche", price: 22990, tags: ["clutch", "negro", "formal"] },
  { store: "Tienda D", slug: "panuelo-seda-estampado", category: "accessory", title: "Pañuelo de seda estampado", price: 15990, tags: ["panuelo", "seda", "estampado"] },
  { store: "Tienda A", slug: "cinturon-cuero-cafe", category: "accessory", title: "Cinturón de cuero café", price: 19990, tags: ["cinturon", "cuero", "cafe", "tierra"] },
];

const SEARCH_STORES = ["Tienda A", "Tienda B", "Tienda C", "Tienda D"] as const;
const AFFILIATE_STORES: readonly string[] = ["Tienda A"];

const tokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

/**
 * Búsqueda simulada y determinista: filtra el catálogo por categoría y presupuesto y ordena por cuántas palabras del
 * pedido calzan. Mismo encargo y mismo `now` = mismo resultado. Sirve al asesor simulado y a los tests.
 */
export function createSimulatedProductSearch(): ProductSearch {
  return {
    kind: "simulated",
    async search(request, now = new Date()) {
      const wanted = new Set(tokens(`${request.description} ${request.color ?? ""}`));
      const seen_at = now.toISOString();
      const inCategory = CATALOG.filter((c) => c.category === request.category);
      const scored = inCategory.map((c) => {
        const hay = new Set(tokens(`${c.title} ${c.tags.join(" ")}`));
        const hits = [...wanted].filter((w) => hay.has(w));
        const phraseHits = c.tags.filter((t) => request.description.toLowerCase().includes(t));
        return { c, hits, score: hits.length + phraseHits.length };
      });
      const candidates: ProductCandidate[] = scored
        .filter((s) => request.max_price_clp === undefined || s.c.price <= request.max_price_clp)
        .map(({ c, hits, score }) => ({
          store_name: c.store,
          title: c.title,
          price_clp: c.price,
          seen_at,
          url: `https://${c.store.toLowerCase().replace(" ", "-")}.example/p/${c.slug}`,
          image_url: null,
          image_cutout_url: null,
          affiliate: AFFILIATE_STORES.includes(c.store),
          in_stock: true,
          reason: hits.length
            ? `Coincide con lo que buscas: ${hits.slice(0, 3).join(", ")}${request.max_price_clp ? " · dentro de tu presupuesto" : ""}.`
            : "Es de la misma categoría y sirve para completar el look.",
          relevance: Math.min(1, score / Math.max(1, wanted.size)),
        }));
      // `results_found` cuenta lo que hay en las tiendas aunque no se muestre todo: el rastro dice "41 resultados · elegí 3".
      return { ok: true, stores_searched: SEARCH_STORES.length, results_found: candidates.length, candidates };
    },
  };
}
