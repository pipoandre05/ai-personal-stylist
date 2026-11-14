// Tipos y catálogos compartidos entre servidor y cliente.
// Reflejan web/supabase/migrations/20261114000000_esquema_inicial.sql (fuente de verdad).
// Base de datos en inglés; etiquetas visibles en español.

export const GARMENT_CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  top: "Parte de arriba",
  bottom: "Parte de abajo",
  dress: "Vestido o enterito",
  outerwear: "Abrigo o chaqueta",
  shoes: "Calzado",
  bag: "Bolso",
  accessory: "Accesorio",
};

export const CATEGORY_LABELS_SHORT: Record<GarmentCategory, string> = {
  top: "Arriba",
  bottom: "Abajo",
  dress: "Vestidos",
  outerwear: "Abrigos",
  shoes: "Calzado",
  bag: "Bolsos",
  accessory: "Accesorios",
};

export const SEASONS = ["verano", "entretiempo", "invierno"] as const;
export type GarmentSeason = (typeof SEASONS)[number];

export type NamedColor = { name: string; hex: string };

export type GarmentStatus = "processing" | "ready" | "failed";

export type Garment = {
  id: string;
  user_id: string;
  photo_path: string;
  name: string;
  category: GarmentCategory;
  subcategory: string;
  colors: NamedColor[];
  pattern: string;
  material: string;
  seasons: string[];
  occasions: string[];
  formality: number; // 1 deportivo · 5 gala
  brand: string;
  status: GarmentStatus;
  /** Lo que propuso la IA (R-20), para medir cuánto corrige la persona. Solo servidor. */
  ai_recognition?: Record<string, unknown> | null;
  user_edited: boolean;
  favorite: boolean;
  archived_at: string | null;
  created_at: string;
};

/** Prenda con URL firmada de corta duración para mostrarla. */
export type GarmentView = Garment & { photo_url: string | null };

export const COLOR_SEASONS = ["primavera", "verano", "otono", "invierno"] as const;
export type ColorSeason = (typeof COLOR_SEASONS)[number];

export const COLOR_SEASON_LABELS: Record<ColorSeason, string> = {
  primavera: "Primavera",
  verano: "Verano",
  otono: "Otoño",
  invierno: "Invierno",
};

export type Undertone = "calido" | "frio" | "neutro";
export type Contrast = "bajo" | "medio" | "alto";
export type Confidence = "baja" | "media" | "alta";

export type ColorAnalysis = {
  id: string;
  user_id: string;
  photo_path: string | null;
  season: ColorSeason;
  undertone: Undertone;
  contrast: Contrast;
  confidence: Confidence;
  lighting_ok: boolean;
  recommended: NamedColor[];
  neutrals: NamedColor[];
  avoid: NamedColor[];
  rationale: string;
  source: "ai" | "manual";
  is_active: boolean;
  created_at: string;
};

export type StyleProfile = {
  user_id: string;
  clothing_sections: string[];
  current_style: string[];
  aspirational_style: string[];
  occasions: string[];
  fit_preferences: string[];
  comfort_constraints: string[];
  colors_disliked: string[];
  brands_liked: string[];
  brands_excluded: string[];
  sizes: Record<string, string>;
  budget_monthly_clp: number | null;
  budget_per_item_clp: number | null;
  risk_level: number | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  city: string;
  onboarding_completed_at: string | null;
};

export type MemoryFactKind = "preference" | "dislike" | "context" | "fit";
export type MemoryFact = {
  id: string;
  fact: string;
  kind: MemoryFactKind;
  source: "onboarding" | "chat" | "feedback";
  created_at: string;
};

export type Weather = {
  date: string; // YYYY-MM-DD
  city: string;
  temp_min: number;
  temp_max: number;
  precipitation_probability: number | null;
  summary: string;
};

export type MissingPiece = {
  category: GarmentCategory;
  description: string;
  why: string;
};

export type OutfitStatus = "proposed" | "saved" | "discarded";
export type OutfitRating = "love" | "ok" | "no";

export type OutfitItemView = {
  garment_id: string;
  name: string;
  category: GarmentCategory;
  photo_url: string | null;
};

/** DTO de outfit: lo que viaja en el evento SSE `outfit` y lo que pinta la tarjeta de look. */
export type OutfitView = {
  id: string;
  title: string;
  occasion: string;
  rationale: string;
  status: OutfitStatus;
  weather: Weather | null;
  missing_piece: MissingPiece | null;
  rating: OutfitRating | null;
  created_at: string;
  items: OutfitItemView[];
};

export type ChatMessagePart =
  | { type: "outfit"; outfit_id: string }
  | { type: "image"; path: string }
  | { type: "garment"; garment_id: string }
  | { type: "palette"; analysis_id: string }
  | { type: "quick_replies"; options: string[]; multiple: boolean }
  /** Nota que el asesor anotó en este mensaje. Mensajes antiguos pueden no traerla (se ignora). */
  | { type: "memory"; memory_id: string; fact: string };

/** Nota de memoria anotada durante un mensaje; `id` sirve para `deleteMemoryFact(id)` ("Deshacer"). */
export type MemoryNote = { id: string; fact: string };

export type QuickReplies = { options: string[]; multiple: boolean };

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  text: string;
  outfits: OutfitView[];
  /** Prendas agregadas al clóset durante este mensaje (tarjetas dentro del hilo). */
  garments: GarmentView[];
  /** Paleta creada durante este mensaje. */
  palette: ColorAnalysis | null;
  /** Foto que envió la persona (URL firmada); null si no hay o ya no se conserva (selfie). */
  image_url: string | null;
  /** Respuestas de un toque: solo en el último mensaje del hilo, si es del asistente. */
  quick_replies: QuickReplies | null;
  /** Notas de memoria anotadas durante este mensaje, con `id` para ofrecer "Deshacer". */
  memory_notes: MemoryNote[];
  created_at: string;
};

