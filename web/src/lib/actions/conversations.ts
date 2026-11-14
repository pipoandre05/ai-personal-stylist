"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import { logError } from "@/lib/server/log";

const NOT_FOUND = "No encontramos esa conversación.";

/** Cambia el nombre de una sesión de la persona (panel de sesiones). */
export async function renameConversation(id: string, title: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, error: NOT_FOUND };
  const parsedTitle = z.string().trim().min(1).max(60).safeParse(title.replace(/[<>\n\r]/g, " "));
  if (!parsedTitle.success) return { ok: false, error: "Escribe un nombre de hasta 60 caracteres." };
  const { data, error } = await ctx.supabase
    .from("conversations")
    .update({ title: parsedTitle.data })
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .select("id");
  if (error) {
    logError("actions.conversations.rename", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!data?.length) return { ok: false, error: NOT_FOUND };
  revalidatePath("/asesor", "layout");
  return { ok: true };
}

/**
 * Borra una sesión de la persona con sus mensajes (cascada). Los looks guardados se conservan:
 * su `conversation_id` queda en null. No se puede deshacer.
 */
export async function deleteConversation(id: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, error: NOT_FOUND };
  const { data, error } = await ctx.supabase
    .from("conversations")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .select("id");
  if (error) {
    logError("actions.conversations.delete", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!data?.length) return { ok: false, error: NOT_FOUND };
  revalidatePath("/asesor", "layout");
  return { ok: true };
}
