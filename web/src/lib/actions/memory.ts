"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import { logError } from "@/lib/server/log";

export async function deleteMemoryFact(id: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, error: "No encontramos esa nota." };
  const { error } = await ctx.supabase.from("memory_facts").delete().eq("id", parsedId.data).eq("user_id", ctx.userId);
  if (error) {
    logError("actions.memory.1", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath("/yo");
  return { ok: true };
}
