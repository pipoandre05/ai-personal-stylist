import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  // El cliente de Supabase lee la hora (Date.now() al validar la expiración del JWT) cuando se usa. Con Cache
  // Components, leerla durante el prerenderizado del shell es un error ("unstable value Date.now()"). `io()`
  // marca que lo que sigue es IO de la request: suspende en el prerender y resuelve al instante al atender
  // la request real. Ver node_modules/next/dist/docs/01-app/03-api-reference/04-functions/io.md.
  await io();
  const { url, publishableKey } = supabaseEnv();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component: no puede escribir cookies; el proxy refresca la sesión.
        }
      },
    },
  });
}

export type SessionUser = { id: string; email: string };

/** Valida el JWT contra Auth (no solo la cookie). Memoizado por request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
});

/** Exige sesión; si no hay, redirige a /entrar. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");
  return user;
}
