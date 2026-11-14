import { afterEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { MAX_STORES_PER_SEARCH, STORE_DIRECTORY, STORE_DIRECTORY_PROMPT, directoryStores, selectStores, storeProfile } from "@/lib/shopping/store-directory";
import { parseStores } from "@/lib/shopping/stores";
import { GARMENT_CATEGORIES } from "@/lib/domain/types";

const all = directoryStores();
const names = (xs: { name: string }[]) => xs.map((x) => x.name);

describe("directorio de tiendas", () => {
  it("no repite dominios, usa categorías válidas y cada tienda vende algo", () => {
    const bare = STORE_DIRECTORY.map((p) => p.domain.replace(/^www\./, ""));
    expect(new Set(bare).size).toBe(bare.length);
    for (const p of STORE_DIRECTORY) {
      expect(p.sells.length).toBeGreaterThan(0);
      for (const c of p.sells) expect(GARMENT_CATEGORIES).toContain(c);
    }
  });

  it("encuentra la ficha con o sin www", () => {
    expect(storeProfile("wildlama.com")?.name).toBe("Wild Lama");
    expect(storeProfile("WWW.TRIAL.CL")?.audience).toBe("hombre");
    expect(storeProfile("otra-tienda.cl")).toBeNull();
  });

  it("SHOP_STORES=directorio carga todas las tiendas del directorio", () => {
    expect(parseStores(" Directorio ")).toHaveLength(STORE_DIRECTORY.length);
    expect(parseStores("directorio").every((s) => !s.affiliate)).toBe(true);
  });
});

describe("selección de tiendas por búsqueda", () => {
  it("un vestido para mujer no va a tiendas de hombre ni a zapaterías", () => {
    const chosen = names(selectStores(all, { category: "dress", audience: "mujer" }));
    expect(chosen).toContain("Kills You");
    expect(chosen).not.toContain("Trial");
    expect(chosen).not.toContain("Bestias");
  });

  it("un pantalón para hombre no va a tiendas de mujer", () => {
    const chosen = names(selectStores(all, { category: "bottom", audience: "hombre" }));
    expect(chosen.slice(0, 3)).toEqual(["Wild Lama", "Froens", "Trial"]);
    expect(chosen).not.toContain("Kills You");
  });

  it("calzado va a las tiendas que venden calzado", () => {
    const chosen = names(selectStores(all, { category: "shoes" }));
    expect(chosen).toEqual(expect.arrayContaining(["Guante", "Hush Puppies", "Bestias"]));
    expect(chosen).not.toContain("Froens");
  });

  it("respeta el tope por búsqueda y sin público conocido no descarta por género", () => {
    expect(selectStores(all, { category: "top" }).length).toBe(MAX_STORES_PER_SEARCH);
    expect(names(selectStores(all, { category: "top" }, 60))).toEqual(expect.arrayContaining(["Trial", "Kills You"]));
  });

  it("una tienda fuera del directorio no se descarta, pero va después de las conocidas", () => {
    const extra = { domain: "tienda-nueva.cl", name: "Nueva", affiliate: true };
    const chosen = selectStores([extra, ...all], { category: "shoes" }, 60);
    expect(chosen.at(-1)).toEqual(extra);
  });
});

describe("el directorio en el contexto del asesor", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("el prompt de sistema trae cada tienda con su público y especialidad, sin dominios ni enlaces", () => {
    expect(SYSTEM_PROMPT).toContain(STORE_DIRECTORY_PROMPT);
    expect(SYSTEM_PROMPT).toContain("- Trial (hombre): formal masculino");
    expect(STORE_DIRECTORY_PROMPT).not.toMatch(/https?:|\.cl\b|\.com\b/);
  });
});
