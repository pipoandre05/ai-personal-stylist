import { describe, expect, it } from "vitest";
import { eventAnswerFlow, eventFlow, intentFlow, newLookFlow, dayLookFlow, questionForEvent, type FlowInput, type MockEnv, type ToolResult } from "@/lib/agent/mock-flow";
import { planMockTurn } from "@/lib/agent/mock-script";
import { planMockLooks, refineMockLook, shoesIssue } from "@/lib/agent/pick-outfit";
import { OfferSearchInput, ProposeOutfitInput, SearchProductsInput, SetEventSummaryInput } from "@/lib/agent/tool-defs";
import type { ClosetItem } from "@/lib/agent/tools";
import { emptyEventSummary, mergeEvent, parseEventText, type EventPatch } from "@/lib/domain/event-summary";
import type { ResolvedIntent } from "@/lib/domain/intents";
import { authorizeSearch, findSearchQuote } from "@/lib/domain/shopping";
import { validateOutfitComposition, lookDifference } from "@/lib/domain/outfit-rules";
import type { AgentToolName, EventSummary, GarmentCategory, MissingPiece } from "@/lib/domain/types";

const TODAY = "2026-11-14";
const SENTENCE = "Este sábado tengo un matrimonio en Casablanca, de día, en una viña. ¿Qué me pongo? Si no tengo nada, búscame opciones.";
const SENTENCE_NO_SEARCH = "Este sábado tengo un matrimonio en Casablanca, de día, en una viña. ¿Qué me pongo?";

let n = 0;
const outfitId = (i: number) => `99999999-9999-4999-8999-${String(i).padStart(12, "0")}`;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const g = (category: GarmentCategory, name: string, formality: number, colors: string[] = ["blanco"]): ClosetItem => ({
  id: uuid(),
  name,
  category,
  subcategory: name.split(" ")[0].toLowerCase(),
  colors,
  pattern: "liso",
  formality,
  seasons: ["verano", "entretiempo"],
  occasions: [],
  favorite: false,
});

const fullCloset = () => [
  g("top", "Blusa de seda", 4, ["crudo"]),
  g("top", "Camisa de lino", 3, ["celeste"]),
  g("bottom", "Falda plisada", 4, ["salvia"]),
  g("bottom", "Pantalón de sastre", 4, ["negro"]),
  g("shoes", "Sandalia de taco", 4, ["camel"]),
  g("shoes", "Zapatilla blanca", 2, ["blanco"]),
  g("outerwear", "Blazer de lino", 4, ["arena"]),
  g("bag", "Cartera de mimbre", 3, ["mimbre"]),
];
const noShoesCloset = () => fullCloset().filter((c) => c.category !== "shoes");
const casualShoesCloset = () => fullCloset().filter((c) => c.name !== "Sandalia de taco");

type Call = { name: AgentToolName; input: Record<string, unknown> };
type Fake = ReturnType<typeof makeEnv>;

function makeEnv(o: { closet?: ClosetItem[]; event?: EventSummary | null; prevItems?: string[]; missing?: MissingPiece | null; search?: Record<string, unknown> } = {}) {
  const calls: Call[] = [];
  const said: string[] = [];
  const replies: string[][] = [];
  let event = o.event ?? null;
  let out = 0;
  const ok = (v: unknown): ToolResult => ({ content: JSON.stringify(v), isError: false });
  const env: MockEnv = {
    say: async (t) => void said.push(t),
    replies: async (opts) => void replies.push(opts),
    tool: async (name, input) => {
      calls.push({ name, input: input as Record<string, unknown> });
      if (name === "set_event_summary") {
        const { new_event, ...patch } = input as EventPatch & { new_event?: boolean };
        event = mergeEvent(new_event ? emptyEventSummary() : (event ?? emptyEventSummary()), patch);
        return ok({ ok: true });
      }
      if (name === "propose_outfit") return ok({ ok: true, outfit_id: outfitId(++out) });
      if (name === "search_products") return ok(o.search ?? { ok: true });
      return ok({});
    },
    closet: async () => o.closet ?? fullCloset(),
    outfitItems: async () => o.prevItems ?? [],
    outfitMissing: async () => o.missing ?? null,
    event: () => event,
    weather: () => null,
    today: TODAY,
  };
  return { env, calls, said, replies, get event() { return event; } };
}

const input = (over: Partial<FlowInput> = {}): FlowInput => ({ userText: "", intent: null, eventQuestionsAsked: 0, recentUserTexts: [], ...over });
const names = (f: Fake) => f.calls.map((c) => c.name);
const eventAfterFirstTurn = (text = SENTENCE) => mergeEvent(emptyEventSummary(), parseEventText(text, TODAY));

