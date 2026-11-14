"use server";

import { revalidatePath } from "next/cache";
import { track } from "@/lib/analytics";
import { paletteForSeason } from "@/lib/domain/palettes";
import { COLOR_SEASONS, type ActionResult, type ColorSeason } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import { logError } from "@/lib/server/log";

/** Corrección manual de la paleta: paleta predefinida de la estación, `source: 'manual'`. */
export async function setManualColorSeason(season: ColorSeason): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  if (!COLOR_SEASONS.includes(season)) return { ok: false, error: "Elige una de las cuatro estaciones." };
  const palette = paletteForSeason(season);

  const { data: previous, error: previousError } = await ctx.supabase
    .from("color_analyses")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("is_active", true)
    .maybeSingle<{ id: string }>();
  if (previousError) logError("actions.color.read_previous", previousError);
  if (previous) {
    const { error } = await ctx.supabase.from("color_analyses").update({ is_active: false }).eq("id", previous.id);
    if (error) {
      logError("actions.color.deactivate", error);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  const { error } = await ctx.supabase.from("color_analyses").insert({
    user_id: ctx.userId,
    photo_path: null,
    season,
    undertone: palette.undertone,
    contrast: palette.contrast,
    confidence: "media",
    lighting_ok: true,
    recommended: palette.recommended,
    neutrals: palette.neutrals,
    avoid: palette.avoid,
    rationale: palette.rationale,
    source: "manual",
    is_active: true,
  });
  if (error) {
    logError("actions.color.insert", error);
    if (previous) {
      const { error: restoreError } = await ctx.supabase.from("color_analyses").update({ is_active: true }).eq("id", previous.id);
      if (restoreError) logError("actions.color.restore", restoreError);
    }
    return { ok: false, error: GENERIC_ERROR };
  }
  void track("color_palette_corrected", { season }, ctx);
  revalidatePath("/yo");
  revalidatePath("/yo/paleta");
  revalidatePath("/asesor");
  return { ok: true };
}
