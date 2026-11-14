import type { ColorSeason, GarmentCategory, NamedColor } from "@/lib/domain/types";
import { COLOR_SEASONS } from "@/lib/domain/types";
import { SEASON_PALETTES } from "@/lib/domain/palettes";
import type { ColorVision, GarmentVision } from "./schemas";

/** Hash FNV-1a de 32 bits: determinista y sin dependencias. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

type MockGarment = {
  name: string;
  category: GarmentCategory;
  subcategory: string;
  colors: NamedColor[];
  pattern: string;
  material: string;
  seasons: GarmentVision["seasons"];
  occasions: string[];
  formality: number;
};

const CATALOG: MockGarment[] = [
  { name: "Camisa blanca de algodón", category: "top", subcategory: "camisa", colors: [{ name: "blanco", hex: "#F5F5F0" }], pattern: "liso", material: "algodón", seasons: ["verano", "entretiempo"], occasions: ["oficina", "día a día"], formality: 3 },
  { name: "Polera negra básica", category: "top", subcategory: "polera", colors: [{ name: "negro", hex: "#1A1A1A" }], pattern: "liso", material: "algodón", seasons: ["verano", "entretiempo"], occasions: ["día a día", "salidas con amigos"], formality: 2 },
  { name: "Sweater de lana azul marino", category: "top", subcategory: "sweater", colors: [{ name: "azul marino", hex: "#1F2A44" }], pattern: "liso", material: "lana", seasons: ["invierno", "entretiempo"], occasions: ["oficina", "día a día"], formality: 3 },
  { name: "Jeans rectos azules", category: "bottom", subcategory: "jeans", colors: [{ name: "azul denim", hex: "#3B5B8C" }], pattern: "liso", material: "denim", seasons: ["entretiempo", "invierno"], occasions: ["día a día", "salidas con amigos"], formality: 2 },
  { name: "Pantalón de vestir gris", category: "bottom", subcategory: "pantalón", colors: [{ name: "gris", hex: "#6B6F76" }], pattern: "liso", material: "poliéster", seasons: ["entretiempo", "invierno"], occasions: ["oficina", "eventos y matrimonios"], formality: 4 },
  { name: "Falda midi beige", category: "bottom", subcategory: "falda", colors: [{ name: "beige", hex: "#D6C3A0" }], pattern: "liso", material: "viscosa", seasons: ["verano", "entretiempo"], occasions: ["oficina", "citas"], formality: 3 },
  { name: "Vestido negro midi", category: "dress", subcategory: "vestido", colors: [{ name: "negro", hex: "#111111" }], pattern: "liso", material: "crepé", seasons: ["entretiempo", "verano"], occasions: ["citas", "eventos y matrimonios"], formality: 4 },
  { name: "Chaqueta de cuero negra", category: "outerwear", subcategory: "chaqueta", colors: [{ name: "negro", hex: "#161616" }], pattern: "liso", material: "cuero", seasons: ["entretiempo", "invierno"], occasions: ["salidas con amigos", "día a día"], formality: 3 },
  { name: "Zapatillas blancas", category: "shoes", subcategory: "zapatillas", colors: [{ name: "blanco", hex: "#F2F2F2" }], pattern: "liso", material: "cuero sintético", seasons: ["verano", "entretiempo", "invierno"], occasions: ["día a día", "viajes"], formality: 2 },
  { name: "Botines café", category: "shoes", subcategory: "botines", colors: [{ name: "café", hex: "#6B4226" }], pattern: "liso", material: "cuero", seasons: ["entretiempo", "invierno"], occasions: ["oficina", "citas"], formality: 3 },
  { name: "Cartera camel", category: "bag", subcategory: "cartera", colors: [{ name: "camel", hex: "#B98B57" }], pattern: "liso", material: "cuero", seasons: ["verano", "entretiempo", "invierno"], occasions: ["oficina", "citas"], formality: 3 },
  { name: "Pañuelo estampado", category: "accessory", subcategory: "pañuelo", colors: [{ name: "rojo", hex: "#B3262E" }, { name: "crema", hex: "#EFE3C8" }], pattern: "estampado", material: "seda", seasons: ["entretiempo"], occasions: ["oficina", "citas"], formality: 3 },
];

const CATEGORY_MARKERS: GarmentCategory[] = ["top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"];

/**
 * Reconocimiento de prenda simulado: mismo `photo_path`, mismo resultado.
 * Marcadores en el nombre del archivo para pruebas: `no-prenda` (is_garment=false) y `-<categoría>.` (fuerza la categoría).
 */
export function mockDescribeGarment(photoPath: string): GarmentVision {
  const hash = hashString(photoPath);
  const forced = CATEGORY_MARKERS.find((c) => photoPath.includes(`-${c}.`));
  const pool = forced ? CATALOG.filter((x) => x.category === forced) : CATALOG;
  const g = pool[hash % pool.length];
  return {
    is_garment: !photoPath.includes("no-prenda"),
    name: g.name,
    category: g.category,
    subcategory: g.subcategory,
    colors: g.colors,
    pattern: g.pattern,
    material: g.material,
    seasons: g.seasons,
    occasions: g.occasions,
    formality: g.formality,
    confidence: "media",
  };
}

/** Análisis de color simulado: la estación sale del hash de la ruta; `sin-rostro` simula una foto sin rostro. */
export function mockAnalyzeColor(photoPath: string): ColorVision {
  const season: ColorSeason = COLOR_SEASONS[hashString(photoPath) % COLOR_SEASONS.length];
  const p = SEASON_PALETTES[season];
  return {
    is_face_visible: !photoPath.includes("sin-rostro"),
    season,
    undertone: p.undertone,
    contrast: p.contrast,
    confidence: "media",
    lighting_ok: true,
    recommended: p.recommended,
    neutrals: p.neutrals,
    avoid: p.avoid,
    rationale: p.rationale,
  };
}
