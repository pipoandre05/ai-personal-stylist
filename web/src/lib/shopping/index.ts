import { isMockAI } from "@/lib/env";
import { createSimulatedProductSearch, noProductSearch, type ProductSearch } from "./product-search";

/**
 * Buscador de productos según `SHOPPING_SEARCH` (`simulada` | `none`). Sin variable: simulada con `AI_MODE=mock` y `none` con
 * IA real, porque no hay todavía un lector de tiendas (A-01, DT-18): el asesor describe la pieza y no inventa productos.
 */
export function getProductSearch(): ProductSearch {
  const mode = (process.env.SHOPPING_SEARCH ?? "").toLowerCase();
  if (mode === "simulada" || mode === "simulated") return createSimulatedProductSearch();
  if (mode === "none") return noProductSearch;
  return isMockAI() ? createSimulatedProductSearch() : noProductSearch;
}
