import type { SupabaseClient } from "@supabase/supabase-js";

/** Cliente de Supabase con la sesión de la persona (RLS). Sin tipos generados todavía. */
export type Db = SupabaseClient;

/** Contexto explícito para código que corre fuera del alcance de `cookies()` (p. ej. dentro de un stream). */
export type UserCtx = { supabase: Db; userId: string };
