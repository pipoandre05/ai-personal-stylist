import type {
  ChatEvent,
  ChatMessageView,
  EventSummary,
  OutfitView,
  Refinement,
  SearchOffer,
  ShoppingOptionsBlock,
  ToolStep,
  Weather,
} from "@/lib/domain/types";
import type { GarmentLookup } from "@/components/chat/v2";

// Datos de ejemplo FIJOS con la forma exacta del contrato v2 (docs/superpowers/specs/2026-11-14-contrato-v2.md).
// El recorrido es el de la maqueta v4: matrimonio en Casablanca. Las "fotos" son los recortes de la maqueta
// (public/dev/prendas/*.svg): solo existen para esta vista previa.

/** Fecha de referencia de la vista previa: "visto hoy" no depende del día en que se abra. */
export const NOW = new Date("2026-11-14T15:00:00Z");
const SEEN = "2026-11-14T13:40:00Z"; // 10:40 en Santiago

const img = (name: string) => `/dev/prendas/${name}.svg`;

export const GARMENTS: GarmentLookup = {
  "g-blazer": { name: "Blazer de lino", photo_url: img("blazer"), category: "outerwear" },
  "g-blusa": { name: "Blusa de seda", photo_url: img("blusa"), category: "top" },
  "g-falda": { name: "Falda plisada", photo_url: img("falda"), category: "bottom" },
  "g-bolso": { name: "Cartera de mimbre", photo_url: img("bolso"), category: "bag" },
  "g-vestido": { name: "Vestido midi estampado", photo_url: img("vestido"), category: "dress" },
  "g-botines": { name: "Botines café", photo_url: img("botines"), category: "shoes" },
  "g-zapatillas": { name: "Zapatillas blancas", photo_url: img("zapatillas"), category: "shoes" },
  "g-pantalon": { name: "Pantalón azul marino", photo_url: img("pantalon"), category: "bottom" },
  "g-polera": { name: "Polera blanca", photo_url: img("polera"), category: "top" },
  // Sin foto: se ve el marcador sobrio con la silueta de su categoría.
  "g-camisa": { name: "Camisa rayada", photo_url: null, category: "top" },
};

const item = (id: keyof typeof GARMENTS & string) => ({
  garment_id: id,
  name: GARMENTS[id].name,
  category: GARMENTS[id].category!,
  photo_url: GARMENTS[id].photo_url,
});

export const WEATHER: Weather = {
  date: "2026-11-21",
  city: "Casablanca",
  temp_min: 11,
  temp_max: 27,
  precipitation_probability: 5,
  wind_kmh: 32,
  summary: "Despejado",
};

const PALETTE_SWATCHES = ["#A3AE93", "#D8C7A6", "#C08850"];

const refine = (outfitId: string): Refinement[] => [
  { id: "r-more_formal", label: "Más formal", intent: { kind: "refine_outfit", outfit_id: outfitId, change: "more_formal" } },
  { id: "r-other_color", label: "Otro color", intent: { kind: "refine_outfit", outfit_id: outfitId, change: "other_color" } },
  {
    id: "r-swap",
    label: "Cambiar la blusa",
    intent: { kind: "refine_outfit", outfit_id: outfitId, change: "swap_garment", garment_id: "g-blusa" },
  },
  {
    id: "r-drop",
    label: "Sin cartera",
    intent: { kind: "refine_outfit", outfit_id: outfitId, change: "drop_garment", garment_id: "g-bolso" },
  },
];

const base = { rating: null, created_at: "2026-11-14T13:38:00Z" } as const;

/** Look A del par: el seguro. */
export const OUTFIT_SEGURO: OutfitView = {
  ...base,
  id: "o-seguro",
  title: "Seda y salvia de día",
  occasion: "Matrimonio de día",
  rationale: "Salvia y crudo, de tu paleta: frescos de día y sin brillos de noche. Los botines aguantan el pasto de la viña.",
  status: "proposed",
  weather: WEATHER,
  missing_piece: null,
  items: [item("g-blusa"), item("g-falda"), item("g-bolso"), item("g-botines")],
  evidence: [
    { kind: "palette", label: "Tu paleta", swatches: PALETTE_SWATCHES },
    { kind: "weather", label: "27° y viento" },
    { kind: "closet", label: "4 de tu clóset" },
    { kind: "occasion", label: "Matrimonio de día" },
  ],
  refinements: refine("o-seguro"),
  variant: "seguro",
  pair_id: "p-1",
};

