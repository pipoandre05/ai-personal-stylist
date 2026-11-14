import "server-only";
import { CONSENT_VERSION, type ConsentKind } from "@/lib/domain/types";
import type { UserCtx } from "@/lib/server/types";

/** Registra consentimientos vigentes (R-03) sin duplicar los que ya están otorgados en esta versión. Nunca lanza. */
export async function recordConsents(ctx: UserCtx, kinds: ConsentKind[]): Promise<void> {
  try {
    const { data } = await ctx.supabase
      .from("consents")
      .select("kind")
      .eq("user_id", ctx.userId)
      .eq("version", CONSENT_VERSION)
      .is("revoked_at", null)
      .in("kind", kinds)
      .returns<{ kind: ConsentKind }[]>();
    const have = new Set((data ?? []).map((r) => r.kind));
    const rows = kinds
      .filter((k) => !have.has(k))
      .map((kind) => ({ user_id: ctx.userId, kind, version: CONSENT_VERSION }));
    if (rows.length) await ctx.supabase.from("consents").insert(rows);
  } catch {
    // el registro de consentimiento no debe romper la conversación
  }
}
