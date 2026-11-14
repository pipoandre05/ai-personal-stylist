import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, supabaseEnv } from "@/lib/env";
import { proxyRedirect } from "@/lib/auth/proxy-rules";

// El proxy solo refresca la sesión y hace la redirección optimista por cookie (barata).
// No hay redirección a un onboarding: desde DP-17 el onboarding es la primera conversación, dentro de /asesor.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Sin variables de Supabase (build o desarrollo sin .env.local): solo rutas públicas.
  if (!hasSupabaseEnv()) {
    const target = proxyRedirect({ pathname, hasSession: false });
    return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  let authHeaders: Record<string, string> = {};
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        authHeaders = { ...authHeaders, ...headers };
        Object.entries(authHeaders).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims puede lanzar con errores que no son de auth (JWKS): se trata como sin sesión.
  const { data } = await supabase.auth.getClaims().catch(() => ({ data: null }));
  let hasSession = Boolean(data?.claims);

  if (hasSession && pathname === "/entrar") {
    // Un JWT válido puede tener la sesión revocada: se confirma con Auth solo aquí, para no
    // crear un bucle /entrar <-> ruta protegida.
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // limpiar cookies es mejor-esfuerzo
      }
      hasSession = false;
    }
  }

  const target = proxyRedirect({ pathname, hasSession });
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    Object.entries(authHeaders).forEach(([k, v]) => redirect.headers.set(k, v));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
