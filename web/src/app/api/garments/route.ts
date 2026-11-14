import { z } from "zod";
import { track } from "@/lib/analytics";
import { normalizeGarmentVision } from "@/lib/ai/normalize";
import { describeGarment } from "@/lib/ai/vision";
import { signPaths } from "@/lib/data/media";
import { toGarmentView } from "@/lib/data/mappers";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";
import type { Garment } from "@/lib/domain/types";
import { apiError, authenticate, BAD_INPUT, INTERNAL, json, readJson, UNAUTHORIZED } from "@/lib/server/route-helpers";

// Node es el runtime por defecto; con cacheComponents `export const runtime` no está permitido.
export const maxDuration = 60;

const Body = z.object({ photo_path: z.string().max(200) });

export async function POST(request: Request) {
  const ctx = await authenticate();
  if (!ctx) return apiError(UNAUTHORIZED, 401);

  const body = Body.safeParse(await readJson(request));
  if (!body.success || !isOwnPhotoPath(body.data.photo_path, ctx.userId)) return apiError(BAD_INPUT, 400);
  const photoPath = body.data.photo_path;

  // Se inserta primero para no perder la foto si el reconocimiento falla: la persona completa a mano.
  const { data: created, error } = await ctx.supabase
    .from("garments")
    .insert({ user_id: ctx.userId, photo_path: photoPath, status: "processing" })
    .select("*")
    .single<Garment>();
  if (error || !created) return apiError(INTERNAL, 500);

  const vision = await describeGarment(ctx, photoPath);

  if (!vision.ok && vision.reason === "not_recognized") {
    await ctx.supabase.from("garments").delete().eq("id", created.id);
    return apiError(
      "No logro ver una prenda en esa foto. Prueba con una foto donde se vea la prenda completa y con buena luz.",
      422,
    );
  }

  const patch = vision.ok
    ? { ...normalizeGarmentVision(vision.data), status: "ready" as const, ai_recognition: vision.data }
    : { status: "failed" as const };
  const { data: updated, error: updateError } = await ctx.supabase
    .from("garments")
    .update(patch)
    .eq("id", created.id)
    .eq("user_id", ctx.userId)
    .select("*")
    .single<Garment>();
  const garment = updateError || !updated ? { ...created, status: "failed" as const } : updated;

  void track("garment_added", { category: garment.category, recognized: garment.status === "ready" }, ctx);

  const urls = await signPaths(ctx.supabase, [garment.photo_path]);
  return json({ garment: toGarmentView(garment, urls) }, 201);
}
