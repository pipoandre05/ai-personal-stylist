import type {
  ChatMessageView,
  ColorAnalysis,
  EventSummary,
  GarmentView,
  OutfitView,
  SearchOffer,
  ShoppingOptionsBlock,
  ToolStep,
} from "@/lib/domain/types";

export type PersonItem = {
  kind: "person";
  /** Clave estable de React (no cambia cuando llega el id del servidor). */
  key: string;
  at: string;
  /** true si nació en esta sesión (anima su entrada); el historial no anima. */
  fresh: boolean;
  text: string;
  imageUrl: string | null;
  /** Foto que ya no se conserva (selfie): se muestra el marcador. */
  photoDeleted: boolean;
  status: "uploading" | "sending" | "sent" | "failed";
  error: string | null;
};

export type AdvisorItem = {
  kind: "advisor";
  key: string;
  /** Id del mensaje en el servidor (llega con `done`); sirve para reconciliar con el historial. */
  id: string | null;
  at: string;
  fresh: boolean;
  text: string;
  outfits: OutfitView[];
  garments: GarmentView[];
  palette: ColorAnalysis | null;
  memories: string[];
  streaming: boolean;
  error: string | null;
  /** Contrato v2. Ausentes en mensajes anteriores: el turno se pinta con las tarjetas de antes. */
  tool_steps?: ToolStep[];
  event_summary?: EventSummary | null;
  shopping_blocks?: ShoppingOptionsBlock[];
  search_offer?: SearchOffer | null;
};

/** ¿El turno trae datos del contrato v2? Si no, se pinta con las tarjetas anteriores (compatibilidad). */
export function isV2Turn(item: Pick<AdvisorItem, "outfits" | "tool_steps" | "event_summary" | "shopping_blocks" | "search_offer">): boolean {
  return Boolean(
    item.tool_steps?.length ||
      item.event_summary ||
      item.shopping_blocks?.length ||
      item.search_offer ||
      item.outfits.some((o) => o.evidence || o.refinements || o.variant || o.pair_id),
  );
}

export type ThreadItem = PersonItem | AdvisorItem;

export function toItems(messages: ChatMessageView[]): ThreadItem[] {
  return messages.map((m): ThreadItem => {
    if (m.role === "user") {
      return {
        kind: "person",
        key: `h-${m.id}`,
        at: m.created_at,
        fresh: false,
        text: m.text,
        imageUrl: m.image_url,
        // Un mensaje de la persona sin texto ni foto visible fue una foto que no se conserva (selfie).
        photoDeleted: !m.text.trim() && !m.image_url,
        status: "sent",
        error: null,
      };
    }
    return {
      kind: "advisor",
      key: `h-${m.id}`,
      id: m.id,
      at: m.created_at,
      fresh: false,
      text: m.text,
      outfits: m.outfits,
      garments: m.garments,
      palette: m.palette,
      memories: [],
      streaming: false,
      error: null,
      tool_steps: m.tool_steps ?? [],
      event_summary: m.event_summary ?? null,
      shopping_blocks: m.shopping_blocks ?? [],
      search_offer: m.search_offer ?? null,
    };
  });
}
