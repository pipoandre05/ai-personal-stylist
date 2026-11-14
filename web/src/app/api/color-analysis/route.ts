import { z } from "zod";
import { track } from "@/lib/analytics";
import { MEDIA_BUCKET } from "@/lib/ai/image";
import { recordConsents } from "@/lib/data/consents";
import { normalizeColorVision } from "@/lib/ai/normalize";
import { analyzeColor } from "@/lib/ai/vision";
import { logError } from "@/lib/server/log";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";
import type { ColorAnalysis } from "@/lib/domain/types";
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

  const vision = await analyzeColor(ctx, photoPath);
  // R-04: la selfie no se conserva, salga bien o mal el análisis.
  const removal = await ctx.supabase.storage.from(MEDIA_BUCKET).remove([photoPath]);
  if (removal.error) logError("api.color_analysis.remove_selfie", removal.error);
  if (!vision.ok) {
    return vision.reason === "not_recognized"
      ? apiError("No logro ver bien tu rostro en esa foto. Prueba con una selfie de frente, con luz natural y sin filtros.", 422)
      : apiError("No pude analizar la foto ahora. Intenta de nuevo en un momento.", 502);
  }
  const fields = normalizeColorVision(vision.data);

  // Una sola paleta activa por persona (índice único parcial): se desactiva la anterior y, si falla el insert, se restituye.
  const { data: previous } = await ctx.supabase
    .from("color_analyses")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("is_active", true)
    .maybeSingle<{ id: string }>();
  if (previous) {
    const { error } = await ctx.supabase.from("color_analyses").update({ is_active: false }).eq("id", previous.id);
    if (error) {
      logError("api.color_analysis.deactivate", error);
      return apiError(INTERNAL, 500);
    }
  }

  const { data: analysis, error } = await ctx.supabase
    .from("color_analyses")
    .insert({ user_id: ctx.userId, photo_path: null, ...fields, source: "ai", is_active: true })
    .select("*")
    .single<ColorAnalysis>();
  if (error || !analysis) {
    logError("api.color_analysis.insert", error ?? "sin datos");
    if (previous) {
      const { error: restoreError } = await ctx.supabase.from("color_analyses").update({ is_active: true }).eq("id", previous.id);
      if (restoreError) logError("api.color_analysis.restore", restoreError);
    }
    return apiError(INTERNAL, 500);
  }

  await recordConsents(ctx, ["face_photo"]);
  void track("color_analysis_completed", { confidence: analysis.confidence }, ctx);
  return json({ analysis }, 201);
}
