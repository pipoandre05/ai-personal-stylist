import "server-only";
import { track } from "@/lib/analytics";
import { describeGarment, analyzeColor } from "@/lib/ai/vision";
import { normalizeColorVision, normalizeGarmentVision } from "@/lib/ai/normalize";
import { MEDIA_BUCKET } from "@/lib/ai/image";
import { recordConsents } from "@/lib/data/consents";
import { signPaths } from "@/lib/data/media";
import { toGarmentView } from "@/lib/data/mappers";
import { loadOutfitViews } from "@/lib/data/outfits";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";
import { isOnboardingComplete, missingProfileFields } from "@/lib/domain/profile-completeness";
import {
  GetClosetInput,
  GetWeatherInput,
  ImagePathInput,
  ProposeOutfitInput,
  RememberInput,
  SuggestRepliesInput,
  UpdateProfileInput,
} from "./tool-defs";
import { validateOutfitComposition } from "@/lib/domain/outfit-rules";
import {
  type AgentToolName,
  type ChatEvent,
  type ColorAnalysis,
  type Garment,
  type GarmentView,
  type QuickReplies,
  type Profile,
  type StyleProfile,
  type GarmentCategory,
  type MissingPiece,
  type Weather,
} from "@/lib/domain/types";
import type { UserCtx } from "@/lib/server/types";
import { getWeather } from "@/lib/weather";

/** Estado mutable de un turno del agente. */
export type ToolState = {
  weather: Weather | null;
  outfitIds: string[];
  garmentIds: string[];
  paletteId: string | null;
  quickReplies: QuickReplies | null;
  /** Fotos del mensaje actual o recientes: las únicas que `add_garment` y `analyze_palette` aceptan. */
  allowedImages: Set<string>;
};

export function newToolState(allowedImages: Iterable<string> = []): ToolState {
  return {
    weather: null,
    outfitIds: [],
    garmentIds: [],
    paletteId: null,
    quickReplies: null,
    allowedImages: new Set(allowedImages),
  };
}

export type ToolContext = {
  ctx: UserCtx;
  conversationId: string;
  city: string; // puede cambiar si update_profile guarda otra ciudad
  emit: (event: ChatEvent) => void;
  state: ToolState;
};

export type ToolOutput = { content: string; isError: boolean };

const ok = (value: unknown): ToolOutput => ({ content: JSON.stringify(value), isError: false });
const fail = (message: string): ToolOutput => ({ content: message, isError: true });

// --- Ejecutores ---

export type ClosetItem = {
  id: string;
  name: string;
  category: GarmentCategory;
  subcategory: string;
  colors: string[];
  pattern: string;
  formality: number;
  seasons: string[];
  occasions: string[];
  favorite: boolean;
};

export async function fetchCloset(
  ctx: UserCtx,
  filter: { category?: GarmentCategory; occasion?: string } = {},
): Promise<ClosetItem[]> {
  let q = ctx.supabase
    .from("garments")
    .select("id, name, category, subcategory, colors, pattern, formality, seasons, occasions, favorite")
    .eq("user_id", ctx.userId)
    .is("archived_at", null)
    .eq("status", "ready")
    .order("favorite", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(150);
  if (filter.category) q = q.eq("category", filter.category);
  const { data, error } = await q.returns<(Omit<Garment, "colors"> & { colors: { name: string }[] })[]>();
  if (error || !data) throw new Error("closet");
  const occasion = filter.occasion?.trim().toLowerCase();
  return data
    .filter((g) => !occasion || g.occasions.some((o) => o.toLowerCase().includes(occasion)))
    .map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      subcategory: g.subcategory,
      colors: g.colors.map((c) => c.name),
      pattern: g.pattern,
      formality: g.formality,
      seasons: g.seasons,
      occasions: g.occasions,
      favorite: g.favorite,
    }));
}

async function execGetCloset(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = GetClosetInput.safeParse(input);
  if (!parsed.success) return fail("Entrada inválida para get_closet.");
  try {
    const garments = await fetchCloset(t.ctx, parsed.data);
    if (garments.length === 0) {
      return ok({ count: 0, garments: [], note: "El clóset no tiene prendas para ese filtro." });
    }
    return ok({ count: garments.length, garments });
  } catch {
    return fail("No pude leer el clóset ahora. Intenta de nuevo o responde sin él.");
  }
}