/** Look B del par: el atrevido. */
export const OUTFIT_ATREVIDO: OutfitView = {
  ...base,
  id: "o-atrevido",
  title: "Estampado con blazer",
  occasion: "Matrimonio de día",
  rationale: "El vestido estampado pone el color y el blazer de lino, el orden. Más presencia, mismo calce que ya te funciona.",
  status: "proposed",
  weather: WEATHER,
  missing_piece: null,
  items: [item("g-vestido"), item("g-blazer"), item("g-bolso"), item("g-botines")],
  evidence: [
    { kind: "palette", label: "Tu paleta", swatches: ["#C46E48", "#D8C7A6"] },
    { kind: "weather", label: "27° y viento" },
    { kind: "closet", label: "4 de tu clóset" },
  ],
  refinements: refine("o-atrevido").slice(0, 3),
  variant: "atrevido",
  pair_id: "p-1",
};

/** Look recién propuesto con la pieza que falta (momento 03 de la maqueta). */
export const OUTFIT_FALTA: OutfitView = {
  ...base,
  id: "o-falta",
  title: "Lino y salvia de día",
  occasion: "Matrimonio de día",
  rationale: "Salvia y crudo, de tu paleta: frescos de día. El blazer, para cuando entre el viento. Con lo formal que pide la invitación, te falta un zapato con taco ancho.",
  status: "proposed",
  weather: WEATHER,
  missing_piece: {
    category: "shoes",
    description: "Sandalia o zapato de taco ancho en tonos tierra",
    why: "Lo formal de día pide un zapato con algo de taco.",
  },
  items: [item("g-blazer"), item("g-blusa"), item("g-falda"), item("g-bolso")],
  evidence: [
    { kind: "palette", label: "Tu paleta", swatches: PALETTE_SWATCHES },
    { kind: "weather", label: "27° y viento" },
    { kind: "closet", label: "4 de tu clóset" },
  ],
  refinements: refine("o-falta"),
  variant: null,
  pair_id: null,
};

export const EVENT_INCOMPLETE: EventSummary = {
  kind: "Matrimonio",
  date: "2026-11-21",
  place: "Casablanca",
  place_note: "En una viña",
  setting: { time_of_day: "day", venue: "outdoor" },
  dress_code: null,
  weather: { min: 11, max: 27, note: "Despejado · con viento" },
  missing: ["dress_code"],
};

export const EVENT_COMPLETE: EventSummary = { ...EVENT_INCOMPLETE, dress_code: "formal de día", missing: [] };

/** Un evento recién entendido, con varios datos por completar. */
export const EVENT_SPARSE: EventSummary = {
  kind: null,
  date: null,
  place: "Santiago",
  place_note: null,
  setting: { time_of_day: null, venue: null },
  dress_code: null,
  weather: null,
  missing: ["time_of_day", "dress_code", "kind", "date"],
};

const closetItems = (chosen: string[]) =>
  Object.keys(GARMENTS).map((id) => ({ garment_id: id, chosen: chosen.includes(id) }));

export const STEP_EVENT: ToolStep = {
  id: "step-1",
  tool: "set_event_summary",
  status: "done",
  label_running: "Entendiendo tu evento",
  label_done: "Entendí tu evento",
  detail: "Matrimonio · sábado 21 nov · Casablanca",
};
export const STEP_WEATHER: ToolStep = {
  id: "step-2",
  tool: "get_weather",
  status: "done",
  label_running: "Mirando el clima",
  label_done: "Miré el clima en Casablanca",
  detail: "11° a 27°, despejado · viento desde las 17:00",
};
export const STEP_CLOSET_RUNNING: ToolStep = {
  id: "step-3",
  tool: "get_closet",
  status: "running",
  label_running: "Revisando tu clóset",
  label_done: "Revisé tu clóset",
};
export const STEP_CLOSET_DONE: ToolStep = {
  id: "step-3",
  tool: "get_closet",
  status: "done",
  label_running: "Revisando tu clóset",
  label_done: "Revisé tu clóset",
  detail: "10 prendas · 8 sirven para el día · elegí 6",
  items: closetItems(["g-blazer", "g-blusa", "g-falda", "g-bolso", "g-vestido", "g-botines"]),
};
export const STEP_OUTFIT: ToolStep = {
  id: "step-4",
  tool: "propose_outfit",
  status: "done",
  label_running: "Armando el look",
  label_done: "Armé dos looks",
  detail: "Uno seguro y uno más atrevido",
};
export const STEP_OUTFIT_RUNNING: ToolStep = { ...STEP_OUTFIT, status: "running", detail: undefined };
export const STEP_SEARCH_ERROR: ToolStep = {
  id: "step-5",
  tool: "search_products",
  status: "error",
  label_running: "Buscando opciones",
  label_done: "Busqué opciones",
  detail: "La búsqueda no está disponible por ahora",
};
export const STEP_SEARCH_DONE: ToolStep = {
  id: "step-5",
  tool: "search_products",
  status: "done",
  label_running: "Buscando en 3 tiendas",
  label_done: "Busqué en 3 tiendas",
  detail: "41 resultados · elegí 3",
};

