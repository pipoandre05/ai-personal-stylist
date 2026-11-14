import { describe, expect, it } from "vitest";
import {
  MAX_OPTIONS,
  applySelection,
  authorizeSearch,
  effectiveBudget,
  finalizeOptions,
  findOptionInThread,
  findSearchQuote,
  optionId,
  rankCandidates,
  safeHttpsUrl,
  selectedOptionFor,
  toProductOption,
  type ProductCandidate,
} from "@/lib/domain/shopping";
import { createSimulatedProductSearch, noProductSearch } from "@/lib/shopping/product-search";
import type { ChatMessagePart, ShoppingOptionsBlock } from "@/lib/domain/types";

const NOW = new Date("2026-11-14T13:40:00.000Z");
const cand = (over: Partial<ProductCandidate> = {}): ProductCandidate => ({
  store_name: "Tienda A",
  title: "Sandalia de cuero camel",
  price_clp: 54990,
  seen_at: NOW.toISOString(),
  url: "https://tienda-a.example/p/sandalia",
  affiliate: false,
  relevance: 0.5,
  ...over,
});

describe("validación de opciones de compra (C-4)", () => {
  it("solo acepta https, sin credenciales ni largos absurdos", () => {
    expect(safeHttpsUrl("https://tienda.cl/p/1")).toBe("https://tienda.cl/p/1");
    expect(safeHttpsUrl("http://tienda.cl/p/1")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("https://user:pass@tienda.cl/")).toBeNull();
    expect(safeHttpsUrl("//tienda.cl/p")).toBeNull();
    expect(safeHttpsUrl("https://localhost/p")).toBeNull();
    expect(safeHttpsUrl("https://x.cl/" + "a".repeat(2100))).toBeNull();
    expect(safeHttpsUrl(42)).toBeNull();
  });

  it("el precio es un entero positivo en CLP", () => {
    for (const price of [0, -1, 1999.5, Number.NaN, Infinity]) {
      const r = toProductOption(cand({ price_clp: price }), NOW, null);
      expect(r).toEqual({ ok: false, why: "price" });
    }
    expect(toProductOption(cand({ price_clp: 1 }), NOW, null).ok).toBe(true);
  });

  it("seen_at es obligatorio, válido y no está en el futuro", () => {
    expect(toProductOption(cand({ seen_at: "" }), NOW, null)).toEqual({ ok: false, why: "seen_at" });
    expect(toProductOption(cand({ seen_at: "ayer" }), NOW, null)).toEqual({ ok: false, why: "seen_at" });
    expect(toProductOption(cand({ seen_at: "2026-11-15T00:00:00Z" }), NOW, null)).toEqual({ ok: false, why: "seen_at" });
    expect(toProductOption(cand({ seen_at: undefined as unknown as string }), NOW, null)).toEqual({ ok: false, why: "seen_at" });
  });

  it("exige tienda y título, descarta http y normaliza imágenes", () => {
    expect(toProductOption(cand({ store_name: "  " }), NOW, null)).toEqual({ ok: false, why: "store" });
    expect(toProductOption(cand({ title: "" }), NOW, null)).toEqual({ ok: false, why: "title" });
    expect(toProductOption(cand({ url: "http://x.cl/a" }), NOW, null)).toEqual({ ok: false, why: "url" });
    const r = toProductOption(cand({ image_url: "http://x.cl/img.jpg", affiliate: true }), NOW, null);
    expect(r.ok && r.option.image_url).toBeNull();
    expect(r.ok && r.option.affiliate).toBe(true);
    expect(r.ok && r.option.image_cutout_url).toBeNull();
  });

  it("entrega como máximo 3 opciones y sin repetidas", () => {
    const many = Array.from({ length: 8 }, (_, i) => cand({ title: `P${i}`, url: `https://t.example/p/${i}`, price_clp: 10000 + i }));
    const { options } = finalizeOptions([...many, many[0]], { now: NOW });
    expect(options).toHaveLength(MAX_OPTIONS);
    expect(new Set(options.map((o) => o.id)).size).toBe(MAX_OPTIONS);
    const dup = finalizeOptions([many[0], many[0]], { now: NOW });
    expect(dup.options).toHaveLength(1);
  });

  it("respeta el presupuesto: nada por encima del tope y lo cuenta", () => {
    const { options, rejected } = finalizeOptions(
      [cand({ price_clp: 30000, url: "https://t.example/a" }), cand({ price_clp: 60000, url: "https://t.example/b" }), cand({ price_clp: 40000, url: "https://t.example/c" })],
      { now: NOW, budgetMaxClp: 40000 },
    );
    expect(options.map((o) => o.price_clp).sort()).toEqual([30000, 40000]);
    expect(rejected.budget).toBe(1);
  });

  it("tolera basura del buscador sin lanzar (dato no confiable)", () => {
    const junk = [null, 7, "x", {}, { title: "a" }] as unknown as ProductCandidate[];
    expect(finalizeOptions(junk, { now: NOW }).options).toEqual([]);
    expect(finalizeOptions(undefined as unknown as ProductCandidate[], { now: NOW }).options).toEqual([]);
  });

  it("el id de una opción es estable para la misma tienda y url", () => {
    expect(optionId("Tienda A", "https://a.example/p/1")).toBe(optionId("Tienda A", "https://a.example/p/1"));
    expect(optionId("Tienda A", "https://a.example/p/1")).not.toBe(optionId("Tienda B", "https://a.example/p/1"));
    expect(optionId("Tienda A", "https://a.example/p/1")).toMatch(/^opt-[0-9a-f]{8}$/);
  });
});

