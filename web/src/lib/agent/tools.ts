import "server-only";
import { track } from "@/lib/analytics";
import { logError } from "@/lib/server/log";
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
  OfferSearchInput,
  ProposeOutfitInput,
  RememberInput,
  SearchProductsInput,
  SetEventSummaryInput,
  SuggestRepliesInput,
  UpdateProfileInput,
} from "./tool-defs";
import { checkPairVariant, validateOutfitComposition } from "@/lib/domain/outfit-rules";
import {
  type AgentToolName,
  type ChatEvent,
  type ChatIntent,
  type ColorAnalysis,
  type EventSummary,
  type Garment,
  type GarmentView,
  type OutfitVariant,
  type QuickReplies,
  type Profile,
  type SearchOffer,
  type ShoppingOptionsBlock,
  type StyleProfile,
  type GarmentCategory,
  type MissingPiece,
  type NamedColor,
  type Weather,
} from "@/lib/domain/types";
import type { UserCtx } from "@/lib/server/types";
import { FORECAST_DAYS_AHEAD, getWeather } from "@/lib/weather";
import { buildEvidence } from "@/lib/domain/evidence";
import { emptyEventSummary, mergeEvent, needsWeatherRefresh, shortDateLabel, weatherForSummary } from "@/lib/domain/event-summary";
import type { ResolvedIntent } from "@/lib/domain/intents";
import { buildOfferActions, buildOutfitRefinements, buildSearchRefinements } from "@/lib/domain/refinements";
import { authorizeSearch, effectiveBudget, finalizeOptions } from "@/lib/domain/shopping";
import { closetStepInfo, finishedStep, runningStep, type StepInfo } from "@/lib/domain/steps";
import { getProductSearch } from "@/lib/shopping";
import { extrasAvailable, markExtrasMissing } from "@/lib/data/outfit-extras";
import { todayInSantiago } from "@/lib/format";

/** Estado mutable de un turno del agente. */
export type ToolState = {
  weather: Weather | null;
  outfitIds: string[];
  garmentIds: string[];
  paletteId: string | null;
  quickReplies: QuickReplies | null;
  /** Fotos del mensaje actual o recientes: las únicas que `add_garment` y `analyze_palette` aceptan. */
  allowedImages: Set<string>;
  // --- Contrato v2 ---
  /** Lo que se sabe del evento (del hilo al empezar el turno; `set_event_summary` lo actualiza). */
  event: EventSummary | null;
  /** Botón que tocó la persona en este turno, verificado por el servidor. */
  intent: ResolvedIntent | null;
  /** Botones recientes de la persona en la conversación (el actual incluido). */
  intents: ChatIntent[];
  /** Mensajes recientes de la persona, los más nuevos primero (para verificar que pidió buscar). */
  recentUserTexts: string[];
  stepSeq: number;
  /** Última revisión del clóset: sirve para marcar qué prendas eligió el asesor. */
  closet: { stepId: string; garments: ClosetItem[] } | null;
  chosenGarmentIds: Set<string>;
  /** Par de looks en curso (seguro + atrevido) de este turno. */
  pair: { id: string; looks: { variant: OutfitVariant; garmentIds: string[] }[] } | null;
  proposals: Map<string, { title: string; missing_piece: MissingPiece | null }>;
  offeredOutfits: Set<string>;
  /** Paleta activa, cargada una sola vez por turno (`undefined` = todavía no se pidió). */
  palette?: Pick<ColorAnalysis, "recommended" | "neutrals" | "confidence"> | null;
};

export type ToolStateInit = Partial<Pick<ToolState, "event" | "intent" | "intents" | "recentUserTexts">>;

export function newToolState(allowedImages: Iterable<string> = [], init: ToolStateInit = {}): ToolState {
  return {
    weather: null,
    outfitIds: [],
    garmentIds: [],
    paletteId: null,
    quickReplies: null,
    allowedImages: new Set(allowedImages),
    event: init.event ?? null,
    intent: init.intent ?? null,
    intents: init.intents ?? (init.intent ? [init.intent.intent] : []),
    recentUserTexts: init.recentUserTexts ?? [],
    stepSeq: 0,
    closet: null,
    chosenGarmentIds: new Set(),
    pair: null,
    proposals: new Map(),
    offeredOutfits: new Set(),
  };
}

