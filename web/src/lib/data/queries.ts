import "server-only";
import { cache } from "react";
import type {
  ChatMessagePart,
  ChatMessageView,
  ColorAnalysis,
  Garment,
  GarmentCategory,
  GarmentView,
  MemoryFact,
  OutfitStatus,
  OutfitView,
  Profile,
  StyleProfile,
  Weather,
} from "@/lib/domain/types";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getWeather } from "@/lib/weather";
import { logError } from "@/lib/server/log";
import { signPaths } from "./media";
import { toGarmentView } from "./mappers";
import { loadOutfitViews } from "./outfits";

// Todas las lecturas usan la sesión de la persona: RLS filtra por user_id; el filtro explícito
// por `id`/`user_id` solo evita depender de una sola capa.

const CHAT_HISTORY_LIMIT = 50;

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, city, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (error) logError("queries.getProfile", error);
  return data ?? null;
});

export async function getStyleProfile(): Promise<StyleProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data, error } = await db
    .from("style_profiles")
    .select(
      "user_id, clothing_sections, current_style, aspirational_style, occasions, fit_preferences, comfort_constraints, colors_disliked, brands_liked, brands_excluded, sizes, budget_monthly_clp, budget_per_item_clp, risk_level",
    )
    .eq("user_id", user.id)
    .maybeSingle<StyleProfile>();
  if (error) logError("queries.getStyleProfile", error);
  return data ?? null;
}

export async function getActiveColorAnalysis(): Promise<ColorAnalysis | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data, error } = await db
    .from("color_analyses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle<ColorAnalysis>();
  if (error) logError("queries.getActiveColorAnalysis", error);
  return data ?? null;
}

export async function listGarments(opts?: { category?: GarmentCategory }): Promise<GarmentView[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const db = await createClient();
  let q = db
    .from("garments")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (opts?.category) q = q.eq("category", opts.category);
  const { data, error } = await q.returns<Garment[]>();
  if (error) logError("queries.listGarments", error);
  if (!data) return [];
  const urls = await signPaths(db, data.map((g) => g.photo_path));
  return data.map((g) => toGarmentView(g, urls));
}

export async function getGarment(id: string): Promise<GarmentView | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data, error } = await db.from("garments").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Garment>();
  if (error) logError("queries.getGarment", error);
  if (!data) return null;
  const urls = await signPaths(db, [data.photo_path]);
  return toGarmentView(data, urls);
}