describe("orden sin pesar la afiliación (DP-10)", () => {
  const base = [
    cand({ store_name: "Tienda A", title: "A", url: "https://a.example/1", price_clp: 50000, relevance: 0.9 }),
    cand({ store_name: "Tienda B", title: "B", url: "https://b.example/1", price_clp: 40000, relevance: 0.9 }),
    cand({ store_name: "Tienda C", title: "C", url: "https://c.example/1", price_clp: 30000, relevance: 0.4 }),
    cand({ store_name: "Tienda D", title: "D", url: "https://d.example/1", price_clp: 20000, relevance: 0.4 }),
  ];

  it("ordena por relevancia, luego precio, luego tienda", () => {
    expect(rankCandidates(base).map((c) => c.title)).toEqual(["B", "A", "D", "C"]);
  });

  it("cambiar qué opciones son de afiliados no mueve el orden ni la selección", () => {
    const flags = [
      [true, false, false, false],
      [false, true, true, true],
      [true, true, true, true],
      [false, false, false, false],
    ];
    const reference = finalizeOptions(base, { now: NOW }).options.map((o) => o.title);
    for (const f of flags) {
      const withFlags = base.map((c, i) => ({ ...c, affiliate: f[i] }));
      expect(finalizeOptions(withFlags, { now: NOW }).options.map((o) => o.title)).toEqual(reference);
      // el orden de llegada tampoco importa
      expect(finalizeOptions([...withFlags].reverse(), { now: NOW }).options.map((o) => o.title)).toEqual(reference);
    }
  });

  it("la afiliación se informa en la opción", () => {
    const { options } = finalizeOptions([{ ...base[0], affiliate: true }, base[1]], { now: NOW });
    expect(options.find((o) => o.store_name === "Tienda A")?.affiliate).toBe(true);
    expect(options.find((o) => o.store_name === "Tienda B")?.affiliate).toBe(false);
  });
});

describe("presupuesto efectivo", () => {
  it("manda lo que dijo la persona sobre el perfil; ignora valores inválidos", () => {
    expect(effectiveBudget({ toolMaxClp: 30000, profileBudgetClp: 50000 })).toBe(30000);
    expect(effectiveBudget({ profileBudgetClp: 50000 })).toBe(50000);
    expect(effectiveBudget({ toolMaxClp: 0, profileBudgetClp: null })).toBeNull();
    expect(effectiveBudget({ toolMaxClp: 1.5 })).toBeNull();
  });
});

describe("la búsqueda solo ocurre si la persona la aceptó o la pidió", () => {
  const OUT = "11111111-1111-4111-8111-111111111111";
  const base = { outfitId: OUT, slot: "shoes" as const, intents: [], recentUserTexts: [] as string[] };

  it("accepted_offer exige un accept_search del mismo look y pieza", () => {
    expect(authorizeSearch({ ...base, authorization: "accepted_offer" }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "accepted_offer", intents: [{ kind: "decline_search", outfit_id: OUT, slot: "shoes" }] }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "accepted_offer", intents: [{ kind: "accept_search", outfit_id: OUT, slot: "bag" }] }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "accepted_offer", intents: [{ kind: "accept_search", outfit_id: "otro", slot: "shoes" }] }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "accepted_offer", intents: [{ kind: "accept_search", outfit_id: OUT, slot: "shoes" }] })).toEqual({ ok: true, trigger: "offer_accepted" });
  });

  it("person_request exige citar palabras reales de la persona que pidan buscar", () => {
    const texts = ["Este sábado tengo un matrimonio. Si no tengo nada, búscame opciones."];
    expect(authorizeSearch({ ...base, authorization: "person_request", recentUserTexts: texts }).ok).toBe(false); // sin cita
    expect(authorizeSearch({ ...base, authorization: "person_request", quote: "hola", recentUserTexts: texts }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "person_request", quote: "búscame fotos", recentUserTexts: texts }).ok).toBe(false); // no está
    expect(authorizeSearch({ ...base, authorization: "person_request", quote: "búscame opciones", recentUserTexts: texts })).toEqual({ ok: true, trigger: "person_request" });
  });

  it("refinement exige un refine_search sobre la misma búsqueda", () => {
    const refining = { block_id: "b", for_outfit_id: OUT, slot: "shoes" as const };
    const intents = [{ kind: "refine_search" as const, block_id: "b", change: "cheaper" as const }];
    expect(authorizeSearch({ ...base, authorization: "refinement", intents: [], refining: null }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "refinement", intents, refining: { ...refining, slot: "bag" } }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "refinement", intents, refining: { ...refining, for_outfit_id: "otro" } }).ok).toBe(false);
    expect(authorizeSearch({ ...base, authorization: "refinement", intents, refining })).toEqual({ ok: true, trigger: "refinement" });
  });

  it("findSearchQuote devuelve una frase que de verdad dijo la persona", () => {
    const q = findSearchQuote(["¿Qué me pongo?", "Quiero unos zapatos nuevos"]);
    expect(q).toBeTruthy();
    expect(authorizeSearch({ ...base, authorization: "person_request", quote: q ?? "", recentUserTexts: ["¿Qué me pongo?", "Quiero unos zapatos nuevos"] }).ok).toBe(true);
    expect(findSearchQuote(["¿Qué me pongo mañana?"])).toBeNull();
  });
});

