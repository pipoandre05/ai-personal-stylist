import "server-only";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { AnalyticsEventName } from "@/lib/domain/types";
import type { UserCtx } from "@/lib/server/types";

type Props = Record<string, string | number | boolean | null>;

/**
 * Registra un evento de producto con la sesión de la persona. Nunca lanza.
 * Pasa `ctx` cuando se llama fuera del alcance de la request (p. ej. dentro de un stream SSE),
 * donde `cookies()` ya no está disponible.
 */
export async function track(name: AnalyticsEventName, props: Props = {}, ctx?: UserCtx): Promise<void> {
  try {
    let supabase = ctx?.supabase;
    let userId = ctx?.userId;
    if (!supabase || !userId) {
      const user = await getSessionUser();
      if (!user) return;
      userId = user.id;
      supabase = await createClient();
    }
    await supabase.from("analytics_events").insert({ user_id: userId, name, props });
  } catch {
    // la analítica jamás debe romper el flujo
  }
}

export type TokenUsage = { input_tokens: number; output_tokens: number } & Partial<{
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
}>;

export async function trackAiUsage(route: string, model: string, usage: TokenUsage, ctx?: UserCtx): Promise<void> {
  await track(
    "ai_usage",
    {
      route,
      model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    },
    ctx,
  );
}
