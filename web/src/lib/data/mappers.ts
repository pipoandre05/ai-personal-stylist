// Mapeo puro de filas de Postgres a los DTO de types.ts. Sin Supabase: testeable.
import type {
  Garment,
  GarmentCategory,
  GarmentView,
  MissingPiece,
  OutfitItemView,
  OutfitRating,
  OutfitStatus,
  OutfitView,
  Weather,
} from "@/lib/domain/types";

export type GarmentRow = Garment;

/** `ai_recognition` (lo que propuso la IA, R-20) es solo del servidor: no viaja al navegador. */
export function toGarmentView(row: GarmentRow, urls: Map<string, string>): GarmentView {
  const { ai_recognition: _omit, ...rest } = row;
  void _omit;
  return { ...rest, photo_url: urls.get(row.photo_path) ?? null };
}

type Maybe<T> = T | T[] | null | undefined;
const first = <T>(v: Maybe<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export type OutfitRow = {
  id: string;
  title: string;
  occasion: string;
  rationale: string;
  status: OutfitStatus;
  weather: Weather | null;
  missing_piece: MissingPiece | null;
  created_at: string;
  outfit_items?: {
    position: number;
    garments: Maybe<{ id: string; name: string; category: GarmentCategory; photo_path: string }>;
  }[];
  outfit_feedback?: { rating: OutfitRating }[] | { rating: OutfitRating } | null;
};

export function outfitPhotoPaths(rows: OutfitRow[]): string[] {
  return rows.flatMap((r) =>
    (r.outfit_items ?? []).flatMap((i) => {
      const g = first(i.garments);
      return g ? [g.photo_path] : [];
    }),
  );
}

export function toOutfitView(row: OutfitRow, urls: Map<string, string>): OutfitView {
  const items: OutfitItemView[] = [...(row.outfit_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((i) => {
      const g = first(i.garments);
      return g
        ? [{ garment_id: g.id, name: g.name, category: g.category, photo_url: urls.get(g.photo_path) ?? null }]
        : [];
    });
  return {
    id: row.id,
    title: row.title,
    occasion: row.occasion,
    rationale: row.rationale,
    status: row.status,
    weather: row.weather ?? null,
    missing_piece: row.missing_piece ?? null,
    rating: first(row.outfit_feedback)?.rating ?? null,
    created_at: row.created_at,
    items,
  };
}

export const OUTFIT_SELECT =
  "id, title, occasion, rationale, status, weather, missing_piece, created_at, " +
  "outfit_items(position, garments(id, name, category, photo_path)), outfit_feedback(rating)";