describe("elegir una opción (C-5)", () => {
  const OUT = "11111111-1111-4111-8111-111111111111";
  const opt = (n: number) => finalizeOptions([cand({ title: `P${n}`, url: `https://t.example/${n}`, price_clp: 10000 + n })], { now: NOW }).options[0];
  const block = (id: string, outfit: string | null, options: ReturnType<typeof opt>[], selected: string | null = null): ChatMessagePart => ({
    type: "shopping_options",
    id,
    for_outfit_id: outfit,
    slot: "shoes",
    query: "q",
    searched: { stores: 4, results: 9 },
    options,
    refinements: [],
    trigger: "offer_accepted",
    budget_max_clp: null,
    selected_option_id: selected,
  });
  const rows = [
    { id: "m2", parts: [block("b2", OUT, [opt(3), opt(4)])] as ChatMessagePart[] },
    { id: "m1", parts: [block("b1", OUT, [opt(1), opt(2)], opt(1).id)] as ChatMessagePart[] },
  ];

  it("solo encuentra opciones mostradas para ese look", () => {
    expect(findOptionInThread(rows, OUT, opt(3).id)?.blockId).toBe("b2");
    expect(findOptionInThread(rows, OUT, "opt-deadbeef")).toBeNull();
    expect(findOptionInThread(rows, "otro-look", opt(3).id)).toBeNull();
  });

  it("marca la elegida y quita la marca de otros bloques del mismo look", () => {
    const changed = applySelection(rows, OUT, opt(3).id, "b2");
    expect(changed.map((c) => c.id).sort()).toEqual(["m1", "m2"]);
    const m1 = changed.find((c) => c.id === "m1")!.parts[0] as Extract<ChatMessagePart, { type: "shopping_options" }>;
    const m2 = changed.find((c) => c.id === "m2")!.parts[0] as Extract<ChatMessagePart, { type: "shopping_options" }>;
    expect(m1.selected_option_id).toBeNull();
    expect(m2.selected_option_id).toBe(opt(3).id);
  });

  it("deselecciona con null y no toca lo que no cambia", () => {
    const changed = applySelection(rows, OUT, null, null);
    expect(changed.map((c) => c.id)).toEqual(["m1"]);
    expect(applySelection(rows, "otro", opt(1).id, "b1")).toEqual([]);
  });

  it("la opción elegida de un look sale de los bloques del hilo", () => {
    const blocks = rows.flatMap((r) => r.parts.map((p) => ({ ...(p as object) }) as unknown as ShoppingOptionsBlock));
    expect(selectedOptionFor(blocks, OUT)?.id).toBe(opt(1).id);
    expect(selectedOptionFor(blocks, "otro")).toBeNull();
  });
});

describe("ProductSearch: simulada y none", () => {
  it("none dice que no hay búsqueda (el asesor describe la pieza)", async () => {
    expect(await noProductSearch.search({ description: "sandalia", category: "shoes" })).toEqual({ ok: false, reason: "unavailable" });
  });

  it("la simulada es determinista y devuelve fichas válidas en CLP entero", async () => {
    const s = createSimulatedProductSearch();
    const req = { description: "sandalia de taco ancho en tonos tierra", category: "shoes" as const };
    const a = await s.search(req, NOW);
    const b = await s.search(req, NOW);
    expect(a).toEqual(b);
    expect(a.ok && a.stores_searched).toBe(4);
    const { options } = finalizeOptions(a.ok ? a.candidates : [], { now: NOW });
    expect(options).toHaveLength(3);
    for (const o of options) {
      expect(Number.isInteger(o.price_clp)).toBe(true);
      expect(o.url.startsWith("https://")).toBe(true);
      expect(o.seen_at).toBe(NOW.toISOString());
    }
    // la de Tienda A es con comisión y la insignia llega a la ficha; las demás no
    expect(options.every((o) => o.affiliate === (o.store_name === "Tienda A"))).toBe(true);
  });

  it("respeta el presupuesto y la categoría", async () => {
    const s = createSimulatedProductSearch();
    const r = await s.search({ description: "zapatos", category: "shoes", max_price_clp: 35000 }, NOW);
    expect(r.ok && r.candidates.every((c) => c.price_clp <= 35000)).toBe(true);
    const bag = await s.search({ description: "cartera", category: "bag" }, NOW);
    expect(bag.ok && bag.candidates.length).toBeGreaterThan(0);
  });
});
