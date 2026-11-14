import "server-only";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { UserCtx } from "@/lib/server/types";

export const GENERIC_ERROR = "Algo salió mal de nuestro lado. Intenta de nuevo en un momento.";
export const NO_SESSION_ERROR = "Tu sesión expiró. Vuelve a entrar para continuar.";

/** Cliente + persona de la sesión, o null si no hay sesión. */
export async function getUserCtx(): Promise<UserCtx | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return { supabase: await createClient(), userId: user.id };
}
