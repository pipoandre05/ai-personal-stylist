import type { ColorAnalysis, NamedColor, OutfitEvidence, Weather } from "./types";

// "En qué me basé" (C-2). La produce el servidor al proponer el look, con datos reales: nunca el modelo.

type PaletteLike = Pick<ColorAnalysis, "recommended" | "neutrals" | "confidence"> | null;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Muestras (hex) de la paleta que de verdad aparecen en el look: colores de las prendas que coinciden por nombre con
 * un recomendado o neutro de la paleta. Si ninguno coincide, no hay evidencia de paleta (no se inventa).
 */
export function paletteSwatches(palette: PaletteLike, garmentColors: NamedColor[][]): string[] {
  if (!palette) return [];
  const known = new Map<string, string>();
  for (const c of [...palette.recommended, ...palette.neutrals]) known.set(norm(c.name), c.hex);
  const out: string[] = [];
  for (const colors of garmentColors) {
    for (const c of colors) {
      const hex = known.get(norm(c.name));
      if (hex && !out.includes(hex)) out.push(hex);
    }
  }
  return out.slice(0, 4);
}

export function buildEvidence(input: {
  palette: PaletteLike;
  garmentColors: NamedColor[][];
  weather: Pick<Weather, "temp_min" | "temp_max" | "precipitation_probability"> | null;
  garmentCount: number;
  occasion: string;
}): OutfitEvidence[] {
  const out: OutfitEvidence[] = [];
  const swatches = paletteSwatches(input.palette, input.garmentColors);
  if (swatches.length > 0) {
    out.push({ kind: "palette", label: input.palette?.confidence === "baja" ? "Tu paleta, orientativa" : "Tu paleta", swatches });
  }
  if (input.weather) {
    const rain = input.weather.precipitation_probability !== null && input.weather.precipitation_probability >= 40;
    out.push({ kind: "weather", label: `${input.weather.temp_max}°${rain ? " y lluvia" : ""}` });
  }
  if (input.garmentCount > 0) out.push({ kind: "closet", label: `${input.garmentCount} de tu clóset` });
  const occasion = input.occasion.trim();
  if (occasion) out.push({ kind: "occasion", label: occasion.slice(0, 40) });
  return out;
}