describe("asesor simulado · camino 1: el evento", () => {
  it("la persona cuenta el evento: resumen y UNA pregunta con respuestas sugeridas, sin proponer todavía", async () => {
    const f = makeEnv();
    await eventFlow(f.env, input({ userText: SENTENCE, recentUserTexts: [SENTENCE] }));
    expect(names(f)).toEqual(["set_event_summary"]);
    expect(SetEventSummaryInput.safeParse(f.calls[0].input).success).toBe(true);
    expect(f.calls[0].input).toMatchObject({ kind: "Matrimonio", date: "2026-11-21", place: "Casablanca", time_of_day: "day", venue: "outdoor", new_event: true });
    expect(f.event?.missing).toEqual(["dress_code"]);
    expect(f.replies).toEqual([["Dice «formal de día»", "No dice nada", "Te mando la invitación"]]);
    expect(f.said.join("")).toContain("Esto es lo que entendí");
    expect(f.said.join("")).toContain("vestimenta");
  });

  it("al responder la pregunta trabaja: clima del lugar y fecha, clóset y DOS looks (seguro y atrevido) que difieren", async () => {
    const f = makeEnv({ event: eventAfterFirstTurn() });
    await eventAnswerFlow(f.env, input({ userText: "Dice «formal de día»", eventQuestionsAsked: 1, recentUserTexts: ["Dice «formal de día»", SENTENCE_NO_SEARCH] }));
    expect(names(f)).toEqual(["set_event_summary", "get_weather", "get_closet", "propose_outfit", "propose_outfit"]);
    expect(f.calls[0].input).toMatchObject({ dress_code: "formal de día" });
    expect(f.calls[1].input).toEqual({ place: "Casablanca", date: "2026-11-21" });
    const [a, b] = [f.calls[3].input, f.calls[4].input];
    expect([a.variant, b.variant]).toEqual(["seguro", "atrevido"]);
    for (const c of [a, b]) {
      expect(ProposeOutfitInput.safeParse(c).success, JSON.stringify(c)).toBe(true);
      const closet = fullCloset();
      void closet;
      expect(c.missing_piece).toBeUndefined();
    }
    expect(lookDifference(a.garment_ids as string[], b.garment_ids as string[])).toBeGreaterThanOrEqual(2);
    expect(names(f)).not.toContain("search_products");
    expect(names(f)).not.toContain("offer_search");
    expect(f.said.join("")).toContain("dos opciones");
  });

  it("cada look del par cumple la composición del servidor", async () => {
    const closet = fullCloset();
    const f = makeEnv({ closet, event: eventAfterFirstTurn() });
    await eventAnswerFlow(f.env, input({ userText: "Dice «formal de día»", eventQuestionsAsked: 1, recentUserTexts: [SENTENCE_NO_SEARCH] }));
    for (const c of f.calls.filter((x) => x.name === "propose_outfit")) {
      const items = (c.input.garment_ids as string[]).map((id) => closet.find((x) => x.id === id)!);
      expect(validateOutfitComposition(items)).toEqual({ ok: true });
    }
  });

  it("si falta el calzado: un solo look con la pieza faltante y, si la persona ya pidió buscar, busca sin preguntar", async () => {
    const f = makeEnv({ closet: noShoesCloset(), event: eventAfterFirstTurn() });
    const texts = ["Dice «formal de día»", SENTENCE];
    await eventAnswerFlow(f.env, input({ userText: texts[0], eventQuestionsAsked: 1, recentUserTexts: texts }));
    expect(names(f)).toEqual(["set_event_summary", "get_weather", "get_closet", "propose_outfit", "search_products"]);
    const look = f.calls[3].input;
    expect(look.variant).toBeUndefined();
    expect(look.missing_piece).toMatchObject({ category: "shoes" });
    const search = f.calls[4].input;
    expect(SearchProductsInput.safeParse(search).success).toBe(true);
    expect(search).toMatchObject({ for_outfit_id: outfitId(1), slot: "shoes", authorization: "person_request" });
    // la cita es real y el servidor la aceptaría
    expect(authorizeSearch({ authorization: "person_request", quote: search.quote as string, outfitId: outfitId(1), slot: "shoes", intents: [], recentUserTexts: texts }).ok).toBe(true);
  });

  it("si falta el calzado y la persona NO pidió buscar: ofrece buscar (no busca) con el look y la pieza", async () => {
    const f = makeEnv({ closet: casualShoesCloset(), event: eventAfterFirstTurn(SENTENCE_NO_SEARCH) });
    await eventAnswerFlow(f.env, input({ userText: "Dice «formal de día»", eventQuestionsAsked: 1, recentUserTexts: ["Dice «formal de día»", SENTENCE_NO_SEARCH] }));
    expect(names(f)).toEqual(["set_event_summary", "get_weather", "get_closet", "propose_outfit", "offer_search"]);
    expect(OfferSearchInput.safeParse(f.calls[4].input).success).toBe(true);
    expect(f.calls[4].input).toMatchObject({ outfit_id: outfitId(1), slot: "shoes" });
    expect(f.said.join("")).toContain("¿Te busco");
  });

  it("tras el tope de preguntas supone en voz alta y sigue (D-01: hasta dos)", async () => {
    const f = makeEnv({ event: mergeEvent(emptyEventSummary(), { kind: "Cena" }) });
    await eventAnswerFlow(f.env, input({ userText: "no sé", eventQuestionsAsked: 2, recentUserTexts: ["no sé"] }));
    expect(f.replies).toEqual([]);
    const set = f.calls.filter((c) => c.name === "set_event_summary");
    expect(set).toHaveLength(2);
    expect(set[1].input).toMatchObject({ dress_code: "no especificado", date: TODAY });
    expect(f.said.join("")).toContain("Supongo");
    expect(names(f)).toContain("propose_outfit");
  });

  it("con una pregunta pendiente distinta pregunta la siguiente (máximo dos en total)", async () => {
    const f = makeEnv({ event: eventAfterFirstTurn("Tengo un matrimonio") });
    await eventAnswerFlow(f.env, input({ userText: "De noche", eventQuestionsAsked: 1, recentUserTexts: ["De noche"] }));
    expect(f.calls[0].input).toMatchObject({ time_of_day: "night" });
    expect(f.replies[0]).toEqual(questionForEvent("dress_code", null).options);
    expect(names(f)).not.toContain("propose_outfit");
  });
});

