import "server-only";
import { CONSENT_VERSION, type ConsentKind } from "@/lib/domain/types";
import type { UserCtx } from "@/lib/server/types";
import { logError } from "@/lib/server/log";

/** Registra consentimientos vigentes (R-03) sin duplicar los que ya están otorgados en esta versión. Nunca lanza. */
export async function recordConsents(ctx: UserCtx, kinds: ConsentKind[]): Promise<void> {
  try {
    const { data, error: readError } = await ctx.supabase
      .from("consents")
      .select("kind")
      .eq("user_id", ctx.userId)
      .eq("version", CONSENT_VERSION)
      .is("revoked_at", null)
      .in("kind", kinds)
      .returns<{ kind: ConsentKind }[]>();
    if (readError) logError("consents.read", readError);
    const have = new Set((data ?? []).map((r) => r.kind));
    const rows = kinds
      .filter((k) => !have.has(k))
      .map((kind) => ({ user_id: ctx.userId, kind, version: CONSENT_VERSION }));
    if (rows.length) {
      const { error } = await ctx.supabase.from("consents").insert(rows);
      if (error) logError("consents.insert", error);
    }
  } catch (err) {
    // el registro de consentimiento no debe romper la conversación
    logError("consents.record", err);
  }
}
