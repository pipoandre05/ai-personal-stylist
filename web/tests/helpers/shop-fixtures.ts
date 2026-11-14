import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { Fetcher } from "@/lib/shopping/safe-fetch";
import type { ProductSearchRequest } from "@/lib/shopping/product-search";
import type { Store } from "@/lib/shopping/types";

// Respuestas grabadas de tiendas reales (2026-11-14) para correr los tests SIN red. Ver docs/tecnico/lector-de-tiendas.md.

const DIR = path.resolve(__dirname, "../fixtures/shopping");

export const readFixture = (name: string): string => readFileSync(path.join(DIR, name), "utf8");

export const SHOPIFY_DOMAINS = ["fashionspark.com", "www.hushpuppies.cl", "guante.cl", "www.doite.cl", "pilgrim.cl", "www.columbiachile.cl", "www.shopcaterpillar.cl"];
export const VTEX_DOMAINS = ["www.ellus.cl"];
export const ALL_DOMAINS = [...SHOPIFY_DOMAINS, ...VTEX_DOMAINS];

export const store = (domain: string, over: Partial<Store> = {}): Store => ({ domain, name: domain.replace(/^www\./, "").split(".")[0], affiliate: false, ...over });
export const ALL_STORES: Store[] = ALL_DOMAINS.map((d) => store(d));

/** Las 3 búsquedas representativas del caso de uso, tal como se grabaron. */
export const SCENARIOS: { n: 1 | 2 | 3; request: ProductSearchRequest; text: string }[] = [
  { n: 1, request: { description: "sandalia de taco bajo", category: "shoes", color: "camel", max_price_clp: 60000 }, text: "sandalia taco bajo camel" },
  { n: 2, request: { description: "blazer de lino", category: "outerwear", color: "beige" }, text: "blazer lino beige" },
  { n: 3, request: { description: "vestido midi estampado", category: "dress" }, text: "vestido midi estampado" },
];

const EMPTY_SHOPIFY = JSON.stringify({ resources: { results: { products: [] } } });
const json = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "application/json; charset=utf-8" } });
const html404 = () => new Response("<html>no</html>", { status: 404, headers: { "content-type": "text/html" } });

export type Call = { url: string; host: string; path: string; params: URLSearchParams; headers: Record<string, string> };

/**
 * Fetcher falso que sirve las fixtures. `overrides` permite sustituir la respuesta de un dominio (por ejemplo para
 * simular redirecciones, fallos o lentitud). Registra cada llamada en `calls`.
 */
export function fixtureFetcher(overrides: Record<string, (url: URL) => Response | Promise<Response>> = {}): { fetcher: Fetcher; calls: Call[] } {
  const calls: Call[] = [];
  const fetcher: Fetcher = async (input, init) => {
    const u = new URL(input);
    calls.push({ url: input, host: u.hostname, path: u.pathname, params: u.searchParams, headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>)) });
    const over = overrides[u.hostname];
    if (over) return over(u);
    const d = u.hostname;
    if (u.pathname === "/robots.txt") {
      const f = `robots__${d}.txt`;
      return existsSync(path.join(DIR, f)) ? new Response(readFixture(f), { status: 200, headers: { "content-type": "text/plain" } }) : html404();
    }
    const nOf = (q: string) => SCENARIOS.find((s) => s.text === q)?.n;
    if (u.pathname === "/search/suggest.json" && SHOPIFY_DOMAINS.includes(d)) {
      const n = nOf(u.searchParams.get("q") ?? "");
      return json(n ? readFixture(`shopify__${d}__${n}.json`) : EMPTY_SHOPIFY);
    }
    if (u.pathname === "/api/catalog_system/pub/products/search" && VTEX_DOMAINS.includes(d)) {
      const term = u.searchParams.get("ft") ?? "";
      const n = SCENARIOS.find((s) => s.text.split(" ")[0] === term)?.n;
      return json(n ? readFixture(`vtex__${d}__${n}.json`) : "[]", n ? 206 : 200);
    }
    return html404();
  };
  return { fetcher, calls };
}
