import { parseShopify, shopifyRobotsPath, shopifySearchUrl } from "./adapters/shopify";
import { parseVtex, vtexRobotsPath, vtexSearchUrl } from "./adapters/vtex";
import type { ShopQuery } from "./query";
import { getRobots, isAllowed, robotsCached } from "./robots";
import { safeFetch, type SafeFetchDeps } from "./safe-fetch";
import type { FailureReason, Platform, RawCandidate, Store, StoreOutcome } from "./types";

// Búsqueda en UNA tienda: detecta la plataforma probando (con caché), revisa `robots.txt` para la ruta exacta,
// consulta y normaliza. Ningún paso lanza: el resultado dice si salió bien o por qué no.

const PLATFORM_TTL_MS = 24 * 60 * 60 * 1000;
const UNKNOWN_TTL_MS = 60 * 60 * 1000;
const platformCache = new Map<string, { at: number; platform: Platform }>();

export function clearPlatformCache(): void {
  platformCache.clear();
}
export function cachedPlatform(domain: string, now = Date.now()): Platform | null {
  const hit = platformCache.get(domain);
  if (!hit) return null;
  if (now - hit.at > (hit.platform === "unknown" ? UNKNOWN_TTL_MS : PLATFORM_TTL_MS)) {
    platformCache.delete(domain);
    return null;
  }
  return hit.platform;
}

/** Tope de solicitudes de toda una búsqueda, compartido entre tiendas. */
export class RequestBudget {
  used = 0;
  constructor(readonly max: number) {}
  take(): boolean {
    if (this.used >= this.max) return false;
    this.used += 1;
    return true;
  }
}

export type StoreSearchDeps = SafeFetchDeps & { budget: RequestBudget; now?: () => number };

type Attempt = { platform: Exclude<Platform, "unknown">; url: (s: Store, q: ShopQuery, term: string) => string; robotsPath: (term: string) => string; parse: (text: string, s: Store) => RawCandidate[] | null };

const SHOPIFY: Attempt = { platform: "shopify", url: (s, _q, term) => shopifySearchUrl(s.domain, term), robotsPath: shopifyRobotsPath, parse: parseShopify };
const VTEX: Attempt = { platform: "vtex", url: (s, _q, term) => vtexSearchUrl(s.domain, term), robotsPath: vtexRobotsPath, parse: parseVtex };

export async function searchStore(store: Store, q: ShopQuery, deps: StoreSearchDeps): Promise<StoreOutcome> {
  let requests = 0;
  const fail = (reason: FailureReason): StoreOutcome => ({ ok: false, store, reason, requests });
  const send = async (url: string) => {
    if (!deps.budget.take()) return { ok: false, reason: "budget_exhausted" } as const;
    requests += 1;
    return safeFetch(url, deps);
  };

  const known = cachedPlatform(store.domain, deps.now?.());
  if (known === "unknown") return fail("unknown_platform");

  // robots.txt: una vez por tienda (caché de horas). Si hay que pedirlo, cuenta contra el tope ANTES de salir a la red.
  if (!robotsCached(store.domain, deps.now?.())) {
    if (!deps.budget.take()) return fail("budget_exhausted");
    requests += 1;
  }
  const robots = await getRobots(store.domain, deps, deps.now?.());
  if (!robots.result.ok) return fail("robots_unreachable");
  const rules = robots.result.rules;

  const attempts = known === "shopify" ? [SHOPIFY] : known === "vtex" ? [VTEX] : [SHOPIFY, VTEX];
  let disallowed = 0;
  let notThisPlatform = 0;

  for (const a of attempts) {
    // Shopify busca con varias palabras; VTEX exige todas, así que va con una sola.
    const primary = a.platform === "shopify" ? q.text : q.term;
    if (!isAllowed(rules, a.robotsPath(primary))) {
      disallowed += 1;
      continue;
    }
    const res = await send(a.url(store, q, primary));
    if (!res.ok) {
      // 404 al detectar = esa plataforma no es; el resto de los fallos termina la tienda.
      if (!known && res.reason === "http_error") {
        notThisPlatform += 1;
        continue;
      }
      return fail(res.reason);
    }
    let found = a.parse(res.text, store);
    if (found === null) {
      if (!known) {
        notThisPlatform += 1;
        continue;
      }
      platformCache.delete(store.domain);
      return fail("bad_response");
    }
    platformCache.set(store.domain, { at: deps.now?.() ?? Date.now(), platform: a.platform });

    // Sin resultados con varias palabras: un segundo intento con solo la prenda (una solicitud más, nada más).
    if (found.length === 0 && primary !== q.term && isAllowed(rules, a.robotsPath(q.term))) {
      const second = await send(a.url(store, q, q.term));
      if (second.ok) found = a.parse(second.text, store) ?? [];
      else if (second.reason !== "budget_exhausted") return fail(second.reason);
    }
    return { ok: true, store, platform: a.platform, candidates: found, requests };
  }

  // Si la ruta de búsqueda está prohibida para al menos una plataforma posible, no se puede afirmar que sea "otra": se
  // excluye por robots y se anota así.
  if (disallowed > 0) return fail("robots_disallow");
  if (notThisPlatform > 0) platformCache.set(store.domain, { at: deps.now?.() ?? Date.now(), platform: "unknown" });
  return fail("unknown_platform");
}
