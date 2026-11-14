import { describe, expect, it } from "vitest";
import {
  applyEventToTurn,
  buildThreadItemsV2,
  buildTurnItems,
  emptyTurnState,
  findFreshOutfitId,
  freshOutfitIdOf,
  normalizeSteps,
} from "@/components/chat/v2/thread-items-v2";
import type { ChatEvent, ChatMessageView, OutfitView, ShoppingOptionsBlock, ToolStep } from "@/lib/domain/types";

const look = (id: string, over: Partial<OutfitView> = {}): OutfitView => ({
  id,
  title: `Look ${id}`,
  occasion: "Matrimonio",
  rationale: "Porque sí.",
  status: "proposed",
  weather: null,
  missing_piece: null,
  rating: null,
  created_at: "2026-11-14T13:00:00Z",
  items: [],
  ...over,
});

const step = (id: string, tool: ToolStep["tool"], status: ToolStep["status"], over: Partial<ToolStep> = {}): ToolStep => ({
  id,
  tool,
  status,
  label_running: "Haciendo",
  label_done: "Hice",
  ...over,
});

const block = (over: Partial<ShoppingOptionsBlock> = {}): ShoppingOptionsBlock => ({
  id: "b1",
  for_outfit_id: "o1",
  slot: "shoes",
  query: "zapatos",
  searched: { stores: 3, results: 10 },
  options: [
    {
      id: "opt-1",
      store_name: "Tienda A",
      title: "Sandalia",
      price_clp: 54990,
      seen_at: "2026-11-14T13:40:00Z",
      url: "https://a.example/x",
      image_cutout_url: null,
      image_url: null,
      affiliate: true,
      reason: "Porque calza.",
    },
  ],
  refinements: [],
  trigger: "offer_accepted",
  budget_max_clp: null,
  selected_option_id: null,
  ...over,
});

const msg = (over: Partial<ChatMessageView> & Pick<ChatMessageView, "id" | "role">): ChatMessageView => ({
  text: "",
  outfits: [],
  garments: [],
  palette: null,
  image_url: null,
  quick_replies: null,
  memory_notes: [],
  created_at: "2026-11-14T13:00:00Z",
  ...over,
});

