import { describe, expect, it } from "vitest";
import { fillPaletteFromSeason, isValidHex, SEASON_PALETTES, sanitizeColors } from "@/lib/domain/palettes";
import { COLOR_SEASONS } from "@/lib/domain/types";

describe("paletas por estación", () => {
  it.each(COLOR_SEASONS)("%s tiene 6-8 recomendados, 4 neutros y 4 a evitar con hex válidos", (season) => {
    const p = SEASON_PALETTES[season];
    expect(p.recommended.length).toBeGreaterThanOrEqual(6);
    expect(p.recommended.length).toBeLessThanOrEqual(8);
    expect(p.neutrals).toHaveLength(4);
    expect(p.avoid).toHaveLength(4);
    for (const c of [...p.recommended, ...p.neutrals, ...p.avoid]) {
      expect(isValidHex(c.hex), `${season}:${c.name}`).toBe(true);
      expect(c.name.length).toBeGreaterThan(2);
    }
  });

  it("no repite nombres dentro de una misma lista", () => {
    for (const p of Object.values(SEASON_PALETTES)) {
      for (const list of [p.recommended, p.neutrals, p.avoid]) {
        expect(new Set(list.map((c) => c.name)).size).toBe(list.length);
      }
    }
  });

  it("sanitizeColors descarta hex inválidos y respeta el máximo", () => {
    const out = sanitizeColors(
      [
        { name: "rojo", hex: "#ff0000" },
        { name: "roto", hex: "rojo" },
        { name: "", hex: "#00ff00" },
        { name: "azul", hex: "#0000FF" },
        { name: "extra", hex: "#123456" },
      ],
      2,
    );
    expect(out).toEqual([
      { name: "rojo", hex: "#FF0000" },
      { name: "azul", hex: "#0000FF" },
    ]);
  });

  it("fillPaletteFromSeason completa con la estación cuando el modelo trae poco", () => {
    const r = fillPaletteFromSeason("otono", { recommended: [{ name: "x", hex: "#000000" }] });
    expect(r.recommended).toEqual(SEASON_PALETTES.otono.recommended);
    expect(r.neutrals).toEqual(SEASON_PALETTES.otono.neutrals);
  });
});
