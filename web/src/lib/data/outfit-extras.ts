import { logError } from "@/lib/server/log";

// Degradación sin la migración 20261114020000: las columnas nuevas de `outfits` pueden no existir todavía en la base.

export const EXTRAS_COLUMNS = "variant, pair_id, evidence, selected_option";

const RECHECK_MS = 60_000;
let missingUntil = 0;
let warned = false;

/** ¿Vale la pena consultar las columnas nuevas? Tras un fallo se vuelve a probar cada minuto (por si se aplicó la migración). */
export function extrasAvailable(now: number = Date.now()): boolean {
  return now >= missingUntil;
}

/** Códigos de Postgres/PostgREST que significan "columna inexistente". */
export function isMissingColumnError(err: unknown): boolean {
  const e = (err ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  const msg = typeof e.message === "string" ? e.message : "";
  return code === "42703" || code === "PGRST204" || code === "PGRST200" || /column .* does not exist|could not find the .* column/i.test(msg);
}

/** Registra (una vez) que falta la migración y deja de consultar durante un minuto. Otros errores se registran siempre. */
export function markExtrasMissing(err: unknown, now: number = Date.now()): void {
  if (isMissingColumnError(err)) {
    missingUntil = now + RECHECK_MS;
    if (!warned) {
      warned = true;
      console.warn(
        JSON.stringify({
          level: "warn",
          scope: "data.outfit_extras",
          message: "Falta aplicar 20261114020000_compra_y_evento.sql: sin variante, par, evidencia ni opción elegida en la tabla outfits.",
        }),
      );
    }
    return;
  }
  logError("data.outfit_extras", err);
}
