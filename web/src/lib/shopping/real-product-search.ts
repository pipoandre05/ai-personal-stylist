import type { ProductCandidate } from "@/lib/domain/shopping";
import { fold } from "./text";
import type { Resolver } from "./net-guard";
import { buildQuery } from "./query";
import type { ProductSearch, ProductSearchRequest } from "./product-search";
import { TtlCache } from "./query-cache";
import { pickDiverse, scoreCandidate, toCandidate, type Scored } from "./rank";
import { LIMITS, type Fetcher } from "./safe-fetch";
import { RequestBudget, searchStore } from "./store-search";
import { selectStores } from "./store-directory";
import type { FailureReason, SearchSummary, Store, StoreOutcome } from "./types";

// Lector real de tiendas (DT-18). NO usa un modelo de lenguaje: son adaptadores deterministas contra los catálogos
// públicos estructurados que las propias tiendas exponen para su sitio. Por eso:
//   - no hay vía de inyección de instrucciones: solo se leen campos con nombre, y los textos se tratan como texto plano;
//   - el módulo es AISLADO: su entrada es `ProductSearchRequest` (pieza, categoría, color, precio, talla). No recibe perfil,
//     clóset, historial ni identidad de la persona, y a la red solo salen palabras de la pieza y su color (query.ts).

export type RealSearchOptions = {
  stores: Store[];
  fetcher?: Fetcher;
  resolve?: Resolver;
  /** Solo tests sin red. */
  skipDns?: boolean;
  limits?: Partial<{ storeMs: number; totalMs: number; maxRequests: number; maxBytes: number }>;
  cacheTtlMs?: number;
  /** `all` consulta a todas las tiendas configuradas, sin elegir por categoría y público (pruebas del lector). */
  selection?: "directory" | "all";
  /** Recibe el resumen de cada búsqueda (solo conteos y motivos, nunca contenido de tiendas). */
  onSummary?: (s: SearchSummary) => void;
};

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

function deadline<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}

export function createRealProductSearch(opts: RealSearchOptions): ProductSearch {
  // El tope de solicitudes crece con la lista: cada tienda gasta hasta 3 (robots, detección de plataforma y búsqueda).
  // Con un tope fijo, las últimas tiendas de una lista larga quedaban sin consultar en una instancia recién levantada.
  const limits = { ...LIMITS, maxRequests: Math.max(LIMITS.maxRequests, opts.stores.length * 3), ...opts.limits };
  const allowedHosts = new Set(opts.stores.map((s) => s.domain));
  const cache = new TtlCache<Extract<Awaited<ReturnType<ProductSearch["search"]>>, { ok: true }>>(opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, 100);

  return {
    kind: "real",
    async search(request: ProductSearchRequest, now = new Date()) {
      const q = buildQuery(request);
      if (!q || opts.stores.length === 0) return { ok: false, reason: "unavailable" };

      const key = JSON.stringify([q.text, q.term, fold(request.color ?? ""), request.max_price_clp ?? null, fold(request.size ?? ""), request.category, request.audience ?? null, [...allowedHosts].sort()]);
      const hit = cache.get(key);
      if (hit) return hit;

      const overall = AbortSignal.timeout(limits.totalMs);
      const budget = new RequestBudget(limits.maxRequests);
      // No se consulta a todas: solo a las que venden esa categoría para esa persona (store-directory.ts).
      const chosen = opts.selection === "all" ? [...opts.stores] : selectStores(opts.stores, { category: request.category, audience: request.audience ?? null });
      if (chosen.length === 0) return { ok: false, reason: "unavailable" };
      const outcomes: StoreOutcome[] = await Promise.all(
        chosen.map((store) => {
          const failed = (reason: FailureReason): StoreOutcome => ({ ok: false, store, reason, requests: 0 });
          const signal = AbortSignal.any([overall, AbortSignal.timeout(limits.storeMs)]);
          return deadline(
            searchStore(store, q, { allowedHosts, fetcher: opts.fetcher, resolve: opts.resolve, skipDns: opts.skipDns, maxBytes: limits.maxBytes, signal, budget }),
            Math.min(limits.storeMs, limits.totalMs) + 250,
            failed("timeout"),
          );
        }),
      );

      const okOutcomes = outcomes.filter((o): o is Extract<StoreOutcome, { ok: true }> => o.ok);
      const failedOutcomes = outcomes.filter((o): o is Extract<StoreOutcome, { ok: false }> => !o.ok);
      const all = okOutcomes.flatMap((o) => o.candidates);
      const summary: SearchSummary = {
        stores_queried: chosen.length,
        stores_ok: okOutcomes.length,
        results: all.length,
        failed: failedOutcomes.map((o) => ({ domain: o.store.domain, reason: o.reason })),
        requests: budget.used,
      };
      opts.onSummary?.(summary);

      // Ninguna tienda respondió: no hay búsqueda, y el asesor lo dice (no inventa).
      if (okOutcomes.length === 0) return { ok: false, reason: "unavailable" };

      const scored: Scored[] = [];
      for (const raw of all) {
        const r = scoreCandidate(raw, request, q);
        if ("scored" in r) scored.push(r.scored);
      }
      const seenAt = now.toISOString();
      const candidates: ProductCandidate[] = pickDiverse(scored).map((s) => toCandidate(s, seenAt));
      const result = {
        ok: true as const,
        stores_searched: okOutcomes.length,
        results_found: all.length,
        candidates,
        stores_failed: failedOutcomes.map((o) => ({ store: o.store.name, reason: o.reason })),
      };
      cache.set(key, result);
      return result;
    },
  };
}
