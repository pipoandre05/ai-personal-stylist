import { describe, expect, it } from "vitest";
import { DEFAULT_CONVERSATION_TITLE, displayTitle, titleFromEvent, titleFromFirstMessage } from "@/lib/domain/conversation-title";

describe("título de una sesión", () => {
  it("usa el primer mensaje, con mayúscula inicial", () => {
    expect(titleFromFirstMessage("quiero unos zapatos nuevos")).toBe("Quiero unos zapatos nuevos");
  });

  it("corta en una palabra completa y no pasa de 41 caracteres con la elipsis", () => {
    const t = titleFromFirstMessage("Tengo un matrimonio el sábado en Casablanca, de día y formal. ¿Qué me pongo?");
    expect(t.endsWith("…")).toBe(true);
    expect(t.length).toBeLessThanOrEqual(41);
    expect(t).toBe("Tengo un matrimonio el sábado en…");
  });

  it("una foto sin texto se llama Foto; sin nada, el nombre por defecto", () => {
    expect(titleFromFirstMessage("", true)).toBe("Foto");
    expect(titleFromFirstMessage("   ")).toBe(DEFAULT_CONVERSATION_TITLE);
  });

  it("no deja pasar marcado", () => {
    expect(titleFromFirstMessage("<inicio_conversacion/> hola")).toBe("Hola");
  });

  it("el evento nombra la sesión", () => {
    expect(titleFromEvent({ kind: "Matrimonio", place: "Casablanca" })).toBe("Matrimonio en Casablanca");
    expect(titleFromEvent({ kind: "Asado", place: null })).toBe("Asado");
    expect(titleFromEvent({ kind: null, place: "Santiago" })).toBeNull();
  });

  it("lo que se muestra nunca queda vacío", () => {
    expect(displayTitle("")).toBe(DEFAULT_CONVERSATION_TITLE);
    expect(displayTitle(null)).toBe(DEFAULT_CONVERSATION_TITLE);
    expect(displayTitle("Asado")).toBe("Asado");
  });
});
