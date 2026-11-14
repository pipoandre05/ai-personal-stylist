"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics";
import type { ActionResult, OutfitRating } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";

const Id = z.string().uuid();

export async function setOutfitStatus(id: string, status: "saved" | "discarded"): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = Id.safeParse(id);
  if (!parsedId.success || (status !== "saved" && status !== "discarded")) {
    return { ok: false, error: "No encontramos ese look." };
  }
  const { data, error } = await ctx.supabase
    .from("outfits")
    .update({ status, saved_at: status === "saved" ? new Date().toISOString() : null })
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: GENERIC_ERROR };
  if (!data) return { ok: false, error: "No encontramos ese look." };
  void track(status === "saved" ? "outfit_saved" : "outfit_discarded", {}, ctx);
  revalidatePath("/looks");
  return { ok: true };
}

const Rating = z.enum(["love", "ok", "no"]);

/** Un "no" con motivo se vuelve un hecho de memoria (RF-11): así el asesor no lo repite. */
export async function rateOutfit(id: string, rating: OutfitRating, reason?: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = Id.safeParse(id);
  const parsedRating = Rating.safeParse(rating);
  if (!parsedId.success || !parsedRating.success) return { ok: false, error: "No pudimos registrar tu opinión." };
  const cleanReason = (reason ?? "").trim().slice(0, 200);

  const { data: outfit } = await ctx.supabase
    .from("outfits")
    .select("id, title")
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .maybeSingle<{ id: string; title: string }>();
  if (!outfit) return { ok: false, error: "No encontramos ese look." };

  const { error } = await ctx.supabase
    .from("outfit_feedback")
    .upsert(
      { user_id: ctx.userId, outfit_id: outfit.id, rating: parsedRating.data, reason: cleanReason },
      { onConflict: "user_id,outfit_id" },
    );
  if (error) return { ok: false, error: GENERIC_ERROR };
  void track("outfit_feedback", { rating: parsedRating.data }, ctx);

  if (parsedRating.data === "no" && cleanReason.length >= 3) {
    const fact = `No le gustó el look "${outfit.title}": ${cleanReason}`.slice(0, 280);
    const { error: factError } = await ctx.supabase
      .from("memory_facts")
      .insert({ user_id: ctx.userId, fact, kind: "dislike", source: "feedback" });
    if (!factError) void track("memory_added", { kind: "dislike" }, ctx);
    revalidatePath("/yo");
  }
  revalidatePath("/looks");
  return { ok: true };
}