export type ToolContext = {
  ctx: UserCtx;
  conversationId: string;
  city: string; // puede cambiar si update_profile guarda otra ciudad
  emit: (event: ChatEvent) => void;
  state: ToolState;
  /** Id del paso de trabajo de la herramienta que se está ejecutando (lo asigna `runTool`). */
  stepId?: string;
};

export type ToolOutput = { content: string; isError: boolean; step?: StepInfo };

const ok = (value: unknown, step?: StepInfo): ToolOutput => ({ content: JSON.stringify(value), isError: false, ...(step ? { step } : {}) });
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
  if (error || !data) {
    logError("tools.fetchCloset", error ?? "sin datos");
    throw new Error("closet");
  }
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
    if (t.stepId) t.state.closet = { stepId: t.stepId, garments };
    const info = closetStepInfo(garments, { weather: t.state.weather, event: t.state.event }, t.state.chosenGarmentIds);
    if (garments.length === 0) {
      return ok({ count: 0, garments: [], note: "El clóset no tiene prendas para ese filtro." }, info);
    }
    return ok({ count: garments.length, garments }, info);
  } catch (err) {
    logError("tools.get_closet", err);
    return fail("No pude leer el clóset ahora. Intenta de nuevo o responde sin él.");
  }
}

async function execGetWeather(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = GetWeatherInput.safeParse(input);
  if (!parsed.success) return fail("La fecha debe tener formato YYYY-MM-DD.");
  const place = parsed.data.place ?? t.state.event?.place ?? t.city;
  const date = parsed.data.date ?? t.state.event?.date ?? undefined;
  const weather = await getWeather(place, date);
  if (!weather) {
    return ok(
      { available: false, note: "No hay pronóstico disponible; sigue sin clima y no lo menciones como problema." },
      { label_done: `Miré el clima en ${place}`, detail: "Sin pronóstico para esa fecha" },
    );
  }
  t.state.weather = weather;
  return ok({ available: true, ...weather }, { label_done: `Miré el clima en ${place}`, detail: weather.summary[0].toUpperCase() + weather.summary.slice(1) });
}

type OwnedGarment = Pick<Garment, "id" | "category" | "name" | "subcategory" | "colors">;

async function activePalette(t: ToolContext) {
  if (t.state.palette !== undefined) return t.state.palette;
  const { data, error } = await t.ctx.supabase
    .from("color_analyses")
    .select("recommended, neutrals, confidence")
    .eq("user_id", t.ctx.userId)
    .eq("is_active", true)
    .maybeSingle<Pick<ColorAnalysis, "recommended" | "neutrals" | "confidence">>();
  if (error) logError("tools.activePalette", error);
  t.state.palette = data ?? null;
  return t.state.palette;
}

/** Guarda variante, par y evidencia en las columnas de la migración 20261114020000; sin ella, se omite y se avisa una vez. */
async function saveOutfitExtras(t: ToolContext, outfitId: string, extras: Record<string, unknown>): Promise<void> {
  if (!extrasAvailable()) return;
  const { error } = await t.ctx.supabase.from("outfits").update(extras).eq("id", outfitId).eq("user_id", t.ctx.userId);
  if (error) markExtrasMissing(error);
}

