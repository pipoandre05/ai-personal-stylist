import "server-only";
import type { OutfitStatus, OutfitView } from "@/lib/domain/types";
import type { Db } from "@/lib/server/types";
import { logError } from "@/lib/server/log";
import { signPaths } from "./media";
import { OUTFIT_SELECT, outfitPhotoPaths, toOutfitView, withOutfitExtras, type OutfitExtrasRow, type OutfitRow } from "./mappers";
import { EXTRAS_COLUMNS, extrasAvailable, markExtrasMissing } from "./outfit-extras";

/**
 * Columnas de la migración 20261114020000 (variante, par, evidencia, opción elegida). Se leen aparte: si la migración
 * todavía no está aplicada la consulta falla, se registra una vez y el look se entrega sin esos campos.
 */
async function loadExtras(db: Db, ids: string[]): Promise<Map<string, OutfitExtrasRow>> {
  const out = new Map<string, OutfitExtrasRow>();
  if (ids.length === 0 || !extrasAvailable()) return out;
  const { data, error } = await db.from("outfits").select(`id, ${EXTRAS_COLUMNS}`).in("id", ids).returns<OutfitExtrasRow[]>();
  if (error) {
    markExtrasMissing(error);
    return out;
  }
  for (const row of data ?? []) out.set(row.id, row);
  return out;
}

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
  const [urls, extras] = await Promise.all([signPaths(db, outfitPhotoPaths(data)), loadExtras(db, data.map((r) => r.id))]);
  return data.map((row) => withOutfitExtras(toOutfitView(row, urls), extras.get(row.id)));
}
