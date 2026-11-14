// Reglas de ruta del proxy. Puras: sin imports de Next ni de Supabase, para poder testearlas.

const PUBLIC_EXACT = new Set(["/", "/entrar", "/manifest.webmanifest", "/sw.js", "/favicon.ico", "/robots.txt"]);
const ASSET = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|json|js|css|map|webmanifest)$/i;

/**
 * `/dev/**` son vistas previas de desarrollo (sin sesión). Solo existen fuera de producción: en producción nunca son
 * públicas y además cada página responde 404 por sí misma.
 */
export function isDevPath(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

export function isPublicPath(pathname: string): boolean {
  if (isDevPath(pathname) && process.env.NODE_ENV !== "production") return true;
  return PUBLIC_EXACT.has(pathname) || pathname.startsWith("/_next/") || ASSET.test(pathname);
}

/** Los Route Handlers responden 401 por sí mismos; redirigir un fetch a HTML rompería al cliente. */
export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** Ruta destino de la redirección, o `null` para dejar pasar. */
export function proxyRedirect(input: { pathname: string; hasSession: boolean }): string | null {
  const { pathname, hasSession } = input;
  if (isApiPath(pathname)) return null;
  if (hasSession) return pathname === "/entrar" ? "/asesor" : null;
  return isPublicPath(pathname) ? null : "/entrar";
}
