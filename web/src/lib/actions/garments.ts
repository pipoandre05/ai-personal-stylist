"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { sanitizeColors } from "@/lib/domain/palettes";
import { GARMENT_CATEGORIES, SEASONS, type ActionResult } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";

const Id = z.string().uuid();

const Patch = z.object({
  name: z.string().trim().max(80).optional(),
  category: z.enum(GARMENT_CATEGORIES).optional(),
  subcategory: z.string().trim().max(40).optional(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).max(6).optional(),
  pattern: z.string().trim().max(30).optional(),
  material: z.string().trim().max(40).optional(),
  seasons: z.array(z.enum(SEASONS)).max(3).optional(),
  occasions: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  formality: z.number().int().min(1).max(5).optional(),
  brand: z.string().trim().max(60).optional(),
});

export type GarmentPatch = z.input<typeof Patch>;

function refresh(id?: string) {
  revalidatePath("/closet");
  if (id) revalidatePath(`/closet/${id}`);
  revalidatePath("/asesor");
}

/** Corrección manual: la persona confirma la prenda, así que queda `ready` y marcada como editada. */
export async function updateGarment(id: string, patch: GarmentPatch): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = Id.safeParse(id);
  const parsed = Patch.safeParse(patch);
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Revisa los datos de la prenda." };

  const { colors, ...rest } = parsed.data;
  const update = {
    ...rest,
    ...(colors ? { colors: sanitizeColors(colors, 6) } : {}),
    status: "ready",
    user_edited: true,
  };
  const { data, error } = await ctx.supabase
    .from("garments")
    .update(update)
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: GENERIC_ERROR };
  if (!data) return { ok: false, error: "No encontramos esa prenda." };
  void track("garment_edited", {}, ctx);
  refresh(parsedId.data);
  return { ok: true };
}

export async function archiveGarment(id: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = Id.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "No encontramos esa prenda." };
  const { data, error } = await ctx.supabase
    .from("garments")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: GENERIC_ERROR };
  if (!data) return { ok: false, error: "No encontramos esa prenda." };
  refresh(parsedId.data);
  return { ok: true };
}

export async function toggleFavorite(id: string): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedId = Id.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "No encontramos esa prenda." };
  const { data: current } = await ctx.supabase
    .from("garments")
    .select("favorite")
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId)
    .maybeSingle<{ favorite: boolean }>();
  if (!current) return { ok: false, error: "No encontramos esa prenda." };
  const { error } = await ctx.supabase
    .from("garments")
    .update({ favorite: !current.favorite })
    .eq("id", parsedId.data)
    .eq("user_id", ctx.userId);
  if (error) return { ok: false, error: GENERIC_ERROR };
  refresh(parsedId.data);
  return { ok: true };
}
