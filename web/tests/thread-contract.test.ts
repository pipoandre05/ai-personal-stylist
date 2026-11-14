import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTurnCollector } from "@/lib/chat/collector";
import { createSSEParser, encodeSSE } from "@/lib/chat/sse";
import { assembleThread, latestEventPart, shoppingBlocksOf, withEventSummary, type ThreadLookups, type ThreadRow } from "@/lib/data/thread";
import { assistantNotes, userIntentLine } from "@/lib/agent/history-notes";
import { toMessageParams } from "@/lib/agent/history";
import { withOutfitExtras, toOutfitView } from "@/lib/data/mappers";
import { emptyEventSummary, mergeEvent } from "@/lib/domain/event-summary";
import { finalizeOptions } from "@/lib/domain/shopping";
import { runningStep, finishedStep } from "@/lib/domain/steps";
import type { ChatEvent, ChatMessagePart, OutfitView, ShoppingOptionsBlock } from "@/lib/domain/types";
import { extrasAvailable, isMissingColumnError, markExtrasMissing } from "@/lib/data/outfit-extras";

const O1 = "11111111-1111-4111-8111-111111111111";
const O2 = "22222222-2222-4222-8222-222222222222";
const PAIR = "33333333-3333-4333-8333-333333333333";
const NOW = new Date("2026-11-14T13:40:00Z");

const look = (id: string, over: Partial<OutfitView> = {}): OutfitView => ({
  id,
  title: "Look",
  occasion: "Matrimonio",
  rationale: "x".repeat(30),
  status: "proposed",
  weather: null,
  missing_piece: null,
  rating: null,
  created_at: "2026-11-14T10:00:00Z",
  items: [],
  ...over,
});

const options = finalizeOptions(
  [
    { store_name: "Tienda A", title: "Sandalia", price_clp: 54990, seen_at: NOW.toISOString(), url: "https://a.example/p/1", affiliate: true, relevance: 1 },
    { store_name: "Tienda B", title: "Mule", price_clp: 39990, seen_at: NOW.toISOString(), url: "https://b.example/p/1", relevance: 0.5 },
  ],
  { now: NOW },
).options;

const block = (selected: string | null = null): ShoppingOptionsBlock => ({
  id: "b1",
  for_outfit_id: O1,
  slot: "shoes",
  query: "sandalia de taco ancho",
  searched: { stores: 4, results: 9 },
  options,
  refinements: [{ id: "r-cheaper", label: "Más baratos", intent: { kind: "refine_search", block_id: "44444444-4444-4444-8444-444444444444", change: "cheaper" } }],
  trigger: "offer_accepted",
  budget_max_clp: null,
  selected_option_id: selected,
});

/** Los eventos de un turno del asesor, como los emitiría el servidor. */
function turnEvents(): ChatEvent[] {
  const step = runningStep("step-1", "get_closet")!;
  const ev = mergeEvent(emptyEventSummary(), { kind: "Matrimonio", date: "2026-11-21", place: "Casablanca", time_of_day: "day" });
  return [
    { type: "conversation", id: "c" },
    { type: "text_delta", text: "Te dejé " },
    { type: "tool", name: "get_closet", status: "start" },
    { type: "tool_step", ...step },
    { type: "event_summary", ...ev },
    { type: "tool_step", ...finishedStep(step, false, { detail: "8 prendas · 5 sirven para el día", items: [{ garment_id: "g1", chosen: false }] }) },
    { type: "outfit", outfit: look(O1, { variant: "seguro", pair_id: PAIR, evidence: [{ kind: "closet", label: "3 de tu clóset" }], refinements: [{ id: "r-more_formal", label: "Más formal", intent: { kind: "refine_outfit", outfit_id: O1, change: "more_formal" } }] }) },
    { type: "outfit", outfit: look(O2, { variant: "atrevido", pair_id: PAIR }) },
    { type: "search_offer", id: "f1", outfit_id: O1, slot: "shoes", description: "sandalia", actions: [] },
    { type: "shopping_options", ...block() },
    { type: "tool_step", ...finishedStep(step, false, { detail: "8 prendas · elegí 4", items: [{ garment_id: "g1", chosen: true }] }) },
    { type: "text_delta", text: "dos opciones." },
    { type: "quick_replies", options: ["Sí", "No"], multiple: false },
    { type: "done", message_id: "m" },
  ];
}

