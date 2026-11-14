// Lectura validada de variables de entorno. Nada se evalúa al importar el módulo:
// el build debe pasar sin `.env.local` y fallar solo cuando se usa la función.

export function supabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local.",
    );
  }
  return { url, publishableKey };
}

/** Versión que no lanza: el proxy la usa para dejar pasar rutas públicas sin configuración. */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** IA simulada salvo que `AI_MODE=live` y exista la clave (DT-13). */
export function isMockAI(): boolean {
  return process.env.AI_MODE !== "live" || !process.env.ANTHROPIC_API_KEY;
}

export function anthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Falta ANTHROPIC_API_KEY (o usa AI_MODE=mock).");
  return key;
}

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: readonly string[] = ["low", "medium", "high", "xhigh", "max"];

export function aiConfig(): { stylistModel: string; effort: Effort; visionModel: string } {
  const effort = process.env.STYLIST_EFFORT ?? "low";
  return {
    stylistModel: process.env.STYLIST_MODEL || "claude-opus-5-5",
    effort: (EFFORTS.includes(effort) ? effort : "low") as Effort,
    visionModel: process.env.VISION_MODEL || "claude-haiku-5-5",
  };
}

export function siteUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SITE_URL || undefined;
}

/** Tope diario de mensajes de chat por persona (R-15), mientras no haya control de costos real (A-03). */
export function chatDailyLimit(): number {
  const n = Number.parseInt(process.env.CHAT_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 60;
}
