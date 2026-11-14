import { describe, expect, it } from "vitest";
import { isV2Turn, toItems } from "@/components/chat/thread-types";
import type { ChatMessageView, OutfitView } from "@/lib/domain/types";

const outfit = (over: Partial<OutfitView> = {}): OutfitView => ({
  id: "o1",
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

const msg = (over: Partial<ChatMessageView> = {}): ChatMessageView => ({
  id: "m1",
  role: "assistant",
  text: "Hola",
  outfits: [],
  garments: [],
  palette: null,
  image_url: null,
  quick_replies: null,
  memory_notes: [],
  created_at: "2026-11-14T10:00:00Z",
  ...over,
});

describe("integración del contrato v2 al hilo", () => {
  it("toItems copia los campos v2 del mensaje guardado", () => {
    const steps = [{ id: "s1", tool: "get_closet" as const, status: "done" as const, label_running: "a", label_done: "b" }];
    const [item] = toItems([msg({ tool_steps: steps, shopping_blocks: [], search_offer: null })]);
    expect(item.kind).toBe("advisor");
    if (item.kind === "advisor") {
      expect(item.tool_steps).toEqual(steps);
      expect(isV2Turn(item)).toBe(true);
    }
  });

  it("un mensaje anterior a v2 no es un turno v2 y conserva su look", () => {
    const [item] = toItems([msg({ outfits: [outfit()] })]);
    if (item.kind !== "advisor") throw new Error("advisor");
    expect(isV2Turn(item)).toBe(false);
    expect(item.outfits).toHaveLength(1);
    expect(item.tool_steps).toEqual([]);
    expect(item.event_summary).toBeNull();
  });

  it("un look con variante o par marca el turno como v2", () => {
    const [item] = toItems([msg({ outfits: [outfit({ variant: "seguro", pair_id: "p" })] })]);
    if (item.kind !== "advisor") throw new Error("advisor");
    expect(isV2Turn(item)).toBe(true);
  });
});