describe("reconstrucción del hilo al recargar", () => {
  const collect = () => {
    const c = createTurnCollector();
    for (const e of turnEvents()) c.push(e);
    return c;
  };

  it("el colector guarda cada paso una vez (el último estado), el evento, los looks con sus datos y las opciones", () => {
    const c = collect();
    expect(c.text).toBe("Te dejé dos opciones.");
    expect(c.outfitIds).toEqual([O1, O2]);
    const parts = c.parts();
    const steps = parts.filter((p) => p.type === "tool_step");
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ id: "step-1", status: "done", detail: "8 prendas · elegí 4" });
    const outfit1 = parts.find((p) => p.type === "outfit" && p.outfit_id === O1);
    expect(outfit1).toMatchObject({ variant: "seguro", pair_id: PAIR, evidence: [{ kind: "closet" }], refinements: [{ id: "r-more_formal" }] });
    expect(parts.find((p) => p.type === "event_summary")).toMatchObject({ kind: "Matrimonio", place: "Casablanca" });
    expect(parts.find((p) => p.type === "shopping_options")).toMatchObject({ id: "b1", slot: "shoes" });
    expect(parts.find((p) => p.type === "search_offer")).toMatchObject({ id: "f1" });
    expect(parts.at(-1)).toMatchObject({ type: "quick_replies" });
  });

  it("un paso que quedó en curso al cortarse el turno se guarda como error", () => {
    const c = createTurnCollector();
    c.push({ type: "tool_step", ...runningStep("s1", "get_weather")! });
    expect(c.parts()).toMatchObject([{ type: "tool_step", id: "s1", status: "error" }]);
  });

  const lookups = (outfits: OutfitView[]): ThreadLookups => ({
    outfits: new Map(outfits.map((o) => [o.id, o])),
    garments: new Map(),
    palettes: new Map(),
    imageUrls: new Map(),
    liveMemoryIds: new Set(),
  });

  it("assembleThread devuelve pasos, evento, bloques de compra, oferta y los looks con variante, par y evidencia", () => {
    const parts = collect().parts();
    const rows: ThreadRow[] = [
      { id: "u1", role: "user", text: "Tengo un matrimonio", parts: [], created_at: "2026-11-14T10:00:00Z" },
      { id: "a1", role: "assistant", text: "Te dejé dos opciones.", parts, created_at: "2026-11-14T10:00:05Z" },
    ];
    const thread = assembleThread(rows, lookups([look(O1), look(O2)]));
    const a = thread[1];
    expect(a.tool_steps?.map((s) => s.status)).toEqual(["done"]);
    expect(a.event_summary).toMatchObject({ kind: "Matrimonio", missing: expect.any(Array) });
    expect(a.shopping_blocks?.[0].options.map((o) => o.store_name)).toEqual(["Tienda A", "Tienda B"]);
    expect(a.search_offer?.id).toBe("f1");
    expect(a.outfits.map((o) => [o.id, o.variant, o.pair_id])).toEqual([[O1, "seguro", PAIR], [O2, "atrevido", PAIR]]);
    expect(a.outfits[0].evidence).toEqual([{ kind: "closet", label: "3 de tu clóset" }]);
    expect(a.outfits[0].refinements?.[0].label).toBe("Más formal");
    expect(a.outfits[0].selected_option).toBeNull();
    expect(a.quick_replies).toEqual({ options: ["Sí", "No"], multiple: false });
    // el mensaje de la persona no trae nada de lo nuevo con contenido
    expect(thread[0].tool_steps).toEqual([]);
    expect(thread[0].event_summary).toBeNull();
  });

  it("la opción elegida vuelve a aparecer en el look y en su bloque; la oferta ya respondida no sigue pendiente", () => {
    const parts = collect().parts().map((p) => (p.type === "shopping_options" ? { ...p, selected_option_id: options[0].id } : p)) as ChatMessagePart[];
    const rows: ThreadRow[] = [
      { id: "a1", role: "assistant", text: "x", parts, created_at: "2026-11-14T10:00:05Z" },
      { id: "u2", role: "user", text: "Sí, búscame opciones", parts: [{ type: "intent", intent: { kind: "accept_search", outfit_id: O1, slot: "shoes" } }], created_at: "2026-11-14T10:01:00Z" },
    ];
    const thread = assembleThread(rows, lookups([look(O1), look(O2)]));
    expect(thread[0].outfits[0].selected_option?.id).toBe(options[0].id);
    expect(thread[0].outfits[1].selected_option).toBeNull();
    expect(thread[0].shopping_blocks?.[0].selected_option_id).toBe(options[0].id);
    expect(thread[0].search_offer).toBeNull();
    expect(shoppingBlocksOf(rows)).toHaveLength(1);
  });

  it("mensajes ya guardados (sin ninguna parte nueva) se siguen leyendo igual", () => {
    const rows: ThreadRow[] = [
      { id: "a0", role: "assistant", text: "Hola", parts: [{ type: "outfit", outfit_id: O1 }, { type: "quick_replies", options: ["a", "b"], multiple: false }], created_at: "2026-11-13T10:00:00Z" },
      { id: "a-null", role: "assistant", text: "Sin partes", parts: null, created_at: "2026-11-13T10:01:00Z" },
    ];
    const thread = assembleThread(rows, lookups([look(O1)]));
    expect(thread[0].outfits).toHaveLength(1);
    expect(thread[0].outfits[0]).toMatchObject({ id: O1, variant: null, pair_id: null, selected_option: null });
    expect(thread[0].outfits[0].evidence).toBeUndefined();
    expect(thread[0].tool_steps).toEqual([]);
    expect(thread[0].shopping_blocks).toEqual([]);
    expect(thread[1].outfits).toEqual([]);
  });

  it("encuentra el último resumen del evento y lo reemplaza sin tocar el resto de las partes", () => {
    const parts = collect().parts();
    const rows = [{ id: "a1", parts }, { id: "a0", parts: [{ type: "event_summary", ...mergeEvent(emptyEventSummary(), { kind: "Cena" }) } as ChatMessagePart] }];
    const latest = latestEventPart(rows);
    expect(latest?.rowId).toBe("a1");
    expect(latest?.summary.kind).toBe("Matrimonio");
    const corrected = withEventSummary(parts, mergeEvent(latest!.summary, { place: "Valparaíso" }));
    expect(corrected).toHaveLength(parts.length);
    expect(corrected.find((p) => p.type === "event_summary")).toMatchObject({ place: "Valparaíso", weather: null });
    expect(corrected.find((p) => p.type === "shopping_options")).toEqual(parts.find((p) => p.type === "shopping_options"));
    expect(latestEventPart([{ id: "x", parts: [] }])).toBeNull();
    expect(withEventSummary([], mergeEvent(emptyEventSummary(), {}))).toEqual([]);
  });
});

