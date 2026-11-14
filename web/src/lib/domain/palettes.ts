import type { ColorSeason, Confidence, Contrast, NamedColor, Undertone } from "./types";

export type SeasonPalette = {
  season: ColorSeason;
  undertone: Undertone;
  contrast: Contrast;
  recommended: NamedColor[];
  neutrals: NamedColor[];
  avoid: NamedColor[];
  rationale: string;
};

// Orientación de color, no diagnóstico: son familias de referencia por estación.
export const SEASON_PALETTES: Record<ColorSeason, SeasonPalette> = {
  primavera: {
    season: "primavera",
    undertone: "calido",
    contrast: "medio",
    recommended: [
      { name: "coral", hex: "#F26B5B" },
      { name: "durazno", hex: "#F8B08A" },
      { name: "amarillo mantequilla", hex: "#F5D76E" },
      { name: "verde manzana", hex: "#8FCB5A" },
      { name: "turquesa", hex: "#3CB9B0" },
      { name: "azul aciano", hex: "#6C9BE0" },
      { name: "rosa salmón", hex: "#F28E9B" },
      { name: "naranja suave", hex: "#F59A3B" },
    ],
    neutrals: [
      { name: "crema", hex: "#F3E9D2" },
      { name: "camel claro", hex: "#C9A26B" },
      { name: "marfil", hex: "#FBF5E6" },
      { name: "marrón miel", hex: "#8B5E3C" },
    ],
    avoid: [
      { name: "negro", hex: "#000000" },
      { name: "gris carbón", hex: "#3A3A3A" },
      { name: "burdeos oscuro", hex: "#5A1A2B" },
      { name: "azul petróleo apagado", hex: "#3F5560" },
    ],
    rationale:
      "Los tonos cálidos y luminosos acompañan una piel de subtono cálido y dan frescura al rostro. Los colores muy oscuros o fríos pueden endurecer el conjunto.",
  },
  verano: {
    season: "verano",
    undertone: "frio",
    contrast: "bajo",
    recommended: [
      { name: "lavanda", hex: "#B7A4D6" },
      { name: "rosa empolvado", hex: "#D9A5B3" },
      { name: "azul cielo", hex: "#8FB5E0" },
      { name: "malva", hex: "#A87CA0" },
      { name: "verde salvia", hex: "#9DB8A0" },
      { name: "celeste hielo", hex: "#BFD9EA" },
      { name: "frambuesa suave", hex: "#C2557A" },
      { name: "gris azulado", hex: "#7E93AB" },
    ],
    neutrals: [
      { name: "gris perla", hex: "#D5D8DE" },
      { name: "topo frío", hex: "#A39A9C" },
      { name: "blanco suave", hex: "#F4F4F6" },
      { name: "azul marino suave", hex: "#3E4A6B" },
    ],
    avoid: [
      { name: "naranja intenso", hex: "#E8731A" },
      { name: "mostaza", hex: "#D4A017" },
      { name: "marrón tierra", hex: "#7A4A21" },
      { name: "dorado", hex: "#C9A227" },
    ],
    rationale:
      "Los tonos suaves, fríos y algo apagados armonizan con un subtono frío y un contraste bajo. Los colores muy cálidos o saturados tienden a competir con el rostro.",
  },
  otono: {
    season: "otono",
    undertone: "calido",
    contrast: "bajo",
    recommended: [
      { name: "terracota", hex: "#B5654A" },
      { name: "mostaza", hex: "#D4A017" },
      { name: "verde oliva", hex: "#6B7A3A" },
      { name: "óxido", hex: "#A84B2A" },
      { name: "calabaza", hex: "#D9822B" },
      { name: "verde bosque", hex: "#2F5D3A" },
      { name: "bordó cálido", hex: "#7A2E2E" },
      { name: "turquesa profundo", hex: "#2A7F7A" },
    ],
    neutrals: [
      { name: "camel", hex: "#B98B57" },
      { name: "chocolate", hex: "#4A3426" },
      { name: "crema", hex: "#EFE3C8" },
      { name: "beige arena", hex: "#D6C3A0" },
    ],
    avoid: [
      { name: "fucsia", hex: "#E0218A" },
      { name: "azul hielo", hex: "#BFE0F0" },
      { name: "gris plata", hex: "#B8BCC4" },
      { name: "negro puro", hex: "#000000" },
    ],
    rationale:
      "Los tonos tierra, cálidos y profundos realzan un subtono cálido. Los fríos brillantes o muy pálidos suelen restar calidez al conjunto.",
  },
  invierno: {
    season: "invierno",
    undertone: "frio",
    contrast: "alto",
    recommended: [
      { name: "azul real", hex: "#2C4FB8" },
      { name: "fucsia", hex: "#D6247F" },
      { name: "verde esmeralda", hex: "#0E8F6A" },
      { name: "rojo cereza", hex: "#C4122F" },
      { name: "violeta intenso", hex: "#5B2C91" },
      { name: "blanco puro", hex: "#FFFFFF" },
      { name: "celeste hielo", hex: "#9FD3F0" },
      { name: "turquesa frío", hex: "#14A3B8" },
    ],
    neutrals: [
      { name: "negro", hex: "#111111" },
      { name: "gris carbón", hex: "#3B3F46" },
      { name: "blanco óptico", hex: "#FAFAFA" },
      { name: "azul marino", hex: "#14213D" },
    ],
    avoid: [
      { name: "naranja", hex: "#E07B2A" },
      { name: "beige", hex: "#D9C6A5" },
      { name: "mostaza", hex: "#C9A227" },
      { name: "marrón dorado", hex: "#8C6A3A" },
    ],
    rationale:
      "Los colores nítidos, fríos y de alto contraste sostienen un subtono frío con contraste marcado. Los tonos tierra apagados tienden a opacar el rostro.",
  },
};

export function paletteForSeason(season: ColorSeason): SeasonPalette {
  return SEASON_PALETTES[season];
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(hex: unknown): hex is string {
  return typeof hex === "string" && HEX.test(hex);
}

/** Descarta colores sin nombre o con hex inválido y limita la cantidad. */
export function sanitizeColors(colors: unknown, max: number): NamedColor[] {
  if (!Array.isArray(colors)) return [];
  const out: NamedColor[] = [];
  for (const c of colors) {
    if (out.length >= max) break;
    if (c && typeof c === "object" && "name" in c && "hex" in c) {
      const { name, hex } = c as { name: unknown; hex: unknown };
      if (typeof name === "string" && name.trim() && isValidHex(hex)) {
        out.push({ name: name.trim().slice(0, 40), hex: hex.toUpperCase() });
      }
    }
  }
  return out;
}

/** Si el modelo devuelve colores incompletos, se completan con la paleta de la estación. */
export function fillPaletteFromSeason(
  season: ColorSeason,
  partial: { recommended?: unknown; neutrals?: unknown; avoid?: unknown },
): Pick<SeasonPalette, "recommended" | "neutrals" | "avoid"> {
  const base = SEASON_PALETTES[season];
  const pick = (value: unknown, fallback: NamedColor[], min: number, max: number) => {
    const clean = sanitizeColors(value, max);
    return clean.length >= min ? clean : fallback;
  };
  return {
    recommended: pick(partial.recommended, base.recommended, 4, 8),
    neutrals: pick(partial.neutrals, base.neutrals, 2, 4),
    avoid: pick(partial.avoid, base.avoid, 2, 4),
  };
}

export const CONFIDENCE_ORDER: Confidence[] = ["baja", "media", "alta"];