describe("asesor simulado · camino 2: quiero un look nuevo (parte por la compra)", () => {
  it("sin pieza concreta pregunta qué quiere, con frases que ya son pedidos", async () => {
    const f = makeEnv();
    await newLookFlow(f.env, input({ userText: "Quiero un look nuevo" }), null);
    expect(f.calls).toEqual([]);
    expect(f.replies[0]).toContain("Quiero unos zapatos nuevos");
    expect(planMockTurn({ text: "Quiero unos zapatos nuevos", hasImage: false, start: false, missing: [] })).toEqual({ kind: "new_look", piece: "shoes" });
  });

  it("con la pieza: mira el clóset, avisa del equivalente, arma el look sin esa pieza y busca directo sin ofrecer", async () => {
    const f = makeEnv();
    const text = "Quiero unos zapatos nuevos";
    await newLookFlow(f.env, input({ userText: text, recentUserTexts: [text] }), "shoes");
    expect(names(f)).toEqual(["get_closet", "propose_outfit", "search_products"]);
    const look = f.calls[1].input;
    expect(ProposeOutfitInput.safeParse(look).success).toBe(true);
    expect(look.missing_piece).toMatchObject({ category: "shoes" });
    const closet = fullCloset();
    void closet;
    expect(f.calls[2].input).toMatchObject({ for_outfit_id: outfitId(1), slot: "shoes", authorization: "person_request" });
    expect(SearchProductsInput.safeParse(f.calls[2].input).success).toBe(true);
    expect(f.said.join("")).toContain("ya tienes");
    expect(names(f)).not.toContain("offer_search");
    expect(authorizeSearch({ authorization: "person_request", quote: f.calls[2].input.quote as string, outfitId: outfitId(1), slot: "shoes", intents: [], recentUserTexts: [text] }).ok).toBe(true);
  });

  it("el look de este camino no incluye calzado: la pieza nueva es justo lo que falta", async () => {
    const closet = fullCloset();
    const f = makeEnv({ closet });
    await newLookFlow(f.env, input({ userText: "Quiero unos zapatos nuevos", recentUserTexts: ["Quiero unos zapatos nuevos"] }), "shoes");
    const ids = f.calls[1].input.garment_ids as string[];
    expect(ids.map((id) => closet.find((c) => c.id === id)!.category)).not.toContain("shoes");
  });

  it("si la búsqueda no está disponible describe la pieza y no inventa productos", async () => {
    const f = makeEnv({ search: { available: false, note: "x" } });
    await newLookFlow(f.env, input({ userText: "Quiero unos zapatos nuevos", recentUserTexts: ["Quiero unos zapatos nuevos"] }), "shoes");
    const said = f.said.join("");
    expect(said).toContain("no puedo buscar");
    expect(said).not.toMatch(/\$\d/);
  });
});

