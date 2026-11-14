import { describe, expect, it } from "vitest";
import { checkOutfitFormality, closetFit, reachesFormality, type FitGarment } from "@/lib/domain/closet-fit";

const g = (id: string, category: FitGarment["category"], formality: number): FitGarment => ({ id, name: id, category, formality });

// El clóset de ejemplo de la demo (web/supabase/seed/closet-demo.sql).
const demo: FitGarment[] = [
  g("camisa-blanca", "top", 4), g("polera-gris", "top", 2), g("sweater", "top", 3), g("camisa-lino", "top", 3), g("polo", "top", 3),
  g("jeans", "bottom", 2), g("chino", "bottom", 3), g("pantalon-vestir", "bottom", 4),
  g("blazer", "outerwear", 4), g("mezclilla", "outerwear", 2), g("parka", "outerwear", 2),
  g("zapatillas", "shoes", 2), g("mocasines", "shoes", 4), g("cinturon", "accessory", 3),
];

describe("N4 · ¿el clóset alcanza para la formalidad del marco? (D-03)", () => {
  it("el margen es de un nivel", () => {
    expect(reachesFormality(3, 4)).toBe(true);
    expect(reachesFormality(5, 4)).toBe(true);
    expect(reachesFormality(2, 4)).toBe(false);
  });

  it("matrimonio formal (4) con el clóset de ejemplo: alcanza, y los jeans y las zapatillas no entran", () => {
    const fit = closetFit(demo, 4);
    expect(fit.result).toBe("alcanza");
    expect(fit.reaching.bottom).toEqual(["chino", "pantalon-vestir"]);
    expect(fit.reaching.shoes).toEqual(["mocasines"]);
    expect(fit.reaching.top).not.toContain("polera-gris");
  });

  it("gala (5) no admite margen: con un clóset que llega a formal (4) no hay base, y dice qué falta", () => {
    expect(reachesFormality(4, 5)).toBe(false);
    expect(reachesFormality(5, 5)).toBe(true);
    const fit = closetFit(demo, 5);
    expect(fit.result).toBe("no_hay_base");
    expect(fit.gaps).toEqual([
      { category: "top", reason: "falta_mas_formal" },
      { category: "bottom", reason: "falta_mas_formal" },
      { category: "shoes", reason: "falta_mas_formal" },
    ]);
  });

  it("gala (5) con prendas de gala alcanza; y si solo falta el calzado, es una pieza", () => {
    const gala = [g("camisa-esmoquin", "top", 5), g("pantalon-esmoquin", "bottom", 5), g("zapato-charol", "shoes", 5)];
    expect(closetFit(gala, 5).result).toBe("alcanza");
    const sinZapato = [gala[0], gala[1], g("mocasines", "shoes", 4)];
    expect(closetFit(sinZapato, 5)).toMatchObject({ result: "falta_una_pieza", gaps: [{ category: "shoes", reason: "falta_mas_formal" }] });
  });

  it("falta una pieza: el calzado no llega (típico)", () => {
    const fit = closetFit(demo.filter((x) => x.id !== "mocasines"), 4);
    expect(fit.result).toBe("falta_una_pieza");
    expect(fit.gaps).toEqual([{ category: "shoes", reason: "falta_mas_formal" }]);
  });

  it("no hay base: más de una pieza bajo la formalidad", () => {
    const casual = demo.filter((x) => x.formality <= 2);
    const fit = closetFit(casual, 4);
    expect(fit.result).toBe("no_hay_base");
    expect(fit.gaps.map((x) => x.category).sort()).toEqual(["bottom", "shoes", "top"]);
  });

  it("no hay base: falta una categoría base (sin parte de abajo ni vestido)", () => {
    const fit = closetFit([g("a", "top", 3), g("z", "shoes", 3)], 3);
    expect(fit.result).toBe("no_hay_base");
    expect(fit.gaps).toContainEqual({ category: "bottom", reason: "no_hay" });
  });

  it("sin calzado cargado no es una pieza que falta: se pide la foto", () => {
    const fit = closetFit(demo.filter((x) => x.category !== "shoes"), 4);
    expect(fit.result).toBe("alcanza");
    expect(fit.no_shoes_loaded).toBe(true);
  });

  it("un vestido que llega alcanza aunque los separados no", () => {
    const fit = closetFit([g("v", "dress", 4), g("t", "top", 1), g("b", "bottom", 1), g("z", "shoes", 4)], 4);
    expect(fit.result).toBe("alcanza");
  });

  it("día relajado (2): un clóset solo formal también puede no llegar, hacia el otro lado", () => {
    const fit = closetFit([g("t", "top", 4), g("b", "bottom", 5), g("z", "shoes", 3)], 2);
    expect(fit.gaps).toEqual([
      { category: "top", reason: "falta_mas_relajada" },
      { category: "bottom", reason: "falta_mas_relajada" },
    ]);
    expect(fit.result).toBe("no_hay_base");
  });
});

describe("el look propuesto se revisa contra la regla", () => {
  const pick = (...ids: string[]) => ids.map((id) => demo.find((x) => x.id === id) as FitGarment);

  it("un look que llega pasa; los accesorios y abrigos no se juzgan", () => {
    const fit = closetFit(demo, 4);
    expect(checkOutfitFormality(pick("camisa-blanca", "pantalon-vestir", "mocasines", "mezclilla"), demo, fit, null)).toBeNull();
  });

  it("jeans para un matrimonio formal: se rechaza y dice cuáles sí llegan", () => {
    const fit = closetFit(demo, 4);
    const reason = checkOutfitFormality(pick("camisa-blanca", "jeans", "mocasines"), demo, fit, null);
    expect(reason).toContain("jeans");
    expect(reason).toContain("pantalon-vestir");
  });

  it("si nada de la categoría llega, se puede usar lo más cercano declarando la pieza que falta", () => {
    const closet = demo.filter((x) => x.id !== "mocasines");
    const fit = closetFit(closet, 4);
    const look = [closet.find((x) => x.id === "camisa-blanca")!, closet.find((x) => x.id === "pantalon-vestir")!, closet.find((x) => x.id === "zapatillas")!];
    expect(checkOutfitFormality(look, closet, fit, null)).toContain("missing_piece");
    expect(checkOutfitFormality(look, closet, fit, "shoes")).toBeNull();
  });
});
