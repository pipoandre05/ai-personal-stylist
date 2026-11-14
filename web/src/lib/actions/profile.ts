"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics";
import type { ActionResult, StyleProfile } from "@/lib/domain/types";
import { logError } from "@/lib/server/log";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";

const tags = z.array(z.string().trim().min(1).max(60)).max(20);

const ProfileInput = z.object({
  display_name: z.string().trim().max(60).optional(),
  city: z.string().trim().min(2, "Escribe el nombre de tu ciudad.").max(80).optional(),
  clothing_sections: tags.optional(),
  current_style: tags.optional(),
  aspirational_style: tags.optional(),
  occasions: tags.optional(),
  fit_preferences: tags.optional(),
  comfort_constraints: tags.optional(),
  colors_disliked: tags.optional(),
  brands_liked: tags.optional(),
  brands_excluded: tags.optional(),
  sizes: z.record(z.string().max(30), z.string().trim().max(30)).optional(),
  budget_monthly_clp: z.number().int().min(0).max(100_000_000).nullable().optional(),
  budget_per_item_clp: z.number().int().min(0).max(100_000_000).nullable().optional(),
  risk_level: z.number().int().min(1).max(3).nullable().optional(),
});

export type SaveProfileInput = { display_name?: string; city?: string } & Partial<Omit<StyleProfile, "user_id">>;

export async function saveProfile(input: SaveProfileInput): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsed = ProfileInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos del perfil." };

  const { display_name, city, ...style } = parsed.data;
  try {
    if (display_name !== undefined || city !== undefined) {
      const patch: Record<string, string | null> = {};
      if (display_name !== undefined) patch.display_name = display_name || null;
      if (city !== undefined) patch.city = city;
      const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", ctx.userId);
      if (error) {
    logError("actions.profile.1", error);
    return { ok: false, error: GENERIC_ERROR };
  }
    }
    if (Object.keys(style).length > 0) {
      const { error } = await ctx.supabase.from("style_profiles").upsert({ user_id: ctx.userId, ...style }, { onConflict: "user_id" });
      if (error) {
    logError("actions.profile.2", error);
    return { ok: false, error: GENERIC_ERROR };
  }
    }
  } catch (err) {
    logError("actions.profile.catch", err);
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath("/yo");
  revalidatePath("/asesor");
  return { ok: true };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", ctx.userId)
    .is("onboarding_completed_at", null);
  if (error) {
    logError("actions.profile.3", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  void track("onboarding_completed", {}, ctx);
  revalidatePath("/", "layout");
  return { ok: true };
}