describe("asesor simulado · camino 3: botones (intents)", () => {
  const OUT = "11111111-1111-4111-8111-111111111111";
  const resolved = (intent: ResolvedIntent["intent"], facts: ResolvedIntent["facts"] = {}): ResolvedIntent => ({ intent, facts });

  it("aceptar la oferta busca con authorization accepted_offer", async () => {
    const f = makeEnv({ missing: { category: "shoes", description: "Sandalia de taco ancho", why: "x" } });
    const intent = resolved({ kind: "accept_search", outfit_id: OUT, slot: "shoes" });
    await intentFlow(f.env, input({ userText: "Sí, búscame opciones", intent }));
    expect(names(f)).toEqual(["search_products"]);
    expect(f.calls[0].input).toMatchObject({ for_outfit_id: OUT, slot: "shoes", authorization: "accepted_offer", description: "Sandalia de taco ancho" });
    expect(authorizeSearch({ authorization: "accepted_offer", outfitId: OUT, slot: "shoes", intents: [intent.intent], recentUserTexts: [] }).ok).toBe(true);
  });

  it("rechazar la oferta no busca nada", async () => {
    const f = makeEnv();
    await intentFlow(f.env, input({ userText: "Por ahora no", intent: resolved({ kind: "decline_search", outfit_id: OUT, slot: "shoes" }) }));
    expect(f.calls).toEqual([]);
  });

  it("'más baratos' vuelve a buscar con refinement y un tope menor que el precio más alto mostrado", async () => {
    const f = makeEnv();
    const intent = resolved({ kind: "refine_search", block_id: OUT, change: "cheaper" }, { slot: "shoes", search_query: "sandalia · tierra", shown_prices: [54990, 39990, 29990], for_outfit_id: OUT });
    await intentFlow(f.env, input({ userText: "Más baratos", intent }));
    expect(f.calls[0]).toMatchObject({ name: "search_products", input: { authorization: "refinement", slot: "shoes", max_price_clp: 54989, for_outfit_id: OUT } });
    expect(SearchProductsInput.safeParse(f.calls[0].input).success).toBe(true);
  });

  it("'no me interesan' no busca: pregunta qué cambiaría", async () => {
    const f = makeEnv();
    await intentFlow(f.env, input({ userText: "No me interesan", intent: resolved({ kind: "refine_search", block_id: OUT, change: "dismiss" }, { slot: "shoes" }) }));
    expect(f.calls).toEqual([]);
    expect(f.replies).toHaveLength(1);
  });

  it("'más formal' arma UN look nuevo (sin variant) con prendas más formales", async () => {
    const closet = [g("top", "Polera", 2), g("top", "Camisa", 4), g("bottom", "Jeans", 2), g("bottom", "Pantalón de sastre", 4)];
    const f = makeEnv({ closet, prevItems: [closet[0].id, closet[2].id] });
    await intentFlow(f.env, input({ userText: "Más formal", intent: resolved({ kind: "refine_outfit", outfit_id: OUT, change: "more_formal" }, { outfit_title: "Look del día" }) }));
    expect(names(f)).toEqual(["get_closet", "propose_outfit"]);
    const call = f.calls[1].input;
    expect(ProposeOutfitInput.safeParse(call).success).toBe(true);
    expect(call.variant).toBeUndefined();
    expect(call.garment_ids).toEqual([closet[1].id, closet[3].id]);
  });

  it("si el clóset no permite el ajuste lo dice en vez de inventar", async () => {
    const closet = [g("top", "Camisa", 4), g("bottom", "Pantalón", 4)];
    const f = makeEnv({ closet, prevItems: closet.map((c) => c.id) });
    await intentFlow(f.env, input({ userText: "Más formal", intent: resolved({ kind: "refine_outfit", outfit_id: OUT, change: "more_formal" }) }));
    expect(names(f)).toEqual(["get_closet"]);
    expect(f.said.join("")).toContain("no me sale otra combinación");
  });
});

