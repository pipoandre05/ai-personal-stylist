import "server-only";
import { logError } from "@/lib/server/log";
import type { Db } from "@/lib/server/types";

const BUCKET = "user-media";
export const SIGNED_URL_SECONDS = 60 * 60;

/** Firma en lote (1 hora). Las rutas que fallan quedan fuera del mapa: la UI muestra un marcador. */
export async function signPaths(db: Db, paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const out = new Map<string, string>();
  if (unique.length === 0) return out;
  const { data, error } = await db.storage.from(BUCKET).createSignedUrls(unique, SIGNED_URL_SECONDS);
  if (error || !data) {
    if (error) logError("media.signPaths", error);
    return out;
  }
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) out.set(item.path, item.signedUrl);
  }
  return out;
}