describe("normalizeSteps", () => {
  it("un id repetido reemplaza al anterior y conserva su lugar", () => {
    const out = normalizeSteps([
      step("s1", "get_weather", "running"),
      step("s2", "get_closet", "running"),
      step("s1", "get_weather", "done", { detail: "listo" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(out[0].status).toBe("done");
  });

  it("acepta undefined (mensajes anteriores a v2)", () => {
    expect(normalizeSteps(undefined)).toEqual([]);
  });
});

describe("buildTurnItems", () => {
  it("un mensaje sin campos v2 no produce ítems", () => {
    expect(buildTurnItems({ id: "m" })).toEqual([]);
  });

  it("orden: evento, pasos, looks, oferta, paso de búsqueda, opciones", () => {
    const items = buildTurnItems(
      {
        id: "m",
        tool_steps: [step("s1", "search_products", "done"), step("s2", "get_closet", "done")],
        event_summary: {
          kind: "Boda",
          date: null,
          place: null,
          place_note: null,
          setting: { time_of_day: null, venue: null },
          dress_code: null,
          weather: null,
          missing: [],
        },
        outfits: [look("o1")],
        search_offer: { id: "of", outfit_id: "o1", slot: "shoes", description: "x", actions: [] },
        shopping_blocks: [block()],
      },
      { isLastMessage: true },
    );
    expect(items.map((i) => i.kind)).toEqual(["event", "steps", "outfit", "offer", "steps", "options"]);
    const [, work, , , search] = items;
    expect(work.kind === "steps" && work.phase).toBe("work");
    expect(search.kind === "steps" && search.phase).toBe("search");
  });

  it("agrupa dos looks con el mismo pair_id, el seguro primero, en el lugar del primero que llegó", () => {
    const items = buildTurnItems({
      id: "m",
      outfits: [look("a", { variant: "atrevido", pair_id: "p" }), look("c"), look("b", { variant: "seguro", pair_id: "p" })],
    });
    expect(items.map((i) => i.kind)).toEqual(["pair", "outfit"]);
    const pair = items[0];
    expect(pair.kind === "pair" && pair.outfits.map((o) => o.id)).toEqual(["b", "a"]);
  });

  it("un pair_id con un solo look queda como look suelto", () => {
    const items = buildTurnItems({ id: "m", outfits: [look("a", { pair_id: "p", variant: "seguro" })] });
    expect(items.map((i) => i.kind)).toEqual(["outfit"]);
  });

  it("solo es 'fresh' el look indicado y mientras siga propuesto", () => {
    const outfits = [look("a"), look("b", { status: "saved" })];
    const items = buildTurnItems({ id: "m", outfits }, { freshOutfitId: "b" });
    expect(items.map((i) => i.kind === "outfit" && i.fresh)).toEqual([false, false]);
    const items2 = buildTurnItems({ id: "m", outfits }, { freshOutfitId: "a" });
    expect(items2.map((i) => i.kind === "outfit" && i.fresh)).toEqual([true, false]);
  });

  it("la oferta solo está pendiente en el último mensaje", () => {
    const src = { id: "m", search_offer: { id: "of", outfit_id: "o", slot: "shoes" as const, description: "x", actions: [] } };
    expect((buildTurnItems(src, { isLastMessage: true })[0] as { pending: boolean }).pending).toBe(true);
    expect((buildTurnItems(src, { isLastMessage: false })[0] as { pending: boolean }).pending).toBe(false);
    expect((buildTurnItems(src)[0] as { pending: boolean }).pending).toBe(false);
  });

  it("las opciones encuentran su look en el mismo turno o en otro mensaje", () => {
    const same = buildTurnItems({ id: "m", outfits: [look("o1")], shopping_blocks: [block()] });
    expect(same[1].kind === "options" && same[1].outfit?.id).toBe("o1");

    const other = look("o1");
    const elsewhere = buildTurnItems({ id: "m", shopping_blocks: [block()] }, { findOutfit: (id) => (id === "o1" ? other : undefined) });
    expect(elsewhere[0].kind === "options" && elsewhere[0].outfit?.id).toBe("o1");

    const none = buildTurnItems({ id: "m", shopping_blocks: [block({ for_outfit_id: null })] });
    expect(none[0].kind === "options" && none[0].outfit).toBeNull();
  });

  it("la opción elegida del bloque entra al look aunque el look aún no la traiga", () => {
    const items = buildTurnItems({ id: "m", outfits: [look("o1")], shopping_blocks: [block({ selected_option_id: "opt-1" })] });
    expect(items[0].kind === "outfit" && items[0].outfit.selected_option?.id).toBe("opt-1");
    expect(items[1].kind === "options" && items[1].outfit?.selected_option?.id).toBe("opt-1");
  });

  it("los pasos con error o en curso marcan 'running' solo cuando alguno corre", () => {
    const run = buildTurnItems({ id: "m", tool_steps: [step("s", "get_closet", "running")] })[0];
    const done = buildTurnItems({ id: "m", tool_steps: [step("s", "get_closet", "error")] })[0];
    expect(run.kind === "steps" && run.running).toBe(true);
    expect(done.kind === "steps" && done.running).toBe(false);
  });

  it("las claves son estables y únicas", () => {
    const src = { id: "m", outfits: [look("a"), look("b")], shopping_blocks: [block(), block({ id: "b2" })] };
    const keys = buildTurnItems(src).map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(buildTurnItems(src).map((i) => i.key)).toEqual(keys);
  });
});

describe("findFreshOutfitId / freshOutfitIdOf", () => {
  it("el último look sin par ni guardar del último mensaje con looks", () => {
    const msgs = [
      msg({ id: "1", role: "assistant", outfits: [look("a")] }),
      msg({ id: "2", role: "user" }),
      msg({ id: "3", role: "assistant", outfits: [look("b"), look("c")] }),
      msg({ id: "4", role: "assistant", text: "solo texto" }),
    ];
    expect(findFreshOutfitId(msgs)).toBe("c");
  });

  it("un par no tiene look destacado; uno guardado tampoco", () => {
    expect(freshOutfitIdOf([look("a", { pair_id: "p" }), look("b", { pair_id: "p" })])).toBeNull();
    expect(freshOutfitIdOf([look("a", { status: "saved" })])).toBeNull();
    expect(freshOutfitIdOf([])).toBeNull();
  });
});

describe("buildThreadItemsV2", () => {
  it("devuelve ítems solo para mensajes del asesor; los viejos dan lista vacía", () => {
    const msgs = [msg({ id: "u", role: "user" }), msg({ id: "a", role: "assistant", text: "hola" })];
    expect(buildThreadItemsV2(msgs)).toEqual([{ messageId: "a", items: [] }]);
  });

  it("marca fresh solo en el último look del hilo y deja la oferta pendiente solo en el último mensaje", () => {
    const msgs = [
      msg({ id: "a1", role: "assistant", outfits: [look("o0")] }),
      msg({
        id: "a2",
        role: "assistant",
        outfits: [look("o1")],
        search_offer: { id: "of", outfit_id: "o1", slot: "shoes", description: "x", actions: [] },
      }),
    ];
    const [first, second] = buildThreadItemsV2(msgs);
    expect(first.items[0].kind === "outfit" && first.items[0].fresh).toBe(false);
    expect(second.items[0].kind === "outfit" && second.items[0].fresh).toBe(true);
    expect(second.items[1].kind === "offer" && second.items[1].pending).toBe(true);
    expect(first.items.some((i) => i.kind === "offer")).toBe(false);
  });

  it("un bloque de opciones usa el look de un mensaje anterior", () => {
    const msgs = [
      msg({ id: "a1", role: "assistant", outfits: [look("o1")] }),
      msg({ id: "a2", role: "assistant", shopping_blocks: [block()] }),
    ];
    const [, second] = buildThreadItemsV2(msgs);
    expect(second.items[0].kind === "options" && second.items[0].outfit?.id).toBe("o1");
  });
});

describe("applyEventToTurn", () => {
  const ev = (e: unknown) => e as ChatEvent;

  it("tool_step reemplaza por id y conserva el orden de primera aparición", () => {
    let s = emptyTurnState();
    s = applyEventToTurn(s, ev({ type: "tool_step", ...step("s1", "get_weather", "running") }));
    s = applyEventToTurn(s, ev({ type: "tool_step", ...step("s2", "get_closet", "running") }));
    s = applyEventToTurn(s, ev({ type: "tool_step", ...step("s1", "get_weather", "done", { detail: "listo" }) }));
    expect(s.tool_steps.map((x) => `${x.id}:${x.status}`)).toEqual(["s1:done", "s2:running"]);
    expect("type" in s.tool_steps[0]).toBe(false);
  });

  it("event_summary: el último gana; outfit y shopping_options: upsert por id", () => {
    let s = emptyTurnState();
    s = applyEventToTurn(s, ev({ type: "event_summary", kind: "A", date: null, place: null, place_note: null, setting: { time_of_day: null, venue: null }, dress_code: null, weather: null, missing: [] }));
    s = applyEventToTurn(s, ev({ type: "event_summary", kind: "B", date: null, place: null, place_note: null, setting: { time_of_day: null, venue: null }, dress_code: null, weather: null, missing: [] }));
    expect(s.event_summary?.kind).toBe("B");

    s = applyEventToTurn(s, { type: "outfit", outfit: look("o1", { title: "uno" }) });
    s = applyEventToTurn(s, { type: "outfit", outfit: look("o2") });
    s = applyEventToTurn(s, { type: "outfit", outfit: look("o1", { title: "uno v2" }) });
    expect(s.outfits.map((o) => `${o.id}:${o.title}`)).toEqual(["o1:uno v2", "o2:Look o2"]);

    s = applyEventToTurn(s, ev({ type: "shopping_options", ...block() }));
    s = applyEventToTurn(s, ev({ type: "shopping_options", ...block({ selected_option_id: "opt-1" }) }));
    expect(s.shopping_blocks).toHaveLength(1);
    expect(s.shopping_blocks[0].selected_option_id).toBe("opt-1");
  });

  it("deja pasar lo que no es de v2 sin tocar el estado, y no muta el anterior", () => {
    const s0 = emptyTurnState();
    expect(applyEventToTurn(s0, { type: "text_delta", text: "hola" })).toBe(s0);
    expect(applyEventToTurn(s0, { type: "tool", name: "get_closet", status: "start" })).toBe(s0);
    expect(applyEventToTurn(s0, { type: "done", message_id: "m" })).toBe(s0);
    const s1 = applyEventToTurn(s0, { type: "outfit", outfit: look("o1") });
    expect(s0.outfits).toHaveLength(0);
    expect(s1.outfits).toHaveLength(1);
  });

  it("un turno en vivo completo se convierte en ítems", () => {
    let s = emptyTurnState();
    for (const e of [
      ev({ type: "tool_step", ...step("s1", "get_closet", "done") }),
      { type: "outfit", outfit: look("o1") } as ChatEvent,
      ev({ type: "search_offer", id: "of", outfit_id: "o1", slot: "shoes", description: "x", actions: [] }),
    ]) {
      s = applyEventToTurn(s, e);
    }
    const items = buildTurnItems({ id: "live", ...s }, { freshOutfitId: freshOutfitIdOf(s.outfits), isLastMessage: true });
    expect(items.map((i) => i.kind)).toEqual(["steps", "outfit", "offer"]);
    expect(items[1].kind === "outfit" && items[1].fresh).toBe(true);
  });
});
