import { fillPaletteFromSeason, sanitizeColors } from "@/lib/domain/palettes";
import type { ColorAnalysis } from "@/lib/domain/types";
import type { ColorVision, GarmentVision } from "./schemas";

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);
const cleanList = (xs: string[], max: number) => xs.map((x) => clean(x, 40)).filter(Boolean).slice(0, max);

/** Normaliza lo que devuelve el modelo antes de persistirlo (rangos, largos, hex). */
export function normalizeGarmentVision(v: GarmentVision) {
  return {
    name: clean(v.name, 80),
    category: v.category,
    subcategory: clean(v.subcategory, 40),
    colors: sanitizeColors(v.colors, 4),
    pattern: clean(v.pattern, 30) || "liso",
    material: clean(v.material, 40),
    seasons: [...new Set(v.seasons)],
    occasions: cleanList(v.occasions, 5),
    formality: Math.min(5, Math.max(1, Math.round(Number.isFinite(v.formality) ? v.formality : 2))),
  };
}

type PaletteFields = Pick<
  ColorAnalysis,
  "season" | "undertone" | "contrast" | "confidence" | "lighting_ok" | "recommended" | "neutrals" | "avoid" | "rationale"
>;

/**
 * Normaliza el análisis de color. Con iluminación mala la confianza nunca es "alta":
 * la colorimetría es orientación, no diagnóstico.
 */
export function normalizeColorVision(v: ColorVision): PaletteFields {
  const palette = fillPaletteFromSeason(v.season, v);
  const confidence = !v.lighting_ok && v.confidence === "alta" ? "media" : v.confidence;
  return {
    season: v.season,
    undertone: v.undertone,
    contrast: v.contrast,
    confidence,
    lighting_ok: v.lighting_ok,
    ...palette,
    rationale: clean(v.rationale, 500),
  };
}
