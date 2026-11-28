import { CHAT_EVENT_TYPES, type ChatEvent } from "./types";

/** Serializa un evento como trama SSE: `event: <tipo>` + `data: <json>`. Pura. */
export function encodeSSE(event: ChatEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

// Se deriva de la lista única junto a `ChatEvent` (types.ts): no mantener otra copia aquí.
const EVENT_TYPES: ReadonlySet<string> = new Set(CHAT_EVENT_TYPES);

/**
 * Parser SSE incremental (los chunks de red pueden cortar una trama a la mitad).
 * Soporta CRLF, comentarios (`:`), `data:` en varias líneas y tramas sin `event:`.
 */
export function createSSEParser(onEvent: (event: ChatEvent) => void) {
  let buffer = "";

  const dispatch = (frame: string) => {
    let name = "";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const idx = line.indexOf(":");
      const field = idx === -1 ? line : line.slice(0, idx);
      let value = idx === -1 ? "" : line.slice(idx + 1);
      if (value.startsWith(" ")) value = value.slice(1);
      if (field === "event") name = value;
      else if (field === "data") data.push(value);
    }
    if (data.length === 0) return;
    try {
      const payload = JSON.parse(data.join("\n")) as Record<string, unknown>;
      const type = typeof payload.type === "string" ? payload.type : name;
      if (EVENT_TYPES.has(type)) onEvent({ ...payload, type } as ChatEvent);
    } catch {
      // trama corrupta: se ignora, el flujo sigue
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n?/g, "\n");
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        dispatch(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
      }
    },
    flush() {
      if (buffer.trim()) dispatch(buffer);
      buffer = "";
    },
  };
}