async function execProposeOutfit(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = ProposeOutfitInput.safeParse(input);
  if (!parsed.success) {
    return fail("Entrada inválida: revisa que garment_ids sean id de get_closet y que la explicación tenga al menos 20 caracteres.");
  }
  const { title, occasion, garment_ids, rationale, missing_piece, variant } = parsed.data;
  const { supabase, userId } = t.ctx;

  const { data: owned, error } = await supabase
    .from("garments")
    .select("id, category, name, subcategory, colors")
    .eq("user_id", userId)
    .is("archived_at", null)
    .eq("status", "ready")
    .in("id", garment_ids)
    .returns<OwnedGarment[]>();
  if (error) {
    logError("tools.propose_outfit.validate", error);
    return fail("No pude validar las prendas ahora. Intenta de nuevo.");
  }

  const found = new Set((owned ?? []).map((g) => g.id));
  const unknown = garment_ids.filter((id) => !found.has(id));
  if (unknown.length > 0) {
    return fail(`Estas prendas no existen en el clóset de la persona: ${unknown.join(", ")}. Usa solo id devueltos por get_closet.`);
  }

  // Se valida en el mismo orden que pidió el modelo para que detecte repetidos.
  const byId = new Map((owned ?? []).map((g) => [g.id, g]));
  const ordered = garment_ids.map((id) => byId.get(id) as OwnedGarment);
  const rule = validateOutfitComposition(ordered);
  if (!rule.ok) return fail(rule.reason);

  // Dos looks para elegir (D-04): el segundo debe ser el otro de la variante y diferir en al menos dos prendas.
  if (variant) {
    const pairCheck = checkPairVariant(t.state.pair?.looks ?? [], variant, garment_ids);
    if (!pairCheck.ok) return fail(pairCheck.reason);
  }
  const pairId = variant ? (t.state.pair?.id ?? crypto.randomUUID()) : null;

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
  if (insertError || !outfit) {
    logError("tools.propose_outfit.insert_outfit", insertError ?? "sin datos");
    return fail("No pude guardar el look ahora. Intenta de nuevo.");
  }

  const { error: itemsError } = await supabase.from("outfit_items").insert(
    garment_ids.map((garment_id, position) => ({ outfit_id: outfit.id, garment_id, user_id: userId, position })),
  );
  if (itemsError) {
    logError("tools.propose_outfit.insert_items", itemsError);
    const { error: cleanupError } = await supabase.from("outfits").delete().eq("id", outfit.id);
    if (cleanupError) logError("tools.propose_outfit.cleanup", cleanupError);
    return fail("No pude guardar el look ahora. Intenta de nuevo.");
  }

  const [loaded] = await loadOutfitViews(supabase, { ids: [outfit.id] });
  if (!loaded) {
    // El look quedó guardado pero no se pudo leer: no se promete una tarjeta que no llegará.
    logError("tools.propose_outfit.load_view", "outfit guardado pero no legible");
    const { error: dropError } = await supabase.from("outfits").delete().eq("id", outfit.id);
    if (dropError) logError("tools.propose_outfit.cleanup", dropError);
    return fail("No pude mostrar el look ahora. Intenta de nuevo; no le digas a la persona que ya se lo propusiste.");
  }

  // Evidencia y botones los produce el servidor con datos reales (BF-03): el modelo no los escribe.
  const palette = await activePalette(t);
  const evidence = buildEvidence({
    palette,
    garmentColors: ordered.map((g): NamedColor[] => g.colors ?? []),
    weather: t.state.weather,
    garmentCount: garment_ids.length,
    occasion,
  });
  const refinements = buildOutfitRefinements(
    outfit.id,
    loaded.items.map((i) => ({ garment_id: i.garment_id, name: i.name, category: i.category, subcategory: byId.get(i.garment_id)?.subcategory })),
  );
  const view = { ...loaded, evidence, refinements, variant: variant ?? null, pair_id: pairId };
  if (variant || evidence.length > 0) await saveOutfitExtras(t, outfit.id, { variant: variant ?? null, pair_id: pairId, evidence });

  if (variant && pairId) {
    t.state.pair = { id: pairId, looks: [...(t.state.pair?.looks ?? []), { variant, garmentIds: garment_ids }] };
  }
  t.emit({ type: "outfit", outfit: view });
  t.state.outfitIds.push(outfit.id);
  t.state.proposals.set(outfit.id, { title, missing_piece: piece });
  for (const id of garment_ids) t.state.chosenGarmentIds.add(id);
  void track("outfit_proposed", { occasion, items: garment_ids.length, variant: variant ?? null }, t.ctx);

  // El rastro del clóset ahora marca con qué prendas se armó el look ("elegí 4").
  if (t.state.closet) {
    const base = runningStep(t.state.closet.stepId, "get_closet");
    if (base) {
      const info = closetStepInfo(t.state.closet.garments, { weather: t.state.weather, event: t.state.event }, t.state.chosenGarmentIds);
      t.emit({ type: "tool_step", ...finishedStep(base, false, info) });
    }
  }

  return ok(
    {
      ok: true,
      outfit_id: outfit.id,
      ...(variant ? { variant } : {}),
      note: "El look ya se muestra a la persona con sus fotos, la evidencia y botones para ajustarlo. No repitas la lista de prendas: explica el porqué en 2 a 4 frases.",
    },
    { detail: piece ? "Te falta una sola pieza" : variant ? `Look ${variant}` : undefined },
  );
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

  const { data: saved, error } = await supabase
    .from("memory_facts")
    .insert({ user_id: userId, fact, kind, source: "chat" })
    .select("id")
    .single<{ id: string }>();
  if (error || !saved) {
    logError("tools.remember", error ?? "sin datos");
    return fail("No pude guardar la nota ahora. Sigue sin ella.");
  }
  t.emit({ type: "memory", id: saved.id, fact, kind });
  void track("memory_added", { kind }, t.ctx);
  return ok({ ok: true });
}