/** Prendas activas y reconocidas: lo que cuenta para el mínimo de outfit y la meta del onboarding. */
export async function countGarments(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  const db = await createClient();
  const { count, error } = await db
    .from("garments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null)
    .neq("status", "failed");
  if (error) logError("queries.countGarments", error);
  return count ?? 0;
}

export async function listOutfits(opts?: { status?: OutfitStatus }): Promise<OutfitView[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const db = await createClient();
  return loadOutfitViews(db, { status: opts?.status, limit: 100 });
}

export async function listMemoryFacts(): Promise<MemoryFact[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const db = await createClient();
  const { data, error } = await db
    .from("memory_facts")
    .select("id, fact, kind, source, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<MemoryFact[]>();
  if (error) logError("queries.listMemoryFacts", error);
  return data ?? [];
}

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  text: string;
  parts: ChatMessagePart[] | null;
  created_at: string;
};

/**
 * Última conversación con el hilo completo: outfits, prendas y paleta de `parts` se resuelven a sus DTO,
 * la foto de la persona a URL firmada y las respuestas rápidas solo si el último mensaje es del asistente.
 * Devuelve null si la persona no tiene conversación (el cliente inicia con `streamChat({ start: true })`).
 */
export async function getLatestConversation(): Promise<{ id: string; messages: ChatMessageView[] } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data: conv, error: convError } = await db
    .from("conversations")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (convError) logError("queries.getLatestConversation.conversation", convError);
  if (!conv) return null;

  const { data: rows, error: rowsError } = await db
    .from("messages")
    .select("id, role, text, parts, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(CHAT_HISTORY_LIMIT)
    .returns<MessageRow[]>();
  if (rowsError) logError("queries.getLatestConversation.messages", rowsError);
  const ordered = [...(rows ?? [])].reverse();
  const parts = ordered.flatMap((m) => m.parts ?? []);

  const outfitIds = [...new Set(parts.flatMap((p) => (p.type === "outfit" ? [p.outfit_id] : [])))];
  const garmentIds = [...new Set(parts.flatMap((p) => (p.type === "garment" ? [p.garment_id] : [])))];
  const paletteIds = [...new Set(parts.flatMap((p) => (p.type === "palette" ? [p.analysis_id] : [])))];
  const imagePaths = parts.flatMap((p) => (p.type === "image" ? [p.path] : []));
  const memoryIds = [...new Set(parts.flatMap((p) => (p.type === "memory" ? [p.memory_id] : [])))];

  const [outfitViews, garmentRows, paletteRows, imageUrls, liveMemoryIds] = await Promise.all([
    loadOutfitViews(db, { ids: outfitIds }),
    garmentIds.length
      ? db
          .from("garments")
          .select("*")
          .in("id", garmentIds)
          .returns<Garment[]>()
          .then((r) => {
            if (r.error) logError("queries.getLatestConversation.garments", r.error);
            return r.data ?? [];
          })
      : Promise.resolve([] as Garment[]),
    paletteIds.length
      ? db
          .from("color_analyses")
          .select("*")
          .in("id", paletteIds)
          .returns<ColorAnalysis[]>()
          .then((r) => {
            if (r.error) logError("queries.getLatestConversation.palettes", r.error);
            return r.data ?? [];
          })
      : Promise.resolve([] as ColorAnalysis[]),
    signPaths(db, imagePaths),
    // Una nota que la persona ya borró (Deshacer o desde Tu espacio) no debe reaparecer en el hilo.
    memoryIds.length
      ? db
          .from("memory_facts")
          .select("id")
          .in("id", memoryIds)
          .returns<{ id: string }[]>()
          .then((r) => {
            if (r.error) logError("queries.getLatestConversation.memory", r.error);
            return new Set((r.data ?? []).map((m) => m.id));
          })
      : Promise.resolve(new Set<string>()),
  ]);
  const garmentUrls = await signPaths(db, garmentRows.map((g) => g.photo_path));
  const outfits = new Map(outfitViews.map((o) => [o.id, o]));
  const garments = new Map(garmentRows.map((g) => [g.id, toGarmentView(g, garmentUrls)]));
  const palettes = new Map(paletteRows.map((a) => [a.id, a]));

  const lastIndex = ordered.length - 1;
  const messages: ChatMessageView[] = ordered.map((m, index) => {
    const mp = m.parts ?? [];
    const image = mp.find((p): p is Extract<ChatMessagePart, { type: "image" }> => p.type === "image");
    const quick = mp.find((p): p is Extract<ChatMessagePart, { type: "quick_replies" }> => p.type === "quick_replies");
    const paletteId = mp.find((p): p is Extract<ChatMessagePart, { type: "palette" }> => p.type === "palette")?.analysis_id;
    return {
      id: m.id,
      role: m.role,
      text: m.text,
      created_at: m.created_at,
      outfits: mp.flatMap((p) => {
        const o = p.type === "outfit" ? outfits.get(p.outfit_id) : undefined;
        return o ? [o] : [];
      }),
      garments: mp.flatMap((p) => {
        const g = p.type === "garment" ? garments.get(p.garment_id) : undefined;
        return g ? [g] : [];
      }),
      palette: paletteId ? (palettes.get(paletteId) ?? null) : null,
      image_url: image ? (imageUrls.get(image.path) ?? null) : null,
      memory_notes: mp.flatMap((p) =>
        p.type === "memory" && liveMemoryIds.has(p.memory_id) ? [{ id: p.memory_id, fact: p.fact }] : [],
      ),
      quick_replies:
        index === lastIndex && m.role === "assistant" && quick ? { options: quick.options, multiple: quick.multiple } : null,
    };
  });
  return { id: conv.id, messages };
}

/** Clima de hoy en la ciudad del perfil; null si falla (la UI lo omite). */
export async function getWeatherForProfile(): Promise<Weather | null> {
  const profile = await getProfile();
  if (!profile?.city) return null;
  return getWeather(profile.city);
}
