import { describe, expect, it } from "vitest";
import { buildPersonContext } from "@/lib/agent/context";
import { SEASON_PALETTES } from "@/lib/domain/palettes";

const now = new Date("2026-11-14T15:00:00Z");

describe("buildPersonContext", () => {
  it("incluye fecha de Santiago, ciudad, perfil, paleta, memoria y resumen del clóset", () => {
    const text = buildPersonContext({
      now,
      profile: { display_name: "Cami", city: "Valparaíso" },
      style: { current_style: ["casual", "minimalista"], comfort_constraints: ["sin tacos"], risk_level: 2 },
      palette: { ...SEASON_PALETTES.otono, confidence: "media", source: "manual" },
      facts: [{ fact: "Trabaja en oficina con aire acondicionado", kind: "context" }],
      closet: [
        { name: "Camisa blanca", category: "top" },
        { name: "Polera negra", category: "top" },
        { name: "Jeans rectos", category: "bottom" },
      ],
    });
    expect(text.startsWith("<contexto_persona>")).toBe(true);
    expect(text.endsWith("</contexto_persona>")).toBe(true);
    expect(text).toContain("sábado, 14 de noviembre de 2026 (2026-11-14)");
    expect(text).toContain("Ciudad: Valparaíso");
    expect(text).toContain("Estilo actual: casual, minimalista");
    expect(text).toContain("Restricciones de comodidad: sin tacos");
    expect(text).toContain("Otoño, subtono cálido");
    expect(text).toContain("elegida a mano");
    expect(text).toContain("terracota (#B5654A)");
    expect(text).toContain("(context) Trabaja en oficina");
    expect(text).toContain("Arriba (2): Camisa blanca, Polera negra");
    expect(text).toContain("Abajo (1): Jeans rectos");
  });

  it("no filtra ids ni fotos del clóset", () => {
    const text = buildPersonContext({
      now,
      profile: null,
      style: null,
      palette: null,
      facts: [],
      closet: [{ name: "Chaqueta", category: "outerwear" }],
    });
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
    expect(text).not.toContain("photo");
  });

  it("es honesto cuando no hay datos", () => {
    const text = buildPersonContext({ now, profile: null, style: null, palette: null, facts: [], closet: [] });
    expect(text).toContain("Ciudad: Santiago");
    expect(text).toContain("todavía sin completar");
    expect(text).toContain("todavía no hay");
    expect(text).toContain("Clóset: todavía sin prendas");
  });

  it("es determinista para el mismo día (cacheable)", () => {
    const input = { now, profile: null, style: null, palette: null, facts: [], closet: [] };
    const later = new Date("2026-11-14T22:00:00Z"); // mismo día en Santiago
    expect(buildPersonContext({ ...input, now: later })).toBe(buildPersonContext(input));
  });

  it("resume y recorta categorías largas", () => {
    const closet = Array.from({ length: 12 }, (_, i) => ({ name: `Polera ${i}`, category: "top" as const }));
    const text = buildPersonContext({ now, profile: null, style: null, palette: null, facts: [], closet });
    expect(text).toContain("Arriba (12)");
    expect(text).toContain("y 4 más");
  });
});
