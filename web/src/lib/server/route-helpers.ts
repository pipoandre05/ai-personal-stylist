import "server-only";
import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { UserCtx } from "@/lib/server/types";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
export const apiError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export const UNAUTHORIZED = "Tu sesión expiró. Vuelve a entrar para continuar.";
export const BAD_INPUT = "No entendí lo que enviaste. Revisa e intenta de nuevo.";
export const INTERNAL = "Algo salió mal de nuestro lado. Intenta de nuevo en un momento.";

/** Persona de la sesión o null (el handler responde 401). Nunca lanza por falta de configuración. */
export async function authenticate(): Promise<UserCtx | null> {
  if (!hasSupabaseEnv()) return null;
  const user = await getSessionUser();
  if (!user) return null;
  return { supabase: await createClient(), userId: user.id };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
