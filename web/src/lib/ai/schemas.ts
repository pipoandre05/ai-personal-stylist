import { z } from "zod";
import { GARMENT_CATEGORIES } from "@/lib/domain/types";

// Los esquemas de salida estructurada admiten pocas restricciones: rangos y largos se normalizan en código.
const namedColor = z.object({ name: z.string(), hex: z.string() });

export const GarmentVisionSchema = z.object({
  is_garment: z.boolean(),
  name: z.string(),
  category: z.enum(GARMENT_CATEGORIES),
  subcategory: z.string(),
  colors: z.array(namedColor),
  pattern: z.string(),
  material: z.string(),
  seasons: z.array(z.enum(["verano", "entretiempo", "invierno"])),
  occasions: z.array(z.string()),
  formality: z.number(),
  confidence: z.enum(["baja", "media", "alta"]),
});
export type GarmentVision = z.infer<typeof GarmentVisionSchema>;

export const ColorVisionSchema = z.object({
  is_face_visible: z.boolean(),
  season: z.enum(["primavera", "verano", "otono", "invierno"]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  contrast: z.enum(["bajo", "medio", "alto"]),
  confidence: z.enum(["baja", "media", "alta"]),
  lighting_ok: z.boolean(),
  recommended: z.array(namedColor),
  neutrals: z.array(namedColor),
  avoid: z.array(namedColor),
  rationale: z.string(),
});
export type ColorVision = z.infer<typeof ColorVisionSchema>;

/** Resultado que el endpoint traduce a un mensaje amable cuando no es `ok`. */
export type VisionResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_recognized" | "unavailable" };
