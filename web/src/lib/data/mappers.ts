// Mapeo puro de filas de Postgres a los DTO de types.ts. Sin Supabase: testeable.
import type {
  Garment,
  OutfitEvidence,
  OutfitVariant,
  ProductOption,
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

/**
 * La migración 20261114010000 agregó FK compuestas (id, user_id) además de las simples: PostgREST ve dos
 * relaciones entre las mismas tablas (PGRST201) y no sabe cuál embeber. Cada embed nombra su restricción.
 */
export const OUTFIT_SELECT =
  "id, title, occasion, rationale, status, weather, missing_piece, created_at, " +
  "outfit_items!outfit_items_outfit_id_fkey(position, garments!outfit_items_garment_id_fkey(id, name, category, photo_path)), " +
  "outfit_feedback!outfit_feedback_outfit_id_fkey(rating)";

/** Columnas de la migración 20261114020000 (opcionales: pueden no existir todavía). */
export type OutfitExtrasRow = {
  id: string;
  variant: OutfitVariant | null;
  pair_id: string | null;
  evidence: OutfitEvidence[] | null;
  selected_option: ProductOption | null;
};

/** Suma al look lo que guardó la migración nueva; sin fila, el look queda como estaba. */
export function withOutfitExtras(view: OutfitView, extras: OutfitExtrasRow | undefined): OutfitView {
  if (!extras) return view;
  return {
    ...view,
    ...(extras.evidence ? { evidence: extras.evidence } : {}),
    variant: extras.variant ?? null,
    pair_id: extras.pair_id ?? null,
    selected_option: extras.selected_option ?? null,
  };
}
