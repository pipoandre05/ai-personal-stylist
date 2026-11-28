import { createSSEParser, encodeSSE, type ChatEvent } from "@aps/core";

describe("core en la app", () => {
  it("parsea una trama del contrato", () => {
    const original: ChatEvent = { type: "done", message_id: "m1" };
    const frame = encodeSSE(original);
    const mid = Math.floor(frame.length / 2);

    const received: ChatEvent[] = [];
    const parser = createSSEParser((event) => received.push(event));
    parser.push(frame.slice(0, mid));
    parser.push(frame.slice(mid));

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(original);
  });
});
