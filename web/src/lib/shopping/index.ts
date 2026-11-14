import { isMockAI, shoppingConfig } from "@/lib/env";
import { createSimulatedProductSearch, noProductSearch, type ProductSearch } from "./product-search";
import { createRealProductSearch } from "./real-product-search";
import { parseStores } from "./stores";

let realSingleton: { key: string; search: ProductSearch } | null = null;

/** Lector real sobre las tiendas de `SHOP_STORES`; sin tiendas válidas queda apagado (`none`). Una instancia por configuración, para compartir la caché. */
function realOrNone(storesRaw: string): ProductSearch {
  const stores = parseStores(storesRaw);
  if (stores.length === 0) return noProductSearch;
  const key = stores.map((s) => `${s.domain}|${s.name}|${s.affiliate}`).join(",");
  if (!realSingleton || realSingleton.key !== key) {
    realSingleton = {
      key,
      search: createRealProductSearch({
        stores,
        onSummary: (s) => console.info("[shopping]", JSON.stringify(s)),
      }),
    };
  }
  return realSingleton.search;
}

/**
 * Buscador de productos según `SHOPPING_SEARCH`: `real` (lector de tiendas; sin `SHOP_STORES` degrada a `none`) |
 * `mock`/`simulada` | `none`. Sin variable: simulada con `AI_MODE=mock` y `none` con IA real, para que el lector real
 * (que sale a la red) sea siempre una decisión explícita (DT-18): el asesor describe la pieza y no inventa productos.
 */
export function getProductSearch(): ProductSearch {
  const { mode, storesRaw } = shoppingConfig();
  if (mode === "real") return realOrNone(storesRaw);
  if (mode === "mock" || mode === "simulada" || mode === "simulated") return createSimulatedProductSearch();
  if (mode === "none") return noProductSearch;
  return isMockAI() ? createSimulatedProductSearch() : noProductSearch;
}
