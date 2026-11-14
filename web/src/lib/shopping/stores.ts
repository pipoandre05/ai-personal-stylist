import { isForbiddenHostname } from "./net-guard";
import { directoryStores } from "./store-directory";
import type { Store } from "./types";

// Registro de tiendas. Se configura con `SHOP_STORES`: lista separada por comas; cada entrada es
//   dominio                       → nombre visible derivado del dominio, sin afiliación
//   dominio|Nombre visible        → con nombre
//   dominio|Nombre visible|afiliado → la tienda tiene enlace con comisión (se muestra; nunca pesa en el orden, DP-10)
// Sin valor, o sin ninguna entrada válida, el lector queda apagado. Es la LISTA BLANCA de dominios: el lector no consulta
// ningún otro host (ni sigue redirecciones hacia otro).

export const MAX_STORES = 60;

const HOSTNAME = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

function defaultName(domain: string): string {
  const parts = domain.replace(/^www\./, "").split(".");
  // `hushpuppies.cl` → "Hushpuppies"; `shop.marca.com.ar` → "Marca"
  const generic = new Set(["com", "co", "net", "org", "cl"]);
  const core = [...parts].reverse().find((p, i) => i > 0 && !generic.has(p)) ?? parts[0];
  return core.charAt(0).toUpperCase() + core.slice(1);
}

/** Interpreta `SHOP_STORES`. Descarta con silencio lo inválido (IP, localhost, rutas, duplicados) y respeta el tope. */
export function parseStores(raw: string | undefined | null): Store[] {
  if (!raw) return [];
  // `SHOP_STORES=directorio`: las tiendas verificadas de store-directory.ts, sin escribir la lista a mano.
  if (raw.trim().toLowerCase() === "directorio") return directoryStores();
  const out: Store[] = [];
  const seen = new Set<string>();
  for (const entry of raw.split(",")) {
    const [d, name, flag] = entry.split("|").map((x) => x.trim());
    if (!d) continue;
    const domain = d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!HOSTNAME.test(domain) || isForbiddenHostname(domain) || seen.has(domain)) continue;
    seen.add(domain);
    const visible = (name ?? "").replace(/[<>\n\r]/g, "").slice(0, 60).trim();
    out.push({ domain, name: visible || defaultName(domain), affiliate: (flag ?? "").toLowerCase() === "afiliado" });
    if (out.length === MAX_STORES) break;
  }
  return out;
}

/** Tiendas configuradas en el entorno. Vacío = lector apagado. */
export function configuredStores(env: NodeJS.ProcessEnv = process.env): Store[] {
  return parseStores(env.SHOP_STORES);
}
