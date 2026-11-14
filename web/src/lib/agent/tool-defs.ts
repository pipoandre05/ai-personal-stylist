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
      "Pronóstico de un día y un lugar: mínima, máxima, lluvia, viento y resumen. Hasta 7 días hacia adelante. Sin place usa el lugar del evento y, si no hay, la ciudad de la persona. Si no hay datos, sigue sin clima.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Fecha YYYY-MM-DD. Por defecto, la del evento y, si no hay, hoy." },
        place: { type: "string", description: "Ciudad o lugar del evento, por ejemplo: Casablanca." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "offer_search",
    description:
      "Ofrece buscar opciones de compra para la pieza que le falta a un look que YA mostraste. La persona ve dos botones (aceptar o no) y su respuesta te llega en el siguiente turno como una intención: no busques hasta entonces. Úsala una vez por look, solo si la pieza faltante vale la pena (no por una pieza suelta de un día normal). Si la persona ya te pidió buscar, usa search_products directo.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        outfit_id: { type: "string", description: "Id del look que propusiste y que tiene missing_piece." },
        slot: { type: "string", enum: categoryEnum, description: "Categoría de la pieza faltante." },
        description: { type: "string", description: "Qué buscarías, en una frase (por ejemplo: sandalia de taco ancho en tono tierra)." },
      },
      required: ["outfit_id", "slot", "description"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_outfit",
    description:
      "Propone un look con prendas del clóset. Requiere [1 o 2 arriba + 1 abajo] o [1 vestido, con 0 o 1 arriba y sin abajo], entre 2 y 7 prendas, máx. 1 abrigo, 1 calzado, 1 bolso y 2 accesorios. Para dar dos looks a elegir llámala dos veces en el mismo turno: primero variant seguro y luego variant atrevido (deben diferir en al menos dos prendas). Si devuelve error, corrige y reintenta. El look se muestra solo a la persona, con su evidencia y botones para ajustarlo: no los escribes tú.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nombre corto del look, por ejemplo: Oficina con calma." },
        occasion: { type: "string", description: "Ocasión para la que sirve." },
        garment_ids: { type: "array", items: { type: "string" }, description: "Id de prendas devueltos por get_closet." },
        rationale: { type: "string", description: "Por qué funciona, en 2 a 4 frases concretas." },
        variant: { type: "string", enum: ["seguro", "atrevido"], description: "Solo si das dos looks a elegir: el más cercano a su estilo actual (seguro) o el que se acerca al estilo al que aspira (atrevido)." },
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
    name: "search_products",
    description:
      "Busca opciones de compra para completar un look. Solo si la persona lo aceptó (authorization accepted_offer, tras offer_search), lo pidió con sus palabras (person_request: cita en quote lo que dijo, tal cual) o tocó un botón de ajustar la búsqueda (refinement). El servidor ordena, valida y limita a 3 opciones, y las muestra con foto, tienda, precio y botón: tú no escribes productos, precios ni enlaces. Si devuelve que la búsqueda no está disponible, describe la pieza a buscar y no inventes productos. Nunca compras: la persona abre la tienda.",
    // Sin strict: muchos parámetros opcionales podrían exceder el límite de complejidad de los esquemas estrictos (no verificable sin clave). zod valida igual.
    input_schema: {
      type: "object",
      properties: {
        for_outfit_id: { type: "string", description: "Id del look al que completa, si hay uno." },
        slot: { type: "string", enum: categoryEnum, description: "Categoría de la pieza que se busca." },
        description: { type: "string", description: "Qué buscar: tipo de prenda, estilo, largo o taco (por ejemplo: sandalia de taco ancho en tono tierra)." },
        color: { type: "string", description: "Color buscado, si importa." },
        max_price_clp: { type: "integer", description: "Tope de precio en pesos chilenos, solo si la persona lo dijo." },
        size: { type: "string", description: "Talla, solo si la persona la dijo." },
        audience: { type: "string", enum: ["mujer", "hombre"], description: "Para quién es la pieza según la ropa que usa la persona (su perfil). Omítelo si usa unisex o no lo sabes." },
        authorization: { type: "string", enum: ["accepted_offer", "person_request", "refinement"] },
        quote: { type: "string", description: "Con person_request: las palabras de la persona que piden buscar, copiadas tal cual." },
      },
      required: ["slot", "description", "authorization"],
      additionalProperties: false,
    },
  },
  {
    name: "set_event_summary",
    description:
      "Fija o actualiza lo que entendiste del evento o plan (tipo, fecha, lugar, de día o de noche, entorno, código de vestir). Envía solo lo que cambió: se suma a lo anterior. Calcula el clima del lugar y la fecha, muestra a la persona un resumen que ella puede corregir y devuelve qué falta. Llámala apenas la persona cuente un evento, antes de preguntar o de armar el look.",
    // Sin strict: muchos parámetros opcionales podrían exceder el límite de complejidad de los esquemas estrictos (no verificable sin clave). zod valida igual.
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", description: "Tipo de evento: Matrimonio, Cumpleaños, Cena, Reunión..." },
        date: { type: "string", description: "Fecha YYYY-MM-DD (usa la fecha de hoy del contexto para resolver 'este sábado')." },
        place: { type: "string", description: "Ciudad o lugar para el clima, por ejemplo: Casablanca." },
        place_note: { type: "string", description: "Detalle del lugar, por ejemplo: En una viña." },
        time_of_day: { type: "string", enum: ["day", "night"] },
        venue: { type: "string", enum: ["indoor", "outdoor"] },
        dress_code: { type: "string", description: "Código de vestir de la invitación; 'no especificado' si no dice nada." },
        new_event: { type: "boolean", description: "true si la persona habla de un evento distinto del que ya tenías: parte de cero en vez de sumar a lo anterior." },
      },
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
export const GetWeatherInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  place: z.string().trim().min(2).max(80).optional(),
});
export const ProposeOutfitInput = z.object({
  title: z.string().trim().min(2).max(80),
  occasion: z.string().trim().max(80).default(""),
  garment_ids: z.array(z.string().uuid()).min(1).max(12),
  rationale: z.string().trim().min(20).max(900),
  variant: z.enum(["seguro", "atrevido"]).optional(),
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

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const SetEventSummaryInput = z.object({
  kind: z.string().trim().min(2).max(60).optional(),
  date: isoDate.optional(),
  place: z.string().trim().min(2).max(80).optional(),
  place_note: z.string().trim().min(2).max(80).optional(),
  time_of_day: z.enum(["day", "night"]).optional(),
  venue: z.enum(["indoor", "outdoor"]).optional(),
  dress_code: z.string().trim().min(2).max(80).optional(),
  new_event: z.boolean().optional(),
});

export const OfferSearchInput = z.object({
  outfit_id: z.string().uuid(),
  slot: z.enum(GARMENT_CATEGORIES),
  description: z.string().trim().min(3).max(200),
});

export const SearchProductsInput = z.object({
  for_outfit_id: z.string().uuid().optional(),
  slot: z.enum(GARMENT_CATEGORIES),
  description: z.string().trim().min(3).max(200),
  color: z.string().trim().min(2).max(40).optional(),
  max_price_clp: z.number().int().min(1).max(100_000_000).optional(),
  size: z.string().trim().min(1).max(20).optional(),
  audience: z.enum(["mujer", "hombre"]).optional(),
  authorization: z.enum(["accepted_offer", "person_request", "refinement"]),
  quote: z.string().trim().max(200).optional(),
});
