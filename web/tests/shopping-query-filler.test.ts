import { describe, expect, it } from "vitest";
import { buildQuery } from "@/lib/shopping/query";

describe("relleno de una petición hablada", () => {
  it("'unos zapatos nuevos' busca zapatos y no exige 'nuevos' en la ficha", () => {
    const q = buildQuery({ description: "unos zapatos nuevos", category: "shoes" });
    expect(q?.head).toBe("zapatos");
    expect(q?.keywords).toEqual([]);
    expect(q?.text).toBe("zapatos");
  });

  it("conserva las palabras que sí describen la prenda", () => {
    const q = buildQuery({ description: "quiero un blazer nuevo de lino", category: "outerwear" });
    expect(q?.head).toBe("blazer");
    expect(q?.keywords).toEqual(["lino"]);
  });
});
