import { isForbiddenHostname } from "../net-guard";

// Piezas comunes de los adaptadores. Todo lo que entra viene de una tienda: es dato no confiable y se valida campo a campo.

export const MAX_ITEMS_PER_STORE = 10;
export const MIN_PLAUSIBLE_PRICE_CLP = 500;
export const MAX_PLAUSIBLE_PRICE_CLP = 20_000_000;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Precio en pesos chilenos enteros, o null. Acepta número o texto ("19995", "19995.00"). Rechaza decimales reales
 * ("49.90" suele ser otra moneda), precios absurdos y todo lo que no sea un número.
 */
export function clpPrice(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\s*\d{1,9}(\.\d{1,2})?\s*$/.test(v) ? Number.parseFloat(v) : Number.NaN;
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n - Math.round(n)) > 0.005) return null;
  const r = Math.round(n);
  return r >= MIN_PLAUSIBLE_PRICE_CLP && r <= MAX_PLAUSIBLE_PRICE_CLP ? r : null;
}

/** URL https del producto en el MISMO dominio de la tienda, sin query ni ancla (fuera parámetros de seguimiento). */
export function productUrl(domain: string, raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 600) return null;
  try {
    const u = new URL(raw.trim(), `https://${domain}/`);
    if (u.protocol !== "https:" || u.hostname.toLowerCase() !== domain || u.username || u.password || u.port) return null;
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** URL https de imagen (cualquier host público; la app solo la muestra), o null. */
export function imageUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 600) return null;
  const s = raw.trim().startsWith("//") ? `https:${raw.trim()}` : raw.trim();
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || u.port || isForbiddenHostname(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}