async function countReadyGarments(t: ToolContext): Promise<number> {
  const { count, error } = await t.ctx.supabase
    .from("garments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", t.ctx.userId)
    .is("archived_at", null)
    .eq("status", "ready");
  if (error) logError("tools.countReadyGarments", error);
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
    if (error) logError("tools.update_profile.profiles", error);
    if (error) return fail("No pude guardar el perfil ahora. Intenta de nuevo.");
    if (city !== undefined) t.city = city;
  }
  if (Object.keys(style).length > 0) {
    const { error } = await supabase.from("style_profiles").upsert({ user_id: userId, ...style }, { onConflict: "user_id" });
    if (error) logError("tools.update_profile.style_profiles", error);
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
    if (error) logError("tools.update_profile.onboarding", error);
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
  if (error || !garment) logError("tools.add_garment.insert", error ?? "sin datos");
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
    if (error) logError("tools.analyze_palette.deactivate", error);
    if (error) return fail("No pude guardar la paleta ahora. Intenta de nuevo.");
  }
  // R-04: la selfie no se conserva, así que `photo_path` queda nulo.
  const { data: analysis, error } = await supabase
    .from("color_analyses")
    .insert({ user_id: userId, photo_path: null, ...fields, source: "ai", is_active: true })
    .select("*")
    .single<ColorAnalysis>();
  if (error || !analysis) {
    logError("tools.analyze_palette.insert", error ?? "sin datos");
    if (previous) await supabase.from("color_analyses").update({ is_active: true }).eq("id", previous.id);
    return fail("No pude guardar la paleta ahora. Intenta de nuevo.");
  }

  const removal = await supabase.storage.from(MEDIA_BUCKET).remove([checked.path]);
  if (removal.error) logError("tools.analyze_palette.remove_selfie", removal.error);
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

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000);
}

async function execSetEventSummary(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = SetEventSummaryInput.safeParse(input);
  if (!parsed.success) return fail("Datos del evento inválidos: la fecha va como YYYY-MM-DD y time_of_day es day o night.");
  const today = todayInSantiago();
  const { date } = parsed.data;
  if (date && (daysBetween(today, date) < -1 || daysBetween(today, date) > 366)) {
    return fail("Esa fecha no cuadra con hoy. Resuélvela con la fecha de hoy del contexto (por ejemplo, 'este sábado').");
  }

  const { new_event, ...patch } = parsed.data;
  // Un evento distinto parte de cero: no hereda el lugar ni el código de vestir del anterior.
  let summary = mergeEvent(new_event ? emptyEventSummary() : (t.state.event ?? emptyEventSummary()), patch);
  if (needsWeatherRefresh(summary)) {
    const place = summary.place ?? t.city;
    const when = summary.date ?? today;
    const within = daysBetween(today, when) >= 0 && daysBetween(today, when) <= FORECAST_DAYS_AHEAD;
    const weather = within ? await getWeather(place, when) : null;
    if (weather) {
      summary = { ...summary, weather: weatherForSummary(weather) };
      t.state.weather = weather;
    }
  }
  t.state.event = summary;
  t.emit({ type: "event_summary", ...summary });

  const where = summary.place ?? t.city;
  const detail = [summary.date ? shortDateLabel(summary.date) : null, where].filter(Boolean).join(" · ");
  return ok(
    {
      ok: true,
      evento: { ...summary },
      note:
        summary.missing.length > 0
          ? `La persona ya ve el resumen y puede corregirlo. Todavía falta: ${summary.missing.join(", ")}. Si cambia el look, pregunta UNA cosa con suggest_replies (máximo dos preguntas sobre el evento); lo demás, supónlo en voz alta.`
          : "La persona ya ve el resumen y puede corregirlo. Ya tienes lo necesario: sigue con el clóset y el look.",
    },
    { detail },
  );
}

