import "server-only";
import { cache } from "react";
import type {
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
import { displayTitle } from "@/lib/domain/conversation-title";
import { isOnboardingComplete } from "@/lib/domain/profile-completeness";
import type { ConversationSummary } from "@/lib/domain/types";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getWeather } from "@/lib/weather";
import { logError } from "@/lib/server/log";
import { signPaths } from "./media";
import { toGarmentView } from "./mappers";
import { loadOutfitViews } from "./outfits";
import { assembleThread, type ThreadRow } from "./thread";

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

type MessageRow = ThreadRow;

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
  return { id: conv.id, messages: await loadThread(db, conv.id) };
}

/** Una sesión de la persona con su hilo completo. null si no existe o no es suya (RLS y filtro por user_id). */
export async function getConversation(id: string): Promise<{ id: string; title: string; messages: ChatMessageView[] } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const db = await createClient();
  const { data: conv, error } = await db
    .from("conversations")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; title: string }>();
  if (error) logError("queries.getConversation", error);
  if (!conv) return null;
  return { id: conv.id, title: displayTitle(conv.title), messages: await loadThread(db, conv.id) };
}

/** Sesiones de la persona, de la más reciente a la más antigua (panel de sesiones). Máximo 50. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const db = await createClient();
  const { data, error } = await db
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50)
    .returns<{ id: string; title: string; updated_at: string }[]>();
  if (error) logError("queries.listConversations", error);
  return (data ?? []).map((c) => ({ id: c.id, title: displayTitle(c.title), updated_at: c.updated_at }));
}

/** true si a la persona le falta su perfil inicial: en ese caso /asesor abre con el asesor hablando primero. */
export async function needsOnboarding(): Promise<boolean> {
  const [profile, style] = await Promise.all([getProfile(), getStyleProfile()]);
  if (!profile) return false; // sin sesión no hay nada que iniciar
  return !isOnboardingComplete(profile, style);
}

/** Hilo de una conversación ya verificada como propia: resuelve `parts` a sus DTO y firma las fotos. */
async function loadThread(db: Awaited<ReturnType<typeof createClient>>, conversationId: string): Promise<ChatMessageView[]> {
  const { data: rows, error: rowsError } = await db
    .from("messages")
    .select("id, role, text, parts, created_at")
    .eq("conversation_id", conversationId)
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
  const messages = assembleThread(ordered, {
    outfits: new Map(outfitViews.map((o) => [o.id, o])),
    garments: new Map(garmentRows.map((g) => [g.id, toGarmentView(g, garmentUrls)])),
    palettes: new Map(paletteRows.map((a) => [a.id, a])),
    imageUrls,
    liveMemoryIds,
  });
  return messages;
}

/** Clima de hoy en la ciudad del perfil; null si falla (la UI lo omite). */
export async function getWeatherForProfile(): Promise<Weather | null> {
  const profile = await getProfile();
  if (!profile?.city) return null;
  return getWeather(profile.city);
}
