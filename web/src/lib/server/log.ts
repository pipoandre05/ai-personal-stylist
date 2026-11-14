/**
 * Registro estructurado de errores del servidor. Nunca incluye datos personales: solo un `scope`
 * (módulo.operación) y los campos técnicos del error (código, mensaje, detalle, pista de Postgres/PostgREST).
 * Ningún `catch` ni `error` de la capa de datos debe tragarse un fallo en silencio: usa esto.
 */
export function logError(scope: string, err: unknown, extra?: Record<string, string | number | boolean | null>): void {
  const e = (err ?? {}) as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown; name?: unknown };
  const pick = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : undefined);
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      name: pick(e.name),
      code: pick(e.code),
      message: pick(e.message) ?? (typeof err === "string" ? err.slice(0, 300) : undefined),
      details: pick(e.details),
      hint: pick(e.hint),
      ...extra,
    }),
  );
}