describe("SSE: los eventos nuevos viajan y se reducen igual", () => {
  it("el parser entrega los eventos del turno completos y en orden, también cortados por la red", () => {
    const events = turnEvents();
    const wire = events.map(encodeSSE).join("");
    const out: ChatEvent[] = [];
    const parser = createSSEParser((e) => out.push(e));
    for (let i = 0; i < wire.length; i += 37) parser.push(wire.slice(i, i + 37));
    parser.flush();
    expect(out).toEqual(events);
    // reducir lo que llegó por la red da lo mismo que reducir lo emitido
    const a = createTurnCollector();
    const b = createTurnCollector();
    for (const e of events) a.push(e);
    for (const e of out) b.push(e);
    expect(b.parts()).toEqual(a.parts());
  });
});

describe("el historial del asesor recuerda lo que mostró", () => {
  it("anota el resumen del evento, la oferta y las opciones (con la elegida) para el siguiente turno", () => {
    const parts = createTurnCollector();
    for (const e of turnEvents()) parts.push(e);
    const notes = assistantNotes(parts.parts().map((p) => (p.type === "shopping_options" ? { ...p, selected_option_id: options[1].id } : p)) as ChatMessagePart[]);
    const joined = notes.join("\n");
    expect(joined).toContain("Resumen del evento");
    expect(joined).toContain("tipo: Matrimonio");
    expect(joined).toContain("Ofrecí buscar opciones para: shoes");
    expect(joined).toContain('Tienda A "Sandalia" $54.990');
    expect(joined).toContain('la persona eligió Tienda B "Mule"');
    expect(joined).toContain("variante seguro");
  });

  it("el botón que tocó la persona queda en el historial y los bloques del turno van al final del último mensaje", () => {
    const intentLine = userIntentLine([{ type: "intent", intent: { kind: "accept_search", outfit_id: O1, slot: "shoes" } }]);
    expect(intentLine).toContain("shoes");
    const out = toMessageParams(
      [
        { role: "assistant", text: "¿Te busco?", outfitTitles: [], imagePaths: [], notes: ["[Ofrecí buscar]"] },
        { role: "user", text: "Sí, búscame opciones", outfitTitles: [], imagePaths: [], intentLine },
      ],
      "<contexto_persona/>",
      { turnBlocks: ["<evento_actual>x</evento_actual>", "<intencion_de_la_persona/>"] },
    );
    const last = out[out.length - 1].content as { type: string; text: string }[];
    expect(last.map((b) => b.text)).toEqual(["Sí, búscame opciones", intentLine, "<evento_actual>x</evento_actual>", "<intencion_de_la_persona/>"]);
    // el prefijo cacheable (contexto de la persona) sigue siendo lo primero del primer mensaje
    expect(JSON.stringify(out[0].content)).toContain("<contexto_persona/>");
  });
});

