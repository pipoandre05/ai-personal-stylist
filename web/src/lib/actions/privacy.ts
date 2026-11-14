"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import type { Db } from "@/lib/server/types";

const BUCKET = "user-media";
const KINDS = ["garments", "selfies", "chat"] as const;
const PAGE = 100;

/** Lista y borra todas las fotos de la persona (rutas `{user_id}/{kind}/…`). Devuelve false si algo falló. */
async function removeAllPhotos(db: Db, userId: string): Promise<boolean> {
  for (const kind of KINDS) {
    const prefix = `${userId}/${kind}`;
    for (;;) {
      // Siempre se lista desde 0: lo borrado ya no aparece, así que no hay que paginar con offset.
      const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: PAGE });
      if (error) return false;
      const files = (data ?? []).filter((f) => f.id).map((f) => `${prefix}/${f.name}`);
      if (files.length === 0) break;
      const { error: removeError } = await db.storage.from(BUCKET).remove(files);
      if (removeError) return false;
      if (files.length < PAGE) break;
    }
  }
  return true;
}

/**
 * Derecho de borrado (R-02): fotos del bucket -> RPC `delete_my_account` (borra la cuenta y, por cascada, todo)
 * -> cierre de sesión. Si las fotos no se pueden borrar se aborta antes de tocar la base, para poder reintentar.
 * No se registra `data_deleted`: el evento se borraría junto con la cuenta.
 */
export async function deleteMyData(): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };

  if (!(await removeAllPhotos(ctx.supabase, ctx.userId))) {
    return { ok: false, error: "No pudimos borrar tus fotos. No se eliminó nada; intenta de nuevo en un momento." };
  }
  const { error } = await ctx.supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: GENERIC_ERROR };

  try {
    await ctx.supabase.auth.signOut();
  } catch {
    // los datos ya se borraron; la sesión caduca sola
  }
  redirect("/");
}