async function execGetWeather(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = GetWeatherInput.safeParse(input);
  if (!parsed.success) return fail("La fecha debe tener formato YYYY-MM-DD.");
  const weather = await getWeather(t.city, parsed.data.date);
  if (!weather) {
    return ok({ available: false, note: "No hay pronóstico disponible; sigue sin clima y no lo menciones como problema." });
  }
  t.state.weather = weather;
  return ok({ available: true, ...weather });
}

async function execProposeOutfit(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = ProposeOutfitInput.safeParse(input);
  if (!parsed.success) {
    return fail("Entrada inválida: revisa que garment_ids sean id de get_closet y que la explicación tenga al menos 20 caracteres.");
  }
  const { title, occasion, garment_ids, rationale, missing_piece } = parsed.data;
  const { supabase, userId } = t.ctx;

  const { data: owned, error } = await supabase
    .from("garments")
    .select("id, category")
    .eq("user_id", userId)
    .is("archived_at", null)
    .eq("status", "ready")
    .in("id", garment_ids)
    .returns<Pick<Garment, "id" | "category">[]>();
  if (error) return fail("No pude validar las prendas ahora. Intenta de nuevo.");

  const found = new Set((owned ?? []).map((g) => g.id));
  const unknown = garment_ids.filter((id) => !found.has(id));
  if (unknown.length > 0) {
    return fail(`Estas prendas no existen en el clóset de la persona: ${unknown.join(", ")}. Usa solo id devueltos por get_closet.`);
  }

  // Se valida en el mismo orden que pidió el modelo para que detecte repetidos.
  const byId = new Map((owned ?? []).map((g) => [g.id, g]));
  const ordered = garment_ids.map((id) => byId.get(id) as Pick<Garment, "id" | "category">);
  const rule = validateOutfitComposition(ordered);
  if (!rule.ok) return fail(rule.reason);

  const piece: MissingPiece | null = missing_piece ?? null;
  const { data: outfit, error: insertError } = await supabase
    .from("outfits")
    .insert({
      user_id: userId,
      conversation_id: t.conversationId,
      title,
      occasion,
      rationale,
      weather: t.state.weather,
      missing_piece: piece,
      status: "proposed",
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !outfit) return fail("No pude guardar el look ahora. Intenta de nuevo.");

  const { error: itemsError } = await supabase.from("outfit_items").insert(
    garment_ids.map((garment_id, position) => ({ outfit_id: outfit.id, garment_id, user_id: userId, position })),
  );
  if (itemsError) {
    await supabase.from("outfits").delete().eq("id", outfit.id);
    return fail("No pude guardar el look ahora. Intenta de nuevo.");
  }

  const [view] = await loadOutfitViews(supabase, { ids: [outfit.id] });
  if (view) t.emit({ type: "outfit", outfit: view });
  t.state.outfitIds.push(outfit.id);
  void track("outfit_proposed", { occasion, items: garment_ids.length }, t.ctx);

  return ok({
    ok: true,
    outfit_id: outfit.id,
    note: "El look ya se muestra a la persona con sus fotos. No repitas la lista de prendas: explica el porqué en 2 a 4 frases.",
  });
}

async function execRemember(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = RememberInput.safeParse(input);
  if (!parsed.success) return fail("El hecho debe tener entre 3 y 280 caracteres y un kind válido.");
  const { fact, kind } = parsed.data;
  const { supabase, userId } = t.ctx;

  const { data: dup } = await supabase
    .from("memory_facts")
    .select("id")
    .eq("user_id", userId)
    .eq("fact", fact)
    .limit(1)
    .maybeSingle();
  if (dup) return ok({ ok: true, note: "Ya lo tenía anotado." });

  const { error } = await supabase.from("memory_facts").insert({ user_id: userId, fact, kind, source: "chat" });
  if (error) return fail("No pude guardar la nota ahora. Sigue sin ella.");
  t.emit({ type: "memory", fact });
  void track("memory_added", { kind }, t.ctx);
  return ok({ ok: true });
}


async function countReadyGarments(t: ToolContext): Promise<number> {
  const { count } = await t.ctx.supabase
    .from("garments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", t.ctx.userId)
    .is("archived_at", null)
    .eq("status", "ready");
  return count ?? 0;
}

function checkImagePath(input: unknown, t: ToolContext): { path: string } | { error: ToolOutput } {
  const parsed = ImagePathInput.safeParse(input);
  const path = parsed.success ? parsed.data.image_path : "";
  if (!isOwnPhotoPath(path, t.ctx.userId) || !t.state.allowedImages.has(path)) {
    return { error: fail("Esa foto no está en la conversación. Pídele a la persona que la envíe de nuevo.") };
  }
  return { path };
}

async function execUpdateProfile(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = UpdateProfileInput.safeParse(input);
  if (!parsed.success) return fail("Datos de perfil inválidos: revisa los largos y que los arreglos sean de texto.");
  const { display_name, city, ...style } = parsed.data;
  const keys = Object.keys(parsed.data);
  if (keys.length === 0) return fail("No enviaste ningún campo para guardar.");
  const { supabase, userId } = t.ctx;

  if (display_name !== undefined || city !== undefined) {
    const patch: Record<string, string> = {};
    if (display_name !== undefined) patch.display_name = display_name;
    if (city !== undefined) patch.city = city;
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) return fail("No pude guardar el perfil ahora. Intenta de nuevo.");
    if (city !== undefined) t.city = city;
  }
  if (Object.keys(style).length > 0) {
    const { error } = await supabase.from("style_profiles").upsert({ user_id: userId, ...style }, { onConflict: "user_id" });
    if (error) return fail("No pude guardar el perfil ahora. Intenta de nuevo.");
  }

  const [{ data: profile }, { data: styleRow }] = await Promise.all([
    supabase.from("profiles").select("display_name, onboarding_completed_at").eq("id", userId).maybeSingle<Pick<Profile, "display_name" | "onboarding_completed_at">>(),
    supabase.from("style_profiles").select("*").eq("user_id", userId).maybeSingle<StyleProfile>(),
  ]);
  const missing = missingProfileFields(profile, styleRow);

  // Perfil mínimo listo: se cierra el onboarding y se registran los consentimientos (R-03).
  let onboardingCompleted = Boolean(profile?.onboarding_completed_at);
  if (!onboardingCompleted && isOnboardingComplete(profile, styleRow)) {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", userId)
      .is("onboarding_completed_at", null);
    if (!error) {
      onboardingCompleted = true;
      await recordConsents(t.ctx, ["terms", "photo_processing"]);
      void track("onboarding_completed", {}, t.ctx);
    }
  }
  void track("onboarding_step_completed", { step: keys.join(",") }, t.ctx);
  return ok({ saved: keys, perfil_incompleto: missing, onboarding_completo: onboardingCompleted });
}