describe("sin la migración 20261114020000 (degradación)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reconoce el error de columna inexistente de Postgres y de PostgREST, y no otros", () => {
    expect(isMissingColumnError({ code: "42703", message: "column outfits.variant does not exist" })).toBe(true);
    expect(isMissingColumnError({ code: "PGRST204", message: "Could not find the 'variant' column of 'outfits'" })).toBe(true);
    expect(isMissingColumnError({ message: "column outfits.evidence does not exist" })).toBe(true);
    expect(isMissingColumnError({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isMissingColumnError(null)).toBe(false);
  });

  it("tras el fallo deja de consultar un minuto y vuelve a probar (por si se aplicó la migración)", () => {
    const t0 = Date.now() + 10_000_000;
    expect(extrasAvailable(t0)).toBe(true);
    markExtrasMissing({ code: "42703", message: "column outfits.variant does not exist" }, t0);
    expect(extrasAvailable(t0 + 1)).toBe(false);
    expect(extrasAvailable(t0 + 61_000)).toBe(true);
    // un error que no es de columna no apaga nada
    markExtrasMissing({ code: "57014", message: "timeout" }, t0 + 120_000);
    expect(extrasAvailable(t0 + 120_001)).toBe(true);
  });

  it("un look sin filas de las columnas nuevas se entrega tal cual; con ellas, enriquecido", () => {
    const base = toOutfitView({ id: O1, title: "t", occasion: "o", rationale: "r", status: "proposed", weather: null, missing_piece: null, created_at: "2026-11-14T10:00:00Z", outfit_items: [] }, new Map());
    expect(withOutfitExtras(base, undefined)).toBe(base);
    expect(base.evidence).toBeUndefined();
    const rich = withOutfitExtras(base, { id: O1, variant: "atrevido", pair_id: PAIR, evidence: [{ kind: "closet", label: "2 de tu clóset" }], selected_option: options[0] });
    expect(rich).toMatchObject({ variant: "atrevido", pair_id: PAIR, selected_option: { store_name: "Tienda A" } });
    expect(withOutfitExtras(base, { id: O1, variant: null, pair_id: null, evidence: null, selected_option: null }).evidence).toBeUndefined();
  });

  it("sin la migración el hilo conserva la opción elegida, porque vive en messages.parts", () => {
    const parts: ChatMessagePart[] = [{ type: "outfit", outfit_id: O1 }, { type: "shopping_options", ...block(options[0].id) }];
    const thread = assembleThread(
      [{ id: "a1", role: "assistant", text: "", parts, created_at: "2026-11-14T10:00:00Z" }],
      { outfits: new Map([[O1, look(O1)]]), garments: new Map(), palettes: new Map(), imageUrls: new Map(), liveMemoryIds: new Set() },
    );
    expect(thread[0].outfits[0].selected_option?.id).toBe(options[0].id);
  });
});
