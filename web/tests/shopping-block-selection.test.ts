import { describe, expect, it } from "vitest";
import { applyBlockSelection, findOptionInBlock } from "@/lib/domain/shopping";
import type { ChatMessagePart, ProductOption, ShoppingOptionsBlock } from "@/lib/domain/types";

const opt = (n: number): ProductOption =>
  ({ id: `opt-0000000${n}`, store_name: "Tienda", title: `Zapato ${n}`, price_clp: 30000 + n, url: `https://tienda.cl/p/${n}`, affiliate: false }) as unknown as ProductOption;

const block = (id: string, outfit: string | null, selected: string | null = null): ChatMessagePart =>
  ({
    type: "shopping_options",
    id,
    for_outfit_id: outfit,
    slot: "shoes",
    query: "zapatos",
    searched: { stores: 7, results: 40 },
    options: [opt(1), opt(2), opt(3)],
    refinements: [],
    trigger: "person_request",
    budget_max_clp: null,
    selected_option_id: selected,
  }) as unknown as ChatMessagePart;

const selectedOf = (parts: ChatMessagePart[], id: string) =>
  (parts.find((p) => p.type === "shopping_options" && (p as unknown as ShoppingOptionsBlock).id === id) as unknown as ShoppingOptionsBlock).selected_option_id;

describe("elegir una opción de una búsqueda sin look (D-11)", () => {
  const rows = [
    { id: "m1", parts: [{ type: "text", text: "hola" } as unknown as ChatMessagePart, block("suelto", null)] },
    { id: "m2", parts: [block("otro-suelto", null, opt(2).id), block("de-look", "11111111-1111-4111-8111-111111111111")] },
  ];

  it("encuentra la opción solo si se mostró en ese bloque", () => {
    expect(findOptionInBlock(rows, "suelto", opt(2).id)?.title).toBe("Zapato 2");
    expect(findOptionInBlock(rows, "suelto", "opt-ffffffff")).toBeNull();
    expect(findOptionInBlock(rows, "no-existe", opt(1).id)).toBeNull();
  });

  it("no sirve para un bloque que pertenece a un look: ese va por su propio camino", () => {
    expect(findOptionInBlock(rows, "de-look", opt(1).id)).toBeNull();
    expect(applyBlockSelection(rows, "de-look", opt(1).id)).toEqual([]);
  });

  it("marca la opción solo en ese bloque y no toca las demás búsquedas", () => {
    const changed = applyBlockSelection(rows, "suelto", opt(3).id);
    expect(changed.map((c) => c.id)).toEqual(["m1"]);
    expect(selectedOf(changed[0].parts, "suelto")).toBe(opt(3).id);
    expect(selectedOf(rows[1].parts, "otro-suelto")).toBe(opt(2).id);
  });

  it("quita la elección con null y no reporta cambios si ya estaba igual", () => {
    const cleared = applyBlockSelection(rows, "otro-suelto", null);
    expect(selectedOf(cleared[0].parts, "otro-suelto")).toBeNull();
    expect(applyBlockSelection(rows, "suelto", null)).toEqual([]);
  });
});