async function execAddGarment(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const checked = checkImagePath(input, t);
  if ("error" in checked) return checked.error;
  const { supabase, userId } = t.ctx;

  const { data: existing } = await supabase
    .from("garments")
    .select("id, name")
    .eq("user_id", userId)
    .eq("photo_path", checked.path)
    .limit(1)
    .maybeSingle<{ id: string; name: string }>();
  if (existing) {
    return ok({ ok: true, garment_id: existing.id, name: existing.name, note: "Esa foto ya estaba en el clóset." });
  }

  const vision = await describeGarment(t.ctx, checked.path);
  if (!vision.ok) {
    return fail(
      vision.reason === "not_recognized"
        ? "En la foto no se ve una prenda. Pídele una foto de la prenda completa, sobre una superficie lisa y con buena luz."
        : "No pude reconocer la prenda ahora. Pídele que la envíe de nuevo en un momento.",
    );
  }
  const fields = normalizeGarmentVision(vision.data);
  const { data: garment, error } = await supabase
    .from("garments")
    .insert({ user_id: userId, photo_path: checked.path, ...fields, status: "ready", ai_recognition: vision.data })
    .select("*")
    .single<Garment>();
  if (error || !garment) return fail("No pude guardar la prenda ahora. Intenta de nuevo.");

  const urls = await signPaths(supabase, [garment.photo_path]);
  const view: GarmentView = toGarmentView(garment, urls);
  t.emit({ type: "garment", garment: view });
  t.state.garmentIds.push(garment.id);
  void track("garment_added", { category: garment.category, recognized: true }, t.ctx);

  return ok({
    ok: true,
    garment_id: garment.id,
    name: garment.name,
    category: garment.category,
    colors: fields.colors.map((c) => c.name),
    prendas_listas: await countReadyGarments(t),
  });
}

