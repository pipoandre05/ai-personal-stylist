import type { GarmentCategory, OutfitEvidenceKind, OutfitVariant } from "@/lib/domain/types";

// Textos y formatos puros del contrato v2. Sin React: se testean aparte.

const TZ = "America/Santiago";

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("es-CL", { timeZone: TZ, day: "numeric", month: "short" });
const hourMinute = new Intl.DateTimeFormat("es-CL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** Aviso fijo que acompaña a todo precio visto (DP-10, DP-19). */
export const STOCK_NOTICE = "Precio y stock pueden cambiar";

/** "Visto hoy, 14 nov, 10:40" o "Visto el 13 nov, 18:02" (hora de Santiago). Vacío si la fecha no es válida. */
export function fmtSeenAt(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dm = dayMonth.format(d).replace(/\./g, "");
  const hm = hourMinute.format(d);
  return dayKey.format(d) === dayKey.format(now) ? `Visto hoy, ${dm}, ${hm}` : `Visto el ${dm}, ${hm}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Solo `https:`. Devuelve la URL normalizada o `null` (el asesor nunca debe sacar a la persona a otro esquema). */
export function safeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Cómo se nombra la pieza que falta en una frase ("Falta: zapatos"). */
export const SLOT_WORD: Record<GarmentCategory, string> = {
  top: "una parte de arriba",
  bottom: "una parte de abajo",
  dress: "un vestido",
  outerwear: "un abrigo",
  shoes: "zapatos",
  bag: "un bolso",
  accessory: "un accesorio",
};

/** "Zapatos: no tienes" (leyenda de la composición). */
export const SLOT_SHORT: Record<GarmentCategory, string> = {
  top: "Parte de arriba",
  bottom: "Parte de abajo",
  dress: "Vestido",
  outerwear: "Abrigo",
  shoes: "Zapatos",
  bag: "Bolso",
  accessory: "Accesorio",
};

/** El dato de evidencia dicho con palabras para quien lee con lector de pantalla. */
export const EVIDENCE_WORD: Record<OutfitEvidenceKind, string> = {
  palette: "Paleta",
  weather: "Clima",
  closet: "Clóset",
  occasion: "Ocasión",
};

/** La variante se dice con palabras, nunca solo con color o posición. */
export const VARIANT_LABEL: Record<OutfitVariant, string> = {
  seguro: "Más seguro",
  atrevido: "Más atrevido",
};

export function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Hex válido (#rgb o #rrggbb) para pintar una muestra; cualquier otra cosa se descarta. */
export function safeHex(v: string | null | undefined): string | null {
  return v && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : null;
}