async function outfitMissingPiece(t: ToolContext, outfitId: string): Promise<{ title: string; missing_piece: MissingPiece | null } | null> {
  const known = t.state.proposals.get(outfitId);
  if (known) return known;
  const { data, error } = await t.ctx.supabase
    .from("outfits")
    .select("title, missing_piece")
    .eq("id", outfitId)
    .eq("user_id", t.ctx.userId)
    .maybeSingle<{ title: string; missing_piece: MissingPiece | null }>();
  if (error) logError("tools.outfitMissingPiece", error);
  return data ?? null;
}

async function execOfferSearch(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = OfferSearchInput.safeParse(input);
  if (!parsed.success) return fail("Entrada inválida: envía outfit_id (uuid de un look que propusiste), slot y una descripción.");
  const { outfit_id, slot, description } = parsed.data;
  const outfit = await outfitMissingPiece(t, outfit_id);
  if (!outfit) return fail("Ese look no existe. Ofrece la búsqueda solo para un look que ya propusiste.");
  if (!outfit.missing_piece || outfit.missing_piece.category !== slot) {
    return fail("Solo se ofrece buscar la pieza faltante del look: propón el look con missing_piece de esa categoría primero.");
  }
  if (t.state.offeredOutfits.has(outfit_id)) return fail("Ya ofreciste buscar para este look. Espera la respuesta de la persona.");
  t.state.offeredOutfits.add(outfit_id);

  const id = crypto.randomUUID();
  const offer: SearchOffer = { id, outfit_id, slot, description, actions: buildOfferActions(id, outfit_id, slot) };
  t.emit({ type: "search_offer", ...offer });
  return ok({ ok: true, note: "La persona ve los botones para aceptar o no. No busques ni repitas la pregunta con otras palabras: dile en una frase por qué la pieza vale la pena y espera su respuesta." });
}

/** Presupuesto por prenda del perfil, si la persona lo dio. */
async function profileBudget(t: ToolContext): Promise<number | null> {
  const { data, error } = await t.ctx.supabase
    .from("style_profiles")
    .select("budget_per_item_clp")
    .eq("user_id", t.ctx.userId)
    .maybeSingle<Pick<StyleProfile, "budget_per_item_clp">>();
  if (error) logError("tools.search_products.profile", error);
  return data?.budget_per_item_clp ?? null;
}

