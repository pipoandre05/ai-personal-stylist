import "server-only";
import type { OutfitStatus, OutfitView } from "@/lib/domain/types";
import type { Db } from "@/lib/server/types";
import { logError } from "@/lib/server/log";
import { signPaths } from "./media";
import { OUTFIT_SELECT, outfitPhotoPaths, toOutfitView, type OutfitRow } from "./mappers";

/** Carga outfits con prendas y calificación, y firma las fotos en un solo lote. */
export async function loadOutfitViews(
  db: Db,
  filter: { ids?: string[]; status?: OutfitStatus; limit?: number },
): Promise<OutfitView[]> {
  if (filter.ids && filter.ids.length === 0) return [];
  let q = db.from("outfits").select(OUTFIT_SELECT).order("created_at", { ascending: false });
  if (filter.ids) q = q.in("id", filter.ids);
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.limit) q = q.limit(filter.limit);
  const { data, error } = await q.returns<OutfitRow[]>();
  if (error || !data) {
    logError("data.loadOutfitViews", error ?? "sin datos");
    return [];
  }
  const urls = await signPaths(db, outfitPhotoPaths(data));
  return data.map((row) => toOutfitView(row, urls));
}
