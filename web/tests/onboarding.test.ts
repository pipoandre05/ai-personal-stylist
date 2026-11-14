import { describe, expect, it } from "vitest";
import { isOnboardingComplete, missingProfileFields } from "@/lib/domain/profile-completeness";
import { parseProfileAnswer, planMockTurn, questionFor } from "@/lib/agent/mock-script";
import { buildPersonContext } from "@/lib/agent/context";
import { mockAnalyzeColor, mockDescribeGarment } from "@/lib/ai/mock";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";

const UID = "6f1c2c1e-3b4a-4f7e-9a10-1234567890ab";

describe("perfil incompleto", () => {
  it("sin datos faltan todos los campos, en el orden de la conversación", () => {
    expect(missingProfileFields(null, null)).toEqual([
      "display_name",
      "clothing_sections",
      "current_style",
      "aspirational_style",
      "occasions",
      "fit_and_comfort",
    ]);
  });

  it("calce o comodidad cuentan como respondido", () => {
    expect(missingProfileFields({ display_name: "Cami" }, { fit_preferences: ["holgado"] })).not.toContain("fit_and_comfort");
    expect(missingProfileFields({ display_name: "Cami" }, { comfort_constraints: ["sin tacos"] })).not.toContain("fit_and_comfort");
    expect(missingProfileFields({ display_name: "  " }, null)).toContain("display_name");
  });

  it("el onboarding se completa con nombre, estilo actual y ocasiones", () => {
    const profile = { display_name: "Cami" };
    expect(isOnboardingComplete(profile, { current_style: ["casual"] })).toBe(false);
    expect(isOnboardingComplete(profile, { current_style: ["casual"], occasions: ["oficina"] })).toBe(true);
    expect(isOnboardingComplete({ display_name: null }, { current_style: ["casual"], occasions: ["oficina"] })).toBe(false);
  });

  it("el contexto del agente expone perfil_incompleto, prendas_listas y tiene_paleta", () => {
    const base = { now: new Date("2026-11-14T15:00:00Z"), profile: null, style: null, palette: null, facts: [], closet: [] };
    const empty = buildPersonContext(base);
    expect(empty).toContain("perfil_incompleto: display_name, clothing_sections");
    expect(empty).toContain("prendas_listas: 0");
    expect(empty).toContain("tiene_paleta: false");

    const full = buildPersonContext({
      ...base,
      profile: { display_name: "Cami", city: "Santiago" },
      style: { clothing_sections: ["mujer"], current_style: ["casual"], aspirational_style: ["elegante"], occasions: ["oficina"], fit_preferences: ["regular"] },
      closet: [{ name: "Polera", category: "top" }, { name: "Jeans", category: "bottom" }],
    });
    expect(full).toContain("perfil_incompleto: ninguno");
    expect(full).toContain("prendas_listas: 2");
  });
});

describe("guion del asesor simulado", () => {
  const base = { text: "", hasImage: false, start: false, missing: ["display_name"] as never[] };

  it("saluda al iniciar", () => {
    expect(planMockTurn({ ...base, start: true })).toEqual({ kind: "greet" });
  });

  it("con foto usa add_garment, o analyze_palette si el texto habla de selfie, paleta, cara o color", () => {
    expect(planMockTurn({ ...base, text: "", hasImage: true })).toEqual({ kind: "photo", tool: "add_garment" });
    expect(planMockTurn({ ...base, text: "mi camisa", hasImage: true })).toEqual({ kind: "photo", tool: "add_garment" });
    for (const text of ["esta es mi selfie", "para mi paleta", "mira mi cara", "qué color me va"]) {
      expect(planMockTurn({ ...base, text, hasImage: true })).toEqual({ kind: "photo", tool: "analyze_palette" });
    }
  });

  it("un pedido de look va primero aunque falte perfil; si no, responde la pregunta pendiente", () => {
    expect(planMockTurn({ ...base, text: "¿Qué me pongo mañana?" })).toEqual({ kind: "look" });
    expect(planMockTurn({ ...base, text: "Cami" })).toEqual({ kind: "profile_answer", field: "display_name" });
    expect(planMockTurn({ ...base, missing: [], text: "hola" })).toEqual({ kind: "chat" });
    expect(planMockTurn({ ...base, missing: [], text: "¿Qué me falta?" })).toEqual({ kind: "missing" });
  });

  it("interpreta las respuestas del perfil", () => {
    expect(parseProfileAnswer("display_name", "me llamo camila.")).toEqual({ display_name: "Camila" });
    expect(parseProfileAnswer("clothing_sections", "mujer")).toEqual({ clothing_sections: ["mujer"] });
    expect(parseProfileAnswer("current_style", "casual y minimalista")).toEqual({ current_style: ["casual", "minimalista"] });
    expect(parseProfileAnswer("current_style", "algo cómodo, sencillo")).toEqual({ current_style: ["algo cómodo", "sencillo"] });
    expect(parseProfileAnswer("occasions", "oficina, citas")).toEqual({ occasions: ["oficina", "citas"] });
    expect(parseProfileAnswer("fit_and_comfort", "holgado y sin tacos")).toEqual({
      fit_preferences: ["holgado"],
      comfort_constraints: ["sin tacos"],
    });
    expect(parseProfileAnswer("fit_and_comfort", "Nada en particular")).toEqual({ fit_preferences: ["sin preferencia"] });
  });

  it("cada pregunta ofrece respuestas de un toque, salvo el nombre", () => {
    expect(questionFor("display_name", null).options).toEqual([]);
    for (const f of ["clothing_sections", "current_style", "aspirational_style", "occasions", "fit_and_comfort"] as const) {
      const q = questionFor(f, "Cami");
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(6);
    }
  });
});

describe("marcadores de prueba en el nombre de archivo", () => {
  const f = (name: string) => `${UID}/chat/${name}`;

  it("no-prenda y sin-rostro simulan fotos inválidas y siguen siendo rutas válidas", () => {
    expect(isOwnPhotoPath(f("foto-no-prenda.jpg"), UID)).toBe(true);
    expect(mockDescribeGarment(f("foto-no-prenda.jpg")).is_garment).toBe(false);
    expect(mockAnalyzeColor(f("selfie-sin-rostro.jpg")).is_face_visible).toBe(false);
    expect(mockAnalyzeColor(f("selfie-normal-1.jpg")).is_face_visible).toBe(true);
  });

  it("-<categoría> fuerza la categoría reconocida", () => {
    for (const c of ["top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"] as const) {
      expect(mockDescribeGarment(f(`prenda-${c}.jpg`)).category).toBe(c);
    }
  });

  it("rutas de chat de otra persona o fuera de carpeta no se aceptan", () => {
    expect(isOwnPhotoPath(`otra-persona/chat/prenda-top.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/otros/prenda-top.jpg`, UID)).toBe(false);
  });
});
