import { describe, expect, it } from "vitest";
import { hashString, mockAnalyzeColor, mockDescribeGarment } from "@/lib/ai/mock";
import { normalizeColorVision, normalizeGarmentVision } from "@/lib/ai/normalize";
import { GARMENT_CATEGORIES, COLOR_SEASONS } from "@/lib/domain/types";
import { isValidHex } from "@/lib/domain/palettes";

const paths = Array.from({ length: 40 }, (_, i) => `uid/garments/foto-${i}.jpg`);

describe("visión simulada", () => {
  it("hashString es estable", () => {
    expect(hashString("a/b/c.jpg")).toBe(hashString("a/b/c.jpg"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("describeGarment es determinista y válido", () => {
    for (const p of paths) {
      const a = mockDescribeGarment(p);
      expect(mockDescribeGarment(p)).toEqual(a);
      expect(a.is_garment).toBe(true);
      expect(GARMENT_CATEGORIES).toContain(a.category);
      expect(a.formality).toBeGreaterThanOrEqual(1);
      expect(a.formality).toBeLessThanOrEqual(5);
      expect(a.colors.length).toBeGreaterThan(0);
      for (const c of a.colors) expect(isValidHex(c.hex)).toBe(true);
    }
  });

  it("recorre varias categorías (el clóset de prueba se puede completar)", () => {
    const cats = new Set(paths.map((p) => mockDescribeGarment(p).category));
    expect(cats.size).toBeGreaterThanOrEqual(4);
    expect(cats.has("top")).toBe(true);
    expect(cats.has("bottom")).toBe(true);
  });

  it("analyzeColor es determinista, con paleta completa", () => {
    for (const p of paths) {
      const a = mockAnalyzeColor(p);
      expect(mockAnalyzeColor(p)).toEqual(a);
      expect(a.is_face_visible).toBe(true);
      expect(COLOR_SEASONS).toContain(a.season);
      expect(a.recommended.length).toBeGreaterThanOrEqual(6);
      expect(a.neutrals).toHaveLength(4);
      expect(a.avoid).toHaveLength(4);
    }
  });
});

describe("normalización de lo que devuelve el modelo", () => {
  it("acota formalidad, limpia colores y rellena patrón", () => {
    const n = normalizeGarmentVision({
      is_garment: true,
      name: "  Camisa   blanca ",
      category: "top",
      subcategory: "camisa",
      colors: [{ name: "blanco", hex: "#fff" }, { name: "negro", hex: "#000000" }],
      pattern: "",
      material: "algodón",
      seasons: ["verano", "verano"],
      occasions: ["oficina", ""],
      formality: 9.4,
      confidence: "alta",
    });
    expect(n.name).toBe("Camisa blanca");
    expect(n.formality).toBe(5);
    expect(n.colors).toEqual([{ name: "negro", hex: "#000000" }]);
    expect(n.pattern).toBe("liso");
    expect(n.seasons).toEqual(["verano"]);
    expect(n.occasions).toEqual(["oficina"]);
  });

  it("con mala iluminación la confianza no es alta y la paleta se completa", () => {
    const n = normalizeColorVision({
      ...mockAnalyzeColor("x"),
      lighting_ok: false,
      confidence: "alta",
      recommended: [],
    });
    expect(n.confidence).toBe("media");
    expect(n.recommended.length).toBeGreaterThanOrEqual(6);
  });
});
