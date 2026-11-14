import "server-only";
import type { UserCtx } from "@/lib/server/types";

export const MEDIA_BUCKET = "user-media";
export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
export type LoadedImage = { mediaType: ImageMediaType; base64: string };

/** Descarga una foto de Storage con la sesión de la persona (RLS) y la deja en base64. */
export async function downloadImage(ctx: UserCtx, path: string): Promise<LoadedImage> {
  const { data, error } = await ctx.supabase.storage.from(MEDIA_BUCKET).download(path);
  if (error || !data) throw new Error("No se pudo leer la foto");
  const allowed: ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = allowed.find((t) => t === data.type) ?? "image/jpeg";
  return { mediaType, base64: Buffer.from(await data.arrayBuffer()).toString("base64") };
}
