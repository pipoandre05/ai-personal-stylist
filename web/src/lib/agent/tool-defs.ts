import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { GARMENT_CATEGORIES } from "@/lib/domain/types";

// --- Definiciones (orden fijo: el cache de prompt depende de ello) ---

const categoryEnum = [...GARMENT_CATEGORIES];

export const AGENT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "add_garment",
    description:
      "Agrega al clóset la prenda de una foto que la persona envió en esta conversación. Pasa el image_path que viene junto a la foto. Una prenda por foto. Si la foto no muestra una prenda, devuelve un error: dile qué probar.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { image_path: { type: "string", description: "Referencia interna de la foto, tal como se te entregó." } },
      required: ["image_path"],
      additionalProperties: false,
    },
  },
  {
    name: "analyze_palette",
    description:
      "Analiza una selfie y crea la paleta de colores orientativa de la persona. Pasa el image_path de la selfie. La foto se borra al terminar: solo se conserva el resultado. Si no se ve un rostro, devuelve un error.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { image_path: { type: "string", description: "Referencia interna de la selfie, tal como se te entregó." } },
      required: ["image_path"],
      additionalProperties: false,
    },
  },
  {
    name: "get_closet",
    description:
      "Lista las prendas activas del clóset de la persona con su id, nombre, categoría, colores, formalidad, temporadas y ocasiones. Úsala antes de proponer un look. Puedes filtrar por categoría u ocasión.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: categoryEnum, description: "Filtra por categoría." },
        occasion: { type: "string", description: "Filtra por ocasión (por ejemplo: oficina, citas)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_weather",
    description:
      "Pronóstico del día para la ciudad de la persona: mínima, máxima, lluvia y resumen. Hasta 7 días hacia adelante. Si no hay datos, sigue sin clima.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { date: { type: "string", description: "Fecha YYYY-MM-DD. Por defecto, hoy." } },
      additionalProperties: false,
    },
  },
  {
    name: "propose_outfit",
    description:
      "Propone un look con prendas del clóset. Requiere [1 o 2 arriba + 1 abajo] o [1 vestido, con 0 o 1 arriba y sin abajo], entre 2 y 7 prendas, máx. 1 abrigo, 1 calzado, 1 bolso y 2 accesorios. Si devuelve error, corrige y reintenta. El look se muestra solo a la persona.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nombre corto del look, por ejemplo: Oficina con calma." },
        occasion: { type: "string", description: "Ocasión para la que sirve." },
        garment_ids: { type: "array", items: { type: "string" }, description: "Id de prendas devueltos por get_closet." },
        rationale: { type: "string", description: "Por qué funciona, en 2 a 4 frases concretas." },
        missing_piece: {
          type: "object",
          description: "Prenda que completaría o mejoraría el look y que la persona no tiene.",
          properties: {
            category: { type: "string", enum: categoryEnum },
            description: { type: "string" },
            why: { type: "string" },
          },
          required: ["category", "description", "why"],
          additionalProperties: false,
        },
      },
      required: ["title", "occasion", "garment_ids", "rationale"],
      additionalProperties: false,
    },
  },
  {
    name: "remember",
    description:
      "Guarda un hecho estable sobre la persona (gusto, límite, contexto o calce) para futuras conversaciones. No guardes opiniones pasajeras.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        fact: { type: "string", description: "El hecho, en una frase corta en tercera persona." },
        kind: { type: "string", enum: ["preference", "dislike", "context", "fit"] },
      },
      required: ["fact", "kind"],
      additionalProperties: false,
    },
  },
  {
    name: "suggest_replies",
    description:
      "Muestra 2 a 6 respuestas cortas de un toque debajo de tu mensaje. Úsala al preguntar algo del perfil o al ofrecer opciones. La persona también puede escribir libre. No repitas las opciones en el texto.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        options: { type: "array", items: { type: "string" }, description: "Opciones cortas (máx. 40 caracteres)." },
        multiple: { type: "boolean", description: "true si puede elegir varias." },
      },
      required: ["options"],
      additionalProperties: false,
    },
  },
  {
    name: "update_profile",
    description:
      "Guarda lo que la persona te contó de sí misma. Solo envía los campos que cambian; los arreglos REEMPLAZAN el valor del campo, así que envía la lista completa. Guarda cada respuesta apenas la recibas.",
    // Sin strict: 14 parámetros opcionales podrían exceder el límite de complejidad de los esquemas estrictos (no verificable sin clave). zod valida igual.
    input_schema: {
      type: "object",
      properties: {
        display_name: { type: "string", description: "Cómo quiere que la llames." },
        city: { type: "string", description: "Ciudad donde vive." },
        clothing_sections: { type: "array", items: { type: "string" }, description: "Qué ropa usa: mujer, hombre, unisex." },
        current_style: { type: "array", items: { type: "string" }, description: "Cómo es su estilo hoy." },
        aspirational_style: { type: "array", items: { type: "string" }, description: "Cómo le gustaría verse." },
        occasions: { type: "array", items: { type: "string" }, description: "Ocasiones frecuentes." },
        fit_preferences: { type: "array", items: { type: "string" }, description: "Calce que prefiere." },
        comfort_constraints: { type: "array", items: { type: "string" }, description: "Restricciones de comodidad." },
        colors_disliked: { type: "array", items: { type: "string" } },
        brands_liked: { type: "array", items: { type: "string" } },
        brands_excluded: { type: "array", items: { type: "string" } },
        budget_per_item_clp: { type: "integer", description: "Presupuesto por prenda en pesos chilenos." },
        budget_monthly_clp: { type: "integer", description: "Presupuesto mensual en pesos chilenos." },
        risk_level: { type: "integer", description: "1 seguro, 2 medio, 3 atrevido." },
      },
      additionalProperties: false,
    },
  },
];

// --- Validación de entradas (el modelo es una entrada no confiable) ---

export const GetClosetInput = z.object({ category: z.enum(GARMENT_CATEGORIES).optional(), occasion: z.string().max(60).optional() });
export const GetWeatherInput = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });
export const ProposeOutfitInput = z.object({
  title: z.string().trim().min(2).max(80),
  occasion: z.string().trim().max(80).default(""),
  garment_ids: z.array(z.string().uuid()).min(1).max(12),
  rationale: z.string().trim().min(20).max(900),
  missing_piece: z
    .object({
      category: z.enum(GARMENT_CATEGORIES),
      description: z.string().trim().min(2).max(200),
      why: z.string().trim().min(2).max(300),
    })
    .optional(),
});
export const RememberInput = z.object({
  fact: z.string().trim().min(3).max(280),
  kind: z.enum(["preference", "dislike", "context", "fit"]),
});


const tagList = z.array(z.string().trim().min(1).max(60)).max(20);
export const UpdateProfileInput = z
  .object({
    display_name: z.string().trim().min(1).max(60),
    city: z.string().trim().min(2).max(80),
    clothing_sections: tagList,
    current_style: tagList,
    aspirational_style: tagList,
    occasions: tagList,
    fit_preferences: tagList,
    comfort_constraints: tagList,
    colors_disliked: tagList,
    brands_liked: tagList,
    brands_excluded: tagList,
    budget_per_item_clp: z.number().int().min(0).max(100_000_000),
    budget_monthly_clp: z.number().int().min(0).max(100_000_000),
    risk_level: z.number().int().min(1).max(3),
  })
  .partial();

export const ImagePathInput = z.object({ image_path: z.string().max(200) });

export const SuggestRepliesInput = z.object({
  options: z.array(z.string().trim().min(1).max(40)).min(2).max(6),
  multiple: z.boolean().optional(),
});