export const WORK_STEPS: ToolStep[] = [STEP_EVENT, STEP_WEATHER, STEP_CLOSET_DONE, STEP_OUTFIT];

export const SEARCH_OFFER: SearchOffer = {
  id: "offer-1",
  outfit_id: "o-falta",
  slot: "shoes",
  description: "Sandalia o zapato de taco ancho en tonos tierra",
  actions: [
    { id: "offer-1-accept", label: "Sí, búscame opciones", intent: { kind: "accept_search", outfit_id: "o-falta", slot: "shoes" } },
    { id: "offer-1-decline", label: "Por ahora no", intent: { kind: "decline_search", outfit_id: "o-falta", slot: "shoes" } },
  ],
};

const SEARCH_REFINEMENTS: Refinement[] = [
  { id: "sr-1", label: "Más baratos", intent: { kind: "refine_search", block_id: "sb-1", change: "cheaper" } },
  { id: "sr-2", label: "Taco más bajo", intent: { kind: "refine_search", block_id: "sb-1", change: "lower_heel" } },
  { id: "sr-3", label: "No me interesan", intent: { kind: "refine_search", block_id: "sb-1", change: "dismiss" } },
];

export const SHOPPING_BLOCK: ShoppingOptionsBlock = {
  id: "sb-1",
  for_outfit_id: "o-falta",
  slot: "shoes",
  query: "Sandalia o zapato de taco ancho en tonos tierra",
  searched: { stores: 3, results: 41 },
  options: [
    {
      id: "opt-a1",
      store_name: "Tienda A",
      title: "Sandalia de cuero camel, taco cuadrado de 5 cm",
      price_clp: 54990,
      seen_at: SEEN,
      url: "https://tienda-a.example/sandalia-camel",
      image_cutout_url: img("sandalia"),
      image_url: null,
      affiliate: true,
      reason: "Repite el camel de tu cartera y el taco ancho no se entierra en el pasto.",
      in_stock: true,
    },
    {
      id: "opt-b1",
      store_name: "Tienda B",
      title: "Mule terracota, taco bloque",
      price_clp: 39990,
      seen_at: SEEN,
      url: "https://tienda-b.example/mule-terracota",
      image_cutout_url: img("mule"),
      image_url: null,
      affiliate: false,
      reason: "El terracota calza con el estampado de tu vestido y se ve fresco de día.",
      in_stock: true,
    },
    {
      id: "opt-c1",
      store_name: "Tienda C",
      title: "Alpargata de plataforma en yute",
      price_clp: 29990,
      seen_at: SEEN,
      url: "https://tienda-c.example/alpargata-yute",
      image_cutout_url: img("alpargata"),
      image_url: null,
      affiliate: false,
      reason: "La más liviana y la más barata; el yute combina con tu cartera de mimbre.",
      in_stock: true,
    },
  ],
  refinements: SEARCH_REFINEMENTS,
  trigger: "offer_accepted",
  budget_max_clp: null,
  selected_option_id: null,
};

/** Búsqueda que no encontró nada bueno: llega solo como estado vacío (el contrato no emite el bloque; la UI lo soporta). */
export const SHOPPING_EMPTY: ShoppingOptionsBlock = {
  ...SHOPPING_BLOCK,
  id: "sb-empty",
  searched: { stores: 4, results: 18 },
  options: [],
  budget_max_clp: 20000,
  refinements: [SEARCH_REFINEMENTS[0], { ...SEARCH_REFINEMENTS[1], id: "sr-e2", label: "Otro color" }],
  selected_option_id: null,
};

