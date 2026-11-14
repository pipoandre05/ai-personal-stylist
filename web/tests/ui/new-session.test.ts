import { describe, expect, it } from "vitest";
import { startsNewSession } from "@/components/chat/new-session";

describe("Nueva conversación reinicia el hilo", () => {
  it("volver a /asesor desde una sesión en curso parte de cero", () => {
    expect(startsNewSession("/asesor/1df7ea08-fae5-4348-b95e-3323e0eba342", "/asesor")).toBe(true);
    expect(startsNewSession("/closet", "/asesor")).toBe(true);
  });

  it("pasar de /asesor a /asesor/<id> al enviar el primer mensaje NO reinicia (no corta la respuesta)", () => {
    expect(startsNewSession("/asesor", "/asesor/1df7ea08-fae5-4348-b95e-3323e0eba342")).toBe(false);
  });

  it("quedarse en /asesor o abrir otra sesión pasada no reinicia", () => {
    expect(startsNewSession("/asesor", "/asesor")).toBe(false);
    expect(startsNewSession("/asesor/a", "/asesor/b")).toBe(false);
  });
});