/** Eventos SSE de POST /api/chat. */
export type ChatEvent =
  | { type: "conversation"; id: string }
  | { type: "text_delta"; text: string }
  | { type: "tool"; name: AgentToolName; status: "start" | "end" }
  | { type: "outfit"; outfit: OutfitView }
  | { type: "garment"; garment: GarmentView }
  | { type: "palette"; analysis: ColorAnalysis }
  | { type: "quick_replies"; options: string[]; multiple: boolean }
  | { type: "memory"; id: string; fact: string; kind: MemoryFactKind }
  | { type: "done"; message_id: string }
  | { type: "error"; message: string };

/**
 * Única fuente de los tipos de evento SSE. `Record<ChatEvent["type"], true>` obliga (en compilación) a listar
 * todos los tipos de `ChatEvent`; el parser (`lib/chat/sse.ts`) valida contra esta lista, así que no puede desincronizarse.
 */
const CHAT_EVENT_TYPE_MAP: Record<ChatEvent["type"], true> = {
  conversation: true,
  text_delta: true,
  tool: true,
  outfit: true,
  garment: true,
  palette: true,
  quick_replies: true,
  memory: true,
  done: true,
  error: true,
};
export const CHAT_EVENT_TYPES = Object.keys(CHAT_EVENT_TYPE_MAP) as ChatEvent["type"][];

export type AgentToolName =
  | "get_closet"
  | "get_weather"
  | "propose_outfit"
  | "remember"
  | "update_profile"
  | "add_garment"
  | "analyze_palette"
  | "suggest_replies";

/** Texto que ve la persona mientras el asesor usa una herramienta. */
export const TOOL_STATUS_LABELS: Record<AgentToolName, string> = {
  get_closet: "Revisando tu clóset…",
  get_weather: "Mirando el clima…",
  propose_outfit: "Armando el look…",
  remember: "Tomando nota…",
  update_profile: "Guardando tu perfil…",
  add_garment: "Agregando la prenda a tu clóset…",
  analyze_palette: "Analizando tus colores…",
  suggest_replies: "", // no muestra estado: el servidor ni siquiera emite `tool` para ella
};

// --- Opciones del onboarding (chips). El valor guardado es el propio texto en minúsculas. ---

export const STYLE_OPTIONS = [
  "clásico",
  "casual",
  "minimalista",
  "urbano",
  "deportivo",
  "romántico",
  "bohemio",
  "elegante",
  "creativo",
  "formal",
] as const;

export const OCCASION_OPTIONS = [
  "oficina",
  "teletrabajo",
  "día a día",
  "citas",
  "salidas con amigos",
  "eventos y matrimonios",
  "viajes",
  "deporte",
] as const;

export const FIT_OPTIONS = [
  "holgado",
  "regular",
  "entallado",
  "tiro alto",
  "tiro medio",
  "largo sobre el tobillo",
  "prendas cortas",
  "prendas largas",
] as const;

export const COMFORT_OPTIONS = [
  "sin tacos",
  "sin prendas ajustadas",
  "sin escotes",
  "sin lana",
  "sin mangas cortas",
  "telas que no se arruguen",
] as const;

export const SECTION_OPTIONS = ["mujer", "hombre", "unisex"] as const;

export const BUDGET_OPTIONS_CLP = [
  { label: "Hasta $50.000", value: 50000 },
  { label: "$50.000 a $150.000", value: 150000 },
  { label: "$150.000 a $300.000", value: 300000 },
  { label: "Más de $300.000", value: 500000 },
] as const;

export const QUICK_OCCASIONS = [
  { label: "¿Qué me pongo mañana?", prompt: "¿Qué me pongo mañana?" },
  { label: "Oficina", prompt: "Ármame un look para la oficina." },
  { label: "Una cita", prompt: "Tengo una cita, ¿qué me pongo?" },
  { label: "Fin de semana", prompt: "Quiero un look cómodo para el fin de semana." },
  { label: "¿Qué me falta?", prompt: "¿Qué me falta en mi clóset para que sea más versátil?" },
] as const;

/** Mínimo de prendas para intentar un outfit y meta del onboarding (DP-06). */
export const MIN_GARMENTS_FOR_OUTFIT = 3;
export const ONBOARDING_GARMENT_GOAL = 5;

// --- Agregados por B1 (base de servidor) ---

/** Resultado de toda Server Action. `error` es un mensaje en español listo para mostrar. */
export type ActionResult = { ok: true } | { ok: false; error: string };

export type OutfitFeedbackRating = OutfitRating;

/** Nombres de los eventos de producto (`analytics_events.name`, en inglés). */
export type AnalyticsEventName =
  | "signup_completed"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "color_analysis_completed"
  | "garment_added"
  | "garment_edited"
  | "garment_confirmed"
  | "chat_message_sent"
  | "outfit_proposed"
  | "outfit_saved"
  | "outfit_feedback"
  | "memory_added"
  | "ai_usage"
  | "onboarding_step_skipped"
  | "outfit_discarded"
  | "color_palette_corrected"
  | "data_deleted"
  | "pwa_installed";

export type PhotoKind = "garments" | "selfies" | "chat";

export type ConsentKind = "terms" | "photo_processing" | "face_photo";
/** Versión de los textos legales aceptados (R-03). */
export const CONSENT_VERSION = "2026-11-14";
