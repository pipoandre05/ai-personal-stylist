import { describe, expect, it } from "vitest";
import { createSSEParser, encodeSSE } from "@/lib/chat/sse";
import { CHAT_EVENT_TYPES, type ChatEvent, type ColorAnalysis, type GarmentView, type OutfitView } from "@/lib/domain/types";

function collect(chunks: string[]): ChatEvent[] {
  const out: ChatEvent[] = [];
  const p = createSSEParser((e) => out.push(e));
  for (const c of chunks) p.push(c);
  p.flush();
  return out;
}

describe("SSE", () => {
  it("encodeSSE y el parser son inversos", () => {
    const events: ChatEvent[] = [
      { type: "conversation", id: "c1" },
      { type: "text_delta", text: "Hola\ncon salto" },
      { type: "tool", name: "get_closet", status: "start" },
      { type: "done", message_id: "m1" },
    ];
    expect(collect([events.map(encodeSSE).join("")])).toEqual(events);
  });

  it("une tramas cortadas por la red en cualquier punto", () => {
    const frame = encodeSSE({ type: "text_delta", text: "así llegó en partes" });
    for (let cut = 1; cut < frame.length; cut++) {
      expect(collect([frame.slice(0, cut), frame.slice(cut)])).toEqual([
        { type: "text_delta", text: "así llegó en partes" },
      ]);
    }
  });

  it("entiende CRLF, comentarios y data en varias líneas", () => {
    const raw = ': keepalive\r\n\r\nevent: error\r\ndata: {"type":"error",\r\ndata: "message":"fallo"}\r\n\r\n';
    expect(collect([raw])).toEqual([{ type: "error", message: "fallo" }]);
  });

  it("usa el nombre del evento si el JSON no trae type", () => {
    expect(collect(['event: conversation\ndata: {"id":"abc"}\n\n'])).toEqual([{ type: "conversation", id: "abc" }]);
  });

  it("ignora tramas corruptas y tipos desconocidos sin cortar el flujo", () => {
    const raw = 'event: text_delta\ndata: {no es json}\n\nevent: raro\ndata: {"type":"raro"}\n\n' + encodeSSE({ type: "done", message_id: "m" });
    expect(collect([raw])).toEqual([{ type: "done", message_id: "m" }]);
  });

  it("flush entrega una trama final sin línea en blanco", () => {
    expect(collect(['event: done\ndata: {"type":"done","message_id":"z"}'])).toEqual([{ type: "done", message_id: "z" }]);
  });

  it("el parser acepta todos los tipos de ChatEvent (regresión: garment, palette y quick_replies se descartaban)", () => {
    // Record exhaustivo: si se agrega un tipo a ChatEvent sin muestra aquí, no compila.
    const samples: Record<ChatEvent["type"], ChatEvent> = {
      conversation: { type: "conversation", id: "c" },
      text_delta: { type: "text_delta", text: "t" },
      tool: { type: "tool", name: "get_closet", status: "end" },
      outfit: { type: "outfit", outfit: { id: "o" } as OutfitView },
      garment: { type: "garment", garment: { id: "g" } as GarmentView },
      palette: { type: "palette", analysis: { id: "a" } as ColorAnalysis },
      quick_replies: { type: "quick_replies", options: ["a", "b"], multiple: false },
      memory: { type: "memory", id: "m", fact: "f", kind: "preference" },
      tool_step: { type: "tool_step", id: "s1", tool: "get_closet", status: "done", label_running: "Revisando", label_done: "Revisé", detail: "3 prendas", items: [{ garment_id: "g", chosen: true }] },
      event_summary: {
        type: "event_summary",
        kind: "Matrimonio",
        date: "2026-11-21",
        place: "Casablanca",
        place_note: "En una viña",
        setting: { time_of_day: "day", venue: "outdoor" },
        dress_code: null,
        weather: { min: 11, max: 27, note: "Despejado" },
        missing: ["dress_code"],
      },
      shopping_options: {
        type: "shopping_options",
        id: "b1",
        for_outfit_id: "o",
        slot: "shoes",
        query: "sandalia",
        searched: { stores: 4, results: 6 },
        options: [],
        refinements: [],
        trigger: "offer_accepted",
        budget_max_clp: null,
        selected_option_id: null,
      },
      search_offer: { type: "search_offer", id: "f1", outfit_id: "o", slot: "shoes", description: "sandalia", actions: [] },
      done: { type: "done", message_id: "d" },
      error: { type: "error", message: "e" },
    };
    expect([...CHAT_EVENT_TYPES].sort()).toEqual(Object.keys(samples).sort());
    for (const type of CHAT_EVENT_TYPES) {
      expect(collect([encodeSSE(samples[type])]), `tipo ${type}`).toEqual([samples[type]]);
    }
  });
});