/** Una opción sin stock y otra con enlace que no es https (no se muestra el enlace). */
export const SHOPPING_EDGE: ShoppingOptionsBlock = {
  ...SHOPPING_BLOCK,
  id: "sb-edge",
  options: [
    { ...SHOPPING_BLOCK.options[0], id: "opt-e1", in_stock: false, affiliate: false },
    { ...SHOPPING_BLOCK.options[1], id: "opt-e2", url: "http://tienda-b.example/mule", store_name: "Tienda B" },
    { ...SHOPPING_BLOCK.options[2], id: "opt-e3", image_cutout_url: null, image_url: null, title: "Alpargata sin foto" },
  ],
  selected_option_id: "opt-e2",
};

const msg = (over: Partial<ChatMessageView> & Pick<ChatMessageView, "id" | "role" | "text">): ChatMessageView => ({
  outfits: [],
  garments: [],
  palette: null,
  image_url: null,
  quick_replies: null,
  memory_notes: [],
  created_at: "2026-11-14T13:36:00Z",
  ...over,
});

/** El hilo completo del recorrido, tal como lo entrega `getLatestConversation()` tras recargar. */
export const JOURNEY: ChatMessageView[] = [
  msg({
    id: "m1",
    role: "user",
    text: "Este sábado tengo un matrimonio en Casablanca, de día, en una viña. ¿Qué me pongo? Si no tengo nada, búscame opciones.",
  }),
  msg({
    id: "m2",
    role: "assistant",
    text: "Qué buen panorama. Esto es lo que entendí; toca cualquier dato si me equivoqué. Me falta una cosa para acertar: ¿qué dice la invitación sobre la vestimenta?",
    event_summary: EVENT_INCOMPLETE,
    tool_steps: [STEP_EVENT],
    quick_replies: { options: ["Dice «formal de día»", "No dice nada", "Te mando la invitación"], multiple: false },
  }),
  msg({ id: "m3", role: "user", text: "Dice «formal de día»" }),
  msg({
    id: "m4",
    role: "assistant",
    text: "Perfecto. Formal de día en una viña es elegante pero fresco: nada de brillos de noche. Te armé dos para que elijas.",
    event_summary: EVENT_COMPLETE,
    tool_steps: WORK_STEPS,
    outfits: [OUTFIT_SEGURO, OUTFIT_ATREVIDO],
  }),
  msg({ id: "m5", role: "user", text: "Más formal" }),
  msg({
    id: "m6",
    role: "assistant",
    text: "Con lo formal que pide la invitación, te falta una sola pieza: un zapato con taco ancho. Lo demás ya lo tienes.",
    tool_steps: [
      { ...STEP_CLOSET_DONE, id: "step-6", detail: "10 prendas · 8 sirven para el día · elegí 4", items: closetItems(["g-blazer", "g-blusa", "g-falda", "g-bolso"]) },
      { ...STEP_OUTFIT, id: "step-7", label_done: "Armé el look", detail: "Te falta una sola pieza" },
    ],
    outfits: [OUTFIT_FALTA],
    search_offer: SEARCH_OFFER,
  }),
  msg({ id: "m7", role: "user", text: "Sí, búscame opciones" }),
  msg({
    id: "m8",
    role: "assistant",
    text: "Encontré tres que calzan con el look y con tu cartera. Elige la que más te guste; yo no compro nada, la abres en la tienda.",
    tool_steps: [STEP_SEARCH_DONE],
    shopping_blocks: [SHOPPING_BLOCK],
  }),
];

/** Los eventos SSE de un turno, en el orden en que los emite el asesor simulado (camino 1b). */
export const LIVE_EVENTS: ChatEvent[] = [
  { type: "tool_step", ...{ ...STEP_EVENT, status: "running" as const, detail: undefined } },
  { type: "tool_step", ...STEP_EVENT },
  { type: "event_summary", ...EVENT_COMPLETE },
  { type: "tool_step", ...{ ...STEP_WEATHER, status: "running" as const, detail: undefined } },
  { type: "tool_step", ...STEP_WEATHER },
  { type: "tool_step", ...STEP_CLOSET_RUNNING },
  { type: "tool_step", ...STEP_CLOSET_DONE, detail: "10 prendas · 8 sirven para el día", items: closetItems([]) },
  { type: "tool_step", ...STEP_OUTFIT_RUNNING },
  { type: "outfit", outfit: OUTFIT_SEGURO },
  { type: "tool_step", ...STEP_CLOSET_DONE },
  { type: "outfit", outfit: OUTFIT_ATREVIDO },
  { type: "tool_step", ...STEP_OUTFIT },
];