describe("selección de looks del asesor simulado", () => {
  it("dos looks distintos y válidos cuando el clóset alcanza", () => {
    const closet = fullCloset();
    for (const seed of [0, 1, 7, 99, 12345]) {
      const plan = planMockLooks(closet, seed, { temp_min: 11 }, { event: true, formal: true, targetFormality: 4 });
      expect(plan.kind).toBe("pair");
      if (plan.kind !== "pair") continue;
      expect(validateOutfitComposition(plan.seguro)).toEqual({ ok: true });
      expect(validateOutfitComposition(plan.atrevido)).toEqual({ ok: true });
      expect(lookDifference(plan.seguro.map((x) => x.id), plan.atrevido.map((x) => x.id))).toBeGreaterThanOrEqual(2);
    }
  });

  it("un solo look si el clóset no da dos distintos", () => {
    const closet = [g("top", "Camisa", 3), g("bottom", "Pantalón", 3)];
    expect(planMockLooks(closet, 3, null, {}).kind).toBe("single");
  });

  it("en un evento, sin calzado adecuado, un look con la pieza faltante (nunca en un día normal)", () => {
    expect(shoesIssue(noShoesCloset(), 4)).toBe(true);
    expect(shoesIssue(casualShoesCloset(), 4)).toBe(true);
    expect(shoesIssue(fullCloset(), 4)).toBe(false);
    expect(shoesIssue(casualShoesCloset(), null)).toBe(false);
    const plan = planMockLooks(noShoesCloset(), 3, null, { event: true, targetFormality: 4 });
    expect(plan).toMatchObject({ kind: "single", missing_piece: { category: "shoes" } });
    expect(planMockLooks(noShoesCloset(), 3, null, { event: false }).kind).not.toBe("single-with-missing");
    const day = planMockLooks(noShoesCloset(), 3, null, { event: false });
    expect(day.kind === "pair" || (day.kind === "single" && day.missing_piece === null)).toBe(true);
  });

  it("los ajustes devuelven looks válidos o null", () => {
    const closet = fullCloset();
    const base = [closet[1].id, closet[2].id, closet[5].id]; // camisa, falda, zapatilla
    const more = refineMockLook(closet, base, "more_formal");
    expect(more).not.toBeNull();
    expect(validateOutfitComposition(more!.map((id) => closet.find((c) => c.id === id)!))).toEqual({ ok: true });
    expect(refineMockLook(closet, base, "warmer")).toContain(closet[6].id); // suma el blazer
    expect(refineMockLook(closet, base, "lighter")).toBeNull(); // no hay abrigo que sacar
    expect(refineMockLook(closet, base, "drop_garment", closet[5].id)).toEqual([closet[1].id, closet[2].id]);
    expect(refineMockLook(closet, base, "drop_garment", closet[2].id)).toBeNull(); // sin parte de abajo ya no es un look
    expect(refineMockLook(closet, base, "swap_garment", closet[1].id)).toContain(closet[0].id);
    expect(refineMockLook(closet, ["no-existe"], "more_formal")).toBeNull();
  });
});

describe("el planificador del asesor simulado enruta los tres caminos", () => {
  const plan = (text: string, extra: Partial<Parameters<typeof planMockTurn>[0]> = {}) =>
    planMockTurn({ text, hasImage: false, start: false, missing: [], ...extra });

  it("evento, respuesta, look nuevo y botones", () => {
    expect(plan(SENTENCE).kind).toBe("event");
    const pending = eventAfterFirstTurn();
    expect(plan("Dice «formal de día»", { event: pending }).kind).toBe("event_answer");
    expect(plan("Quiero un look nuevo")).toEqual({ kind: "new_look", piece: null });
    const intent = { kind: "accept_search", outfit_id: "o", slot: "shoes" } as const;
    expect(plan("Sí, búscame opciones", { intent })).toEqual({ kind: "intent", intent });
  });

  it("no rompe lo anterior: '¿qué me pongo?' sigue siendo look, y en el onboarding 'eventos y matrimonios' es una respuesta", () => {
    expect(plan("¿Qué me pongo mañana?").kind).toBe("look");
    expect(plan("eventos y matrimonios", { missing: ["occasions"] }).kind).toBe("profile_answer");
    // con el evento ya completo, un mensaje cualquiera no se toma por respuesta
    expect(plan("hola", { event: { ...eventAfterFirstTurn(), missing: [] } }).kind).toBe("chat");
  });
});

describe("día normal (sin evento)", () => {
  it("propone sin preguntar y sin buscar", async () => {
    const f = makeEnv();
    await dayLookFlow(f.env, input({ userText: "¿Qué me pongo hoy?", recentUserTexts: ["¿Qué me pongo hoy?"] }), false);
    expect(names(f)).toEqual(["get_weather", "get_closet", "propose_outfit", "propose_outfit"]);
    expect(f.calls[0].input).toEqual({});
    expect(f.replies).toEqual([]);
    expect(findSearchQuote(["¿Qué me pongo hoy?"])).toBeNull();
  });
});
