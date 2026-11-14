import { isForbiddenHostname, resolvesToPrivate, type Resolver } from "./net-guard";
import type { FailureReason } from "./types";

// Única puerta de salida a la red del lector. Aplica, en este orden: solo https · host en la lista blanca · host no
// privado (nombre y DNS) · redirecciones a mano, solo al MISMO host · tiempo máximo · tamaño máximo · User-Agent honesto.
// Nunca lanza: devuelve un resultado con el motivo.

export const USER_AGENT = "EstiloShopReader/1.0 (lector de catalogos publicos para un asesor de imagen; contacto via el sitio de la app)";
/** Token con el que se busca nuestro grupo en `robots.txt`. */
export const ROBOTS_TOKEN = "estiloshopreader";

export const LIMITS = {
  /** Tiempo máximo del flujo completo de una tienda. */
  storeMs: 4000,
  /** Tiempo máximo de toda la búsqueda. */
  totalMs: 8000,
  /** Tamaño máximo de una respuesta. */
  maxBytes: 1_000_000,
  /** Solicitudes máximas por búsqueda (suma de todas las tiendas). */
  maxRequests: 24,
  /** Redirecciones máximas por solicitud (siempre al mismo host). */
  maxRedirects: 2,
} as const;

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type SafeFetchResult =
  | { ok: true; status: number; text: string; contentType: string }
  | { ok: false; reason: FailureReason; status?: number };

export type SafeFetchDeps = {
  /** Dominios permitidos. */
  allowedHosts: ReadonlySet<string>;
  fetcher?: Fetcher;
  resolve?: Resolver;
  /** Se cancela cuando vence el tiempo de la tienda o de la búsqueda. */
  signal?: AbortSignal;
  maxBytes?: number;
  /** Desactiva la verificación DNS (solo para tests sin red). */
  skipDns?: boolean;
};

async function readCapped(res: Response, maxBytes: number): Promise<{ text: string } | "too_large"> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    return "too_large";
  }
  if (!res.body) return { text: "" };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return "too_large";
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    buf.set(c, o);
    o += c.byteLength;
  }
  return { text: new TextDecoder("utf-8", { fatal: false }).decode(buf) };
}

/** GET con todas las defensas. `url` debe ser https y de un host de la lista blanca. */
export async function safeFetch(rawUrl: string, deps: SafeFetchDeps): Promise<SafeFetchResult> {
  const fetcher: Fetcher = deps.fetcher ?? ((i, init) => fetch(i, init));
  const maxBytes = deps.maxBytes ?? LIMITS.maxBytes;
  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "blocked_host" };
  }
  const originHost = current.hostname.toLowerCase();

  for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
    const host = current.hostname.toLowerCase();
    if (current.protocol !== "https:" || current.username || current.password || current.port) return { ok: false, reason: hop ? "redirect_blocked" : "blocked_host" };
    if (!deps.allowedHosts.has(host) || host !== originHost || isForbiddenHostname(host)) return { ok: false, reason: hop ? "redirect_blocked" : "blocked_host" };
    if (!deps.skipDns && (await resolvesToPrivate(host, deps.resolve))) return { ok: false, reason: "blocked_host" };
    if (deps.signal?.aborted) return { ok: false, reason: "timeout" };

    let res: Response;
    try {
      res = await fetcher(current.toString(), {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        cache: "no-store",
        headers: { "user-agent": USER_AGENT, accept: "application/json, text/plain;q=0.9", "accept-language": "es-CL,es;q=0.9" },
        signal: deps.signal,
      });
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      return { ok: false, reason: name === "AbortError" || name === "TimeoutError" || deps.signal?.aborted ? "timeout" : "network" };
    }

    if (res.status >= 300 && res.status < 400) {
      await res.body?.cancel().catch(() => {});
      const loc = res.headers.get("location");
      if (!loc || hop === LIMITS.maxRedirects) return { ok: false, reason: "redirect_blocked", status: res.status };
      try {
        current = new URL(loc, current);
      } catch {
        return { ok: false, reason: "redirect_blocked", status: res.status };
      }
      continue; // el siguiente giro vuelve a validar protocolo y host
    }
    if (res.status === 429) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: "rate_limited", status: 429 };
    }
    if (res.status < 200 || res.status >= 300) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, reason: "http_error", status: res.status };
    }
    try {
      const body = await readCapped(res, maxBytes);
      if (body === "too_large") return { ok: false, reason: "too_large", status: res.status };
      return { ok: true, status: res.status, text: body.text, contentType: res.headers.get("content-type") ?? "" };
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      return { ok: false, reason: name === "AbortError" || deps.signal?.aborted ? "timeout" : "network" };
    }
  }
  return { ok: false, reason: "redirect_blocked" };
}
