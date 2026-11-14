import { describe, expect, it } from "vitest";
import { createSSEParser, encodeSSE } from "@/lib/chat/sse";
import type { ChatEvent } from "@/lib/domain/types";

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
});