async function execAnalyzePalette(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const checked = checkImagePath(input, t);
  if ("error" in checked) return checked.error;
  const { supabase, userId } = t.ctx;

  const vision = await analyzeColor(t.ctx, checked.path);
  if (!vision.ok) {
    return fail(
      vision.reason === "not_recognized"
        ? "En la foto no se ve un rostro con claridad. Pídele una selfie de frente, con luz natural y sin filtros."
        : "No pude analizar la foto ahora. Pídele que la envíe de nuevo en un momento.",
    );
  }
  const fields = normalizeColorVision(vision.data);

  const { data: previous } = await supabase
    .from("color_analyses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<{ id: string }>();
  if (previous) {
    const { error } = await supabase.from("color_analyses").update({ is_active: false }).eq("id", previous.id);
    if (error) return fail("No pude guardar la paleta ahora. Intenta de nuevo.");
  }
  // R-04: la selfie no se conserva, así que `photo_path` queda nulo.
  const { data: analysis, error } = await supabase
    .from("color_analyses")
    .insert({ user_id: userId, photo_path: null, ...fields, source: "ai", is_active: true })
    .select("*")
    .single<ColorAnalysis>();
  if (error || !analysis) {
    if (previous) await supabase.from("color_analyses").update({ is_active: true }).eq("id", previous.id);
    return fail("No pude guardar la paleta ahora. Intenta de nuevo.");
  }

  const removal = await supabase.storage.from(MEDIA_BUCKET).remove([checked.path]);
  if (removal.error) console.error("[palette] no se pudo borrar la selfie");
  await recordConsents(t.ctx, ["face_photo"]);

  t.emit({ type: "palette", analysis });
  t.state.paletteId = analysis.id;
  void track("color_analysis_completed", { confidence: analysis.confidence }, t.ctx);
  return ok({
    ok: true,
    season: analysis.season,
    confidence: analysis.confidence,
    lighting_ok: analysis.lighting_ok,
    note: "La paleta ya se muestra en la conversación y la foto fue borrada. Explícala como orientación, no como diagnóstico.",
  });
}

async function execSuggestReplies(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = SuggestRepliesInput.safeParse(input);
  if (!parsed.success) return fail("Envía entre 2 y 6 opciones de hasta 40 caracteres.");
  const replies: QuickReplies = { options: parsed.data.options, multiple: parsed.data.multiple ?? false };
  t.state.quickReplies = replies;
  t.emit({ type: "quick_replies", ...replies });
  return ok({ ok: true, note: "Las opciones ya se muestran. No las repitas en el texto." });
}

const EXECUTORS: Record<AgentToolName, (input: unknown, t: ToolContext) => Promise<ToolOutput>> = {
  get_closet: execGetCloset,
  get_weather: execGetWeather,
  propose_outfit: execProposeOutfit,
  remember: execRemember,
  update_profile: execUpdateProfile,
  add_garment: execAddGarment,
  analyze_palette: execAnalyzePalette,
  suggest_replies: execSuggestReplies,
};

/** Herramientas sin estado visible: no emiten eventos `tool`. */
const SILENT_TOOLS: ReadonlySet<AgentToolName> = new Set(["suggest_replies"]);

export function isAgentToolName(name: string): name is AgentToolName {
  return name in EXECUTORS;
}

/** Ejecuta una herramienta y emite los eventos `tool` de inicio y fin. Nunca lanza. */
export async function runTool(name: string, input: unknown, t: ToolContext): Promise<ToolOutput> {
  if (!isAgentToolName(name)) return fail(`Herramienta desconocida: ${name}.`);
  const visible = !SILENT_TOOLS.has(name);
  if (visible) t.emit({ type: "tool", name, status: "start" });
  try {
    return await EXECUTORS[name](input, t);
  } catch {
    return fail("La herramienta falló. Sigue sin ella.");
  } finally {
    if (visible) t.emit({ type: "tool", name, status: "end" });
  }
}