async function execSearchProducts(input: unknown, t: ToolContext): Promise<ToolOutput> {
  const parsed = SearchProductsInput.safeParse(input);
  if (!parsed.success) return fail("Entrada inválida para search_products: slot, description y authorization son obligatorios.");
  const { for_outfit_id, slot, description, color, max_price_clp, size, authorization, quote } = parsed.data;

  const refiningIntent = t.state.intent?.intent.kind === "refine_search" ? t.state.intent : null;
  const auth = authorizeSearch({
    authorization,
    quote,
    outfitId: for_outfit_id ?? null,
    slot,
    intents: t.state.intents,
    recentUserTexts: t.state.recentUserTexts,
    refining: refiningIntent
      ? {
          block_id: (refiningIntent.intent as Extract<ChatIntent, { kind: "refine_search" }>).block_id,
          for_outfit_id: refiningIntent.facts.for_outfit_id ?? null,
          slot: refiningIntent.facts.slot ?? slot,
        }
      : null,
  });
  if (!auth.ok) return fail(auth.reason);

  if (for_outfit_id) {
    const outfit = await outfitMissingPiece(t, for_outfit_id);
    if (!outfit) return fail("Ese look no existe. Usa el outfit_id de un look que propusiste.");
  }

  const budget = effectiveBudget({ toolMaxClp: max_price_clp, profileBudgetClp: await profileBudget(t) });
  const search = getProductSearch();
  const result = await search.search({ description, category: slot, ...(color ? { color } : {}), ...(budget ? { max_price_clp: budget } : {}), ...(size ? { size } : {}) });

  if (!result.ok) {
    return ok(
      {
        available: false,
        note: "La búsqueda de opciones no está disponible por ahora. Describe la pieza (tipo, color, taco o largo, rango de precio) para que la persona la busque en su tienda, y no inventes productos, tiendas ni precios.",
      },
      { label_done: "No pude buscar opciones", detail: "La búsqueda no está disponible por ahora", status: "error" },
    );
  }

  const { options } = finalizeOptions(result.candidates, { budgetMaxClp: budget });
  void track("shopping_search", { slot, trigger: auth.trigger, results: result.results_found, shown: options.length, stores: result.stores_searched }, t.ctx);
  const label_done = `Busqué en ${result.stores_searched} ${result.stores_searched === 1 ? "tienda" : "tiendas"}`;

  if (options.length === 0) {
    return ok(
      {
        found: 0,
        note: budget
          ? `No encontré opciones dentro de ${budget} CLP. Dilo sin rodeos y pregunta si quiere subir el tope o cambiar el estilo; no muestres nada fuera de su presupuesto.`
          : "No encontré opciones buenas. Dilo sin rodeos y pregunta qué cambiaría; no inventes productos.",
      },
      { label_done, detail: `${result.results_found} resultados · ninguno sirvió` },
    );
  }

  const id = crypto.randomUUID();
  const block: ShoppingOptionsBlock = {
    id,
    for_outfit_id: for_outfit_id ?? null,
    slot,
    query: [description, color].filter(Boolean).join(" · "),
    searched: { stores: result.stores_searched, results: result.results_found },
    options,
    refinements: buildSearchRefinements(id, slot),
    trigger: auth.trigger,
    budget_max_clp: budget,
    selected_option_id: null,
  };
  t.emit({ type: "shopping_options", ...block });

  return ok(
    {
      ok: true,
      mostradas: options.map((o) => ({ tienda: o.store_name, titulo: o.title, precio_clp: o.price_clp, con_comision: o.affiliate })),
      note: "Las opciones ya se muestran con tienda, precio y un botón para verlas en la tienda. No repitas la lista: explica en 1 o 2 frases por qué sirven para el look. No digas comprar; la persona abre la tienda. Una opción con comisión se avisa sola en pantalla.",
    },
    { label_done, detail: `${result.results_found} resultados · elegí ${options.length}` },
  );
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
  set_event_summary: execSetEventSummary,
  offer_search: execOfferSearch,
  search_products: execSearchProducts,
};

/** Herramientas sin estado visible: no emiten eventos `tool`. */
const SILENT_TOOLS: ReadonlySet<AgentToolName> = new Set(["suggest_replies", "offer_search"]);

export function isAgentToolName(name: string): name is AgentToolName {
  return name in EXECUTORS;
}

/**
 * Ejecuta una herramienta y emite los eventos `tool` (legacy, efímero) de inicio y fin y el paso de trabajo persistente
 * `tool_step` (C-1): `running` al empezar y `done` | `error` al terminar, con el detalle que dejó el ejecutor. Nunca lanza.
 */
export async function runTool(name: string, input: unknown, t: ToolContext): Promise<ToolOutput> {
  if (!isAgentToolName(name)) return fail(`Herramienta desconocida: ${name}.`);
  const visible = !SILENT_TOOLS.has(name);
  const running = visible ? runningStep(`step-${++t.state.stepSeq}`, name) : null;
  if (visible) t.emit({ type: "tool", name, status: "start" });
  if (running) t.emit({ type: "tool_step", ...running });
  let out: ToolOutput;
  try {
    t.stepId = running?.id;
    out = await EXECUTORS[name](input, t);
  } catch (err) {
    logError(`tools.${name}`, err);
    out = fail("La herramienta falló. Sigue sin ella.");
  } finally {
    t.stepId = undefined;
    if (visible) t.emit({ type: "tool", name, status: "end" });
  }
  if (running) t.emit({ type: "tool_step", ...finishedStep(running, out.isError, out.step) });
  return out;
}
