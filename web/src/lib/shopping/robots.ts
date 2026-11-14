import { ROBOTS_TOKEN, safeFetch, type SafeFetchDeps } from "./safe-fetch";

// `robots.txt` (RFC 9309): se consulta antes de usar una ruta de la tienda. Grupo propio si existe; si no, `*`.
// Precedencia: la regla más larga gana; con el mismo largo, `Allow`.

export type RobotsRule = { allow: boolean; pattern: string };
export type RobotsRules = RobotsRule[];

export function parseRobots(text: string, token: string = ROBOTS_TOKEN): RobotsRules {
  type Group = { agents: string[]; rules: RobotsRule[] };
  const groups: Group[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && cur) {
      lastWasAgent = false;
      if (value) cur.rules.push({ allow: key === "allow", pattern: value });
      // `Disallow:` vacío = permitir todo: no añade regla.
    } else {
      lastWasAgent = false;
    }
  }
  const own = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  const chosen = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.rules);
}

function toRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** ¿Se puede pedir esta ruta (con su query)? */
export function isAllowed(rules: RobotsRules, pathWithQuery: string): boolean {
  let best: { len: number; allow: boolean } | null = null;
  for (const r of rules) {
    let match = false;
    try {
      match = toRegExp(r.pattern).test(pathWithQuery);
    } catch {
      match = false;
    }
    if (!match) continue;
    const len = r.pattern.replace(/\*/g, "").length;
    if (!best || len > best.len || (len === best.len && r.allow && !best.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}

export type RobotsResult = { ok: true; rules: RobotsRules } | { ok: false; reason: "robots_unreachable" };

const OK_TTL_MS = 6 * 60 * 60 * 1000;
const FAIL_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { at: number; ttl: number; value: RobotsResult }>();

export function clearRobotsCache(): void {
  cache.clear();
}

/** ¿Hay reglas vigentes en caché? Así quien llama puede contar la solicitud antes de hacerla. */
export function robotsCached(domain: string, now = Date.now()): boolean {
  const hit = cache.get(domain);
  return Boolean(hit && now - hit.at < hit.ttl);
}

/** Reglas de la tienda, con caché en memoria. 4xx = sin restricciones; 5xx o sin respuesta = no se consulta (RFC 9309 §2.3.1.4). */
export async function getRobots(domain: string, deps: SafeFetchDeps, now = Date.now()): Promise<{ result: RobotsResult; requested: boolean }> {
  const hit = cache.get(domain);
  if (hit && now - hit.at < hit.ttl) return { result: hit.value, requested: false };
  const res = await safeFetch(`https://${domain}/robots.txt`, deps);
  let value: RobotsResult;
  if (res.ok) value = { ok: true, rules: parseRobots(res.text) };
  else if (res.reason === "http_error" && res.status !== undefined && res.status >= 400 && res.status < 500) value = { ok: true, rules: [] };
  else value = { ok: false, reason: "robots_unreachable" };
  cache.set(domain, { at: now, ttl: value.ok ? OK_TTL_MS : FAIL_TTL_MS, value });
  return { result: value, requested: true };
}
